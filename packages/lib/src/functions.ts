import { getSupabase } from "./supabase";
import type {
  BureauQueryResponse,
  SmsResponse,
  OnboardingContext,
  CreateTransactionInput,
  CreateTransactionResponse,
  PromoterActivateInput,
  PromoterActivateResponse,
  PromoterCancelInput,
  PromoterCancelResponse,
} from "@credshow/types";

async function callFn<TBody, TResp>(name: string, body: TBody): Promise<TResp> {
  const sb = getSupabase();
  const { data, error } = await sb.functions.invoke<TResp>(name, { body });
  if (error) {
    let detail: unknown = null;
    try {
      // @ts-ignore
      detail = await error.context?.json?.();
    } catch {}
    throw Object.assign(new Error(error.message), { detail });
  }
  if (!data) throw new Error(`${name}: resposta vazia`);
  return data;
}

export const fnBureauMock = (promoter_token: string, cpf: string) =>
  callFn<{ promoter_token: string; cpf: string }, BureauQueryResponse>(
    "bureau-mock",
    { promoter_token, cpf }
  );

export const fnSendSms = (bureau_query_id: string, phone: string, client_base_url?: string) =>
  callFn<{ bureau_query_id: string; phone: string; client_base_url?: string }, SmsResponse>(
    "send-sms-mock",
    { bureau_query_id, phone, client_base_url }
  );

export const fnGetOnboardingContext = (sms_link_token: string) =>
  callFn<{ sms_link_token: string }, OnboardingContext>(
    "get-onboarding-context",
    { sms_link_token }
  );

export const fnCreateTransaction = (input: CreateTransactionInput) =>
  callFn<CreateTransactionInput, CreateTransactionResponse>("create-transaction", input);

export const fnPromoterActivate = (input: PromoterActivateInput) =>
  callFn<PromoterActivateInput, PromoterActivateResponse>("promoter-activate", input);

export const fnPromoterCancel = (input: PromoterCancelInput) =>
  callFn<PromoterCancelInput, PromoterCancelResponse>("promoter-cancel", input);
