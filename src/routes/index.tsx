import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import {
  categoriesQuery,
  coursesQuery,
  settingsQuery,
  formatNGN,
  formatUSD,
} from "@/lib/courses";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CourseCard } from "@/components/site/CourseCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Obscura Academy — Lagos Film Institute" },
      {
        name: "description",
        content:
          "Master the cut. Diploma programs in video editing, cinematography, sound, photography, and drone piloting — physical & online tracks in Lagos.",
      },
      { property: "og:title", content: "Obscura Academy — Lagos Film Institute" },
      { property: "og:image", content: "/images/hero-editing.jpg" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(coursesQuery);
    context.queryClient.ensureQueryData(categoriesQuery);
    context.queryClient.ensureQueryData(settingsQuery);
  },
  component: Index,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-12 text-center text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-12 text-center">Not found.</div>,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <SiteHeader />
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
      <SiteFooter />
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="px-6 pt-24 pb-32 max-w-7xl mx-auto">
      <div className="h-8 w-32 bg-surface mb-8" />
      <div className="h-32 bg-surface w-full max-w-3xl mb-8" />
      <div className="aspect-[3/4] w-1/3 bg-surface" />
    </div>
  );
}

function HomeContent() {
  const { data: settings } = useSuspenseQuery(settingsQuery);
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: courses } = useSuspenseQuery(coursesQuery);

  const hero = settings.hero ?? {};
  const featured = courses.filter((c) => c.is_featured).slice(0, 3);
  const hotCourse = courses.find((c) => c.is_hot) ?? courses[0];

  return (
    <>
      {/* HERO */}
      <section className="relative px-6 pt-12 pb-24 border-b border-border overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 items-end">
            <div className="flex-1 animate-reveal">
              <span className="font-mono text-accent text-xs uppercase tracking-[0.3em] block mb-6 font-medium">
                {hero.eyebrow ?? "Master the Cut"}
              </span>
              <h1 className="font-display text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tighter leading-[0.9] text-balance mb-8 uppercase">
                {(hero.headline ?? "Where the world learns to edit")
                  .split(" ")
                  .slice(0, -1)
                  .join(" ")}{" "}
                <span className="italic text-muted-foreground/70">
                  {(hero.headline ?? "Where the world learns to edit")
                    .split(" ")
                    .slice(-1)}
                </span>
              </h1>
              <p className="max-w-md text-muted-foreground text-sm leading-relaxed mb-10">
                {hero.subhead}
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link
                  to="/courses"
                  className="bg-accent text-accent-foreground px-8 py-4 font-display font-bold uppercase tracking-tight hover:brightness-110 transition-all"
                >
                  View Courses
                </Link>
                <Link
                  to="/about"
                  className="border border-border px-8 py-4 font-display font-bold uppercase tracking-tight hover:bg-white/5 transition-all"
                >
                  Virtual Tour
                </Link>
              </div>
            </div>
            <div className="w-full md:w-1/3 animate-wipe">
              <div className="w-full aspect-[3/4] bg-surface overflow-hidden">
                <img
                  src="/images/hero-editing.jpg"
                  alt="Editing console at Obscura Academy"
                  width={1200}
                  height={1600}
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 animate-ken-burns"
                />
              </div>
              <div className="font-mono text-[9px] text-muted-foreground/60 mt-3 tracking-widest uppercase">
                Featured Still / 01 — Post-Production Hall
              </div>
            </div>
          </div>
        </div>
        <div className="absolute right-4 bottom-12 font-display text-[14vw] leading-none opacity-[0.04] font-black uppercase pointer-events-none select-none overflow-hidden whitespace-nowrap">
          Editing Focus
        </div>
      </section>

      {/* CATEGORY RAIL */}
      <section className="py-12 border-b border-border bg-surface/50">
        <div className="px-6 max-w-7xl mx-auto flex gap-10 md:gap-12 items-center overflow-x-auto no-scrollbar">
          <span className="font-mono text-xs text-accent whitespace-nowrap">CATEGORIES:</span>
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              to="/courses"
              search={{ category: cat.slug }}
              className={`text-2xl font-display font-bold uppercase whitespace-nowrap transition-colors ${
                i === 0
                  ? "border-b-2 border-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED GRID */}
      <section className="px-6 py-20 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-extrabold uppercase tracking-tighter">
              Core Programs
            </h2>
            <Link
              to="/courses"
              className="font-mono text-[10px] text-muted-foreground hover:text-accent uppercase tracking-widest"
            >
              View all {courses.length}
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-1">
            {featured.map((c, i) => (
              <CourseCard key={c.id} course={c} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* HOT COURSE SYLLABUS PREVIEW */}
      {hotCourse && (
        <section className="px-6 py-24 bg-surface/40 border-y border-border">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <span className="font-mono text-[10px] uppercase text-accent tracking-[0.2em] block mb-4">
                Inside the program
              </span>
              <h2 className="font-display text-4xl md:text-5xl font-extrabold uppercase mb-6 tracking-tighter">
                {hotCourse.title}
              </h2>
              <p className="text-muted-foreground max-w-xl">
                {hotCourse.description ?? hotCourse.summary}
              </p>
            </div>

            <div className="space-y-10">
              {hotCourse.sessions.slice(0, 4).map((s, i) => (
                <div key={i} className="group">
                  <div className="flex gap-6 md:gap-8 items-start mb-6">
                    <span className="font-mono text-xs text-accent mt-2 whitespace-nowrap">
                      SESS_{String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-display text-xl md:text-2xl font-bold uppercase tracking-tight mb-4">
                        {s.title}
                      </h4>
                      <ul
                        className={`space-y-2 text-sm text-muted-foreground border-l ${i === 3 ? "border-l-2 border-accent" : "border-border"} pl-6`}
                      >
                        {s.items.map((it, j) => (
                          <li key={j} className={i === 3 && j === 0 ? "text-foreground font-medium" : ""}>
                            {it}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <hr className="border-border group-hover:border-accent/30 transition-colors" />
                </div>
              ))}
            </div>

            <div className="mt-16 p-8 bg-surface border border-border grid md:grid-cols-2 gap-12">
              <div>
                <h5 className="font-mono text-[10px] uppercase text-accent tracking-[0.2em] mb-4">
                  Investment
                </h5>
                <div className="space-y-2">
                  <p className="text-3xl font-display font-extrabold">
                    {formatNGN(hotCourse.tuition_ngn)}
                  </p>
                  <p className="text-muted-foreground font-mono">
                    {formatUSD(hotCourse.tuition_usd)} USD
                  </p>
                </div>
                {hotCourse.payment_plan && (
                  <p className="mt-6 text-xs text-muted-foreground">{hotCourse.payment_plan}</p>
                )}
              </div>
              <div className="flex flex-col justify-end">
                <Link
                  to="/courses/$slug"
                  params={{ slug: hotCourse.slug }}
                  className="block text-center w-full bg-foreground text-background font-display font-bold uppercase py-4 tracking-tight hover:bg-accent hover:text-accent-foreground transition-all"
                >
                  Enroll in this track
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* REST OF CATALOG */}
      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h3 className="font-display text-3xl md:text-4xl font-extrabold uppercase tracking-tighter">
              Explore more specializations
            </h3>
            <p className="text-sm text-muted-foreground mt-3">
              Sound, photography, motion graphics, and drone — full catalog below.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-1">
            {courses.filter((c) => !featured.find((f) => f.id === c.id)).map((c, i) => (
              <CourseCard key={c.id} course={c} index={i} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
