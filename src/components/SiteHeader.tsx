import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export function SiteHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="relative z-10 flex items-center justify-between px-8 py-5">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand to-accent font-display font-bold text-brand-foreground"
        >
          IE
        </Link>
        <span className="font-display text-lg font-semibold tracking-tight">Invest and Earn</span>
        <span className="ml-2 hidden text-[10px] uppercase tracking-[0.2em] text-foreground/40 md:inline">
          Live Markets
        </span>
      </div>
      <nav className="hidden items-center gap-8 text-sm text-foreground/60 lg:flex">
        <Link to="/" activeProps={{ className: "text-foreground font-medium" }} className="transition hover:text-foreground">
          Markets
        </Link>
        <Link
          to="/portfolio"
          activeProps={{ className: "text-foreground font-medium" }}
          className="transition hover:text-foreground"
        >
          Portfolio
        </Link>
        <Link
          to="/plans"
          activeProps={{ className: "text-foreground font-medium" }}
          className="transition hover:text-foreground"
        >
          Plans
        </Link>
        <Link
          to="/withdraw"
          activeProps={{ className: "text-foreground font-medium" }}
          className="transition hover:text-foreground"
        >
          Withdraw
        </Link>
      </nav>
      <div className="flex items-center gap-3">
        {user ? (
          <button
            onClick={() => signOut()}
            className="rounded-full glass px-4 py-2 text-sm font-medium transition hover:bg-foreground/15"
          >
            Sign out
          </button>
        ) : (
          <>
            <Link to="/auth" search={{ mode: "signin" }} className="text-sm text-foreground/70 transition hover:text-foreground">
              Sign in
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="rounded-full glass px-4 py-2 text-sm font-medium transition hover:bg-foreground/15"
            >
              Create account
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
