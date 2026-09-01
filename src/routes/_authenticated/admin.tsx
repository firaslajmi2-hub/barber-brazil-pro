import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Clock, LogOut, Scissors, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReservationsPanel, useReservations } from "@/components/admin/ReservationsPanel";
import { SchedulePanel } from "@/components/admin/SchedulePanel";
import { ServicesPanel, useAdminServices } from "@/components/admin/ServicesPanel";
import { ContentPanel } from "@/components/admin/ContentPanel";
import { PhotosPanel } from "@/components/admin/PhotosPanel";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — BRAZIIILYY Barber" },
      { name: "description", content: "Manage reservations, services, schedule and shop content." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Dashboard — BRAZIIILYY Barber" },
      { property: "og:description", content: "Manage reservations, services, schedule and shop content." },
    ],
  }),
  component: AdminDashboard,
});

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: reservations = [] } = useReservations();
  const { data: services = [] } = useAdminServices();

  const today = todayISO();
  const todays = reservations.filter((r) => r.reservation_date === today && r.status !== "cancelled");
  const upcoming = reservations.filter((r) => r.reservation_date > today && r.status !== "cancelled");
  const customers = new Set(reservations.map((r) => r.phone.replace(/\s/g, ""))).size;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5">
          <div className="flex items-center gap-2">
            <Scissors className="size-5 text-primary" />
            <span className="font-display text-xl tracking-[0.18em]">Barber Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="night" asChild>
              <Link to="/">View website</Link>
            </Button>
            <Button size="sm" variant="ghost" onClick={signOut}>
              <LogOut className="mr-1 size-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-5 py-10">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Today's appointments" value={todays.length} icon={<CalendarCheck className="size-5" />} />
          <Stat label="Upcoming" value={upcoming.length} icon={<Clock className="size-5" />} />
          <Stat label="Customers" value={customers} icon={<Users className="size-5" />} />
          <Stat label="Total bookings" value={reservations.length} icon={<Scissors className="size-5" />} />
        </section>

        <section className="panel p-5">
          <h2 className="text-2xl">Today · {today}</h2>
          <div className="mt-4 space-y-2">
            {todays.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appointments booked for today.</p>
            ) : (
              todays.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2 text-sm"
                >
                  <span className="font-semibold text-primary">{r.reservation_time.slice(0, 5)}</span>
                  <span>{r.customer_name}</span>
                  <span className="text-muted-foreground">{r.service_name}</span>
                  <a href={`tel:${r.phone}`} className="text-accent hover:underline">
                    {r.phone}
                  </a>
                  <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{r.status}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <Tabs defaultValue="reservations" className="space-y-6">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="reservations">Reservations</TabsTrigger>
            <TabsTrigger value="schedule">Working hours</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="content">Website content</TabsTrigger>

          </TabsList>
          <TabsContent value="reservations">
            <ReservationsPanel services={services.map((s) => ({ id: s.id, name: s.name }))} />
          </TabsContent>
          <TabsContent value="schedule">
            <SchedulePanel />
          </TabsContent>
          <TabsContent value="services">
            <ServicesPanel />
          </TabsContent>
          <TabsContent value="photos">
            <PhotosPanel />
          </TabsContent>
          <TabsContent value="content">
            <ContentPanel />
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="panel flex items-center gap-4 p-5">
      <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      <div>
        <p className="font-display text-3xl text-foreground">{value}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
