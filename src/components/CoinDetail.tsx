import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { getCoinChart, type MarketCoin } from "@/lib/markets.functions";
import { compact, pct, usd } from "@/lib/format";

const RANGES = [
  { label: "1D", days: 1 },
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "1Y", days: 365 },
];

export function CoinDetail({
  coin,
  days,
  onRangeChange,
}: {
  coin: MarketCoin;
  days: number;
  onRangeChange: (days: number) => void;
}) {
  const chart = useQuery({
    queryKey: ["chart", coin.id, days],
    queryFn: () => getCoinChart({ data: { coinId: coin.id, days } }),
    staleTime: 60_000,
  });

  const up = coin.change24h >= 0;

  return (
    <div className="rounded-3xl glass p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-accent/20 font-mono text-sm font-semibold text-accent">
            {coin.symbol}
          </span>
          <div>
            <p className="font-display font-semibold">{coin.name}</p>
            <p className="text-[11px] text-foreground/40">{coin.symbol} / USD</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => onRangeChange(r.days)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                r.days === days ? "bg-brand/15 text-brand" : "text-foreground/40 hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-end gap-3">
        <span className="font-mono text-3xl font-semibold">{usd(coin.price)}</span>
        <span className={`mb-1 font-mono text-sm ${up ? "text-up" : "text-down"}`}>
          {up ? "▲" : "▼"} {pct(coin.change24h).replace("+", "")}
        </span>
      </div>

      <div className="mt-4 h-40 overflow-hidden rounded-2xl border border-foreground/5 bg-ink2/60">
        {chart.data ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chart.data.points} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="priceArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelFormatter={(_, payload) => {
                  const t = payload?.[0]?.payload?.t as number | undefined;
                  return t ? new Date(t).toLocaleString() : "";
                }}
                formatter={(value) => [usd(Number(value)), "Price"]}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="var(--color-brand)"
                strokeWidth={2}
                fill="url(#priceArea)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-full place-items-center text-[10px] uppercase tracking-[0.2em] text-foreground/30">
            Loading chart
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl glass-soft py-2">
          <p className="text-[10px] uppercase tracking-wider text-foreground/40">24h High</p>
          <p className="mt-1 font-mono text-sm">{usd(coin.high24h, 0)}</p>
        </div>
        <div className="rounded-xl glass-soft py-2">
          <p className="text-[10px] uppercase tracking-wider text-foreground/40">24h Low</p>
          <p className="mt-1 font-mono text-sm">{usd(coin.low24h, 0)}</p>
        </div>
        <div className="rounded-xl glass-soft py-2">
          <p className="text-[10px] uppercase tracking-wider text-foreground/40">Mkt Cap</p>
          <p className="mt-1 font-mono text-sm">{compact(coin.marketCap)}</p>
        </div>
      </div>
    </div>
  );
}
