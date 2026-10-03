import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { Modal } from './Modal';
import { playScanSuccessBeep, playScanErrorBeep } from '../../utils/scannerAudio';
import {
  Scan,
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  Package,
  ShoppingCart,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Sparkles,
  Barcode,
  Keyboard,
  Info,
} from 'lucide-react';

interface ThermalScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'sales' | 'inventory';
  onProductScanned?: (product: Product) => void;
  cartItemCount?: number;
  cartTotal?: number;
  onQuickStockIn?: (product: Product) => void;
  onQuickStockOut?: (product: Product) => void;
}

export const ThermalScannerModal: React.FC<ThermalScannerModalProps> = ({
  isOpen,
  onClose,
  mode,
  onProductScanned,
  cartItemCount = 0,
  cartTotal = 0,
  onQuickStockIn,
  onQuickStockOut,
}) => {
  const { products, showToast } = useApp();

  const [inputCode, setInputCode] = useState('');
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [continuousScan, setContinuousScan] = useState(true);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [scanCount, setScanCount] = useState(0);

  const hardwareInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Focus input on open for instant hardware scanner capture
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        hardwareInputRef.current?.focus();
      }, 150);
      setScanMessage({
        text: 'Ready for scanning. Handheld USB/Bluetooth scanner or camera active.',
        type: 'info',
      });
    } else {
      stopCamera();
      setInputCode('');
      setLastScannedProduct(null);
      setScanMessage(null);
      setScanCount(0);
    }
  }, [isOpen]);

  // Keep focus on the hardware input if modal is open and user clicks around
  const ensureInputFocused = () => {
    hardwareInputRef.current?.focus();
  };

  const handleProcessBarcode = useCallback((rawCode: string) => {
    const trimmed = rawCode.trim();
    if (!trimmed) return;

    // Search product by barcode (exact), then SKU (case-insensitive), then ID
    const found = products.find((p) => {
      const matchBarcode = p.barcode && p.barcode.trim().toLowerCase() === trimmed.toLowerCase();
      const matchSku = p.sku && p.sku.trim().toLowerCase() === trimmed.toLowerCase();
      const matchId = p.id.toLowerCase() === trimmed.toLowerCase();
      return matchBarcode || matchSku || matchId;
    });

    if (found) {
      if (audioFeedback) playScanSuccessBeep();
      setLastScannedProduct(found);
      setScanCount((prev) => prev + 1);

      if (mode === 'sales') {
        if (found.currentStock <= 0) {
          setScanMessage({
            text: `⚠️ [${found.sku}] ${found.name} is OUT OF STOCK (0 in inventory).`,
            type: 'error',
          });
          if (audioFeedback) playScanErrorBeep();
        } else {
          setScanMessage({
            text: `✓ Scanned: ${found.name} (${found.unit}) — Added to POS Cart!`,
            type: 'success',
          });
          onProductScanned?.(found);
        }
      } else {
        setScanMessage({
          text: `✓ Found: ${found.name} • Stock: ${found.currentStock} ${found.unit} • Bay: ${found.location}`,
          type: 'success',
        });
        onProductScanned?.(found);
      }

      if (!continuousScan) {
        setTimeout(() => {
          onClose();
        }, 600);
      }
    } else {
      if (audioFeedback) playScanErrorBeep();
      setScanMessage({
        text: `✕ No material found matching barcode / SKU "${trimmed}".`,
        type: 'error',
      });
    }

    setInputCode('');
    hardwareInputRef.current?.focus();
  }, [products, audioFeedback, mode, onProductScanned, continuousScan, onClose]);

  // Handle hardware scanner keyboard input (enter key submission)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleProcessBarcode(inputCode);
    }
  };

  // Camera Barcode Scanning Engine
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Check for native BarcodeDetector API support
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e'],
        });

        const detectLoop = async () => {
          if (!videoRef.current || !streamRef.current) return;
          try {
            if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              const detected = await barcodeDetector.detect(videoRef.current);
              if (detected && detected.length > 0) {
                const codeValue = detected[0].rawValue;
                handleProcessBarcode(codeValue);
                // Pause detection momentarily to avoid duplicate triggers
                await new Promise((r) => setTimeout(r, 1200));
              }
            }
          } catch {
            // Ignore frame decode glitches
          }
          if (streamRef.current) {
            animationFrameRef.current = requestAnimationFrame(detectLoop);
          }
        };

        detectLoop();
      }
    } catch {
      showToast('Camera access permission was denied or unavailable', 'warning');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'sales' ? 'Thermal / Barcode Scanner (POS Register)' : 'Thermal / Barcode Scanner (Inventory)'}
      subtitle="Handheld USB/Bluetooth scanner, Camera scan, or direct barcode lookup"
      maxWidth="lg"
    >
      <div className="space-y-4" onClick={ensureInputFocused}>
        {/* Scanner Status & Action Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 rounded-xl text-white">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute inset-0" />
              <div className="w-3 h-3 rounded-full bg-emerald-500 relative" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-amber-400" />
                <span>Thermal Scanner Engine Active</span>
              </span>
              <p className="text-[10px] text-slate-400">
                Listening for 1D/2D barcodes via Handheld Reader or Camera
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setAudioFeedback(!audioFeedback)}
              title={audioFeedback ? 'Mute Scanner Beep' : 'Unmute Scanner Beep'}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                audioFeedback
                  ? 'bg-slate-800 text-amber-400 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {audioFeedback ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="text-[10px]">{audioFeedback ? 'Beep ON' : 'Muted'}</span>
            </button>

            {/* Continuous Scan Toggle */}
            <button
              type="button"
              onClick={() => setContinuousScan(!continuousScan)}
              className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer ${
                continuousScan
                  ? 'bg-amber-500 text-slate-950 border-amber-600'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {continuousScan ? 'Multi-Scan ON' : 'Single Scan'}
            </button>

            {/* Camera Toggle Button */}
            <button
              type="button"
              onClick={isCameraActive ? stopCamera : startCamera}
              className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                isCameraActive
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                  : 'bg-sky-500 text-white border-sky-600 hover:bg-sky-400'
              }`}
            >
              {isCameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
              <span>{isCameraActive ? 'Close Camera' : 'Camera Scan'}</span>
            </button>
          </div>
        </div>

        {/* Live Camera View with Animated Laser Sweep Beam */}
        {isCameraActive && (
          <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-amber-500/60 shadow-xl max-h-64 flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-56 object-cover"
            />
            {/* Animated Laser Scanning Beam */}
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-[0_0_12px_#f43f5e] pointer-events-none animate-pulse" />
            <div className="absolute inset-8 border-2 border-dashed border-amber-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-3 select-none">
              <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest bg-black/60 px-2 py-0.5 rounded self-start">
                Align barcode within target frame
              </span>
              <span className="text-[10px] font-mono text-slate-300 bg-black/60 px-2 py-0.5 rounded self-end">
                Auto-sensing...
              </span>
            </div>
          </div>
        )}

        {/* Hardware Wedge Scanner Primary Input Box */}
        <div className="relative">
          <div className="p-4 bg-amber-50/70 rounded-2xl border-2 border-amber-400 shadow-inner space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-extrabold uppercase tracking-wide text-amber-950 flex items-center gap-1.5">
                <Keyboard className="w-4 h-4 text-amber-600" />
                <span>Handheld Thermal Scanner Receiver</span>
              </label>
              <span className="text-[11px] font-mono font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                Auto-Focus Ready
              </span>
            </div>

            <div className="relative">
              <input
                ref={hardwareInputRef}
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Scan barcode with handheld thermal scanner or type SKU & press Enter..."
                className="w-full pl-10 pr-24 py-3 bg-white border border-amber-300 rounded-xl text-sm font-mono font-black text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden focus:ring-4 focus:ring-amber-500/30 shadow-xs"
              />
              <Scan className="w-5 h-5 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => handleProcessBarcode(inputCode)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold rounded-lg text-xs transition-all cursor-pointer shadow-xs"
              >
                Scan Code
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-amber-900/80 px-1 pt-0.5">
              <span>Point scanner &amp; pull trigger (auto-submits on beep)</span>
              <span>Scanned this session: <strong className="text-slate-950">{scanCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Status Message Alert */}
        {scanMessage && (
          <div
            className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-1 ${
              scanMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : scanMessage.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-300'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            {scanMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {scanMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            {scanMessage.type === 'info' && <Info className="w-4 h-4 text-sky-600 shrink-0" />}
            <span>{scanMessage.text}</span>
          </div>
        )}

        {/* Last Scanned Product Details Card */}
        {lastScannedProduct && (
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                  {lastScannedProduct.unit}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-500">
                      SKU: {lastScannedProduct.sku}
                    </span>
                    {lastScannedProduct.barcode && (
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                        UPC: {lastScannedProduct.barcode}
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                      {lastScannedProduct.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    {lastScannedProduct.name}
                  </h4>
                  <div className="text-xs text-slate-500">
                    Location: <strong className="text-slate-700">{lastScannedProduct.location}</strong>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm font-black font-mono text-slate-900">
                  ₱{Number(lastScannedProduct.sellingPrice || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </div>
                <div
                  className={`text-[11px] font-bold mt-0.5 ${
                    lastScannedProduct.currentStock <= 0
                      ? 'text-rose-600'
                      : lastScannedProduct.currentStock <= lastScannedProduct.minStock
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  Stock: {lastScannedProduct.currentStock} {lastScannedProduct.unit}
                </div>
              </div>
            </div>

            {/* Contextual Actions on Scanned Item */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {mode === 'sales' ? (
                <button
                  type="button"
                  onClick={() => {
                    onProductScanned?.(lastScannedProduct);
                    playScanSuccessBeep();
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another (+1)</span>
                </button>
              ) : (
                <>
                  {onQuickStockIn && (
                    <button
                      type="button"
                      onClick={() => onQuickStockIn(lastScannedProduct)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      <span>Quick Stock In</span>
                    </button>
                  )}
                  {onQuickStockOut && (
                    <button
                      type="button"
                      onClick={() => onQuickStockOut(lastScannedProduct)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowUpFromLine className="w-3.5 h-3.5" />
                      <span>Quick Stock Out</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* In Sales POS: Cart Summary preview */}
        {mode === 'sales' && (
          <div className="p-3 bg-slate-900 rounded-xl text-white flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span>Current POS Cart: <strong>{cartItemCount} item(s)</strong></span>
            </div>
            <div className="font-mono font-black text-amber-400 text-sm">
              ₱{Number(cartTotal || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </div>
          </div>
        )}

        {/* Quick Simulation Barcode Testing Buttons (Hardware Simulator) */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Barcode Test Simulation (Click any item to simulate physical scan):</span>
            </span>
            <span className="text-[10px] text-slate-400">Sample Catalog SKUs</span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {products.slice(0, 10).map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => handleProcessBarcode(prod.barcode || prod.sku)}
                className="px-2 py-1 rounded bg-white hover:bg-amber-100 border border-slate-200 text-slate-700 text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Barcode className="w-3 h-3 text-slate-400" />
                <span className="font-bold text-slate-900">{prod.barcode || prod.sku}</span>
                <span className="text-slate-500 font-sans truncate max-w-[120px]">({prod.name})</span>
              </button>
            ))}
            {products.length === 0 && (
              <span className="text-xs text-slate-400 italic">No products registered in database to simulate.</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
          <span className="text-slate-400 text-[11px]">
            Compatible with all USB/Bluetooth HID thermal scanners &amp; mobile cameras
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Done Scanning
          </button>
        </div>
      </div>
    </Modal>
  );
};
