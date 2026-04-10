import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { SupabaseProfile } from "./_core/context";

/**
 * After migrating to Supabase Auth, logout is handled client-side via supabase.auth.signOut().
 * The server-side logout procedure simply returns { success: true } — no cookie clearing needed
 * because sessions are managed by Supabase JWT tokens, not server-side cookies.
 */

function createAuthContext(): TrpcContext {
  const user: SupabaseProfile = {
    id: "sample-uuid-001",
    name: "Sample User",
    email: "sample@example.com",
    phone: null,
    role: "user",
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("returns success for authenticated users", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
  });

  it("returns success for unauthenticated users (no-op)", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
  });
});
