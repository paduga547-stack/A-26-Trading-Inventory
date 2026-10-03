import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Share2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  X,
  Radio,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface DriverAppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DriverAppDownloadModal: React.FC<DriverAppDownloadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { setCurrentPage, showToast, settings } = useApp();
  const [copied, setCopied] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  // Determine current active URL or deployment URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-pre-jsskzgtdadtyt63ad4dz2v-556135831773.asia-southeast1.run.app';
  const driverAppUrl = `${currentOrigin}/?mode=driver`;

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPwa(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(driverAppUrl);
    setCopied(true);
    showToast('Direct Driver App link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('A26 Driver Mobile App installed successfully!', 'success');
      }
      setDeferredPrompt(null);
      setCanInstallPwa(false);
    } else {
      // Guide user to add to home screen
      showToast('To install on your phone: Tap browser Menu (⋮) or Share and select "Add to Home Screen" / "Install app".', 'info');
    }
  };

  const handleDownloadLauncherHtml = () => {
    const launcherContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>A26 Driver App</title>
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#f59e0b">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #fff; margin: 0; padding: 24px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; }
    .card { background: #1e293b; padding: 28px; border-radius: 20px; border: 1px solid #334155; max-width: 360px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    .logo { background: #f59e0b; color: #000; width: 64px; height: 64px; border-radius: 16px; font-weight: 900; font-size: 24px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; }
    h1 { font-size: 20px; margin: 0 0 8px; font-weight: 800; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0 0 24px; }
    .btn { display: block; width: 100%; box-sizing: border-box; background: #f59e0b; color: #000; font-weight: 800; padding: 14px 20px; border-radius: 12px; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4); }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">A26</div>
    <h1>A26 TRADING DRIVER APP</h1>
    <p>Connecting to store dispatch system & GPS live tracking...</p>
    <a href="${driverAppUrl}" class="btn">Buksan ang Driver App</a>
  </div>
  <script>
    setTimeout(function() { window.location.href = "${driverAppUrl}"; }, 1200);
  </script>
</body>
</html>`;

    const blob = new Blob([launcherContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'A26_Driver_Mobile_App.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded A26 Driver App shortcut launcher file!', 'success');
  };

  const handleOpenInsideERP = () => {
    setCurrentPage('driver-app');
    onClose();
    showToast('Switched to Driver Mobile App view', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden text-slate-900 my-6">
        {/* Top Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xl shadow-lg shadow-amber-500/30">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase tracking-wider text-amber-400">
                  Driver Mobile App Download &amp; Direct Access
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Install on Android or iPhone to receive delivery trips, GPS tracking &amp; instant messaging
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Main 2-Column: QR Code + Direct Download Options */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left QR Code Box (5 Cols) */}
            <div className="md:col-span-5 bg-slate-50 border-2 border-dashed border-amber-300 rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5 bg-amber-100 px-3 py-1 rounded-full">
                <QrCode className="w-3.5 h-3.5 text-amber-700" />
                <span>Scan with Cellphone Camera</span>
              </span>

              {/* High Contrast Scalable QR Pattern */}
              <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200">
                <svg
                  className="w-40 h-40"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Outer Frame */}
                  <rect width="100" height="100" rx="4" fill="white" />
                  {/* Top-left marker */}
                  <rect x="6" y="6" width="28" height="28" rx="3" fill="#0f172a" />
                  <rect x="11" y="11" width="18" height="18" rx="2" fill="white" />
                  <rect x="15" y="15" width="10" height="10" rx="1" fill="#f59e0b" />

                  {/* Top-right marker */}
                  <rect x="66" y="6" width="28" height="28" rx="3" fill="#0f172a" />
                  <rect x="71" y="11" width="18" height="18" rx="2" fill="white" />
                  <rect x="75" y="15" width="10" height="10" rx="1" fill="#f59e0b" />

                  {/* Bottom-left marker */}
                  <rect x="6" y="66" width="28" height="28" rx="3" fill="#0f172a" />
                  <rect x="11" y="71" width="18" height="18" rx="2" fill="white" />
                  <rect x="15" y="75" width="10" height="10" rx="1" fill="#f59e0b" />

                  {/* Dense data matrix pattern */}
                  <rect x="38" y="10" width="6" height="6" fill="#0f172a" />
                  <rect x="48" y="10" width="6" height="6" fill="#0f172a" />
                  <rect x="38" y="20" width="6" height="6" fill="#0f172a" />
                  <rect x="52" y="20" width="6" height="6" fill="#0f172a" />
                  <rect x="44" y="28" width="6" height="6" fill="#0f172a" />

                  <rect x="10" y="38" width="6" height="6" fill="#0f172a" />
                  <rect x="22" y="44" width="6" height="6" fill="#0f172a" />
                  <rect x="14" y="52" width="6" height="6" fill="#0f172a" />

                  <rect x="70" y="38" width="6" height="6" fill="#0f172a" />
                  <rect x="80" y="44" width="6" height="6" fill="#0f172a" />
                  <rect x="86" y="52" width="6" height="6" fill="#0f172a" />

                  <rect x="38" y="38" width="8" height="8" rx="2" fill="#f59e0b" />
                  <rect x="50" y="38" width="6" height="6" fill="#0f172a" />
                  <rect x="38" y="50" width="6" height="6" fill="#0f172a" />
                  <rect x="48" y="48" width="8" height="8" rx="2" fill="#0f172a" />
                  <rect x="60" y="48" width="6" height="6" fill="#0f172a" />

                  <rect x="38" y="66" width="6" height="6" fill="#0f172a" />
                  <rect x="48" y="66" width="6" height="6" fill="#0f172a" />
                  <rect x="58" y="66" width="6" height="6" fill="#0f172a" />
                  <rect x="42" y="76" width="6" height="6" fill="#0f172a" />
                  <rect x="54" y="76" width="6" height="6" fill="#0f172a" />
                  <rect x="64" y="76" width="6" height="6" fill="#0f172a" />

                  <rect x="74" y="66" width="6" height="6" fill="#0f172a" />
                  <rect x="84" y="72" width="6" height="6" fill="#0f172a" />
                  <rect x="78" y="82" width="6" height="6" fill="#0f172a" />
                </svg>
              </div>

              <p className="text-[11px] text-slate-500 font-medium">
                Buksan ang camera ng cellphone at itutok dito para mag-direct open sa Driver App
              </p>
            </div>

            {/* Right Options (7 Cols) */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>Direct Mobile Web App Link:</span>
                </h4>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={driverAppUrl}
                    className="flex-1 px-3 py-2 text-xs font-mono bg-slate-100 border border-slate-300 rounded-xl text-slate-700 select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Install PWA Button / Action */}
              <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-amber-600" />
                    <span>One-Click Install or Shortcut</span>
                  </span>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                    No App Store Needed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleInstallPwa}
                    className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Install App on Device</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadLauncherHtml}
                    className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 active:scale-95 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>Download App Launcher</span>
                  </button>
                </div>

                <p className="text-[10px] text-amber-800 leading-relaxed">
                  Direct PWA Application: Gumagana offline at may access sa camera para sa Proof of Delivery (POD) at GPS tracker.
                </p>
              </div>

              {/* Easy Instructions for Android & iPhone */}
              <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-bold text-slate-900 flex items-center gap-1 mb-1">
                    <span>🤖 Android (Chrome)</span>
                  </div>
                  <ol className="text-slate-600 space-y-0.5 list-decimal list-inside text-[10px]">
                    <li>I-tap ang <strong>3 dots (⋮)</strong> sa taas</li>
                    <li>Piliin ang <strong>"Install app"</strong> o <strong>"Add to Home screen"</strong></li>
                  </ol>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-bold text-slate-900 flex items-center gap-1 mb-1">
                    <span>🍎 iPhone (Safari)</span>
                  </div>
                  <ol className="text-slate-600 space-y-0.5 list-decimal list-inside text-[10px]">
                    <li>I-tap ang <strong>Share icon (↥)</strong></li>
                    <li>Piliin ang <strong>"Add to Home Screen"</strong></li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar with Direct ERP Switch */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-slate-500 text-[11px] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Ligtas at opisyal na software ng {settings.businessName}</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleOpenInsideERP}
                className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-amber-100 text-slate-800 hover:text-amber-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Subukan ang Driver App View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
              >
                Isara
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
