/**
 * server/email.ts - Brevo transactional email service for post-sale emails.
 */
import { BrevoClient } from "@getbrevo/brevo";

const apiKey = process.env.BREVO_API_KEY;
if (!apiKey) {
  console.warn("[Email] BREVO_API_KEY not set — email features disabled.");
}

const client = apiKey ? new BrevoClient({ apiKey }) : null;

const SENDER = { name: "ConfortRide", email: process.env.EMAIL_SENDER || "contato@confortride.com.br" };
const REPLY_TO = { name: "ConfortRide", email: process.env.EMAIL_REPLY_TO || process.env.EMAIL_SENDER || "contato@confortride.com.br" };
const APP_URL = process.env.VITE_APP_URL || "http://localhost:3000";

// Omnichannel contact info
const CONTACT_WHATSAPP = process.env.CONTACT_WHATSAPP || "";
const CONTACT_INSTAGRAM = process.env.CONTACT_INSTAGRAM || "";
const CONTACT_PHONE = process.env.CONTACT_PHONE || "";

// ── Types ──
interface OrderEmailData {
  orderId: number;
  customerName: string;
  customerEmail: string;
  items: Array<{ name: string; quantity: number; unitPrice: number; totalPrice: number }>;
  total: number;
  address: { street?: string; number?: string; neighborhood?: string; city?: string; state?: string; zip_code?: string };
}

interface TrackingEmailData {
  orderId: number;
  customerName: string;
  customerEmail: string;
  trackingCode: string;
  carrier: string;
}

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function itemsTable(items: OrderEmailData["items"]) {
  return items.map(i =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${i.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${formatPrice(i.totalPrice)}</td>
    </tr>`
  ).join("");
}

function baseTemplate(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;max-width:100%">
        <!-- Header -->
        <tr><td style="background:#dc2626;padding:24px;text-align:center">
          <h1 style="margin:0;color:#fff;font-size:24px;font-family:'Barlow Condensed',Arial,sans-serif;letter-spacing:1px">CONFORTRIDE</h1>
        </td></tr>
        <!-- Title -->
        <tr><td style="padding:24px 24px 8px">
          <h2 style="margin:0;color:#1a1a1a;font-size:20px">${title}</h2>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:8px 24px 24px;color:#333;font-size:14px;line-height:1.6">
          ${body}
        </td></tr>
        <!-- Omnichannel Contact -->
        <tr><td style="background:#1a1a1a;padding:20px 24px;text-align:center">
          <p style="margin:0 0 12px;color:#fff;font-size:14px;font-weight:bold">Fale conosco</p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto">
            <tr>
              ${CONTACT_WHATSAPP ? `<td style="padding:0 8px"><a href="https://wa.me/55${CONTACT_WHATSAPP.replace(/\D/g, "")}" style="color:#25d366;text-decoration:none;font-size:13px">&#9742; WhatsApp</a></td>` : ""}
              <td style="padding:0 8px"><a href="mailto:${REPLY_TO.email}" style="color:#60a5fa;text-decoration:none;font-size:13px">&#9993; E-mail</a></td>
              ${CONTACT_INSTAGRAM ? `<td style="padding:0 8px"><a href="https://instagram.com/${CONTACT_INSTAGRAM.replace("@", "")}" style="color:#e879f9;text-decoration:none;font-size:13px">&#128247; Instagram</a></td>` : ""}
            </tr>
          </table>
          ${CONTACT_PHONE ? `<p style="margin:10px 0 0;color:#999;font-size:12px">&#9990; ${CONTACT_PHONE}</p>` : ""}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9f9f9;padding:16px 24px;text-align:center;font-size:12px;color:#999">
          <p style="margin:0">ConfortRide &mdash; Acessórios para Motociclistas</p>
          <p style="margin:4px 0 0">&copy; ${new Date().getFullYear()} ConfortRide. Todos os direitos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Send helper ──
async function sendEmail(to: { name: string; email: string }, subject: string, htmlContent: string) {
  if (!client) {
    console.warn("[Email] Skipping email (no API key):", subject);
    return null;
  }
  try {
    const result = await client.transactionalEmails.sendTransacEmail({
      sender: SENDER,
      replyTo: REPLY_TO,
      to: [{ email: to.email, name: to.name }],
      subject,
      htmlContent,
    });
    console.log(`[Email] Sent "${subject}" to ${to.email}`);
    return result;
  } catch (err: any) {
    console.error(`[Email] Failed to send "${subject}":`, err?.body || err?.message || err);
    return null;
  }
}

// ── Email 1: Order Confirmation ──
export async function sendOrderConfirmation(data: OrderEmailData) {
  const addr = data.address;
  const addressLine = [addr.street, addr.number].filter(Boolean).join(", ")
    + (addr.neighborhood ? ` — ${addr.neighborhood}` : "")
    + (addr.city ? `, ${addr.city}/${addr.state}` : "");

  const html = baseTemplate("Pedido Confirmado!", `
    <p>Olá, <strong>${data.customerName}</strong>!</p>
    <p>Seu pedido <strong>#${data.orderId}</strong> foi recebido com sucesso.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #eee;border-radius:4px">
      <tr style="background:#f9f9f9">
        <th style="padding:8px 12px;text-align:left;font-size:13px">Produto</th>
        <th style="padding:8px 12px;text-align:center;font-size:13px">Qtd</th>
        <th style="padding:8px 12px;text-align:right;font-size:13px">Valor</th>
      </tr>
      ${itemsTable(data.items)}
      <tr>
        <td colspan="2" style="padding:10px 12px;font-weight:bold;text-align:right">Total</td>
        <td style="padding:10px 12px;font-weight:bold;text-align:right;color:#dc2626">${formatPrice(data.total)}</td>
      </tr>
    </table>

    <p style="font-size:13px;color:#666"><strong>Endereço de entrega:</strong> ${addressLine}</p>

    <p>Agora é só efetuar o pagamento e aguardar a confirmação.</p>

    <p style="text-align:center;margin:20px 0">
      <a href="${APP_URL}/minha-conta" style="background:#dc2626;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">Acompanhar Pedido</a>
    </p>
  `);

  return sendEmail(
    { name: data.customerName, email: data.customerEmail },
    `Pedido #${data.orderId} confirmado — ConfortRide`,
    html,
  );
}

// ── Email 2: Payment Confirmed ──
export async function sendPaymentConfirmed(data: OrderEmailData) {
  const html = baseTemplate("Pagamento Aprovado!", `
    <p>Olá, <strong>${data.customerName}</strong>!</p>
    <p>O pagamento do seu pedido <strong>#${data.orderId}</strong> foi <span style="color:#16a34a;font-weight:bold">aprovado</span>!</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border:1px solid #eee;border-radius:4px">
      <tr style="background:#f9f9f9">
        <th style="padding:8px 12px;text-align:left;font-size:13px">Produto</th>
        <th style="padding:8px 12px;text-align:center;font-size:13px">Qtd</th>
        <th style="padding:8px 12px;text-align:right;font-size:13px">Valor</th>
      </tr>
      ${itemsTable(data.items)}
      <tr>
        <td colspan="2" style="padding:10px 12px;font-weight:bold;text-align:right">Total</td>
        <td style="padding:10px 12px;font-weight:bold;text-align:right;color:#dc2626">${formatPrice(data.total)}</td>
      </tr>
    </table>

    <p>Estamos preparando seu pedido para envio. Você receberá o código de rastreio assim que for despachado.</p>

    <p style="text-align:center;margin:20px 0">
      <a href="${APP_URL}/minha-conta" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">Ver Meus Pedidos</a>
    </p>
  `);

  return sendEmail(
    { name: data.customerName, email: data.customerEmail },
    `Pagamento aprovado — Pedido #${data.orderId}`,
    html,
  );
}

// ── Email 3: Order Shipped ──
export async function sendOrderShipped(data: TrackingEmailData) {
  const html = baseTemplate("Pedido Enviado!", `
    <p>Olá, <strong>${data.customerName}</strong>!</p>
    <p>Seu pedido <strong>#${data.orderId}</strong> foi despachado!</p>

    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:16px;margin:16px 0;text-align:center">
      <p style="margin:0 0 4px;font-size:13px;color:#666">Código de rastreio (${data.carrier})</p>
      <p style="margin:0;font-size:20px;font-weight:bold;color:#0369a1;letter-spacing:2px">${data.trackingCode}</p>
    </div>

    <p>Você pode acompanhar a entrega pelo site dos Correios ou pela transportadora.</p>

    <p style="text-align:center;margin:20px 0">
      <a href="${APP_URL}/minha-conta" style="background:#0369a1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">Acompanhar Pedido</a>
    </p>
  `);

  return sendEmail(
    { name: data.customerName, email: data.customerEmail },
    `Pedido #${data.orderId} enviado — Rastreio: ${data.trackingCode}`,
    html,
  );
}

// ── Email 4: Delivery Confirmation + Thank You ──
export async function sendDeliveryThankYou(data: { orderId: number; customerName: string; customerEmail: string }) {
  const html = baseTemplate("Pedido Entregue!", `
    <p>Olá, <strong>${data.customerName}</strong>!</p>
    <p>Seu pedido <strong>#${data.orderId}</strong> foi entregue com sucesso!</p>

    <p>Esperamos que você esteja curtindo seu novo acessório. Sua opinião é muito importante para nós!</p>

    <p style="text-align:center;margin:20px 0">
      <a href="${APP_URL}/produtos" style="background:#dc2626;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">Avaliar Produto</a>
    </p>

    <p style="font-size:13px;color:#666;text-align:center">Obrigado por escolher a ConfortRide!</p>
  `);

  return sendEmail(
    { name: data.customerName, email: data.customerEmail },
    `Pedido #${data.orderId} entregue — Obrigado!`,
    html,
  );
}
