/**
 * Minimal server-only Supabase REST client. Keeping this adapter small avoids
 * coupling domain repositories to a browser SDK or exposing service keys.
 */
export type SupabaseFetch = typeof fetch;

export interface SupabaseServerConfig {
  url: string;
  serviceRoleKey: string;
}

export function getSupabaseServerConfig(env: NodeJS.ProcessEnv = process.env): SupabaseServerConfig {
  const url = env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("Hosted persistence is not configured on this server.");
  return { url, serviceRoleKey };
}

export class SupabaseServerClient {
  constructor(
    private readonly config: SupabaseServerConfig = getSupabaseServerConfig(),
    private readonly requestFn: SupabaseFetch = fetch,
  ) {}

  get baseUrl() { return this.config.url; }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("apikey", this.config.serviceRoleKey);
    headers.set("Authorization", `Bearer ${this.config.serviceRoleKey}`);
    if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
    const response = await this.requestFn(`${this.config.url}${path}`, { ...init, headers });
    if (!response.ok) throw new Error(`Supabase request failed with status ${response.status}.`);
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  async bytes(path: string, init: RequestInit = {}): Promise<Uint8Array> {
    const headers = new Headers(init.headers);
    headers.set("apikey", this.config.serviceRoleKey);
    headers.set("Authorization", `Bearer ${this.config.serviceRoleKey}`);
    const response = await this.requestFn(`${this.config.url}${path}`, { ...init, headers });
    if (!response.ok) throw new Error(`Supabase storage request failed with status ${response.status}.`);
    return new Uint8Array(await response.arrayBuffer());
  }
}

export function escapePostgrestValue(value: string) {
  return encodeURIComponent(value.replace(/[(),]/g, ""));
}
