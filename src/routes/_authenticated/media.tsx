import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Upload, Trash2, Film, Image as ImageIcon, FileText, Link as LinkIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/media")({
  component: MediaPage,
});

const TYPE_ICON: Record<string, typeof Film> = { video: Film, image: ImageIcon, pdf: FileText, url: LinkIcon };

async function uploadMediaFile(path: string, file: File, onProgress: (percentage: number) => void) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (!supabaseUrl || !publishableKey || !accessToken) {
    throw new Error("Your session has expired. Sign in again to upload media.");
  }

  const encodedPath = path.split("/").map(encodeURIComponent).join("/");

  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${supabaseUrl}/storage/v1/object/media/${encodedPath}`);
    request.setRequestHeader("Authorization", `Bearer ${accessToken}`);
    request.setRequestHeader("apikey", publishableKey);
    request.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    request.setRequestHeader("x-upsert", "false");

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve();
        return;
      }

      try {
        const response = JSON.parse(request.responseText) as { message?: string; error?: string };
        reject(new Error(response.message ?? response.error ?? "Upload failed"));
      } catch {
        reject(new Error(request.responseText || "Upload failed"));
      }
    };
    request.send(file);
  });
}

function MediaPage() {
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const { data: media = [] } = useQuery({
    queryKey: ["media"],
    queryFn: async () => {
      const rows = (await supabase.from("media").select("*").order("created_at", { ascending: false })).data ?? [];
      return Promise.all(
        rows.map(async (m) => {
          if (!m.file_url?.startsWith("media:")) return m;
          const { data } = await supabase.storage.from("media").createSignedUrl(m.file_url.slice(6), 3600);
          return { ...m, file_url: data?.signedUrl ?? m.file_url };
        }),
      );
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("media").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["media"] }); toast.success("Removed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Media Library" description={`${media.length} items`} actions={isAdmin && <UploadDialog userId={user?.id} />}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {media.map((m) => {
          const Icon = TYPE_ICON[m.type] ?? ImageIcon;
          return (
            <Card key={m.id} className="overflow-hidden group">
              <div className="aspect-video bg-muted flex items-center justify-center relative">
                {m.type === "image" && <img src={m.file_url} alt={m.title} className="w-full h-full object-cover" />}
                {m.type === "video" && <video src={m.file_url} className="w-full h-full object-cover" muted />}
                {(m.type === "pdf" || m.type === "url") && <Icon className="h-8 w-8 text-muted-foreground/50" />}
                <span className="absolute top-2 left-2 text-[10px] font-mono uppercase bg-background/80 backdrop-blur px-1.5 py-0.5 rounded">{m.type}</span>
              </div>
              <div className="p-3">
                <div className="text-sm font-medium truncate">{m.title}</div>
                <div className="text-xs text-muted-foreground flex justify-between mt-1">
                  <span>{m.file_size ? `${(m.file_size / 1024 / 1024).toFixed(1)} MB` : "—"}</span>
                  {isAdmin && (
                    <button onClick={() => del.mutate(m.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {!media.length && <Card className="p-10 col-span-full text-center text-sm text-muted-foreground">No media yet. Upload videos, images, PDFs, or link a web URL.</Card>}
      </div>
    </AppShell>
  );
}

function UploadDialog({ userId }: { userId?: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"file" | "url">("file");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"video" | "image" | "pdf" | "url">("image");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const submit = async () => {
    if (!title) return toast.error("Title required");
    setBusy(true);
    try {
      let file_url = url;
      let file_size: number | null = null;
      let finalType = type;
      if (tab === "file" && file) {
        const path = `${userId ?? "anon"}/${Date.now()}-${file.name}`;
        setUploadProgress(0);
        await uploadMediaFile(path, file, setUploadProgress);
        file_url = `media:${path}`;
        file_size = file.size;
        finalType = file.type.startsWith("video") ? "video" : file.type === "application/pdf" ? "pdf" : "image";
      }
      if (!file_url) throw new Error("File or URL required");
      const { error } = await supabase.from("media").insert({ title, type: finalType, file_url, file_size, uploaded_by: userId });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["media"] });
      toast.success("Added");
      setOpen(false); setTitle(""); setUrl(""); setFile(null); setUploadProgress(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); setUploadProgress(null); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Upload className="h-4 w-4 mr-1" /> Upload</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add media</DialogTitle></DialogHeader>
        <div className="flex gap-2 mb-2">
          <Button variant={tab === "file" ? "default" : "outline"} size="sm" onClick={() => setTab("file")}>File</Button>
          <Button variant={tab === "url" ? "default" : "outline"} size="sm" onClick={() => setTab("url")}>Web URL</Button>
        </div>
        <div className="space-y-3">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          {tab === "file" ? (
            <div>
              <Label>File</Label>
              <Input type="file" accept="image/*,video/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <p className="text-xs text-muted-foreground mt-1">Stored in your media bucket. Type auto-detected.</p>
              {uploadProgress !== null && (
                <div className="mt-4 space-y-2" aria-live="polite">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Uploading {file?.name}</span>
                    <span className="font-medium tabular-nums">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} aria-label={`Upload progress: ${uploadProgress}%`} className="rounded-none" />
                </div>
              )}
            </div>
          ) : (
            <>
              <div><Label>URL</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" /></div>
              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="url">Web URL</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} {uploadProgress !== null ? `Uploading ${uploadProgress}%` : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
