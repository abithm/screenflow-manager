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
        const body = (await request.json()) as { device_id?: string; status?: string; storage_available?: string; app_version?: string };
        if (!body.device_id) return new Response("device_id required", { status: 400 });
        const supabase = admin();
        await supabase.from("heartbeats").insert({
          device_id: body.device_id,
          status: body.status ?? "online",
          storage_available: body.storage_available,
          app_version: body.app_version,
        });
        await supabase.from("screens").update({
          last_seen: new Date().toISOString(),
          status: "online",
          app_version: body.app_version ?? null,
        }).eq("device_id", body.device_id);
        return Response.json({ ok: true });
      },
    },
  },
});
