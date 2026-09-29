import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function admin() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

export const Route = createFileRoute("/api/public/pair/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const deviceId = new URL(request.url).searchParams.get("device_id");
        if (!deviceId) return Response.json({ error: "device_id required" }, { status: 400 });

        const supabase = admin();
        const { data: screen } = await supabase
          .from("screens")
          .select("id, screen_name, is_paired, pairing_code_expires_at, current_playlist_id, stores(name)")
          .eq("device_id", deviceId)
          .maybeSingle();

        if (!screen) {
          return Response.json({ paired: false, status: "unregistered", action: "reset_to_pairing" });
        }

        if (!screen.is_paired) {
          const expired =
            !screen.pairing_code_expires_at ||
            new Date(screen.pairing_code_expires_at).getTime() <= Date.now();
          return Response.json({
            paired: false,
            status: expired ? "expired" : "pending",
            action: "reset_to_pairing",
          });
        }

        return Response.json({
          paired: true,
          status: "ready",
          screen_id: screen.id,
          screen_name: screen.screen_name,
          store_name: (screen.stores as any)?.name ?? null,
          has_playlist: !!screen.current_playlist_id,
        });
      },
    },
  },
});
