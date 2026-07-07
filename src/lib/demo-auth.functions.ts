import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DEMO_ACCOUNTS = {
  admin: { email: "admin@demo.signal.app", password: "demo-admin-2026", role: "super_admin" as const, name: "Demo Admin" },
  user: { email: "viewer@demo.signal.app", password: "demo-viewer-2026", role: "viewer" as const, name: "Demo Viewer" },
};

export const ensureDemoAccount = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ kind: z.enum(["admin", "user"]) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const acct = DEMO_ACCOUNTS[data.kind];

    // Find or create the user
    let userId: string | undefined;
    const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listErr) throw listErr;
    const existing = list.users.find((u) => u.email?.toLowerCase() === acct.email);
    if (existing) {
      userId = existing.id;
      // Reset password so demo login always works
      await supabaseAdmin.auth.admin.updateUserById(existing.id, { password: acct.password, email_confirm: true });
    } else {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: acct.email,
        password: acct.password,
        email_confirm: true,
        user_metadata: { display_name: acct.name },
      });
      if (createErr) throw createErr;
      userId = created.user?.id;
    }

    if (!userId) throw new Error("Failed to provision demo account");

    // Ensure role
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: acct.role }, { onConflict: "user_id,role" });

    return { email: acct.email, password: acct.password };
  });
