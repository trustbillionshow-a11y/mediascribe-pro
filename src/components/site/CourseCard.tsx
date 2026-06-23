import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { Course } from "@/lib/courses";
import { formatNGN, formatUSD, modeLabel } from "@/lib/courses";

export function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  const accent = course.is_hot;
  return (
    <Link
      to="/courses/$slug"
      params={{ slug: course.slug }}
      className="group block animate-reveal"
      style={{ animationDelay: `${Math.min(index, 6) * 80}ms` }}
    >
      <div
        className={`border border-border ${accent ? "bg-surface" : "bg-background"} p-6 flex flex-col h-full hover:border-accent/60 transition-colors duration-300`}
      >
        <div className="w-full aspect-[4/5] bg-surface-2 mb-6 overflow-hidden">
          {course.hero_image_url ? (
            <img
              src={course.hero_image_url}
              alt={course.title}
              loading="lazy"
              width={800}
              height={1000}
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-700 ease-out"
            />
          ) : null}
        </div>

        <div className="flex justify-between items-start mb-4">
          {course.badge ? (
            <span
              className={`font-mono text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-widest ${
                course.is_hot
                  ? "bg-accent/20 text-accent"
                  : "border border-border text-foreground"
              }`}
            >
              {course.badge}
            </span>
          ) : (
            <span />
          )}
          {course.duration && (
            <span className="font-mono text-[10px] text-muted-foreground uppercase">
              {course.duration}
            </span>
          )}
        </div>

        <h3 className="font-display text-2xl font-bold uppercase tracking-tight leading-tight mb-2">
          {course.title}
        </h3>
        {course.summary && (
          <p className="text-sm text-muted-foreground mb-8 line-clamp-2">
            {course.summary}
          </p>
        )}

        <div className="mt-auto pt-6 border-t border-border flex justify-between items-center">
          <div className="font-mono text-sm">
            {formatNGN(course.tuition_ngn)}{" "}
            <span className="text-muted-foreground/70">
              / {formatUSD(course.tuition_usd)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest hidden sm:inline">
              {modeLabel(course.delivery_mode)}
            </span>
            <div className="size-8 border border-border grid place-items-center group-hover:bg-foreground group-hover:text-background transition-colors">
              <ArrowUpRight className="size-3.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
