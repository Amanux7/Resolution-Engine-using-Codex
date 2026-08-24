import type { Repositories } from "./repositories";
import { LocalRepositories } from "./local-repository";
let repositories:Repositories|undefined;
export function getRepositories():Repositories { if(!repositories)repositories=new LocalRepositories(); return repositories; }
export type { Repositories } from "./repositories";
