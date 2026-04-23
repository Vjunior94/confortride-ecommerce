import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { supabaseAdmin } from "../supabase";

export type SupabaseProfile = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: "user" | "admin" | "staff";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: SupabaseProfile | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: SupabaseProfile | null = null;

  try {
    // Extract Bearer token from Authorization header
    const authHeader = opts.req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (token) {
      // Verify JWT with Supabase
      const { data: { user: supaUser }, error } = await supabaseAdmin.auth.getUser(token);

      if (!error && supaUser) {
        // Fetch profile (includes role)
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .eq("id", supaUser.id)
          .single();

        if (profile) {
          user = profile as SupabaseProfile;
        } else {
          // Profile not yet created — create it now
          const newProfile: SupabaseProfile = {
            id: supaUser.id,
            name: supaUser.user_metadata?.name ?? supaUser.email ?? null,
            email: supaUser.email ?? null,
            phone: null,
            role: "user",
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          await supabaseAdmin.from("profiles").insert(newProfile).single();
          user = newProfile;
        }
      }
    }
  } catch (error) {
    console.warn("[Auth] Supabase authentication failed:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
