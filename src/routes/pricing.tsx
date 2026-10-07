import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Signal" },
      {
        name: "description",
        content:
          "Signal signage pricing is per screen, per month: Starter ₹299, Growth ₹799, Enterprise custom. 14-day trial, 20% off annual billing.",
      },
      { property: "og:title", content: "Pricing — Signal" },
      {
        property: "og:description",
        content:
          "Cloud digital signage priced per screen, per month. 14-day trial, no card required.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PricingPage,
});

type Plan = {
  id: "starter" | "growth" | "enterprise";
  name: string;
  blurb: string;
  monthly: number | null;
  features: string[];
  cta: { label: string; to?: string; href?: string };
};

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    blurb: "Single stores and small pilots.",
    monthly: 299,
    features: [
      "Up to 10 screens",
      "5 GB media storage",
      "2 console users",
      "Playlists and day-part scheduling",
      "Online / offline status",
      "7-day screen capture history",
    ],
    cta: { label: "Start 14-day trial", to: "/auth" },
  },
  {
    id: "growth",
    name: "Growth",
    blurb: "Multi-store retail chains.",
    monthly: 799,
    features: [
      "Up to 200 screens",
      "100 GB media storage",
      "Unlimited users with role permissions",
      "Proof-of-play export (CSV)",
      "90-day screen capture history",
      "Live view of any screen",
      "Email alerts on offline screens",
    ],
    cta: { label: "Start 14-day trial", to: "/auth" },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    blurb: "500+ screens, or you need SSO.",
    monthly: null,
    features: [
      "Unlimited screens and storage",
      "SSO / SAML and extended audit history",
      "12-month proof-of-play archive",
      "Volume pricing above 10,000 screens",
      "99.9% uptime SLA, named contact",
      "Assisted onboarding and custom player builds",
    ],
    cta: { label: "Talk to sales", href: "mailto:sales@signal.app" },
  },
];

const INCLUDED = [
  "TV player for Samsung SSSP and any browser",
  "6-digit pairing — no manual device IDs",
  "Versioned playlists pushed within seconds",
  "Schedules by day of week and time window",
  "Heartbeat health checks every 30 seconds",
  "Proof-of-play logging for every item shown",
  "Private media storage with signed links",
  "No per-player or per-location licence fees",
];

const FINE_PRINT = [
  "All prices are per paired screen, per month, excluding GST. Screens that are unpaired or decommissioned are not billed.",
  "Annual plans are paid for 12 months up front at 20% off the monthly rate.",
  "The 14-day trial includes every Growth feature on up to 5 screens. No card required.",
  "Above 10,000 screens, pricing is negotiated per deployment.",
];

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const annualRate = (monthly: number) => Math.round(monthly * 0.8);

function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [screens, setScreens] = useState(12);
  const [estimatePlan, setEstimatePlan] = useState<"starter" | "growth">("growth");

  const plan = PLANS.find((p) => p.id === estimatePlan)!;
  const rate = annual ? annualRate(plan.monthly!) : plan.monthly!;
  const monthlyTotal = rate * Math.max(0, screens || 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-display text-lg font-semibold tracking-tight">Signal</span>
          <div className="flex items-center gap-5 text-sm">
            <Link
              to="/install"
              className="text-muted-foreground hover:text-foreground"
            >
              Install
            </Link>
            <Link
              to="/auth"
              className="text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-3xl font-bold tracking-tight">Pricing</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Every plan is charged per screen, per month. One price covers the console, the
          TV player, storage, and support — no per-player fees.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-md border border-border">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 text-sm ${
                annual
                  ? "text-muted-foreground"
                  : "bg-secondary font-medium text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`border-l border-border px-4 py-1.5 text-sm ${
                annual
                  ? "bg-secondary font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Annual
            </button>
          </div>
          <span className="text-sm text-muted-foreground">
            {annual ? "20% off, billed for 12 months" : "Save 20% with annual billing"}
          </span>
        </div>

        <div className="mt-6 grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-3">
          {PLANS.map((p) => {
            const price = p.monthly === null ? null : annual ? annualRate(p.monthly) : p.monthly;
            return (
              <div key={p.id} className="flex flex-col bg-card p-5">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-lg font-semibold">{p.name}</h2>
                  {p.id === "growth" && (
                    <span className="text-xs text-muted-foreground">Most popular</span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>

                <div className="mt-5 flex items-baseline gap-1">
                  {price === null ? (
                    <span className="font-display text-3xl font-semibold">Custom</span>
                  ) : (
                    <>
                      <span className="font-display text-3xl font-semibold">{inr(price)}</span>
                      <span className="text-sm text-muted-foreground">/screen/mo</span>
                    </>
                  )}
                </div>
                <p className="mt-1 h-4 text-xs text-muted-foreground">
                  {price === null
                    ? "Volume based on your deployment"
                    : annual
                      ? `Billed annually at ${inr(price * 12)} per screen`
                      : "Billed monthly, cancel anytime"}
                </p>

                <ul className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  {p.cta.to ? (
                    <Link
                      to={p.cta.to}
                      className={`block rounded-md px-4 py-2 text-center text-sm font-medium ${
                        p.id === "growth"
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border border-border text-foreground hover:bg-secondary"
                      }`}
                    >
                      {p.cta.label}
                    </Link>
                  ) : (
                    <a
                      href={p.cta.href}
                      className="block rounded-md border border-border px-4 py-2 text-center text-sm font-medium text-foreground hover:bg-secondary"
                    >
                      {p.cta.label}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <section className="mt-12 border-t border-border pt-8">
          <h2 className="font-display text-lg font-semibold">Estimate your cost</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-[auto_auto_1fr] md:items-end">
            <div>
              <label
                htmlFor="screens"
                className="block text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Screens
              </label>
              <input
                id="screens"
                type="number"
                min={1}
                max={100000}
                value={screens}
                onChange={(e) => setScreens(Number(e.target.value))}
                className="mt-2 w-28 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
              />
            </div>
            <div>
              <label
                htmlFor="estimate-plan"
                className="block text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Plan
              </label>
              <select
                id="estimate-plan"
                value={estimatePlan}
                onChange={(e) => setEstimatePlan(e.target.value as "starter" | "growth")}
                className="mt-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
              </select>
            </div>
            <div>
              <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Estimated total
              </span>
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-display text-xl font-semibold text-foreground">
                  {inr(monthlyTotal)}
                </span>{" "}
                per month
                {annual && (
                  <>
                    {" · "}
                    {inr(monthlyTotal * 12)} billed annually
                  </>
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12 border-t border-border pt-8">
          <h2 className="font-display text-lg font-semibold">In every plan</h2>
          <ul className="mt-4 grid gap-x-8 gap-y-2 text-sm text-muted-foreground md:grid-cols-2">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 border-t border-border pt-8">
          <h2 className="font-display text-lg font-semibold">The details</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            {FINE_PRINT.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>

        <p className="mt-10 text-sm text-muted-foreground">
          Ready to go?{" "}
          <Link to="/auth" className="text-primary hover:underline">
            Start your 14-day trial
          </Link>{" "}
          or{" "}
          <Link to="/install" className="text-primary hover:underline">
            install the TV player
          </Link>{" "}
          first.
        </p>
      </main>
    </div>
  );
}
