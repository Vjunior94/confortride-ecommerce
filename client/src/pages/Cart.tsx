import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft, CreditCard, QrCode, FileText, Copy, Check } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || "";

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

type Step = "cart" | "address" | "payment";
type PaymentMethod = "pix" | "credit_card" | "boleto";

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, total, itemCount } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("cart");
  const [address, setAddress] = useState({
    recipient_name: user?.name ?? "",
    zip_code: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "",
  });

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [cpf, setCpf] = useState("");
  const [cardData, setCardData] = useState({ number: "", expiry: "", cvv: "", holderName: "" });
  const [cardBrand, setCardBrand] = useState<{ id: string; name: string; thumbnail: string } | null>(null);
  const [issuerId, setIssuerId] = useState<string>("");
  const [installmentOptions, setInstallmentOptions] = useState<Array<{ installments: number; recommended_message: string }>>([]);
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mutations
  const createOrderMutation = trpc.orders.create.useMutation();
  const payWithCardMutation = trpc.orders.payWithCard.useMutation();
  const payWithPixMutation = trpc.orders.payWithPix.useMutation();
  const payWithBoletoMutation = trpc.orders.payWithBoleto.useMutation();

  // Card BIN lookup — detect brand and installments
  const rawCardNumber = cardData.number.replace(/\D/g, "");
  const cardBin = rawCardNumber.slice(0, 6);

  const lookupCardBrand = useCallback(async (bin: string) => {
    if (!MP_PUBLIC_KEY || !window.MercadoPago) return;
    try {
      const mp = new window.MercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });
      const methods = await mp.getPaymentMethods({ bin });
      if (methods.results.length > 0) {
        const method = methods.results[0];
        setCardBrand({ id: method.id, name: method.name, thumbnail: method.secure_thumbnail || method.thumbnail });

        const issuers = await mp.getIssuers({ paymentMethodId: method.id, bin });
        if (issuers.length > 0) setIssuerId(String(issuers[0].id));

        const installments = await mp.getInstallments({ amount: String(total), bin });
        if (installments.length > 0 && installments[0].payer_costs) {
          setInstallmentOptions(installments[0].payer_costs.map((c) => ({
            installments: c.installments,
            recommended_message: c.recommended_message,
          })));
        }
      }
    } catch {
      setCardBrand(null);
    }
  }, [total]);

  useEffect(() => {
    if (cardBin.length >= 6) {
      lookupCardBrand(cardBin);
    } else {
      setCardBrand(null);
      setInstallmentOptions([]);
      setSelectedInstallments(1);
    }
  }, [cardBin, lookupCardBrand]);

  // Process payment
  const handlePay = async () => {
    if (!isAuthenticated) { window.location.href = "/login"; return; }

    const rawCpf = cpf.replace(/\D/g, "");
    if (rawCpf.length !== 11) { toast.error("CPF inválido."); return; }

    if (paymentMethod === "credit_card") {
      if (!rawCardNumber || rawCardNumber.length < 13) { toast.error("Número do cartão inválido."); return; }
      if (!cardData.expiry || cardData.expiry.length < 5) { toast.error("Data de validade inválida."); return; }
      if (!cardData.cvv || cardData.cvv.length < 3) { toast.error("CVV inválido."); return; }
      if (!cardData.holderName.trim()) { toast.error("Nome do titular é obrigatório."); return; }
      if (!cardBrand) { toast.error("Bandeira do cartão não identificada."); return; }
      if (!window.MercadoPago) { toast.error("SDK de pagamento não carregado. Recarregue a página."); return; }
    }

    setIsProcessing(true);

    try {
      // Step 1: Create order if not yet created
      let currentOrderId = orderId;
      if (!currentOrderId) {
        const orderResult = await createOrderMutation.mutateAsync({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          shippingAddress: address,
        });
        currentOrderId = orderResult.orderId;
        setOrderId(currentOrderId);
        clearCart();
      }
      if (!currentOrderId) throw new Error("Erro ao criar pedido.");

      const payerName = user?.name ?? address.recipient_name;
      const payerEmail = user?.email ?? "";

      // Step 2: Process payment
      if (paymentMethod === "pix") {
        const result = await payWithPixMutation.mutateAsync({
          orderId: currentOrderId, payerEmail, payerCpf: rawCpf, payerName,
        });
        navigate(`/pagamento/pix?order_id=${currentOrderId}&qr=${encodeURIComponent(result.qrCode)}&qr_base64=${encodeURIComponent(result.qrCodeBase64)}`);

      } else if (paymentMethod === "credit_card") {
        const mp = new window.MercadoPago!(MP_PUBLIC_KEY, { locale: "pt-BR" });
        const [expMonth, expYear] = cardData.expiry.split("/");
        const tokenResult = await mp.createCardToken({
          cardNumber: rawCardNumber,
          cardholderName: cardData.holderName,
          cardExpirationMonth: expMonth,
          cardExpirationYear: expYear.length === 2 ? `20${expYear}` : expYear,
          securityCode: cardData.cvv,
          identificationType: "CPF",
          identificationNumber: rawCpf,
        });

        const result = await payWithCardMutation.mutateAsync({
          orderId: currentOrderId,
          token: tokenResult.id,
          installments: selectedInstallments,
          paymentMethodId: cardBrand!.id,
          issuerId: issuerId || undefined,
          payerEmail, payerCpf: rawCpf, payerName,
        });

        if (result.status === "approved") {
          navigate(`/pagamento/sucesso?order_id=${currentOrderId}`);
        } else if (result.status === "in_process" || result.status === "pending") {
          navigate(`/pagamento/pendente?order_id=${currentOrderId}`);
        } else {
          navigate(`/pagamento/falha?order_id=${currentOrderId}&detail=${encodeURIComponent(result.statusDetail)}`);
        }

      } else if (paymentMethod === "boleto") {
        const result = await payWithBoletoMutation.mutateAsync({
          orderId: currentOrderId, payerEmail, payerCpf: rawCpf, payerName,
        });
        navigate(`/pagamento/boleto?order_id=${currentOrderId}&url=${encodeURIComponent(result.boletoUrl)}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar pagamento.");
    } finally {
      setIsProcessing(false);
    }
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

  const stepNames = ["cart", "address", "payment"] as const;
  const stepLabels = { cart: "Carrinho", address: "Endereço", payment: "Pagamento" };
  const stepTitles = { cart: "MEU CARRINHO", address: "ENDEREÇO DE ENTREGA", payment: "PAGAMENTO" };

  return (
    <div className="min-h-screen pt-16 bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {stepTitles[step]}
        </h1>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-8">
          {stepNames.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step === s ? "bg-red-600 text-white" : i < stepNames.indexOf(step) ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                {i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${step === s ? "text-red-600 font-medium" : "text-gray-400"}`}>
                {stepLabels[s]}
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
                  if (!isAuthenticated) { window.location.href = "/login"; return; }
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
                    setStep("payment");
                  }}
                >
                  Continuar <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Payment */}
        {step === "payment" && (
          <div className="max-w-2xl space-y-4">
            {/* Order summary */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-3">Resumo do Pedido</h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-500 text-xs">
                  {address.street}, {address.number} — {address.city}/{address.state}
                </p>
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between">
                    <span className="text-gray-700">{item.quantity}x {item.name}</span>
                    <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-red-600">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Payment method selector */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Forma de Pagamento</h3>

              <div className="grid grid-cols-3 gap-2 mb-6">
                {([
                  { id: "pix" as const, label: "PIX", icon: QrCode },
                  { id: "credit_card" as const, label: "Cartão", icon: CreditCard },
                  { id: "boleto" as const, label: "Boleto", icon: FileText },
                ]).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setPaymentMethod(id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors ${
                      paymentMethod === id ? "border-red-600 bg-red-50 text-red-600" : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>

              {/* CPF — common to all methods */}
              <div className="mb-4">
                <Label>CPF *</Label>
                <Input
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="mt-1"
                  maxLength={14}
                />
              </div>

              {/* Credit card fields */}
              {paymentMethod === "credit_card" && (
                <div className="space-y-4">
                  <div>
                    <Label>Número do cartão *</Label>
                    <div className="relative">
                      <Input
                        value={cardData.number}
                        onChange={(e) => setCardData((d) => ({ ...d, number: formatCardNumber(e.target.value) }))}
                        placeholder="0000 0000 0000 0000"
                        className="mt-1 pr-14"
                        maxLength={19}
                      />
                      {cardBrand && (
                        <img src={cardBrand.thumbnail} alt={cardBrand.name} className="absolute right-3 top-1/2 -translate-y-1/2 h-6 mt-0.5" />
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Validade *</Label>
                      <Input
                        value={cardData.expiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                          if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
                          setCardData((d) => ({ ...d, expiry: v }));
                        }}
                        placeholder="MM/AA"
                        className="mt-1"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <Label>CVV *</Label>
                      <Input
                        value={cardData.cvv}
                        onChange={(e) => setCardData((d) => ({ ...d, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                        placeholder="123"
                        className="mt-1"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Nome no cartão *</Label>
                    <Input
                      value={cardData.holderName}
                      onChange={(e) => setCardData((d) => ({ ...d, holderName: e.target.value.toUpperCase() }))}
                      placeholder="NOME COMO NO CARTÃO"
                      className="mt-1"
                    />
                  </div>
                  {installmentOptions.length > 1 && (
                    <div>
                      <Label>Parcelas</Label>
                      <select
                        value={selectedInstallments}
                        onChange={(e) => setSelectedInstallments(Number(e.target.value))}
                        className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                      >
                        {installmentOptions.map((opt) => (
                          <option key={opt.installments} value={opt.installments}>
                            {opt.recommended_message}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* PIX info */}
              {paymentMethod === "pix" && (
                <div className="bg-green-50 rounded-lg p-4 text-sm text-green-800">
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <QrCode className="h-4 w-4" /> Pagamento instantâneo via PIX
                  </div>
                  <p className="text-green-700">
                    Após confirmar, você receberá um QR Code para pagamento. A confirmação é automática.
                  </p>
                </div>
              )}

              {/* Boleto info */}
              {paymentMethod === "boleto" && (
                <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                  <div className="flex items-center gap-2 font-medium mb-1">
                    <FileText className="h-4 w-4" /> Pagamento via boleto bancário
                  </div>
                  <p className="text-blue-700">
                    O boleto será gerado após a confirmação. O prazo de compensação é de 1 a 3 dias úteis.
                  </p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("address")} className="flex-1" disabled={isProcessing}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={handlePay}
                disabled={isProcessing}
              >
                {isProcessing ? "Processando..." : `Pagar ${formatPrice(total)}`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
