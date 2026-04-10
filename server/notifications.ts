import webpush from "web-push";
import { notifyOwner } from "./_core/notification";
import { getAllAdminPushSubscriptions, getPushSubscriptionsByUserId, deletePushSubscription } from "./db";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails("mailto:contato@confortride.com.br", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663082404663/FjqZaJ9bgun3ZHiVXwXgxT/LogoConfortRide_fb4b6e27.png";

async function sendPushToUser(userId: string, payload: object) {
  const subs = await getPushSubscriptionsByUserId(userId);
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await deletePushSubscription(sub.endpoint, userId);
      }
    }
  }
}

async function sendPushToAdmins(payload: object) {
  const adminSubs = await getAllAdminPushSubscriptions();
  for (const sub of adminSubs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Can't easily get userId here, just skip
      }
    }
  }
}

export async function notifyNewOrder(orderId: number, customerName: string, total: string) {
  const payload = {
    title: "Novo Pedido Recebido!",
    body: `Pedido #${orderId} de ${customerName} — R$ ${total}`,
    icon: LOGO_URL,
    url: "/admin/pedidos",
    tag: `order-${orderId}`,
  };

  await sendPushToAdmins(payload).catch(console.error);

  await notifyOwner({
    title: `Novo Pedido #${orderId} — ConfortRide`,
    content: `Cliente: ${customerName}\nTotal: R$ ${total}\nAcesse o painel para gerenciar o pedido.`,
  }).catch(console.error);
}

export async function notifyOrderStatusChange(
  userId: string,
  orderId: number,
  status: string,
  customerName: string
) {
  const statusLabels: Record<string, string> = {
    confirmed: "Confirmado",
    processing: "Em Processamento",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
  };

  const label = statusLabels[status] || status;

  const payload = {
    title: "Atualização do seu Pedido",
    body: `Pedido #${orderId}: ${label}`,
    icon: LOGO_URL,
    url: `/minha-conta/pedidos/${orderId}`,
    tag: `order-status-${orderId}`,
  };

  await sendPushToUser(userId, payload).catch(console.error);
}
