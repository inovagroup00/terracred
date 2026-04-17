import { useEffect, useState, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@credshow/lib";
import type { UserRole } from "@credshow/types";

export interface AuthProfile {
  id: string;
  full_name: string | null;
  role: UserRole;
  event_id: string | null;
}

export interface AuthState {
  loading: boolean;
  user: User | null;
  profile: AuthProfile | null;
  error: string | null;
}

export function useAuth(): AuthState & {
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({
    loading: true,
    user: null,
    profile: null,
    error: null,
  });

  const loadProfile = useCallback(async (user: User) => {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("profiles")
      .select("id, full_name, role, event_id")
      .eq("id", user.id)
      .maybeSingle();
    if (error) {
      setState({ loading: false, user, profile: null, error: error.message });
      return;
    }
    if (!data) {
      setState({
        loading: false,
        user,
        profile: null,
        error: "Perfil nao encontrado para este usuario.",
      });
      return;
    }
    setState({
      loading: false,
      user,
      profile: data as AuthProfile,
      error: null,
    });
  }, []);

  const refresh = useCallback(async () => {
    const sb = getSupabase();
    const { data } = await sb.auth.getUser();
    if (!data.user) {
      setState({ loading: false, user: null, profile: null, error: null });
      return;
    }
    await loadProfile(data.user);
  }, [loadProfile]);

  useEffect(() => {
    void refresh();
    const sb = getSupabase();
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setState({ loading: false, user: null, profile: null, error: null });
        return;
      }
      void loadProfile(session.user);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [refresh, loadProfile]);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    await sb.auth.signOut();
    setState({ loading: false, user: null, profile: null, error: null });
  }, []);

  return { ...state, signOut, refresh };
}
