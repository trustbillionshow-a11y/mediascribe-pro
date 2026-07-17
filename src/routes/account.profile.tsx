import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery, NIGERIAN_STATES, type Profile } from "@/lib/account";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export const Route = createFileRoute("/account/profile")({
  ssr: false,
  component: ProfilePage,
});

function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const qc = useQueryClient();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: profile, isLoading } = useQuery({ ...profileQuery(userId ?? ""), enabled: !!userId });
  const [form, setForm] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  function set<K extends keyof Profile>(k: K, v: Profile[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!userId) return;
    setSaving(true);
    try {
      const payload = {
        user_id: userId,
        full_name: form.full_name ?? null,
        phone: form.phone ?? null,
        gender: form.gender ?? null,
        date_of_birth: form.date_of_birth || null,
        nationality: form.nationality ?? "Nigerian",
        state_of_origin: form.state_of_origin ?? null,
        lga: form.lga ?? null,
        address: form.address ?? null,
        city: form.city ?? null,
        occupation: form.occupation ?? null,
        nin: form.nin ?? null,
        next_of_kin_name: form.next_of_kin_name ?? null,
        next_of_kin_phone: form.next_of_kin_phone ?? null,
      };
      const { error } = await (supabase as any)
        .from("profiles")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("Profile saved");
      qc.invalidateQueries({ queryKey: ["profile", userId] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <div className="p-10 text-muted-foreground">Loading…</div>;

  return (
    <div className="p-10 max-w-3xl">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-2">Student profile</div>
      <h1 className="font-display text-4xl uppercase font-extrabold tracking-tighter mb-8">
        Your Details
      </h1>

      <Section title="Personal information">
        <Grid>
          <Field label="Full name *">
            <Input value={form.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} placeholder="Adaeze Okafor" />
          </Field>
          <Field label="Phone (WhatsApp) *">
            <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="+234 ..." />
          </Field>
          <Field label="Gender">
            <Select value={form.gender ?? ""} onValueChange={(v) => set("gender", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Date of birth">
            <Input type="date" value={form.date_of_birth ?? ""} onChange={(e) => set("date_of_birth", e.target.value)} />
          </Field>
          <Field label="Occupation">
            <Input value={form.occupation ?? ""} onChange={(e) => set("occupation", e.target.value)} placeholder="Student / Freelancer / etc." />
          </Field>
          <Field label="National ID (NIN)">
            <Input value={form.nin ?? ""} onChange={(e) => set("nin", e.target.value)} placeholder="11-digit NIN" maxLength={11} />
          </Field>
        </Grid>
      </Section>

      <Section title="Location">
        <Grid>
          <Field label="Nationality">
            <Input value={form.nationality ?? "Nigerian"} onChange={(e) => set("nationality", e.target.value)} />
          </Field>
          <Field label="State of origin">
            <Select value={form.state_of_origin ?? ""} onValueChange={(v) => set("state_of_origin", v)}>
              <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {NIGERIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="LGA">
            <Input value={form.lga ?? ""} onChange={(e) => set("lga", e.target.value)} />
          </Field>
          <Field label="City">
            <Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} placeholder="Lagos" />
          </Field>
          <Field label="Residential address *" full>
            <Textarea rows={2} value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} placeholder="Street, area, state" />
          </Field>
        </Grid>
      </Section>

      <Section title="Next of kin">
        <Grid>
          <Field label="Full name">
            <Input value={form.next_of_kin_name ?? ""} onChange={(e) => set("next_of_kin_name", e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={form.next_of_kin_phone ?? ""} onChange={(e) => set("next_of_kin_phone", e.target.value)} placeholder="+234 ..." />
          </Field>
        </Grid>
      </Section>

      <div className="mt-8 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
          Save profile
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4 border-b border-border pb-2">{title}</h2>
      {children}
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid md:grid-cols-2 gap-4">{children}</div>;
}
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}
