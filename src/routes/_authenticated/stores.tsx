import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Store as StoreIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/stores")({
  component: StoresPage,
});

function StoresPage() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data: stores = [] } = useQuery({
    queryKey: ["stores-full"],
    queryFn: async () => {
      const { data } = await supabase.from("stores").select("*, screens(id)").order("name");
      return data ?? [];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stores-full"] }); toast.success("Removed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Stores" description={`${stores.length} locations`} actions={isAdmin && <StoreDialog />}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((s) => (
          <Card key={s.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-primary/15 text-primary flex items-center justify-center"><StoreIcon className="h-4 w-4" /></div>
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{[s.city, s.country].filter(Boolean).join(", ") || "—"}</div>
                </div>
              </div>
              {isAdmin && (
                <Button variant="ghost" size="icon" onClick={() => confirm(`Delete ${s.name}?`) && del.mutate(s.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <dl className="text-xs space-y-1 text-muted-foreground">
              <div className="flex justify-between"><dt>Address</dt><dd className="text-foreground text-right truncate max-w-[180px]">{s.address ?? "—"}</dd></div>
              <div className="flex justify-between"><dt>Timezone</dt><dd className="text-foreground font-mono">{s.timezone}</dd></div>
              <div className="flex justify-between"><dt>Screens</dt><dd className="text-foreground">{(s.screens as any[])?.length ?? 0}</dd></div>
            </dl>
          </Card>
        ))}
        {!stores.length && <Card className="p-10 col-span-full text-center text-sm text-muted-foreground">No stores yet.</Card>}
      </div>
    </AppShell>
  );
}

function StoreDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", city: "", country: "", timezone: "UTC" });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("stores").insert(form);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["stores-full"] }); setOpen(false); setForm({ name: "", address: "", city: "", country: "", timezone: "UTC" }); toast.success("Store created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add store</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New store</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><Label>Country</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
          </div>
          <div><Label>Timezone</Label><Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} /></div>
        </div>
        <DialogFooter><Button disabled={!form.name || create.isPending} onClick={() => create.mutate()}>Create</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
