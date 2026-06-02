import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      credits INTEGER NOT NULL DEFAULT 2000,
      credits_reset_at TIMESTAMP NOT NULL DEFAULT NOW(),
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS nickname TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS instructions TEXT NOT NULL DEFAULT ''`;
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      agent_id TEXT NOT NULL DEFAULT 'linage',
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
}

export async function syncUser({ id, email }) {
  const existing = await sql`SELECT id, plan, credits FROM users WHERE id = ${id}`;
  if (existing.length > 0) return existing[0];
  const [user] = await sql`
    INSERT INTO users (id, email) VALUES (${id}, ${email})
    RETURNING id, plan, credits
  `;
  return user;
}

export async function getUser(id) {
  const [user] = await sql`SELECT * FROM users WHERE id = ${id}`;
  return user;
}

export async function updateUserCredits(id, credits) {
  await sql`UPDATE users SET credits = ${credits} WHERE id = ${id}`;
}

export async function updateUserPlan(id, plan, stripeCustomerId, stripeSubscriptionId) {
  const planCredits = { free: 2000, starter: 15000, pro: 40000 };
  await sql`
    UPDATE users SET
      plan = ${plan},
      credits = ${planCredits[plan] ?? 2000},
      credits_reset_at = NOW(),
      stripe_customer_id = ${stripeCustomerId},
      stripe_subscription_id = ${stripeSubscriptionId}
    WHERE id = ${id}
  `;
}

export async function getPosts(userId) {
  return sql`SELECT * FROM posts WHERE user_id = ${userId} ORDER BY created_at DESC`;
}

export async function savePost({ id, userId, title, content, agentId, status }) {
  const [post] = await sql`
    INSERT INTO posts (id, user_id, title, content, agent_id, status)
    VALUES (${id}, ${userId}, ${title}, ${content}, ${agentId}, ${status})
    ON CONFLICT (id) DO UPDATE SET title = ${title}, content = ${content}, status = ${status}
    RETURNING *
  `;
  return post;
}

export async function deletePost(id, userId) {
  await sql`DELETE FROM posts WHERE id = ${id} AND user_id = ${userId}`;
}

export async function updateUserSettings(id, { nickname, instructions }) {
  await sql`UPDATE users SET nickname = ${nickname}, instructions = ${instructions} WHERE id = ${id}`;
}

export { sql };
