import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, User, Award, LogOut, ArrowLeft } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/account")({
  ssr: false,
  component: AccountLayout,
});

const NAV: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/account/profile", label: "Profile", icon: User },
  { to: "/account/certificates", label: "Certificates", icon: Award },
];

function AccountLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate({ to: "/auth", search: { redirect: "/account" } as any });
      } else {
        setEmail(data.user.email ?? null);
        setChecking(false);
      }
    });
  }, [navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (checking) {
    return <div className="min-h-screen grid place-items-center bg-background text-muted-foreground font-mono text-xs uppercase tracking-widest">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-64 border-r border-border bg-surface flex flex-col">
        <Link to="/" className="px-6 py-6 border-b border-border block">
          <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-1">
            <ArrowLeft className="size-3" /> Back to site
          </div>
          <div className="font-display font-extrabold uppercase tracking-tighter text-lg mt-2">My Account</div>
        </Link>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-widest transition-colors ${
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <Icon className="size-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 truncate">{email}</div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-red-400"
          >
            <LogOut className="size-3.5" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
