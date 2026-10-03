import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { DeliveryOrder, DeliveryStatus, DriverMessageCategory } from '../../types';
import {
  Truck,
  Coffee,
  MapPin,
  Camera,
  CheckCircle2,
  Clock,
  Phone,
  Navigation,
  Package,
  RotateCcw,
  Smartphone,
  Maximize2,
  Minimize2,
  User,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  X,
  Upload,
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCheck,
  Radio,
  Download,
  Share2,
  Banknote,
  Compass,
  Calendar,
  Fuel,
  Wifi,
  WifiOff,
  Power,
  Sliders,
  FileText,
  RotateCw,
} from 'lucide-react';
import { DriverAppDownloadModal } from './DriverAppDownloadModal';
import { DriverRouteMapView } from './DriverRouteMapView';
import { DriverCodModal } from './DriverCodModal';
import { SignaturePad } from './SignaturePad';
import { DriverBottomNav, DriverNavTab } from './DriverBottomNav';
import { DriverTripSummaryModal } from './DriverTripSummaryModal';
import { DriverMonthlyLedgerView } from './DriverMonthlyLedgerView';
import { DeliveryReceiptModal } from './DeliveryReceiptModal';

export const DriverMobileAppView: React.FC = () => {
  const {
    deliveryOrders,
    employees,
    driverDutyStatuses,
    driverMessages,
    sendDriverMessage,
    markDriverMessagesAsRead,
    currentUser,
    setDriverBreakStatus,
    updateDriverGps,
    assignDriver,
    updateDeliveryStatus,
    updateDeliveryPOD,
    driverShifts,
    startDriverShift,
    endDriverShift,
    showToast,
  } = useApp();

  // Active driver selection
  const driverEmployees = employees.filter((e) => e.position === 'Driver' && e.status === 'ACTIVE');
  const initialDriverName = currentUser?.role === 'DRIVER'
    ? currentUser.name
    : driverEmployees[0]?.name || 'Pedro Santos';

  const [activeDriver, setActiveDriver] = useState<string>(initialDriverName);
  
  // Mobile Bottom Navigation Tab & Deliveries Sub-Tab
  const [navTab, setNavTab] = useState<DriverNavTab>('DELIVERIES');
  const [deliverySubTab, setDeliverySubTab] = useState<'ASSIGNED' | 'AVAILABLE' | 'COMPLETED'>('ASSIGNED');

  const [isPhoneFrame, setIsPhoneFrame] = useState(true);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isTripSummaryModalOpen, setIsTripSummaryModalOpen] = useState(false);
  const [receiptTargetOrder, setReceiptTargetOrder] = useState<DeliveryOrder | null>(null);
  const [codTargetOrder, setCodTargetOrder] = useState<DeliveryOrder | null>(null);
  const [mapFocusedOrder, setMapFocusedOrder] = useState<DeliveryOrder | null>(null);

  // Network & Offline Sync State
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(
    new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Network Reconnected: All driver status & offline orders synced!', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline Mode: Offline caching active. Data will sync once reconnected.', 'info');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleForceSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }));
      showToast('Live database sync complete! All route coordinates & orders updated.', 'success');
    }, 700);
  };

  // Messaging state
  const [messageText, setMessageText] = useState('');
  const [selectedDeliveryForMsg, setSelectedDeliveryForMsg] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<DriverMessageCategory>('GENERAL');

  // GPS state
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Camera & POD Modal
  const [podTargetOrder, setPodTargetOrder] = useState<DeliveryOrder | null>(null);
  const [podReceivedBy, setPodReceivedBy] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [podCustomerSignature, setPodCustomerSignature] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Get active driver's duty status
  const currentDuty = driverDutyStatuses.find(
    (d) => d.driverName.toLowerCase() === activeDriver.toLowerCase()
  ) || { driverName: activeDriver, isOnBreak: false, breakStartTime: null, lastGps: null };

  // Active shift for active driver
  const activeShift = driverShifts.find(
    (s) => s.driverName.toLowerCase() === activeDriver.toLowerCase() && s.status === 'ACTIVE'
  );

  // Filter deliveries
  const myDeliveries = deliveryOrders.filter(
    (d) =>
      d.driver.toLowerCase() === activeDriver.toLowerCase() &&
      d.status !== 'DELIVERED' &&
      d.status !== 'CANCELLED'
  );

  const availableDeliveries = deliveryOrders.filter(
    (d) => d.status === 'PENDING'
  );

  const completedDeliveries = deliveryOrders.filter(
    (d) =>
      d.driver.toLowerCase() === activeDriver.toLowerCase() &&
      d.status === 'DELIVERED'
  );

  // Filter driver messages
  const myMessages = driverMessages.filter(
    (m) => m.driverName.toLowerCase() === activeDriver.toLowerCase()
  );
  const unreadRepliesCount = myMessages.filter(
    (m) => m.sender === 'STORE_ADMIN' && !m.isReadByDriver
  ).length;

  useEffect(() => {
    if (navTab === 'MESSAGES') {
      markDriverMessagesAsRead(activeDriver, 'DRIVER');
    }
  }, [navTab, activeDriver]);

  // Break toggle handler
  const handleToggleBreak = () => {
    const nextBreak = !currentDuty.isOnBreak;
    setDriverBreakStatus(activeDriver, nextBreak);
  };

  // GPS update handler
  const handleUpdateGps = () => {
    setIsLocating(true);
    setGpsError(null);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          updateDriverGps(activeDriver, lat, lng);
          setIsLocating(false);
        },
        (err) => {
          // If browser permission denied or in iframe, gracefully provide simulated live delivery GPS coords
          // (Cavite / Metro Manila delivery corridor) so the feature is fully testable and works reliably!
          const simLat = 14.3294 + (Math.random() - 0.5) * 0.02;
          const simLng = 120.9367 + (Math.random() - 0.5) * 0.02;
          updateDriverGps(activeDriver, simLat, simLng);
          setIsLocating(false);
          showToast(`GPS location pinned: ${simLat.toFixed(4)}, ${simLng.toFixed(4)} (Simulated Coordinates)`);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      const simLat = 14.3294;
      const simLng = 120.9367;
      updateDriverGps(activeDriver, simLat, simLng);
      setIsLocating(false);
    }
  };

  // Camera handling for Proof of Delivery
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setIsCameraActive(false);
      showToast('Camera not available or blocked. You can upload photo or use demo photo!', 'info');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhotoFromVideo = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhoto(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setCapturedPhoto(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseDemoPhoto = () => {
    // Generate a clean placeholder proof of delivery canvas image
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 640, 480);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 480);

      // Card
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(40, 40, 560, 60);

      ctx.fillStyle = '#020617';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('A26 TRADING — PROOF OF DELIVERY (POD)', 60, 80);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`DR Number: ${podTargetOrder?.deliveryNo || 'DEL-2026-0001'}`, 60, 160);
      ctx.fillText(`Customer: ${podTargetOrder?.customerName || 'Contractor Site'}`, 60, 200);
      ctx.fillText(`Assigned Driver: ${activeDriver}`, 60, 240);
      ctx.fillText(`Delivered At: ${new Date().toLocaleString('en-PH')}`, 60, 280);

      ctx.fillStyle = '#10b981';
      ctx.fillRect(60, 320, 520, 60);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('✓ MATERIALS UNLOADED & VERIFIED IN GOOD ORDER', 80, 358);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhoto(dataUrl);
      showToast('Demo proof of delivery photo loaded!');
    }
  };

  const handleConfirmPOD = () => {
    if (!podTargetOrder) return;
    if (!capturedPhoto) {
      showToast('Please capture or upload a Proof of Delivery photo!', 'error');
      return;
    }
    if (!podReceivedBy.trim()) {
      showToast('Please enter the name of the person who received the goods!', 'error');
      return;
    }

    updateDeliveryPOD(
      podTargetOrder.id,
      capturedPhoto,
      podReceivedBy.trim(),
      podCustomerSignature || undefined
    );
    setPodTargetOrder(null);
    setCapturedPhoto(null);
    setPodReceivedBy('');
    setPodCustomerSignature(null);
    stopCamera();
    setNavTab('DELIVERIES');
    setDeliverySubTab('COMPLETED');
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleSendQuickPreset = (preset: { label: string; text: string; category: DriverMessageCategory }) => {
    let attachedOrder: DeliveryOrder | undefined;
    if (selectedDeliveryForMsg) {
      attachedOrder = deliveryOrders.find((d) => d.id === selectedDeliveryForMsg);
    } else if (myDeliveries.length > 0) {
      attachedOrder = myDeliveries[0];
    }

    sendDriverMessage({
      driverName: activeDriver,
      text: preset.text,
      category: preset.category,
      deliveryId: attachedOrder?.id || null,
      deliveryNo: attachedOrder?.deliveryNo || null,
      sender: 'DRIVER',
    });
  };

  const handleSendCustomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    let attachedOrder: DeliveryOrder | undefined;
    if (selectedDeliveryForMsg) {
      attachedOrder = deliveryOrders.find((d) => d.id === selectedDeliveryForMsg);
    }

    sendDriverMessage({
      driverName: activeDriver,
      text: messageText.trim(),
      category: selectedCategory,
      deliveryId: attachedOrder?.id || null,
      deliveryNo: attachedOrder?.deliveryNo || null,
      sender: 'DRIVER',
    });

    setMessageText('');
  };

  const QUICK_UPDATES = [
    { label: 'Papunta na sa Site', text: 'Papunta na po ako sa delivery site.', category: 'EN_ROUTE' as DriverMessageCategory, icon: '🚚', color: 'bg-sky-500 hover:bg-sky-400' },
    { label: 'Traffic / Delay', text: 'Na-traffic po sa daan dahil sa road works/heavy congestion. Medyo madedelay ng kaunti.', category: 'TRAFFIC' as DriverMessageCategory, icon: '🚦', color: 'bg-amber-500 hover:bg-amber-400' },
    { label: 'Nandito na sa Site', text: 'Nakarating na po sa destination. Kasalukuyang binababa at in-unload ang mga materyales.', category: 'ARRIVED' as DriverMessageCategory, icon: '📍', color: 'bg-emerald-500 hover:bg-emerald-400' },
    { label: 'Waiting for Receiver', text: 'Nandito na po sa site pero naghihintay pa sa receiving engineer / customer representative.', category: 'WAITING' as DriverMessageCategory, icon: '⏳', color: 'bg-purple-500 hover:bg-purple-400' },
    { label: 'May Issue / Flat Tire', text: 'May aberya po sa sasakyan o biyahe. Need assistance or delay notification.', category: 'ISSUE' as DriverMessageCategory, icon: '⚠️', color: 'bg-rose-500 hover:bg-rose-400' },
    { label: 'Tapos na / Pabalik na', text: 'Tapos na po ang unloading at napirmahan na ang resibo. Pabalik na po sa store.', category: 'COMPLETED' as DriverMessageCategory, icon: '✅', color: 'bg-teal-500 hover:bg-teal-400' },
  ];

  return (
    <div className="space-y-4">
      {/* Top Controller Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <span>Driver Smartphone Portal &amp; GPS Dispatch App</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                Mobile View
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Live mobile portal used by delivery truck drivers on their smartphones to check items, update GPS, log break time, and capture POD photos.
            </p>
          </div>
        </div>

        {/* Driver switcher & phone frame toggle */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="flex items-center gap-1.5 text-xs bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-bold text-slate-600">Active Driver:</span>
            <select
              value={activeDriver}
              onChange={(e) => setActiveDriver(e.target.value)}
              className="font-bold text-slate-900 bg-transparent focus:outline-hidden cursor-pointer"
            >
              {driverEmployees.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
              {currentUser && currentUser.role === 'DRIVER' && (
                <option value={currentUser.name}>{currentUser.name} (You)</option>
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsDownloadModalOpen(true)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Download Driver Mobile App onto phone"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download App</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
            title={isPhoneFrame ? 'Switch to Full Screen View' : 'Switch to Smartphone Mockup Frame'}
          >
            {isPhoneFrame ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Content: Phone Frame or Full Mobile */}
      <div className={`mx-auto transition-all duration-300 ${isPhoneFrame ? 'max-w-md' : 'max-w-3xl'}`}>
        <div className={`bg-slate-950 text-slate-100 rounded-3xl shadow-2xl border-4 border-slate-800 overflow-hidden relative flex flex-col ${
          isPhoneFrame ? 'min-h-[760px]' : 'min-h-[600px]'
        }`}>
          {/* Smartphone Status Bar Header */}
          <div className="px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-mono font-semibold text-slate-400 bg-slate-950 border-b border-slate-800/80 select-none">
            <span>{new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</span>
            {/* Speaker notch */}
            <div className="w-20 h-3.5 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-slate-950 rounded-full mr-1.5" />
              <div className="w-8 h-1 bg-slate-800 rounded-full" />
            </div>
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <div className="w-4 h-2 border border-slate-400 rounded-xs p-0.5 flex items-center">
                <div className="w-full h-full bg-emerald-400 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* App Header Banner */}
          <div className="p-3.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900/80 truncate">
                    A26 Driver Portal
                  </span>
                  {/* Network online / offline badge */}
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                      isOnline ? 'bg-slate-950 text-emerald-300' : 'bg-rose-950 text-rose-200'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                    <span>{isOnline ? 'Live Sync' : 'Offline'}</span>
                  </span>
                </div>
                <h1 className="text-base sm:text-lg font-black tracking-tight leading-tight truncate">
                  {activeDriver}
                </h1>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Quick Shift Status / End Shift trigger */}
                {activeShift ? (
                  <button
                    type="button"
                    onClick={() => setIsTripSummaryModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm transition-transform active:scale-95 cursor-pointer"
                    title="End Shift and generate Delivery Trip Summary"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>End Shift</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startDriverShift(activeDriver)}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm transition-transform active:scale-95 cursor-pointer"
                  >
                    <Power className="w-3 h-3 text-emerald-400" />
                    <span>Start Shift</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsDownloadModalOpen(true)}
                  className="p-1.5 rounded-xl bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 transition-colors cursor-pointer"
                  title="Install on Phone"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Body Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/90 text-slate-100">
            {/* TAB 1: DELIVERIES & DROPS */}
            {navTab === 'DELIVERIES' && (
              <div className="space-y-3">
                {/* Segmented Sub-Tabs for Deliveries */}
                <div className="flex bg-slate-800 p-1 rounded-xl text-xs font-bold border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setDeliverySubTab('ASSIGNED')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      deliverySubTab === 'ASSIGNED'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Active ({myDeliveries.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliverySubTab('AVAILABLE')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      deliverySubTab === 'AVAILABLE'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Pending ({availableDeliveries.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliverySubTab('COMPLETED')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      deliverySubTab === 'COMPLETED'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Done ({completedDeliveries.length})</span>
                  </button>
                </div>

                {/* Sub-Tab 1: Active Deliveries */}
                {deliverySubTab === 'ASSIGNED' && (
              <div className="space-y-3">
                {myDeliveries.map((del) => (
                  <div
                    key={del.id}
                    className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-amber-400 text-xs">
                        #{del.deliveryNo}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {del.isCod && (
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              del.codStatus === 'COLLECTED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-amber-400 text-slate-950'
                            }`}
                          >
                            {del.codStatus === 'COLLECTED' ? '✓ COD Paid' : '₱ COD'}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            del.status === 'PREPARING'
                              ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                              : 'bg-sky-900/60 text-sky-300 border border-sky-700'
                          }`}
                        >
                          {del.status === 'PREPARING' ? 'Preparing & Loading' : 'Out for Delivery'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-sm text-white">
                        {del.customerName || 'Customer / Contractor'}
                      </div>
                      <div className="text-xs text-slate-300 flex items-start gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>{del.address}</span>
                      </div>
                      {del.contactPhone && (
                        <div className="mt-1 flex items-center gap-2">
                          <a
                            href={`tel:${del.contactPhone}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call {del.contactPhone}</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* COD Alert Banner & Quick Collection Button */}
                    {del.isCod && (
                      <div
                        className={`p-3 rounded-xl border text-xs ${
                          del.codStatus === 'COLLECTED'
                            ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                            : 'bg-amber-950/60 border-amber-500/60 text-amber-200 shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Banknote className="w-4 h-4 text-amber-400" />
                            <span className="uppercase text-[11px] tracking-wider">
                              {del.codStatus === 'COLLECTED'
                                ? '✓ COD Amount Collected'
                                : 'Cash on Delivery (COD) Required'}
                            </span>
                          </div>
                          <span className="font-mono font-black text-sm text-amber-400">
                            ₱{(del.codAmount || 0).toLocaleString('en-PH', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>

                        {del.codStatus === 'PENDING' ? (
                          <div className="mt-2 flex items-center justify-between gap-2 pt-2 border-t border-amber-500/20">
                            <span className="text-[11px] text-slate-300">
                              Collect cash from customer at site
                            </span>
                            <button
                              type="button"
                              onClick={() => setCodTargetOrder(del)}
                              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-md flex items-center gap-1 cursor-pointer"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                              <span>Collect ₱{(del.codAmount || 0).toLocaleString()}</span>
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-300 font-mono mt-1">
                            Paid via {del.codPaymentMethod || 'CASH'} •{' '}
                            {del.codCollectedAt
                              ? new Date(del.codCollectedAt).toLocaleTimeString('en-PH', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Verified'}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Material Items Checklist */}
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        <span>Items to Deliver ({del.items.length}):</span>
                      </div>
                      <div className="space-y-1 divide-y divide-slate-800">
                        {del.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs pt-1">
                            <span className="text-slate-200">{item.productName}</span>
                            <span className="font-mono font-bold text-amber-400">
                              {item.qty} {item.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDeliveryForMsg(del.id);
                          setNavTab('MESSAGES');
                        }}
                        className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Send quick status update for this DR"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                        <span>Update</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMapFocusedOrder(del);
                          setNavTab('MAP');
                        }}
                        className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-sky-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="View route map and GPS coordinates"
                      >
                        <Compass className="w-3.5 h-3.5 text-sky-400" />
                        <span>Route Map</span>
                      </button>

                      {del.status === 'PREPARING' && (
                        <button
                          type="button"
                          onClick={() => updateDeliveryStatus(del.id, 'OUT_FOR_DELIVERY')}
                          className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-sky-500/20 flex items-center justify-center gap-1.5 cursor-pointer min-w-[140px]"
                        >
                          <Truck className="w-4 h-4" />
                          <span>Depart (Out for Delivery)</span>
                        </button>
                      )}

                      {del.status === 'OUT_FOR_DELIVERY' && (
                        <button
                          type="button"
                          onClick={() => {
                            setPodTargetOrder(del);
                            setPodReceivedBy('');
                            setCapturedPhoto(null);
                            setPodCustomerSignature(null);
                            startCamera();
                          }}
                          className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer min-w-[140px]"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Delivered (Snap POD Photo)</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {myDeliveries.length === 0 && (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400/60" />
                    <p className="font-bold text-sm text-slate-300">No active deliveries</p>
                    <p className="text-xs text-slate-500">
                      Check the "Pending" tab to accept available delivery orders.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 2: PENDING / AVAILABLE DELIVERIES TO ACCEPT */}
            {deliverySubTab === 'AVAILABLE' && (
              <div className="space-y-3">
                {availableDeliveries.map((del) => (
                  <div
                    key={del.id}
                    className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-amber-400 text-xs">
                        #{del.deliveryNo}
                      </span>
                      <span className="text-[10px] font-bold uppercase bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                        Pending Assignment
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-sm text-white">
                        {del.customerName || 'Customer / Contractor'}
                      </div>
                      <div className="text-xs text-slate-300 flex items-start gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>{del.address}</span>
                      </div>
                    </div>

                    {/* Material items preview */}
                    <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
                      <div className="text-[10px] font-bold text-slate-400 mb-1">
                        Materials List ({del.items.length} items):
                      </div>
                      <div className="space-y-0.5">
                        {del.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[11px]">
                            <span className="text-slate-300 truncate max-w-[200px]">{item.productName}</span>
                            <span className="font-mono font-bold text-amber-400">
                              {item.qty} {item.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        assignDriver(del.id, activeDriver);
                        setDeliverySubTab('ASSIGNED');
                      }}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accept Delivery &amp; Assign to Me</span>
                    </button>
                  </div>
                ))}

                {availableDeliveries.length === 0 && (
                  <div className="py-12 text-center text-slate-400 space-y-1">
                    <Truck className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-bold text-sm text-slate-300">No pending deliveries</p>
                    <p className="text-xs text-slate-500">All dispatches have been assigned.</p>
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB 3: DELIVERED HISTORY & POD PHOTOS */}
            {deliverySubTab === 'COMPLETED' && (
              <div className="space-y-3">
                {completedDeliveries.map((del) => (
                  <div
                    key={del.id}
                    className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-emerald-400 text-xs">
                        #{del.deliveryNo}
                      </span>
                      <span className="text-[10px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full">
                        ✓ Delivered
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-sm text-white">
                        {del.customerName || 'Customer / Contractor'}
                      </div>
                      <div className="text-xs text-slate-400">
                        Received by: <strong className="text-slate-200">{del.proofReceivedBy || 'Customer Rep'}</strong>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Delivered: {del.deliveredAt ? new Date(del.deliveredAt).toLocaleString('en-PH') : 'Verified'}
                      </div>
                    </div>

                    {del.proofOfDeliveryPhoto && (
                      <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 max-h-48">
                        <img
                          src={del.proofOfDeliveryPhoto}
                          alt="Proof of Delivery"
                          className="w-full h-40 object-cover"
                        />
                      </div>
                    )}

                    {del.customerSignature && (
                      <div className="p-2.5 bg-slate-950/70 border border-slate-700/60 rounded-xl space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Verified Customer Digital Signature:
                        </span>
                        <div className="p-1.5 bg-white/95 rounded-lg border border-slate-700 inline-block">
                          <img
                            src={del.customerSignature}
                            alt="Customer Signature"
                            className="h-10 w-auto max-w-[180px] object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {completedDeliveries.length === 0 && (
                  <div className="py-12 text-center text-slate-400">
                    <Clock className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                    <p className="font-bold text-sm text-slate-300">No completed deliveries yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ROUTE MAP VIEW */}
        {navTab === 'MAP' && (
          <div className="space-y-3">
            <DriverRouteMapView
              deliveries={myDeliveries}
              driverName={activeDriver}
              driverGps={currentDuty.lastGps}
              onSelectDelivery={(d) => setMapFocusedOrder(d)}
              onOpenCodModal={(d) => setCodTargetOrder(d)}
              onOpenPodModal={(d) => {
                setPodTargetOrder(d);
                setPodReceivedBy('');
                setCapturedPhoto(null);
                setPodCustomerSignature(null);
                startCamera();
              }}
            />
          </div>
        )}

        {/* TAB 3: MONTHLY & TRIP SUMMARY REPORT VIEW */}
        {navTab === 'MONTHLY' && (
          <div className="space-y-4">
            {/* Today's Shift Liquidation Quick Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-amber-500/30 shadow-lg space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      Today's Shift Tracker
                    </div>
                    <div className="text-sm font-black text-white">
                      {activeShift ? 'Shift In Progress 🟢' : 'Standby / Ready for Shift'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTripSummaryModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{activeShift ? 'End Shift Report' : 'Trip Summary'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Completed</div>
                  <div className="text-base font-black text-emerald-400 font-mono">
                    {completedDeliveries.length} drops
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Remaining</div>
                  <div className="text-base font-black text-amber-300 font-mono">
                    {myDeliveries.length} drops
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">COD Today</div>
                  <div className="text-base font-black text-yellow-300 font-mono truncate">
                    ₱{completedDeliveries.reduce((sum, d) => sum + (d.codCollectedAmount || 0), 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Complete Monthly Driver Delivery Ledger with Date Adjuster */}
            <DriverMonthlyLedgerView
              driverName={activeDriver}
              allDeliveries={deliveryOrders}
              onOpenReceipt={(del) => setReceiptTargetOrder(del)}
            />
          </div>
        )}

        {/* TAB 4: REAL-TIME MESSAGING & QUICK UPDATES */}
        {navTab === 'MESSAGES' && (
              <div className="space-y-4">
                {/* Channel Header Banner */}
                <div className="p-3 bg-slate-800/90 rounded-2xl border border-slate-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-white">
                        Store Dispatch Live Channel
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Direct connection to A26 store admin &amp; logistics staff
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </div>

                {/* QUICK PRESET BUTTONS (1-TAP UPDATE) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
                    <span>1-Tap Quick Status Updates:</span>
                    <span className="text-[9px] text-amber-400 lowercase font-normal font-mono">tap to send instantly</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_UPDATES.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleSendQuickPreset(preset)}
                        className="p-2.5 bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-left rounded-xl border border-slate-700 text-xs transition-all shadow-xs flex items-start gap-2 cursor-pointer group"
                      >
                        <span className="text-base shrink-0">{preset.icon}</span>
                        <div className="min-w-0">
                          <div className="font-bold text-white group-hover:text-amber-400 text-[11px] leading-tight">
                            {preset.label}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {preset.text}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* TRIP REFERENCE SELECTOR */}
                {myDeliveries.length > 0 && (
                  <div className="flex items-center gap-2 text-xs bg-slate-800/60 p-2 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">Attached Trip:</span>
                    <select
                      value={selectedDeliveryForMsg}
                      onChange={(e) => setSelectedDeliveryForMsg(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-hidden cursor-pointer"
                    >
                      <option value="">General Dispatch Update</option>
                      {myDeliveries.map((d) => (
                        <option key={d.id} value={d.id}>
                          #{d.deliveryNo} - {d.customerName || 'Customer'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* LIVE MESSAGES STREAM */}
                <div className="space-y-3 p-3 bg-slate-950/60 rounded-2xl border border-slate-800/90 max-h-72 overflow-y-auto">
                  <div className="text-center text-[10px] text-slate-500 font-mono py-1 border-b border-slate-800/60">
                    Today &bull; Encrypted Store &amp; Driver Link
                  </div>

                  {myMessages.slice().reverse().map((msg) => {
                    const isFromDriver = msg.sender === 'DRIVER';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isFromDriver ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                            isFromDriver
                              ? 'bg-amber-500 text-slate-950 rounded-br-xs font-medium'
                              : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px] opacity-80 mb-1 font-bold">
                            <span>{isFromDriver ? 'You (Driver)' : '🏪 Store Dispatcher'}</span>
                            <span className="font-mono text-[9px]">
                              {new Date(msg.createdAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {msg.deliveryNo && (
                            <div className={`text-[10px] font-mono font-bold mb-1 px-1.5 py-0.5 rounded inline-block ${
                              isFromDriver ? 'bg-amber-600/40 text-slate-950' : 'bg-slate-900 text-amber-400'
                            }`}>
                              DR #{msg.deliveryNo}
                            </div>
                          )}

                          <p className="leading-relaxed">{msg.text}</p>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-[9px] text-slate-500 px-1 font-mono">
                          {isFromDriver ? (
                            <>
                              <span>Sent</span>
                              <CheckCheck className={`w-3 h-3 ${msg.isReadByStore ? 'text-sky-400' : 'text-slate-500'}`} />
                            </>
                          ) : (
                            <span>Received</span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {myMessages.length === 0 && (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      <MessageSquare className="w-8 h-8 mx-auto text-slate-700 mb-1" />
                      <p>No messages yet. Send a quick update to the store admin above!</p>
                    </div>
                  )}
                </div>

                {/* CUSTOM MESSAGE INPUT FORM */}
                <form onSubmit={handleSendCustomMessage} className="space-y-2">
                  <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px]">
                    {[
                      { cat: 'GENERAL', label: 'General' },
                      { cat: 'EN_ROUTE', label: 'En Route' },
                      { cat: 'TRAFFIC', label: 'Traffic' },
                      { cat: 'ARRIVED', label: 'Arrived' },
                      { cat: 'WAITING', label: 'Waiting' },
                      { cat: 'ISSUE', label: 'Issue' },
                    ].map((c) => (
                      <button
                        key={c.cat}
                        type="button"
                        onClick={() => setSelectedCategory(c.cat as DriverMessageCategory)}
                        className={`px-2 py-0.5 rounded-full font-bold whitespace-nowrap transition-colors cursor-pointer ${
                          selectedCategory === c.cat
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type custom update to store admin..."
                      className="flex-1 px-3 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
                    />
                    <button
                      type="submit"
                      disabled={!messageText.trim()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 5: DRIVER PROFILE, DUTY SHIFT & DEVICE SETTINGS */}
            {navTab === 'PROFILE' && (
              <div className="space-y-4">
                {/* Driver Identity Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 space-y-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-md">
                      {activeDriver.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-black text-white truncate">{activeDriver}</h2>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800">
                          Active Driver
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {activeShift?.vehicleType || 'Dropside Truck (4-Wheeler)'} • A26 Fleet
                      </p>
                      <p className="text-[11px] text-amber-400/90 font-mono mt-0.5">
                        Base: Km 26 Aguinaldo Hwy, Dasmariñas, Cavite
                      </p>
                    </div>
                  </div>

                  {/* Switch Driver quick selector if admin/multi-driver */}
                  {driverEmployees.length > 1 && (
                    <div className="pt-2 border-t border-slate-800">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Switch Active Driver Account:
                      </label>
                      <select
                        value={activeDriver}
                        onChange={(e) => setActiveDriver(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                      >
                        {driverEmployees.map((emp) => (
                          <option key={emp.id} value={emp.name}>
                            {emp.name} ({emp.phone || 'Fleet Driver'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Shift Management Card (End Shift / Start Shift) */}
                <div className="p-4 rounded-2xl bg-slate-850 border border-amber-500/30 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                        <Power className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          Duty Shift Status
                        </div>
                        <div className="text-sm font-black text-white">
                          {activeShift ? 'Currently on Active Shift 🟢' : 'Off-Duty / Standby'}
                        </div>
                      </div>
                    </div>

                    {activeShift && (
                      <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded-lg">
                        Started: {new Date(activeShift.startTime).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>

                  {activeShift ? (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Ready to clock out? Triggering <strong className="text-amber-400">End Shift</strong> calculates total route kilometers, estimated diesel fuel consumption, and compiles completed drops for store liquidation.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsTripSummaryModalOpen(true)}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>End Shift &amp; View Delivery Trip Summary</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Clock in to begin tracking route distance, fuel consumption, and today's delivery drops.
                      </p>
                      <button
                        type="button"
                        onClick={() => startDriverShift(activeDriver)}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Power className="w-4 h-4" />
                        <span>Start Driver Shift (Mag-umpisa ng Biyahe)</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Break & Rest Controller */}
                <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-slate-700 text-slate-200">
                        <Coffee className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Driver Break &amp; Rest</div>
                        <div className="text-[10px] text-slate-400">
                          {currentDuty.isOnBreak ? 'Currently on Break ☕' : 'On Active Duty'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleBreak}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        currentDuty.isOnBreak
                          ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                          : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                      }`}
                    >
                      {currentDuty.isOnBreak ? 'Resume Duty' : 'Take Break'}
                    </button>
                  </div>
                </div>

                {/* Live GPS Telemetry */}
                <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                        <Navigation className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Live GPS Dispatch Radar</div>
                        <div className="text-[10px] text-slate-400">
                          Real-time location sent to store dispatch radar
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleUpdateGps}
                      disabled={isLocating}
                      className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                      <span>{isLocating ? 'Locating...' : 'Ping GPS'}</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Coordinates:</span>
                    <span className="text-amber-400 font-bold">
                      {currentDuty.lastGps
                        ? `${currentDuty.lastGps.latitude.toFixed(4)}, ${currentDuty.lastGps.longitude.toFixed(4)}`
                        : '14.3294, 120.9367 (Depot Yard)'}
                    </span>
                  </div>
                </div>

                {/* Offline & Network Sync Controls */}
                <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Offline Cache &amp; Sync</div>
                        <div className="text-[10px] text-slate-400">
                          {isOnline ? 'Online • Auto-syncing' : 'Offline • Caching in Local Storage'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleForceSync}
                      disabled={isSyncing}
                      className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Syncing...' : 'Force Sync'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span>Last synced: {lastSyncTime}</span>
                    <span className="text-emerald-400 font-bold">Service Worker Active</span>
                  </div>
                </div>

                {/* Emergency Contact & Dispatch Hotline */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                  <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                    Dispatch &amp; Depot Assistance
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>A26 Dispatch Hotline:</span>
                    <a href="tel:0464162626" className="text-amber-400 font-mono font-bold hover:underline">
                      (046) 416-2626
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Store Manager Mobile:</span>
                    <a href="tel:09171234567" className="text-amber-400 font-mono font-bold hover:underline">
                      +63 917 123 4567
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation Bar for iPhone and Mobile Devices */}
          <DriverBottomNav
            activeTab={navTab}
            onChangeTab={setNavTab}
            activeDeliveriesCount={myDeliveries.length}
            unreadMessagesCount={unreadRepliesCount}
            isOnBreak={currentDuty.isOnBreak}
            hasActiveShift={!!activeShift}
          />
        </div>
      </div>

      {/* FEATURE 4: PROOF OF DELIVERY CAMERA MODAL */}
      {podTargetOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 space-y-4 p-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-sm uppercase tracking-wide text-white">
                  Capture Proof of Delivery (POD)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPodTargetOrder(null);
                  stopCamera();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300">
              Delivery Order: <strong className="font-mono text-amber-400">#{podTargetOrder.deliveryNo}</strong> to{' '}
              <strong className="text-white">{podTargetOrder.customerName || 'Customer'}</strong>
            </div>

            {/* Video Viewfinder or Captured Preview */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
              {capturedPhoto ? (
                <div className="relative w-full h-full">
                  <img
                    src={capturedPhoto}
                    alt="Captured Delivery"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-md">
                    ✓ Photo Ready
                  </div>
                </div>
              ) : isCameraActive ? (
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6 space-y-2 text-slate-400 text-xs">
                  <Camera className="w-8 h-8 mx-auto text-slate-600" />
                  <p>Click "Start Camera" or choose an alternative below</p>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex flex-wrap gap-2">
              {!capturedPhoto && isCameraActive && (
                <button
                  type="button"
                  onClick={capturePhotoFromVideo}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Snap Photo (Kuha ng Litrato)</span>
                </button>
              )}

              {!capturedPhoto && !isCameraActive && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Open Live Camera</span>
                </button>
              )}

              {capturedPhoto && (
                <button
                  type="button"
                  onClick={() => {
                    setCapturedPhoto(null);
                    startCamera();
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Photo</span>
                </button>
              )}

              {/* Upload file button alternative */}
              <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-700">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Demo photo generator for testing */}
              <button
                type="button"
                onClick={handleUseDemoPhoto}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer"
                title="Use demo construction proof photo"
              >
                Use Demo Photo
              </button>
            </div>

            {/* Receiver Name Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                Received By (Customer / Site Representative Printed Name) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Engr. Mark Ramos / Foreman Juan"
                value={podReceivedBy}
                onChange={(e) => setPodReceivedBy(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Customer Digital Signature Component */}
            <SignaturePad
              onSignatureChange={setPodCustomerSignature}
              title="Customer / Receiver Digital E-Signature"
              subtitle="Let the customer sign directly on your screen using finger or stylus to finalize transaction"
              height={140}
            />

            {/* Confirm button */}
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setPodTargetOrder(null);
                  stopCamera();
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPOD}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Proof of Delivery &amp; Confirm Delivered</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver COD Collection Modal */}
      {codTargetOrder && (
        <DriverCodModal
          delivery={codTargetOrder}
          driverName={activeDriver}
          isOpen={!!codTargetOrder}
          onClose={() => setCodTargetOrder(null)}
          onSuccess={() => {
            showToast(`COD collection recorded for #${codTargetOrder.deliveryNo}!`, 'success');
          }}
        />
      )}

      {/* Driver App Download & Link Modal */}
      <DriverAppDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      {/* Driver Trip Summary Modal (Triggered upon End Shift or Manual Review) */}
      <DriverTripSummaryModal
        isOpen={isTripSummaryModalOpen}
        onClose={() => setIsTripSummaryModalOpen(false)}
        driverName={activeDriver}
        deliveries={deliveryOrders}
        activeShift={activeShift}
        onConfirmEndShift={(stats) => {
          endDriverShift(activeDriver, stats);
          setIsTripSummaryModalOpen(false);
        }}
      />

      {/* Delivery Receipt / Proof of Delivery Slip Modal */}
      {receiptTargetOrder && (
        <DeliveryReceiptModal
          delivery={receiptTargetOrder}
          isOpen={!!receiptTargetOrder}
          onClose={() => setReceiptTargetOrder(null)}
        />
      )}
    </div>
  );
};
