import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Save, KeyRound, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/payments")({
  component: PaymentsAdmin,
});

const KEYS = [
  "paystack_mode",
  "paystack_public_key_test",
  "paystack_secret_key_test",
  "paystack_public_key_live",
  "paystack_secret_key_live",
] as const;

function PaymentsAdmin() {
  const qc = useQueryClient();
  const { data: rows } = useQuery({
    queryKey: ["admin", "paystack-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", KEYS as unknown as string[]);
      if (error) throw error;
      return data ?? [];
    },
  });

  const [form, setForm] = useState<Record<string, string>>({
    paystack_mode: "test",
    paystack_public_key_test: "",
    paystack_secret_key_test: "",
    paystack_public_key_live: "",
    paystack_secret_key_live: "",
  });

  useEffect(() => {
    if (!rows) return;
    const next: Record<string, string> = { ...form };
    for (const r of rows) next[r.key] = (r.value as any) ?? "";
    setForm(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const save = useMutation({
    mutationFn: async () => {
      const upserts = KEYS.map((k) => ({ key: k, value: form[k] ?? "", is_public: !k.includes("secret") }));
      const { error } = await supabase.from("site_settings").upsert(upserts, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin", "paystack-settings"] });
      qc.invalidateQueries({ queryKey: ["paystack-public-config"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const [testing, setTesting] = useState<null | "test" | "live">(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string }>>({});

  async function runTest(mode: "test" | "live") {
    setTesting(mode);
    try {
      await save.mutateAsync(); // ensure latest is saved
      const res = await fetch("/api/public/paystack/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json();
      setTestResult((r) => ({ ...r, [mode]: { ok: !!json.ok, msg: json.message ?? json.error ?? "" } }));
      if (json.ok) toast.success(json.message); else toast.error(json.error ?? "Test failed");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTesting(null);
    }
  }

  return (
    <div className="p-10 max-w-3xl">
      <div className="mb-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-3">Billing</div>
        <h1 className="font-display text-5xl uppercase font-extrabold tracking-tighter">Paystack</h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-xl">
          Paste your Paystack API keys. Use test keys to verify, switch to live when ready. Paystack handles card,
          bank transfer, USSD, QR, and mobile money in Nigerian Naira.
        </p>
      </div>

      <div className="space-y-6 border border-border bg-surface p-6">
        <div>
          <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">
            Active mode
          </Label>
          <Select value={form.paystack_mode} onValueChange={(v) => setForm({ ...form, paystack_mode: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="test">TEST (sandbox)</SelectItem>
              <SelectItem value="live">LIVE (real money)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            Current: <span className="font-mono uppercase text-accent">{form.paystack_mode}</span> — checkout will use these keys.
          </p>
        </div>

        <KeyBlock
          title="Test keys"
          publicKeyId="paystack_public_key_test"
          secretKeyId="paystack_secret_key_test"
          form={form}
          setForm={setForm}
          onTest={() => runTest("test")}
          testing={testing === "test"}
          result={testResult.test}
        />
        <KeyBlock
          title="Live keys"
          publicKeyId="paystack_public_key_live"
          secretKeyId="paystack_secret_key_live"
          form={form}
          setForm={setForm}
          onTest={() => runTest("live")}
          testing={testing === "live"}
          result={testResult.live}
        />

        <div className="flex justify-end gap-3 border-t border-border pt-6">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
            Save settings
          </Button>
        </div>
      </div>

      <div className="mt-8 text-xs text-muted-foreground border border-border p-4 bg-surface">
        <p className="font-mono uppercase tracking-widest text-accent mb-2">Where do I find these?</p>
        Sign in to your Paystack dashboard → Settings → API Keys & Webhooks. Copy both the public key
        (pk_test_… / pk_live_…) and the secret key (sk_test_… / sk_live_…).
      </div>
    </div>
  );
}

function KeyBlock({
  title, publicKeyId, secretKeyId, form, setForm, onTest, testing, result,
}: {
  title: string;
  publicKeyId: string;
  secretKeyId: string;
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
  onTest: () => void;
  testing: boolean;
  result?: { ok: boolean; msg: string };
}) {
  return (
    <div className="border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display uppercase tracking-tight text-lg flex items-center gap-2">
          <KeyRound className="size-4 text-accent" /> {title}
        </h3>
        <Button size="sm" variant="outline" onClick={onTest} disabled={testing}>
          {testing ? <Loader2 className="size-3.5 mr-2 animate-spin" /> : null}
          Test connection
        </Button>
      </div>
      <div className="grid gap-3">
        <div>
          <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">Public key</Label>
          <Input value={form[publicKeyId] ?? ""} onChange={(e) => setForm({ ...form, [publicKeyId]: e.target.value })} placeholder="pk_test_..." />
        </div>
        <div>
          <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">Secret key</Label>
          <Input type="password" value={form[secretKeyId] ?? ""} onChange={(e) => setForm({ ...form, [secretKeyId]: e.target.value })} placeholder="sk_test_..." />
        </div>
      </div>
      {result && (
        <div className={`mt-3 text-xs font-mono flex items-center gap-2 ${result.ok ? "text-green-400" : "text-red-400"}`}>
          {result.ok ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
          {result.msg}
        </div>
      )}
    </div>
  );
}
