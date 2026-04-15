import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env["SUPABASE_URL"]!;
const supabaseServiceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("[Supabase] ENV vars available:", Object.keys(process.env).filter(k => k.includes("SUPA")).join(", ") || "NONE");
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

// Server-side admin client (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create a user-scoped client from a JWT token
export function createUserClient(accessToken: string) {
  return createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Non-admin client for operations that need Supabase Auth emails (confirmation, etc.)
export const supabaseAuth = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export type SupabaseAdminClient = typeof supabaseAdmin;
