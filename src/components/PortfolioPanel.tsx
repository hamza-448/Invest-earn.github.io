import { Link } from "@tanstack/react-router";
import type { MarketCoin } from "@/lib/markets.functions";
import type { PortfolioData } from "@/lib/trading.functions";
import { pct, qty, usd } from "@/lib/format";

const badgeTone = ["bg-accent/20 text-accent", "bg-brand/20 text-brand", "bg-gold/20 text-gold"];

export function PortfolioPanel({
  portfolio,
  coins,
  signedIn,
}: {
  portfolio: PortfolioData | undefined;
  coins: MarketCoin[];
  signedIn: boolean;
}) {
  const priceOf = (coinId: string) => coins.find((c) => c.id === coinId)?.price ?? 0;
  const changeOf = (coinId: string) => coins.find((c) => c.id === coinId)?.change24h ?? 0;

  const holdingsValue =
    portfolio?.holdings.reduce((sum, h) => sum + h.quantity * priceOf(h.coinId), 0) ?? 0;
  const total = (portfolio?.cash ?? 0) + holdingsValue;
  const invested = portfolio?.holdings.reduce((sum, h) => sum + h.quantity * h.avgPrice, 0) ?? 0;
  const pnl = holdingsValue - invested;
  const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;

  return (
    <div className="rounded-3xl glass p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-foreground/40">Portfolio</p>
          <p className="mt-1 font-mono text-3xl font-semibold">{signedIn ? usd(total) : "$—"}</p>
          {signedIn && (
            <p className={`mt-1 text-xs ${pnl >= 0 ? "text-up" : "text-down"}`}>
              {pnl >= 0 ? "▲" : "▼"} {usd(Math.abs(pnl))} unrealised ({pct(pnlPct)})
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wider text-foreground/40">Cash</p>
          <p className="mt-1 font-mono text-sm">{signedIn ? usd(portfolio?.cash ?? 0) : "—"}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {!signedIn && (
          <div className="rounded-2xl glass-soft p-6 text-center">
            <p className="text-sm text-foreground/60">
              Sign in to see your balance, holdings and order history.
            </p>
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="mt-3 inline-block rounded-xl glass px-4 py-2 text-sm font-medium transition hover:bg-foreground/15"
            >
              Sign in
            </Link>
          </div>
        )}

        {signedIn && portfolio?.holdings.length === 0 && (
          <div className="rounded-2xl glass-soft p-6 text-center text-sm text-foreground/60">
            You start with {usd(portfolio.cash)} in practice cash. Place your first order to build a position.
          </div>
        )}

        {portfolio?.holdings.map((h, i) => (
          <div key={h.coinId} className="flex items-center justify-between rounded-2xl glass-soft p-4">
            <div className="flex items-center gap-3">
              <span
                className={`grid size-9 place-items-center rounded-full font-mono text-xs font-semibold ${
                  badgeTone[i % badgeTone.length]
                }`}
              >
                {h.symbol}
              </span>
              <div>
                <p className="text-sm font-medium">{h.name}</p>
                <p className="text-[11px] text-foreground/40">
                  {qty(h.quantity)} {h.symbol} · avg {usd(h.avgPrice)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm">{usd(h.quantity * priceOf(h.coinId))}</p>
              <p
                className={`font-mono text-[11px] ${changeOf(h.coinId) >= 0 ? "text-up" : "text-down"}`}
              >
                {pct(changeOf(h.coinId))}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
