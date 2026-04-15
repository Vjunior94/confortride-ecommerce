/**
 * server/whatsapp.ts - WhatsApp Business API (Meta Cloud API) integration.
 *
 * Sends transactional notifications to customers via WhatsApp.
 * Uses pre-approved message templates for business-initiated conversations.
 *
 * Required env vars:
 *   WHATSAPP_TOKEN        - Permanent access token (System User token from Meta Business)
 *   WHATSAPP_PHONE_ID     - Phone Number ID from WhatsApp Business settings
 */

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}/${WHATSAPP_PHONE_ID}/messages`;

if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
  console.warn("[WhatsApp] WHATSAPP_TOKEN or WHATSAPP_PHONE_ID not set — WhatsApp features disabled.");
}

// ── Helper: format phone to international (Brazil) ──
function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Already has country code
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  // Add Brazil country code
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function formatPrice(price: number): string {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ── Core send function ──
async function sendWhatsApp(to: string, payload: object): Promise<any> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
    console.warn("[WhatsApp] Skipping message (not configured)");
    return null;
  }

  const phone = formatPhone(to);

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        ...payload,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[WhatsApp] API error:", JSON.stringify(data));
      return null;
    }

    console.log(`[WhatsApp] Message sent to ${phone}:`, data.messages?.[0]?.id);
    return data;
  } catch (err: any) {
    console.error("[WhatsApp] Failed:", err?.message || err);
    return null;
  }
}

// ── Send a text message (for customer-initiated conversations / testing) ──
export async function sendTextMessage(to: string, text: string) {
  return sendWhatsApp(to, {
    type: "text",
    text: { preview_url: false, body: text },
  });
}

// ══════════════════════════════════════════════════════════════
// TEMPLATE MESSAGES (business-initiated, require Meta approval)
//
// Before using these functions, you must create the corresponding
// templates in Meta Business Manager > WhatsApp > Message Templates.
// Template names and parameter counts must match exactly.
// ══════════════════════════════════════════════════════════════

/**
 * Template: order_confirmation
 * Body: "Olá {{1}}! Seu pedido #{{2}} foi recebido. Total: {{3}}. Acompanhe em {{4}}"
 * Params: customerName, orderId, total, trackingUrl
 */
export async function sendOrderConfirmationWhatsApp(params: {
  phone: string;
  customerName: string;
  orderId: number;
  total: number;
}) {
  const APP_URL = process.env.VITE_APP_URL || "http://localhost:3000";
  return sendWhatsApp(params.phone, {
    type: "template",
    template: {
      name: "order_confirmation",
      language: { code: "pt_BR" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: params.customerName },
            { type: "text", text: String(params.orderId) },
            { type: "text", text: formatPrice(params.total) },
            { type: "text", text: `${APP_URL}/minha-conta` },
          ],
        },
      ],
    },
  });
}

/**
 * Template: payment_confirmed
 * Body: "Olá {{1}}! O pagamento do pedido #{{2}} foi aprovado ({{3}}). Estamos preparando o envio!"
 * Params: customerName, orderId, total
 */
export async function sendPaymentConfirmedWhatsApp(params: {
  phone: string;
  customerName: string;
  orderId: number;
  total: number;
}) {
  return sendWhatsApp(params.phone, {
    type: "template",
    template: {
      name: "payment_confirmed",
      language: { code: "pt_BR" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: params.customerName },
            { type: "text", text: String(params.orderId) },
            { type: "text", text: formatPrice(params.total) },
          ],
        },
      ],
    },
  });
}

/**
 * Template: order_shipped
 * Body: "Olá {{1}}! Seu pedido #{{2}} foi enviado! Código de rastreio: {{3}} ({{4}})"
 * Params: customerName, orderId, trackingCode, carrier
 */
export async function sendOrderShippedWhatsApp(params: {
  phone: string;
  customerName: string;
  orderId: number;
  trackingCode: string;
  carrier: string;
}) {
  return sendWhatsApp(params.phone, {
    type: "template",
    template: {
      name: "order_shipped",
      language: { code: "pt_BR" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: params.customerName },
            { type: "text", text: String(params.orderId) },
            { type: "text", text: params.trackingCode },
            { type: "text", text: params.carrier },
          ],
        },
      ],
    },
  });
}

/**
 * Template: delivery_thankyou
 * Body: "Olá {{1}}! Seu pedido #{{2}} foi entregue! Esperamos que tenha gostado. Obrigado por escolher a ConfortRide!"
 * Params: customerName, orderId
 */
export async function sendDeliveryThankYouWhatsApp(params: {
  phone: string;
  customerName: string;
  orderId: number;
}) {
  return sendWhatsApp(params.phone, {
    type: "template",
    template: {
      name: "delivery_thankyou",
      language: { code: "pt_BR" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: params.customerName },
            { type: "text", text: String(params.orderId) },
          ],
        },
      ],
    },
  });
}
