import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { galleryQuery, settingsQuery } from "@/lib/site-data";

export function ContentPanel() {
  return (
    <div className="space-y-10">
      <SettingsForm />
      <GalleryManager />
      <ReviewsManager />
    </div>
  );
}

type Settings = {
  barber_name: string;
  logo_url: string | null;
  slogan: string;
  about_text: string;
  hero_image_url: string | null;
  phone: string;
  whatsapp: string;
  address: string;
  map_url: string;
  instagram_url: string;
  slot_minutes: number;
};

function SettingsForm() {
  const queryClient = useQueryClient();
  const { data } = useQuery(settingsQuery);
  const [form, setForm] = useState<Settings | null>(null);

  useEffect(() => {
    if (data) setForm(data as Settings);
  }, [data]);

  const save = useMutation({
    mutationFn: async (row: Settings) => {
      const { error } = await supabase.from("site_settings").update(row).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Shop details saved");
      queryClient.invalidateQueries({ queryKey: ["site_settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!form) return <p className="text-sm text-muted-foreground">Loading shop details…</p>;

  return (
    <section className="space-y-4">
      <h3 className="text-2xl">Shop identity</h3>
      <div className="panel grid gap-4 p-5 sm:grid-cols-2">
        <TextField label="Barber name" value={form.barber_name} onChange={(v) => setForm({ ...form, barber_name: v })} />
        <TextField label="Slogan" value={form.slogan} onChange={(v) => setForm({ ...form, slogan: v })} />
        <TextField
          label="Logo image URL"
          value={form.logo_url ?? ""}
          onChange={(v) => setForm({ ...form, logo_url: v })}
        />
        <TextField
          label="Hero image URL"
          value={form.hero_image_url ?? ""}
          onChange={(v) => setForm({ ...form, hero_image_url: v })}
        />
        <TextField label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <TextField label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
        <TextField label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
        <TextField label="Google Maps link" value={form.map_url} onChange={(v) => setForm({ ...form, map_url: v })} />
        <TextField
          label="Instagram link"
          value={form.instagram_url}
          onChange={(v) => setForm({ ...form, instagram_url: v })}
        />
        <div className="space-y-1">
          <Label className="text-xs">Booking slot length (min)</Label>
          <Input
            type="number"
            step="15"
            min="15"
            value={form.slot_minutes}
            onChange={(e) => setForm({ ...form, slot_minutes: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">About the barber</Label>
          <Textarea rows={6} value={form.about_text} onChange={(e) => setForm({ ...form, about_text: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <Button variant="gold" onClick={() => save.mutate(form)}>
            Save shop details
          </Button>
        </div>
      </div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function GalleryManager() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery(galleryQuery);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["gallery"] });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("gallery_images")
        .insert({ image_url: url, caption, sort_order: data.length + 1 });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Photo added");
      setUrl("");
      setCaption("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Photo removed");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="space-y-4">
      <h3 className="text-2xl">Gallery photos</h3>
      <p className="text-sm text-muted-foreground">
        Paste an image link (for example from your Instagram post or any image host). While the gallery is empty the
        site shows the default photos.
      </p>
      <div className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Image URL</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Caption</Label>
          <Input value={caption} onChange={(e) => setCaption(e.target.value)} />
        </div>
        <Button variant="gold" disabled={!url} onClick={() => add.mutate()}>
          <Plus className="mr-1 size-4" /> Add
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {data.map((img) => (
          <div key={img.id} className="relative overflow-hidden rounded-lg border border-border">
            <img src={img.image_url} alt={img.caption} loading="lazy" className="aspect-[4/5] w-full object-cover" />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1 bg-background/70"
              onClick={() => remove.mutate(img.id)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReviewsManager() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["reviews", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
  const [form, setForm] = useState({ customer_name: "", rating: 5, comment: "" });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["reviews", "admin"] });
    queryClient.invalidateQueries({ queryKey: ["reviews", "public"] });
  };

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("reviews").insert({ ...form, sort_order: data.length + 1 });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review added");
      setForm({ customer_name: "", rating: 5, comment: "" });
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePublished = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from("reviews").update({ is_published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Review deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="space-y-4">
      <h3 className="text-2xl">Customer reviews</h3>
      <div className="panel grid gap-3 p-5 sm:grid-cols-[1fr_auto_2fr_auto] sm:items-end">
        <div className="space-y-1">
          <Label className="text-xs">Customer</Label>
          <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Rating</Label>
          <Input
            className="w-20"
            type="number"
            min="1"
            max="5"
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Comment</Label>
          <Input value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
        </div>
        <Button variant="gold" disabled={!form.customer_name} onClick={() => add.mutate()}>
          Add
        </Button>
      </div>
      <div className="space-y-2">
        {data.map((review) => (
          <div key={review.id} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-semibold">
                {review.customer_name} · {review.rating}★
              </p>
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Published
                <Switch
                  checked={review.is_published}
                  onCheckedChange={(v) => togglePublished.mutate({ id: review.id, is_published: v })}
                />
              </label>
              <Button size="icon" variant="ghost" onClick={() => remove.mutate(review.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
