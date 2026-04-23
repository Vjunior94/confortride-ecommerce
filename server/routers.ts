import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getCategories, getCategoryById, createCategory, updateCategory, deleteCategory,
  getProducts, getProductBySlug, getProductById, createProduct, updateProduct, softDeleteProduct,
  getAddressesByUserId, createAddress, deleteAddress,
  createOrder, getOrdersByUserId, getOrderById, getOrderItems, getAllOrders, updateOrderStatus, getOrderStats,
  updateOrderPayment,
  savePushSubscription, getPushSubscriptionsByUserId, deletePushSubscription, getAllProfiles, updateProfileRole,
} from "./db";
import { supabaseAdmin, supabaseAuth } from "./supabase";
import { notifyNewOrder, notifyOrderStatusChange } from "./notifications";
import { createCardPayment, createPixPayment, createBoletoPayment } from "./mercadopago";
import { sendOrderConfirmation, sendPaymentConfirmed, sendOrderShipped, sendDeliveryThankYou } from "./email";
import { sendOrderConfirmationWhatsApp, sendPaymentConfirmedWhatsApp, sendOrderShippedWhatsApp, sendDeliveryThankYouWhatsApp } from "./whatsapp";

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

    // Sign up with email/password — sends confirmation email via Supabase Auth
    signUp: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(6), name: z.string().min(2) }))
      .mutation(async ({ input }) => {
        const { data, error } = await supabaseAuth.auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            data: { name: input.name, role: "user" },
          },
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
        notifyNewOrder(order.id, ctx.user.name ?? "Cliente", subtotal.toFixed(2)).catch((err) =>
          console.warn("[Order] Notification failed (non-blocking):", err.message),
        );
        // Send order confirmation email (non-blocking)
        const addr = input.shippingAddress as Record<string, string>;
        sendOrderConfirmation({
          orderId: order.id,
          customerName: ctx.user.name ?? "Cliente",
          customerEmail: ctx.user.email ?? "",
          items: orderItemsData.map(i => ({ name: i.product_name, quantity: i.quantity, unitPrice: i.unit_price, totalPrice: i.total_price })),
          total: subtotal,
          address: addr,
        }).catch(err => console.warn("[Order] Email failed (non-blocking):", err?.message));
        // Send WhatsApp notification (non-blocking)
        if (ctx.user.phone) {
          sendOrderConfirmationWhatsApp({
            phone: ctx.user.phone,
            customerName: ctx.user.name ?? "Cliente",
            orderId: order.id,
            total: subtotal,
          }).catch(err => console.warn("[Order] WhatsApp failed (non-blocking):", err?.message));
        }
        return { success: true, orderId: order.id };
      }),

    // ── Transparent Checkout: Card Payment ──
    payWithCard: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        token: z.string(),
        installments: z.number().min(1).default(1),
        paymentMethodId: z.string(),
        issuerId: z.string().optional(),
        payerEmail: z.string().email(),
        payerCpf: z.string(),
        payerName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        if (order.user_id !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        if (order.status !== "awaiting_payment" && order.status !== "payment_failed") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Este pedido não pode ser pago." });
        }

        const nameParts = input.payerName.trim().split(" ");
        const firstName = nameParts[0] || "Cliente";
        const lastName = nameParts.slice(1).join(" ") || "";

        const result = await createCardPayment({
          orderId: input.orderId,
          amount: parseFloat(order.total),
          token: input.token,
          installments: input.installments,
          paymentMethodId: input.paymentMethodId,
          issuerId: input.issuerId,
          payer: { email: input.payerEmail, first_name: firstName, last_name: lastName, cpf: input.payerCpf },
        });

        const statusMap: Record<string, string> = { approved: "confirmed", in_process: "awaiting_payment", pending: "awaiting_payment", rejected: "payment_failed" };
        const orderStatus = statusMap[result.status ?? ""] ?? "payment_failed";

        await updateOrderPayment(input.orderId, {
          payment_id: String(result.id),
          payment_status: result.status ?? undefined,
          payment_method: result.payment_method_id ?? undefined,
          status: orderStatus,
          payment_data: { installments: result.installments, card_last_four: result.card?.last_four_digits, status_detail: result.status_detail },
        });

        return { status: result.status ?? "rejected", statusDetail: result.status_detail ?? "", orderId: input.orderId };
      }),

    // ── Transparent Checkout: PIX Payment ──
    payWithPix: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        payerEmail: z.string().email(),
        payerCpf: z.string(),
        payerName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        if (order.user_id !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        if (order.status !== "awaiting_payment" && order.status !== "payment_failed") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Este pedido não pode ser pago." });
        }

        const nameParts = input.payerName.trim().split(" ");
        const firstName = nameParts[0] || "Cliente";
        const lastName = nameParts.slice(1).join(" ") || "";

        let result: any;
        try {
          result = await createPixPayment({
            orderId: input.orderId,
            amount: parseFloat(order.total),
            payer: { email: input.payerEmail, first_name: firstName, last_name: lastName, cpf: input.payerCpf },
          });
        } catch (err: any) {
          console.error("[PIX] Mercado Pago full error:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
          const msg = err?.cause?.[0]?.message || err?.message || "Erro ao gerar PIX.";
          throw new TRPCError({ code: "BAD_REQUEST", message: msg });
        }

        const txData = result.point_of_interaction?.transaction_data;
        await updateOrderPayment(input.orderId, {
          payment_id: String(result.id),
          payment_status: result.status ?? undefined,
          payment_method: "pix",
          status: "awaiting_payment",
          payment_data: {
            qr_code: txData?.qr_code,
            qr_code_base64: txData?.qr_code_base64,
            ticket_url: txData?.ticket_url,
          },
        });

        return {
          orderId: input.orderId,
          qrCode: txData?.qr_code ?? "",
          qrCodeBase64: txData?.qr_code_base64 ?? "",
          ticketUrl: txData?.ticket_url ?? "",
        };
      }),

    // ── Transparent Checkout: Boleto Payment ──
    payWithBoleto: protectedProcedure
      .input(z.object({
        orderId: z.number(),
        payerEmail: z.string().email(),
        payerCpf: z.string(),
        payerName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const order = await getOrderById(input.orderId);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        if (order.user_id !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        if (order.status !== "awaiting_payment" && order.status !== "payment_failed") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Este pedido não pode ser pago." });
        }

        const nameParts = input.payerName.trim().split(" ");
        const firstName = nameParts[0] || "Cliente";
        const lastName = nameParts.slice(1).join(" ") || "";

        const addr = order.address_snapshot as { zip_code?: string; street?: string; number?: string; neighborhood?: string; city?: string; state?: string } | null;

        let result: any;
        try {
          result = await createBoletoPayment({
            orderId: input.orderId,
            amount: parseFloat(order.total),
            payer: { email: input.payerEmail, first_name: firstName, last_name: lastName, cpf: input.payerCpf },
            address: {
              zip_code: addr?.zip_code?.replace(/\D/g, "") ?? "",
              street_name: addr?.street ?? "",
              street_number: addr?.number ?? "",
              neighborhood: addr?.neighborhood ?? "",
              city: addr?.city ?? "",
              federal_unit: addr?.state ?? "",
            },
          });
        } catch (err: any) {
          console.error("[Boleto] Mercado Pago full error:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
          const msg = err?.cause?.[0]?.message || err?.message || "Erro ao gerar boleto.";
          throw new TRPCError({ code: "BAD_REQUEST", message: msg });
        }

        const boletoUrl = result.transaction_details?.external_resource_url ?? "";
        const barcode = (result as any).barcode?.content ?? "";

        await updateOrderPayment(input.orderId, {
          payment_id: String(result.id),
          payment_status: result.status ?? undefined,
          payment_method: "bolbradesco",
          status: "awaiting_payment",
          payment_data: { boleto_url: boletoUrl, barcode },
        });

        return { orderId: input.orderId, boletoUrl, barcode };
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
      .input(z.object({
        id: z.number(),
        status: z.enum(["awaiting_payment", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "payment_failed"]),
        trackingCode: z.string().optional(),
        carrier: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const order = await getOrderById(input.id);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        await updateOrderStatus(input.id, input.status, input.trackingCode);

        const profile = order.profiles as any;
        const customerName = profile?.name ?? "Cliente";
        const customerEmail = profile?.email;
        const customerPhone = profile?.phone;

        // Push notification
        await notifyOrderStatusChange(order.user_id, input.id, input.status, customerName);

        // Shipped → send email + WhatsApp with tracking info
        if (input.status === "shipped" && input.trackingCode) {
          if (customerEmail) {
            sendOrderShipped({
              orderId: input.id,
              customerName,
              customerEmail,
              trackingCode: input.trackingCode,
              carrier: input.carrier ?? "Transportadora",
            }).catch(err => console.warn("[Admin] Shipping email failed:", err?.message));
          }
          if (customerPhone) {
            sendOrderShippedWhatsApp({
              phone: customerPhone,
              customerName,
              orderId: input.id,
              trackingCode: input.trackingCode,
              carrier: input.carrier ?? "Transportadora",
            }).catch(err => console.warn("[Admin] Shipping WhatsApp failed:", err?.message));
          }
        }

        // Delivered → send thank you email + WhatsApp
        if (input.status === "delivered") {
          if (customerEmail) {
            sendDeliveryThankYou({
              orderId: input.id,
              customerName,
              customerEmail,
            }).catch(err => console.warn("[Admin] Delivery email failed:", err?.message));
          }
          if (customerPhone) {
            sendDeliveryThankYouWhatsApp({
              phone: customerPhone,
              customerName,
              orderId: input.id,
            }).catch(err => console.warn("[Admin] Delivery WhatsApp failed:", err?.message));
          }
        }

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
