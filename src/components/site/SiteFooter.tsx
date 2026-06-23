import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/courses";

export function SiteFooter() {
  const { data: settings } = useQuery(settingsQuery);
  const brand = settings?.brand?.name ?? "OBSCURA ACADEMY";
  const established = settings?.brand?.established ?? "EST. LAGOS, NG";
  const about =
    settings?.footer?.about ??
    "Crafting the next generation of African cinematic masters.";
  const contact = settings?.contact ?? {};

  return (
    <footer className="px-6 py-20 border-t border-border bg-background">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
        <div className="max-w-xs">
          <div className="font-display font-black text-2xl uppercase mb-6">
            {brand.split(" ")[0]}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed uppercase tracking-wider">
            {about}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
          <div className="flex flex-col gap-3 font-mono text-[10px] uppercase tracking-widest">
            <span className="text-muted-foreground/60 mb-2">Socials</span>
            <a href={contact.instagram ?? "#"} className="hover:text-accent transition-colors">
              Instagram
            </a>
            <a href={contact.youtube ?? "#"} className="hover:text-accent transition-colors">
              YouTube
            </a>
            <a href={contact.vimeo ?? "#"} className="hover:text-accent transition-colors">
              Vimeo
            </a>
          </div>
          <div className="flex flex-col gap-3 font-mono text-[10px] uppercase tracking-widest">
            <span className="text-muted-foreground/60 mb-2">Explore</span>
            <Link to="/courses" className="hover:text-accent transition-colors">
              All Programs
            </Link>
            <Link to="/about" className="hover:text-accent transition-colors">
              About
            </Link>
            <Link to="/contact" className="hover:text-accent transition-colors">
              Admissions
            </Link>
          </div>
          <div className="flex flex-col gap-3 font-mono text-[10px] uppercase tracking-widest">
            <span className="text-muted-foreground/60 mb-2">Contact</span>
            {contact.email && <a href={`mailto:${contact.email}`} className="hover:text-accent transition-colors normal-case tracking-normal">{contact.email}</a>}
            {contact.phone && <span className="normal-case tracking-normal">{contact.phone}</span>}
            {contact.address && <span className="normal-case tracking-normal">{contact.address}</span>}
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-border flex justify-between font-mono text-[9px] text-muted-foreground/50 uppercase tracking-[0.3em]">
        <span>© {new Date().getFullYear()} {brand}</span>
        <span>{established}</span>
      </div>
    </footer>
  );
}
