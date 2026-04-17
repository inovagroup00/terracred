import { useEffect, useState } from "react";
import { getSupabase } from "@credshow/lib";

export interface PromoterEvent {
  id: string;
  name: string;
  venue: string;
  event_date: string;
  status: string;
}

export interface PromoterTokenInfo {
  id: string;
  token: string;
  promoter_name: string | null;
  active: boolean;
  expires_at: string | null;
  event: PromoterEvent;
}

export type PromoterTokenState =
  | { loading: true; valid: false; error: null; data: null }
  | { loading: false; valid: true; error: null; data: PromoterTokenInfo }
  | { loading: false; valid: false; error: string; data: null };

export function usePromoterToken(token: string | null): PromoterTokenState {
  const [state, setState] = useState<PromoterTokenState>({
    loading: true,
    valid: false,
    error: null,
    data: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!token || token.trim() === "") {
        if (!cancelled) {
          setState({ loading: false, valid: false, error: "Token ausente", data: null });
        }
        return;
      }

      try {
        const sb = getSupabase();
        const { data, error } = await sb
          .from("event_promoter_tokens")
          .select(
            "id, token, promoter_name, active, expires_at, event_id, events ( id, name, venue, event_date, status )"
          )
          .eq("token", token)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          setState({
            loading: false,
            valid: false,
            error: "Falha ao validar token. Verifique sua conexao.",
            data: null,
          });
          return;
        }

        if (!data) {
          setState({
            loading: false,
            valid: false,
            error: "Token invalido ou evento encerrado",
            data: null,
          });
          return;
        }

        const eventRel = (data as unknown as { events: PromoterEvent | null }).events;

        if (!data.active) {
          setState({
            loading: false,
            valid: false,
            error: "Token invalido ou evento encerrado",
            data: null,
          });
          return;
        }

        if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
          setState({
            loading: false,
            valid: false,
            error: "Token expirado",
            data: null,
          });
          return;
        }

        if (!eventRel || eventRel.status !== "active") {
          setState({
            loading: false,
            valid: false,
            error: "Token invalido ou evento encerrado",
            data: null,
          });
          return;
        }

        setState({
          loading: false,
          valid: true,
          error: null,
          data: {
            id: data.id,
            token: data.token,
            promoter_name: data.promoter_name,
            active: data.active,
            expires_at: data.expires_at,
            event: eventRel,
          },
        });
      } catch {
        if (!cancelled) {
          setState({
            loading: false,
            valid: false,
            error: "Erro inesperado ao validar token",
            data: null,
          });
        }
      }
    }

    setState({ loading: true, valid: false, error: null, data: null });
    void check();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return state;
}
