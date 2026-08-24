import type { StorageProvider } from "./provider";
import { LocalStorageProvider } from "./local";
export function getStorageProvider():StorageProvider { return new LocalStorageProvider(); }
export type { StorageProvider } from "./provider";
