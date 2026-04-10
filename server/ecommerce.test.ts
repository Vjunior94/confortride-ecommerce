import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { SupabaseProfile } from "./_core/context";

// ─── Mock DB helpers ───────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getProfileById: vi.fn().mockResolvedValue(null),
  getAllProfiles: vi.fn().mockResolvedValue([]),
  updateProfileRole: vi.fn().mockResolvedValue(undefined),
  getCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "Selins", slug: "selins", description: null, image_url: null, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]),
  getCategoryById: vi.fn().mockResolvedValue(null),
  createCategory: vi.fn().mockResolvedValue(undefined),
  updateCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
  getProducts: vi.fn().mockResolvedValue({
    products: [
      { id: 1, category_id: 1, name: "Selin Comfort Pro", slug: "selin-comfort-pro", description: "Desc", price: 299.90, original_price: 349.90, image_url: null, images: [], sku: "SEL-001", stock: 10, active: true, featured: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ],
    total: 1,
  }),
  getProductBySlug: vi.fn().mockResolvedValue(null),
  getProductById: vi.fn().mockResolvedValue(null),
  createProduct: vi.fn().mockResolvedValue({ id: 99 }),
  updateProduct: vi.fn().mockResolvedValue(undefined),
  softDeleteProduct: vi.fn().mockResolvedValue(undefined),
  deleteProduct: vi.fn().mockResolvedValue(undefined),
  getAddressesByUserId: vi.fn().mockResolvedValue([]),
  createAddress: vi.fn().mockResolvedValue({ id: 1 }),
  deleteAddress: vi.fn().mockResolvedValue(undefined),
  createOrder: vi.fn().mockResolvedValue({ id: 42 }),
  getOrdersByUserId: vi.fn().mockResolvedValue([]),
  getOrderById: vi.fn().mockResolvedValue(null),
  getOrderItems: vi.fn().mockResolvedValue([]),
  getAllOrders: vi.fn().mockResolvedValue({ orders: [], total: 0 }),
  updateOrderStatus: vi.fn().mockResolvedValue(undefined),
  getOrderStats: vi.fn().mockResolvedValue({ total: 0, pending: 0, revenue: 0 }),
  savePushSubscription: vi.fn().mockResolvedValue(undefined),
  getPushSubscriptionsByUserId: vi.fn().mockResolvedValue([]),
  deletePushSubscription: vi.fn().mockResolvedValue(undefined),
  getAllAdminPushSubscriptions: vi.fn().mockResolvedValue([]),
}));

vi.mock("./notifications", () => ({
  notifyNewOrder: vi.fn().mockResolvedValue(undefined),
  notifyOrderStatusChange: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./supabase", () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue({ data: { user: { id: "uuid-123" } }, error: null }),
      },
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }),
  },
}));

// ─── Context helpers ───────────────────────────────────────────────────────────
function makeProfile(role: "user" | "admin" = "user"): SupabaseProfile {
  return {
    id: role === "admin" ? "admin-uuid-001" : "user-uuid-002",
    name: role === "admin" ? "Admin User" : "Regular User",
    email: `${role}@example.com`,
    phone: null,
    role,
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function makeCtx(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: makeProfile(role),
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.role).toBe("user");
  });
});

describe("auth.logout", () => {
  it("returns success for any user", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});

describe("categories.list", () => {
  it("returns categories for public users", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.categories.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toBe("Selins");
  });
});

describe("categories.listAll (admin only)", () => {
  it("throws FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.categories.listAll()).rejects.toThrow();
  });

  it("returns categories for admin users", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.categories.listAll();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("categories.create (admin only)", () => {
  it("throws FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.categories.create({ name: "Test Category" })).rejects.toThrow();
  });

  it("creates a category for admin users", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.categories.create({ name: "Nova Categoria" });
    expect(result.success).toBe(true);
  });
});

describe("products.list", () => {
  it("returns products for public users", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.products.list();
    // products.list returns { products, total } from Supabase
    expect(result).toHaveProperty("products");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.products)).toBe(true);
    expect(result.products.length).toBeGreaterThan(0);
  });

  it("accepts search and category filters", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.products.list({ search: "selin", categoryId: 1 });
    expect(result).toHaveProperty("products");
    expect(Array.isArray(result.products)).toBe(true);
  });
});

describe("products.create (admin only)", () => {
  it("throws FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(
      caller.products.create({ category_id: 1, name: "Test", price: 99.90, stock: 5 })
    ).rejects.toThrow();
  });

  it("creates a product for admin users", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.products.create({ category_id: 1, name: "Novo Produto", price: 199.90, stock: 10 });
    expect(result.success).toBe(true);
  });
});

describe("orders.myOrders", () => {
  it("throws for unauthenticated users", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(caller.orders.myOrders()).rejects.toThrow();
  });

  it("returns orders for authenticated users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const result = await caller.orders.myOrders();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("orders.adminList (admin only)", () => {
  it("throws FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.orders.adminList()).rejects.toThrow();
  });

  it("returns all orders for admin users", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.orders.adminList();
    expect(result).toHaveProperty("orders");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.orders)).toBe(true);
  });
});

describe("orders.stats (admin only)", () => {
  it("throws FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.orders.stats()).rejects.toThrow();
  });

  it("returns stats for admin users", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.orders.stats();
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("pending");
    expect(result).toHaveProperty("revenue");
  });
});

describe("push.subscribe", () => {
  it("throws for unauthenticated users", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.push.subscribe({ endpoint: "https://test.com", p256dh: "key", auth: "auth" })
    ).rejects.toThrow();
  });

  it("saves subscription for authenticated users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    const result = await caller.push.subscribe({
      endpoint: "https://fcm.googleapis.com/test",
      p256dh: "p256dhkey",
      auth: "authkey",
    });
    expect(result.success).toBe(true);
  });
});

describe("users.list (admin only)", () => {
  it("throws FORBIDDEN for regular users", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.users.list()).rejects.toThrow();
  });

  it("returns users list for admin", async () => {
    const caller = appRouter.createCaller(makeCtx("admin"));
    const result = await caller.users.list();
    expect(Array.isArray(result)).toBe(true);
  });
});
