import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type MarketCoin = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  marketCap: number;
};

const COINS = [
  "bitcoin",
  "ethereum",
  "solana",
  "avalanche-2",
  "chainlink",
  "ripple",
  "cardano",
  "polkadot",
];

const FALLBACK: MarketCoin[] = [
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    price: 67241.18,
    change24h: 2.41,
    volume24h: 28400000000,
    high24h: 68102,
    low24h: 65310,
    marketCap: 1330000000000,
  },
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    price: 3512.9,
    change24h: 4.87,
    volume24h: 14100000000,
    high24h: 3580,
    low24h: 3390,
    marketCap: 421000000000,
  },
  {
    id: "solana",
    symbol: "SOL",
    name: "Solana",
    price: 172.44,
    change24h: -1.23,
    volume24h: 4900000000,
    high24h: 178.2,
    low24h: 169.1,
    marketCap: 79000000000,
  },
  {
    id: "avalanche-2",
    symbol: "AVAX",
    name: "Avalanche",
    price: 38.07,
    change24h: 6.12,
    volume24h: 980000000,
    high24h: 39.4,
    low24h: 35.6,
    marketCap: 15000000000,
  },
];

export const getMarkets = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ coins: MarketCoin[]; live: boolean }> => {
    try {
      const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
      url.searchParams.set("vs_currency", "usd");
      url.searchParams.set("ids", COINS.join(","));
      url.searchParams.set("order", "market_cap_desc");
      url.searchParams.set("price_change_percentage", "24h");

      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`);

      const raw = (await res.json()) as Array<Record<string, number | string | null>>;
      const coins: MarketCoin[] = raw.map((c) => ({
        id: String(c["id"]),
        symbol: String(c["symbol"] ?? "").toUpperCase(),
        name: String(c["name"] ?? ""),
        price: Number(c["current_price"] ?? 0),
        change24h: Number(c["price_change_percentage_24h"] ?? 0),
        volume24h: Number(c["total_volume"] ?? 0),
        high24h: Number(c["high_24h"] ?? 0),
        low24h: Number(c["low_24h"] ?? 0),
        marketCap: Number(c["market_cap"] ?? 0),
      }));

      if (coins.length === 0) throw new Error("Empty market response");
      return { coins, live: true };
    } catch (error) {
      console.error("[markets] falling back to cached prices", error);
      return { coins: FALLBACK, live: false };
    }
  },
);

export type ChartPoint = { t: number; price: number };

export const getCoinChart = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ coinId: z.string().min(1), days: z.number().int().min(1).max(365) }).parse(data))
  .handler(async ({ data }): Promise<{ points: ChartPoint[]; live: boolean }> => {
    try {
      const url = new URL(
        `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(data.coinId)}/market_chart`,
      );
      url.searchParams.set("vs_currency", "usd");
      url.searchParams.set("days", String(data.days));

      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`);

      const raw = (await res.json()) as { prices?: [number, number][] };
      const points = (raw.prices ?? []).map(([t, price]) => ({ t, price }));
      if (points.length === 0) throw new Error("Empty chart response");
      return { points, live: true };
    } catch (error) {
      console.error("[chart] falling back to synthetic series", error);
      const base = 100;
      const points: ChartPoint[] = Array.from({ length: 48 }, (_, i) => ({
        t: Date.now() - (48 - i) * 3600_000,
        price: base + Math.sin(i / 5) * 6 + i * 0.4,
      }));
      return { points, live: false };
    }
  });
