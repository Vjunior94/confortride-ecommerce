import "dotenv/config";
import crypto from "crypto";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { getPaymentById } from "../mercadopago";
import { getOrderById, updateOrderPayment } from "../db";
import { notifyOrderStatusChange } from "../notifications";
import { sendPaymentConfirmed } from "../email";
import { sendPaymentConfirmedWhatsApp } from "../whatsapp";

const WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

/**
 * Verifies the Mercado Pago webhook signature (HMAC-SHA256).
 * Header format: ts=<timestamp>,v1=<hash>
 * Signed data: id:<data.id>;request-id:<x-request-id>;ts:<timestamp>;
 */
function verifyWebhookSignature(req: express.Request): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn("[MercadoPago Webhook] MERCADO_PAGO_WEBHOOK_SECRET not set — skipping signature verification.");
    return true; // Allow in dev/test when secret is not configured
  }

  const xSignature = req.headers["x-signature"] as string | undefined;
  const xRequestId = req.headers["x-request-id"] as string | undefined;
  const dataId = req.query["data.id"] ?? req.body?.data?.id;

  if (!xSignature || !xRequestId) {
    console.warn("[MercadoPago Webhook] Missing x-signature or x-request-id headers.");
    return false;
  }

  // Parse ts and v1 from header
  const parts: Record<string, string> = {};
  for (const part of xSignature.split(",")) {
    const [key, ...rest] = part.split("=");
    if (key && rest.length) parts[key.trim()] = rest.join("=").trim();
  }

  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) {
    console.warn("[MercadoPago Webhook] Malformed x-signature header.");
    return false;
  }

  // Build the signed template
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expectedHmac = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(manifest)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expectedHmac));
}

// Track processed webhook payment IDs to prevent duplicate processing
const processedWebhooks = new Set<string>();
const MAX_PROCESSED_CACHE = 1000;

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Mercado Pago webhook (outside tRPC — MP sends POST directly)
  app.post("/api/webhooks/mercadopago", async (req, res) => {
    try {
      // 1. Verify webhook signature (HMAC-SHA256)
      if (!verifyWebhookSignature(req)) {
        console.warn("[MercadoPago Webhook] Invalid signature — rejecting request.");
        res.sendStatus(401);
        return;
      }

      const { type, data } = req.body;
      if (type === "payment" && data?.id) {
        const paymentIdStr = String(data.id);

        // 2. Idempotency: skip already-processed payment notifications
        if (processedWebhooks.has(paymentIdStr)) {
          console.log(`[MercadoPago Webhook] Duplicate notification for payment ${paymentIdStr} — skipping.`);
          res.sendStatus(200);
          return;
        }

        // 3. Fetch payment details from Mercado Pago API (source of truth)
        const payment = await getPaymentById(paymentIdStr);
        const orderId = parseInt(payment.external_reference ?? "0");
        if (!orderId) { res.sendStatus(200); return; }

        const order = await getOrderById(orderId);
        if (!order) { res.sendStatus(200); return; }

        // 4. Verify the payment amount matches the order total (tamper protection)
        const expectedTotal = parseFloat(order.total);
        const paidAmount = payment.transaction_amount ?? 0;
        if (Math.abs(paidAmount - expectedTotal) > 0.01) {
          console.error(`[MercadoPago Webhook] Amount mismatch for order #${orderId}: expected ${expectedTotal}, got ${paidAmount}`);
          res.sendStatus(200);
          return;
        }

        // 5. Map MP payment status to order status
        let orderStatus: string;
        switch (payment.status) {
          case "approved":
            orderStatus = "confirmed";
            break;
          case "pending":
          case "in_process":
          case "authorized":
            orderStatus = "awaiting_payment";
            break;
          case "rejected":
          case "cancelled":
          case "refunded":
          case "charged_back":
            orderStatus = "payment_failed";
            break;
          default:
            orderStatus = order.status;
        }

        await updateOrderPayment(orderId, {
          payment_id: paymentIdStr,
          payment_status: payment.status ?? undefined,
          payment_method: payment.payment_method_id ?? undefined,
          status: orderStatus,
        });

        // 6. Track processed webhook to prevent duplicates
        processedWebhooks.add(paymentIdStr);
        if (processedWebhooks.size > MAX_PROCESSED_CACHE) {
          const first = processedWebhooks.values().next().value;
          if (first) processedWebhooks.delete(first);
        }

        // Notify customer of status change
        if (orderStatus !== order.status) {
          await notifyOrderStatusChange(order.user_id, orderId, orderStatus, order.profiles?.name ?? "Cliente");
        }

        // Send payment confirmed email
        if (payment.status === "approved" && order.order_items) {
          const addr = (order.address_snapshot ?? {}) as Record<string, string>;
          sendPaymentConfirmed({
            orderId,
            customerName: order.profiles?.name ?? "Cliente",
            customerEmail: order.profiles?.email ?? "",
            items: order.order_items.map((i: any) => ({ name: i.product_name, quantity: i.quantity, unitPrice: i.unit_price, totalPrice: i.total_price })),
            total: parseFloat(order.total),
            address: addr,
          }).catch(err => console.warn("[Webhook] Payment email failed:", err?.message));
          // Send WhatsApp notification
          const profile = order.profiles as any;
          if (profile?.phone) {
            sendPaymentConfirmedWhatsApp({
              phone: profile.phone,
              customerName: profile.name ?? "Cliente",
              orderId,
              total: parseFloat(order.total),
            }).catch(err => console.warn("[Webhook] Payment WhatsApp failed:", err?.message));
          }
        }

        console.log(`[MercadoPago Webhook] Order #${orderId} → ${orderStatus} (payment: ${payment.status})`);
      }
      res.sendStatus(200);
    } catch (err) {
      console.error("[MercadoPago Webhook] Error:", err);
      res.sendStatus(200); // Always return 200 to avoid retries
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
  server.listen(port, host, () => {
    console.log(`Server running on http://${host}:${port}/`);
  });
}

startServer().catch(console.error);
