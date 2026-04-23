import { useState } from "react";
import { Link, useParams } from "wouter";
import { Package, Bell, BellOff, User, ArrowLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

function formatPrice(price: string | number) {
  return Number(price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  awaiting_payment: { label: "Aguardando Pagamento", color: "bg-orange-100 text-orange-700" },
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-700" },
  processing: { label: "Em Processamento", color: "bg-purple-100 text-purple-700" },
  shipped: { label: "Enviado", color: "bg-indigo-100 text-indigo-700" },
  delivered: { label: "Entregue", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
  payment_failed: { label: "Pagamento Recusado", color: "bg-red-100 text-red-700" },
};

export default function MyAccount() {
  const { isAuthenticated, user } = useAuth();
  const { isSubscribed, subscribe, unsubscribe } = usePushNotifications(isAuthenticated);
  const [activeTab, setActiveTab] = useState<"orders" | "profile" | "notifications">("orders");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Faça login para continuar</h2>
          <p className="text-gray-500 mb-6">Acesse sua conta para ver seus pedidos</p>
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => (window.location.href = '/login')}>
            Entrar / Cadastrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user?.name}</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          {(user?.role === "admin" || user?.role === "staff") && (
            <Link href="/admin">
              <Button size="sm" className="ml-auto bg-gray-900 hover:bg-gray-800 text-white">Painel Admin</Button>
            </Link>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-gray-100 p-1 mb-6">
          {[
            { id: "orders" as const, label: "Meus Pedidos", icon: Package },
            { id: "notifications" as const, label: "Notificações", icon: Bell },
            { id: "profile" as const, label: "Perfil", icon: User },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${activeTab === id ? "bg-red-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {activeTab === "orders" && <OrdersTab />}
        {activeTab === "notifications" && <NotificationsTab isSubscribed={isSubscribed} subscribe={subscribe} unsubscribe={unsubscribe} />}
        {activeTab === "profile" && <ProfileTab user={user} />}
      </div>
    </div>
  );
}

function OrdersTab() {
  const { data: orders, isLoading } = trpc.orders.myOrders.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum pedido ainda</h3>
        <p className="text-gray-500 mb-6">Explore nosso catálogo e faça seu primeiro pedido!</p>
        <Link href="/produtos">
          <Button className="bg-red-600 hover:bg-red-700 text-white">Ver Produtos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const status = STATUS_LABELS[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-700" };
        return (
          <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-gray-900">Pedido #{order.id}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>{status.label}</span>
                <p className="font-bold text-red-600 mt-1">{formatPrice(order.total)}</p>
              </div>
            </div>
            {order.shippingAddress && (
              <p className="text-xs text-gray-400 mt-2 line-clamp-1">
                Entrega: {(order.shippingAddress as any).street}, {(order.shippingAddress as any).city}/{(order.shippingAddress as any).state}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function NotificationsTab({ isSubscribed, subscribe, unsubscribe }: { isSubscribed: boolean; subscribe: () => void; unsubscribe: () => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-1">Notificações Push</h3>
        <p className="text-sm text-gray-500 mb-4">
          Receba notificações em tempo real quando o status do seu pedido mudar.
        </p>
        {isSubscribed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <Bell className="h-5 w-5" />
              <span className="text-sm font-medium">Notificações ativadas</span>
            </div>
            <Button variant="outline" onClick={unsubscribe} className="border-red-200 text-red-600 hover:bg-red-50">
              <BellOff className="h-4 w-4 mr-2" /> Desativar notificações
            </Button>
          </div>
        ) : (
          <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={subscribe}>
            <Bell className="h-4 w-4 mr-2" /> Ativar notificações push
          </Button>
        )}
      </div>

      <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">Sobre as notificações</p>
        <p>Você receberá alertas quando seu pedido for confirmado, enviado e entregue. As notificações funcionam mesmo com o navegador fechado (após instalar o app).</p>
      </div>
    </div>
  );
}

function ProfileTab({ user }: { user: any }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
      <h3 className="font-bold text-gray-900">Informações da Conta</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between py-2 border-b border-gray-50">
          <span className="text-gray-500">Nome</span>
          <span className="font-medium text-gray-900">{user?.name ?? "—"}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-50">
          <span className="text-gray-500">Email</span>
          <span className="font-medium text-gray-900">{user?.email ?? "—"}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-50">
          <span className="text-gray-500">Perfil</span>
          <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${user?.role === "admin" ? "bg-red-100 text-red-700" : user?.role === "staff" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
            {user?.role === "admin" ? "Administrador" : user?.role === "staff" ? "Operador" : "Cliente"}
          </span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-gray-500">Membro desde</span>
          <span className="font-medium text-gray-900">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString("pt-BR") : "—"}</span>
        </div>
      </div>
      <p className="text-xs text-gray-400">As informações de perfil são gerenciadas pelo sistema de autenticação.</p>
    </div>
  );
}
