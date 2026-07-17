import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, X, CreditCard } from "lucide-react";
import {
  courseSoftwaresQuery,
  paystackPublicConfigQuery,
  DEVICE_OPTIONS,
  loadPaystack,
  type CourseSoftware,
} from "@/lib/registration";
import { formatNGN, type Course } from "@/lib/courses";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function RegisterDialog({ course, open, onClose }: { course: Course; open: boolean; onClose: () => void }) {
  const { data: softwares } = useQuery({ ...courseSoftwaresQuery(course.id), enabled: open });
  const { data: pConfig } = useQuery({ ...paystackPublicConfigQuery, enabled: open });

  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!open) return;
    supabase.auth.getUser().then(async ({ data }) => {
      const u = data.user;
      setUserId(u?.id ?? null);
      setAuthChecked(true);
      if (u) {
        setEmail((prev) => prev || u.email || "");
        const { data: prof } = await (supabase as any)
          .from("profiles")
          .select("full_name, phone")
          .eq("user_id", u.id)
          .maybeSingle();
        if (prof) {
          setName((prev) => prev || prof.full_name || "");
          setPhone((prev) => prev || prof.phone || "");
        }
      }
    });
  }, [open]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [device, setDevice] = useState<string>("laptop");
  const [deviceOther, setDeviceOther] = useState("");
  const [notes, setNotes] = useState("");
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const courseAmount = course.tuition_ngn ?? 0;
  const selectedSoftwares = useMemo(
    () => (softwares ?? []).filter((s) => picked[s.id]),
    [softwares, picked],
  );
  const softwareAmount = selectedSoftwares.reduce((a, s) => a + (s.price_ngn || 0), 0);
  const total = courseAmount + softwareAmount;

  async function handlePay() {
    if (!userId) return toast.error("Please sign in to enroll");
    if (!name || !email) return toast.error("Name and email are required");
    if (!pConfig?.publicKey) return toast.error("Paystack is not configured. Contact admin.");
    setSubmitting(true);
    try {
      const reference = `OBS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
      const payload = {
        course_id: course.id,
        user_id: userId,
        full_name: name,
        email,
        phone,
        device_type: device,
        device_other: device === "other" ? deviceOther : null,
        notes,
        selected_softwares: selectedSoftwares.map((s) => ({ id: s.id, name: s.name, price_ngn: s.price_ngn })),
        course_amount_ngn: courseAmount,
        software_amount_ngn: softwareAmount,
        total_amount_ngn: total,
        payment_status: "pending",
        paystack_reference: reference,
      };
      const { data: reg, error } = await supabase
        .from("registrations")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;

      await loadPaystack();
      const Paystack = (window as any).PaystackPop;
      if (!Paystack) throw new Error("Paystack failed to load");

      const setupParams = {
        key: pConfig.publicKey,
        email,
        amount: total * 100,
        currency: "NGN",
        ref: reference,
        // NOTE: do NOT pass `channels` — restricting it hides methods. Let
        // the Paystack dashboard configuration drive available methods.
        metadata: {
          course_id: course.id,
          course_title: course.title,
          registration_id: reg.id,
          full_name: name,
          phone,
          device_type: device,
          custom_fields: [
            { display_name: "Course", variable_name: "course", value: course.title },
            { display_name: "Device", variable_name: "device", value: device },
          ],
        },
        callback: function (response: any) {
          console.log("[Paystack] callback", response);
          fetch("/api/public/paystack/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: response.reference, registration_id: reg.id }),
          })
            .then((r) => r.json())
            .then((res) => {
              if (res.ok) {
                toast.success("Payment successful! Check your email for next steps.");
              } else {
                toast.error(`Payment could not be verified: ${res.error ?? "unknown"}`);
              }
            })
            .finally(() => setSubmitting(false));
        },
        onClose: function () {
          console.log("[Paystack] popup closed by user");
          setSubmitting(false);
          toast.info("Payment cancelled");
        },
      };

      console.log("[Paystack] setup params", {
        ...setupParams,
        key: setupParams.key ? `${setupParams.key.slice(0, 12)}…` : "(missing)",
      });

      // CRITICAL: close the Radix Dialog BEFORE opening the Paystack iframe.
      // Radix sets `pointer-events: none` on <body> and traps focus while the
      // dialog is open, which blocks clicks inside Paystack's overlay. Only
      // QR worked because it doesn't require clicking iframe controls.
      onClose();

      // Defer to next tick so Radix has unmounted its overlay & cleared
      // body styles before Paystack injects its iframe.
      setTimeout(() => {
        try {
          const handler = Paystack.setup(setupParams);
          handler.openIframe();
        } catch (err: any) {
          console.error("[Paystack] openIframe failed", err);
          toast.error(err?.message ?? "Failed to open Paystack");
          setSubmitting(false);
        }
      }, 120);
    } catch (e: any) {
      console.error("[Paystack] handlePay error", e);
      toast.error(e.message ?? "Failed to start payment");
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !submitting && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">Enrollment</div>
          <DialogTitle className="font-display text-3xl uppercase tracking-tighter">
            Register: {course.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-2">
          <Field label="Full name *">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </Field>
          <Field label="Email *">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          </Field>
          <Field label="Phone (WhatsApp)">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 ..." />
          </Field>
          <Field label="Your device">
            <Select value={device} onValueChange={setDevice}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEVICE_OPTIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {device === "other" && (
            <Field label="Specify device" full>
              <Input value={deviceOther} onChange={(e) => setDeviceOther(e.target.value)} placeholder="e.g. Chromebook" />
            </Field>
          )}
          <Field label="Anything we should know?" full>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </Field>
        </div>

        {/* Softwares */}
        <div className="mt-6 border-t border-border pt-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-3">
            Software install (optional)
          </div>
          {!softwares || softwares.length === 0 ? (
            <p className="text-sm text-muted-foreground">No software add-ons available for this course.</p>
          ) : (
            <div className="space-y-2">
              {softwares.map((s: CourseSoftware) => (
                <label
                  key={s.id}
                  className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                    picked[s.id] ? "border-accent bg-accent/5" : "border-border hover:bg-white/5"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!picked[s.id]}
                    onChange={(e) => setPicked({ ...picked, [s.id]: e.target.checked })}
                    className="mt-1 accent-accent"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between gap-4">
                      <span className="font-medium">{s.name}</span>
                      <span className="font-mono text-sm">{formatNGN(s.price_ngn)}</span>
                    </div>
                    {s.description && (
                      <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="mt-6 border-t border-border pt-6 space-y-2">
          <Row label="Course tuition" value={formatNGN(courseAmount)} />
          <Row label={`Software (${selectedSoftwares.length})`} value={formatNGN(softwareAmount)} />
          <div className="flex justify-between border-t border-border pt-3 font-display text-2xl">
            <span className="uppercase tracking-tighter">Total</span>
            <span className="font-extrabold">{formatNGN(total)}</span>
          </div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-right">
            Paystack · Card · Bank Transfer · USSD · QR
            {pConfig?.mode === "test" ? " · TEST MODE" : ""}
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="ghost" onClick={onClose} disabled={submitting} className="flex-1">
            <X className="size-4 mr-2" /> Cancel
          </Button>
          <Button onClick={handlePay} disabled={submitting || total <= 0} className="flex-1">
            {submitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <CreditCard className="size-4 mr-2" />}
            Pay {formatNGN(total)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
// re-export icon to keep tree-shake happy
export { Plus };
