import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, RotateCw, ZoomIn, ZoomOut, Crop, Check, Maximize2 } from 'lucide-react';
import { useResumeStore } from '../../store/resumeStore';

interface Props { onClose: () => void }

export const PhotoEditorModal: React.FC<Props> = ({ onClose }) => {
  const { resume, updatePersonalInfo } = useResumeStore();
  const src = resume.personalInfo.photo;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [cropShape, setCropShape] = useState<'circle' | 'square' | 'rounded'>('circle');
  const imageRef = useRef<HTMLImageElement | null>(null);
  const CANVAS_SIZE = 320;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Clipping shape
    ctx.save();
    if (cropShape === 'circle') {
      ctx.beginPath();
      ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 4, 0, Math.PI * 2);
      ctx.clip();
    } else if (cropShape === 'rounded') {
      const r = CANVAS_SIZE * 0.12;
      ctx.beginPath();
      ctx.roundRect(4, 4, CANVAS_SIZE - 8, CANVAS_SIZE - 8, r);
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(4, 4, CANVAS_SIZE - 8, CANVAS_SIZE - 8);
      ctx.clip();
    }

    // Background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw image with transform
    const cx = CANVAS_SIZE / 2 + offset.x;
    const cy = CANVAS_SIZE / 2 + offset.y;
    const scaledW = img.naturalWidth * zoom;
    const scaledH = img.naturalHeight * zoom;

    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -scaledW / 2, -scaledH / 2, scaledW, scaledH);
    ctx.restore();

    // Border
    ctx.save();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    if (cropShape === 'circle') {
      ctx.beginPath();
      ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 4, 0, Math.PI * 2);
      ctx.stroke();
    } else if (cropShape === 'rounded') {
      const r = CANVAS_SIZE * 0.12;
      ctx.beginPath();
      ctx.roundRect(4, 4, CANVAS_SIZE - 8, CANVAS_SIZE - 8, r);
      ctx.stroke();
    } else {
      ctx.strokeRect(4, 4, CANVAS_SIZE - 8, CANVAS_SIZE - 8);
    }
    ctx.restore();
  }, [zoom, rotation, offset, cropShape]);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      // Auto-fit
      const fit = Math.min(CANVAS_SIZE / img.naturalWidth, CANVAS_SIZE / img.naturalHeight);
      setZoom(fit * 1.05);
      setOffset({ x: 0, y: 0 });
      setRotation(0);
    };
    img.onerror = () => {
      import('react-hot-toast').then(({ default: toast }) => toast.error('Could not load the photo. It may be corrupted.'));
    };
    img.src = src;
  }, [src]);

  useEffect(() => { draw(); }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.1, Math.min(5, z - e.deltaY * 0.001)));
  };

  const fitToFrame = () => {
    const fit = Math.min(CANVAS_SIZE / imgSize.w, CANVAS_SIZE / imgSize.h);
    setZoom(fit);
    setOffset({ x: 0, y: 0 });
  };

  const fillFrame = () => {
    const fill = Math.max(CANVAS_SIZE / imgSize.w, CANVAS_SIZE / imgSize.h);
    setZoom(fill);
    setOffset({ x: 0, y: 0 });
  };

  const apply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Export without the border indicator
    const output = document.createElement('canvas');
    output.width = CANVAS_SIZE;
    output.height = CANVAS_SIZE;
    const ctx = output.getContext('2d')!;
    ctx.drawImage(canvas, 0, 0);
    const dataUrl = output.toDataURL('image/jpeg', 0.95);
    updatePersonalInfo('photo', dataUrl);
    onClose();
  };

  if (!src) return null;

  const zoomPct = Math.round(zoom * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Crop size={16} className="text-indigo-500" />
              <h2 className="text-sm font-semibold text-gray-800">Photo Editor</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Shape selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Shape:</span>
              {(['circle', 'square', 'rounded'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setCropShape(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${cropShape === s ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {/* Canvas */}
            <div className="flex justify-center">
              <div className="relative rounded-xl overflow-hidden bg-gray-100 shadow-inner" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
                <canvas
                  ref={canvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                  style={{ cursor: dragging ? 'grabbing' : 'grab', display: 'block' }}
                />
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-mono pointer-events-none">
                  {zoomPct}%
                </div>
              </div>
            </div>

            <p className="text-[10px] text-gray-400 text-center">Drag to reposition · Scroll to zoom</p>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-3">
              {/* Zoom */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5 flex items-center gap-1">
                  <ZoomIn size={11} /> Zoom: {zoomPct}%
                </label>
                <input
                  type="range" min={10} max={500} value={zoomPct}
                  onChange={e => setZoom(parseInt(e.target.value) / 100)}
                  className="w-full"
                />
              </div>
              {/* Rotation */}
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5 flex items-center gap-1">
                  <RotateCw size={11} /> Rotate: {rotation}°
                </label>
                <input
                  type="range" min={-180} max={180} value={rotation}
                  onChange={e => setRotation(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-2">
              <button onClick={() => setRotation(r => r - 90)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <RotateCcw size={12} /> -90°
              </button>
              <button onClick={() => setRotation(r => r + 90)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <RotateCw size={12} /> +90°
              </button>
              <button onClick={fitToFrame} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Fit
              </button>
              <button onClick={fillFrame} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <Maximize2 size={11} /> Fill
              </button>
              <button onClick={() => { setRotation(0); setOffset({ x: 0, y: 0 }); fitToFrame(); }} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Reset
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors">
              Cancel
            </button>
            <button onClick={apply} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
              <Check size={14} /> Apply Photo
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
