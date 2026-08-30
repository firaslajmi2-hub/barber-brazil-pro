import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Status = "pending" | "confirmed" | "completed" | "cancelled";

export type Reservation = {
  id: string;
  customer_name: string;
  phone: string;
  service_id: string | null;
  service_name: string;
  reservation_date: string;
  reservation_time: string;
  notes: string;
  status: Status;
};

const STATUSES: Status[] = ["pending", "confirmed", "completed", "cancelled"];

const statusClass: Record<Status, string> = {
  pending: "border-primary/50 text-primary",
  confirmed: "border-accent/60 text-accent",
  completed: "border-border text-muted-foreground",
  cancelled: "border-destructive/60 text-destructive",
};

export function useReservations() {
  return useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("reservation_date", { ascending: true })
        .order("reservation_time", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Reservation[];
    },
  });
}

export function ReservationsPanel({ services }: { services: { id: string; name: string }[] }) {
  const queryClient = useQueryClient();
  const { data: reservations = [], isLoading } = useReservations();
  const [filter, setFilter] = useState<Status | "all">("all");
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["reservations"] });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reservation updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reservations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reservation deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: async (row: Reservation) => {
      const { error } = await supabase
        .from("reservations")
        .update({
          customer_name: row.customer_name,
          phone: row.phone,
          service_id: row.service_id,
          service_name: services.find((s) => s.id === row.service_id)?.name ?? row.service_name,
          reservation_date: row.reservation_date,
          reservation_time: row.reservation_time,
          notes: row.notes,
          status: row.status,
        })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reservation saved");
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(
    () => (filter === "all" ? reservations : reservations.filter((r) => r.status === filter)),
    [reservations, filter],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["all", ...STATUSES] as const).map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition-colors",
                filter === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button variant="gold" size="sm">
              <Plus className="mr-1 size-4" /> Manual booking
            </Button>
          </DialogTrigger>
          <ReservationDialog
            title="Add reservation"
            services={services}
            onClose={() => setAddOpen(false)}
            onSaved={invalidate}
          />
        </Dialog>
      </div>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading reservations…</p> : null}

      <div className="space-y-3">
        {filtered.map((r) => (
          <div key={r.id} className="panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-display text-xl tracking-wide">{r.customer_name}</p>
                <Badge variant="outline" className={cn("uppercase", statusClass[r.status])}>
                  {r.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {r.service_name} · {r.reservation_date} at {r.reservation_time.slice(0, 5)}
              </p>
              <p className="text-sm text-muted-foreground">{r.phone}</p>
              {r.notes ? <p className="mt-1 text-xs italic text-muted-foreground">“{r.notes}”</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="jade" asChild>
                <a href={`tel:${r.phone}`}>
                  <Phone className="mr-1 size-4" /> Call
                </a>
              </Button>
              {r.status !== "confirmed" ? (
                <Button size="sm" variant="gold" onClick={() => setStatus.mutate({ id: r.id, status: "confirmed" })}>
                  Confirm
                </Button>
              ) : null}
              {r.status !== "completed" ? (
                <Button size="sm" variant="night" onClick={() => setStatus.mutate({ id: r.id, status: "completed" })}>
                  Complete
                </Button>
              ) : null}
              {r.status !== "cancelled" ? (
                <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: r.id, status: "cancelled" })}>
                  Cancel
                </Button>
              ) : null}
              <Button size="sm" variant="secondary" onClick={() => setEditing(r)}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove.mutate(r.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {!isLoading && filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reservations here yet.</p>
        ) : null}
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        {editing ? (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit reservation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Field label="Full name">
                <Input
                  value={editing.customer_name}
                  onChange={(e) => setEditing({ ...editing, customer_name: e.target.value })}
                />
              </Field>
              <Field label="Phone">
                <Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </Field>
              <Field label="Service">
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editing.service_id ?? ""}
                  onChange={(e) => setEditing({ ...editing, service_id: e.target.value })}
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date">
                  <Input
                    type="date"
                    value={editing.reservation_date}
                    onChange={(e) => setEditing({ ...editing, reservation_date: e.target.value })}
                  />
                </Field>
                <Field label="Time">
                  <Input
                    type="time"
                    value={editing.reservation_time.slice(0, 5)}
                    onChange={(e) => setEditing({ ...editing, reservation_time: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Status">
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={editing.status}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value as Status })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Notes">
                <Textarea
                  value={editing.notes}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                />
              </Field>
            </div>
            <DialogFooter>
              <Button variant="gold" onClick={() => editing && save.mutate(editing)}>
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ReservationDialog({
  title,
  services,
  onClose,
  onSaved,
}: {
  title: string;
  services: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    service_id: services[0]?.id ?? "",
    reservation_date: new Date().toISOString().slice(0, 10),
    reservation_time: "10:00",
    notes: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("reservations").insert({
        ...form,
        service_name: services.find((s) => s.id === form.service_id)?.name ?? "",
        status: "confirmed",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reservation added");
      onSaved();
      onClose();
    },
    onError: (e: Error) =>
      toast.error(e.message.includes("duplicate") ? "That slot is already booked." : e.message),
  });

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <Field label="Full name">
          <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Service">
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.service_id}
            onChange={(e) => setForm({ ...form, service_id: e.target.value })}
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <Input
              type="date"
              value={form.reservation_date}
              onChange={(e) => setForm({ ...form, reservation_date: e.target.value })}
            />
          </Field>
          <Field label="Time">
            <Input
              type="time"
              value={form.reservation_time}
              onChange={(e) => setForm({ ...form, reservation_time: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Notes">
          <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </Field>
      </div>
      <DialogFooter>
        <Button variant="gold" onClick={() => create.mutate()} disabled={!form.customer_name || !form.phone}>
          Add reservation
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
