import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Step = "cart" | "address" | "confirm";

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("cart");
  const [address, setAddress] = useState({
    recipient_name: user?.name ?? "",
    zip_code: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: (data) => {
      clearCart();
      toast.success("Pedido realizado com sucesso!");
      navigate(`/minha-conta/pedidos/${data.orderId}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handlePlaceOrder = () => {
    if (!isAuthenticated) { window.location.href = '/login'; return; }
    createOrderMutation.mutate({
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      shippingAddress: address,
    });
  };

  if (items.length === 0 && step === "cart") {
    return (
      <div className="min-h-screen pt-16 bg-gray-50 flex items-center justify-center">
        <div className="text-center py-20">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Seu carrinho está vazio</h2>
          <p className="text-gray-500 mb-6">Adicione produtos para continuar</p>
          <Link href="/produtos">
            <Button className="bg-red-600 hover:bg-red-700 text-white">Ver Produtos</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {step === "cart" ? "MEU CARRINHO" : step === "address" ? "ENDEREÇO DE ENTREGA" : "CONFIRMAR PEDIDO"}
        </h1>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {(["cart", "address", "confirm"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step === s ? "bg-red-600 text-white" : i < ["cart","address","confirm"].indexOf(step) ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                {i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${step === s ? "text-red-600 font-medium" : "text-gray-400"}`}>
                {s === "cart" ? "Carrinho" : s === "address" ? "Endereço" : "Confirmação"}
              </span>
              {i < 2 && <div className="w-8 h-0.5 bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>

        {/* Step: Cart */}
        {step === "cart" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🏍️</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{item.name}</h3>
                    <p className="text-red-600 font-bold mt-1">{formatPrice(item.price)}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="px-2 py-1 hover:bg-gray-50">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="px-2 py-1 hover:bg-gray-50" disabled={item.quantity >= item.stock}>
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.productId)} className="text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order summary */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 h-fit">
              <h3 className="font-bold text-gray-900 mb-4">Resumo do Pedido</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({itemCount} {itemCount === 1 ? "item" : "itens"})</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Frete</span>
                  <span className="text-green-600 font-medium">A calcular</span>
                </div>
                <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-red-600">{formatPrice(total)}</span>
                </div>
              </div>
              <Button
                className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={() => {
                  if (!isAuthenticated) { window.location.href = '/login'; return; }
                  setAddress((a) => ({ ...a, recipient_name: user?.name ?? "" }));
                  setStep("address");
                }}
              >
                Continuar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              {!isAuthenticated && (
                <p className="text-xs text-gray-400 text-center mt-2">Você precisará fazer login para finalizar</p>
              )}
            </div>
          </div>
        )}

        {/* Step: Address */}
        {step === "address" && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome do destinatário *</Label>
                  <Input value={address.recipient_name} onChange={(e) => setAddress((a) => ({ ...a, recipient_name: e.target.value }))} placeholder="Nome completo" className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>CEP *</Label>
                  <Input value={address.zip_code} onChange={(e) => setAddress((a) => ({ ...a, zip_code: e.target.value }))} placeholder="00000-000" className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>Rua/Avenida *</Label>
                  <Input value={address.street} onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))} placeholder="Nome da rua" className="mt-1" />
                </div>
                <div>
                  <Label>Número *</Label>
                  <Input value={address.number} onChange={(e) => setAddress((a) => ({ ...a, number: e.target.value }))} placeholder="123" className="mt-1" />
                </div>
                <div>
                  <Label>Complemento</Label>
                  <Input value={address.complement} onChange={(e) => setAddress((a) => ({ ...a, complement: e.target.value }))} placeholder="Apto, sala..." className="mt-1" />
                </div>
                <div>
                  <Label>Bairro *</Label>
                  <Input value={address.neighborhood} onChange={(e) => setAddress((a) => ({ ...a, neighborhood: e.target.value }))} placeholder="Bairro" className="mt-1" />
                </div>
                <div>
                  <Label>Cidade *</Label>
                  <Input value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} placeholder="Cidade" className="mt-1" />
                </div>
                <div>
                  <Label>Estado *</Label>
                  <Input value={address.state} onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value.toUpperCase().slice(0, 2) }))} placeholder="SP" maxLength={2} className="mt-1" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep("cart")} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {
                    const required = ["recipient_name", "zip_code", "street", "number", "neighborhood", "city", "state"] as const;
                    const missing = required.filter((f) => !address[f]);
                    if (missing.length > 0) { toast.error("Preencha todos os campos obrigatórios."); return; }
                    setStep("confirm");
                  }}
                >
                  Continuar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && (
          <div className="max-w-2xl space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Endereço de Entrega</h3>
              <p className="text-sm text-gray-600">
                {address.recipient_name}<br />
                {address.street}, {address.number}{address.complement ? `, ${address.complement}` : ""}<br />
                {address.neighborhood} — {address.city}/{address.state}<br />
                CEP: {address.zip_code}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Itens do Pedido</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.quantity}x {item.name}</span>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-red-600">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("address")} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={handlePlaceOrder}
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? "Processando..." : "Confirmar Pedido"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
