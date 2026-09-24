import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMarkets } from "@/lib/markets.functions";
import { getPortfolio } from "@/lib/trading.functions";
import { useAuth } from "@/hooks/useAuth";
import { Ambient } from "@/components/Ambient";
import { SiteHeader } from "@/components/SiteHeader";
import { PortfolioPanel } from "@/components/PortfolioPanel";
import { qty, usd } from "@/lib/format";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Your portfolio — Invest and Earn" },
      {
        name: "description",
        content: "Follow your holdings, cash balance and every order you have placed on Invest and Earn.",
      },
      { property: "og:title", content: "Your portfolio — Invest and Earn" },
      {
        property: "og:description",
        content: "Follow your holdings, cash balance and every order you have placed on Invest and Earn.",
      },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { user, loading } = useAuth();

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink font-body text-foreground">
      <Ambient />
      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-5xl px-8 pb-16">
        <p className="text-[11px] uppercase tracking-[0.25em] text-brand/80">Portfolio</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
          {portfolio.data ? `${portfolio.data.displayName}'s positions` : "Your positions"}
        </h1>

        {!user && !loading && (
          <div className="mt-6 rounded-3xl glass p-8 text-center">
            <p className="text-sm text-foreground/60">Sign in to see your balance and holdings.</p>
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="mt-4 inline-block rounded-xl glass px-5 py-2.5 text-sm font-medium transition hover:bg-foreground/15"
            >
              Sign in
            </Link>
          </div>
        )}

        {user && (
          <div className="mt-6 space-y-6">
            <PortfolioPanel
              portfolio={portfolio.data}
              coins={markets.data?.coins ?? []}
              signedIn={true}
            />

            <div className="rounded-3xl glass p-5">
              <p className="text-[11px] uppercase tracking-[0.25em] text-foreground/40">Order history</p>
              <div className="mt-4 divide-y divide-foreground/5">
                {portfolio.data?.trades.length === 0 && (
                  <p className="py-6 text-center text-sm text-foreground/50">No orders yet.</p>
                )}
                {portfolio.data?.trades.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold ${
                          t.side === "buy" ? "bg-up/15 text-up" : "bg-down/15 text-down"
                        }`}
                      >
                        {t.side.toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {qty(t.quantity)} {t.symbol}
                        </p>
                        <p className="text-[11px] text-foreground/40">
                          {new Date(t.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">{usd(t.total)}</p>
                      <p className="font-mono text-[11px] text-foreground/40">@ {usd(t.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
