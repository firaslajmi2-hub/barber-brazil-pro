import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type Service = {
  id: string;
  name: string;
  description: string;
  price: number | string;
  duration_minutes: number;
  sort_order: number;
  is_active: boolean;
};

export function useAdminServices() {
  return useQuery({
    queryKey: ["services", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").order("sort_order");
      if (error) throw error;
      return (data ?? []) as Service[];
    },
  });
}

export function ServicesPanel() {
  const queryClient = useQueryClient();
  const { data: services = [] } = useAdminServices();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["services", "admin"] });
    queryClient.invalidateQueries({ queryKey: ["services", "public"] });
  };

  const save = useMutation({
    mutationFn: async (row: Service) => {
      const { error } = await supabase
        .from("services")
        .update({
          name: row.name,
          description: row.description,
          price: Number(row.price),
          duration_minutes: row.duration_minutes,
          sort_order: row.sort_order,
          is_active: row.is_active,
        })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Service saved");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("services").insert({
        name: "New service",
        description: "",
        price: 0,
        duration_minutes: 30,
        sort_order: services.length + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Service added");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Service deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl">Services & prices</h3>
        <Button size="sm" variant="gold" onClick={() => add.mutate()}>
          <Plus className="mr-1 size-4" /> Add service
        </Button>
      </div>
      {services.map((service) => (
        <ServiceRow
          key={service.id}
          service={service}
          onSave={(row) => save.mutate(row)}
          onDelete={() => remove.mutate(service.id)}
        />
      ))}
    </div>
  );
}

function ServiceRow({
  service,
  onSave,
  onDelete,
}: {
  service: Service;
  onSave: (row: Service) => void;
  onDelete: () => void;
}) {
  const [row, setRow] = useState<Service>(service);

  return (
    <div className="panel space-y-4 p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Name</Label>
          <Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Price</Label>
          <Input
            type="number"
            step="0.5"
            value={row.price}
            onChange={(e) => setRow({ ...row, price: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Duration (min)</Label>
          <Input
            type="number"
            step="15"
            value={row.duration_minutes}
            onChange={(e) => setRow({ ...row, duration_minutes: Number(e.target.value) })}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Description</Label>
        <Textarea value={row.description} onChange={(e) => setRow({ ...row, description: e.target.value })} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Visible
          <Switch checked={row.is_active} onCheckedChange={(v) => setRow({ ...row, is_active: v })} />
        </label>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Order</Label>
          <Input
            className="w-20"
            type="number"
            value={row.sort_order}
            onChange={(e) => setRow({ ...row, sort_order: Number(e.target.value) })}
          />
        </div>
        <Button size="sm" variant="night" onClick={() => onSave(row)}>
          Save
        </Button>
        <Button size="icon" variant="ghost" onClick={onDelete}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
