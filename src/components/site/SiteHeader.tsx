import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/courses";
import { supabase } from "@/integrations/supabase/client";
import { UserCircle2 } from "lucide-react";

export function SiteHeader() {
  const { data: settings } = useQuery(settingsQuery);
  const brand = settings?.brand?.name ?? "OBSCURA ACADEMY";
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session?.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex justify-between items-center">
      <Link
        to="/"
        className="font-display font-extrabold text-xl tracking-tighter uppercase hover:text-accent transition-colors"
      >
        {brand}
      </Link>
      <div className="hidden md:flex gap-8 text-xs font-mono uppercase tracking-widest text-muted-foreground">
        <Link to="/courses" className="hover:text-accent transition-colors">Programs</Link>
        <Link to="/courses" search={{ category: "video-editing" }} className="hover:text-accent transition-colors">The Edit Suite</Link>
        <Link to="/about" className="hover:text-accent transition-colors">Campus</Link>
        <Link to="/contact" className="hover:text-accent transition-colors">Admissions</Link>
      </div>
      <div className="flex items-center gap-3">
        {signedIn ? (
          <Link
            to="/account"
            className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-accent"
          >
            <UserCircle2 className="size-4" /> My Account
          </Link>
        ) : (
          <Link
            to="/auth"
            className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-accent"
          >
            Sign in
          </Link>
        )}
        <Link
          to="/courses"
          className="bg-foreground text-background text-[10px] font-mono font-bold uppercase px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors duration-300"
        >
          Apply Now
        </Link>
      </div>
    </nav>
  );
}
