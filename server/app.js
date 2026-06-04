import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import Anthropic from '@anthropic-ai/sdk';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { initDb, syncUser, getUser, updateUserCredits, updateUserPlan, getPosts, savePost, deletePost, updateUserSettings, sql } from './db.js';
import { LINAGE_SYSTEM_PROMPT, LINAGE_CHAT_GUARD, linagePostReviewPrompt } from './prompts.js';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const anthropic = new Anthropic({ apiKey: process.env.VITE_ANTHROPIC_API_KEY });
const TAVILY_KEY = process.env.VITE_TAVILY_API_KEY;

const APP_URL = process.env.APP_URL || 'http://localhost:5174';

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
const PLAN_CREDITS = { free: 1350, starter: 4500, pro: 9000 };

// Initialize DB once at module load (works for both local and serverless)
const dbReady = initDb();

// Stripe webhook needs raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(cors({ origin: APP_URL }));

// Ensure DB is ready before any request
app.use(async (req, res, next) => {
  try {
    await dbReady;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database initialization failed' });
  }
});

// Auth middleware
async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    req.userId = payload.sub;
    next();
  } catch (err) {
    console.error('[auth] verifyToken falhou:', err.message);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// --- Auth ---
app.post('/api/auth/sync', requireAuth, async (req, res) => {
  try {
    const clerkUser = await clerk.users.getUser(req.userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';
    const user = await syncUser({ id: req.userId, email });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- Posts ---
app.get('/api/posts', requireAuth, async (req, res) => {
  try {
    const posts = await getPosts(req.userId);
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts', requireAuth, async (req, res) => {
  try {
    const { id, title, content, agentId, status } = req.body;
    const post = await savePost({ id, userId: req.userId, title, content, agentId, status });
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/posts/:id', requireAuth, async (req, res) => {
  try {
    await deletePost(req.params.id, req.userId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Help ---
app.post('/api/help/contact', requireAuth, async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Assunto e mensagem são obrigatórios.' });
    }
    const clerkUser = await clerk.users.getUser(req.userId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress || 'Não informado';
    const userName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Usuário';

    await mailer.sendMail({
      from: `"Linage Suporte" <${process.env.SMTP_USER}>`,
      to: 'suporte@linage.app',
      replyTo: userEmail,
      subject: `[Suporte Linage] ${subject}`,
      html: `
        <p><strong>Usuário:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${userEmail}</p>
        <hr/>
        <p>${message.replace(/\n/g, '<br/>')}</p>
      `,
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Stripe ---
app.post('/api/stripe/checkout', requireAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    const { billing = 'monthly' } = req.body;
    const priceIds = {
      starter: { monthly: process.env.STRIPE_PRICE_ID_STARTER_MONTHLY, annual: process.env.STRIPE_PRICE_ID_STARTER_ANNUAL },
      pro:     { monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY,     annual: process.env.STRIPE_PRICE_ID_PRO_ANNUAL },
    };
    const priceId = priceIds[plan]?.[billing];

    const user = await getUser(req.userId);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: user?.stripe_customer_id || undefined,
      client_reference_id: req.userId,
      success_url: `${APP_URL}/home?upgrade=success`,
      cancel_url: `${APP_URL}/home`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stripe/portal', requireAuth, async (req, res) => {
  try {
    const user = await getUser(req.userId);
    if (!user?.stripe_customer_id) return res.status(400).json({ error: 'No subscription found' });
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${APP_URL}/home`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stripe/subscription', requireAuth, async (req, res) => {
  try {
    const user = await getUser(req.userId);
    if (!user?.stripe_subscription_id) return res.json(null);
    const sub = await stripe.subscriptions.retrieve(user.stripe_subscription_id);
    res.json({
      currentPeriodEnd: new Date(sub.current_period_end * 1000).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
      interval: sub.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stripe/invoices', requireAuth, async (req, res) => {
  try {
    const user = await getUser(req.userId);
    if (!user?.stripe_customer_id) return res.json([]);
    const invoices = await stripe.invoices.list({ customer: user.stripe_customer_id, limit: 24 });
    const formatted = invoices.data.map((inv) => ({
      id: inv.id,
      date: new Date(inv.created * 1000).toLocaleDateString('pt-BR'),
      amount: (inv.amount_paid / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      status: inv.status,
      pdf: inv.invoice_pdf,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stripe/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return res.status(400).send('Webhook signature invalid');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    if (session.mode === 'subscription') {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      const priceId = subscription.items.data[0].price.id;
      const isProPlan = priceId === process.env.STRIPE_PRICE_ID_PRO_MONTHLY || priceId === process.env.STRIPE_PRICE_ID_PRO_ANNUAL;
      const plan = isProPlan ? 'pro' : 'starter';
      await updateUserPlan(userId, plan, session.customer, session.subscription);
    } else if (session.mode === 'payment') {
      const creditsToAdd = parseInt(session.metadata?.credits || '0');
      if (creditsToAdd > 0) {
        const user = await getUser(userId);
        if (user) await updateUserCredits(userId, user.credits + creditsToAdd);
      }
    }
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
      const users = await sql`SELECT id, plan FROM users WHERE stripe_subscription_id = ${invoice.subscription}`;
      if (users[0]) {
        await updateUserCredits(users[0].id, PLAN_CREDITS[users[0].plan] ?? 2000);
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const users = await sql`SELECT id FROM users WHERE stripe_subscription_id = ${sub.id}`;
    if (users[0]) await updateUserPlan(users[0].id, 'free', sub.customer, null);
  }

  res.json({ received: true });
});

function buildSystem(base, instructions) {
  const extra = instructions?.trim();
  return extra ? `${base}\n\nInstruções específicas do usuário (seguir sempre):\n${extra}` : base;
}

// --- Consensus flip ---
app.post('/api/agent/flip', requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Texto obrigatório' });
    const user = await getUser(req.userId);
    const system = buildSystem(`Você é o Linage. Recebe uma afirmação de senso comum do mercado financeiro e a transforma em uma tese contrária de alto impacto — provocadora, fundamentada e com o estilo Linage: espirituosa sem ser leviana, sólida sem ser chata.

Regras absolutas:
- Retorne apenas a tese contrária. Sem preâmbulo, sem título, sem explicação.
- Máximo 3 parágrafos curtos.
- Nunca use "ruído", "incomodar", "Existe um(a) [x] real", "A maioria não...".
- Não inicie frases com "Artigo + substantivo + verbo + dois-pontos".
- O humor é ferramenta, não enfeite. Se não agregar, corta.`, user?.instructions);
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system,
      messages: [{ role: 'user', content: `Senso comum para flipar:\n"${text}"` }],
    });
    res.json({ text: response.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Agent chat ---
app.post('/api/agent/chat', requireAuth, async (req, res) => {
  try {
    const { messages } = req.body;
    const user = await getUser(req.userId);
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: buildSystem(LINAGE_SYSTEM_PROMPT + LINAGE_CHAT_GUARD, user?.instructions),
      messages,
    });
    res.json({ text: response.content[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Post review (post-generation refinement chat) ---
app.post('/api/agent/post-review', requireAuth, async (req, res) => {
  try {
    const { messages, postContent } = req.body;
    if (!messages?.length || !postContent) return res.status(400).json({ error: 'messages e postContent são obrigatórios' });
    const user = await getUser(req.userId);
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: buildSystem(linagePostReviewPrompt(postContent), user?.instructions),
      messages,
    });
    const text = response.content[0].text;
    const revisedMatch = text.match(/\[POST_REVISADO_INICIO\]([\s\S]*?)\[POST_REVISADO_FIM\]/);
    const revisedPost = revisedMatch ? revisedMatch[1].trim() : null;
    const cleanText = text.replace(/\[POST_REVISADO_INICIO\][\s\S]*?\[POST_REVISADO_FIM\]/g, '').trim();
    res.json({ text: cleanText, revisedPost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/agent/generate-post', requireAuth, async (req, res) => {
  try {
    const { conversationContext, newsContext } = req.body;
    const user = await getUser(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.credits < 450) return res.status(402).json({ error: 'Insufficient credits' });
    const base = `${LINAGE_SYSTEM_PROMPT}\n\nEscreva um post completo para LinkedIn em português, com base na conversa e nas notícias recentes sobre o tema. O post deve soar como Linage — com sua voz, seu ritmo, seu estilo. Nada genérico.\n\nRetorne exatamente neste formato:\nTÍTULO: [título do post]\nCONTEÚDO:\n[corpo completo do post]`;
    const userContent = `Conversa:\n${conversationContext}${newsContext ? `\n\nNotícias recentes sobre o tema:\n${newsContext}` : ''}\n\nEscreva o post agora.`;
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: buildSystem(base, user?.instructions),
      messages: [{ role: 'user', content: userContent }],
    });
    const newCredits = user.credits - 450;
    await updateUserCredits(req.userId, newCredits);
    res.json({ text: response.content[0].text, credits: newCredits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- User deletion ---
app.delete('/api/user', requireAuth, async (req, res) => {
  try {
    await sql`DELETE FROM users WHERE id = ${req.userId}`;
    await clerk.users.deleteUser(req.userId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- User settings ---
app.patch('/api/user/settings', requireAuth, async (req, res) => {
  try {
    const { nickname = '', instructions = '' } = req.body;
    await updateUserSettings(req.userId, { nickname, instructions });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- News proxy ---
app.get('/api/news', requireAuth, async (req, res) => {
  try {
    const { topic } = req.query;
    if (!topic) return res.json({ headlines: '' });
    const tavilyRes = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: `${topic} mercado financeiro`,
        search_depth: 'basic',
        max_results: 5,
        include_answer: false,
      }),
    });
    const data = await tavilyRes.json();
    const headlines = data.results
      ?.map(r => `• ${r.title}: ${r.content?.slice(0, 250)}`)
      .join('\n') || '';
    res.json({ headlines });
  } catch {
    res.json({ headlines: '' });
  }
});

// --- Stripe credit packs (one-time payment) ---
app.post('/api/stripe/credits-checkout', requireAuth, async (req, res) => {
  try {
    const { amount, unitAmount } = req.body;
    if (!amount || !unitAmount) return res.status(400).json({ error: 'Invalid pack' });
    const user = await getUser(req.userId);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'brl',
          unit_amount: unitAmount,
          product_data: { name: `${amount} Créditos Linage` },
        },
        quantity: 1,
      }],
      customer: user?.stripe_customer_id || undefined,
      client_reference_id: req.userId,
      metadata: { credits: String(amount) },
      success_url: `${APP_URL}/home?credits=success`,
      cancel_url: `${APP_URL}/credits`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Daily Content ---
const LINAGE_DAILY_PROMPT = `Você é o Linage — um redator estratégico para o mercado financeiro que pensa em voz alta sobre o que merece virar post.

Seu papel aqui não é gerar posts. É encontrar o ângulo nas notícias do dia e apresentar como uma faísca: o suficiente para o usuário pensar "é isso, quero esse."

Filtro: a pergunta que você faz para cada notícia é "isso tem potencial pra virar algo que a pessoa vai querer contar pra alguém?" Se não, descarta.

Você procura:
- A contradição escondida — quando o mercado faz uma coisa e diz outra
- A história por trás do dado — o número tem uma história humana dentro
- O universal no específico — um evento particular que revela algo sobre comportamento humano com dinheiro
- O absurdo normalizado — o que todo mundo faz sem questionar, mas que não faz sentido

Regras absolutas:
- Nunca fala mal de ninguém
- Nunca sugere algo só porque é polêmico
- Nunca sugere o óbvio sem transformar
- Nunca é didático — mostra, não explica
- Humor como ferramenta, não como muleta

Sua autoridade é tão sólida que você pode brincar sem que ninguém questione sua competência. Você escreve como quem conversa num jantar com gente inteligente: tem graça, tem ritmo, tem conteúdo. Você é genuinamente descontraído, não performaticamente.

O QUE VOCÊ NUNCA FAZ:
- Usar o termo "ruído" ou o verbo "incomodar"
- Usar a construção "Existe um(a) [substantivo] real"
- Usar a estrutura "A maioria não..."
- Iniciar frases com o padrão "Artigo + substantivo + verbo + dois-pontos"`;

app.get('/api/daily-content', requireAuth, async (req, res) => {
  try {
    let headlines = '';
    try {
      const tavilyRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: TAVILY_KEY,
          query: 'mercado financeiro investimentos Brasil',
          search_depth: 'basic',
          max_results: 5,
          include_answer: false,
        }),
      });
      const tavilyData = await tavilyRes.json();
      headlines = tavilyData.results?.map(r => r.title).join('\n') || '';
    } catch {}

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: LINAGE_DAILY_PROMPT,
      messages: [{
        role: 'user',
        content: `Notícias do mercado financeiro de hoje:\n${headlines || '(sem notícias disponíveis)'}\n\nGere 3 sugestões de pauta com energias diferentes:\n- PAUTA_1: Uma que incomoda de leve — levanta algo que o leitor vai precisar pensar. Não ataca, mas não deixa confortável.\n- PAUTA_2: Uma que diverte com substância — leve, espirituosa, mas com insight real dentro.\n- PAUTA_3: Uma que aprofunda — mais densa, conceitual, para quem quer pensar.\n\nCada sugestão: gancho (o que aconteceu) + ângulo (onde você iria). Máx 30 palavras. Com sua voz. Sem briefing, sem explicação — faísca.\n\nTambém gere uma PERSPECTIVA: como você vê o posicionamento profissional hoje. Máx 25 palavras. Com sua voz.\n\nFormato exato, sem mais nada:\nPERSPECTIVA: [texto]\nPAUTA_1: [texto]\nPAUTA_2: [texto]\nPAUTA_3: [texto]`,
      }],
    });

    const text = response.content[0].text;
    console.log('[daily-content] resposta da IA:', text.substring(0, 300));
    const get = (label) => text.match(new RegExp(`${label}:\\s*(.+)`))?.[1]?.trim() || '';

    const quote = get('PERSPECTIVA');
    const suggestions = [get('PAUTA_1'), get('PAUTA_2'), get('PAUTA_3')];

    if (!quote) {
      console.error('[daily-content] formato inesperado, texto completo:', text);
      return res.status(500).json({ error: 'Unexpected response format' });
    }

    res.json({ quote, suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
