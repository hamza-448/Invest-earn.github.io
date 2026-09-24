import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { placeOrder } from "@/lib/trading.functions";
import type { MarketCoin } from "@/lib/markets.functions";
import { usd } from "@/lib/format";

export function OrderPanel({
  coin,
  signedIn,
  cash,
}: {
  coin: MarketCoin;
  signedIn: boolean;
  cash: number | undefined;
}) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("1250");
  const submit = useServerFn(placeOrder);
  const queryClient = useQueryClient();

  const amountUsd = Number(amount.replace(/[^0-9.]/g, "")) || 0;
  const fee = amountUsd * 0.001;

  const order = useMutation({
    mutationFn: () =>
      submit({
        data: { coinId: coin.id, symbol: coin.symbol, name: coin.name, side, amountUsd },
      }),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="rounded-3xl glass p-5">
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => setSide("buy")}
          className={`flex-1 rounded-full py-2 font-semibold transition ${
            side === "buy" ? "bg-brand text-brand-foreground" : "glass-soft text-foreground/70"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`flex-1 rounded-full py-2 font-semibold transition ${
            side === "sell" ? "bg-down text-brand-foreground" : "glass-soft text-foreground/70"
          }`}
        >
          Sell
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="order-amount" className="text-[11px] uppercase tracking-wider text-foreground/40">
            Amount
          </label>
          <div className="mt-1 flex items-center justify-between rounded-xl field px-4 py-3">
            <input
              id="order-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent font-mono text-lg outline-none"
            />
            <span className="shrink-0 text-xs text-foreground/40">
              ≈ {(amountUsd / (coin.price || 1)).toFixed(4)} {coin.symbol}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[11px] uppercase tracking-wider text-foreground/40">Price</span>
          <div className="mt-1 flex items-center justify-between rounded-xl field px-4 py-3">
            <span className="font-mono text-lg">{usd(coin.price)}</span>
            <span className="text-xs text-foreground/40">Market</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-foreground/50">
          <span>Est. fee</span>
          <span className="font-mono">{usd(fee)}</span>
        </div>

        {signedIn ? (
          <>
            {cash !== undefined && (
              <div className="flex items-center justify-between text-xs text-foreground/50">
                <span>Available cash</span>
                <span className="font-mono">{usd(cash)}</span>
              </div>
            )}
            <button
              disabled={order.isPending || amountUsd <= 0}
              onClick={() => order.mutate()}
              className="w-full rounded-xl bg-gradient-to-r from-brand to-accent py-3 font-semibold text-brand-foreground shadow-lg shadow-brand/20 transition hover:opacity-95 disabled:opacity-50"
            >
              {order.isPending ? "Placing order…" : side === "buy" ? "Confirm purchase" : "Confirm sale"}
            </button>
          </>
        ) : (
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="block w-full rounded-xl bg-gradient-to-r from-brand to-accent py-3 text-center font-semibold text-brand-foreground shadow-lg shadow-brand/20 transition hover:opacity-95"
          >
            Create account to trade
          </Link>
        )}
      </div>
    </div>
  );
}
