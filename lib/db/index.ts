import type { Repositories } from "./repositories";
import { LocalRepositories } from "./local-repository";
import { SupabaseRepositories } from "./supabase-repository";
let repositories:Repositories|undefined;
export type RepositoryProviderMode="local"|"supabase";
export function getRepositoryProviderMode(env:NodeJS.ProcessEnv=process.env):RepositoryProviderMode{return env.PERSISTENCE_PROVIDER==="supabase"?"supabase":"local";}
/** The sole persistence-provider selector; API routes and UI stay provider-neutral. */
export function getRepositories():Repositories { if(!repositories)repositories=getRepositoryProviderMode()==="supabase"?new SupabaseRepositories():new LocalRepositories(); return repositories; }
export function resetRepositoriesForTests(){repositories=undefined;}
export type { Repositories } from "./repositories";
