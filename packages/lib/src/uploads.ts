import { getSupabase } from "./supabase";

const BUCKET = "client-uploads";

export interface UploadResult {
  path: string;
  publicUrl: string;
}

/**
 * Faz upload de uma foto pro bucket client-uploads e retorna a URL publica.
 * Usado pelo cliente pra subir foto do documento e selfie.
 */
export async function uploadClientPhoto(
  file: File | Blob,
  kind: "document" | "selfie",
  smsLinkToken: string
): Promise<UploadResult> {
  const sb = getSupabase();
  const ext = (file instanceof File && file.name.includes("."))
    ? file.name.split(".").pop()!.toLowerCase()
    : "jpg";
  const safeExt = /^[a-z0-9]{2,5}$/.test(ext) ? ext : "jpg";
  const path = `${smsLinkToken}/${kind}-${Date.now()}.${safeExt}`;

  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "image/jpeg",
    });
  if (error) throw new Error(`Falha no upload: ${error.message}`);

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
