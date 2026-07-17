import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery, userRegistrationsQuery } from "@/lib/account";
import { settingsQuery, formatNGN } from "@/lib/courses";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileImage, FileText, Award, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account/certificates")({
  ssr: false,
  component: CertificatesPage,
});

type CertType = "start" | "finish";

function CertificatesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: profile } = useQuery({ ...profileQuery(userId ?? ""), enabled: !!userId });
  const { data: regs } = useQuery({ ...userRegistrationsQuery(userId ?? ""), enabled: !!userId });
  const { data: settings } = useQuery(settingsQuery);

  const eligible = useMemo(() => (regs ?? []).filter((r) => r.payment_status === "paid"), [regs]);

  const [regId, setRegId] = useState<string>("");
  const [type, setType] = useState<CertType>("start");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState<null | "png" | "pdf">(null);

  useEffect(() => {
    if (!regId && eligible.length) setRegId(eligible[0].id);
  }, [eligible, regId]);

  const reg = eligible.find((r) => r.id === regId);
  const brand = (settings?.brand?.name as string) || "OBSCURA ACADEMY";
  const brandTag = (settings?.brand?.tagline as string) || "School of Motion & Post-Production";
  const signatoryName = (settings?.certificate?.signatory_name as string) || "Director of Studies";
  const signatoryTitle = (settings?.certificate?.signatory_title as string) || "Academic Registrar";

  const certRef = useRef<HTMLDivElement | null>(null);

  async function ensureFonts() {
    // wait for browser fonts to be loaded so canvas render is clean
    try { await (document as any).fonts?.ready; } catch { /* noop */ }
  }

  async function downloadPNG() {
    if (!certRef.current || !reg) return;
    setBusy("png");
    try {
      await ensureFonts();
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `${brand.replace(/\s+/g, "_")}_${type}_${reg.courses?.title ?? "certificate"}.png`.replace(/[^\w.-]+/g, "_");
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Certificate PNG downloaded");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to render image");
    } finally {
      setBusy(null);
    }
  }

  async function downloadPDF() {
    if (!certRef.current || !reg) return;
    setBusy("pdf");
    try {
      await ensureFonts();
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      // fit while preserving aspect
      const ratio = Math.min(pw / canvas.width, ph / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      pdf.addImage(img, "PNG", (pw - w) / 2, (ph - h) / 2, w, h);
      pdf.save(`${brand.replace(/\s+/g, "_")}_${type}_${reg.courses?.title ?? "certificate"}.pdf`.replace(/[^\w.-]+/g, "_"));
      toast.success("Certificate PDF downloaded");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to render PDF");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="p-10 max-w-6xl">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-2">Documents</div>
      <h1 className="font-display text-4xl uppercase font-extrabold tracking-tighter mb-2">Certificates & Receipts</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Generate a professional certificate for any of your paid enrollments. Choose <strong>Start</strong> for an
        enrollment receipt or <strong>Finish</strong> for a completion certificate.
      </p>

      {eligible.length === 0 ? (
        <div className="border border-border p-10 text-center">
          <Award className="size-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">
            You don't have any paid enrollments yet. Once a course payment is confirmed, it will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-4 mb-6 p-5 border border-border">
            <Field label="Course">
              <Select value={regId} onValueChange={setRegId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {eligible.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.courses?.title ?? "Course"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Certificate type">
              <Select value={type} onValueChange={(v) => setType(v as CertType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="start">Start (Enrollment Receipt)</SelectItem>
                  <SelectItem value="finish">Finish (Completion Certificate)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date on certificate">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <Button onClick={downloadPNG} disabled={busy !== null}>
              {busy === "png" ? <Loader2 className="size-4 mr-2 animate-spin" /> : <FileImage className="size-4 mr-2" />}
              Download PNG
            </Button>
            <Button onClick={downloadPDF} disabled={busy !== null} variant="secondary">
              {busy === "pdf" ? <Loader2 className="size-4 mr-2 animate-spin" /> : <FileText className="size-4 mr-2" />}
              Download PDF
            </Button>
          </div>

          <div className="overflow-x-auto border border-border bg-neutral-100 p-6">
            <div className="mx-auto" style={{ width: 1123 }}>
              <Certificate
                ref={certRef}
                brand={brand}
                brandTag={brandTag}
                type={type}
                studentName={profile?.full_name || reg?.full_name || "Student Name"}
                courseTitle={reg?.courses?.title ?? "Course"}
                courseTagline={reg?.courses?.tagline ?? null}
                amount={reg?.total_amount_ngn ?? 0}
                reference={reg?.paystack_reference ?? reg?.id ?? ""}
                date={date}
                signatoryName={signatoryName}
                signatoryTitle={signatoryTitle}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

type CertProps = {
  brand: string;
  brandTag: string;
  type: CertType;
  studentName: string;
  courseTitle: string;
  courseTagline: string | null;
  amount: number;
  reference: string;
  date: string;
  signatoryName: string;
  signatoryTitle: string;
};

const Certificate = (function () {
  const Comp = (
    {
      brand, brandTag, type, studentName, courseTitle, courseTagline,
      amount, reference, date, signatoryName, signatoryTitle,
    }: CertProps,
    ref: React.Ref<HTMLDivElement>,
  ) => {
    const isFinish = type === "finish";
    const heading = isFinish ? "Certificate of Completion" : "Certificate of Enrollment";
    const body = isFinish
      ? "has successfully completed the training programme in"
      : "has been officially enrolled in the training programme";
    const humanDate = new Date(date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    return (
      <div
        ref={ref}
        style={{
          width: 1123,
          height: 794,
          background: "#fdfaf3",
          color: "#111",
          fontFamily: "'Inter Tight', Inter, system-ui, sans-serif",
          position: "relative",
          padding: 40,
          boxSizing: "border-box",
        }}
      >
        {/* Outer frame */}
        <div style={{
          position: "absolute", inset: 24, border: "2px solid #7a5a1e",
        }} />
        <div style={{
          position: "absolute", inset: 34, border: "1px solid #b8933f",
        }} />
        {/* Corners */}
        {(["tl","tr","bl","br"] as const).map((c) => (
          <div key={c} style={{
            position: "absolute",
            width: 60, height: 60,
            [c.includes("t") ? "top" : "bottom"]: 34,
            [c.includes("l") ? "left" : "right"]: 34,
            borderTop: c.includes("t") ? "3px solid #7a5a1e" : "none",
            borderBottom: c.includes("b") ? "3px solid #7a5a1e" : "none",
            borderLeft: c.includes("l") ? "3px solid #7a5a1e" : "none",
            borderRight: c.includes("r") ? "3px solid #7a5a1e" : "none",
          }} />
        ))}

        {/* Inner content */}
        <div style={{
          position: "relative", zIndex: 2, height: "100%",
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "40px 80px", textAlign: "center",
        }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, letterSpacing: "0.4em", color: "#7a5a1e", textTransform: "uppercase",
          }}>
            {brandTag}
          </div>
          <div style={{
            fontFamily: "'Inter Tight', Inter, sans-serif",
            fontWeight: 900, fontSize: 34, letterSpacing: "-0.03em",
            marginTop: 6, textTransform: "uppercase",
          }}>
            {brand}
          </div>

          <div style={{
            marginTop: 18, height: 1, width: 220, background: "#b8933f",
          }} />

          <div style={{
            marginTop: 22,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontStyle: "italic", fontSize: 30, color: "#7a5a1e",
          }}>
            {heading}
          </div>

          <div style={{
            marginTop: 30, fontSize: 14, color: "#333",
          }}>
            This is to certify that
          </div>

          <div style={{
            marginTop: 12,
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: 54, fontWeight: 700, color: "#111",
            borderBottom: "1px solid #b8933f", paddingBottom: 6,
            minWidth: 500,
          }}>
            {studentName}
          </div>

          <div style={{ marginTop: 18, fontSize: 14, color: "#333", maxWidth: 780 }}>
            {body}
          </div>

          <div style={{
            marginTop: 10, fontWeight: 800, fontSize: 24, textTransform: "uppercase",
            letterSpacing: "-0.01em",
          }}>
            {courseTitle}
          </div>
          {courseTagline && (
            <div style={{
              marginTop: 4, fontSize: 12, color: "#666", fontStyle: "italic",
            }}>
              {courseTagline}
            </div>
          )}

          <div style={{
            marginTop: 8, fontSize: 12, color: "#333",
          }}>
            Issued on <strong>{humanDate}</strong>
            {!isFinish && amount > 0 && <> · Tuition paid: <strong>{formatNGN(amount)}</strong></>}
          </div>

          {/* Signatures */}
          <div style={{
            marginTop: "auto", width: "100%",
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            paddingTop: 40,
          }}>
            {/* Academy signature */}
            <div style={{ width: 260, textAlign: "center" }}>
              <div style={{
                fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
                fontSize: 34, color: "#111", lineHeight: 1, paddingBottom: 4,
              }}>
                {signatoryName}
              </div>
              <div style={{ borderTop: "1px solid #333", paddingTop: 6, fontSize: 11, color: "#333" }}>
                {signatoryName}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "#666", marginTop: 2,
              }}>
                {signatoryTitle}
              </div>
            </div>

            {/* Seal */}
            <div style={{
              width: 110, height: 110, borderRadius: "50%",
              border: "3px double #7a5a1e",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              color: "#7a5a1e", padding: 8, textAlign: "center",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                letterSpacing: "0.2em", textTransform: "uppercase",
              }}>
                Official Seal
              </div>
              <div style={{
                fontWeight: 900, fontSize: 12, marginTop: 4,
                textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1,
              }}>
                {brand.split(" ")[0]}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 7,
                marginTop: 4, letterSpacing: "0.15em",
              }}>
                EST. {new Date().getFullYear()}
              </div>
            </div>

            {/* Candidate signature */}
            <div style={{ width: 260, textAlign: "center" }}>
              <div style={{ height: 34 }} />
              <div style={{ borderTop: "1px solid #333", paddingTop: 6, fontSize: 11, color: "#333" }}>
                Candidate Signature
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "#666", marginTop: 2,
              }}>
                Sign after printing
              </div>
            </div>
          </div>

          {/* Ref number */}
          <div style={{
            position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, letterSpacing: "0.3em", color: "#888", textTransform: "uppercase",
          }}>
            Ref · {reference}
          </div>
        </div>
      </div>
    );
  };
  return (require("react").forwardRef(Comp)) as unknown as (
    props: CertProps & { ref?: React.Ref<HTMLDivElement> }
  ) => JSX.Element;
})();
