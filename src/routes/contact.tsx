import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/courses";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Admissions — Obscura Academy" },
      {
        name: "description",
        content:
          "Get in touch with Obscura Academy admissions. Lagos, Nigeria. Email, phone, and social channels.",
      },
      { property: "og:title", content: "Admissions — Obscura Academy" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(settingsQuery);
  },
  component: Contact,
});

function Contact() {
  const { data: settings } = useQuery(settingsQuery);
  const contact = settings?.contact ?? {};

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <section className="px-6 pt-16 pb-24 border-b border-border">
        <div className="max-w-5xl mx-auto">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent block mb-6">
            Admissions
          </span>
          <h1 className="font-display text-5xl md:text-7xl font-extrabold uppercase tracking-tighter leading-[0.95] mb-12 animate-reveal">
            Start the conversation.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mb-16">
            Tell us which program you're considering and we'll get back within
            24 hours with curriculum details, available cohorts, and payment plans.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {contact.email && (
              <ContactBlock icon={<Mail className="size-4" />} label="Email" value={contact.email} href={`mailto:${contact.email}`} />
            )}
            {contact.phone && (
              <ContactBlock icon={<Phone className="size-4" />} label="Phone" value={contact.phone} href={`tel:${contact.phone}`} />
            )}
            {contact.address && (
              <ContactBlock icon={<MapPin className="size-4" />} label="Campus" value={contact.address} />
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function ContactBlock({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="border-t border-border pt-6 group">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-accent mb-3">
        {icon}
        {label}
      </div>
      <p className="text-lg group-hover:text-accent transition-colors">{value}</p>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}
