import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const availabilitySchema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

const reservationSchema = z.object({
  customer_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(6).max(30),
  service_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().trim().max(500).optional().default(""),
});

function toMinutes(value: string) {
  const parts = value.slice(0, 5).split(":").map(Number);
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
}

function toLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

type SlotInput = {
  date: string;
  dayOfWeek: number;
};

async function computeSlots({ date, dayOfWeek }: SlotInput) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [hoursRes, settingsRes, blockedRes, bookedRes] = await Promise.all([
    supabaseAdmin.from("working_hours").select("*").eq("day_of_week", dayOfWeek).maybeSingle(),
    supabaseAdmin.from("site_settings").select("slot_minutes").eq("id", 1).maybeSingle(),
    supabaseAdmin.from("blocked_slots").select("start_time, end_time").eq("block_date", date),
    supabaseAdmin
      .from("reservations")
      .select("reservation_time, status")
      .eq("reservation_date", date)
      .neq("status", "cancelled"),
  ]);

  const hours = hoursRes.data;
  if (!hours || hours.is_closed) return { slots: [] as string[], closed: true };

  const step = settingsRes.data?.slot_minutes ?? 30;
  const open = toMinutes(hours.open_time);
  const close = toMinutes(hours.close_time);
  const breakStart = hours.break_start ? toMinutes(hours.break_start) : null;
  const breakEnd = hours.break_end ? toMinutes(hours.break_end) : null;

  const blocked = (blockedRes.data ?? []).map((b) => ({
    start: toMinutes(b.start_time),
    end: toMinutes(b.end_time),
  }));
  const taken = new Set((bookedRes.data ?? []).map((r) => toMinutes(r.reservation_time)));

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: string[] = [];
  for (let t = open; t + step <= close; t += step) {
    if (breakStart !== null && breakEnd !== null && t >= breakStart && t < breakEnd) continue;
    if (blocked.some((b) => t >= b.start && t < b.end)) continue;
    if (taken.has(t)) continue;
    if (date === todayStr && t <= nowMinutes + 30) continue;
    slots.push(toLabel(t));
  }

  return { slots, closed: false };
}

export const getAvailability = createServerFn({ method: "GET" })
  .inputValidator((data) => availabilitySchema.parse(data))
  .handler(async ({ data }) => {
    const dayOfWeek = new Date(`${data.date}T12:00:00Z`).getUTCDay();
    return computeSlots({ date: data.date, dayOfWeek });
  });

export const createReservation = createServerFn({ method: "POST" })
  .inputValidator((data) => reservationSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const dayOfWeek = new Date(`${data.date}T12:00:00Z`).getUTCDay();
    const { slots, closed } = await computeSlots({ date: data.date, dayOfWeek });

    if (closed) return { ok: false as const, error: "The shop is closed on that day." };
    if (!slots.includes(data.time)) {
      return { ok: false as const, error: "That time is no longer available. Please pick another slot." };
    }

    const { data: service } = await supabaseAdmin
      .from("services")
      .select("name, is_active")
      .eq("id", data.service_id)
      .maybeSingle();

    if (!service || !service.is_active) {
      return { ok: false as const, error: "That service is not available." };
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("reservations")
      .insert({
        customer_name: data.customer_name,
        phone: data.phone,
        service_id: data.service_id,
        service_name: service.name,
        reservation_date: data.date,
        reservation_time: data.time,
        notes: data.notes ?? "",
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { ok: false as const, error: "Someone just booked that slot. Please choose another time." };
      }
      console.error("reservation insert failed", error);
      return { ok: false as const, error: "Could not save your booking. Please try again." };
    }

    return { ok: true as const, id: inserted.id, time: data.time, date: data.date };
  });
