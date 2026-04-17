// Cliente abre com ?t=<sms_link_token>. Essa funcao retorna o contexto pra onboarding.
// Retorna: approved_limit, cpf mascarado, evento, status atual (caso ja tenha transacao criada).

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

interface Body {
  sms_link_token: string;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { sms_link_token } = (await req.json()) as Body;
    if (!sms_link_token) {
      return jsonResponse({ error: "invalid_input" }, 400);
    }

    const sb = getServiceClient();

    const { data: query, error } = await sb
      .from("bureau_queries")
      .select("id, cpf, approved, approved_limit, sms_link_expires_at, event_id, events(name, venue, event_date, status)")
      .eq("sms_link_token", sms_link_token)
      .maybeSingle();

    if (error || !query) {
      return jsonResponse({ error: "not_found", message: "Link invalido" }, 404);
    }
    if (!query.approved) {
      return jsonResponse({ error: "not_approved" }, 403);
    }
    if (query.sms_link_expires_at && new Date(query.sms_link_expires_at) < new Date()) {
      return jsonResponse({ error: "expired", message: "Link expirado" }, 410);
    }

    // ja existe transacao pra esse bureau_query?
    const { data: tx } = await sb
      .from("transactions")
      .select("id, status, qr_code")
      .eq("bureau_query_id", query.id)
      .maybeSingle();

    // mascara CPF: mostra so os 3 primeiros e 2 ultimos
    const cpf = query.cpf ?? "";
    const cpfMasked = cpf.length === 11 ? `${cpf.slice(0, 3)}.***.***-${cpf.slice(9)}` : cpf;

    // @ts-ignore
    const event = Array.isArray(query.events) ? query.events[0] : query.events;

    return jsonResponse({
      bureau_query_id: query.id,
      cpf_masked: cpfMasked,
      approved_limit: query.approved_limit,
      event: {
        id: query.event_id,
        name: event?.name,
        venue: event?.venue,
        event_date: event?.event_date,
      },
      existing_transaction: tx ? { id: tx.id, status: tx.status, qr_code: tx.qr_code } : null,
    });
  } catch (err) {
    return jsonResponse({ error: "unexpected", message: String(err) }, 500);
  }
});
