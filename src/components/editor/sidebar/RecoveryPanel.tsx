// Version history: restore, rename, or delete saved versions.

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Trash2, Check, Clock3, FilePlus2, FileClock, ShieldCheck, AlertOctagon, Database } from 'lucide-react';
import { useSaveStore } from '../../../store/saveStore';
import { useResumeStore } from '../../../store/resumeStore';
import type { VersionMeta, VersionSource } from '../../../utils/db';
import toast from 'react-hot-toast';

const SOURCE_META: Record<VersionSource, { icon: React.ElementType; color: string; label: string }> = {
  auto:   { icon: Clock3,     color: '#6366f1', label: 'Auto-save'  },
  manual: { icon: ShieldCheck, color: '#22c55e', label: 'Manual save' },
  import: { icon: FilePlus2,   color: '#f59e0b', label: 'Import'      },
  crash:  { icon: AlertOctagon, color: '#ef4444', label: 'Recovery'    },
};

function fmtTs(ts: number): string {
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000)  return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / (1024 * 1024)).toFixed(1)}MB`;
}

const VersionCard: React.FC<{
  v: VersionMeta;
  onRestore: () => void;
  onDelete: () => void;
  onRename: (label: string) => void;
}> = ({ v, onRestore, onDelete, onRename }) => {
  const src = SOURCE_META[v.source];
  const [editing, setEditing]           = useState(false);
  const [label, setLabel]               = useState(v.label);
  const [confirmDel, setConfirmDel]     = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);

  useEffect(() => { if (!editing) setLabel(v.label); }, [v.label, editing]);

  const commitRename = () => {
    const t = label.trim();
    if (t && t !== v.label) onRename(t);
    setEditing(false);
  };

  return (
    <div className="group bg-white border border-gray-100 rounded-xl p-3 hover:border-gray-200 hover:shadow-sm transition-all">
      <div className="flex items-start gap-2.5">
        {/* Source icon */}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: src.color + '15' }}>
          <src.icon size={13} style={{ color: src.color }} />
        </div>

        {/* Label + preview */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={label}
              onChange={e => setLabel(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditing(false); }}
              className="w-full text-xs border border-indigo-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400 mb-0.5"
            />
          ) : (
            <p
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-gray-800 truncate cursor-text hover:text-indigo-600 transition-colors leading-tight"
              title={v.label}
            >
              {v.label}
            </p>
          )}
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{v.preview}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] text-gray-300 uppercase font-semibold tracking-wide">{src.label}</span>
            <span className="text-[9px] text-gray-300">·</span>
            <span className="text-[9px] text-gray-400">{fmtTs(v.timestamp)}</span>
            <span className="text-[9px] text-gray-300">·</span>
            <span className="text-[9px] text-gray-400">{fmtBytes(v.dataSize)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {confirmRestore ? (
            <div className="flex flex-col items-end gap-1">
              <p className="text-[9px] text-red-600 font-medium text-right leading-tight max-w-28">Replaces current work.<br />Irreversible.</p>
              <div className="flex gap-1">
                <button onClick={() => { setConfirmRestore(false); onRestore(); }} className="px-1.5 py-0.5 rounded text-[9px] bg-red-500 text-white hover:bg-red-600 transition-colors font-semibold">
                  Restore
                </button>
                <button onClick={() => setConfirmRestore(false)} className="px-1.5 py-0.5 rounded text-[9px] bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmRestore(true)}
              title="Restore this version"
              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
            >
              <RotateCcw size={11} />
            </button>
          )}
          {confirmDel ? (
            <>
              <button onClick={onDelete} className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors" title="Confirm delete">
                <Check size={11} />
              </button>
              <button onClick={() => setConfirmDel(false)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors" title="Cancel">
                ✕
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmDel(true)}
              title="Delete this version"
              className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const SOURCE_GROUPS: VersionSource[] = ['manual', 'import', 'auto'];
const SOURCE_GROUP_LABELS: Record<VersionSource, string> = {
  manual: 'Manual saves',
  import: 'Uploaded',
  auto:   'Auto-saves',
  crash:  'Crash recovery',
};

export const RecoveryPanel: React.FC = () => {
  const { versions, loadVersions, restoreVersion, deleteVersion, renameVersion, idbAvailable, hasRecovery, dismissRecovery } = useSaveStore();
  const { loadFromData } = useResumeStore();
  const [restoring, setRestoring] = useState<string | null>(null);
  const [filter, setFilter] = useState<VersionSource | 'all'>('all');

  useEffect(() => { loadVersions(); }, [loadVersions]);

  const handleRestore = async (id: string, label: string) => {
    setRestoring(id);
    try {
      const data = await restoreVersion(id);
      if (!data) { toast.error('Could not load this version.'); return; }
      loadFromData(data, true);
      toast.success(`Restored: ${label}`, { icon: '✅' });
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVersion(id);
      toast('Version deleted', { icon: '✅', duration: 2000 });
    } catch {
      toast.error('Could not delete version. Try again.');
    }
  };

  const displayed = filter === 'all' ? versions : versions.filter(v => v.source === filter);
  const grouped   = SOURCE_GROUPS.map(src => ({
    src,
    items: displayed.filter(v => v.source === src),
  })).filter(g => g.items.length > 0);

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Version History</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">{versions.length} saved · click label to rename</p>
        </div>
      </div>

      {/* Crash recovery banner */}
      <AnimatePresence>
        {hasRecovery && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-3 overflow-hidden">
            <div className="flex items-start gap-2">
              <AlertOctagon size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-800">Previous session recovered</p>
                <p className="text-[10px] text-amber-600 mt-0.5 mb-2">An auto-save was found from a previous session that may not have closed cleanly.</p>
                <div className="flex gap-2">
                  <button onClick={dismissRecovery} className="text-[10px] text-amber-700 hover:text-amber-900 font-medium underline underline-offset-2 transition-colors">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No IDB warning */}
      {!idbAvailable && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-start gap-2">
          <Database size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-500">Version history requires IndexedDB. Your browser may be in private mode or have storage disabled.</p>
        </div>
      )}

      {/* Filter tabs */}
      {versions.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {(['all', ...SOURCE_GROUPS] as Array<VersionSource | 'all'>).map(f => {
            const count = f === 'all' ? versions.length : versions.filter(v => v.source === f).length;
            if (count === 0 && f !== 'all') return null;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {f === 'all' ? `All (${count})` : `${SOURCE_GROUP_LABELS[f]} (${count})`}
              </button>
            );
          })}
        </div>
      )}

      {/* Version list */}
      {versions.length === 0 && idbAvailable && (
        <div className="text-center py-8">
          <FileClock size={28} className="text-gray-200 mx-auto mb-2" />
          <p className="text-xs text-gray-400">No saved versions yet.</p>
          <p className="text-[10px] text-gray-300 mt-1">Versions are saved automatically every 5s and when you click Save.</p>
        </div>
      )}

      <div className="space-y-4">
        {grouped.map(({ src, items }) => (
          <div key={src}>
            <div className="flex items-center gap-1.5 mb-2">
              {React.createElement(SOURCE_META[src].icon, { size: 11, style: { color: SOURCE_META[src].color }, className: 'flex-shrink-0' })}
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{SOURCE_GROUP_LABELS[src]}</p>
            </div>
            <div className="space-y-1.5">
              {items.map(v => (
                <div key={v.id} className={restoring === v.id ? 'opacity-50 pointer-events-none' : ''}>
                  <VersionCard
                    v={v}
                    onRestore={() => handleRestore(v.id, v.label)}
                    onDelete={() => handleDelete(v.id)}
                    onRename={label => renameVersion(v.id, label)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Current session info */}
      {versions.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            Auto-saves kept: up to 10 · Manual saves kept: up to 20 · Import snapshots always kept
          </p>
        </div>
      )}
    </motion.div>
  );
};
