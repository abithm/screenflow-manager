import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Signal" },
      {
        name: "description",
        content:
          "How Signal collects, uses, and protects data across the signage console and TV players.",
      },
      { property: "og:title", content: "Privacy Policy — Signal" },
      {
        property: "og:description",
        content:
          "How Signal collects, uses, and protects data across the signage console and TV players.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

const sections = [
  {
    title: "1. What we collect",
    body: [
      "Account data: name, email address, and sign-in credentials for console users.",
      "Device data: each TV player reports a device identifier, app version, available storage, online status, and periodic screen captures so administrators can verify what is playing.",
      "Playback data: proof-of-play records describing which media played on which screen and when.",
      "Content data: media files, playlists, schedules, and store information uploaded by your organization.",
    ],
  },
  {
    title: "2. How we use it",
    body: [
      "To operate the service: delivering playlists to screens, monitoring device health, and showing status dashboards.",
      "To secure access: role-based permissions ensure only authorized administrators can change screens, media, and schedules.",
      "To provide audit history: pairing and administrative actions are logged with the responsible user.",
      "We do not sell your data or use it for advertising.",
    ],
  },
  {
    title: "3. Screen captures",
    body: [
      "Players send a screenshot of what is currently on the TV roughly every five minutes. These images are visible to your organization's administrators in the console.",
      "Screens are installed in retail or public spaces; do not display personal or payment information on signage content.",
    ],
  },
  {
    title: "4. Data retention",
    body: [
      "Heartbeat and proof-of-play records are kept for operational reporting and may be aggregated or deleted after 12 months.",
      "Media files and playlists are retained until deleted by an administrator.",
      "When a screen is unpaired, its pairing credentials are reset and it can no longer receive content.",
    ],
  },
  {
    title: "5. Security",
    body: [
      "All traffic between players, the console, and the backend is encrypted in transit.",
      "Access to data is enforced server-side with row-level security policies scoped to each user's role.",
      "Demo accounts are provided for evaluation only — do not store real business data in them.",
    ],
  },
  {
    title: "6. Your rights",
    body: [
      "Administrators can export or delete their organization's content at any time from the console.",
      "To request account deletion or a copy of your data, contact your organization's super administrator.",
    ],
  },
  {
    title: "7. Changes",
    body: [
      "We may update this policy as the product evolves. Material changes will be noted in the console. Continued use after an update constitutes acceptance.",
    ],
  },
];

function PrivacyPage() {
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
        <h1 className="font-display text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated: September 2026. This policy covers the Signal signage console
          and the TV player application.
        </p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-display text-lg font-semibold">{section.title}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                {section.body.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          Questions? Contact your organization's administrator or{" "}
          <Link to="/auth" className="text-primary hover:underline">
            sign in
          </Link>{" "}
          to reach support.
        </p>
      </main>
    </div>
  );
}
