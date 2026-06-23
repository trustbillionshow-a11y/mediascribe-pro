import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminCategoriesQuery } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { TablesInsert } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: CategoriesAdmin,
});

const EMPTY: TablesInsert<"categories"> = {
  slug: "", name: "", description: "", accent_color: "#cc6633", sort_order: 0, is_published: true,
};

function CategoriesAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery(adminCategoriesQuery);
  const [editing, setEditing] = useState<TablesInsert<"categories"> | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (p: TablesInsert<"categories">) => {
      if (editingId) {
        const { error } = await supabase.from("categories").update(p).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(p);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      setEditing(null); setEditingId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="p-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-3">Taxonomy</div>
          <h1 className="font-display text-5xl uppercase font-extrabold tracking-tighter">Categories</h1>
        </div>
        <Button onClick={() => { setEditingId(null); setEditing(EMPTY); }}>
          <Plus className="size-4 mr-2" /> New category
        </Button>
      </div>

      <div className="border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Slug</th>
              <th className="text-left p-4">Accent</th>
              <th className="text-left p-4">Sort</th>
              <th className="text-left p-4">Status</th>
              <th className="text-right p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-white/5">
                <td className="p-4 font-medium">{c.name}</td>
                <td className="p-4 text-muted-foreground font-mono">/{c.slug}</td>
                <td className="p-4"><span className="inline-block size-4 border border-border" style={{ background: c.accent_color ?? "transparent" }} /></td>
                <td className="p-4 font-mono">{c.sort_order}</td>
                <td className="p-4">
                  <span className={`font-mono text-[10px] px-2 py-0.5 ${c.is_published ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}`}>
                    {c.is_published ? "LIVE" : "DRAFT"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <Button size="sm" variant="ghost" onClick={() => { setEditingId(c.id); setEditing(c); }}><Pencil className="size-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete "${c.name}"?`)) del.mutate(c.id); }}>
                    <Trash2 className="size-3.5 text-red-400" />
                  </Button>
                </td>
              </tr>
            ))}
            {data?.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-muted-foreground text-sm">No categories yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && (setEditing(null), setEditingId(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-tighter text-2xl">
              {editingId ? "Edit category" : "New category"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div><Label className="text-[10px] font-mono uppercase tracking-widest">Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label className="text-[10px] font-mono uppercase tracking-widest">Slug</Label>
                <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
              <div><Label className="text-[10px] font-mono uppercase tracking-widest">Description</Label>
                <Textarea rows={3} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-[10px] font-mono uppercase tracking-widest">Accent color</Label>
                  <Input type="color" value={editing.accent_color ?? "#cc6633"} onChange={(e) => setEditing({ ...editing, accent_color: e.target.value })} /></div>
                <div><Label className="text-[10px] font-mono uppercase tracking-widest">Sort order</Label>
                  <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></div>
              </div>
              <div className="flex items-center justify-between border border-border px-3 py-2">
                <Label className="text-[10px] font-mono uppercase tracking-widest">Published</Label>
                <Switch checked={!!editing.is_published} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} />
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
