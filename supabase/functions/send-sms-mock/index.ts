// Mock de envio de SMS. Atualiza bureau_query com phone + sms_link_token, retorna a URL.
// Nao manda SMS de verdade — so loga a URL que normalmente iria no texto.

import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { randomSmsToken } from "../_shared/hash.ts";

interface Body {
  bureau_query_id: string;
  phone: string;
  client_base_url?: string;
}

function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { bureau_query_id, phone: rawPhone, client_base_url } = (await req.json()) as Body;
    const phone = cleanPhone(rawPhone ?? "");

    if (!bureau_query_id || phone.length < 10) {
      return jsonResponse({ error: "invalid_input", message: "bureau_query_id e phone (minimo 10 digitos) obrigatorios" }, 400);
    }

    const sb = getServiceClient();

    const { data: query, error: queryErr } = await sb
      .from("bureau_queries")
      .select("id, approved, sms_link_token")
      .eq("id", bureau_query_id)
      .maybeSingle();

    if (queryErr || !query) {
      return jsonResponse({ error: "not_found", message: "Consulta nao encontrada" }, 404);
    }
    if (!query.approved) {
      return jsonResponse({ error: "not_approved", message: "Consulta nao aprovada" }, 403);
    }

    const smsLinkToken = query.sms_link_token ?? randomSmsToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30min

    const { error: updateErr } = await sb
      .from("bureau_queries")
      .update({
        phone,
        sms_sent_at: new Date().toISOString(),
        sms_link_token: smsLinkToken,
        sms_link_expires_at: expiresAt.toISOString(),
      })
      .eq("id", bureau_query_id);

    if (updateErr) {
      return jsonResponse({ error: "db_error", message: updateErr.message }, 500);
    }

    const baseUrl = client_base_url ?? "https://TerraCred-cliente.vercel.app";
    const link = `${baseUrl}/?t=${smsLinkToken}`;

    console.log(`[SMS MOCK] to=${phone} link=${link}`);

    return jsonResponse({
      success: true,
      phone,
      sms_link_token: smsLinkToken,
      client_link: link,
      expires_at: expiresAt.toISOString(),
    });
  } catch (err) {
    return jsonResponse({ error: "unexpected", message: String(err) }, 500);
  }
});
