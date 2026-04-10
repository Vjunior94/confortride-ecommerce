import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

describe("Supabase Migration", () => {
  it("should have valid Supabase credentials configured", () => {
    expect(SUPABASE_URL).toBeTruthy();
    expect(SUPABASE_URL).toMatch(/^https:\/\/.+\.supabase\.co$/);
    expect(SUPABASE_SERVICE_ROLE_KEY).toBeTruthy();
    expect(SUPABASE_SERVICE_ROLE_KEY.length).toBeGreaterThan(100);
  });

  it("should connect to Supabase and list categories", async () => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.from("categories").select("id, name, slug").limit(10);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect(data!.length).toBeGreaterThan(0);
    const firstCat = data![0];
    expect(firstCat).toHaveProperty("id");
    expect(firstCat).toHaveProperty("name");
    expect(firstCat).toHaveProperty("slug");
  });

  it("should connect to Supabase and list products", async () => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error, count } = await supabase
      .from("products")
      .select("id, name, price, stock, active", { count: "exact" })
      .eq("active", true)
      .limit(10);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect(count).toBeGreaterThan(0);
    if (data && data.length > 0) {
      expect(data[0]).toHaveProperty("id");
      expect(data[0]).toHaveProperty("name");
      expect(data[0]).toHaveProperty("price");
    }
  });

  it("should have profiles table accessible", async () => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabase.from("profiles").select("id, role").limit(1);
    if (error) expect(error.code).not.toBe("42P01");
  });

  it("should have orders table accessible", async () => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { error } = await supabase.from("orders").select("id, status, total").limit(1);
    if (error) expect(error.code).not.toBe("42P01");
  });
});

describe("auth.logout (compatibility)", () => {
  it("logout procedure returns success", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({
      user: null,
      req: { protocol: "https", headers: {} } as any,
      res: { clearCookie: () => {} } as any,
    });
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});
