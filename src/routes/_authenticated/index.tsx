import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MonitorPlay, Wifi, WifiOff, ListMusic, Image as ImageIcon, AlertTriangle, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Suspense } from "react";

export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <AppShell title="Dashboard" description="Real-time overview of your screen network">
      <Suspense fallback={<div className="text-muted-foreground text-sm">Loading…</div>}>
        <DashboardBody />
      </Suspense>
    </AppShell>
  );
}

function DashboardBody() {
  const { data: screens } = useSuspenseQuery({
    queryKey: ["screens"],
    queryFn: async () => {
      const { data } = await supabase.from("screens").select("*, stores(name)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: counts } = useSuspenseQuery({
    queryKey: ["counts"],
    queryFn: async () => {
      const [media, playlists] = await Promise.all([
        supabase.from("media").select("id", { count: "exact", head: true }),
        supabase.from("playlists").select("id", { count: "exact", head: true }),
      ]);
      return { media: media.count ?? 0, playlists: playlists.count ?? 0 };
    },
  });
  const { data: heartbeats } = useQuery({
    queryKey: ["recent-heartbeats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("heartbeats")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const total = screens.length;
  const online = screens.filter((s) => isOnline(s.last_seen)).length;
  const offline = total - online;
  const lastSync = screens.reduce<Date | null>((acc, s) => {
    if (!s.last_seen) return acc;
    const d = new Date(s.last_seen);
    return !acc || d > acc ? d : acc;
  }, null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={MonitorPlay} label="Total Screens" value={total} tone="default" />
        <Kpi icon={Wifi} label="Online" value={online} tone="success" />
        <Kpi icon={WifiOff} label="Offline" value={offline} tone="destructive" />
        <Kpi icon={ListMusic} label="Active Playlists" value={counts.playlists} tone="default" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-semibold">Screens</h2>
              <p className="text-xs text-muted-foreground">{total} devices · last sync {lastSync ? formatDistanceToNow(lastSync, { addSuffix: true }) : "never"}</p>
            </div>
            <Badge variant="outline" className="font-mono text-xs">live</Badge>
          </div>
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left font-medium py-2 px-5">Screen</th>
                  <th className="text-left font-medium py-2">Store</th>
                  <th className="text-left font-medium py-2">Status</th>
                  <th className="text-left font-medium py-2 px-5">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {screens.slice(0, 8).map((s) => {
                  const on = isOnline(s.last_seen);
                  return (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-accent/30">
                      <td className="py-3 px-5">
                        <div className="font-medium">{s.screen_name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{s.device_id.slice(0, 14)}</div>
                      </td>
                      <td className="py-3 text-muted-foreground">{(s.stores as any)?.name ?? "—"}</td>
                      <td className="py-3"><StatusPill online={on} /></td>
                      <td className="py-3 px-5 text-muted-foreground text-xs">
                        {s.last_seen ? formatDistanceToNow(new Date(s.last_seen), { addSuffix: true }) : "never"}
                      </td>
                    </tr>
                  );
                })}
                {!screens.length && (
                  <tr><td colSpan={4} className="p-10 text-center text-sm text-muted-foreground">No screens registered yet. Devices appear here automatically on first boot.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold">Recent activity</h2>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <ul className="space-y-3">
            {(heartbeats ?? []).map((h) => (
              <li key={h.id} className="flex items-start gap-3 text-sm">
                <span className="status-dot text-success mt-1.5" />
                <div className="min-w-0">
                  <div className="truncate"><span className="font-mono text-xs text-muted-foreground">{h.device_id.slice(0, 10)}</span> heartbeat</div>
                  <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(h.created_at), { addSuffix: true })} · v{h.app_version ?? "?"}</div>
                </div>
              </li>
            ))}
            {!heartbeats?.length && (
              <li className="text-sm text-muted-foreground flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> No heartbeats received yet.</li>
            )}
          </ul>
          <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground flex justify-between">
            <span>{counts.media} media items</span>
            <span>{counts.playlists} playlists</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

function isOnline(lastSeen: string | null) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 2 * 60 * 1000;
}

function Kpi({ icon: Icon, label, value, tone }: { icon: typeof MonitorPlay; label: string; value: number; tone: "default" | "success" | "destructive" }) {
  const ring = tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "text-primary";
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${ring}`} />
      </div>
      <div className="font-display text-3xl font-semibold">{value.toLocaleString()}</div>
    </Card>
  );
}

export function StatusPill({ online }: { online: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-xs font-medium ${online ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
      <span className={`status-dot ${online ? "text-success" : "text-destructive"}`} />
      {online ? "Online" : "Offline"}
    </span>
  );
}
