import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Ambient } from "@/components/Ambient";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "Plans & Pricing — Invest and Earn" },
      {
        name: "description",
        content:
          "Choose your Invest and Earn plan: Basic, Pro or VIP. Live crypto markets, trading signals and priority support.",
      },
      { property: "og:title", content: "Plans & Pricing — Invest and Earn" },
      {
        property: "og:description",
        content:
          "Choose your Invest and Earn plan: Basic, Pro or VIP. Live crypto markets, trading signals and priority support.",
      },
    ],
  }),
  component: PlansPage,
});

type Plan = {
  name: string;
  price: string;
  tagline: string;
  features: string[];
  highlighted?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Basic",
    price: "$19",
    tagline: "For new traders finding their feet",
    features: [
      "Live prices & charts",
      "$10,000 practice trading account",
      "Full order history & portfolio tracking",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "$49",
    tagline: "For active traders who want an edge",
    highlighted: true,
    features: [
      "Everything in Basic",
      "Daily trade signals",
      "Advanced chart indicators",
      "Priority support",
    ],
  },
  {
    name: "VIP",
    price: "$99",
    tagline: "For serious investors",
    features: [
      "Everything in Pro",
      "1-on-1 strategy sessions",
      "Early access to new features",
      "Direct line to the trading desk",
    ],
  },
];

function PlansPage() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink font-body text-foreground">
      <Ambient />
      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-6xl px-8 pb-24">
        <section className="mt-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.25em] text-brand/80">Membership</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Pick the plan that <span className="text-brand">fits you</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-foreground/50">
            Every account starts with $10,000 in practice cash. Upgrade for signals,
            advanced tools and direct support.
          </p>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlighted
                  ? "relative rounded-3xl border border-brand/40 bg-gradient-to-b from-brand/15 to-accent/10 p-7 shadow-xl shadow-brand/10"
                  : "relative rounded-3xl glass p-7"
              }
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand to-accent px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-foreground">
                  Most popular
                </span>
              )}
              <h2 className="font-display text-2xl font-semibold">{plan.name}</h2>
              <p className="mt-1 text-sm text-foreground/50">{plan.tagline}</p>
              <p className="mt-5 font-mono text-4xl font-semibold">
                {plan.price}
                <span className="text-sm font-normal text-foreground/50"> /month</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-foreground/70">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" />
                    {feature}
                  </li>
                ))}
              </ul>
              {user ? (
                <button
                  onClick={() =>
                    toast("Payments are being set up — you'll be able to subscribe here soon.")
                  }
                  className={
                    plan.highlighted
                      ? "mt-7 block w-full rounded-xl bg-gradient-to-r from-brand to-accent py-3 text-center font-semibold text-brand-foreground shadow-lg shadow-accent/20 transition hover:opacity-95"
                      : "mt-7 block w-full rounded-xl glass py-3 text-center font-medium transition hover:bg-foreground/15"
                  }
                >
                  Subscribe to {plan.name}
                </button>
              ) : (
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className={
                    plan.highlighted
                      ? "mt-7 block w-full rounded-xl bg-gradient-to-r from-brand to-accent py-3 text-center font-semibold text-brand-foreground shadow-lg shadow-accent/20 transition hover:opacity-95"
                      : "mt-7 block w-full rounded-xl glass py-3 text-center font-medium transition hover:bg-foreground/15"
                  }
                >
                  Create account
                </Link>
              )}
            </div>
          ))}
        </section>

        <p className="mt-10 text-center text-xs text-foreground/40">
          Prices shown are placeholders — checkout goes live once payment processing is
          activated. Trading involves risk; Invest and Earn does not guarantee returns.
        </p>
      </main>
    </div>
  );
}
