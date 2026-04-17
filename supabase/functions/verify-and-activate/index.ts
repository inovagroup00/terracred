// Caixa digita o PIN do cliente. Se bater, ativa a transacao.
// Rate limit: 3 tentativas, depois lock de 15 min.

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { verifyPin } from "../_shared/hash.ts";

interface Body {
  qr_code: string;
  pin: string;
}

const MAX_ATTEMPTS = 3;
const LOCK_MINUTES = 15;

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = req.headers.get("Authorization");
    const jwt = authHeader?.replace(/^Bearer\s+/i, "");
    if (!jwt) return jsonResponse({ error: "unauthorized" }, 401);

    const sb = getServiceClient();
    const { data: userData, error: authErr } = await sb.auth.getUser(jwt);
    if (authErr || !userData?.user) return jsonResponse({ error: "unauthorized", message: authErr?.message }, 401);
    const { data: profile } = await sb
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (!profile || profile.role !== "cashier") {
      return jsonResponse({ error: "forbidden" }, 403);
    }

    const { qr_code, pin } = (await req.json()) as Body;
    if (!qr_code || !pin || !/^\d{4}$/.test(pin)) {
      return jsonResponse({ error: "invalid_input" }, 400);
    }

    const { data: tx, error } = await sb
      .from("transactions")
      .select("id, pin_hash, pin_attempts, pin_locked_until, status")
      .eq("qr_code", qr_code)
      .maybeSingle();

    if (error || !tx) return jsonResponse({ error: "not_found" }, 404);

    if (tx.status !== "awaiting_activation") {
      return jsonResponse({ error: "wrong_status", message: `Status atual: ${tx.status}` }, 409);
    }

    if (tx.pin_locked_until && new Date(tx.pin_locked_until) > new Date()) {
      return jsonResponse({
        error: "locked",
        message: "Bloqueado por excesso de tentativas",
        locked_until: tx.pin_locked_until,
      }, 423);
    }

    const valid = await verifyPin(pin, tx.pin_hash ?? "");
    if (!valid) {
      const attempts = (tx.pin_attempts ?? 0) + 1;
      const update: Record<string, unknown> = { pin_attempts: attempts };
      let locked = false;
      if (attempts >= MAX_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        update.pin_locked_until = lockUntil.toISOString();
        locked = true;
      }
      await sb.from("transactions").update(update).eq("id", tx.id);
      await sb.from("transaction_events").insert({
        transaction_id: tx.id,
        event_type: locked ? "pin_locked" : "pin_failed",
        actor_id: userData.user.id,
        actor_role: "cashier",
        metadata: { attempt: attempts },
      });
      return jsonResponse({
        error: locked ? "locked" : "invalid_pin",
        attempts,
        attempts_left: Math.max(0, MAX_ATTEMPTS - attempts),
      }, locked ? 423 : 401);
    }

    // ok — ativa
    const { data: activated, error: actErr } = await sb
      .from("transactions")
      .update({
        status: "activated",
        activated_at: new Date().toISOString(),
        activated_by_cashier_id: userData.user.id,
        pin_attempts: 0,
        pin_locked_until: null,
      })
      .eq("id", tx.id)
      .select("id, status, activated_at, chosen_amount")
      .single();

    if (actErr) {
      return jsonResponse({ error: "db_error", message: actErr.message }, 500);
    }

    await sb.from("transaction_events").insert({
      transaction_id: tx.id,
      event_type: "activated",
      actor_id: userData.user.id,
      actor_role: "cashier",
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
