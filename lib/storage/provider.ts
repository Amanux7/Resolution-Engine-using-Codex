export interface StoredObject { storageKey:string; url:string; size:number; }
export interface StorageProvider { upload(input:{storageKey:string;data:Uint8Array;contentType:string}):Promise<StoredObject>; getUrl(storageKey:string):Promise<string>; read(storageKey:string):Promise<Uint8Array>; delete(storageKey:string):Promise<void>; }
