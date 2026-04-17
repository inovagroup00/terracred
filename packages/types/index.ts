export type { Database, Json } from "./database";

// Tipos de dominio derivados/utilitarios

export type EventStatus = "draft" | "active" | "closed";

export type TransactionStatus =
  | "pending_onboarding"
  | "awaiting_activation"
  | "activated"
  | "cancelled"
  | "expired";

export type UserRole = "admin" | "cashier";

export interface BureauQueryResponse {
  bureau_query_id: string;
  approved: boolean;
  approved_limit: number | null;
  reason: string | null;
}

export interface SmsResponse {
  success: boolean;
  phone: string;
  sms_link_token: string;
  client_link: string;
  expires_at: string;
}

export interface OnboardingContext {
  bureau_query_id: string;
  cpf_masked: string;
  approved_limit: number;
  event: {
    id: string;
    name: string;
    venue: string;
    event_date: string;
  };
  existing_transaction: { id: string; status: TransactionStatus; qr_code: string | null } | null;
}

export interface AddressInput {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface CreateTransactionInput {
  sms_link_token: string;
  full_name: string;
  email: string;
  document_photo_url: string;
  selfie_url: string;
  chosen_amount: number;
  installments: 1 | 2 | 3;
  terms_accepted: boolean;
}

export interface CreateTransactionResponse {
  transaction_id: string;
  status: TransactionStatus;
  chosen_amount: number;
  installments: number;
  installment_value: number;
  first_due_date: string;
}

export interface PromoterActivateInput {
  promoter_token: string;
  transaction_id: string;
  comanda_ref?: string;
}

export interface PromoterActivateResponse {
  success: boolean;
  transaction_id: string;
  status: TransactionStatus;
  activated_at: string;
  chosen_amount: number;
}

export interface PromoterCancelInput {
  promoter_token: string;
  transaction_id: string;
  reason?: string;
}

export interface PromoterCancelResponse {
  success: boolean;
  transaction_id: string;
  status: TransactionStatus;
}
