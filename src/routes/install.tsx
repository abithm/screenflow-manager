import { Link, createFileRoute } from "@tanstack/react-router";
import { MonitorPlay, Link2, ListVideo, HeartPulse } from "lucide-react";

export const Route = createFileRoute("/install")({
  head: () => ({
    meta: [
      { title: "Install the TV Player — Signal" },
      {
        name: "description",
        content:
          "How to install the Signal signage player on a Samsung Smart Signage (SSSP) TV or open it in any browser.",
      },
      { property: "og:title", content: "Install the TV Player — Signal" },
      {
        property: "og:description",
        content:
          "Install the Signal signage player on a Samsung SSSP TV or any browser, then pair it with a 6-digit code.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InstallPage,
});

const steps = [
  {
    icon: MonitorPlay,
    title: "1. Open the installer on the TV",
    body: "On a Samsung Smart Signage display (SSSP 4 or newer), open the URL Launcher or MagicInfo player settings and enter the install address shown below. On any other smart TV or computer, simply open the player page in the built-in browser.",
  },
  {
    icon: Link2,
    title: "2. Note the 6-digit pairing code",
    body: "When the player starts it shows a large 6-digit code on screen. The code is valid for 15 minutes and refreshes automatically if it expires.",
  },
  {
    icon: ListVideo,
    title: "3. Pair it from the dashboard",
    body: "In the console, go to Screens → Pair screen, enter the code, give the screen a name, and assign it to a store. The TV switches to a standby welcome screen until you assign a playlist.",
  },
  {
    icon: HeartPulse,
    title: "4. It stays in touch",
    body: "The player checks in every 30 seconds, downloads new playlists automatically, keeps playing from its local cache if the internet drops, and logs proof-of-play for every item shown.",
  },
];

function InstallPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <span className="font-display text-lg font-semibold tracking-tight">Signal</span>
          <div className="flex items-center gap-5 text-sm">
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link to="/auth" className="text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Install the TV player
        </h1>
        <p className="mt-3 text-muted-foreground">
          The Signal player runs on Samsung Smart Signage TVs and in any modern web
          browser. No extra hardware is needed.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Samsung SSSP install address
          </p>
          <code className="mt-2 block rounded-md bg-secondary px-3 py-2 font-mono text-sm text-foreground">
            {typeof window !== "undefined" ? window.location.origin : ""}/sssp
          </code>
          <p className="mt-3 text-xs text-muted-foreground">
            On the TV: Menu → System → Play via → URL Launcher, then enter this
            address. The TV downloads and installs the player package.
          </p>
        </div>

        <div className="mt-8 rounded-lg border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Any other TV or browser
          </p>
          <code className="mt-2 block rounded-md bg-secondary px-3 py-2 font-mono text-sm text-foreground">
            {typeof window !== "undefined" ? window.location.origin : ""}/tv
          </code>
          <p className="mt-3 text-xs text-muted-foreground">
            Open this page full-screen and leave it running. It behaves exactly like
            the installed app.
          </p>
        </div>

        <ol className="mt-10 space-y-6">
          {steps.map((step) => (
            <li key={step.title} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-semibold">{step.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 rounded-lg border border-border bg-card p-5">
          <h2 className="font-display font-semibold">Troubleshooting</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Code expired? The TV shows a fresh one automatically — just enter the
              new code in the console.
            </li>
            <li>
              Screen shows Offline? Check the TV's network connection; a screen is
              marked offline after 2 minutes without a check-in.
            </li>
            <li>
              Wrong store or name? Edit the screen anytime under Screens in the
              console, or unpair it to get a new code.
            </li>
          </ul>
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Need an account?{" "}
          <Link to="/auth" className="text-primary hover:underline">
            Sign in to the console
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
