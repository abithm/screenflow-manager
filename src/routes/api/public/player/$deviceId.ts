import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function admin() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

export const Route = createFileRoute("/api/public/player/$deviceId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const supabase = admin();
        let { data: screen } = await supabase
          .from("screens")
          .select("id, current_playlist_id, playlists(id, version)")
          .eq("device_id", params.deviceId)
          .maybeSingle();

        // Auto-register unknown device.
        if (!screen) {
          const { data: inserted } = await supabase
            .from("screens")
            .insert({ device_id: params.deviceId, screen_name: `New device ${params.deviceId.slice(0, 6)}`, status: "unknown" })
            .select("id, current_playlist_id, playlists(id, version)")
            .single();
          screen = inserted;
        }

        const playlistId = screen?.current_playlist_id;
        if (!playlistId) {
          return Response.json({ version: 0, playlist: [] });
        }

        const { data: items } = await supabase
          .from("playlist_items")
          .select("display_duration, order_number, media(type, file_url)")
          .eq("playlist_id", playlistId)
          .order("order_number");

        const playlist = (items ?? []).map((it) => ({
          type: (it.media as any)?.type ?? "image",
          url: (it.media as any)?.file_url ?? "",
          duration: it.display_duration,
        }));
        const version = (screen?.playlists as any)?.version ?? 1;
        return Response.json({ version, playlist });
      },
    },
  },
});
