import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const adminCoursesQuery = queryOptions({
  queryKey: ["admin", "courses"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("courses")
      .select("*, category:categories(id, name, slug)")
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const adminCategoriesQuery = queryOptions({
  queryKey: ["admin", "categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const adminSettingsQuery = queryOptions({
  queryKey: ["admin", "site_settings"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .order("key");
    if (error) throw error;
    return data ?? [];
  },
});

export const myRolesQuery = queryOptions({
  queryKey: ["my-roles"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return [];
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id);
    if (error) throw error;
    return (data ?? []).map((r) => r.role);
  },
});
