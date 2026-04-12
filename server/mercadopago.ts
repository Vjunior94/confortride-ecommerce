/**
 * server/mercadopago.ts - Mercado Pago Transparent Checkout integration.
 * Creates payments directly via API (card, PIX, boleto).
 */
import { MercadoPagoConfig, Payment } from "mercadopago";

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
if (!accessToken) {
  console.warn("[MercadoPago] MERCADO_PAGO_ACCESS_TOKEN not set — payment features disabled.");
}

const client = accessToken ? new MercadoPagoConfig({ accessToken }) : null;

const APP_URL = process.env.VITE_APP_URL || "http://localhost:3000";

function ensureClient() {
  if (!client) throw new Error("Mercado Pago não configurado. Verifique MERCADO_PAGO_ACCESS_TOKEN.");
  return client;
}

interface PayerInfo {
  email: string;
  first_name: string;
  last_name: string;
  cpf: string;
}

export async function createCardPayment(params: {
  orderId: number;
  amount: number;
  token: string;
  installments: number;
  paymentMethodId: string;
  issuerId?: string;
  payer: PayerInfo;
}) {
  const payment = new Payment(ensureClient());
  return payment.create({
    body: {
      transaction_amount: params.amount,
      token: params.token,
      description: `Pedido #${params.orderId} - ConfortRide`,
      installments: params.installments,
      payment_method_id: params.paymentMethodId,
      issuer_id: params.issuerId ? Number(params.issuerId) : undefined,
      payer: {
        email: params.payer.email,
        first_name: params.payer.first_name,
        last_name: params.payer.last_name,
        identification: { type: "CPF", number: params.payer.cpf },
      },
      external_reference: String(params.orderId),
      notification_url: `${APP_URL}/api/webhooks/mercadopago`,
      statement_descriptor: "CONFORTRIDE",
    },
  });
}

export async function createPixPayment(params: {
  orderId: number;
  amount: number;
  payer: PayerInfo;
}) {
  const payment = new Payment(ensureClient());
  return payment.create({
    body: {
      transaction_amount: params.amount,
      description: `Pedido #${params.orderId} - ConfortRide`,
      payment_method_id: "pix",
      payer: {
        email: params.payer.email,
        first_name: params.payer.first_name,
        last_name: params.payer.last_name,
        identification: { type: "CPF", number: params.payer.cpf },
      },
      external_reference: String(params.orderId),
      notification_url: `${APP_URL}/api/webhooks/mercadopago`,
    },
  });
}

export async function createBoletoPayment(params: {
  orderId: number;
  amount: number;
  payer: PayerInfo;
  address: {
    zip_code: string;
    street_name: string;
    street_number: string;
    neighborhood: string;
    city: string;
    federal_unit: string;
  };
}) {
  const payment = new Payment(ensureClient());
  return payment.create({
    body: {
      transaction_amount: params.amount,
      description: `Pedido #${params.orderId} - ConfortRide`,
      payment_method_id: "bolbradesco",
      payer: {
        email: params.payer.email,
        first_name: params.payer.first_name,
        last_name: params.payer.last_name,
        identification: { type: "CPF", number: params.payer.cpf },
        address: params.address,
      },
      external_reference: String(params.orderId),
      notification_url: `${APP_URL}/api/webhooks/mercadopago`,
    },
  });
}

export async function getPaymentById(paymentId: string) {
  const payment = new Payment(ensureClient());
  return payment.get({ id: paymentId });
}
