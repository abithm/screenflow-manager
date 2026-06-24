import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function admin() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

export const Route = createFileRoute("/api/public/screenshot")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { device_id?: string; screenshot_url?: string };
        if (!body.device_id || !body.screenshot_url) return new Response("missing fields", { status: 400 });
        const supabase = admin();
        await supabase.from("screenshots").insert({ device_id: body.device_id, screenshot_url: body.screenshot_url });
        await supabase.from("screens").update({ screenshot_url: body.screenshot_url }).eq("device_id", body.device_id);
        return Response.json({ ok: true });
      },
    },
  },
});
