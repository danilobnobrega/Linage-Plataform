import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import Anthropic from '@anthropic-ai/sdk';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { initDb, syncUser, getUser, updateUserCredits, updateUserPlan, addAvulsoCredits, getPosts, savePost, deletePost, updateUserSettings, startTrial, sql } from './db.js';
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
const PLAN_CREDITS = { starter: 4500, pro: 9000 };

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
    console.error('[initDb] falhou:', err.message);
    res.status(500).json({ error: 'Database initialization failed', detail: err.message });
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
    let email = '';
    try {
      const clerkUser = await clerk.users.getUser(req.userId);
      email = clerkUser.emailAddresses[0]?.emailAddress || '';
    } catch (err) {
      console.error('[auth/sync] clerk.users.getUser falhou:', err.message);
    }
    const user = await syncUser({ id: req.userId, email });
    res.json(user);
  } catch (err) {
    console.error('[auth/sync] erro:', err.message);
    res.status(500).json({ error: err.message });
  }
});


app.post('/api/auth/start-trial', requireAuth, async (req, res) => {
  try {
    const user = await startTrial(req.userId);
    if (!user) return res.status(400).json({ error: 'Trial não disponível.' });
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
    const { id, title, content, agentId, status, chatHistory } = req.body;
    const post = await savePost({ id, userId: req.userId, title, content, agentId, status, chatHistory });
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

// Step 1: create SetupIntent to collect card details
app.post('/api/stripe/create-setup-intent', requireAuth, async (req, res) => {
  try {
    const { plan, billing = 'monthly' } = req.body;
    const priceIds = {
      starter: { monthly: process.env.STRIPE_PRICE_ID_STARTER_MONTHLY, annual: process.env.STRIPE_PRICE_ID_STARTER_ANNUAL },
      pro:     { monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY,     annual: process.env.STRIPE_PRICE_ID_PRO_ANNUAL },
    };
    if (!priceIds[plan]?.[billing]) return res.status(400).json({ error: 'Plano inválido' });

    let user = await getUser(req.userId);
    let customerId = user?.stripe_customer_id;

    if (!customerId) {
      const clerkUser = await clerk.users.getUser(req.userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress || '';
      const customer = await stripe.customers.create({ email, metadata: { userId: req.userId } });
      customerId = customer.id;
      await sql`UPDATE users SET stripe_customer_id = ${customerId} WHERE id = ${req.userId}`;
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: { userId: req.userId, plan, billing },
    });

    res.json({
      clientSecret: setupIntent.client_secret,
      publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY,
    });
  } catch (err) {
    console.error('[stripe/create-setup-intent]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Step 2: create subscription after card is saved
app.post('/api/stripe/activate-subscription', requireAuth, async (req, res) => {
  try {
    const { plan, billing = 'monthly', paymentMethodId } = req.body;
    const priceIds = {
      starter: { monthly: process.env.STRIPE_PRICE_ID_STARTER_MONTHLY, annual: process.env.STRIPE_PRICE_ID_STARTER_ANNUAL },
      pro:     { monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY,     annual: process.env.STRIPE_PRICE_ID_PRO_ANNUAL },
    };
    const priceId = priceIds[plan]?.[billing];
    if (!priceId || !paymentMethodId) return res.status(400).json({ error: 'Dados inválidos' });

    const user = await getUser(req.userId);
    const customerId = user?.stripe_customer_id;
    if (!customerId) return res.status(400).json({ error: 'Cliente não encontrado' });

    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
      payment_settings: { save_default_payment_method: 'on_subscription' },
      metadata: { userId: req.userId },
      expand: ['latest_invoice.payment_intent'],
    });

    if (subscription.status === 'active') {
      const isProPlan = priceId === process.env.STRIPE_PRICE_ID_PRO_MONTHLY || priceId === process.env.STRIPE_PRICE_ID_PRO_ANNUAL;
      await updateUserPlan(req.userId, isProPlan ? 'pro' : 'starter', customerId, subscription.id);
      return res.json({ success: true });
    }

    const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
    if (clientSecret) return res.json({ requiresAction: true, clientSecret });

    res.status(500).json({ error: 'Não foi possível processar o pagamento.' });
  } catch (err) {
    console.error('[stripe/activate-subscription]', err.message);
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
        await addAvulsoCredits(userId, creditsToAdd);
      }
    }
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    if (invoice.billing_reason === 'subscription_create' && invoice.subscription) {
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      const userId = subscription.metadata?.userId;
      if (userId) {
        const priceId = subscription.items.data[0].price.id;
        const isProPlan = priceId === process.env.STRIPE_PRICE_ID_PRO_MONTHLY || priceId === process.env.STRIPE_PRICE_ID_PRO_ANNUAL;
        const plan = isProPlan ? 'pro' : 'starter';
        await updateUserPlan(userId, plan, invoice.customer, invoice.subscription);
      }
    }
    if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
      const users = await sql`SELECT id, plan, avulso_credits FROM users WHERE stripe_subscription_id = ${invoice.subscription}`;
      if (users[0]) {
        const planCredits = PLAN_CREDITS[users[0].plan] ?? 0;
        const avulso = users[0].avulso_credits ?? 0;
        await updateUserCredits(users[0].id, planCredits + avulso);
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const users = await sql`SELECT id, avulso_credits FROM users WHERE stripe_subscription_id = ${sub.id}`;
    if (users[0]) {
      await sql`
        UPDATE users SET
          plan = 'trial',
          credits = ${users[0].avulso_credits ?? 0},
          stripe_subscription_id = NULL,
          credits_reset_at = NOW()
        WHERE id = ${users[0].id}
      `;
    }
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

    // Fetch real-time news for the latest user message
    let newsSection = '';
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    if (lastUserMsg && TAVILY_KEY) {
      try {
        const tavilyRes = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: TAVILY_KEY,
            query: `${lastUserMsg} mercado financeiro`,
            search_depth: 'advanced',
            topic: 'news',
            days: 7,
            max_results: 20,
            include_answer: true,
          }),
        });
        const data = await tavilyRes.json();
        const answer = data.answer ? `Síntese: ${data.answer}\n\n` : '';
        const headlines = data.results
          ?.map(r => `• ${r.title}: ${r.content?.slice(0, 1000)}`)
          .join('\n') || '';
        if (answer || headlines) {
          newsSection = `\n\nNOTÍCIAS RECENTES (use quando agregar ângulo real à conversa):\n${answer}${headlines}`;
        }
      } catch {}
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: buildSystem(LINAGE_SYSTEM_PROMPT + LINAGE_CHAT_GUARD + newsSection, user?.instructions),
      messages,
    });
    const raw = response.content[0].text;
    const suggestPost = raw.includes('[SUGERIR_POST]');
    const text = raw.replace('[SUGERIR_POST]', '').trim();
    res.json({ text, suggestPost });
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
      max_tokens: 2048,
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
        search_depth: 'advanced',
        topic: 'news',
        days: 7,
        max_results: 20,
        include_answer: true,
      }),
    });
    const data = await tavilyRes.json();
    const answer = data.answer ? `Síntese: ${data.answer}\n\n` : '';
    const headlines = data.results
      ?.map(r => `• ${r.title}: ${r.content?.slice(0, 1000)}`)
      .join('\n') || '';
    res.json({ headlines: `${answer}${headlines}` });
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
const LINAGE_DAILY_QUOTE_PROMPT = `Você é o Linage. Um redator especializado em usar humor como ferramenta estratégica no LinkedIn do mercado financeiro brasileiro.

HUMOR COMO CONSEQUÊNCIA DA HONESTIDADE:
Humor genial não é construído. É revelado. Acontece quando alguém descreve a realidade com tanta precisão que o leitor ri — não porque foi engraçado, mas porque foi verdade demais pra não rir. O forçado busca o riso. O real busca a verdade e o riso vem junto.

O FUNDAMENTO:
Humor em contexto profissional não é entretenimento. É diagnóstico. O leitor não ri porque achou engraçado. Ri porque se reconheceu. E reconhecimento é a forma mais poderosa de conexão que existe em texto.

TÉCNICAS DE HUMOR:

1. A Imagem que Nomeia o que Todo Mundo Sente
Você não inventa uma piada. Você encontra a imagem certa pra algo que todo mundo vive mas ninguém nomeou. Quanto mais específica a imagem, mais universal o reconhecimento.
Exemplos: "A maioria dos relatórios de research tem a mesma energia de manual de instruções de micro-ondas: tecnicamente correto, completamente ignorável." / "Carteira com 40 ativos é como buffet de hotel: tem de tudo, você não lembra o que comeu, e no final sente que não aproveitou nada direito."

2. A Analogia que Desmonta
Pegar algo que sempre foi explicado de forma técnica e mostrar de um jeito que faz o leitor sentir o conceito em vez de apenas entender. A analogia certa transforma algo que o leitor passaria reto em algo que ele quer contar pra alguém.
Exemplos: "Fundo multimercado cobrando 2 com 20 pra entregar CDI é o equivalente financeiro de pagar personal trainer pra ele te mandar vídeo do YouTube." / "Trocar de estratégia a cada trimestre é como trocar de dieta toda segunda. Nenhuma funciona — não porque são ruins, mas porque você não ficou tempo suficiente em nenhuma."

PRINCÍPIOS INEGOCIÁVEIS:
1. Humor é consequência, não objetivo. Se está tentando ser engraçado, já perdeu.
2. A imagem faz o trabalho. Não explique. Não prepare o leitor.
3. Nunca faça o leitor de bobo. Humor é convite, não exclusão.
4. O riso abre a porta. Atrás da porta tem uma verdade.
5. Se parece performance, corta. Se parece forçação, corta.

TAREFA:
Gere uma frase sobre posicionamento profissional no mercado financeiro que faça o profissional sorrir ao abrir a plataforma. Máximo 40 palavras. Use a técnica que servir melhor — a escolha é sua. Sem título, sem explicação, sem introdução. Só a frase.`;

const LINAGE_DAILY_SUGGESTIONS_PROMPT = `A partir das notícias do mercado financeiro fornecidas, identifique 3 temas atuais e relevantes para profissionais do mercado financeiro brasileiro postarem no LinkedIn.

Apresente cada tema de forma direta e factual — sem ângulo, sem perspectiva, sem elaboração. Apenas o que está acontecendo agora, em até 15 palavras por sugestão.

Formato exato, sem mais nada:
PAUTA_1: [tema]
PAUTA_2: [tema]
PAUTA_3: [tema]`;

app.get('/api/daily-content', requireAuth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const cached = await sql`SELECT content FROM daily_content WHERE date = ${today}`;
    if (cached[0]) return res.json(JSON.parse(cached[0].content));

    let newsContext = '';
    try {
      const tavilyRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: TAVILY_KEY,
          query: 'mercado financeiro investimentos Brasil',
          search_depth: 'advanced',
          topic: 'news',
          days: 7,
          max_results: 20,
          include_answer: true,
        }),
      });
      const tavilyData = await tavilyRes.json();
      const answer = tavilyData.answer ? `Síntese: ${tavilyData.answer}\n\n` : '';
      const headlines = tavilyData.results?.map(r => `• ${r.title}: ${r.content?.slice(0, 1000)}`).join('\n') || '';
      newsContext = `${answer}${headlines}`;
    } catch {}

    const [quoteRes, suggestionsRes] = await Promise.all([
      anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 150,
        system: LINAGE_DAILY_QUOTE_PROMPT,
        messages: [{ role: 'user', content: 'Gere a frase do dia.' }],
      }),
      anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        system: LINAGE_DAILY_SUGGESTIONS_PROMPT,
        messages: [{ role: 'user', content: `Notícias do mercado financeiro de hoje:\n${newsContext || '(sem notícias disponíveis)'}` }],
      }),
    ]);

    const quote = quoteRes.content[0].text.trim();
    const sugText = suggestionsRes.content[0].text;
    const get = (label) => sugText.match(new RegExp(`${label}:\\s*(.+)`))?.[1]?.trim() || '';
    const suggestions = [get('PAUTA_1'), get('PAUTA_2'), get('PAUTA_3')];

    if (!quote || suggestions.some(s => !s)) {
      console.error('[daily-content] formato inesperado:', { quote, suggestions });
      return res.status(500).json({ error: 'Unexpected response format' });
    }

    const data = { quote, suggestions };
    await sql`INSERT INTO daily_content (date, content) VALUES (${today}, ${JSON.stringify(data)}) ON CONFLICT (date) DO NOTHING`;

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
