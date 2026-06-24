import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, ListMusic, Trash2, GripVertical } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/playlists")({
  component: PlaylistsPage,
});

function PlaylistsPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

  const { data: playlists = [] } = useQuery({
    queryKey: ["playlists-full"],
    queryFn: async () => (await supabase.from("playlists").select("*, playlist_items(id)").order("created_at", { ascending: false })).data ?? [],
  });

  const current = playlists.find((p) => p.id === selected) ?? playlists[0];

  return (
    <AppShell title="Playlists" description={`${playlists.length} playlists`} actions={isAdmin && <NewPlaylistDialog />}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-3 lg:col-span-1">
          {playlists.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`w-full text-left rounded-md px-3 py-2.5 flex items-center gap-3 transition-colors ${current?.id === p.id ? "bg-accent" : "hover:bg-accent/50"}`}
            >
              <ListMusic className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground">v{p.version} · {(p.playlist_items as any[])?.length ?? 0} items</div>
              </div>
            </button>
          ))}
          {!playlists.length && <div className="p-6 text-center text-sm text-muted-foreground">No playlists yet</div>}
        </Card>
        <div className="lg:col-span-2">
          {current ? <PlaylistEditor playlistId={current.id} canEdit={isAdmin} onChange={() => qc.invalidateQueries({ queryKey: ["playlists-full"] })} /> : <Card className="p-10 text-center text-sm text-muted-foreground">Select a playlist</Card>}
        </div>
      </div>
    </AppShell>
  );
}

function PlaylistEditor({ playlistId, canEdit, onChange }: { playlistId: string; canEdit: boolean; onChange: () => void }) {
  const qc = useQueryClient();
  const { data: items = [], refetch } = useQuery({
    queryKey: ["playlist-items", playlistId],
    queryFn: async () => (await supabase.from("playlist_items").select("*, media(*)").eq("playlist_id", playlistId).order("order_number")).data ?? [],
  });
  const { data: media = [] } = useQuery({
    queryKey: ["media-options"],
    queryFn: async () => (await supabase.from("media").select("id,title,type").order("title")).data ?? [],
  });
  const [picker, setPicker] = useState("");
  const [duration, setDuration] = useState(10);

  const add = useMutation({
    mutationFn: async () => {
      const order = items.length;
      const { error } = await supabase.from("playlist_items").insert({ playlist_id: playlistId, media_id: picker, display_duration: duration, order_number: order });
      if (error) throw error;
      await supabase.from("playlists").update({ version: (items.length > 0 ? 1 : 1) + 1 }).eq("id", playlistId);
    },
    onSuccess: () => { refetch(); qc.invalidateQueries({ queryKey: ["playlists-full"] }); onChange(); setPicker(""); toast.success("Added"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("playlist_items").delete().eq("id", id); },
    onSuccess: () => { refetch(); qc.invalidateQueries({ queryKey: ["playlists-full"] }); },
  });

  return (
    <Card className="p-5">
      {canEdit && (
        <div className="flex gap-2 mb-4">
          <Select value={picker} onValueChange={setPicker}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Pick media…" /></SelectTrigger>
            <SelectContent>
              {media.map((m) => <SelectItem key={m.id} value={m.id}>{m.title} · {m.type}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" min={1} value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 10)} className="w-24" />
          <Button onClick={() => add.mutate()} disabled={!picker}>Add</Button>
        </div>
      )}
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={it.id} className="flex items-center gap-3 rounded-md border border-border p-3 bg-card/50">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <div className="w-6 text-xs text-muted-foreground font-mono">{i + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{(it.media as any)?.title ?? "—"}</div>
              <div className="text-xs text-muted-foreground">{(it.media as any)?.type} · {it.display_duration}s</div>
            </div>
            {canEdit && <button onClick={() => remove.mutate(it.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>}
          </div>
        ))}
        {!items.length && <div className="p-8 text-center text-sm text-muted-foreground">Empty playlist</div>}
      </div>
    </Card>
  );
}

function NewPlaylistDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("playlists").insert({ name, description: desc });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["playlists-full"] }); setOpen(false); setName(""); setDesc(""); toast.success("Created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New playlist</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New playlist</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Description</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
        </div>
        <DialogFooter><Button disabled={!name || create.isPending} onClick={() => create.mutate()}>Create</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
