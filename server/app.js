import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { createClerkClient } from '@clerk/backend';
import { initDb, syncUser, getUser, updateUserCredits, updateUserPlan, getPosts, savePost, deletePost } from './db.js';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const APP_URL = process.env.APP_URL || 'http://localhost:5174';
const PLAN_CREDITS = { free: 2000, starter: 15000, pro: 40000 };
const CREDIT_COSTS = { generation: 500, revision: 150 };

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
    const payload = await clerk.verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch {
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

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await getUser(req.userId);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Credits ---
app.post('/api/credits/deduct', requireAuth, async (req, res) => {
  try {
    const { action } = req.body;
    const cost = CREDIT_COSTS[action];
    if (!cost) return res.status(400).json({ error: 'Invalid action' });
    const user = await getUser(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.credits < cost) return res.status(402).json({ error: 'Insufficient credits' });
    const newCredits = user.credits - cost;
    await updateUserCredits(req.userId, newCredits);
    res.json({ credits: newCredits });
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

// --- Stripe ---
app.post('/api/stripe/checkout', requireAuth, async (req, res) => {
  try {
    const { plan } = req.body;
    const priceId = plan === 'starter'
      ? process.env.STRIPE_PRICE_ID_STARTER_MONTHLY
      : process.env.STRIPE_PRICE_ID_PRO_MONTHLY;

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
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const priceId = subscription.items.data[0].price.id;
    const plan = priceId === process.env.STRIPE_PRICE_ID_PRO_MONTHLY ? 'pro' : 'starter';
    await updateUserPlan(userId, plan, session.customer, session.subscription);
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    const users = await import('./db.js').then(m => m.sql)`
      SELECT id FROM users WHERE stripe_subscription_id = ${sub.id}
    `;
    if (users[0]) await updateUserPlan(users[0].id, 'free', sub.customer, null);
  }

  res.json({ received: true });
});

export default app;
