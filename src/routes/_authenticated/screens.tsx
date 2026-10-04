import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, MonitorPlay, Link2, Unlink } from "lucide-react";
import { StatusPill } from "./index";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { LiveViewDialog } from "@/components/live-view-dialog";

export const Route = createFileRoute("/_authenticated/screens")({
  component: ScreensPage,
});

function ScreensPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data: screens = [] } = useQuery({
    queryKey: ["screens"],
    queryFn: async () => {
      const { data } = await supabase.from("screens").select("*, stores(name), playlists(name)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => (await supabase.from("stores").select("id,name").order("name")).data ?? [],
  });
  const { data: playlists = [] } = useQuery({
    queryKey: ["playlists"],
    queryFn: async () => (await supabase.from("playlists").select("id,name").order("name")).data ?? [],
  });

  const isOn = (ls: string | null) => !!ls && Date.now() - new Date(ls).getTime() < 2 * 60 * 1000;

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: { store_id?: string | null; current_playlist_id?: string | null } }) => {
      const { error } = await supabase.from("screens").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["screens"] }); toast.success("Updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const unpair = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("screens")
        .update({ is_paired: false, paired_at: null, pairing_code: null, pairing_code_expires_at: null, current_playlist_id: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["screens"] }); toast.success("Screen unpaired — it will show a new PIN"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell
      title="Screens"
      description={`${screens.length} devices`}
      actions={isAdmin && (
        <div className="flex gap-2">
          <PairScreenDialog />
          <RegisterScreenDialog />
        </div>
      )}
    >

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {screens.map((s) => {
          const on = isOn(s.last_seen);
          return (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.screen_name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{s.device_id}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusPill online={on} />
                  {!s.is_paired && (
                    <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-warning">
                      {s.pairing_code ? `PIN ${s.pairing_code.slice(0, 3)}-${s.pairing_code.slice(3)}` : "Unpaired"}
                    </span>
                  )}
                </div>

              </div>
              <div className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center overflow-hidden">
                {s.screenshot_url
                  ? <img src={s.screenshot_url} alt="" className="w-full h-full object-cover" />
                  : <MonitorPlay className="h-8 w-8 text-muted-foreground/40" />}
              </div>
              <dl className="grid grid-cols-2 gap-y-1 text-xs text-muted-foreground">
                <dt>Store</dt><dd className="text-foreground text-right truncate">{(s.stores as any)?.name ?? "—"}</dd>
                <dt>Playlist</dt><dd className="text-foreground text-right truncate">{(s.playlists as any)?.name ?? "—"}</dd>
                <dt>Last seen</dt><dd className="text-foreground text-right">{s.last_seen ? formatDistanceToNow(new Date(s.last_seen), { addSuffix: true }) : "never"}</dd>
                <dt>App</dt><dd className="text-foreground text-right font-mono">{s.app_version ?? "—"}</dd>
              </dl>
              {s.is_paired && (
                <div className="mt-3"><LiveViewDialog screenId={s.id} screenName={s.screen_name} /></div>
              )}
              {isAdmin && (
                <div className="mt-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                  <Select value={s.store_id ?? "none"} onValueChange={(v) => update.mutate({ id: s.id, patch: { store_id: v === "none" ? null : v } })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Store" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No store</SelectItem>
                      {stores.map((st) => <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={s.current_playlist_id ?? "none"} onValueChange={(v) => update.mutate({ id: s.id, patch: { current_playlist_id: v === "none" ? null : v } })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Playlist" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No playlist</SelectItem>
                      {playlists.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  </div>
                  {s.is_paired && (
                    <Button variant="ghost" size="sm" className="h-7 w-full text-xs text-muted-foreground"
                      onClick={() => unpair.mutate(s.id)} disabled={unpair.isPending}>
                      <Unlink className="h-3.5 w-3.5 mr-1" /> Unpair screen
                    </Button>
                  )}
                </div>
              )}

            </Card>
          );
        })}
        {!screens.length && (
          <Card className="p-10 col-span-full text-center text-sm text-muted-foreground">
            No screens yet. Players auto-register on first boot, or add one manually.
          </Card>
        )}
      </div>
      <PairingHistory />
    </AppShell>
  );
}

function PairingHistory() {
  const { data: events = [] } = useQuery({
    queryKey: ["pairing-events"],
    queryFn: async () => {
      const { data } = await supabase.from("pairing_events").select("*").order("created_at", { ascending: false }).limit(50);
      const ids = [...new Set((data ?? []).map((e) => e.actor_id).filter(Boolean))] as string[];
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, display_name, email").in("id", ids)
        : { data: [] as { id: string; display_name: string | null; email: string | null }[] };
      const map = new Map((profs ?? []).map((p) => [p.id, p.display_name || p.email]));
      return (data ?? []).map((e) => ({ ...e, actor: e.actor_id ? map.get(e.actor_id) ?? "Unknown" : "System" }));
    },
    refetchInterval: 15000,
  });
  return (
    <Card className="mt-8 p-5">
      <h2 className="font-display text-lg mb-3">Pairing activity</h2>
      {events.length ? (
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground text-left">
            <tr><th className="py-2">When</th><th>Screen</th><th>Action</th><th>By</th></tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <td className="py-2 text-muted-foreground">{formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}</td>
                <td><div>{e.screen_name}</div><div className="text-xs text-muted-foreground font-mono">{e.device_id}</div></td>
                <td>
                  <span className={`text-xs rounded px-2 py-0.5 ${e.action === "paired" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {e.action}
                  </span>
                </td>
                <td>{e.actor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-muted-foreground">No pairing activity yet.</p>
      )}
    </Card>
  );
}

function PairScreenDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [storeId, setStoreId] = useState("none");

  const { data: stores = [] } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => (await supabase.from("stores").select("id,name").order("name")).data ?? [],
  });

  const digits = pin.replace(/\D/g, "").slice(0, 6);
  const pretty = digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits;

  const pair = useMutation({
    mutationFn: async () => {
      const { data: match, error } = await supabase
        .from("screens")
        .select("id, screen_name, pairing_code_expires_at, is_paired")
        .eq("pairing_code", digits)
        .maybeSingle();
      if (error) throw error;
      if (!match || match.is_paired) throw new Error("That PIN is not valid. Check the code on the screen.");
      if (!match.pairing_code_expires_at || new Date(match.pairing_code_expires_at).getTime() <= Date.now()) {
        throw new Error("That PIN has expired. The screen will show a new one shortly.");
      }
      const { error: upErr } = await supabase
        .from("screens")
        .update({
          is_paired: true,
          paired_at: new Date().toISOString(),
          pairing_code: null,
          pairing_code_expires_at: null,
          screen_name: name || match.screen_name,
          store_id: storeId === "none" ? null : storeId,
        })
        .eq("id", match.id);
      if (upErr) throw upErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["screens"] });
      setOpen(false); setPin(""); setName(""); setStoreId("none");
      toast.success("Screen paired");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary"><Link2 className="h-4 w-4 mr-1" /> Pair screen</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Pair a new screen</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>6-digit code shown on the TV</Label>
            <Input
              value={pretty}
              onChange={(e) => setPin(e.target.value)}
              inputMode="numeric"
              placeholder="482-910"
              className="text-center text-2xl tracking-[0.3em] font-mono h-14"
            />
          </div>
          <div><Label>Screen name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Front Entrance TV" /></div>
          <div>
            <Label>Store</Label>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No store</SelectItem>
                {stores.map((st) => <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => pair.mutate()} disabled={digits.length !== 6 || pair.isPending}>
            {pair.isPending ? "Pairing…" : "Pair screen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function RegisterScreenDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [deviceId, setDeviceId] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const id = deviceId || `dev-${crypto.randomUUID().slice(0, 8)}`;
      const { error } = await supabase.from("screens").insert({ screen_name: name, device_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["screens"] });
      setOpen(false); setName(""); setDeviceId("");
      toast.success("Screen added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add screen</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Register screen</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Screen name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Lobby TV" /></div>
          <div><Label>Device ID</Label><Input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="auto-generated if blank" /></div>
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={!name || create.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
