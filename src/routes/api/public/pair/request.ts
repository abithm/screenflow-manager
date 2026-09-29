import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

function admin() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

const bodySchema = z.object({ device_id: z.string().min(3).max(128) });

const PIN_TTL_MS = 15 * 60 * 1000;

function randomPin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const Route = createFileRoute("/api/public/pair/request")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = bodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });

        const supabase = admin();
        const deviceId = parsed.data.device_id;

        let { data: screen } = await supabase
          .from("screens")
          .select("id, is_paired, pairing_code, pairing_code_expires_at")
          .eq("device_id", deviceId)
          .maybeSingle();

        if (!screen) {
          const { data: inserted, error } = await supabase
            .from("screens")
            .insert({ device_id: deviceId, screen_name: `Unpaired ${deviceId.slice(0, 6)}`, status: "unknown" })
            .select("id, is_paired, pairing_code, pairing_code_expires_at")
            .single();
          if (error) return Response.json({ error: "Could not register device" }, { status: 500 });
          screen = inserted;
        }

        if (screen.is_paired) {
          return Response.json({ paired: true, status: "ready", poll_interval_seconds: 30 });
        }

        // Reuse an unexpired code so a TV restart doesn't confuse staff mid-pairing.
        const existingValid =
          screen.pairing_code &&
          screen.pairing_code_expires_at &&
          new Date(screen.pairing_code_expires_at).getTime() > Date.now();

        if (existingValid) {
          return Response.json({
            paired: false,
            pairing_code: screen.pairing_code,
            expires_at: screen.pairing_code_expires_at,
            poll_interval_seconds: 3,
          });
        }

        let code = randomPin();
        let expiresAt = new Date(Date.now() + PIN_TTL_MS).toISOString();
        for (let attempt = 0; attempt < 8; attempt++) {
          const { error } = await supabase
            .from("screens")
            .update({ pairing_code: code, pairing_code_expires_at: expiresAt })
            .eq("id", screen.id);
          if (!error) {
            return Response.json({
              paired: false,
              pairing_code: code,
              expires_at: expiresAt,
              poll_interval_seconds: 3,
            });
          }
          code = randomPin();
          expiresAt = new Date(Date.now() + PIN_TTL_MS).toISOString();
        }

        return Response.json({ error: "Could not allocate pairing code" }, { status: 503 });
      },
    },
  },
});
