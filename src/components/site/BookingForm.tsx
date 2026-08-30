import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAvailability, createReservation } from "@/lib/booking.functions";
import { formatPrice } from "@/lib/site-data";
import { cn } from "@/lib/utils";

type Service = { id: string; name: string; price: number | string; duration_minutes: number };

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function BookingForm({ services }: { services: Service[] }) {
  const availability = useServerFn(getAvailability);
  const book = useServerFn(createReservation);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ date: string; time: string } | null>(null);

  const slotsQuery = useQuery({
    queryKey: ["availability", date],
    queryFn: () => availability({ data: { date } }),
    enabled: Boolean(date),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await book({
        data: { customer_name: name, phone, service_id: serviceId, date, time, notes },
      });
      if (!result.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: (result) => {
      setConfirmed({ date: result.date, time: result.time });
      setError(null);
      setName("");
      setPhone("");
      setNotes("");
      setTime("");
      slotsQuery.refetch();
    },
    onError: (err: Error) => {
      setError(err.message);
      slotsQuery.refetch();
    },
  });

  if (confirmed) {
    return (
      <div className="panel animate-fade-up p-8 text-center sm:p-12">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Check className="size-7" />
        </div>
        <h3 className="mt-6 text-3xl">Booking received</h3>
        <p className="mt-3 text-sm text-muted-foreground">
          Your appointment is reserved for{" "}
          <span className="font-semibold text-foreground">
            {confirmed.date} at {confirmed.time}
          </span>
          . The barber will confirm shortly — keep your phone nearby.
        </p>
        <Button variant="outline" className="mt-8" onClick={() => setConfirmed(null)}>
          Book another appointment
        </Button>
      </div>
    );
  }

  const canSubmit = name.trim().length > 1 && phone.trim().length > 5 && serviceId && date && time;

  return (
    <form
      className="panel animate-fade-up space-y-6 p-6 sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) {
          setError("Please complete every required field.");
          return;
        }
        setError(null);
        mutation.mutate();
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            value={phone}
            maxLength={30}
            inputMode="tel"
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+216 00 000 000"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Service</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => setServiceId(service.id)}
              className={cn(
                "flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all duration-200",
                serviceId === service.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/50",
              )}
            >
              <span className="text-sm font-semibold uppercase tracking-wide">{service.name}</span>
              <span className="text-sm text-primary">{formatPrice(service.price)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            min={todayISO()}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setTime("");
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            maxLength={500}
            rows={1}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Fade level, style reference…"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Available times</Label>
        {slotsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading available times…</p>
        ) : slotsQuery.data?.closed ? (
          <p className="text-sm text-muted-foreground">Closed on this date — please pick another day.</p>
        ) : slotsQuery.data && slotsQuery.data.slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">Fully booked. Try the next day.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slotsQuery.data?.slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setTime(slot)}
                className={cn(
                  "rounded-md border px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-200",
                  time === slot
                    ? "border-primary bg-gold-gradient text-primary-foreground"
                    : "border-border bg-secondary/40 text-muted-foreground hover:border-primary/60 hover:text-foreground",
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>


      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" size="lg" variant="gold" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Confirm appointment
      </Button>
    </form>
  );
}
