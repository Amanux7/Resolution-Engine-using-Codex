import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider, StoredObject } from "./provider";

const root = path.join(process.cwd(), "data", "local", "uploads");
function safeKey(key:string){return key.replace(/[^a-zA-Z0-9._/-]/g,"_").replace(/\.\./g,"_");}
export class LocalStorageProvider implements StorageProvider {
  async upload({storageKey,data,contentType}: {storageKey:string;data:Uint8Array;contentType:string}):Promise<StoredObject>{const safe=safeKey(storageKey);const target=path.join(root,safe);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,data);return {storageKey:safe,url:`local://${safe}?contentType=${encodeURIComponent(contentType)}`,size:data.byteLength};}
  async getUrl(storageKey:string){return `local://${safeKey(storageKey)}`;}
  async read(storageKey:string){return new Uint8Array(await readFile(path.join(root,safeKey(storageKey))));}
  async delete(storageKey:string){try{await unlink(path.join(root,safeKey(storageKey)));}catch(error){if((error as NodeJS.ErrnoException).code!=="ENOENT")throw error;}}
}
