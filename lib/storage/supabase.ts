import type { StorageProvider, StoredObject } from "./provider";
import { SupabaseServerClient } from "../supabase/server-client";

const defaultBucket = "resolution-evidence";
function encodeKey(storageKey: string) { return storageKey.split("/").map(encodeURIComponent).join("/"); }

/** Server-only private-bucket adapter. getUrl creates a short-lived signed URL. */
export class SupabaseStorageProvider implements StorageProvider {
  private readonly bucket: string;
  constructor(private readonly client = new SupabaseServerClient(), bucket = process.env.SUPABASE_STORAGE_BUCKET ?? defaultBucket) { this.bucket = bucket; }

  async upload({ storageKey, data, contentType }: { storageKey: string; data: Uint8Array; contentType: string }): Promise<StoredObject> {
    const key = encodeKey(storageKey);
    await this.client.request(`/storage/v1/object/${encodeURIComponent(this.bucket)}/${key}`, { method: "POST", headers: { "Content-Type": contentType, "x-upsert": "true" }, body: new Uint8Array(data).buffer });
    return { storageKey, url: await this.getUrl(storageKey), size: data.byteLength };
  }
  async getUrl(storageKey: string): Promise<string> {
    const response = await this.client.request<{ signedURL?: string; signedUrl?: string }>(`/storage/v1/object/sign/${encodeURIComponent(this.bucket)}/${encodeKey(storageKey)}`, { method: "POST", body: JSON.stringify({ expiresIn: 60 }) });
    const signedPath = response.signedURL ?? response.signedUrl;
    if (!signedPath) throw new Error("Supabase did not return a signed evidence URL.");
    return signedPath.startsWith("http") ? signedPath : `${this.client.baseUrl}${signedPath}`;
  }
  read(storageKey: string): Promise<Uint8Array> { return this.client.bytes(`/storage/v1/object/${encodeURIComponent(this.bucket)}/${encodeKey(storageKey)}`); }
  async delete(storageKey: string): Promise<void> { await this.client.request(`/storage/v1/object/${encodeURIComponent(this.bucket)}`, { method: "DELETE", body: JSON.stringify({ prefixes: [storageKey] }) }); }
}

export function createSupabaseStorageProviderForTest(client: SupabaseServerClient, bucket = defaultBucket) { return new SupabaseStorageProvider(client, bucket); }
