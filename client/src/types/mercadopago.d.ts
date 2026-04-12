/** Type declarations for Mercado Pago JS SDK v2 (loaded via script tag) */

interface MercadoPagoCardTokenData {
  cardNumber: string;
  cardholderName: string;
  cardExpirationMonth: string;
  cardExpirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
}

interface MercadoPagoPaymentMethod {
  id: string;
  name: string;
  payment_type_id: string;
  thumbnail: string;
  secure_thumbnail: string;
}

interface MercadoPagoIssuer {
  id: string;
  name: string;
}

interface MercadoPagoInstallmentOption {
  installments: number;
  installment_rate: number;
  installment_amount: number;
  total_amount: number;
  recommended_message: string;
}

interface MercadoPagoInstallmentResult {
  payment_method_id: string;
  payment_type_id: string;
  issuer: { id: string; name: string };
  payer_costs: MercadoPagoInstallmentOption[];
}

interface MercadoPagoInstance {
  createCardToken(data: MercadoPagoCardTokenData): Promise<{ id: string }>;
  getPaymentMethods(data: { bin: string }): Promise<{ results: MercadoPagoPaymentMethod[] }>;
  getIssuers(data: { paymentMethodId: string; bin: string }): Promise<MercadoPagoIssuer[]>;
  getInstallments(data: { amount: string; bin: string }): Promise<MercadoPagoInstallmentResult[]>;
}

interface Window {
  MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
}
