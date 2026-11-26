import { supabase } from "@/integrations/supabase/client";

export type StorageBucket =
  | "memories"
  | "profiles"
  | "reward-covers"
  | "letters"
  | "timeline"
  | "bucket-list"
  | "memory-capsules";

export function userStoragePath(userId: string, fileName: string): string {
  return `${userId}/${fileName}`;
}

export async function uploadPrivateFile(
  bucket: StorageBucket,
  userId: string,
  file: File,
): Promise<{ path: string; error: Error | null }> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const path = userStoragePath(userId, fileName);

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    return { path: "", error };
  }
  return { path, error: null };
}

export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn = 3600,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function removeStorageFile(bucket: StorageBucket, path: string): Promise<void> {
  await supabase.storage.from(bucket).remove([path]);
}