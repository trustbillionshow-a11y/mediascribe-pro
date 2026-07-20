import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/account";
import { settingsQuery, coursesQuery, formatNGN } from "@/lib/courses";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileImage, FileText, Award, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account/certificates")({
  ssr: false,
  component: CertificatesPage,
});

type CertType = "start" | "finish" | "membership";
type Software = { id: string; name: string; price_ngn: number; course_id: string };

type CertDraft = {
  key: string;
  studentName: string;
  courseId: string;
  type: CertType;
  date: string;
  softwareIds: string[];
  reference: string;
};

function makeRef() {
  return "OBS-" + Math.random().toString(36).slice(2, 8).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
}

function newDraft(defaults?: Partial<CertDraft>): CertDraft {
  return {
    key: crypto.randomUUID(),
    studentName: "",
    courseId: "",
    type: "start",
    date: new Date().toISOString().slice(0, 10),
    softwareIds: [],
    reference: makeRef(),
    ...defaults,
  };
}

function CertificatesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: profile } = useQuery({ ...profileQuery(userId ?? ""), enabled: !!userId });
  const { data: settings } = useQuery(settingsQuery);
  const { data: courses } = useQuery(coursesQuery);

  const { data: softwares } = useQuery({
    queryKey: ["all-course-softwares"],
    queryFn: async (): Promise<Software[]> => {
      const { data, error } = await supabase
        .from("course_softwares")
        .select("id, name, price_ngn, course_id")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Software[];
    },
  });

  const [drafts, setDrafts] = useState<CertDraft[]>([newDraft()]);
  const [activeKey, setActiveKey] = useState<string>(drafts[0].key);

  // Prefill first draft with profile name once loaded
  useEffect(() => {
    if (profile?.full_name) {
      setDrafts((ds) =>
        ds.map((d) => (d.studentName ? d : { ...d, studentName: profile.full_name ?? "" })),
      );
    }
  }, [profile?.full_name]);

  const active = drafts.find((d) => d.key === activeKey) ?? drafts[0];
  function updateActive(patch: Partial<CertDraft>) {
    setDrafts((ds) => ds.map((d) => (d.key === active.key ? { ...d, ...patch } : d)));
  }

  function addDraft() {
    const d = newDraft({ studentName: profile?.full_name ?? "" });
    setDrafts((ds) => [...ds, d]);
    setActiveKey(d.key);
  }
  function removeDraft(key: string) {
    setDrafts((ds) => {
      const next = ds.filter((d) => d.key !== key);
      if (next.length === 0) {
        const fresh = newDraft({ studentName: profile?.full_name ?? "" });
        setActiveKey(fresh.key);
        return [fresh];
      }
      if (key === activeKey) setActiveKey(next[0].key);
      return next;
    });
  }

  const selectedCourse = courses?.find((c) => c.id === active.courseId) ?? null;
  const courseSoftwares = useMemo(
    () => (softwares ?? []).filter((s) => s.course_id === active.courseId),
    [softwares, active.courseId],
  );
  const chosenSoftwares = useMemo(
    () => (softwares ?? []).filter((s) => active.softwareIds.includes(s.id)),
    [softwares, active.softwareIds],
  );

  const brand = (settings?.brand?.name as string) || "OBSCURA ACADEMY";
  const brandTag = (settings?.brand?.tagline as string) || "School of Motion & Post-Production";
  const signatoryName = (settings?.certificate?.signatory_name as string) || "Director of Studies";
  const signatoryTitle = (settings?.certificate?.signatory_title as string) || "Academic Registrar";

  const certRef = useRef<HTMLDivElement | null>(null);
  const [busy, setBusy] = useState<null | "png" | "pdf">(null);

  function readyToRender(): boolean {
    if (!active.studentName.trim()) {
      toast.error("Please enter the recipient's full name");
      return false;
    }
    if (!selectedCourse) {
      toast.error("Please select a course");
      return false;
    }
    return true;
  }

  async function ensureFonts() {
    try { await (document as any).fonts?.ready; } catch { /* noop */ }
  }

  // html2canvas (and older jsPDF) cannot parse oklch() colors coming from
  // the parent page's Tailwind/shadcn theme. We sanitize the cloned DOM before
  // rendering, replacing any oklch value with a printable hex fallback.
  function sanitizeClone(clonedDoc: Document) {
    const colorProps = [
      "color", "background-color", "background", "border-color",
      "border-top-color", "border-right-color", "border-bottom-color", "border-left-color",
      "outline-color", "box-shadow", "text-shadow", "fill", "stroke",
    ];
    const win = clonedDoc.defaultView;
    if (!win) return;
    clonedDoc.querySelectorAll("*").forEach((el) => {
      const htmlEl = el as HTMLElement;
      const computed = win.getComputedStyle(htmlEl);
      colorProps.forEach((prop) => {
        const value = computed.getPropertyValue(prop);
        if (value && value.includes("oklch")) {
          // Force a safe hex fallback. For background use parchment, for text use dark
          const fallback = prop.includes("background") ? "#fdfaf3" : "#111111";
          htmlEl.style.setProperty(prop, fallback, "important");
        }
      });
    });
  }

  async function renderCertificate() {
    if (!certRef.current) throw new Error("Certificate not ready");
    const html2canvas = (await import("html2canvas")).default;
    return html2canvas(certRef.current, {
      scale: 2,
      backgroundColor: "#fdfaf3",
      useCORS: true,
      onclone: (clonedDoc) => {
        sanitizeClone(clonedDoc);
      },
    });
  }

  async function downloadPNG() {
    if (!certRef.current || !readyToRender()) return;
    setBusy("png");
    try {
      await ensureFonts();
      const canvas = await renderCertificate();
      const link = document.createElement("a");
      link.download = `${brand}_${active.type}_${selectedCourse!.title}.png`.replace(/[^\w.-]+/g, "_");
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
    if (!certRef.current || !readyToRender()) return;
    setBusy("pdf");
    try {
      await ensureFonts();
      const canvas = await renderCertificate();
      const { jsPDF } = await import("jspdf");
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pw / canvas.width, ph / canvas.height);
      const w = canvas.width * ratio;
      const h = canvas.height * ratio;
      pdf.addImage(img, "PNG", (pw - w) / 2, (ph - h) / 2, w, h);
      pdf.save(`${brand}_${active.type}_${selectedCourse!.title}.pdf`.replace(/[^\w.-]+/g, "_"));
      toast.success("Certificate PDF downloaded");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to render PDF");
    } finally {
      setBusy(null);
    }
  }

  const softwareTotal = chosenSoftwares.reduce((sum, s) => sum + (s.price_ngn ?? 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-2">Documents</div>
      <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl uppercase font-extrabold tracking-tighter mb-2">
        Certificates &amp; Receipts
      </h1>
      <p className="text-sm text-muted-foreground mb-6 sm:mb-8">
        Fill in the details, choose a course and any bundled software, then download a
        company-grade certificate as PNG or PDF. Create as many certificates as you need.
      </p>

      {/* Draft tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {drafts.map((d, i) => {
          const label = d.studentName?.trim() || `Certificate ${i + 1}`;
          const isActive = d.key === activeKey;
          return (
            <div
              key={d.key}
              className={`flex items-center gap-2 pl-3 pr-1 py-1.5 border text-xs font-mono uppercase tracking-widest ${
                isActive ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <button onClick={() => setActiveKey(d.key)} className="max-w-[140px] sm:max-w-[180px] truncate">{label}</button>
              <button
                onClick={() => removeDraft(d.key)}
                className="p-1 hover:text-red-400"
                title="Remove"
                aria-label="Remove certificate"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          );
        })}
        <Button onClick={addDraft} size="sm" variant="outline" className="h-8">
          <Plus className="size-3.5 mr-1" /> New certificate
        </Button>
      </div>

      {/* Form */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4 p-4 sm:p-5 border border-border">
        <Field label="Recipient full name">
          <Input
            value={active.studentName}
            onChange={(e) => updateActive({ studentName: e.target.value })}
            placeholder="e.g. Adaeze Okonkwo"
          />
        </Field>
        <Field label="Course">
          <Select
            value={active.courseId}
            onValueChange={(v) => updateActive({ courseId: v, softwareIds: [] })}
          >
            <SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger>
            <SelectContent>
              {(courses ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Certificate type">
          <Select value={active.type} onValueChange={(v) => updateActive({ type: v as CertType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="start">Beginning · Enrollment &amp; Registration Receipt</SelectItem>
              <SelectItem value="membership">Membership · Official Cohort Membership</SelectItem>
              <SelectItem value="finish">Completion · Graduation Certificate</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Date on certificate">
          <Input type="date" value={active.date} onChange={(e) => updateActive({ date: e.target.value })} />
        </Field>

        <div className="sm:col-span-2">
          <Label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">
            Software included {courseSoftwares.length > 0 && `(${courseSoftwares.length} available)`}
          </Label>
          {!active.courseId ? (
            <div className="text-xs text-muted-foreground border border-dashed border-border p-4">
              Select a course to see available software add-ons.
            </div>
          ) : courseSoftwares.length === 0 ? (
            <div className="text-xs text-muted-foreground border border-dashed border-border p-4">
              No software add-ons configured for this course.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {courseSoftwares.map((s) => {
                const checked = active.softwareIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-start gap-3 p-3 border cursor-pointer transition ${
                      checked ? "border-accent bg-accent/5" : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        const on = !!v;
                        updateActive({
                          softwareIds: on
                            ? [...active.softwareIds, s.id]
                            : active.softwareIds.filter((x) => x !== s.id),
                        });
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{s.name}</div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        {formatNGN(s.price_ngn)}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={downloadPNG} disabled={busy !== null} className="flex-1 sm:flex-none">
          {busy === "png" ? <Loader2 className="size-4 mr-2 animate-spin" /> : <FileImage className="size-4 mr-2" />}
          Download PNG
        </Button>
        <Button onClick={downloadPDF} disabled={busy !== null} variant="secondary" className="flex-1 sm:flex-none">
          {busy === "pdf" ? <Loader2 className="size-4 mr-2 animate-spin" /> : <FileText className="size-4 mr-2" />}
          Download PDF
        </Button>
        <div className="hidden sm:flex ml-auto items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          <Download className="size-3" /> A4 landscape · 300dpi ready
        </div>
      </div>

      {/* Live preview — scrollable on mobile so full A4 stays legible */}
      <div className="-mx-4 sm:mx-0 overflow-x-auto border-y sm:border border-border bg-neutral-100 p-3 sm:p-6">
        <div className="mx-auto" style={{ width: 1123 }}>
          <Certificate
            ref={certRef}
            brand={brand}
            brandTag={brandTag}
            type={active.type}
            studentName={active.studentName || "Recipient Full Name"}
            courseTitle={selectedCourse?.title ?? "Select a course"}
            courseTagline={selectedCourse?.tagline ?? null}
            softwares={chosenSoftwares.map((s) => ({ name: s.name, price: s.price_ngn }))}
            softwareTotal={softwareTotal}
            reference={active.reference}
            date={active.date}
            signatoryName={signatoryName}
            signatoryTitle={signatoryTitle}
          />
        </div>
      </div>
      <div className="sm:hidden mt-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center">
        Swipe preview horizontally · A4 landscape · 300dpi ready
      </div>

      {!active.studentName || !selectedCourse ? (
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Award className="size-3.5" />
          Fill in the recipient name and pick a course to enable download.
        </div>
      ) : null}
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
  softwares: { name: string; price: number }[];
  softwareTotal: number;
  reference: string;
  date: string;
  signatoryName: string;
  signatoryTitle: string;
};

const Certificate = forwardRef<HTMLDivElement, CertProps>(function Certificate(
  {
    brand, brandTag, type, studentName, courseTitle, courseTagline,
    softwares, softwareTotal, reference, date, signatoryName, signatoryTitle,
  },
  ref,
) {
  const meta =
    type === "finish"
      ? {
          heading: "Certificate of Completion",
          statusLabel: "Certified Graduate",
          preamble: "Know all persons by these presents that",
          body: "having satisfied the academic requirements, completed all assessments and produced the required practical works, is hereby conferred the status of graduate of the professional training programme in",
          closing: "In recognition of dedication, craft and creative discipline demonstrated throughout the programme.",
        }
      : type === "membership"
      ? {
          heading: "Certificate of Membership",
          statusLabel: "Official Cohort Member",
          preamble: "This is to formally recognise that",
          body: "has been duly admitted and inducted as a bona fide member of the current studio cohort, with full access to mentorship, studio facilities and continuing professional development for the programme in",
          closing: "Granted with all rights, privileges and responsibilities accorded to members in good standing of the academy.",
        }
      : {
          heading: "Certificate of Enrollment",
          statusLabel: "Registered Student · Beginning",
          preamble: "This is to officially acknowledge that",
          body: "has been formally registered, has fulfilled the pre-programme requirements and is admitted to commence the professional training programme in",
          closing: "This document serves as an official receipt of registration and confirmation of a reserved seat within the incoming cohort.",
        };
  const { heading, statusLabel, preamble, body, closing } = meta;
  const humanDate = new Date(date + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return (
    <div
      ref={ref}
      style={{
        width: 1123, height: 794, background: "#fdfaf3", color: "#111",
        fontFamily: "'Inter Tight', Inter, system-ui, sans-serif",
        position: "relative", padding: 40, boxSizing: "border-box",
      }}
    >
      <div style={{ position: "absolute", inset: 24, border: "2px solid #7a5a1e" }} />
      <div style={{ position: "absolute", inset: 34, border: "1px solid #b8933f" }} />
      {(["tl","tr","bl","br"] as const).map((c) => (
        <div key={c} style={{
          position: "absolute", width: 60, height: 60,
          [c.includes("t") ? "top" : "bottom"]: 34,
          [c.includes("l") ? "left" : "right"]: 34,
          borderTop: c.includes("t") ? "3px solid #7a5a1e" : "none",
          borderBottom: c.includes("b") ? "3px solid #7a5a1e" : "none",
          borderLeft: c.includes("l") ? "3px solid #7a5a1e" : "none",
          borderRight: c.includes("r") ? "3px solid #7a5a1e" : "none",
        }} />
      ))}

      <div style={{
        position: "relative", zIndex: 2, height: "100%",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "36px 80px", textAlign: "center",
      }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.4em", color: "#7a5a1e", textTransform: "uppercase" }}>
          {brandTag}
        </div>
        <div style={{ fontFamily: "'Inter Tight', Inter, sans-serif", fontWeight: 900, fontSize: 32, letterSpacing: "-0.03em", marginTop: 6, textTransform: "uppercase" }}>
          {brand}
        </div>

        <div style={{ marginTop: 14, height: 1, width: 220, background: "#b8933f" }} />

        <div style={{ marginTop: 14, fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: "italic", fontSize: 28, color: "#7a5a1e" }}>
          {heading}
        </div>

        <div style={{
          marginTop: 8, display: "inline-block", padding: "4px 14px",
          border: "1px solid #7a5a1e", background: "rgba(184, 147, 63, 0.08)",
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
          letterSpacing: "0.35em", textTransform: "uppercase", color: "#7a5a1e",
        }}>
          {statusLabel}
        </div>

        <div style={{ marginTop: 16, fontSize: 13, color: "#333", fontStyle: "italic" }}>{preamble}</div>

        <div style={{
          marginTop: 8, fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: 46, fontWeight: 700, color: "#111",
          borderBottom: "1px solid #b8933f", paddingBottom: 6, minWidth: 500,
        }}>
          {studentName}
        </div>

        <div style={{ marginTop: 12, fontSize: 13, color: "#333", maxWidth: 820, lineHeight: 1.55 }}>{body}</div>

        <div style={{ marginTop: 8, fontWeight: 800, fontSize: 22, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
          {courseTitle}
        </div>
        {courseTagline && (
          <div style={{ marginTop: 3, fontSize: 12, color: "#666", fontStyle: "italic" }}>{courseTagline}</div>
        )}

        <div style={{ marginTop: 10, fontSize: 11, color: "#555", maxWidth: 780, fontStyle: "italic", lineHeight: 1.5 }}>
          {closing}
        </div>


        {softwares.length > 0 && (
          <div style={{ marginTop: 14, width: "100%", maxWidth: 760, border: "1px solid #b8933f", padding: "10px 14px", background: "rgba(184, 147, 63, 0.06)" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.3em", color: "#7a5a1e", textTransform: "uppercase", marginBottom: 6 }}>
              Included Software & Toolkit
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {softwares.map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#222" }}>
                  <span>• {s.name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#555" }}>
                    ₦{s.price.toLocaleString("en-NG")}
                  </span>
                </div>
              ))}
              {softwareTotal > 0 && (
                <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px dashed #b8933f", display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
                  <span>Total Toolkit Value</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>₦{softwareTotal.toLocaleString("en-NG")}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: 10, fontSize: 12, color: "#333" }}>
          Issued on <strong>{humanDate}</strong>
        </div>

        <div style={{ marginTop: "auto", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 24 }}>
          <div style={{ width: 240, textAlign: "center" }}>
            <div style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive", fontSize: 30, color: "#111", lineHeight: 1, paddingBottom: 4 }}>
              {signatoryName}
            </div>
            <div style={{ borderTop: "1px solid #333", paddingTop: 6, fontSize: 11, color: "#333" }}>{signatoryName}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "#666", marginTop: 2 }}>
              {signatoryTitle}
            </div>
          </div>

          <div style={{
            width: 100, height: 100, borderRadius: "50%", border: "3px double #7a5a1e",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            color: "#7a5a1e", padding: 8, textAlign: "center",
          }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Official Seal
            </div>
            <div style={{ fontWeight: 900, fontSize: 12, marginTop: 4, textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
              {brand.split(" ")[0]}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, marginTop: 4, letterSpacing: "0.15em" }}>
              EST. {new Date().getFullYear()}
            </div>
          </div>

          <div style={{ width: 240, textAlign: "center" }}>
            <div style={{ height: 30 }} />
            <div style={{ borderTop: "1px solid #333", paddingTop: 6, fontSize: 11, color: "#333" }}>Candidate Signature</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.2em", color: "#666", marginTop: 2 }}>
              Sign after printing
            </div>
          </div>
        </div>

        <div style={{
          position: "absolute", bottom: 14, left: 0, right: 0, textAlign: "center",
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.3em", color: "#888", textTransform: "uppercase",
        }}>
          Ref · {reference}
        </div>
      </div>
    </div>
  );
});
