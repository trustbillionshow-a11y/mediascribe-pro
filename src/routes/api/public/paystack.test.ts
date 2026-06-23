import { createFileRoute } from "@tanstack/react-router";

// Admin uses this to verify a secret key works (lists transactions, perPage=1)
export const Route = createFileRoute("/api/public/paystack/test")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { mode?: "test" | "live" };
          const mode = body?.mode === "live" ? "live" : "test";
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const key = mode === "live" ? "paystack_secret_key_live" : "paystack_secret_key_test";
          const { data, error } = await supabaseAdmin
            .from("site_settings")
            .select("value")
            .eq("key", key)
            .maybeSingle();
          if (error) throw error;
          const secret = data?.value as string;
          if (!secret) return Response.json({ ok: false, error: "No secret key saved for this mode." }, { status: 400 });
          const res = await fetch("https://api.paystack.co/transaction?perPage=1", {
            headers: { Authorization: `Bearer ${secret}` },
          });
          const json: any = await res.json();
          if (!res.ok || !json?.status) {
            return Response.json({ ok: false, error: json?.message ?? `HTTP ${res.status}` }, { status: 400 });
          }
          return Response.json({ ok: true, message: `Connected to Paystack (${mode}).` });
        } catch (e: any) {
          return Response.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
        }
      },
    },
  },
});
