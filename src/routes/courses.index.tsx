import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { z } from "zod";
import { categoriesQuery, coursesQuery } from "@/lib/courses";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CourseCard } from "@/components/site/CourseCard";

const searchSchema = z.object({
  category: z.string().optional(),
});

export const Route = createFileRoute("/courses/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "All Programs — Obscura Academy" },
      {
        name: "description",
        content:
          "Browse all diploma programs at Obscura Academy: video editing, cinematography, sound, photography, drone — physical and online.",
      },
      { property: "og:title", content: "All Programs — Obscura Academy" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(coursesQuery);
    context.queryClient.ensureQueryData(categoriesQuery);
  },
  component: CoursesIndex,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-12 text-center text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-12 text-center">Not found.</div>,
});

function CoursesIndex() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <Suspense fallback={<div className="p-24" />}>
        <CoursesList />
      </Suspense>
      <SiteFooter />
    </div>
  );
}

function CoursesList() {
  const { category } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: courses } = useSuspenseQuery(coursesQuery);

  const filtered = category
    ? courses.filter((c) => c.category?.slug === category)
    : courses;

  const activeCat = category ? categories.find((c) => c.slug === category) : null;

  return (
    <>
      <section className="px-6 pt-16 pb-12 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/"
            className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground hover:text-accent"
          >
            ← Home
          </Link>
          <h1 className="font-display text-5xl md:text-7xl font-extrabold uppercase tracking-tighter mt-8 mb-6 animate-reveal">
            {activeCat ? activeCat.name : "All Programs"}
          </h1>
          <p className="max-w-2xl text-muted-foreground text-sm">
            {activeCat?.description ??
              "From flagship diplomas to short specializations. Filter by discipline below."}
          </p>
        </div>
      </section>

      {/* FILTER BAR */}
      <section className="py-8 border-b border-border bg-surface/40 sticky top-[64px] z-40 backdrop-blur-md">
        <div className="px-6 max-w-7xl mx-auto flex gap-3 md:gap-4 items-center overflow-x-auto no-scrollbar">
          <button
            onClick={() => navigate({ search: {} })}
            className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest whitespace-nowrap border transition-colors ${
              !category
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate({ search: { category: cat.slug } })}
              className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest whitespace-nowrap border transition-colors ${
                category === cat.slug
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-baseline justify-between mb-8">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              Displaying {String(filtered.length).padStart(2, "0")} / {String(courses.length).padStart(2, "0")}
            </span>
          </div>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground py-24 text-center">No courses in this category yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-1">
              {filtered.map((c, i) => (
                <CourseCard key={c.id} course={c} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
