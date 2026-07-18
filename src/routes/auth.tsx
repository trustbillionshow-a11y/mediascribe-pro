import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast, Toaster } from "sonner";

const AUTH_TIMEOUT_MS = 20000;

function authErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "AUTH_TIMEOUT") {
      return "The connection is taking too long. Please check your internet and try again.";
    }
    if (error.message === "Failed to fetch" || error.message === "Load failed") {
      return "Could not reach the login service. Please try again.";
    }
    return error.message;
  }
  return "Authentication failed. Please try again.";
}

async function withAuthTimeout<T>(promise: Promise<T>) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("AUTH_TIMEOUT")), AUTH_TIMEOUT_MS);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

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
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      if (mode === "signup") {
        const { data, error } = await withAuthTimeout(
          supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { emailRedirectTo: `${window.location.origin}${dest}` },
          }),
        );
        if (error) throw error;
        if (!data.session) {
          const { error: signInErr } = await withAuthTimeout(
            supabase.auth.signInWithPassword({ email: email.trim(), password }),
          );
          if (signInErr) {
            toast.success("Account created. Please check your email to confirm, then sign in.");
            setMode("signin");
            return;
          }
        }
        toast.success("Account created. Redirecting…");
      } else {
        const { error } = await withAuthTimeout(
          supabase.auth.signInWithPassword({ email: email.trim(), password }),
        );
        if (error) throw error;
      }
      navigate({ to: dest });
    } catch (err: any) {
      const msg = authErrorMessage(err);
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
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-8">
          {mode === "signin" ? "Access your student account" : "Register to enroll & track your courses"}
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
