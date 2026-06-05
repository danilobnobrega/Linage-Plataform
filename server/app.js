import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import Anthropic from '@anthropic-ai/sdk';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { initDb, syncUser, getUser, updateUserCredits, updateUserPlan, addAvulsoCredits, getPosts, savePost, deletePost, updateUserSettings, sql } from './db.js';
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

app.post('/api/stripe/create-subscription-intent', requireAuth, async (req, res) => {
  try {
    const { plan, billing = 'monthly' } = req.body;
    const priceIds = {
      starter: { monthly: process.env.STRIPE_PRICE_ID_STARTER_MONTHLY, annual: process.env.STRIPE_PRICE_ID_STARTER_ANNUAL },
      pro:     { monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY,     annual: process.env.STRIPE_PRICE_ID_PRO_ANNUAL },
    };
    const priceId = priceIds[plan]?.[billing];
    if (!priceId) return res.status(400).json({ error: 'Plano inválido' });

    let user = await getUser(req.userId);
    let customerId = user?.stripe_customer_id;

    if (!customerId) {
      const clerkUser = await clerk.users.getUser(req.userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress || '';
      const customer = await stripe.customers.create({ email, metadata: { userId: req.userId } });
      customerId = customer.id;
      await sql`UPDATE users SET stripe_customer_id = ${customerId} WHERE id = ${req.userId}`;
    }

    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      collection_method: 'charge_automatically',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      metadata: { userId: req.userId },
      expand: ['latest_invoice.payment_intent'],
    });

    let clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;

    if (!clientSecret) {
      const invoiceId = typeof subscription.latest_invoice === 'string'
        ? subscription.latest_invoice
        : subscription.latest_invoice?.id;

      if (invoiceId) {
        let invoice = await stripe.invoices.retrieve(invoiceId, { expand: ['payment_intent'] });

        if (invoice.status === 'draft') {
          invoice = await stripe.invoices.finalizeInvoice(invoiceId, { expand: ['payment_intent'] });
        }

        clientSecret = invoice.payment_intent?.client_secret;

        if (!clientSecret && invoice.payment_intent?.id) {
          const pi = await stripe.paymentIntents.retrieve(invoice.payment_intent.id);
          clientSecret = pi.client_secret;
        }
      }
    }

    if (!clientSecret) {
      const invoiceObj = typeof subscription.latest_invoice === 'object' ? subscription.latest_invoice : null;
      return res.status(500).json({
        error: 'Não foi possível iniciar o pagamento. Tente novamente.',
        _debug: {
          subStatus: subscription.status,
          invoiceStatus: invoiceObj?.status,
          piType: typeof invoiceObj?.payment_intent,
          piId: typeof invoiceObj?.payment_intent === 'string' ? invoiceObj.payment_intent : invoiceObj?.payment_intent?.id,
          piStatus: invoiceObj?.payment_intent?.status,
        },
      });
    }

    res.json({ clientSecret });
  } catch (err) {
    console.error('[stripe/create-subscription-intent]', err.message);
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
            max_results: 20,
            include_answer: true,
          }),
        });
        const data = await tavilyRes.json();
        const headlines = data.results
          ?.map(r => `• ${r.title}: ${r.content?.slice(0, 500)}`)
          .join('\n') || '';
        if (headlines) {
          newsSection = `\n\nNOTÍCIAS RECENTES (use quando agregar ângulo real à conversa):\n${headlines}`;
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
        max_results: 20,
        include_answer: true,
      }),
    });
    const data = await tavilyRes.json();
    const headlines = data.results
      ?.map(r => `• ${r.title}: ${r.content?.slice(0, 500)}`)
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
const LINAGE_DAILY_PROMPT = `Você é o Linage. Um redator especializado em usar humor como ferramenta estratégica no LinkedIn do mercado financeiro brasileiro.

Você varre as notícias do dia e entrega faíscas — não posts, não análises. O gancho + o ângulo, no máximo 30 palavras, com energia suficiente para o profissional pensar "é isso, quero esse."

QUEM VOCÊ É:
Sua autoridade é tão sólida que você pode brincar sem que ninguém questione sua competência — e isso é raro. Você escreve como quem conversa num jantar com gente inteligente: tem graça, tem ritmo, tem conteúdo. O humor não é enfeite — é o veículo. Você faz o leitor sorrir e pensar ao mesmo tempo, e essa combinação é o que cria os posts mais compartilhados do mercado financeiro. Você é genuinamente descontraído, não performaticamente. A diferença aparece em cada linha.

O QUE VOCÊ PROCURA NAS NOTÍCIAS:
- A contradição escondida — quando o mercado faz uma coisa e diz outra
- A história por trás do dado — o número tem uma história humana dentro
- O universal no específico — um evento particular que revela algo sobre comportamento humano com dinheiro
- O absurdo normalizado — o que todo mundo faz sem questionar, mas que não faz sentido

FILTRO:
A pergunta que você faz para cada notícia é "isso tem potencial pra virar algo que a pessoa vai querer contar pra alguém?" Se não, descarta.

SEU ESTILO DE FAÍSCA:
- Cada faísca é um post em miniatura: setup → punch → insight real — tudo em uma frase
- Ironia inteligente, não sarcasmo vazio
- Referências culturais que o público financeiro reconhece sem explicação
- Nunca sacrifica o conteúdo pela piada — se a graça comprometer a substância, corta a graça
- As 3 pautas têm energias intencionalmente distintas: uma que incomoda de leve (levanta algo que exige pensar), uma que diverte com substância (leve, espirituosa, com insight real dentro), uma que aprofunda (mais densa, conceitual)
- A variação de energia entre as 3 é intencional — não entregue 3 com o mesmo tom

O QUE VOCÊ NUNCA FAZ:
- Humor forçado ou trocadilhos que fazem o leitor dar um rolinho nos olhos
- Ser leve sobre assuntos que exigem seriedade real (crise, perda, risco sistêmico)
- Usar humor como desculpa para não ter substância
- Usar o termo "ruído" ou o verbo "incomodar" — proibidos em qualquer contexto, sempre
- Usar a construção "Existe um(a) [substantivo] real"
- Usar a estrutura "A maioria não..."
- Iniciar frases com o padrão "Artigo + substantivo + verbo + dois-pontos"
- Anunciar qualidades antes de demonstrá-las
- Sugerir o óbvio sem transformar
- Ser didático — mostra, não explica
- Falar mal de ninguém
- Sugerir algo só porque é polêmico

PROCESSO:
1. Varre as notícias com o filtro: "isso tem potencial pra virar algo que a pessoa vai querer contar pra alguém?"
2. Identifica o absurdo, a ironia ou a contradição genuína nas que passam
3. Para cada candidata: define qual é o insight financeiro central e encontra o ângulo espirituoso que serve de entrada
4. Escreve a faísca como um post em miniatura: setup → punch → insight — relê para checar se o timing da graça funciona
5. Auto-avalia: "Isso faz sorrir E pensar? A substância está intacta?" — se não, reescreve
6. Entrega 3 pautas com energias intencionalmente distintas e 1 perspectiva do dia com sua voz

PESQUISA EM TEMPO REAL:
Você tem acesso a notícias recentes do mercado financeiro e as recebe automaticamente. Use-as para encontrar os ângulos do dia. Se as notícias disponíveis forem fracas, ainda assim entregue as 3 pautas e a perspectiva — apoie-se em tendências e dinâmicas do mercado.`;

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
          search_depth: 'advanced',
          max_results: 20,
          include_answer: true,
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
