// Promotor cancela transacao (cliente desistiu, erro de cadastro, etc).

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

interface Body {
  promoter_token: string;
  transaction_id: string;
  reason?: string;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { promoter_token, transaction_id, reason } = (await req.json()) as Body;
    if (!promoter_token || !transaction_id) return jsonResponse({ error: "invalid_input" }, 400);

    const sb = getServiceClient();

    const { data: token } = await sb
      .from("event_promoter_tokens")
      .select("id, event_id, active")
      .eq("token", promoter_token)
      .maybeSingle();
    if (!token || !token.active) return jsonResponse({ error: "invalid_token" }, 401);

    const { data: tx } = await sb
      .from("transactions")
      .select("id, status, event_id")
      .eq("id", transaction_id)
      .maybeSingle();
    if (!tx) return jsonResponse({ error: "not_found" }, 404);
    if (tx.event_id !== token.event_id) return jsonResponse({ error: "wrong_event" }, 403);
    if (tx.status === "activated") return jsonResponse({ error: "already_activated" }, 409);
    if (tx.status === "cancelled") return jsonResponse({ error: "already_cancelled" }, 409);

    const { error: uErr } = await sb
      .from("transactions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason ?? "Cancelado pelo promotor",
      })
      .eq("id", tx.id);
    if (uErr) return jsonResponse({ error: "db_error", message: uErr.message }, 500);

    await sb.from("transaction_events").insert({
      transaction_id: tx.id,
      event_type: "cancelled",
      actor_role: "promoter",
      metadata: { promoter_token_id: token.id, reason: reason ?? null },
    });

    return jsonResponse({ success: true, transaction_id: tx.id, status: "cancelled" });
  } catch (err) {
    return jsonResponse({ error: "unexpected", message: String(err) }, 500);
  }
});
