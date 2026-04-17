// Promotor confirma que colocou o credito na comanda do cliente.
// Valida o promoter token, atualiza transacao para "activated".

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

interface Body {
  promoter_token: string;
  transaction_id: string;
  comanda_ref?: string; // opcional: numero da comanda/mesa
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { promoter_token, transaction_id, comanda_ref } = (await req.json()) as Body;
    if (!promoter_token || !transaction_id) {
      return jsonResponse({ error: "invalid_input" }, 400);
    }

    const sb = getServiceClient();

    const { data: token, error: tErr } = await sb
      .from("event_promoter_tokens")
      .select("id, event_id, active")
      .eq("token", promoter_token)
      .maybeSingle();
    if (tErr || !token || !token.active) {
      return jsonResponse({ error: "invalid_token" }, 401);
    }

    const { data: tx, error: txErr } = await sb
      .from("transactions")
      .select("id, status, event_id, chosen_amount")
      .eq("id", transaction_id)
      .maybeSingle();
    if (txErr || !tx) return jsonResponse({ error: "not_found" }, 404);
    if (tx.event_id !== token.event_id) {
      return jsonResponse({ error: "wrong_event" }, 403);
    }
    if (tx.status !== "awaiting_activation") {
      return jsonResponse({ error: "wrong_status", current: tx.status }, 409);
    }

    const { data: activated, error: aErr } = await sb
      .from("transactions")
      .update({
        status: "activated",
        activated_at: new Date().toISOString(),
        activated_by_promoter_token_id: token.id,
      })
      .eq("id", tx.id)
      .select("id, status, activated_at, chosen_amount")
      .single();
    if (aErr) return jsonResponse({ error: "db_error", message: aErr.message }, 500);

    await sb.from("transaction_events").insert({
      transaction_id: tx.id,
      event_type: "activated",
      actor_role: "promoter",
      metadata: { promoter_token_id: token.id, comanda_ref: comanda_ref ?? null },
    });

    return jsonResponse({
      success: true,
      transaction_id: activated.id,
      status: activated.status,
      activated_at: activated.activated_at,
      chosen_amount: activated.chosen_amount,
    });
  } catch (err) {
    return jsonResponse({ error: "unexpected", message: String(err) }, 500);
  }
});
