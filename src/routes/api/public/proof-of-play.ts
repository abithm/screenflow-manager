import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function admin() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

export const Route = createFileRoute("/api/public/proof-of-play")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { device_id?: string; media_name?: string; start_time?: string; end_time?: string };
        if (!body.device_id || !body.media_name || !body.start_time) return new Response("missing fields", { status: 400 });
        const supabase = admin();
        await supabase.from("proof_of_play").insert({
          device_id: body.device_id,
          media_name: body.media_name,
          start_time: body.start_time,
          end_time: body.end_time ?? null,
        });
        return Response.json({ ok: true });
      },
    },
  },
});
