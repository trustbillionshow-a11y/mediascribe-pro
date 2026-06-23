import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  accent_color: string | null;
  sort_order: number;
};

export type Session = { title: string; items: string[] };

export type Course = {
  id: string;
  slug: string;
  category_id: string | null;
  title: string;
  tagline: string | null;
  summary: string | null;
  description: string | null;
  hero_image_url: string | null;
  duration: string | null;
  schedule: string | null;
  delivery_mode: "physical" | "online" | "hybrid";
  tuition_ngn: number | null;
  tuition_usd: number | null;
  accommodation_info: string | null;
  payment_plan: string | null;
  internship_info: string | null;
  requirements: string | null;
  sessions: Session[];
  badge: string | null;
  is_featured: boolean;
  is_hot: boolean;
  sort_order: number;
  category?: Category | null;
};

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_published", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("*, category:categories(*)")
    .eq("is_published", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as Course[];
}

export async function fetchCourseBySlug(slug: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from("courses")
    .select("*, category:categories(*)")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Course) ?? null;
}

export async function fetchSiteSettings(): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .eq("is_public", true);
  if (error) throw error;
  const out: Record<string, any> = {};
  for (const row of data ?? []) out[row.key] = row.value;
  return out;
}

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: fetchCategories,
});

export const coursesQuery = queryOptions({
  queryKey: ["courses"],
  queryFn: fetchCourses,
});

export const settingsQuery = queryOptions({
  queryKey: ["site-settings"],
  queryFn: fetchSiteSettings,
});

export const courseBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["course", slug],
    queryFn: () => fetchCourseBySlug(slug),
  });

export function formatNGN(n: number | null | undefined) {
  if (n == null) return "—";
  return "₦" + n.toLocaleString("en-NG");
}
export function formatUSD(n: number | null | undefined) {
  if (n == null) return "—";
  return "$" + n.toLocaleString("en-US");
}
export function modeLabel(m: Course["delivery_mode"]) {
  return m === "physical" ? "In-Person" : m === "online" ? "Online" : "Hybrid";
}
