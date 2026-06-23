import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/paystack/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { reference?: string; registration_id?: string };
          const reference = body?.reference;
          const registrationId = body?.registration_id;
          if (!reference || !registrationId) {
            return Response.json({ ok: false, error: "Missing reference or registration_id" }, { status: 400 });
          }
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Read paystack mode + secret key from site_settings
          const { data: settings, error: sErr } = await supabaseAdmin
            .from("site_settings")
            .select("key, value")
            .in("key", ["paystack_mode", "paystack_secret_key_test", "paystack_secret_key_live"]);
          if (sErr) throw sErr;
          const map: Record<string, any> = {};
          for (const r of settings ?? []) map[r.key] = r.value;
          const mode = (map["paystack_mode"] ?? "test") as "test" | "live";
          const secret = (mode === "live" ? map["paystack_secret_key_live"] : map["paystack_secret_key_test"]) as string;
          if (!secret) {
            return Response.json({ ok: false, error: "Paystack secret key not configured" }, { status: 500 });
          }

          const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
            headers: { Authorization: `Bearer ${secret}` },
          });
          const json: any = await res.json();
          const success = json?.status && json?.data?.status === "success";

          await supabaseAdmin
            .from("registrations")
            .update({
              payment_status: success ? "paid" : "failed",
              payment_method: json?.data?.channel ?? null,
              paystack_reference: reference,
              paystack_response: json,
              paid_at: success ? new Date().toISOString() : null,
            })
            .eq("id", registrationId);

          return Response.json({ ok: success, data: json?.data ?? null });
        } catch (e: any) {
          return Response.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
        }
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" },
        }),
    },
  },
});
