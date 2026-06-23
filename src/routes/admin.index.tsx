import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminCoursesQuery, adminCategoriesQuery, adminSettingsQuery } from "@/lib/admin";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: courses } = useQuery(adminCoursesQuery);
  const { data: cats } = useQuery(adminCategoriesQuery);
  const { data: settings } = useQuery(adminSettingsQuery);

  const stats = [
    { label: "Courses", value: courses?.length ?? 0, to: "/admin/courses" },
    { label: "Categories", value: cats?.length ?? 0, to: "/admin/categories" },
    { label: "Content keys", value: settings?.length ?? 0, to: "/admin/content" },
    { label: "Published courses", value: courses?.filter((c) => c.is_published).length ?? 0, to: "/admin/courses" },
  ];

  return (
    <div className="p-10">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent mb-4">Console</div>
      <h1 className="font-display text-5xl uppercase font-extrabold tracking-tighter mb-12">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
        {stats.map((s) => (
          <Link key={s.label} to={s.to as any} className="bg-surface p-6 hover:bg-surface-2 transition-colors">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
            <div className="font-display text-5xl font-extrabold mt-3">{s.value}</div>
          </Link>
        ))}
      </div>

      <div className="mt-12 grid md:grid-cols-2 gap-6">
        <Link to="/admin/courses" className="border border-border p-6 bg-surface hover:border-accent/60 transition-colors block">
          <div className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">Manage</div>
          <div className="font-display text-2xl uppercase font-bold">Courses →</div>
          <p className="text-sm text-muted-foreground mt-2">Create, edit, and publish course programs.</p>
        </Link>
        <Link to="/admin/content" className="border border-border p-6 bg-surface hover:border-accent/60 transition-colors block">
          <div className="font-mono text-[10px] uppercase tracking-widest text-accent mb-2">Edit</div>
          <div className="font-display text-2xl uppercase font-bold">Site Content →</div>
          <p className="text-sm text-muted-foreground mt-2">Every text on the site — hero, footer, contact info.</p>
        </Link>
      </div>
    </div>
  );
}
