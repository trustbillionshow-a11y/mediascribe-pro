import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminCoursesQuery } from "@/lib/admin";
import { courseSoftwaresQuery, type CourseSoftware } from "@/lib/registration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/softwares")({
  component: SoftwareAdmin,
});

function SoftwareAdmin() {
  const qc = useQueryClient();
  const { data: courses } = useQuery(adminCoursesQuery);
  const [courseId, setCourseId] = useState<string>("");

  const effectiveCourseId = courseId || (courses?.[0]?.id ?? "");
  const { data: softwares } = useQuery({
    ...courseSoftwaresQuery(effectiveCourseId),
    enabled: !!effectiveCourseId,
  });

  const [editing, setEditing] = useState<Partial<CourseSoftware> | null>(null);

  const save = useMutation({
    mutationFn: async (payload: Partial<CourseSoftware>) => {
      const row = {
        course_id: effectiveCourseId,
        name: payload.name ?? "",
        description: payload.description ?? null,
        price_ngn: Number(payload.price_ngn ?? 0),
        sort_order: Number(payload.sort_order ?? 0),
      };
      if (payload.id) {
        const { error } = await supabase.from("course_softwares").update(row).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("course_softwares").insert(row);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["course-softwares", effectiveCourseId] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_softwares").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["course-softwares", effectiveCourseId] });
    },
  });

  return (
    <div className="p-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-3">Add-ons</div>
          <h1 className="font-display text-5xl uppercase font-extrabold tracking-tighter">Software per course</h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-xl">
            Add software install options students can include at checkout. Prices are added on top of tuition.
          </p>
        </div>
        <Button onClick={() => setEditing({ name: "", price_ngn: 0, sort_order: 0 })} disabled={!effectiveCourseId}>
          <Plus className="size-4 mr-2" /> Add software
        </Button>
      </div>

      <div className="mb-6 max-w-md">
        <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">
          Course
        </Label>
        <Select value={effectiveCourseId} onValueChange={setCourseId}>
          <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
          <SelectContent>
            {courses?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left p-4">Software</th>
              <th className="text-left p-4">Description</th>
              <th className="text-right p-4">Price (NGN)</th>
              <th className="text-right p-4">Sort</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {softwares?.map((s) => (
              <tr key={s.id} className="border-t border-border hover:bg-white/5">
                <td className="p-4 font-medium flex items-center gap-2">
                  <Wrench className="size-3.5 text-muted-foreground" /> {s.name}
                </td>
                <td className="p-4 text-muted-foreground">{s.description}</td>
                <td className="p-4 text-right font-mono">{s.price_ngn.toLocaleString()}</td>
                <td className="p-4 text-right font-mono">{s.sort_order}</td>
                <td className="p-4 text-right">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(s)}><Pencil className="size-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => confirm(`Delete "${s.name}"?`) && del.mutate(s.id)}>
                    <Trash2 className="size-3.5 text-red-400" />
                  </Button>
                </td>
              </tr>
            ))}
            {(!softwares || softwares.length === 0) && (
              <tr><td colSpan={5} className="p-10 text-center text-muted-foreground text-sm">
                {effectiveCourseId ? "No software yet. Click + Add software." : "Select a course first."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit software" : "Add software"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">Name</Label>
                <Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Adobe Premiere Pro" />
              </div>
              <div>
                <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">Description</Label>
                <Textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} placeholder="Latest version with plugins" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">Price (NGN)</Label>
                  <Input type="number" value={editing.price_ngn ?? 0} onChange={(e) => setEditing({ ...editing, price_ngn: Number(e.target.value) })} />
                </div>
                <div>
                  <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">Sort order</Label>
                  <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => editing && save.mutate(editing)} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
