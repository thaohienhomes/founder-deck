import { config } from "dotenv";
config({ path: ".env.local" });
import { Pool } from "@neondatabase/serverless";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const dir = path.join(process.cwd(), "drizzle");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

const run = async () => {
  for (const f of files) {
    const sqlText = readFileSync(path.join(dir, f), "utf8");
    const statements = sqlText.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
    for (const s of statements) {
      await pool.query(s);
    }
    console.log("applied", f, `(${statements.length} statements)`);
  }
  await pool.end();
};
run().catch((e) => { console.error(e); process.exit(1); });
