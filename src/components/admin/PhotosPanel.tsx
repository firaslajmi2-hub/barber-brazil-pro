import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { deletePhotoFile, uploadPhoto } from "@/lib/photos";
import { galleryQuery, settingsQuery } from "@/lib/site-data";

export function PhotosPanel() {
  return (
    <div className="space-y-10">
      <p className="text-sm text-muted-foreground">
        Pick photos straight from your phone or computer. Every change shows up on the website right away.
      </p>
      <SinglePhoto
        title="Main photo (top of the website)"
        column="hero_image_url"
        prefix="hero"
        aspect="aspect-[4/5]"
      />
      <SinglePhoto title="Logo (optional)" column="logo_url" prefix="logo" aspect="aspect-square" />
      <GalleryPhotos />
    </div>
  );
}

/** Upload button that opens the device photo picker. */
function PickPhotoButton({
  label,
  busy,
  onPick,
}: {
  label: string;
  busy: boolean;
  onPick: (file: File) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onPick(file);
        }}
      />
      <Button variant="gold" size="sm" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Upload className="mr-1 size-4" />}
        {label}
      </Button>
    </>
  );
}

function SinglePhoto({
  title,
  column,
  prefix,
  aspect,
}: {
  title: string;
  column: "hero_image_url" | "logo_url";
  prefix: string;
  aspect: string;
}) {
  const queryClient = useQueryClient();
  const { data } = useQuery(settingsQuery);
  const current = (data?.[column] as string | null) ?? null;

  const save = async (value: string | null) => {
    const { error } = await supabase.from("site_settings").update({ [column]: value }).eq("id", 1);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["site_settings"] });
  };

  const change = useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadPhoto(file, prefix);
      await deletePhotoFile(current);
      await save(url);
    },
    onSuccess: () => toast.success("Photo updated"),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      await deletePhotoFile(current);
      await save(null);
    },
    onSuccess: () => toast.success("Photo deleted"),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="space-y-3">
      <h3 className="text-2xl">{title}</h3>
      <div className="panel flex flex-wrap items-center gap-4 p-5">
        <div className={`w-28 shrink-0 overflow-hidden rounded border border-border ${aspect}`}>
          {current ? (
            <img src={current} alt={title} className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              No photo
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PickPhotoButton label="Change photo" busy={change.isPending} onPick={(f) => change.mutate(f)} />
          {current ? (
            <Button variant="ghost" size="sm" disabled={remove.isPending} onClick={() => remove.mutate()}>
              <Trash2 className="mr-1 size-4 text-destructive" /> Delete photo
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function GalleryPhotos() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery(galleryQuery);
  const [caption, setCaption] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["gallery"] });

  const add = useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadPhoto(file, "gallery");
      const { error } = await supabase
        .from("gallery_images")
        .insert({ image_url: url, caption, sort_order: data.length + 1 });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Photo added");
      setCaption("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const replace = useMutation({
    mutationFn: async ({ id, oldUrl, file }: { id: string; oldUrl: string; file: File }) => {
      const url = await uploadPhoto(file, "gallery");
      const { error } = await supabase.from("gallery_images").update({ image_url: url }).eq("id", id);
      if (error) throw error;
      await deletePhotoFile(oldUrl);
    },
    onSuccess: () => {
      toast.success("Photo replaced");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string }) => {
      const { error } = await supabase.from("gallery_images").delete().eq("id", id);
      if (error) throw error;
      await deletePhotoFile(url);
    },
    onSuccess: () => {
      toast.success("Photo deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="space-y-3">
      <h3 className="text-2xl">Cuts photos (gallery)</h3>
      <div className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Caption (optional)</Label>
          <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Fade + design" />
        </div>
        <PickPhotoButton label="Add new photo" busy={add.isPending} onPick={(f) => add.mutate(f)} />
      </div>

      {data.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImagePlus className="size-4" /> No gallery photos yet.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((img) => (
            <div key={img.id} className="panel space-y-2 p-3">
              <img
                src={img.image_url}
                alt={img.caption || "Haircut"}
                loading="lazy"
                className="aspect-square w-full rounded object-cover"
              />
              {img.caption ? <p className="text-xs text-muted-foreground">{img.caption}</p> : null}
              <div className="flex flex-wrap items-center gap-2">
                <PickPhotoButton
                  label="Change photo"
                  busy={replace.isPending}
                  onPick={(file) => replace.mutate({ id: img.id, oldUrl: img.image_url, file })}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove.mutate({ id: img.id, url: img.image_url })}
                >
                  <Trash2 className="mr-1 size-4 text-destructive" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
