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
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMP NOT NULL DEFAULT NOW()`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avulso_credits INTEGER NOT NULL DEFAULT 0`;
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      agent_id TEXT NOT NULL DEFAULT 'linage',
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()`;
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS chat_history TEXT NOT NULL DEFAULT '[]'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_activated BOOLEAN NOT NULL DEFAULT FALSE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_access_token TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_token_expires_at TIMESTAMP`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_person_urn TEXT`;
  await sql`
    CREATE TABLE IF NOT EXISTS linkedin_oauth_states (
      state TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS daily_content (
      date DATE PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
}

export async function syncUser({ id, email, name }) {
  const byId = await sql`SELECT id, name, plan, credits, avulso_credits, nickname, instructions, trial_activated FROM users WHERE id = ${id}`;
  if (byId.length > 0) {
    if (name && !byId[0].name) {
      await sql`UPDATE users SET name = ${name} WHERE id = ${id}`;
    }
    return byId[0];
  }

  if (email) {
    const byEmail = await sql`SELECT id, name, plan, credits, avulso_credits, nickname, instructions, trial_activated FROM users WHERE email = ${email}`;
    if (byEmail.length > 0) {
      if (name && !byEmail[0].name) {
        await sql`UPDATE users SET name = ${name} WHERE id = ${byEmail[0].id}`;
      }
      return byEmail[0];
    }
  }

  const [user] = await sql`
    INSERT INTO users (id, email, name) VALUES (${id}, ${email}, ${name || ''})
    RETURNING id, name, plan, credits, avulso_credits, nickname, instructions, trial_activated
  `;
  return user;
}

export async function startTrial(id) {
  const [user] = await sql`
    UPDATE users SET credits = 1350, trial_activated = TRUE
    WHERE id = ${id} AND plan = 'trial' AND trial_activated = FALSE
    RETURNING id, plan, credits, avulso_credits, nickname, instructions, trial_activated
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
  const planCredits = { starter: 4500, pro: 9000 };
  await sql`
    UPDATE users SET
      plan = ${plan},
      credits = ${planCredits[plan] ?? 0} + avulso_credits,
      credits_reset_at = NOW(),
      stripe_customer_id = ${stripeCustomerId},
      stripe_subscription_id = ${stripeSubscriptionId},
      trial_activated = TRUE
    WHERE id = ${id}
  `;
}

export async function addAvulsoCredits(id, amount) {
  await sql`UPDATE users SET credits = credits + ${amount}, avulso_credits = avulso_credits + ${amount} WHERE id = ${id}`;
}

export async function getPosts(userId) {
  return sql`SELECT * FROM posts WHERE user_id = ${userId} ORDER BY updated_at DESC`;
}

export async function savePost({ id, userId, title, content, agentId, status, chatHistory }) {
  const chatJson = JSON.stringify(chatHistory ?? []);
  const [post] = await sql`
    INSERT INTO posts (id, user_id, title, content, agent_id, status, chat_history)
    VALUES (${id}, ${userId}, ${title}, ${content}, ${agentId}, ${status}, ${chatJson})
    ON CONFLICT (id) DO UPDATE SET
      title = ${title}, content = ${content}, status = ${status},
      chat_history = ${chatJson}, updated_at = NOW()
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
