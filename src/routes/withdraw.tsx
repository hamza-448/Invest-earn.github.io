import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Ambient } from "@/components/Ambient";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { usd } from "@/lib/format";

export const Route = createFileRoute("/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw Funds — Invest and Earn" },
      { name: "description", content: "Request a withdrawal by bank transfer, USDT, Binance Pay or card." },
      { property: "og:title", content: "Withdraw Funds — Invest and Earn" },
      { property: "og:description", content: "Request a withdrawal by bank transfer, USDT, Binance Pay or card." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WithdrawPage,
});

const METHODS = [
  { id: "bank", label: "Bank transfer", hint: "IBAN / account number", eta: "1–3 business days" },
  { id: "usdt_trc20", label: "USDT (TRC20)", hint: "Wallet address (starts with T)", eta: "Within 24 hours" },
  { id: "binance_pay", label: "Binance Pay", hint: "Binance Pay ID or email", eta: "Within 24 hours" },
  { id: "card", label: "Debit card", hint: "Last 4 digits of card", eta: "3–5 business days" },
] as const;
type MethodId = (typeof METHODS)[number]["id"];

const schema = z.object({
  amount: z.number().min(10, "Minimum withdrawal is $10").max(1_000_000),
  account_name: z.string().trim().min(2, "Enter the account holder name").max(100),
  destination: z.string().trim().min(3, "Enter where to send the funds").max(200),
  note: z.string().trim().max(500).optional(),
});

const STATUS_STYLE: Record<string, string> = {
  pending: "text-gold",
  approved: "text-accent",
  paid: "text-brand",
  rejected: "text-destructive",
};

function WithdrawPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [method, setMethod] = useState<MethodId>("bank");
  const [amount, setAmount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [destination, setDestination] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const history = useQuery({
    queryKey: ["withdrawals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const selected = METHODS.find((m) => m.id === method)!;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse({
      amount: Number(amount),
      account_name: accountName,
      destination,
      note: note || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: user.id,
      method,
      amount: parsed.data.amount,
      account_name: parsed.data.account_name,
      destination: parsed.data.destination,
      note: parsed.data.note ?? null,
    });
    setBusy(false);
    if (error) {
      toast.error("Couldn't submit your request. Please try again.");
      return;
    }
    toast.success("Withdrawal request submitted — we'll review it shortly.");
    setAmount("");
    setDestination("");
    setNote("");
    qc.invalidateQueries({ queryKey: ["withdrawals"] });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink font-body text-foreground">
      <Ambient />
      <SiteHeader />
      <main className="relative z-10 mx-auto max-w-5xl px-8 pb-24">
        <section className="mt-8">
          <p className="text-[11px] uppercase tracking-[0.25em] text-brand/80">Withdrawals</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Withdraw funds</h1>
          <p className="mt-2 max-w-xl text-sm text-foreground/50">
            Choose a method and submit a request. Every request is reviewed manually before payout.
          </p>
        </section>

        {!user ? (
          <div className="mt-8 rounded-3xl glass p-8 text-center">
            <p className="text-foreground/70">Sign in to request a withdrawal.</p>
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="mt-4 inline-block rounded-xl bg-gradient-to-r from-brand to-accent px-6 py-3 font-semibold text-brand-foreground"
            >
              Sign in
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <form onSubmit={submit} className="rounded-3xl glass p-7 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {METHODS.map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={
                      m.id === method
                        ? "rounded-2xl border border-brand/50 bg-brand/10 p-4 text-left"
                        : "rounded-2xl glass-soft p-4 text-left transition hover:bg-foreground/10"
                    }
                  >
                    <p className="font-medium">{m.label}</p>
                    <p className="mt-1 text-xs text-foreground/50">{m.eta}</p>
                  </button>
                ))}
              </div>

              <label className="block text-sm">
                <span className="text-foreground/60">Amount (USD)</span>
                <input type="number" min={10} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="field mt-1 w-full font-mono" placeholder="100.00" />
              </label>
              <label className="block text-sm">
                <span className="text-foreground/60">Account holder name</span>
                <input value={accountName} onChange={(e) => setAccountName(e.target.value)} maxLength={100} className="field mt-1 w-full" />
              </label>
              <label className="block text-sm">
                <span className="text-foreground/60">{selected.hint}</span>
                <input value={destination} onChange={(e) => setDestination(e.target.value)} maxLength={200} className="field mt-1 w-full font-mono" />
              </label>
              <label className="block text-sm">
                <span className="text-foreground/60">Note (optional)</span>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} className="field mt-1 w-full" />
              </label>
              <button
                disabled={busy}
                className="w-full rounded-xl bg-gradient-to-r from-brand to-accent py-3 font-semibold text-brand-foreground disabled:opacity-50"
              >
                {busy ? "Submitting…" : `Request withdrawal via ${selected.label}`}
              </button>
            </form>

            <div className="rounded-3xl glass p-7">
              <h2 className="font-display text-xl font-semibold">Your requests</h2>
              {history.isLoading ? (
                <p className="mt-4 text-sm text-foreground/50">Loading…</p>
              ) : !history.data?.length ? (
                <p className="mt-4 text-sm text-foreground/50">No withdrawal requests yet.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {history.data.map((r) => (
                    <li key={r.id} className="rounded-2xl glass-soft p-4 text-sm">
                      <div className="flex justify-between">
                        <span className="font-mono font-semibold">{usd(Number(r.amount))}</span>
                        <span className={`capitalize ${STATUS_STYLE[r.status] ?? ""}`}>{r.status}</span>
                      </div>
                      <p className="mt-1 text-xs text-foreground/50">
                        {METHODS.find((m) => m.id === r.method)?.label} · {new Date(r.created_at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
