// Mock do bureau de credito. Recebe CPF + promoter_token, valida token, simula consulta.
// Regra mock: ultimo digito do CPF par => aprovado (limite 200-1000); impar => reprovado.

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

interface Body {
  promoter_token: string;
  cpf: string;
}

function cleanCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { promoter_token, cpf: rawCpf } = (await req.json()) as Body;
    const cpf = cleanCpf(rawCpf ?? "");

    if (!promoter_token || cpf.length !== 11) {
      return jsonResponse({ error: "invalid_input", message: "promoter_token e cpf (11 digitos) obrigatorios" }, 400);
    }

    const sb = getServiceClient();

    // valida token
    const { data: token, error: tokenErr } = await sb
      .from("event_promoter_tokens")
      .select("id, event_id, active, events(status)")
      .eq("token", promoter_token)
      .maybeSingle();

    if (tokenErr || !token) {
      return jsonResponse({ error: "invalid_token", message: "Token invalido" }, 401);
    }
    if (!token.active) {
      return jsonResponse({ error: "token_inactive", message: "Token desativado" }, 403);
    }
    // @ts-ignore events can be array or object
    const eventStatus = Array.isArray(token.events) ? token.events[0]?.status : token.events?.status;
    if (eventStatus !== "active") {
      return jsonResponse({ error: "event_not_active", message: "Evento nao esta ativo" }, 403);
    }

    // mock bureau
    const lastDigit = parseInt(cpf[cpf.length - 1], 10);
    const approved = lastDigit % 2 === 0;
    let approvedLimit: number | null = null;
    let reason: string | null = null;

    if (approved) {
      // limite 200 a 1000 em steps de 100
      const options = [200, 300, 400, 500, 600, 700, 800, 900, 1000];
      approvedLimit = options[Math.floor(Math.random() * options.length)];
    } else {
      reason = "Score insuficiente para pre-aprovacao";
    }

    const { data: query, error: insertErr } = await sb
      .from("bureau_queries")
      .insert({
        event_id: token.event_id,
        promoter_token_id: token.id,
        cpf,
        approved,
        approved_limit: approvedLimit,
        reason,
      })
      .select("id, approved, approved_limit, reason")
      .single();

    if (insertErr) {
      return jsonResponse({ error: "db_error", message: insertErr.message }, 500);
    }

    return jsonResponse({
      bureau_query_id: query.id,
      approved: query.approved,
      approved_limit: query.approved_limit,
      reason: query.reason,
    });
  } catch (err) {
    return jsonResponse({ error: "unexpected", message: String(err) }, 500);
  }
});
