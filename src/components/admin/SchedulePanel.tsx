import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { DAY_NAMES, formatTime, workingHoursQuery } from "@/lib/site-data";

type Hours = {
  day_of_week: number;
  is_closed: boolean;
  open_time: string;
  close_time: string;
  break_start: string | null;
  break_end: string | null;
};

export function SchedulePanel() {
  const queryClient = useQueryClient();
  const hours = useQuery(workingHoursQuery);

  const update = useMutation({
    mutationFn: async (row: Hours) => {
      const { error } = await supabase
        .from("working_hours")
        .update({
          is_closed: row.is_closed,
          open_time: row.open_time,
          close_time: row.close_time,
          break_start: row.break_start || null,
          break_end: row.break_end || null,
        })
        .eq("day_of_week", row.day_of_week);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Schedule updated");
      queryClient.invalidateQueries({ queryKey: ["working_hours"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-3">
        <h3 className="text-2xl">Working hours</h3>
        {hours.data?.map((day) => (
          <DayRow key={day.day_of_week} day={day as Hours} onSave={(row) => update.mutate(row)} />
        ))}
      </section>
      <BlockedSlots />
    </div>
  );
}

function DayRow({ day, onSave }: { day: Hours; onSave: (row: Hours) => void }) {
  const [row, setRow] = useState<Hours>({
    ...day,
    open_time: formatTime(day.open_time),
    close_time: formatTime(day.close_time),
    break_start: day.break_start ? formatTime(day.break_start) : "",
    break_end: day.break_end ? formatTime(day.break_end) : "",
  });

  return (
    <div className="panel space-y-3 p-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg tracking-wide">{DAY_NAMES[row.day_of_week]}</p>
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Day off
          <Switch checked={row.is_closed} onCheckedChange={(v) => setRow({ ...row, is_closed: v })} />
        </label>
      </div>
      {!row.is_closed ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs">Open</Label>
            <Input type="time" value={row.open_time} onChange={(e) => setRow({ ...row, open_time: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Close</Label>
            <Input type="time" value={row.close_time} onChange={(e) => setRow({ ...row, close_time: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Break from</Label>
            <Input
              type="time"
              value={row.break_start ?? ""}
              onChange={(e) => setRow({ ...row, break_start: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Break to</Label>
            <Input
              type="time"
              value={row.break_end ?? ""}
              onChange={(e) => setRow({ ...row, break_end: e.target.value })}
            />
          </div>
        </div>
      ) : null}
      <Button size="sm" variant="night" onClick={() => onSave(row)}>
        Save day
      </Button>
    </div>
  );
}

function BlockedSlots() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    block_date: new Date().toISOString().slice(0, 10),
    start_time: "12:00",
    end_time: "14:00",
    reason: "",
  });

  const blocks = useQuery({
    queryKey: ["blocked_slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_slots")
        .select("*")
        .order("block_date")
        .order("start_time");
      if (error) throw error;
      return data ?? [];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["blocked_slots"] });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("blocked_slots").insert(form);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Hours blocked");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blocked_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Block removed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="space-y-4">
      <h3 className="text-2xl">Blocked hours</h3>
      <div className="panel space-y-3 p-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Date</Label>
            <Input
              type="date"
              value={form.block_date}
              onChange={(e) => setForm({ ...form, block_date: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Reason</Label>
          <Input
            value={form.reason}
            placeholder="Lunch, personal, event…"
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </div>
        <Button size="sm" variant="gold" onClick={() => add.mutate()}>
          Block these hours
        </Button>
      </div>

      <div className="space-y-2">
        {blocks.data?.map((b) => (
          <div key={b.id} className="panel flex items-center justify-between p-3 text-sm">
            <span className="text-muted-foreground">
              {b.block_date} · {formatTime(b.start_time)}–{formatTime(b.end_time)}
              {b.reason ? ` · ${b.reason}` : ""}
            </span>
            <Button size="icon" variant="ghost" onClick={() => remove.mutate(b.id)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
        {blocks.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No blocked hours.</p>
        ) : null}
      </div>
    </section>
  );
}
