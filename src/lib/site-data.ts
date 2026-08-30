import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const settingsQuery = queryOptions({
  queryKey: ["site_settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const servicesQuery = queryOptions({
  queryKey: ["services", "public"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const galleryQuery = queryOptions({
  queryKey: ["gallery"],
  queryFn: async () => {
    const { data, error } = await supabase.from("gallery_images").select("*").order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const reviewsQuery = queryOptions({
  queryKey: ["reviews", "public"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("is_published", true)
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

export const workingHoursQuery = queryOptions({
  queryKey: ["working_hours"],
  queryFn: async () => {
    const { data, error } = await supabase.from("working_hours").select("*").order("day_of_week");
    if (error) throw error;
    return data ?? [];
  },
});

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function formatTime(value: string | null) {
  if (!value) return "";
  return value.slice(0, 5);
}

export function formatPrice(value: number | string) {
  const n = typeof value === "string" ? Number(value) : value;
  return `${n.toFixed(0)} DT`;
}
