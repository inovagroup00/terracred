// Cliente termina onboarding: cria transacao com status awaiting_activation.
// SEM PIN, SEM QR — promotor que ativa manualmente depois.

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

interface Body {
  sms_link_token: string;
  full_name: string;
  email: string;
  document_photo_url: string;
  selfie_url: string;
  chosen_amount: number;
  installments: number;
  terms_accepted: boolean;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const body = (await req.json()) as Body;
    if (!body.sms_link_token) return jsonResponse({ error: "invalid_input" }, 400);
    if (!body.terms_accepted) return jsonResponse({ error: "terms_required" }, 400);
    if (![1, 2, 3].includes(body.installments)) {
      return jsonResponse({ error: "invalid_installments" }, 400);
    }
    if (!body.document_photo_url || !body.selfie_url) {
      return jsonResponse({ error: "documents_required", message: "Documento e selfie obrigatorios" }, 400);
    }

    const sb = getServiceClient();

    const { data: query, error: qErr } = await sb
      .from("bureau_queries")
      .select("id, cpf, phone, approved, approved_limit, event_id, sms_link_expires_at, promoter_token_id")
      .eq("sms_link_token", body.sms_link_token)
      .maybeSingle();

    if (qErr || !query) return jsonResponse({ error: "not_found" }, 404);
    if (!query.approved) return jsonResponse({ error: "not_approved" }, 403);
    if (query.sms_link_expires_at && new Date(query.sms_link_expires_at) < new Date()) {
      return jsonResponse({ error: "expired" }, 410);
    }
    if (body.chosen_amount <= 0 || body.chosen_amount > (query.approved_limit ?? 0)) {
      return jsonResponse({ error: "invalid_amount" }, 400);
    }

    const { data: existing } = await sb
      .from("transactions")
      .select("id, status")
      .eq("bureau_query_id", query.id)
      .maybeSingle();
    if (existing) {
      return jsonResponse({ error: "already_exists", transaction_id: existing.id, status: existing.status }, 409);
    }

    const installmentValue = Number((body.chosen_amount / body.installments).toFixed(2));
    // Padrao TerraCred: vencimentos sempre dia 10. Primeira parcela = dia 10 do proximo mes.
    // Se pedido feito ate dia 3 do mes, primeira cobranca pode ser dia 10 do mesmo mes.
    const today = new Date();
    const firstMonthOffset = today.getDate() <= 3 ? 0 : 1;
    const firstDue = new Date(today.getFullYear(), today.getMonth() + firstMonthOffset, 10);

    const { data: tx, error: txErr } = await sb
      .from("transactions")
      .insert({
        bureau_query_id: query.id,
        event_id: query.event_id,
        cpf: query.cpf,
        phone: query.phone,
        full_name: body.full_name,
        email: body.email,
        document_photo_url: body.document_photo_url,
        selfie_url: body.selfie_url,
        chosen_amount: body.chosen_amount,
        installments: body.installments,
        installment_value: installmentValue,
        first_due_date: firstDue.toISOString().slice(0, 10),
        terms_accepted_at: new Date().toISOString(),
        status: "awaiting_activation",
      })
      .select("id, status, chosen_amount, installments, installment_value, first_due_date")
      .single();

    if (txErr) return jsonResponse({ error: "db_error", message: txErr.message }, 500);

    await sb.from("transaction_events").insert({
      transaction_id: tx.id,
      event_type: "onboarding_completed",
      actor_role: "client",
      metadata: { installments: body.installments, amount: body.chosen_amount },
    });

    return jsonResponse({
      transaction_id: tx.id,
      status: tx.status,
      chosen_amount: tx.chosen_amount,
      installments: tx.installments,
      installment_value: tx.installment_value,
      first_due_date: tx.first_due_date,
    });
  } catch (err) {
    return jsonResponse({ error: "unexpected", message: String(err) }, 500);
  }
});
