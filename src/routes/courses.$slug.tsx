import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { ArrowLeft, MapPin, Clock, Calendar, Home, Wallet, Briefcase, CheckCircle2 } from "lucide-react";
import {
  courseBySlugQuery,
  coursesQuery,
  formatNGN,
  formatUSD,
  modeLabel,
} from "@/lib/courses";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CourseCard } from "@/components/site/CourseCard";
import { RegisterDialog } from "@/components/site/RegisterDialog";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/courses/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${titleFromSlug(params.slug)} — Obscura Academy` },
      { property: "og:title", content: `${titleFromSlug(params.slug)} — Obscura Academy` },
    ],
  }),
  loader: async ({ context, params }) => {
    const course = await context.queryClient.ensureQueryData(courseBySlugQuery(params.slug));
    if (!course) throw notFound();
    context.queryClient.ensureQueryData(coursesQuery);
  },
  component: CourseDetail,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-12 text-center text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <div className="p-24 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-4">
          ERR_NOT_FOUND
        </div>
        <h1 className="font-display text-5xl font-extrabold uppercase tracking-tighter mb-4">
          Course not found
        </h1>
        <Link to="/courses" className="font-mono text-xs uppercase text-muted-foreground hover:text-accent">
          ← Back to programs
        </Link>
      </div>
      <SiteFooter />
    </div>
  ),
});

function titleFromSlug(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function CourseDetail() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Suspense fallback={<div className="p-24" />}>
        <CourseBody />
      </Suspense>
      <SiteFooter />
      <Toaster />
    </div>
  );
}

function CourseBody() {
  const { slug } = Route.useParams();
  const { data: course } = useSuspenseQuery(courseBySlugQuery(slug));
  const { data: allCourses } = useSuspenseQuery(coursesQuery);
  const [registerOpen, setRegisterOpen] = useState(false);

function CourseBody() {
  const { slug } = Route.useParams();
  const { data: course } = useSuspenseQuery(courseBySlugQuery(slug));
  const { data: allCourses } = useSuspenseQuery(coursesQuery);

  if (!course) return null;

  const related = allCourses
    .filter((c) => c.id !== course.id && c.category_id === course.category_id)
    .slice(0, 3);

  return (
    <>
      {/* HEADER */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 pt-12 pb-6">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-accent mb-12"
          >
            <ArrowLeft className="size-3" /> All Programs
          </Link>

          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 animate-reveal">
              {course.category && (
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent block mb-6">
                  {course.category.name}
                </span>
              )}
              <h1 className="font-display text-5xl md:text-7xl font-extrabold uppercase tracking-tighter leading-[0.95] text-balance">
                {course.title}
              </h1>
              {course.tagline && (
                <p className="mt-6 text-lg md:text-xl text-muted-foreground italic font-display">
                  {course.tagline}
                </p>
              )}
              <div className="flex flex-wrap gap-3 mt-8">
                <Badge label={modeLabel(course.delivery_mode)} highlight={course.delivery_mode === "physical"} />
                {course.duration && <Badge label={course.duration} icon={<Clock className="size-3" />} />}
                {course.badge && (
                  <span className="font-mono text-[10px] bg-accent/20 text-accent px-3 py-1.5 uppercase tracking-widest">
                    {course.badge}
                  </span>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 animate-wipe">
              <div className="w-full aspect-[4/3] bg-surface overflow-hidden">
                {course.hero_image_url && (
                  <img
                    src={course.hero_image_url}
                    alt={course.title}
                    width={1000}
                    height={750}
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 animate-ken-burns"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BODY: description + sticky enrollment */}
      <section className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-16">
            {/* Overview */}
            {course.description && (
              <div>
                <h2 className="font-mono text-[10px] uppercase text-accent tracking-[0.2em] mb-6">
                  Overview
                </h2>
                <p className="text-lg leading-relaxed text-foreground/90 max-w-2xl">
                  {course.description}
                </p>
                {course.summary && course.summary !== course.description && (
                  <p className="text-sm leading-relaxed text-muted-foreground max-w-2xl mt-6">
                    {course.summary}
                  </p>
                )}
              </div>
            )}

            {/* Requirements */}
            {course.requirements && (
              <div>
                <h2 className="font-mono text-[10px] uppercase text-accent tracking-[0.2em] mb-6">
                  Requirements
                </h2>
                <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                  {course.requirements}
                </p>
              </div>
            )}

            {/* Curriculum */}
            {course.sessions && course.sessions.length > 0 && (
              <div>
                <h2 className="font-mono text-[10px] uppercase text-accent tracking-[0.2em] mb-8">
                  Course Contents
                </h2>
                <div className="space-y-8">
                  {course.sessions.map((s, i) => (
                    <div key={i} className="border-t border-border pt-6">
                      <div className="flex gap-6 items-start">
                        <span className="font-mono text-[10px] text-accent mt-1.5 whitespace-nowrap tracking-widest">
                          SESS_{String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="flex-1">
                          <h3 className="font-display text-2xl font-bold uppercase tracking-tight mb-4">
                            {s.title}
                          </h3>
                          <ul className="space-y-2.5">
                            {s.items.map((it, j) => (
                              <li
                                key={j}
                                className="flex gap-3 text-sm text-foreground/80"
                              >
                                <CheckCircle2 className="size-4 text-accent/70 shrink-0 mt-0.5" />
                                <span>{it}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky enrollment card */}
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 border border-border bg-surface p-8">
              <div className="flex items-center gap-2 mb-8">
                <div className="size-2 bg-accent rounded-full animate-pulse-dot" />
                <span className="font-mono text-[10px] uppercase text-accent tracking-[0.2em]">
                  Enrollment Open
                </span>
              </div>

              <div className="space-y-1 mb-2">
                <p className="font-mono text-[10px] uppercase text-muted-foreground tracking-widest">
                  Tuition
                </p>
                <p className="text-4xl font-display font-extrabold">
                  {formatNGN(course.tuition_ngn)}
                </p>
                <p className="text-muted-foreground font-mono">
                  {formatUSD(course.tuition_usd)} USD
                </p>
              </div>

              <div className="border-t border-border my-8" />

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                <DetailField icon={<Clock className="size-3.5" />} label="Duration" value={course.duration} />
                <DetailField icon={<MapPin className="size-3.5" />} label="Mode" value={modeLabel(course.delivery_mode)} />
                <DetailField icon={<Calendar className="size-3.5" />} label="Schedule" value={course.schedule} />
                <DetailField icon={<Briefcase className="size-3.5" />} label="Internship" value={course.internship_info ?? "N/A"} />
                <DetailField icon={<Home className="size-3.5" />} label="Accommodation" value={course.accommodation_info ?? "—"} fullWidth />
                <DetailField icon={<Wallet className="size-3.5" />} label="Payment Plan" value={course.payment_plan ?? "—"} fullWidth />
              </div>

              <a
                href="#"
                className="mt-10 block text-center w-full bg-foreground text-background font-display font-bold uppercase py-4 tracking-tight hover:bg-accent hover:text-accent-foreground transition-all"
              >
                Register for this course
              </a>
              <p className="text-[10px] text-center text-muted-foreground/70 mt-4 font-mono uppercase tracking-widest">
                Admissions team responds within 24h
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* RELATED */}
      {related.length > 0 && (
        <section className="px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-12">
              <h2 className="font-display text-3xl font-extrabold uppercase tracking-tighter">
                More in {course.category?.name}
              </h2>
              <Link
                to="/courses"
                className="font-mono text-[10px] text-muted-foreground hover:text-accent uppercase tracking-widest"
              >
                View all
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-1">
              {related.map((c, i) => (
                <CourseCard key={c.id} course={c} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Badge({ label, icon, highlight }: { label: string; icon?: React.ReactNode; highlight?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[10px] px-3 py-1.5 uppercase tracking-widest ${
        highlight
          ? "bg-accent/20 text-accent"
          : "border border-border text-foreground"
      }`}
    >
      {icon}
      {label}
    </span>
  );
}

function DetailField({
  icon,
  label,
  value,
  fullWidth,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-muted-foreground/80 tracking-widest mb-1.5">
        {icon}
        {label}
      </div>
      <p className="text-sm text-foreground leading-snug">{value ?? "—"}</p>
    </div>
  );
}
