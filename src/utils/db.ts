/** IndexedDB wrapper for FreeCV version history.
 *  DB: freecv_db  v1
 *  Store: versions  { id, timestamp, label, source, preview, dataSize, data }
 */

const DB_NAME = 'freecv_db';
const DB_VERSION = 1;
const STORE = 'versions';

export type VersionSource = 'auto' | 'manual' | 'import' | 'crash';

export interface VersionMeta {
  id: string;
  timestamp: number;
  label: string;
  source: VersionSource;
  preview: string;   // "Name · Role"
  dataSize: number;  // bytes
}

export interface VersionRecord extends VersionMeta {
  data: string; // full JSON
}

// ── DB init ──────────────────────────────────────────────────────────────────

let _db: IDBDatabase | null = null;
let _opening = false;
type Waiter = { resolve: (db: IDBDatabase) => void; reject: (e: unknown) => void };
const _waiters: Waiter[] = [];

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    _waiters.push({ resolve, reject });
    if (_opening) return;
    _opening = true;
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        const s = db.createObjectStore(STORE, { keyPath: 'id' });
        s.createIndex('by_ts', 'timestamp');
        s.createIndex('by_source', 'source');
      }
    };
    req.onsuccess = e => {
      _db = (e.target as IDBOpenDBRequest).result;
      const db = _db!;
      _opening = false;
      const waiting = _waiters.splice(0);
      waiting.forEach(w => w.resolve(db));
    };
    req.onerror = () => {
      const err = req.error;
      _opening = false;
      _db = null;
      const waiting = _waiters.splice(0);
      waiting.forEach(w => w.reject(err));
    };
  });
}

// ── helpers ──────────────────────────────────────────────────────────────────

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    t.onerror = () => reject(t.error);
  }));
}

// ── public API ────────────────────────────────────────────────────────────────

export async function dbPut(record: VersionRecord): Promise<void> {
  await run('readwrite', s => s.put(record));
}

export async function dbGetAll(): Promise<VersionRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, 'readonly');
    const req = t.objectStore(STORE).index('by_ts').getAll();
    req.onsuccess = () => resolve((req.result as VersionRecord[]).reverse()); // newest first
    req.onerror = () => reject(req.error);
  });
}

export async function dbGetMeta(): Promise<VersionMeta[]> {
  const all = await dbGetAll();
  return all.map(({ data: _, ...meta }) => meta);
}

export async function dbGetData(id: string): Promise<string | null> {
  try {
    const r = await run<VersionRecord | undefined>('readonly', s => s.get(id));
    return r?.data ?? null;
  } catch { return null; }
}

export async function dbDelete(id: string): Promise<void> {
  await run('readwrite', s => s.delete(id));
}

export async function dbPrune(source: VersionSource, keep: number): Promise<void> {
  const all = await dbGetMeta();
  const ofSrc = all.filter(v => v.source === source); // already newest-first
  const toDelete = ofSrc.slice(keep);                  // keep N newest, delete rest
  await Promise.all(toDelete.map(v => dbDelete(v.id)));
}

export async function dbClear(): Promise<void> {
  await run('readwrite', s => s.clear());
}

export function isIndexedDBAvailable(): boolean {
  try { return typeof indexedDB !== 'undefined'; }
  catch { return false; }
}
