import { supabase } from "@/integrations/supabase/client";

const BUCKET = "site-photos";

export function photoUrl(path: string) {
  return `/api/public/photo/${path}`;
}

function extensionOf(file: File) {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return file.type === "image/png" ? "png" : "jpg";
}

/** Uploads a photo picked from the device and returns the URL to store in the database. */
export async function uploadPhoto(file: File, prefix: string) {
  const path = `${prefix}-${Date.now()}.${extensionOf(file)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;
  return photoUrl(path);
}

/** Removes the stored file behind a photo URL (ignores photos that live elsewhere). */
export async function deletePhotoFile(url: string | null | undefined) {
  if (!url) return;
  const prefix = "/api/public/photo/";
  if (!url.startsWith(prefix)) return;
  await supabase.storage.from(BUCKET).remove([url.slice(prefix.length)]);
}
