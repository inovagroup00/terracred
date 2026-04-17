// Caixa escaneia QR. Retorna dados basicos da transacao pra exibir antes do PIN.
// Requer auth como cashier.

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

interface Body {
  qr_code: string;
}

function cpfMask(cpf: string): string {
  return cpf.length === 11 ? `${cpf.slice(0, 3)}.***.***-${cpf.slice(9)}` : cpf;
}

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
      .select("role, event_id")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (!profile || profile.role !== "cashier") {
      return jsonResponse({ error: "forbidden", message: "Requer perfil de caixa" }, 403);
    }

    const { qr_code } = (await req.json()) as Body;
    if (!qr_code) return jsonResponse({ error: "invalid_input" }, 400);

    const { data: tx, error } = await sb
      .from("transactions")
      .select("id, cpf, full_name, chosen_amount, installments, installment_value, status, event_id, pin_attempts, pin_locked_until")
      .eq("qr_code", qr_code)
      .maybeSingle();

    if (error || !tx) return jsonResponse({ error: "not_found" }, 404);
    if (profile.event_id && tx.event_id !== profile.event_id) {
      return jsonResponse({ error: "wrong_event", message: "Transacao de outro evento" }, 403);
    }

    await sb.from("transaction_events").insert({
      transaction_id: tx.id,
      event_type: "qr_scanned",
      actor_id: userData.user.id,
      actor_role: "cashier",
    });

    return jsonResponse({
      transaction_id: tx.id,
      cpf_masked: cpfMask(tx.cpf),
      full_name: tx.full_name,
      chosen_amount: tx.chosen_amount,
      installments: tx.installments,
      installment_value: tx.installment_value,
      status: tx.status,
      pin_locked: tx.pin_locked_until ? new Date(tx.pin_locked_until) > new Date() : false,
    });
  } catch (err) {
    return jsonResponse({ error: "unexpected", message: String(err) }, 500);
  }
});
