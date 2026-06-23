import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatNGN } from "@/lib/courses";

export const Route = createFileRoute("/admin/registrations")({
  component: RegistrationsAdmin,
});

function RegistrationsAdmin() {
  const { data: regs } = useQuery({
    queryKey: ["admin", "registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("registrations")
        .select("*, course:courses(title, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="p-10">
      <div className="mb-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-3">Sales</div>
        <h1 className="font-display text-5xl uppercase font-extrabold tracking-tighter">Registrations</h1>
      </div>

      <div className="border border-border bg-surface overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-surface-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="text-left p-4">Student</th>
              <th className="text-left p-4">Course</th>
              <th className="text-left p-4">Device</th>
              <th className="text-right p-4">Total</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Reference</th>
              <th className="text-left p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {regs?.map((r: any) => (
              <tr key={r.id} className="border-t border-border align-top hover:bg-white/5">
                <td className="p-4">
                  <div className="font-medium">{r.full_name}</div>
                  <div className="text-xs text-muted-foreground">{r.email}</div>
                  {r.phone && <div className="text-xs text-muted-foreground">{r.phone}</div>}
                </td>
                <td className="p-4 text-muted-foreground">{r.course?.title ?? "—"}</td>
                <td className="p-4 text-muted-foreground capitalize">
                  {r.device_type}{r.device_other ? ` (${r.device_other})` : ""}
                </td>
                <td className="p-4 text-right font-mono">{formatNGN(r.total_amount_ngn)}</td>
                <td className="p-4">
                  <span className={`font-mono text-[10px] px-2 py-0.5 ${
                    r.payment_status === "paid" ? "bg-green-500/20 text-green-400" :
                    r.payment_status === "failed" ? "bg-red-500/20 text-red-400" :
                    "bg-muted text-muted-foreground"
                  }`}>{r.payment_status.toUpperCase()}</span>
                </td>
                <td className="p-4 font-mono text-xs">{r.paystack_reference ?? "—"}</td>
                <td className="p-4 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {regs?.length === 0 && (
              <tr><td colSpan={7} className="p-10 text-center text-muted-foreground text-sm">No registrations yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
