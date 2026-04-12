import { useState } from "react";
import { useParams, useSearch, Link } from "wouter";
import { CheckCircle, Clock, XCircle, ShoppingBag, Copy, Check, QrCode, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

type PaymentStatus = "sucesso" | "pendente" | "falha" | "pix" | "boleto";

export default function PaymentResult() {
  const params = useParams<{ status: string }>();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const orderId = searchParams.get("order_id");
  const status = (params.status as PaymentStatus) ?? "falha";

  // PIX data
  const qrCode = searchParams.get("qr") ?? "";
  const qrCodeBase64 = searchParams.get("qr_base64") ?? "";

  // Boleto data
  const boletoUrl = searchParams.get("url") ?? "";

  // Card failure detail
  const failDetail = searchParams.get("detail") ?? "";

  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── PIX Result ──
  if (status === "pix") {
    return (
      <div className="min-h-screen pt-16 bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
            <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <QrCode className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Pague com PIX</h1>
            <p className="text-gray-500 text-sm mb-6">
              Escaneie o QR Code ou copie o código abaixo
            </p>

            {orderId && (
              <p className="text-xs text-gray-400 mb-4">Pedido <span className="font-semibold">#{orderId}</span></p>
            )}

            {/* QR Code image */}
            {qrCodeBase64 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 inline-block">
                <img
                  src={`data:image/png;base64,${qrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-48 h-48 mx-auto"
                />
              </div>
            )}

            {/* Copy-paste code */}
            {qrCode && (
              <div className="mb-6">
                <p className="text-xs text-gray-500 mb-2">Código PIX (Copia e Cola)</p>
                <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                  <code className="text-xs text-gray-700 flex-1 break-all text-left line-clamp-3">{qrCode}</code>
                  <button
                    onClick={() => handleCopy(qrCode)}
                    className="shrink-0 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    title="Copiar código"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-500" />}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-700 mb-6">
              Após o pagamento, a confirmação é automática. Você será notificado.
            </div>

            <div className="space-y-3">
              <Link href="/minha-conta/pedidos">
                <Button variant="outline" className="w-full">
                  <ShoppingBag className="mr-2 h-4 w-4" /> Ver meus pedidos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Boleto Result ──
  if (status === "boleto") {
    return (
      <div className="min-h-screen pt-16 bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
            <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Boleto gerado!</h1>
            <p className="text-gray-500 text-sm mb-6">
              Seu boleto foi gerado com sucesso. O prazo de compensação é de 1 a 3 dias úteis.
            </p>

            {orderId && (
              <p className="text-xs text-gray-400 mb-4">Pedido <span className="font-semibold">#{orderId}</span></p>
            )}

            <div className="space-y-3">
              {boletoUrl && (
                <a href={boletoUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    <ExternalLink className="mr-2 h-4 w-4" /> Abrir Boleto
                  </Button>
                </a>
              )}
              <Link href="/minha-conta/pedidos">
                <Button variant="outline" className="w-full">
                  <ShoppingBag className="mr-2 h-4 w-4" /> Ver meus pedidos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Card Results: sucesso, pendente, falha ──
  const configs = {
    sucesso: {
      icon: CheckCircle, iconColor: "text-green-500", bgColor: "bg-green-50",
      title: "Pagamento confirmado!",
      description: "Seu pedido está sendo processado. Você receberá atualizações sobre o envio.",
    },
    pendente: {
      icon: Clock, iconColor: "text-yellow-500", bgColor: "bg-yellow-50",
      title: "Pagamento em análise",
      description: "Seu pagamento está sendo processado. Você será notificado quando for confirmado.",
    },
    falha: {
      icon: XCircle, iconColor: "text-red-500", bgColor: "bg-red-50",
      title: "Pagamento não aprovado",
      description: failDetail
        ? `Motivo: ${failDetail.replace(/_/g, " ")}. Tente com outro cartão ou método de pagamento.`
        : "Houve um problema com seu pagamento. Tente novamente com outro cartão ou método.",
    },
  };

  const config = configs[status as keyof typeof configs] ?? configs.falha;
  const Icon = config.icon;

  return (
    <div className="min-h-screen pt-16 bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className={`${config.bgColor} rounded-2xl p-8 text-center`}>
          <Icon className={`h-16 w-16 ${config.iconColor} mx-auto mb-4`} />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{config.title}</h1>
          <p className="text-gray-600 mb-6">{config.description}</p>

          {orderId && (
            <p className="text-sm text-gray-500 mb-6">
              Pedido <span className="font-semibold">#{orderId}</span>
            </p>
          )}

          <div className="space-y-3">
            {status === "falha" && orderId && (
              <Link href="/carrinho">
                <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold">
                  Tentar novamente
                </Button>
              </Link>
            )}
            <Link href="/minha-conta/pedidos">
              <Button variant="outline" className="w-full">
                <ShoppingBag className="mr-2 h-4 w-4" /> Ver meus pedidos
              </Button>
            </Link>
            <Link href="/produtos">
              <Button variant="ghost" className="w-full text-gray-500">
                Continuar comprando
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
