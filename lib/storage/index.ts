import type { StorageProvider } from "./provider";
import { LocalStorageProvider } from "./local";
import { SupabaseStorageProvider } from "./supabase";
export type StorageProviderMode = "local" | "supabase";
let storage:StorageProvider|undefined;
export function getStorageProviderMode(env:NodeJS.ProcessEnv=process.env):StorageProviderMode{return env.STORAGE_PROVIDER==="supabase"?"supabase":"local";}
/** The only storage-provider selection point. React components never see it. */
export function getStorageProvider():StorageProvider {if(!storage)storage=getStorageProviderMode()==="supabase"?new SupabaseStorageProvider():new LocalStorageProvider();return storage;}
export function resetStorageProviderForTests(){storage=undefined;}
export type { StorageProvider } from "./provider";
