import type { Repositories } from "./repositories";
/** Provider seam: wire Supabase/Postgres here when credentials and a schema are configured. */
export class SupabaseRepositories { constructor(){throw new Error("Supabase repository is not configured; use the local development repository.");} }
export type SupabaseRepositoryContract = Repositories;
