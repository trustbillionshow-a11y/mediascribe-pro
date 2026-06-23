import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/courses";

export function SiteHeader() {
  const { data: settings } = useQuery(settingsQuery);
  const brand = settings?.brand?.name ?? "OBSCURA ACADEMY";

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex justify-between items-center">
      <Link
        to="/"
        className="font-display font-extrabold text-xl tracking-tighter uppercase hover:text-accent transition-colors"
      >
        {brand}
      </Link>
      <div className="hidden md:flex gap-8 text-xs font-mono uppercase tracking-widest text-muted-foreground">
        <Link to="/courses" className="hover:text-accent transition-colors">
          Programs
        </Link>
        <Link
          to="/courses"
          search={{ category: "video-editing" }}
          className="hover:text-accent transition-colors"
        >
          The Edit Suite
        </Link>
        <Link to="/about" className="hover:text-accent transition-colors">
          Campus
        </Link>
        <Link to="/contact" className="hover:text-accent transition-colors">
          Admissions
        </Link>
      </div>
      <Link
        to="/courses"
        className="bg-foreground text-background text-[10px] font-mono font-bold uppercase px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors duration-300"
      >
        Apply Now
      </Link>
    </nav>
  );
}
