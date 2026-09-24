import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Holding = {
  coinId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
};

export type Trade = {
  id: string;
  coinId: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  total: number;
  createdAt: string;
};

export type PortfolioData = {
  displayName: string;
  cash: number;
  holdings: Holding[];
  trades: Trade[];
};

export const getPortfolio = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PortfolioData> => {
    const { supabase, userId } = context;

    const [profileRes, holdingsRes, tradesRes] = await Promise.all([
      supabase.from("profiles").select("display_name, cash_balance").eq("id", userId).maybeSingle(),
      supabase.from("holdings").select("*").eq("user_id", userId).order("updated_at", { ascending: false }),
      supabase.from("trades").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    ]);

    if (profileRes.error) throw new Error(profileRes.error.message);
    if (holdingsRes.error) throw new Error(holdingsRes.error.message);
    if (tradesRes.error) throw new Error(tradesRes.error.message);

    return {
      displayName: profileRes.data?.display_name ?? "Trader",
      cash: Number(profileRes.data?.cash_balance ?? 0),
      holdings: (holdingsRes.data ?? [])
        .filter((h) => Number(h.quantity) > 0)
        .map((h) => ({
          coinId: h.coin_id,
          symbol: h.symbol,
          name: h.name,
          quantity: Number(h.quantity),
          avgPrice: Number(h.avg_price),
        })),
      trades: (tradesRes.data ?? []).map((t) => ({
        id: t.id,
        coinId: t.coin_id,
        symbol: t.symbol,
        side: t.side as "buy" | "sell",
        quantity: Number(t.quantity),
        price: Number(t.price),
        total: Number(t.total),
        createdAt: t.created_at,
      })),
    };
  });

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        coinId: z.string().min(1),
        symbol: z.string().min(1),
        name: z.string().min(1),
        side: z.enum(["buy", "sell"]),
        amountUsd: z.number().positive().max(1_000_000),
      })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<{ ok: true; message: string }> => {
    const { supabase, userId } = context;

    // Price comes from the server, never from the client.
    const priceRes = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(data.coinId)}&vs_currencies=usd`,
      { headers: { accept: "application/json" } },
    );
    if (!priceRes.ok) throw new Error("Live price unavailable right now. Please try again.");
    const priceJson = (await priceRes.json()) as Record<string, { usd?: number }>;
    const price = Number(priceJson[data.coinId]?.usd ?? 0);
    if (!price) throw new Error("Live price unavailable right now. Please try again.");

    const quantity = data.amountUsd / price;

    const [profileRes, holdingRes] = await Promise.all([
      supabase.from("profiles").select("cash_balance").eq("id", userId).maybeSingle(),
      supabase.from("holdings").select("*").eq("user_id", userId).eq("coin_id", data.coinId).maybeSingle(),
    ]);
    if (profileRes.error) throw new Error(profileRes.error.message);
    if (holdingRes.error) throw new Error(holdingRes.error.message);

    const cash = Number(profileRes.data?.cash_balance ?? 0);
    const heldQty = Number(holdingRes.data?.quantity ?? 0);
    const heldAvg = Number(holdingRes.data?.avg_price ?? 0);

    if (data.side === "buy") {
      if (data.amountUsd > cash) throw new Error("Not enough cash in your account for this order.");

      const newQty = heldQty + quantity;
      const newAvg = newQty > 0 ? (heldQty * heldAvg + data.amountUsd) / newQty : price;

      const upsert = await supabase.from("holdings").upsert(
        {
          user_id: userId,
          coin_id: data.coinId,
          symbol: data.symbol,
          name: data.name,
          quantity: newQty,
          avg_price: newAvg,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,coin_id" },
      );
      if (upsert.error) throw new Error(upsert.error.message);

      const cashUpdate = await supabase
        .from("profiles")
        .update({ cash_balance: cash - data.amountUsd })
        .eq("id", userId);
      if (cashUpdate.error) throw new Error(cashUpdate.error.message);
    } else {
      if (quantity > heldQty + 1e-12) throw new Error(`You only hold ${heldQty.toFixed(6)} ${data.symbol}.`);

      const newQty = Math.max(heldQty - quantity, 0);
      const update = await supabase
        .from("holdings")
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("coin_id", data.coinId);
      if (update.error) throw new Error(update.error.message);

      const cashUpdate = await supabase
        .from("profiles")
        .update({ cash_balance: cash + data.amountUsd })
        .eq("id", userId);
      if (cashUpdate.error) throw new Error(cashUpdate.error.message);
    }

    const trade = await supabase.from("trades").insert({
      user_id: userId,
      coin_id: data.coinId,
      symbol: data.symbol,
      side: data.side,
      quantity,
      price,
      total: data.amountUsd,
    });
    if (trade.error) throw new Error(trade.error.message);

    return {
      ok: true,
      message: `${data.side === "buy" ? "Bought" : "Sold"} ${quantity.toFixed(6)} ${data.symbol} at $${price.toLocaleString()}`,
    };
  });

export const updateDisplayName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ displayName: z.string().trim().min(1).max(40) }).parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ display_name: data.displayName })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
