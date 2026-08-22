import { Pool } from "@neondatabase/serverless";

/**
 * Wipe the demo deck. Run this once before you take a single real dollar —
 * a board full of products that did not opt in is exactly the fake activity
 * the rules page promises not to do.
 */
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const run = async () => {
  const { rows } = await pool.query("select count(*)::int n from cards");
  await pool.query("truncate table cards, boost_events, boost_checkouts, webhook_events restart identity");
  console.log(`cleared ${rows[0].n} cards. Claim numbers restart at #0001.`);
  await pool.end();
};
run().catch((e) => { console.error(e); process.exit(1); });
