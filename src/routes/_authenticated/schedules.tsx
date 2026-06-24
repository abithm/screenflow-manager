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
import { Plus, Trash2, CalendarClock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/schedules")({
  component: SchedulesPage,
});

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function SchedulesPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data: schedules = [] } = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => (await supabase.from("schedules").select("*, screens(screen_name), playlists(name)").order("start_time", { ascending: false })).data ?? [],
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("schedules").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["schedules"] }); toast.success("Removed"); },
  });

  return (
    <AppShell title="Schedules" description={`${schedules.length} scheduled assignments`} actions={isAdmin && <NewScheduleDialog />}>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground border-b border-border">
            <tr>
              <th className="text-left font-medium p-4">Screen</th>
              <th className="text-left font-medium p-4">Playlist</th>
              <th className="text-left font-medium p-4">Window</th>
              <th className="text-left font-medium p-4">Days</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id} className="border-b border-border/50 hover:bg-accent/30">
                <td className="p-4 font-medium">{(s.screens as any)?.screen_name ?? "—"}</td>
                <td className="p-4 text-muted-foreground">{(s.playlists as any)?.name ?? "—"}</td>
                <td className="p-4 text-xs text-muted-foreground font-mono">{format(new Date(s.start_time), "MMM d, HH:mm")} → {format(new Date(s.end_time), "MMM d, HH:mm")}</td>
                <td className="p-4">
                  <div className="flex gap-0.5">
                    {DAYS.map((d, i) => (
                      <span key={i} className={`text-[10px] w-7 text-center py-0.5 rounded ${s.active_days.includes(i) ? "bg-primary/20 text-primary" : "text-muted-foreground/40"}`}>{d}</span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-right">
                  {isAdmin && <button onClick={() => del.mutate(s.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>}
                </td>
              </tr>
            ))}
            {!schedules.length && (
              <tr><td colSpan={5} className="p-10 text-center text-sm text-muted-foreground"><CalendarClock className="h-6 w-6 mx-auto mb-2 opacity-40" />No schedules yet</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </AppShell>
  );
}

function NewScheduleDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [screenId, setScreenId] = useState("");
  const [playlistId, setPlaylistId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const { data: screens = [] } = useQuery({ queryKey: ["screens-opt"], queryFn: async () => (await supabase.from("screens").select("id,screen_name").order("screen_name")).data ?? [] });
  const { data: playlists = [] } = useQuery({ queryKey: ["playlists-opt"], queryFn: async () => (await supabase.from("playlists").select("id,name").order("name")).data ?? [] });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("schedules").insert({ screen_id: screenId, playlist_id: playlistId, start_time: new Date(start).toISOString(), end_time: new Date(end).toISOString(), active_days: days });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["schedules"] }); setOpen(false); toast.success("Schedule created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = (d: number) => setDays((arr) => arr.includes(d) ? arr.filter((x) => x !== d) : [...arr, d].sort());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New schedule</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Schedule playlist</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Screen</Label>
            <Select value={screenId} onValueChange={setScreenId}>
              <SelectTrigger><SelectValue placeholder="Select screen" /></SelectTrigger>
              <SelectContent>{screens.map((s) => <SelectItem key={s.id} value={s.id}>{s.screen_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Playlist</Label>
            <Select value={playlistId} onValueChange={setPlaylistId}>
              <SelectTrigger><SelectValue placeholder="Select playlist" /></SelectTrigger>
              <SelectContent>{playlists.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start</Label><Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div><Label>End</Label><Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
          </div>
          <div>
            <Label>Active days</Label>
            <div className="flex gap-1 mt-1">
              {DAYS.map((d, i) => (
                <button key={i} type="button" onClick={() => toggle(i)} className={`flex-1 text-xs py-2 rounded border ${days.includes(i) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>{d}</button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter><Button disabled={!screenId || !playlistId || !start || !end || create.isPending} onClick={() => create.mutate()}>Create</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
