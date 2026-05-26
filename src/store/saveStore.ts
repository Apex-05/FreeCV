import { create } from 'zustand';
import { dbPut, dbGetMeta, dbGetData, dbDelete, dbPrune, isIndexedDBAvailable } from '../utils/db';
import type { VersionMeta } from '../utils/db';
import type { ResumeData } from '../types/resume';
import { nanoid } from '../utils/nanoid';

// ── constants ─────────────────────────────────────────────────────────────────
const AUTO_SAVE_DELAY_MS = 5_000;
const MAX_AUTO_SAVES      = 10;
const MAX_MANUAL_SAVES    = 20;
const LS_RECOVERY_KEY     = 'freecv_recovery_ts';
const LS_CLEAN_CLOSE_KEY  = 'freecv_clean_close_ts';

// ── types ──────────────────────────────────────────────────────────────────────
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed' | 'unsaved';

interface SaveStore {
  status: SaveStatus;
  lastSavedTs: number | null;
  versions: VersionMeta[];
  hasRecovery: boolean;
  idbAvailable: boolean;

  // save actions
  triggerAutoSave: (data: ResumeData) => void;
  manualSave: (data: ResumeData, label?: string) => Promise<void>;
  saveImportSnapshot: (data: ResumeData, filename: string) => Promise<void>;

  // version management
  loadVersions: () => Promise<void>;
  restoreVersion: (id: string) => Promise<ResumeData | null>;
  deleteVersion: (id: string) => Promise<void>;
  renameVersion: (id: string, label: string) => Promise<void>;

  // crash recovery
  checkCrashRecovery: () => void;
  dismissRecovery: () => void;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function buildPreview(data: ResumeData): string {
  const name  = data.personalInfo?.name  || 'Untitled';
  const title = data.personalInfo?.title || '';
  return title ? `${name} · ${title}` : name;
}

function makeId(): string {
  return `v_${Date.now()}_${nanoid()}`;
}

function now(): number { return Date.now(); }

// ── broadcast channel ─────────────────────────────────────────────────────────

let _bc: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  _bc = new BroadcastChannel('freecv_sync');
  _bc.onmessage = () => {
    window.dispatchEvent(new CustomEvent('freecv:external-update'));
  };
}

function broadcastSave() {
  try { _bc?.postMessage({ type: 'saved', ts: now() }); } catch {}
}

// ── mark clean close ──────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    try { localStorage.setItem(LS_CLEAN_CLOSE_KEY, String(now())); } catch {}
  });
}

// ── auto-save debounce ────────────────────────────────────────────────────────

let _autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

// ── store ─────────────────────────────────────────────────────────────────────

export const useSaveStore = create<SaveStore>((set, get) => ({
  status:       'idle',
  lastSavedTs:  null,
  versions:     [],
  hasRecovery:  false,
  idbAvailable: isIndexedDBAvailable(),

  // ── auto-save ───────────────────────────────────────────────────────────────
  triggerAutoSave(data) {
    set({ status: 'unsaved' });
    if (_autoSaveTimer) clearTimeout(_autoSaveTimer);
    _autoSaveTimer = setTimeout(async () => {
      if (!get().idbAvailable) { set({ status: 'saved', lastSavedTs: now() }); return; }
      set({ status: 'saving' });
      try {
        const json = JSON.stringify(data);
        await dbPut({
          id:        makeId(),
          timestamp: now(),
          label:     `Auto ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          source:    'auto',
          preview:   buildPreview(data),
          dataSize:  json.length,
          data:      json,
        });
        await dbPrune('auto', MAX_AUTO_SAVES);
        // write crash recovery sentinel
        try { localStorage.setItem(LS_RECOVERY_KEY, String(now())); } catch {}
        broadcastSave();
        set({ status: 'saved', lastSavedTs: now() });
        // refresh version list quietly
        get().loadVersions().catch(() => undefined);
      } catch {
        set({ status: 'failed' });
      }
    }, AUTO_SAVE_DELAY_MS);
  },

  // ── manual save ────────────────────────────────────────────────────────────
  async manualSave(data, label) {
    set({ status: 'saving' });
    try {
      const json   = JSON.stringify(data);
      const ts     = now();
      const lbl    = label ?? `Saved ${new Date(ts).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}`;
      if (get().idbAvailable) {
        await dbPut({ id: makeId(), timestamp: ts, label: lbl, source: 'manual', preview: buildPreview(data), dataSize: json.length, data: json });
        await dbPrune('manual', MAX_MANUAL_SAVES);
        await get().loadVersions();
      }
      try {
        localStorage.setItem(LS_RECOVERY_KEY, String(ts));
        localStorage.setItem(LS_CLEAN_CLOSE_KEY, String(ts));
      } catch {}
      broadcastSave();
      set({ status: 'saved', lastSavedTs: ts });
    } catch (err) {
      set({ status: 'failed' });
      throw err;
    }
  },

  // ── import snapshot ────────────────────────────────────────────────────────
  async saveImportSnapshot(data, filename) {
    if (!get().idbAvailable) return;
    try {
      const json = JSON.stringify(data);
      await dbPut({ id: makeId(), timestamp: now(), label: `Import: ${filename}`, source: 'import', preview: buildPreview(data), dataSize: json.length, data: json });
      await get().loadVersions();
    } catch {}
  },

  // ── version management ─────────────────────────────────────────────────────
  async loadVersions() {
    if (!get().idbAvailable) return;
    try {
      const versions = await dbGetMeta();
      set({ versions });
    } catch { set({ versions: [] }); }
  },

  async restoreVersion(id) {
    const raw = await dbGetData(id);
    if (!raw) return null;
    try { return JSON.parse(raw) as ResumeData; }
    catch { return null; }
  },

  async deleteVersion(id) {
    await dbDelete(id);
    await get().loadVersions();
  },

  async renameVersion(id, label) {
    const raw = await dbGetData(id);
    if (!raw) return;
    const meta = get().versions.find(v => v.id === id);
    if (!meta) return;
    await dbPut({ ...meta, label, data: raw });
    await get().loadVersions();
  },

  // ── crash recovery ─────────────────────────────────────────────────────────
  checkCrashRecovery() {
    try {
      const recoveryTs  = parseInt(localStorage.getItem(LS_RECOVERY_KEY)  ?? '0');
      const cleanCloseTs = parseInt(localStorage.getItem(LS_CLEAN_CLOSE_KEY) ?? '0');
      if (recoveryTs > 0 && recoveryTs > cleanCloseTs + 10_000) {
        set({ hasRecovery: true });
      }
    } catch {}
  },

  dismissRecovery() {
    set({ hasRecovery: false });
    try { localStorage.setItem(LS_CLEAN_CLOSE_KEY, String(now())); } catch {}
  },
}));
