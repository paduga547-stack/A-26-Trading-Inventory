import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Eraser, Check, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSignatureChange: (signatureDataUrl: string | null) => void;
  title?: string;
  subtitle?: string;
  height?: number;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSignatureChange,
  title = 'Customer / Receiver Signature',
  subtitle = 'Please sign using your finger or stylus inside the box',
  height = 160,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Initialize canvas with high-DPI resolution
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0284c7'; // Crisp vibrant blue ink
    ctx.lineWidth = 2.5;

    // Reset drawn state
    setHasDrawn(false);
  }, []);

  useEffect(() => {
    initCanvas();

    const handleResize = () => {
      // Re-init on window resize
      initCanvas();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initCanvas]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Prevent scrolling when touching the canvas on mobile
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    if (!hasDrawn) {
      setHasDrawn(true);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (hasDrawn) {
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureChange(dataUrl);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, rect.width * dpr, rect.height * dpr);

    setHasDrawn(false);
    onSignatureChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5 text-amber-400" />
            <span>{title} *</span>
          </label>
          <p className="text-[10px] text-slate-400">{subtitle}</p>
        </div>

        {hasDrawn && (
          <button
            type="button"
            onClick={clearSignature}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-rose-300 font-bold text-[11px] rounded-lg border border-slate-700 flex items-center gap-1 transition-all cursor-pointer"
          >
            <Eraser className="w-3 h-3 text-rose-400" />
            <span>Clear / Ulitin</span>
          </button>
        )}
      </div>

      {/* Signature Canvas Box */}
      <div className="relative rounded-xl border-2 border-dashed border-amber-500/40 bg-slate-950 overflow-hidden shadow-inner touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ height: `${height}px`, width: '100%', display: 'block' }}
          className="cursor-crosshair w-full"
        />

        {/* Signature Guideline */}
        <div className="absolute left-6 right-6 bottom-7 border-b border-slate-700/60 pointer-events-none flex items-center justify-between text-[9px] text-slate-500 font-mono select-none">
          <span>✕ Sign Here (Lumagda Rito)</span>
          <span>A-Twenty Six Trading Verification</span>
        </div>

        {/* Empty state hint */}
        {!hasDrawn && !isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-500 text-xs">
            <span className="bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800 text-[11px] font-medium flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-amber-400" />
              Sign directly on screen (Touch / Mouse)
            </span>
          </div>
        )}

        {/* Verified Badge */}
        {hasDrawn && (
          <div className="absolute top-2 right-2 bg-emerald-500/90 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow pointer-events-none uppercase">
            <Check className="w-3 h-3" />
            <span>Signature Captured</span>
          </div>
        )}
      </div>
    </div>
  );
};
