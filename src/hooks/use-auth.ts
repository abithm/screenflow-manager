import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "super_admin" | "admin" | "viewer";

// Shared across pages so switching tabs doesn't re-fetch the session and roles.
let cachedUser: User | null = null;

export function useAuth() {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [sessionLoading, setSessionLoading] = useState(cachedUser === null);

  useEffect(() => {
    let mounted = true;
    if (!cachedUser) {
      supabase.auth.getSession().then(({ data }) => {
        if (!mounted) return;
        cachedUser = data.session?.user ?? null;
        setUser(cachedUser);
        setSessionLoading(false);
      });
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const next = session?.user ?? null;
      if (next?.id === cachedUser?.id) return;
      cachedUser = next;
      if (mounted) setUser(next);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["my-roles", user?.id],
    enabled: !!user,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      return (data ?? []).map((r) => r.role as AppRole);
    },
  });

  const hasRole = (r: AppRole) => roles.includes(r);
  const isAdmin = hasRole("admin") || hasRole("super_admin");
  const isSuper = hasRole("super_admin");

  return { user, roles, loading: sessionLoading || (!!user && rolesLoading), hasRole, isAdmin, isSuper };
}
