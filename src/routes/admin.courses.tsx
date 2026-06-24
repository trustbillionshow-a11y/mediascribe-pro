import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Trash2, Plus, Star, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminCoursesQuery, adminCategoriesQuery } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export const Route = createFileRoute("/admin/courses")({
  component: CoursesAdmin,
});

type Course = Tables<"courses">;

const EMPTY: TablesInsert<"courses"> = {
  slug: "",
  title: "",
  tagline: "",
  summary: "",
  description: "",
  hero_image_url: "",
  duration: "",
  schedule: "",
  delivery_mode: "physical",
  tuition_ngn: 0,
  tuition_usd: 0,
  accommodation_info: "",
  payment_plan: "",
  internship_info: "",
  requirements: "",
  sessions: [],
  badge: "",
  category_id: null,
  is_featured: false,
  is_hot: false,
  is_published: true,
  sort_order: 0,
};

function CoursesAdmin() {
  const qc = useQueryClient();
  const { data: courses } = useQuery(adminCoursesQuery);
  const { data: categories } = useQuery(adminCategoriesQuery);
  const [editing, setEditing] = useState<TablesInsert<"courses"> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (payload: TablesInsert<"courses">) => {
      // ensure JSON sessions
      let sessions = payload.sessions;
      if (typeof sessions === "string") {
        try { sessions = JSON.parse(sessions as unknown as string); }
        catch { throw new Error("Sessions must be valid JSON"); }
      }
      const clean = { ...payload, sessions };
      if (editingId) {
        const { error } = await supabase.from("courses").update(clean).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("courses").insert(clean);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      setEditing(null);
      setEditingId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  function startEdit(c: Course) {
    setEditingId(c.id);
    const { category, id, created_at, updated_at, ...rest } = c as any;
    setEditing({ ...rest, sessions: JSON.stringify(c.sessions, null, 2) as any });
  }
  function startNew() {
    setEditingId(null);
    setEditing({ ...EMPTY, sessions: JSON.stringify([{ title: "Session 1", items: ["Topic 1"] }], null, 2) as any });
  }

  return (
    <div className="p-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-3">Programs</div>
          <h1 className="font-display text-5xl uppercase font-extrabold tracking-tighter">Courses</h1>
        </div>
        <Button onClick={startNew}><Plus className="size-4 mr-2" /> New course</Button>
      </div>

      <div className="border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left p-4">Title</th>
              <th className="text-left p-4">Category</th>
              <th className="text-left p-4">Mode</th>
              <th className="text-left p-4">Tuition (NGN)</th>
              <th className="text-left p-4">Status</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses?.map((c: any) => (
              <tr key={c.id} className="border-t border-border hover:bg-white/5">
                <td className="p-4">
                  <div className="font-medium flex items-center gap-2">
                    {c.is_hot && <Flame className="size-3.5 text-accent" />}
                    {c.is_featured && <Star className="size-3.5 text-amber-400" />}
                    {c.title}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">/{c.slug}</div>
                </td>
                <td className="p-4 text-muted-foreground">{c.category?.name ?? "—"}</td>
                <td className="p-4 text-muted-foreground capitalize">{c.delivery_mode}</td>
                <td className="p-4 font-mono">{c.tuition_ngn?.toLocaleString() ?? "—"}</td>
                <td className="p-4">
                  <span className={`font-mono text-[10px] px-2 py-0.5 ${c.is_published ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
                    {c.is_published ? "LIVE" : "DRAFT"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(c)}><Pencil className="size-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete "${c.title}"?`)) del.mutate(c.id); }}>
                    <Trash2 className="size-3.5 text-red-400" />
                  </Button>
                </td>
              </tr>
            ))}
            {courses?.length === 0 && (
              <tr><td colSpan={6} className="p-10 text-center text-muted-foreground text-sm">No courses yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && (setEditing(null), setEditingId(null))}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-tighter text-2xl">
              {editingId ? "Edit course" : "New course"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Title"><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
              <Field label="Slug"><Input value={editing.slug ?? ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></Field>
              <Field label="Tagline" full><Input value={editing.tagline ?? ""} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} /></Field>
              <Field label="Summary (short)" full><Textarea rows={2} value={editing.summary ?? ""} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} /></Field>
              <Field label="Description (long)" full><Textarea rows={5} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
              <Field label="Hero image URL" full><Input value={editing.hero_image_url ?? ""} onChange={(e) => setEditing({ ...editing, hero_image_url: e.target.value })} /></Field>
              <Field label="Category">
                <Select value={editing.category_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, category_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Delivery mode">
                <Select value={editing.delivery_mode ?? "physical"} onValueChange={(v) => setEditing({ ...editing, delivery_mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Physical (In-person)</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Duration"><Input value={editing.duration ?? ""} onChange={(e) => setEditing({ ...editing, duration: e.target.value })} placeholder="e.g. 6 Months" /></Field>
              <Field label="Schedule"><Input value={editing.schedule ?? ""} onChange={(e) => setEditing({ ...editing, schedule: e.target.value })} placeholder="e.g. Mon–Fri, 10am–2pm" /></Field>
              <Field label="Tuition NGN"><Input type="number" value={editing.tuition_ngn ?? 0} onChange={(e) => setEditing({ ...editing, tuition_ngn: Number(e.target.value) })} /></Field>
              <Field label="Tuition USD"><Input type="number" value={editing.tuition_usd ?? 0} onChange={(e) => setEditing({ ...editing, tuition_usd: Number(e.target.value) })} /></Field>
              <Field label="Badge"><Input value={editing.badge ?? ""} onChange={(e) => setEditing({ ...editing, badge: e.target.value })} placeholder="e.g. HOT" /></Field>
              <Field label="Sort order"><Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></Field>
              <Field label="Accommodation info" full><Textarea rows={2} value={editing.accommodation_info ?? ""} onChange={(e) => setEditing({ ...editing, accommodation_info: e.target.value })} /></Field>
              <Field label="Payment plan" full><Textarea rows={2} value={editing.payment_plan ?? ""} onChange={(e) => setEditing({ ...editing, payment_plan: e.target.value })} /></Field>
              <Field label="Internship info" full><Textarea rows={2} value={editing.internship_info ?? ""} onChange={(e) => setEditing({ ...editing, internship_info: e.target.value })} /></Field>
              <Field label="Requirements" full><Textarea rows={3} value={editing.requirements ?? ""} onChange={(e) => setEditing({ ...editing, requirements: e.target.value })} /></Field>
              <Field label='Sessions (JSON array of {title, items[]})' full>
                <Textarea rows={10} className="font-mono text-xs" value={editing.sessions as any} onChange={(e) => setEditing({ ...editing, sessions: e.target.value as any })} />
              </Field>
              <div className="col-span-2 grid grid-cols-3 gap-4 pt-2 border-t border-border">
                <Toggle label="Hot topic" value={!!editing.is_hot} onChange={(v) => setEditing({ ...editing, is_hot: v })} />
                <Toggle label="Featured" value={!!editing.is_featured} onChange={(v) => setEditing({ ...editing, is_featured: v })} />
                <Toggle label="Published" value={!!editing.is_published} onChange={(v) => setEditing({ ...editing, is_published: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setEditing(null); setEditingId(null); }}>Cancel</Button>
            <Button onClick={() => editing && save.mutate(editing)} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between border border-border px-3 py-2">
      <Label className="text-[10px] font-mono uppercase tracking-widest">{label}</Label>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}
