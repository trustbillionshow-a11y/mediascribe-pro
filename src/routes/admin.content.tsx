import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminSettingsQuery } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/content")({
  component: ContentAdmin,
});

function ContentAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery(adminSettingsQuery);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState("");

  const update = useMutation({
    mutationFn: async ({ id, value, is_public }: { id: string; value: any; is_public: boolean }) => {
      const { error } = await supabase.from("site_settings").update({ value, is_public }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin", "site_settings"] });
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: async (key: string) => {
      const { error } = await supabase.from("site_settings").insert({ key, value: {}, is_public: true });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Created");
      qc.invalidateQueries({ queryKey: ["admin", "site_settings"] });
      setCreating(false); setNewKey("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("site_settings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "site_settings"] });
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="p-10 max-w-5xl">
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-3">CMS</div>
          <h1 className="font-display text-5xl uppercase font-extrabold tracking-tighter">Site Content</h1>
          <p className="text-muted-foreground text-sm mt-3 max-w-2xl">
            Every label, heading, footer line, and contact field used across the site. Each entry stores a JSON value — edit and save.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="size-4 mr-2" /> New key</Button>
      </div>

      <div className="space-y-4">
        {data?.map((row) => <SettingCard key={row.id} row={row} onSave={(v, p) => update.mutate({ id: row.id, value: v, is_public: p })} onDelete={() => { if (confirm(`Delete key "${row.key}"?`)) del.mutate(row.id); }} />)}
        {data?.length === 0 && <div className="text-muted-foreground text-sm p-10 text-center border border-border">No content keys yet. Click "New key" to create one.</div>}
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display uppercase tracking-tighter text-2xl">New content key</DialogTitle></DialogHeader>
          <Label className="text-[10px] font-mono uppercase tracking-widest">Key (e.g. hero, footer, contact)</Label>
          <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="hero" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            <Button disabled={!newKey || create.isPending} onClick={() => create.mutate(newKey)}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingCard({ row, onSave, onDelete }: { row: any; onSave: (v: any, p: boolean) => void; onDelete: () => void }) {
  const [text, setText] = useState(JSON.stringify(row.value, null, 2));
  const [isPublic, setIsPublic] = useState(row.is_public);
  const [error, setError] = useState<string | null>(null);

  function save() {
    try {
      const parsed = JSON.parse(text);
      setError(null);
      onSave(parsed, isPublic);
    } catch (e: any) {
      setError("Invalid JSON: " + e.message);
    }
  }

  return (
    <div className="border border-border bg-surface p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm uppercase tracking-widest text-accent">{row.key}</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            updated {new Date(row.updated_at).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
            Public <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </label>
          <Button size="sm" variant="ghost" onClick={onDelete}><Trash2 className="size-3.5 text-red-400" /></Button>
        </div>
      </div>
      <Textarea rows={Math.min(20, text.split("\n").length + 1)} className="font-mono text-xs" value={text} onChange={(e) => setText(e.target.value)} />
      {error && <div className="text-xs text-red-400 mt-2 font-mono">{error}</div>}
      <div className="flex justify-end mt-3">
        <Button size="sm" onClick={save}><Save className="size-3.5 mr-2" /> Save</Button>
      </div>
    </div>
  );
}
