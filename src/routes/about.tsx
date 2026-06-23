import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Obscura Academy" },
      {
        name: "description",
        content:
          "Obscura Academy is a Lagos-based film and multimedia institute, training the next generation of African editors, cinematographers, and sound designers.",
      },
      { property: "og:title", content: "About — Obscura Academy" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="px-6 pt-16 pb-24 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent block mb-6">
            The Institute
          </span>
          <h1 className="font-display text-5xl md:text-7xl font-extrabold uppercase tracking-tighter leading-[0.95] mb-12 animate-reveal">
            We don't teach <span className="italic text-muted-foreground/70">software.</span>
            <br /> We teach craft.
          </h1>
          <div className="prose prose-invert max-w-2xl text-muted-foreground space-y-6">
            <p className="text-lg leading-relaxed">
              Obscura Academy is a Lagos-based film and multimedia institute,
              dedicated to the technical precision of post-production and the
              discipline of moving-image craft.
            </p>
            <p className="leading-relaxed">
              Our programs are taught by working DPs, editors, colorists, and
              sound designers. Every student leaves with a finished portfolio
              piece, not a certificate of attendance.
            </p>
            <p className="leading-relaxed">
              The cut is the silent author of every film. We train the people
              who carry that authorship.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-12">
          <Stat n="07+" label="Active Programs" />
          <Stat n="100%" label="Practical Training" />
          <Stat n="3 Mo" label="Optional Internship" />
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="border-t border-border pt-6">
      <p className="font-display text-5xl font-extrabold mb-3">{n}</p>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
