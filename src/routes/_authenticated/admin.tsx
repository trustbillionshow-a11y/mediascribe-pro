import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, GraduationCap, Tags, FileText, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { myRolesQuery } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/courses", label: "Courses", icon: GraduationCap },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/content", label: "Site Content", icon: FileText },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: roles, isLoading } = useQuery(myRolesQuery);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center font-mono text-xs uppercase tracking-widest text-muted-foreground">Loading…</div>;
  }

  if (!roles?.includes("admin")) {
    return (
      <div className="min-h-screen grid place-items-center px-6 bg-background">
        <div className="max-w-md text-center border border-border p-8 bg-surface">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-4">ERR_FORBIDDEN</div>
          <h1 className="font-display text-3xl uppercase font-extrabold mb-4">Not an admin</h1>
          <p className="text-sm text-muted-foreground mb-6">Your account does not have admin privileges.</p>
          <Button onClick={signOut} variant="outline">Sign out</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-60 border-r border-border bg-surface flex flex-col">
        <Link to="/" className="px-6 py-6 border-b border-border block">
          <div className="font-display font-extrabold uppercase tracking-tighter text-lg">OBSCURA</div>
          <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground mt-1">Admin Console</div>
        </Link>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-widest transition-colors ${
                  active ? "bg-accent/20 text-accent" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
