import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function admin() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

export const Route = createFileRoute("/api/public/heartbeat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          device_id?: string; status?: string; storage_available?: string; app_version?: string;
          now_playing?: { url?: string; type?: string; name?: string; started_at?: string } | null;
          now_playing_only?: boolean;
        };
        if (!body.device_id || typeof body.device_id !== "string" || body.device_id.length > 200)
          return new Response("device_id required", { status: 400 });
        const supabase = admin();
        const np = body.now_playing;
        const npPatch = body.now_playing !== undefined ? {
          now_playing_url: np?.url?.slice(0, 2000) ?? null,
          now_playing_type: np?.type?.slice(0, 20) ?? null,
          now_playing_name: np?.name?.slice(0, 300) ?? null,
          now_playing_started_at: np?.started_at ?? null,
        } : {};
        if (!body.now_playing_only) {
          await supabase.from("heartbeats").insert({
            device_id: body.device_id,
            status: body.status ?? "online",
            storage_available: body.storage_available,
            app_version: body.app_version,
          });
        }
        await supabase.from("screens").update({
          last_seen: new Date().toISOString(),
          status: "online",
          ...(body.app_version ? { app_version: body.app_version } : {}),
          ...npPatch,
        }).eq("device_id", body.device_id);
        return Response.json({ ok: true });
      },
    },
  },
});
