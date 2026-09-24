import type { MarketCoin } from "@/lib/markets.functions";
import { compact, pct, usd } from "@/lib/format";

const badgeTone = ["bg-accent/20 text-accent", "bg-brand/20 text-brand", "bg-gold/20 text-gold"];

export function MarketTable({
  coins,
  selectedId,
  onSelect,
}: {
  coins: MarketCoin[];
  selectedId: string;
  onSelect: (coinId: string) => void;
}) {
  return (
    <div className="rounded-3xl glass p-4">
      <div className="grid grid-cols-12 gap-2 px-3 pb-2 text-[10px] uppercase tracking-[0.15em] text-foreground/40">
        <span className="col-span-4">Asset</span>
        <span className="col-span-3 text-right">Price</span>
        <span className="col-span-2 text-right">24h</span>
        <span className="col-span-3 text-right">Volume</span>
      </div>
      <div className="divide-y divide-foreground/5">
        {coins.map((coin, i) => (
          <button
            key={coin.id}
            onClick={() => onSelect(coin.id)}
            className={`grid w-full grid-cols-12 items-center gap-2 rounded-xl px-3 py-3 text-left transition hover:bg-foreground/5 ${
              coin.id === selectedId ? "bg-foreground/5" : ""
            }`}
          >
            <div className="col-span-4 flex items-center gap-3">
              <span
                className={`grid size-8 place-items-center rounded-full font-mono text-xs font-semibold ${
                  badgeTone[i % badgeTone.length]
                }`}
              >
                {coin.symbol}
              </span>
              <div>
                <p className="text-sm font-medium">{coin.name}</p>
                <p className="text-[11px] text-foreground/40">{coin.symbol} / USD</p>
              </div>
            </div>
            <span className="col-span-3 text-right font-mono text-sm">{usd(coin.price)}</span>
            <span
              className={`col-span-2 text-right font-mono text-xs ${coin.change24h >= 0 ? "text-up" : "text-down"}`}
            >
              {pct(coin.change24h)}
            </span>
            <span className="col-span-3 text-right font-mono text-xs text-foreground/50">
              {compact(coin.volume24h)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
