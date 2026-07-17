import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" }) as { redirect?: string };
  const dest = (search.redirect && search.redirect.startsWith("/")) ? search.redirect : "/account";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: dest });
    });
  }, [navigate, dest]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}${dest}` },
        });
        if (error) throw error;
        if (!data.session) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) {
            toast.success("Account created. Please check your email to confirm, then sign in.");
            setMode("signin");
            return;
          }
        }
        toast.success("Account created. Redirecting…");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: dest });
    } catch (err: any) {
      const msg = err?.message ?? "Authentication failed";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background grid place-items-center px-6">
      <div className="w-full max-w-sm border border-border p-8 bg-surface">
        <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-accent">
          ← Back to site
        </Link>
        <h1 className="font-display text-3xl uppercase font-extrabold mt-6 mb-2">
          {mode === "signin" ? "Sign in" : "Create admin"}
        </h1>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-8">
          {mode === "signin" ? "Admin access" : "First signup becomes admin"}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-[10px] font-mono uppercase tracking-widest">Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label className="text-[10px] font-mono uppercase tracking-widest">Password</Label>
            <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {errorMsg && (
            <div className="text-xs font-mono text-red-400 border border-red-900/50 bg-red-950/30 p-2">
              {errorMsg}
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "…" : mode === "signin" ? "Sign in" : "Sign up"}
          </Button>
        </form>
        <button
          type="button"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErrorMsg(null); }}
          className="mt-6 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-accent w-full text-center"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
      <Toaster />
    </div>
  );
}
