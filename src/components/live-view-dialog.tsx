import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type LiveRow = {
  now_playing_url: string | null;
  now_playing_type: string | null;
  now_playing_name: string | null;
  now_playing_started_at: string | null;
  last_seen: string | null;
};

export function LiveViewDialog({ screenId, screenName }: { screenId: string; screenName: string }) {
  const [open, setOpen] = useState(false);
  const { data, refetch } = useQuery({
    queryKey: ["live-view", screenId],
    enabled: open,
    refetchInterval: open ? 5000 : false,
    queryFn: async () => {
      const { data } = await supabase
        .from("screens")
        .select("now_playing_url, now_playing_type, now_playing_name, now_playing_started_at, last_seen")
        .eq("id", screenId)
        .maybeSingle();
      return data as LiveRow | null;
    },
  });

  // instant updates when the TV switches item
  useEffect(() => {
    if (!open) return;
    const ch = supabase
      .channel(`live-${screenId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "screens", filter: `id=eq.${screenId}` }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [open, screenId, refetch]);

  const online = !!data?.last_seen && Date.now() - new Date(data.last_seen).getTime() < 2 * 60 * 1000;
  const url = data?.now_playing_url;
  const type = data?.now_playing_type;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-full text-xs">
          <Eye className="h-3.5 w-3.5 mr-1" /> Live view
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader><DialogTitle>{screenName} — live view</DialogTitle></DialogHeader>
        <div className="aspect-video w-full overflow-hidden rounded-sm border border-border bg-background flex items-center justify-center">
          {!online ? (
            <span className="text-sm text-muted-foreground">Screen is offline</span>
          ) : !url ? (
            <span className="text-sm text-muted-foreground">Nothing playing — showing pairing or standby screen</span>
          ) : type === "video" ? (
            <video key={url} src={url} autoPlay muted playsInline loop className="h-full w-full object-contain" />
          ) : type === "image" ? (
            <img key={url} src={url} alt="" className="h-full w-full object-contain" />
          ) : (
            <iframe key={url} src={url} title="live" className="h-full w-full border-0" />
          )}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="truncate">{online && data?.now_playing_name ? `Now playing: ${data.now_playing_name}` : "—"}</span>
          <span>
            {online && data?.now_playing_started_at
              ? `started ${formatDistanceToNow(new Date(data.now_playing_started_at), { addSuffix: true })}`
              : ""}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
