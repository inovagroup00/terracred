import { useEffect, useState } from "react";
import { fnGetOnboardingContext } from "@credshow/lib";
import type { OnboardingContext } from "@credshow/types";

export type OnboardingFetchState =
  | { status: "loading" }
  | { status: "ready"; data: OnboardingContext }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "error"; message: string };

export function useOnboardingContext(token: string | null): OnboardingFetchState {
  const [state, setState] = useState<OnboardingFetchState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setState({ status: "invalid" });
      return;
    }

    setState({ status: "loading" });
    fnGetOnboardingContext(token)
      .then((data) => {
        if (cancelled) return;
        setState({ status: "ready", data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const raw = (err as { message?: string })?.message ?? "";
        const msg = raw.toLowerCase();
        if (msg.includes("expired") || msg.includes("expirad")) {
          setState({ status: "expired" });
        } else if (
          msg.includes("invalid") ||
          msg.includes("not found") ||
          msg.includes("invalid_token") ||
          msg.includes("inval")
        ) {
          setState({ status: "invalid" });
        } else {
          setState({ status: "error", message: raw || "Erro ao validar o link" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return state;
}
