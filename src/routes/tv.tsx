import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/tv")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Signal TV Player" },
      { name: "description", content: "Full-screen signage player for Samsung SSSP / Tizen and web TVs." },
      { property: "og:title", content: "Signal TV Player" },
      { property: "og:description", content: "Full-screen signage player for Samsung SSSP / Tizen and web TVs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TvPlayer,
});

const APP_VERSION = "1.0.0";
type Item = { type: string; url: string; duration: number };

function getDeviceId() {
  const q = new URLSearchParams(window.location.search).get("device");
  if (q) return q;
  let id = localStorage.getItem("signal_device_id");
  if (!id) {
    const rnd = () => Math.random().toString(36).slice(2, 10);
    id = "tv-" + rnd() + rnd();
    localStorage.setItem("signal_device_id", id);
  }
  return id;
}

function formatPin(p: string) {
  return p.length === 6 ? `${p.slice(0, 3)} ${p.slice(3)}` : p;
}

function TvPlayer() {
  const [deviceId] = useState(getDeviceId);
  const [mode, setMode] = useState<"loading" | "pairing" | "standby" | "playing" | "error">("loading");
  const [pin, setPin] = useState("");
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [now, setNow] = useState(Date.now());
  const [items, setItems] = useState<Item[]>([]);
  const [index, setIndex] = useState(0);
  const versionRef = useRef(-1);
  const startRef = useRef<string>(new Date().toISOString());

  // clock
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // main sync loop
  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;

    async function requestPin() {
      const r = await fetch("/api/public/pair/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId }),
      });
      const j = await r.json();
      if (j.paired) return true;
      setPin(j.pairing_code);
      setExpiresAt(new Date(j.expires_at).getTime());
      setMode("pairing");
      return false;
    }

    async function tick() {
      try {
        const r = await fetch(`/api/public/player/${encodeURIComponent(deviceId)}`);
        const j = await r.json();
        if (!j.paired) {
          versionRef.current = -1;
          setItems([]);
          const paired = await requestPin();
          if (!paired) {
            timer = setTimeout(tick, 3000);
            return;
          }
        } else {
          const list: Item[] = j.playlist ?? [];
          if (j.version !== versionRef.current) {
            versionRef.current = j.version;
            setItems(list);
            setIndex(0);
          }
          setMode(list.length ? "playing" : "standby");
        }
        timer = setTimeout(tick, 30000);
      } catch {
        // offline: keep playing what we have
        setMode((m) => (m === "loading" ? "error" : m));
        timer = setTimeout(tick, 10000);
      }
      if (stop) clearTimeout(timer);
    }
    tick();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [deviceId]);

  // heartbeat
  useEffect(() => {
    const beat = () =>
      fetch("/api/public/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId, status: "online", app_version: APP_VERSION }),
      }).catch(() => {});
    beat();
    const t = setInterval(beat, 30000);
    return () => clearInterval(t);
  }, [deviceId]);

  const current = items[index % Math.max(items.length, 1)];

  function next() {
    if (current) {
      fetch("/api/public/proof-of-play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: deviceId,
          media_name: decodeURIComponent(current.url.split("/").pop() || current.url),
          start_time: startRef.current,
          end_time: new Date().toISOString(),
        }),
      }).catch(() => {});
    }
    startRef.current = new Date().toISOString();
    setIndex((i) => (i + 1) % Math.max(items.length, 1));
  }

  // timed items
  useEffect(() => {
    if (mode !== "playing" || !current || current.type === "video") return;
    startRef.current = new Date().toISOString();
    const t = setTimeout(next, Math.max(current.duration || 10, 3) * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, index, items]);

  if (mode === "playing" && current) {
    return (
      <div className="fixed inset-0 bg-background">
        {current.type === "video" ? (
          <video
            key={index + current.url}
            src={current.url}
            autoPlay
            muted
            playsInline
            onEnded={next}
            onError={next}
            className="h-full w-full object-contain"
          />
        ) : current.type === "image" ? (
          <img key={index + current.url} src={current.url} alt="" className="h-full w-full object-contain" />
        ) : (
          <iframe key={index + current.url} src={current.url} title="content" className="h-full w-full border-0" />
        )}
      </div>
    );
  }

  const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-10 bg-background text-foreground">
      <div className="font-display text-3xl tracking-widest text-muted-foreground">SIGNAL</div>
      {mode === "pairing" && (
        <>
          <p className="text-3xl">Enter this code in the dashboard under Screens → Pair screen</p>
          <div className="font-display text-[12rem] font-bold leading-none tracking-[0.15em] text-primary">
            {formatPin(pin)}
          </div>
          <p className="text-2xl text-muted-foreground">
            Code refreshes in {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
          </p>
        </>
      )}
      {mode === "standby" && (
        <>
          <div className="font-display text-7xl font-bold">Welcome</div>
          <p className="text-3xl text-muted-foreground">Screen paired · waiting for content</p>
        </>
      )}
      {mode === "loading" && <p className="text-3xl text-muted-foreground">Connecting…</p>}
      {mode === "error" && <p className="text-3xl text-destructive">No connection — retrying…</p>}
      <p className="absolute bottom-6 text-lg text-muted-foreground">Device {deviceId}</p>
    </div>
  );
}
