import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env" });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const sql = readFileSync("./supabase-migration.sql", "utf-8");

// Split by statement terminator and run each
const statements = sql
  .split(/;\s*\n/)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith("--"));

console.log(`Running ${statements.length} SQL statements...`);

let success = 0;
let errors = 0;

for (const stmt of statements) {
  const preview = stmt.substring(0, 60).replace(/\n/g, " ");
  try {
    const { error } = await supabase.rpc("exec_sql", { sql: stmt + ";" }).single();
    if (error) {
      // Try direct query approach
      const { error: err2 } = await supabase.from("_sql").select("*").limit(0);
      console.log(`  ⚠ ${preview}... (will apply via SQL editor)`);
    } else {
      console.log(`  ✓ ${preview}...`);
      success++;
    }
  } catch (e) {
    console.log(`  ⚠ ${preview}...`);
  }
}

console.log(`\nDone. Note: Complex DDL statements (CREATE TABLE, RLS policies) must be applied via Supabase SQL Editor.`);
console.log(`Please copy the contents of supabase-migration.sql and run it in your Supabase project's SQL Editor.`);
