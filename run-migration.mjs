/**
 * Applies the Supabase migration SQL directly using the REST API (pg_dump endpoint)
 * or via the management API.
 */
import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env" });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

// Extract project ref from URL: https://PROJECTREF.supabase.co
const projectRef = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");
console.log(`Project ref: ${projectRef}`);

const sql = readFileSync("./supabase-migration.sql", "utf-8");

// Use Supabase's pg REST endpoint to execute raw SQL
const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": SERVICE_KEY,
    "Authorization": `Bearer ${SERVICE_KEY}`,
  },
  body: JSON.stringify({ sql }),
});

if (response.ok) {
  console.log("✅ Migration applied successfully!");
} else {
  const text = await response.text();
  console.log(`Response status: ${response.status}`);
  console.log(`Response: ${text.substring(0, 500)}`);
  
  // The exec_sql function may not exist — that's expected
  // We'll use the Supabase Management API instead
  console.log("\n📋 Trying Management API...");
  
  const mgmtResponse = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  
  if (mgmtResponse.ok) {
    console.log("✅ Migration applied via Management API!");
  } else {
    const mgmtText = await mgmtResponse.text();
    console.log(`Management API status: ${mgmtResponse.status}`);
    console.log(`Management API response: ${mgmtText.substring(0, 500)}`);
    console.log("\n⚠️  Please apply the migration manually via Supabase SQL Editor.");
    console.log("File: supabase-migration.sql");
  }
}
