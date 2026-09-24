import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMarkets } from "@/lib/markets.functions";
import { getPortfolio } from "@/lib/trading.functions";
import { useAuth } from "@/hooks/useAuth";
import { Ambient } from "@/components/Ambient";
import { SiteHeader } from "@/components/SiteHeader";
import { MarketTable } from "@/components/MarketTable";
import { CoinDetail } from "@/components/CoinDetail";
import { OrderPanel } from "@/components/OrderPanel";
import { PortfolioPanel } from "@/components/PortfolioPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Invest and Earn — Live Crypto Markets" },
      {
        name: "description",
        content:
          "Live crypto prices, interactive charts and instant buy or sell orders with practice cash on Invest and Earn.",
      },
      { property: "og:title", content: "Invest and Earn — Live Crypto Markets" },
      {
        property: "og:description",
        content:
          "Live crypto prices, interactive charts and instant buy or sell orders with practice cash on Invest and Earn.",
      },
    ],
  }),
  component: Markets,
});

function Markets() {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState("bitcoin");
  const [days, setDays] = useState(7);

  const markets = useQuery({
    queryKey: ["markets"],
    queryFn: () => getMarkets(),
    refetchInterval: 30_000,
  });

  const portfolio = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => getPortfolio(),
    enabled: !!user,
  });

  const coins = markets.data?.coins ?? [];
  const selected = coins.find((c) => c.id === selectedId) ?? coins[0];

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink font-body text-foreground">
      <Ambient />
      <SiteHeader />

      <main className="relative z-10 px-8 pb-16">
        <section className="mt-4 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-brand/80">Live Market</p>
                <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">
                  Markets moving <span className="text-brand">right now</span>
                </h1>
              </div>
              <div className="hidden items-center gap-2 text-xs text-foreground/50 sm:flex">
                <span className="size-2 animate-pulse rounded-full bg-up" />
                {markets.data?.live ? "Streaming live prices" : "Cached prices"}
              </div>
            </div>

            {coins.length > 0 ? (
              <MarketTable coins={coins} selectedId={selected?.id ?? ""} onSelect={setSelectedId} />
            ) : (
              <div className="rounded-3xl glass p-10 text-center text-sm text-foreground/50">
                Loading markets…
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            {selected ? (
              <CoinDetail coin={selected} days={days} onRangeChange={setDays} />
            ) : (
              <div className="rounded-3xl glass p-10 text-center text-sm text-foreground/50">
                Loading market detail…
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            {selected && (
              <OrderPanel coin={selected} signedIn={!!user} cash={portfolio.data?.cash} />
            )}
          </div>
          <div className="lg:col-span-8">
            <PortfolioPanel portfolio={portfolio.data} coins={coins} signedIn={!!user} />
          </div>
        </section>

        {!user && (
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl glass p-6">
              <p className="text-[11px] uppercase tracking-[0.25em] text-brand/80">Sign in</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">Welcome back, trader</h2>
              <p className="mt-2 text-sm text-foreground/50">
                Pick up where you left off with your balance and open positions.
              </p>
              <Link
                to="/auth"
                search={{ mode: "signin" }}
                className="mt-4 block w-full rounded-xl glass py-3 text-center font-medium transition hover:bg-foreground/15"
              >
                Sign in
              </Link>
            </div>
            <div className="rounded-3xl border border-foreground/10 bg-gradient-to-br from-brand/15 to-accent/15 p-6">
              <p className="text-[11px] uppercase tracking-[0.25em] text-accent">Create account</p>
              <h2 className="mt-2 font-display text-2xl font-semibold">Start earning in minutes</h2>
              <p className="mt-2 text-sm text-foreground/50">
                Every new account starts with $10,000 in practice cash so you can trade the real market risk-free.
              </p>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="mt-4 block w-full rounded-xl bg-gradient-to-r from-brand to-accent py-3 text-center font-semibold text-brand-foreground shadow-lg shadow-accent/20 transition hover:opacity-95"
              >
                Get started
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
