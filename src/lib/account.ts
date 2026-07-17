import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  state_of_origin: string | null;
  lga: string | null;
  address: string | null;
  city: string | null;
  occupation: string | null;
  nin: string | null;
  next_of_kin_name: string | null;
  next_of_kin_phone: string | null;
  avatar_url: string | null;
};

export type UserRegistration = {
  id: string;
  course_id: string;
  full_name: string;
  email: string;
  device_type: string;
  total_amount_ngn: number;
  payment_status: string;
  paystack_reference: string | null;
  paid_at: string | null;
  created_at: string;
  courses?: { id: string; slug: string; title: string; tagline: string | null } | null;
};

export const currentUserQuery = queryOptions({
  queryKey: ["current-user"],
  queryFn: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  },
});

export function profileQuery(userId: string) {
  return queryOptions({
    queryKey: ["profile", userId],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function userRegistrationsQuery(userId: string) {
  return queryOptions({
    queryKey: ["user-registrations", userId],
    queryFn: async (): Promise<UserRegistration[]> => {
      const { data, error } = await (supabase as any)
        .from("registrations")
        .select("*, courses(id, slug, title, tagline)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as UserRegistration[];
    },
  });
}

export const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT - Abuja","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara",
];
