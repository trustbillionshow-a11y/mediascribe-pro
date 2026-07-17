import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentUserQuery, profileQuery, userRegistrationsQuery } from "@/lib/account";
import { formatNGN } from "@/lib/courses";
import { CheckCircle2, Clock, XCircle, ArrowRight, Award } from "lucide-react";

export const Route = createFileRoute("/account/")({
  ssr: false,
  component: OverviewPage,
});

function OverviewPage() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: profile } = useQuery({ ...profileQuery(userId ?? ""), enabled: !!userId });
  const { data: regs } = useQuery({ ...userRegistrationsQuery(userId ?? ""), enabled: !!userId });

  const paid = (regs ?? []).filter((r) => r.payment_status === "paid").length;
  const pending = (regs ?? []).filter((r) => r.payment_status === "pending").length;
  const spent = (regs ?? []).filter((r) => r.payment_status === "paid").reduce((a, r) => a + (r.total_amount_ngn || 0), 0);

  const profileComplete =
    profile?.full_name && profile?.phone && profile?.state_of_origin && profile?.address;

  return (
    <div className="p-10 max-w-5xl">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-2">Welcome back</div>
      <h1 className="font-display text-5xl uppercase font-extrabold tracking-tighter mb-8">
        {profile?.full_name || "Student"}
      </h1>

      {!profileComplete && (
        <div className="border border-accent/40 bg-accent/5 p-5 mb-8">
          <div className="font-mono text-[10px] uppercase tracking-widest text-accent mb-1">Action needed</div>
          <p className="text-sm mb-3">
            Complete your profile so we can process enrollments, issue certificates, and contact you.
          </p>
          <Link to="/account/profile" className="text-xs font-mono uppercase tracking-widest text-accent hover:underline inline-flex items-center gap-1">
            Complete profile <ArrowRight className="size-3" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-10">
        <Stat label="Paid Enrollments" value={String(paid)} />
        <Stat label="Pending" value={String(pending)} />
        <Stat label="Total invested" value={formatNGN(spent)} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl uppercase font-extrabold tracking-tighter">My Enrollments</h2>
        <Link to="/account/certificates" className="text-xs font-mono uppercase tracking-widest text-accent hover:underline inline-flex items-center gap-1">
          <Award className="size-3.5" /> Generate Certificate
        </Link>
      </div>

      {(!regs || regs.length === 0) ? (
        <div className="border border-border p-10 text-center">
          <p className="text-muted-foreground mb-4">You haven't enrolled in a course yet.</p>
          <Link to="/courses" className="inline-block bg-accent text-accent-foreground px-5 py-2.5 text-xs font-mono uppercase tracking-widest">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="border border-border divide-y divide-border">
          {regs.map((r) => (
            <div key={r.id} className="p-4 flex items-center gap-4">
              <StatusIcon status={r.payment_status} />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{r.courses?.title ?? "Course"}</div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()} · {r.paystack_reference ?? "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm">{formatNGN(r.total_amount_ngn)}</div>
                <div className={`text-[10px] font-mono uppercase tracking-widest ${
                  r.payment_status === "paid" ? "text-green-400" : r.payment_status === "pending" ? "text-yellow-400" : "text-red-400"
                }`}>{r.payment_status}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border p-5">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-3xl font-extrabold mt-2">{value}</div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "paid") return <CheckCircle2 className="size-5 text-green-400 shrink-0" />;
  if (status === "pending") return <Clock className="size-5 text-yellow-400 shrink-0" />;
  return <XCircle className="size-5 text-red-400 shrink-0" />;
}
