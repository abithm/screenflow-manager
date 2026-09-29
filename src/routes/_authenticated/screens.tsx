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
                <StatusPill online={on} />
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
              {isAdmin && (
                <div className="mt-4 grid grid-cols-2 gap-2">
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
    </AppShell>
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
