import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getCategories, getCategoryById, createCategory, updateCategory, deleteCategory,
  getProducts, getProductBySlug, getProductById, createProduct, updateProduct, softDeleteProduct,
  getAddressesByUserId, createAddress, deleteAddress,
  createOrder, getOrdersByUserId, getOrderById, getOrderItems, getAllOrders, updateOrderStatus, getOrderStats,
  savePushSubscription, getPushSubscriptionsByUserId, deletePushSubscription, getAllProfiles, updateProfileRole,
} from "./db";
import { supabaseAdmin } from "./supabase";
import { notifyNewOrder, notifyOrderStatusChange } from "./notifications";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores." });
  return next({ ctx });
});

function toSlug(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const appRouter = router({
  system: systemRouter,

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    // Supabase auth is handled client-side; logout is also client-side
    logout: publicProcedure.mutation(() => ({ success: true })),

    // Sign up with email/password via Supabase Admin API (server-side)
    signUp: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().min(2) }))
      .mutation(async ({ input }) => {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: input.email,
          password: input.password,
          email_confirm: true,
          user_metadata: { name: input.name, role: "user" },
        });
        if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
        return { success: true, userId: data.user?.id };
      }),

    // Get profile by Supabase user ID
    profile: protectedProcedure.query(async ({ ctx }) => {
      const { data, error } = await supabaseAdmin.from("profiles").select("*").eq("id", ctx.user.id).single();
      if (error) throw new TRPCError({ code: "NOT_FOUND" });
      return data;
    }),

    updateProfile: protectedProcedure
      .input(z.object({ name: z.string().optional(), phone: z.string().optional(), avatar_url: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const { error } = await supabaseAdmin.from("profiles").update({ ...input, updated_at: new Date().toISOString() }).eq("id", ctx.user.id);
        if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        return { success: true };
      }),
  }),

  // ── Categories ────────────────────────────────────────────────────────────
  categories: router({
    list: publicProcedure.query(() => getCategories(true)),
    listAll: adminProcedure.query(() => getCategories(false)),
    create: adminProcedure
      .input(z.object({ name: z.string().min(2), description: z.string().optional(), image_url: z.string().optional() }))
      .mutation(async ({ input }) => {
        await createCategory({ name: input.name, slug: toSlug(input.name), description: input.description, image_url: input.image_url });
        return { success: true };
      }),
    update: adminProcedure
      .input(z.object({ id: z.number(), name: z.string().optional(), description: z.string().optional(), image_url: z.string().optional(), active: z.boolean().optional() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const update: Record<string, unknown> = { ...data };
        if (data.name) update.slug = toSlug(data.name);
        await updateCategory(id, update as Parameters<typeof updateCategory>[1]);
        return { success: true };
      }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteCategory(input.id);
      return { success: true };
    }),
  }),

  // ── Products ──────────────────────────────────────────────────────────────
  products: router({
    list: publicProcedure
      .input(z.object({ categoryId: z.number().optional(), search: z.string().optional(), featured: z.boolean().optional(), limit: z.number().optional(), offset: z.number().optional() }).optional())
      .query(({ input }) => getProducts({ ...input, activeOnly: true })),
    listAdmin: adminProcedure
      .input(z.object({ categoryId: z.number().optional(), search: z.string().optional() }).optional())
      .query(({ input }) => getProducts({ ...input, activeOnly: false })),
    bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => getProductBySlug(input.slug)),
    byId: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => getProductById(input.id)),
    create: adminProcedure
      .input(z.object({
        category_id: z.number(), name: z.string().min(2), description: z.string().optional(),
        price: z.number(), original_price: z.number().optional(), image_url: z.string().optional(),
        sku: z.string().optional(), stock: z.number().default(0), featured: z.boolean().default(false),
      }))
      .mutation(async ({ input }) => {
        const product = await createProduct({ ...input, slug: toSlug(input.name) + "-" + Date.now() });
        return { success: true, id: product?.id };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(), category_id: z.number().optional(), name: z.string().optional(), description: z.string().optional(),
        price: z.number().optional(), original_price: z.number().optional().nullable(), image_url: z.string().optional().nullable(),
        sku: z.string().optional(), stock: z.number().optional(), featured: z.boolean().optional(), active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const update: Record<string, unknown> = { ...data };
        if (data.name) update.slug = toSlug(data.name) + "-" + id;
        await updateProduct(id, update as Parameters<typeof updateProduct>[1]);
        return { success: true };
      }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await softDeleteProduct(input.id);
      return { success: true };
    }),
  }),

  // ── Addresses ─────────────────────────────────────────────────────────────
  addresses: router({
    list: protectedProcedure.query(({ ctx }) => getAddressesByUserId(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        label: z.string().optional(), recipient_name: z.string().min(2),
        zip_code: z.string().min(8), street: z.string().min(2), number: z.string().min(1),
        complement: z.string().optional(), neighborhood: z.string().min(2), city: z.string().min(2),
        state: z.string().length(2), is_default: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const addr = await createAddress({ ...input, user_id: ctx.user.id });
        return { success: true, id: addr?.id };
      }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await deleteAddress(input.id, ctx.user.id);
      return { success: true };
    }),
  }),

  // ── Orders ────────────────────────────────────────────────────────────────
  orders: router({
    create: protectedProcedure
      .input(z.object({
        items: z.array(z.object({ productId: z.number(), quantity: z.number().min(1) })),
        shippingAddress: z.object({
          recipient_name: z.string(), zip_code: z.string(), street: z.string(), number: z.string(),
          complement: z.string().optional(), neighborhood: z.string(), city: z.string(), state: z.string(),
        }),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const productList = await Promise.all(input.items.map((i) => getProductById(i.productId)));
        const orderItemsData = input.items.map((item) => {
          const product = productList.find((p) => p?.id === item.productId);
          if (!product) throw new TRPCError({ code: "NOT_FOUND", message: `Produto ${item.productId} não encontrado.` });
          if (product.stock < item.quantity) throw new TRPCError({ code: "BAD_REQUEST", message: `Estoque insuficiente para ${product.name}.` });
          const unitPrice = parseFloat(product.price);
          return { product_id: product.id, product_name: product.name, product_image: product.image_url, quantity: item.quantity, unit_price: unitPrice, total_price: unitPrice * item.quantity };
        });
        const subtotal = orderItemsData.reduce((acc, i) => acc + i.total_price, 0);
        const order = await createOrder({
          user_id: ctx.user.id, subtotal, shipping_cost: 0, discount: 0, total: subtotal,
          address_snapshot: input.shippingAddress, notes: input.notes, items: orderItemsData,
        });
        await notifyNewOrder(order.id, ctx.user.name ?? "Cliente", subtotal.toFixed(2));
        return { success: true, orderId: order.id };
      }),
    myOrders: protectedProcedure.query(({ ctx }) => getOrdersByUserId(ctx.user.id)),
    detail: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const order = await getOrderById(input.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.user_id !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return order;
    }),
    adminList: adminProcedure
      .input(z.object({ limit: z.number().optional(), offset: z.number().optional(), status: z.string().optional() }).optional())
      .query(({ input }) => getAllOrders(input ?? {})),
    updateStatus: adminProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]), trackingCode: z.string().optional() }))
      .mutation(async ({ input }) => {
        const order = await getOrderById(input.id);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        await updateOrderStatus(input.id, input.status, input.trackingCode);
        await notifyOrderStatusChange(order.user_id, input.id, input.status, order.profiles?.name ?? "Cliente");
        return { success: true };
      }),
    stats: adminProcedure.query(() => getOrderStats()),
  }),

  // ── Users (admin) ─────────────────────────────────────────────────────────
  users: router({
    list: adminProcedure.query(() => getAllProfiles()),
    updateRole: adminProcedure
      .input(z.object({ id: z.string(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ input }) => {
        await updateProfileRole(input.id, input.role);
        return { success: true };
      }),
  }),

  // ── Push Notifications ────────────────────────────────────────────────────
  push: router({
    subscribe: protectedProcedure
      .input(z.object({ endpoint: z.string(), p256dh: z.string(), auth: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await savePushSubscription({ user_id: ctx.user.id, ...input });
        return { success: true };
      }),
    unsubscribe: protectedProcedure
      .input(z.object({ endpoint: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await deletePushSubscription(input.endpoint, ctx.user.id);
        return { success: true };
      }),
    mySubscriptions: protectedProcedure.query(({ ctx }) => getPushSubscriptionsByUserId(ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
