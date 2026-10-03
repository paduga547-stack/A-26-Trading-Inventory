import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DeliveryOrder, DeliveryStatus } from '../../types';
import { DeliveryReceiptModal } from './DeliveryReceiptModal';
import { DriverAppDownloadModal } from './DriverAppDownloadModal';
import { DispatcherDeliveredItemsSummary } from './DispatcherDeliveredItemsSummary';
import { DriverMonthlyLedgerView } from './DriverMonthlyLedgerView';
import { Modal } from '../common/Modal';
import {
  Truck,
  Plus,
  Search,
  CheckCircle,
  Printer,
  ChevronRight,
  User,
  Trash2,
  Coffee,
  MapPin,
  Camera,
  Smartphone,
  ExternalLink,
  MessageSquare,
  Send,
  CheckCheck,
  Download,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  BarChart3,
  Layers,
} from 'lucide-react';

export const DeliveryOrdersView: React.FC = () => {
  const {
    deliveryOrders,
    customers,
    projects,
    products,
    employees,
    settings,
    driverDutyStatuses,
    driverMessages,
    unreadDriverMessagesCount,
    sendDriverMessage,
    markDriverMessagesAsRead,
    setCurrentPage,
    createDeliveryOrder,
    updateDeliveryStatus,
    deleteDeliveryOrder,
    bulkDeleteDeliveryOrders,
    showToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedForReceipt, setSelectedForReceipt] = useState<DeliveryOrder | null>(null);
  const [previewPodDelivery, setPreviewPodDelivery] = useState<DeliveryOrder | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  // Chat panel state
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [selectedChatDriver, setSelectedChatDriver] = useState<string>('ALL');
  const [storeReplyText, setStoreReplyText] = useState('');
  const [replyTargetDriver, setReplyTargetDriver] = useState<string>('Pedro Santos');

  // New Delivery Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [customerId, setCustomerId] = useState(customers[0]?.id || 'MANUAL');
  const [manualCustomerName, setManualCustomerName] = useState(customers[0]?.name || '');
  const [projectId, setProjectId] = useState('');
  const [driver, setDriver] = useState(settings.defaultDriver);
  const [vehicle, setVehicle] = useState(settings.defaultVehicle);
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Selected items to deliver
  const [orderItems, setOrderItems] = useState<{ productId: string; qty: number }[]>([]);
  const [isCodOrder, setIsCodOrder] = useState(false);
  const [codAmountInput, setCodAmountInput] = useState<number>(0);

  // Driver options
  const driverEmployees = employees.filter((e) => e.position === 'Driver' && e.status === 'ACTIVE');
  const [mainTab, setMainTab] = useState<'ORDERS' | 'ITEMS_SUMMARY' | 'PRODUCTIVITY_CHART'>('ORDERS');
  const [inspectedDriver, setInspectedDriver] = useState<string>(
    driverEmployees[0]?.name || 'Pedro Santos'
  );

  // Customer projects
  const customerProjects = useMemo(() => {
    return projects.filter((p) => p.customerId === customerId);
  }, [projects, customerId]);

  const handleManualCustomerChange = (typedName: string) => {
    setManualCustomerName(typedName);
    const matched = customers.find(
      (c) => c.name.toLowerCase() === typedName.trim().toLowerCase()
    );
    if (matched) {
      setCustomerId(matched.id);
      if (!address || address === 'Cavite / Metro Manila') setAddress(matched.address);
      if (!contactPhone) setContactPhone(matched.phone);
    } else {
      setCustomerId('MANUAL');
    }
  };

  const handleProjectChange = (projId: string) => {
    setProjectId(projId);
    const p = projects.find((x) => x.id === projId);
    if (p) {
      setAddress(p.address);
      setContactPhone(`${p.contactPerson} (${p.contactNumber})`);
    }
  };

  const addItemLine = () => {
    if (products.length > 0) {
      setOrderItems((prev) => [...prev, { productId: products[0].id, qty: 10 }]);
    }
  };

  const updateItemLine = (index: number, productId: string, qty: number) => {
    setOrderItems((prev) =>
      prev.map((item, idx) => (idx === index ? { productId, qty } : item))
    );
  };

  const removeItemLine = (index: number) => {
    setOrderItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      showToast('Delivery address is required', 'error');
      return;
    }
    if (orderItems.length === 0) {
      showToast('Add at least one material item to deliver', 'error');
      return;
    }

    createDeliveryOrder({
      customerId: customerId || 'MANUAL',
      customerName: manualCustomerName.trim() || 'Manual Customer',
      projectId: projectId || null,
      items: orderItems,
      driver,
      vehicle,
      address,
      contactPhone: contactPhone || '0900-000-0000',
      notes,
      isCod: isCodOrder,
      codAmount: isCodOrder ? codAmountInput : 0,
    });

    setIsAddOpen(false);
    setOrderItems([]);
    setNotes('');
    setIsCodOrder(false);
    setCodAmountInput(0);
  };

  const filteredDeliveries = useMemo(() => {
    return deliveryOrders.filter((d) => {
      const cust = customers.find((c) => c.id === d.customerId);
      const matchSearch =
        !searchTerm.trim() ||
        d.deliveryNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cust && cust.name.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchStatus = true;
      if (statusFilter === 'COD_PENDING') {
        matchStatus = !!d.isCod && d.codStatus === 'PENDING';
      } else if (statusFilter === 'COD_COLLECTED') {
        matchStatus = !!d.isCod && d.codStatus === 'COLLECTED';
      } else if (statusFilter !== 'ALL') {
        matchStatus = d.status === statusFilter;
      }

      return matchSearch && matchStatus;
    });
  }, [deliveryOrders, customers, searchTerm, statusFilter]);

  const advanceStatus = (delivery: DeliveryOrder) => {
    if (delivery.status === 'PENDING') {
      updateDeliveryStatus(delivery.id, 'PREPARING');
    } else if (delivery.status === 'PREPARING') {
      updateDeliveryStatus(delivery.id, 'OUT_FOR_DELIVERY');
    } else if (delivery.status === 'OUT_FOR_DELIVERY') {
      updateDeliveryStatus(delivery.id, 'DELIVERED');
    }
  };

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">PENDING</span>;
      case 'PREPARING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">PREPARING</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">IN TRANSIT</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">DELIVERED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">CANCELLED</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Fleet Break Status & Live GPS Tracker for Store Staff */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-4 rounded-2xl border border-slate-700 shadow-md text-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Truck className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-400">
              Driver Fleet Live Status &amp; Break Tracker
            </h3>
          </div>
          <p className="text-xs text-slate-300">
            Store monitor: Real-time driver break status, live GPS tracking pins, and verified proof-of-delivery receipts.
          </p>
        </div>

        {/* Drivers status badges */}
        <div className="flex flex-wrap items-center gap-2">
          {driverDutyStatuses.map((duty) => (
            <div
              key={duty.driverName}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                duty.isOnBreak
                  ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                  : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${duty.isOnBreak ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
                <span className="font-bold">{duty.driverName}</span>
              </div>
              <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${duty.isOnBreak ? 'bg-rose-900 text-rose-100' : 'bg-emerald-900 text-emerald-100'}`}>
                {duty.isOnBreak ? '☕ On Break' : '🟢 On Duty'}
              </span>
              {duty.lastGps && (
                <a
                  href={`https://www.google.com/maps?q=${duty.lastGps.latitude},${duty.lastGps.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  title="View Driver GPS on Google Maps"
                  className="text-amber-400 hover:text-amber-300"
                >
                  <MapPin className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() => setIsDownloadModalOpen(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-600 flex items-center gap-1.5 cursor-pointer ml-auto md:ml-0"
            title="Download driver app or get direct link & QR code"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Download Driver App</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentPage('driver-app')}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>Open Driver Mobile App</span>
          </button>
        </div>
      </div>

      {/* DISPATCHER PORTAL NAVIGATION TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setMainTab('ORDERS')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              mainTab === 'ORDERS'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Dispatch Orders ({deliveryOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('ITEMS_SUMMARY')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              mainTab === 'ITEMS_SUMMARY'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Delivered Items Summary (Buod ng Items)</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('PRODUCTIVITY_CHART')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              mainTab === 'PRODUCTIVITY_CHART'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Driver Peak Productivity &amp; Charts</span>
          </button>
        </div>

        {mainTab === 'PRODUCTIVITY_CHART' && (
          <div className="flex items-center gap-2 pr-2">
            <span className="text-xs font-bold text-slate-500">Select Driver:</span>
            <select
              value={inspectedDriver}
              onChange={(e) => setInspectedDriver(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              {driverEmployees.map((emp) => (
                <option key={emp.id} value={emp.name}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 2: DISPATCHER ITEMS DELIVERED SUMMARY */}
      {mainTab === 'ITEMS_SUMMARY' && (
        <DispatcherDeliveredItemsSummary
          deliveryOrders={deliveryOrders}
          employees={employees}
          businessName={settings.businessName}
        />
      )}

      {/* TAB 3: DRIVER MONTHLY PRODUCTIVITY & RECHARTS PEAK DAYS */}
      {mainTab === 'PRODUCTIVITY_CHART' && (
        <DriverMonthlyLedgerView
          driverName={inspectedDriver}
          allDeliveries={deliveryOrders}
          onOpenReceipt={(del) => setSelectedForReceipt(del)}
        />
      )}

      {/* TAB 1: MAIN DISPATCH ORDERS & FLEET UPDATES */}
      {mainTab === 'ORDERS' && (
        <>
          {/* REAL-TIME DRIVER MESSAGES & LIVE DISPATCH UPDATES PANEL */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <MessageSquare className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  Driver Fleet Live Updates &amp; Messaging
                </h3>
                {unreadDriverMessagesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950 animate-pulse">
                    {unreadDriverMessagesCount} New Updates
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Direct two-way messaging between store dispatchers and truck drivers on the road.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {unreadDriverMessagesCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  markDriverMessagesAsRead(undefined, 'STORE');
                  showToast('All driver messages marked as read', 'info');
                }}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark All Read</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsChatExpanded(!isChatExpanded)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title={isChatExpanded ? 'Collapse Chat' : 'Expand Chat'}
            >
              {isChatExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isChatExpanded && (
          <div className="p-4 space-y-4">
            {/* Filter drivers tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedChatDriver('ALL')}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    selectedChatDriver === 'ALL'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Drivers ({driverMessages.length})
                </button>
                {driverDutyStatuses.map((d) => {
                  const count = driverMessages.filter((m) => m.driverName.toLowerCase() === d.driverName.toLowerCase()).length;
                  return (
                    <button
                      key={d.driverName}
                      type="button"
                      onClick={() => {
                        setSelectedChatDriver(d.driverName);
                        setReplyTargetDriver(d.driverName);
                      }}
                      className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                        selectedChatDriver === d.driverName
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d.driverName} ({count})
                    </button>
                  );
                })}
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                Updates sync automatically with driver mobile app
              </span>
            </div>

            {/* Messages feed */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {driverMessages
                .filter((m) => selectedChatDriver === 'ALL' || m.driverName.toLowerCase() === selectedChatDriver.toLowerCase())
                .map((msg) => {
                  const isDriver = msg.sender === 'DRIVER';
                  return (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl border transition-all text-xs ${
                        isDriver
                          ? 'bg-slate-50/90 border-slate-200'
                          : 'bg-amber-50/70 border-amber-200 ml-6'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {isDriver ? `🚚 Driver: ${msg.driverName}` : '🏪 Store Dispatcher'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              msg.category === 'TRAFFIC'
                                ? 'bg-amber-100 text-amber-800'
                                : msg.category === 'EN_ROUTE'
                                ? 'bg-sky-100 text-sky-800'
                                : msg.category === 'ARRIVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : msg.category === 'ISSUE'
                                ? 'bg-rose-100 text-rose-800'
                                : msg.category === 'WAITING'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {msg.category.replace('_', ' ')}
                          </span>
                          {msg.deliveryNo && (
                            <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              #{msg.deliveryNo}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>{new Date(msg.createdAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</span>
                          {isDriver && !msg.isReadByStore && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                          )}
                        </div>
                      </div>

                      <p className="text-slate-800 font-medium leading-relaxed pl-1">{msg.text}</p>
                    </div>
                  );
                })}

              {driverMessages.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No driver updates logged yet. Drivers can send updates from their phone app.
                </div>
              )}
            </div>

            {/* Quick Dispatch Reply Form */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="font-bold text-slate-600 text-[10px] uppercase">Quick Dispatch Reply:</span>
                {[
                  'Copy, mag-ingat sa biyahe!',
                  'Noted, tatawagan namin ang customer para mag-receive.',
                  'Ok, copy pa-picture ng POD pagka-unload.',
                  'Proceed with unloading and get signature.',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      sendDriverMessage({
                        driverName: replyTargetDriver,
                        text: preset,
                        category: 'GENERAL',
                        sender: 'STORE_ADMIN',
                      });
                    }}
                    className="px-2 py-1 rounded-md bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 font-medium transition-colors text-[10px] cursor-pointer"
                  >
                    "{preset}"
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!storeReplyText.trim()) return;
                  sendDriverMessage({
                    driverName: replyTargetDriver,
                    text: storeReplyText.trim(),
                    category: 'GENERAL',
                    sender: 'STORE_ADMIN',
                  });
                  setStoreReplyText('');
                }}
                className="flex items-center gap-2"
              >
                <select
                  value={replyTargetDriver}
                  onChange={(e) => setReplyTargetDriver(e.target.value)}
                  className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden"
                >
                  {driverDutyStatuses.map((d) => (
                    <option key={d.driverName} value={d.driverName}>
                      Reply to: {d.driverName}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={storeReplyText}
                  onChange={(e) => setStoreReplyText(e.target.value)}
                  placeholder={`Send instructions or reply to ${replyTargetDriver}...`}
                  className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />

                <button
                  type="submit"
                  disabled={!storeReplyText.trim()}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Top Filter and Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search delivery by DR number, driver, project site, address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={() => {
                bulkDeleteDeliveryOrders(Array.from(selectedIds));
                setSelectedIds(new Set());
              }}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Delete ({selectedIds.size})</span>
            </button>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700"
          >
            <option value="ALL">All Delivery Statuses</option>
            <option value="PENDING">Pending Warehouse Staging</option>
            <option value="PREPARING">Preparing & Loading</option>
            <option value="OUT_FOR_DELIVERY">In Transit (Out for Delivery)</option>
            <option value="DELIVERED">Delivered to Site</option>
            <option value="COD_PENDING">Pending COD Collection (₱)</option>
            <option value="COD_COLLECTED">COD Paid / Collected (✓)</option>
          </select>

          <button
            onClick={() => {
              setIsAddOpen(true);
              if (orderItems.length === 0) addItemLine();
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Dispatch Order</span>
          </button>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={filteredDeliveries.length > 0 && selectedIds.size === filteredDeliveries.length}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(new Set(filteredDeliveries.map((d) => d.id)));
                      else setSelectedIds(new Set());
                    }}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                </th>
                <th className="px-5 py-3">DR Number</th>
                <th className="px-4 py-3">Dispatch Date</th>
                <th className="px-4 py-3">Customer / Contractor</th>
                <th className="px-4 py-3">Project Site</th>
                <th className="px-4 py-3">Assigned Logistics</th>
                <th className="px-4 py-3 text-center">Items</th>
                <th className="px-4 py-3">Site Destination</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDeliveries.map((del) => {
                const cust = customers.find((c) => c.id === del.customerId);
                const proj = projects.find((p) => p.id === del.projectId);
                const itemCount = del.items.reduce((sum, i) => sum + i.qty, 0);

                const isSelected = selectedIds.has(del.id);

                return (
                  <tr key={del.id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const next = new Set(selectedIds);
                          if (e.target.checked) next.add(del.id);
                          else next.delete(del.id);
                          setSelectedIds(next);
                        }}
                        className="rounded text-amber-500 focus:ring-amber-500"
                      />
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-slate-900">{del.deliveryNo}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(del.createdAt).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="font-bold">{del.customerName || cust?.name || 'Customer'}</div>
                      {del.isCod && (
                        <div className="mt-1">
                          {del.codStatus === 'COLLECTED' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              ✓ COD Paid: ₱{(del.codCollectedAmount || 0).toLocaleString()}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300 animate-pulse">
                              ₱ COD: ₱{(del.codAmount || 0).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[130px]">{proj?.name || 'Direct Site'}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{del.driver}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{del.vehicle}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                      {itemCount}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={del.address}>
                      <div>{del.address}</div>
                      {del.gpsLocation && (
                        <a
                          href={`https://www.google.com/maps?q=${del.gpsLocation.latitude},${del.gpsLocation.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-sky-700 font-bold bg-sky-50 hover:bg-sky-100 px-1.5 py-0.5 rounded mt-0.5 border border-sky-200"
                        >
                          <MapPin className="w-3 h-3 text-sky-600" />
                          <span>GPS Pin ({del.gpsLocation.latitude.toFixed(3)}, {del.gpsLocation.longitude.toFixed(3)})</span>
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {getStatusBadge(del.status)}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Proof of Delivery photo if available */}
                        {del.proofOfDeliveryPhoto && (
                          <button
                            type="button"
                            onClick={() => setPreviewPodDelivery(del)}
                            title="View Camera Proof of Delivery (POD)"
                            className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs border border-emerald-300"
                          >
                            <Camera className="w-3.5 h-3.5 text-emerald-700" />
                            <span>POD Photo</span>
                          </button>
                        )}

                        {/* Printable DR */}
                        <button
                          onClick={() => setSelectedForReceipt(del)}
                          title="Print Delivery Receipt Note"
                          className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Status advancement button */}
                        {del.status !== 'DELIVERED' && del.status !== 'CANCELLED' && (
                          <button
                            onClick={() => advanceStatus(del)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white rounded text-[11px] font-bold transition-all flex items-center gap-1"
                          >
                            <span>
                              {del.status === 'PENDING' && 'Start Loading'}
                              {del.status === 'PREPARING' && 'Dispatch'}
                              {del.status === 'OUT_FOR_DELIVERY' && 'Confirm Delivered'}
                            </span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        {del.status === 'DELIVERED' && (
                          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Done
                          </span>
                        )}

                        <button
                          onClick={() => deleteDeliveryOrder(del.id)}
                          title="Delete Delivery Order"
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredDeliveries.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Truck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No matching delivery orders</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

      {/* Printable Dispatch Receipt Modal */}
      <DeliveryReceiptModal
        isOpen={!!selectedForReceipt}
        onClose={() => setSelectedForReceipt(null)}
        delivery={selectedForReceipt}
      />

      {/* Create Delivery Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Schedule New Delivery Dispatch"
        subtitle="Create hauling note, assign transport truck and driver"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateDelivery} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase text-slate-700">
                  Customer / Contractor (Manual Type) *
                </label>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  Manual Type Enabled
                </span>
              </div>
              <input
                type="text"
                required
                list="delivery-contractor-list"
                value={manualCustomerName}
                onChange={(e) => handleManualCustomerChange(e.target.value)}
                placeholder="Type customer or contractor name manually..."
                className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
              <datalist id="delivery-contractor-list">
                {customers.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
              <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px] text-slate-500">
                <span className="font-semibold text-slate-600">Quick pick:</span>
                {customers.slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleManualCustomerChange(c.name)}
                    className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-amber-100 hover:text-amber-800 text-slate-700 text-[10px] transition-colors cursor-pointer"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Project Site (Optional)
              </label>
              <select
                value={projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="">No Project (Direct Customer Address)</option>
                {customerProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Assigned Truck Driver *
              </label>
              <input
                type="text"
                required
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
                placeholder="e.g. Pedro Santos"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              {driverEmployees.length > 0 && (
                <div className="flex gap-1.5 mt-1 text-[10px] text-slate-500">
                  <span>Quick pick:</span>
                  {driverEmployees.map((de) => (
                    <button
                      type="button"
                      key={de.id}
                      onClick={() => setDriver(de.name)}
                      className="text-amber-600 hover:underline font-semibold"
                    >
                      {de.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Delivery Vehicle *
              </label>
              <input
                type="text"
                required
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="e.g. TRUCK-001 (6-Wheeler)"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Destination Address *
              </label>
              <input
                type="text"
                required
                placeholder="Job site street, barangay, city"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Site Contact Phone *
              </label>
              <input
                type="text"
                required
                placeholder="Foreman contact phone number"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Delivery Material Items Selection */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-slate-700">
                Materials to Dispatch
              </span>
              <button
                type="button"
                onClick={addItemLine}
                className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {orderItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={item.productId}
                    onChange={(e) => updateItemLine(idx, e.target.value, item.qty)}
                    className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white font-medium"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.unit}) — In Stock: {p.currentStock}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateItemLine(idx, item.productId, parseInt(e.target.value) || 1)}
                    className="w-20 px-2 py-1.5 text-xs font-mono font-bold text-center border border-slate-300 rounded-md bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeItemLine(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* COD (Cash On Delivery) Setting */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-amber-950">
              <input
                type="checkbox"
                checked={isCodOrder}
                onChange={(e) => setIsCodOrder(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Cash on Delivery (COD) Required Upon Turnover</span>
            </label>

            {isCodOrder && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-0.5">
                    COD Amount to Collect by Driver (₱) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required={isCodOrder}
                    value={codAmountInput}
                    onChange={(e) => setCodAmountInput(parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 5000"
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-amber-300 rounded-lg bg-white"
                  />
                </div>
                <div className="text-[11px] text-slate-600 flex items-center">
                  Driver will collect this amount from the customer on-site before marking delivery complete.
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Driver Dispatch Notes / Gate Pass
            </label>
            <input
              type="text"
              placeholder="e.g. Call 30 mins before arrival, enter via Gate 2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-lg shadow-xs"
            >
              Create Dispatch Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Proof of Delivery Photo Preview Modal for Store Staff */}
      <Modal
        isOpen={!!previewPodDelivery}
        onClose={() => setPreviewPodDelivery(null)}
        title={`Proof of Delivery — DR #${previewPodDelivery?.deliveryNo}`}
        subtitle={`Driver photo verification for ${previewPodDelivery?.customerName || 'Customer'}`}
        maxWidth="lg"
      >
        {previewPodDelivery && (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-96">
              {previewPodDelivery.proofOfDeliveryPhoto ? (
                <img
                  src={previewPodDelivery.proofOfDeliveryPhoto}
                  alt="Proof of Delivery Captured"
                  className="w-full h-auto max-h-96 object-contain"
                />
              ) : (
                <div className="p-8 text-slate-400 text-xs">No image available</div>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Received By:</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">
                  {previewPodDelivery.proofReceivedBy || 'Customer Representative'}
                </div>
                <div className="text-slate-500 mt-1">
                  Delivered at: {previewPodDelivery.deliveredAt ? new Date(previewPodDelivery.deliveredAt).toLocaleString('en-PH') : 'Verified'}
                </div>
                {previewPodDelivery.customerSignature && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Customer Digital E-Signature:
                    </span>
                    <div className="p-2 bg-white rounded-lg border border-slate-200 inline-block shadow-2xs">
                      <img
                        src={previewPodDelivery.customerSignature}
                        alt="Customer Signature"
                        className="h-12 w-auto max-w-[200px] object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Driver & Unit:</span>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {previewPodDelivery.driver} ({previewPodDelivery.vehicle})
                </div>
                {previewPodDelivery.gpsLocation && (
                  <div className="mt-1">
                    <a
                      href={`https://www.google.com/maps?q=${previewPodDelivery.gpsLocation.latitude},${previewPodDelivery.gpsLocation.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-600 font-bold inline-flex items-center gap-1 hover:underline"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>View GPS Site on Map</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewPodDelivery(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Driver App Download Modal */}
      <DriverAppDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
};
