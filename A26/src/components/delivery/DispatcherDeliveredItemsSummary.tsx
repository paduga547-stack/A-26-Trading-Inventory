import React, { useState, useMemo } from 'react';
import { DeliveryOrder, Employee } from '../../types';
import {
  Package,
  Truck,
  Calendar,
  Search,
  Filter,
  Printer,
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  Building2,
  CheckCircle2,
  Clock,
  MapPin,
  FileSpreadsheet,
  Users,
  RotateCcw,
} from 'lucide-react';

interface DispatcherDeliveredItemsSummaryProps {
  deliveryOrders: DeliveryOrder[];
  employees: Employee[];
  businessName?: string;
}

export const DispatcherDeliveredItemsSummary: React.FC<DispatcherDeliveredItemsSummaryProps> = ({
  deliveryOrders,
  employees,
  businessName = 'A-TWENTY SIX TRADING',
}) => {
  const driverEmployees = employees.filter((e) => e.position === 'Driver' && e.status === 'ACTIVE');

  // Filter state
  const [selectedDriver, setSelectedDriver] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('DELIVERED'); // 'DELIVERED', 'ALL', 'OUT_FOR_DELIVERY'
  const [datePreset, setDatePreset] = useState<'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL_TIME' | 'CUSTOM'>('THIS_MONTH');
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10);

  const [customStart, setCustomStart] = useState<string>(startOfMonth);
  const [customEnd, setCustomEnd] = useState<string>(endOfMonth);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'BY_ITEM' | 'BY_DRIVER'>('BY_ITEM');

  // Filter delivery orders based on driver, status, and date range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    let minDateStr = '';
    let maxDateStr = '';

    if (datePreset === 'TODAY') {
      minDateStr = todayStr;
      maxDateStr = todayStr;
    } else if (datePreset === 'THIS_WEEK') {
      const dayOfWeek = now.getDay() || 7; // Sunday = 7
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek + 1);
      minDateStr = monday.toISOString().slice(0, 10);
      maxDateStr = todayStr;
    } else if (datePreset === 'THIS_MONTH') {
      minDateStr = startOfMonth;
      maxDateStr = endOfMonth;
    } else if (datePreset === 'CUSTOM') {
      minDateStr = customStart;
      maxDateStr = customEnd;
    }

    return deliveryOrders.filter((order) => {
      // Driver filter
      if (selectedDriver !== 'ALL' && order.driver.toLowerCase() !== selectedDriver.toLowerCase()) {
        return false;
      }

      // Status filter
      if (selectedStatus === 'DELIVERED' && order.status !== 'DELIVERED') {
        return false;
      }
      if (selectedStatus === 'OUT_FOR_DELIVERY' && order.status !== 'OUT_FOR_DELIVERY') {
        return false;
      }
      if (selectedStatus === 'ACTIVE' && order.status !== 'DELIVERED' && order.status !== 'OUT_FOR_DELIVERY') {
        return false;
      }

      // Date filter
      if (minDateStr || maxDateStr) {
        const orderDate = (order.deliveredAt || order.createdAt || '').slice(0, 10);
        if (minDateStr && orderDate < minDateStr) return false;
        if (maxDateStr && orderDate > maxDateStr) return false;
      }

      return true;
    });
  }, [deliveryOrders, selectedDriver, selectedStatus, datePreset, todayStr, startOfMonth, endOfMonth, customStart, customEnd]);

  // Aggregate items across filtered orders
  const itemSummaryList = useMemo(() => {
    // Map product identifier -> item aggregated info
    const map = new Map<
      string,
      {
        productName: string;
        unit: string;
        totalQty: number;
        drCount: number;
        drNumbers: Set<string>;
        customers: Set<string>;
        driverBreakdown: { [driverName: string]: { qty: number; tripCount: number } };
        lastDeliveredAt?: string;
      }
    >();

    filteredOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = `${item.productName.trim().toLowerCase()}:::${(item.unit || 'PCS').toUpperCase()}`;
        if (!map.has(key)) {
          map.set(key, {
            productName: item.productName,
            unit: (item.unit || 'PCS').toUpperCase(),
            totalQty: 0,
            drCount: 0,
            drNumbers: new Set(),
            customers: new Set(),
            driverBreakdown: {},
            lastDeliveredAt: order.deliveredAt || order.createdAt,
          });
        }

        const entry = map.get(key)!;
        entry.totalQty += item.qty;
        entry.drNumbers.add(order.deliveryNo);
        if (order.customerName) entry.customers.add(order.customerName);

        // Track per driver
        const dName = order.driver || 'Unassigned Driver';
        if (!entry.driverBreakdown[dName]) {
          entry.driverBreakdown[dName] = { qty: 0, tripCount: 0 };
        }
        entry.driverBreakdown[dName].qty += item.qty;
        entry.driverBreakdown[dName].tripCount += 1;

        if (order.deliveredAt && (!entry.lastDeliveredAt || order.deliveredAt > entry.lastDeliveredAt)) {
          entry.lastDeliveredAt = order.deliveredAt;
        }
      });
    });

    let result = Array.from(map.values()).map((entry) => ({
      ...entry,
      drCount: entry.drNumbers.size,
    }));

    // Apply search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (it) =>
          it.productName.toLowerCase().includes(q) ||
          it.unit.toLowerCase().includes(q) ||
          Array.from(it.customers).some((c) => c.toLowerCase().includes(q))
      );
    }

    // Sort by highest quantity delivered descending
    return result.sort((a, b) => b.totalQty - a.totalQty);
  }, [filteredOrders, searchQuery]);

  // Aggregate by Driver
  const driverSummaryList = useMemo(() => {
    const map = new Map<
      string,
      {
        driverName: string;
        totalQtyHauled: number;
        totalOrders: number;
        completedOrders: number;
        codCollected: number;
        itemsDelivered: { [productName: string]: { qty: number; unit: string } };
      }
    >();

    filteredOrders.forEach((order) => {
      const dName = order.driver || 'Unknown Driver';
      if (!map.has(dName)) {
        map.set(dName, {
          driverName: dName,
          totalQtyHauled: 0,
          totalOrders: 0,
          completedOrders: 0,
          codCollected: 0,
          itemsDelivered: {},
        });
      }

      const dEntry = map.get(dName)!;
      dEntry.totalOrders += 1;
      if (order.status === 'DELIVERED') dEntry.completedOrders += 1;
      dEntry.codCollected += order.codCollectedAmount || 0;

      (order.items || []).forEach((item) => {
        dEntry.totalQtyHauled += item.qty;
        if (!dEntry.itemsDelivered[item.productName]) {
          dEntry.itemsDelivered[item.productName] = { qty: 0, unit: item.unit || 'PCS' };
        }
        dEntry.itemsDelivered[item.productName].qty += item.qty;
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalQtyHauled - a.totalQtyHauled);
  }, [filteredOrders]);

  // Overall Dispatcher High-Level Metrics
  const totalUnitsDelivered = useMemo(() => {
    return itemSummaryList.reduce((sum, it) => sum + it.totalQty, 0);
  }, [itemSummaryList]);

  const topProduct = itemSummaryList[0];
  const topDriver = driverSummaryList[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header & Title */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-amber-950 border border-slate-700 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Package className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                Dispatcher Item Hauling &amp; Delivery Summary
              </h2>
              <div className="text-[11px] text-amber-400 font-semibold">
                Buod ng Lahat ng Materyales at Items na Naihatid ng Driver
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-300">
            Real-time dispatcher inventory reconciliation: View aggregated construction materials hauled by drivers, drop frequencies, and site destinations.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-600 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS TOOLBAR */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3 text-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Driver Selector */}
          <div className="flex items-center gap-2 min-w-[220px]">
            <Truck className="w-4 h-4 text-slate-400" />
            <select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ALL">All Company Drivers (Lahat ng Driver)</option>
              {driverEmployees.map((emp) => (
                <option key={emp.id} value={emp.name}>
                  Driver: {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Delivery Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="DELIVERED">Delivered Only (Na-unload sa Site)</option>
              <option value="ACTIVE">Delivered + In Transit</option>
              <option value="ALL">All Delivery Statuses</option>
            </select>
          </div>

          {/* Date Range Preset Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            {(
              [
                { id: 'TODAY', label: 'Today' },
                { id: 'THIS_WEEK', label: 'This Week' },
                { id: 'THIS_MONTH', label: 'This Month' },
                { id: 'ALL_TIME', label: 'All Time' },
                { id: 'CUSTOM', label: 'Custom Range' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setDatePreset(p.id)}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  datePreset === p.id
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Inputs if active */}
        {datePreset === 'CUSTOM' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Start Date:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">End Date:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-xs"
              />
            </div>
          </div>
        )}

        {/* Search & View Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product / material (e.g. Portland Cement, Steel Bar, Sand)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('BY_ITEM')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'BY_ITEM'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Summary by Material Item ({itemSummaryList.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('BY_DRIVER')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'BY_DRIVER'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Summary by Driver ({driverSummaryList.length})
            </button>
          </div>
        </div>
      </div>

      {/* DISPATCHER SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Quantity */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <Package className="w-3.5 h-3.5 text-amber-500" />
            <span>Total Units Hauled</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {totalUnitsDelivered.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[10px] text-slate-400">
            Across {filteredOrders.length} delivery trips
          </div>
        </div>

        {/* Distinct Products */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-sky-500" />
            <span>Product Types</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-600 font-mono">
            {itemSummaryList.length}
          </div>
          <div className="text-[10px] text-slate-400">
            Distinct construction lines
          </div>
        </div>

        {/* Top Product Hauled */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-emerald-500" />
            <span>Top Material Volume</span>
          </div>
          <div className="text-sm font-black text-slate-900 truncate" title={topProduct?.productName || 'None'}>
            {topProduct ? topProduct.productName : 'No items yet'}
          </div>
          <div className="text-[10px] font-bold text-emerald-600 font-mono">
            {topProduct ? `${topProduct.totalQty.toLocaleString()} ${topProduct.unit}` : '-'}
          </div>
        </div>

        {/* Top Driver Hauled */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
            <span>Lead Hauling Driver</span>
          </div>
          <div className="text-sm font-black text-slate-900 truncate">
            {topDriver ? topDriver.driverName : 'No driver data'}
          </div>
          <div className="text-[10px] font-bold text-amber-600 font-mono">
            {topDriver ? `${topDriver.totalQtyHauled.toLocaleString()} units hauled` : '-'}
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: AGGREGATED ITEMS TABLE */}
      {viewMode === 'BY_ITEM' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-600" />
              <h3 className="font-bold text-sm text-slate-800">
                Aggregated Materials &amp; Items Delivered ({itemSummaryList.length} items)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Filtered for: {selectedDriver === 'ALL' ? 'All Drivers' : selectedDriver}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Material / Product Description</th>
                  <th className="px-4 py-3 text-center">Unit</th>
                  <th className="px-4 py-3 text-right">Total Qty Delivered</th>
                  <th className="px-4 py-3">Delivered By (Driver Breakdown)</th>
                  <th className="px-4 py-3 text-center">DR Trips</th>
                  <th className="px-4 py-3">Customer Sites Served</th>
                  <th className="px-4 py-3 text-right">Last Hauled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {itemSummaryList.map((item, idx) => (
                  <tr key={`${item.productName}-${item.unit}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {item.productName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Item Code #{String(idx + 1).padStart(3, '0')}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                        {item.unit}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="font-black text-amber-600 font-mono text-sm sm:text-base">
                        {item.totalQty.toLocaleString()}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-1 max-w-xs">
                        {Object.entries(item.driverBreakdown).map(([driverName, stats]) => (
                          <div
                            key={driverName}
                            className="flex items-center justify-between text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-100"
                          >
                            <span className="font-semibold text-slate-800 truncate">{driverName}</span>
                            <span className="font-mono font-bold text-slate-600">
                              {stats.qty.toLocaleString()} {item.unit} ({stats.tripCount}x)
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 font-mono">
                        {item.drCount} DRs
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={Array.from(item.customers).join(', ')}>
                      {Array.from(item.customers).slice(0, 2).join(', ')}
                      {item.customers.size > 2 && (
                        <span className="text-[10px] text-slate-400 ml-1">
                          +{item.customers.size - 2} more
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right text-slate-500 font-mono text-[11px]">
                      {item.lastDeliveredAt
                        ? new Date(item.lastDeliveredAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
                        : '-'}
                    </td>
                  </tr>
                ))}

                {itemSummaryList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-600">No delivered materials match the selected filters</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try changing the driver, date preset, or search term above.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: DRIVER-BY-DRIVER BREAKDOWN CARDS */}
      {viewMode === 'BY_DRIVER' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {driverSummaryList.map((driver) => (
            <div
              key={driver.driverName}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 hover:border-amber-400 transition-colors"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shadow-xs">
                    {driver.driverName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">{driver.driverName}</h3>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Company Driver • {driver.completedOrders} of {driver.totalOrders} drops delivered
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-amber-600 font-mono">
                    {driver.totalQtyHauled.toLocaleString()}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Units Hauled</div>
                </div>
              </div>

              {/* Items hauled list */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Materials &amp; Items Hauled Breakdown:
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {Object.entries(driver.itemsDelivered).map(([prodName, info]) => (
                    <div
                      key={prodName}
                      className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="font-semibold text-slate-800 truncate pr-2" title={prodName}>
                        {prodName}
                      </div>
                      <div className="font-mono font-bold text-slate-900 shrink-0">
                        {info.qty.toLocaleString()}{' '}
                        <span className="text-[10px] font-bold text-slate-500">{info.unit}</span>
                      </div>
                    </div>
                  ))}

                  {Object.keys(driver.itemsDelivered).length === 0 && (
                    <div className="py-4 text-center text-slate-400 text-xs">
                      No items recorded for this driver yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>COD Collections Handled:</span>
                <span className="font-mono font-black text-emerald-600">
                  ₱{driver.codCollected.toLocaleString()}
                </span>
              </div>
            </div>
          ))}

          {driverSummaryList.length === 0 && (
            <div className="col-span-2 py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              <Truck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-600">No driver records found for this period</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
