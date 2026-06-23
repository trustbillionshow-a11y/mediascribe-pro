import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CourseSoftware = {
  id: string;
  course_id: string;
  name: string;
  description: string | null;
  price_ngn: number;
  sort_order: number;
};

export const DEVICE_OPTIONS = [
  { value: "laptop", label: "Laptop (Windows)" },
  { value: "mac", label: "MacBook / iMac" },
  { value: "phone", label: "Phone" },
  { value: "tablet", label: "Tablet / iPad" },
  { value: "desktop", label: "Desktop PC" },
  { value: "other", label: "Other (specify)" },
] as const;

export function courseSoftwaresQuery(courseId: string) {
  return queryOptions({
    queryKey: ["course-softwares", courseId],
    queryFn: async (): Promise<CourseSoftware[]> => {
      const { data, error } = await supabase
        .from("course_softwares")
        .select("*")
        .eq("course_id", courseId)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as CourseSoftware[];
    },
  });
}

export const paystackPublicConfigQuery = queryOptions({
  queryKey: ["paystack-public-config"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["paystack_mode", "paystack_public_key_test", "paystack_public_key_live"]);
    if (error) throw error;
    const map: Record<string, any> = {};
    for (const r of data ?? []) map[r.key] = r.value;
    const mode = (map["paystack_mode"] ?? "test") as "test" | "live";
    const publicKey =
      mode === "live" ? map["paystack_public_key_live"] : map["paystack_public_key_test"];
    return { mode, publicKey: (publicKey ?? "") as string };
  },
});

let paystackLoading: Promise<void> | null = null;
export function loadPaystack(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as any).PaystackPop) return Promise.resolve();
  if (paystackLoading) return paystackLoading;
  paystackLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Paystack"));
    document.head.appendChild(s);
  });
  return paystackLoading;
}
