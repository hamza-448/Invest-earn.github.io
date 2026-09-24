import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Ambient } from "@/components/Ambient";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["signin", "signup"]).catch("signin") }),
  head: () => ({
    meta: [
      { title: "Sign in — Invest and Earn" },
      {
        name: "description",
        content: "Sign in or create your Invest and Earn account to trade crypto and track your portfolio.",
      },
      { property: "og:title", content: "Sign in — Invest and Earn" },
      {
        property: "og:description",
        content: "Sign in or create your Invest and Earn account to trade crypto and track your portfolio.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isSignUp, setIsSignUp] = useState(mode === "signup");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setCheckEmail(true);
          toast.success("Check your email to confirm your account.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink font-body text-foreground">
      <Ambient />
      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-md px-6 pb-20 pt-6">
        <div className="rounded-3xl glass p-6">
          <p className="text-[11px] uppercase tracking-[0.25em] text-brand/80">
            {isSignUp ? "Create account" : "Sign in"}
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold">
            {isSignUp ? "Start earning in minutes" : "Welcome back, trader"}
          </h1>

          {checkEmail ? (
            <p className="mt-4 text-sm text-foreground/60">
              We sent a confirmation link to {email}. Open it to activate your account, then come back and sign
              in.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              {isSignUp && (
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  className="w-full rounded-xl field px-4 py-3 text-sm outline-none placeholder:text-foreground/40"
                />
              )}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full rounded-xl field px-4 py-3 text-sm outline-none placeholder:text-foreground/40"
              />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl field px-4 py-3 text-sm outline-none placeholder:text-foreground/40"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-gradient-to-r from-brand to-accent py-3 font-semibold text-brand-foreground shadow-lg shadow-accent/20 transition hover:opacity-95 disabled:opacity-50"
              >
                {busy ? "Please wait…" : isSignUp ? "Get started" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={handleGoogle}
                className="w-full rounded-xl glass py-3 text-sm font-medium transition hover:bg-foreground/15"
              >
                Continue with Google
              </button>
            </form>
          )}

          <button
            onClick={() => {
              setIsSignUp((v) => !v);
              setCheckEmail(false);
            }}
            className="mt-4 text-xs text-foreground/50 transition hover:text-foreground"
          >
            {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
          </button>
        </div>
      </main>
    </div>
  );
}
