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
        const { data: screen } = await supabase
          .from("screens")
          .select("id, is_paired, current_playlist_id, playlists(id, version)")
          .eq("device_id", params.deviceId)
          .maybeSingle();

        // Unknown or unpaired device: send it back to the pairing screen.
        if (!screen || !screen.is_paired) {
          return Response.json({ paired: false, action: "reset_to_pairing", version: 0, playlist: [] });
        }

        const playlistId = screen.current_playlist_id;
        if (!playlistId) {
          return Response.json({ paired: true, status: "ready", version: 0, playlist: [] });
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
