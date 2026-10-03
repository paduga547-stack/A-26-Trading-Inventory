import React, { useState, useMemo } from 'react';
import { DeliveryOrder, DeliveryStatus } from '../../types';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Banknote,
  Fuel,
  FileText,
  Printer,
  X,
  ExternalLink,
  ShieldCheck,
  Eye,
  Sparkles,
  Award,
  TrendingUp,
  BarChart3,
  Flame,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

interface DriverMonthlyLedgerViewProps {
  driverName: string;
  allDeliveries: DeliveryOrder[];
  onOpenReceipt?: (delivery: DeliveryOrder) => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const DriverMonthlyLedgerView: React.FC<DriverMonthlyLedgerViewProps> = ({
  driverName,
  allDeliveries,
  onOpenReceipt,
}) => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth()); // 0-indexed
  const [dateFilterMode, setDateFilterMode] = useState<'MONTH' | 'CUSTOM'>('MONTH');
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10)
  );

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPodDelivery, setSelectedPodDelivery] = useState<DeliveryOrder | null>(null);
  const [chartType, setChartType] = useState<'BAR' | 'AREA'>('BAR');

  // Month navigation helpers
  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleCurrentMonth = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
    setDateFilterMode('MONTH');
  };

  // Filter deliveries for the selected driver and month/date range
  const filteredDeliveries = useMemo(() => {
    return allDeliveries.filter((d) => {
      // Must match driver
      if (d.driver.toLowerCase() !== driverName.toLowerCase()) return false;

      // Date check
      const delDateStr = d.createdAt || d.deliveredAt || new Date().toISOString();
      const delDate = new Date(delDateStr);

      if (dateFilterMode === 'MONTH') {
        if (delDate.getFullYear() !== selectedYear) return false;
        if (delDate.getMonth() !== selectedMonth) return false;
      } else {
        const itemYmd = delDateStr.slice(0, 10);
        if (customStartDate && itemYmd < customStartDate) return false;
        if (customEndDate && itemYmd > customEndDate) return false;
      }

      // Status check
      if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = d.deliveryNo.toLowerCase().includes(q);
        const matchCustomer = (d.customerName || '').toLowerCase().includes(q);
        const matchAddress = d.address.toLowerCase().includes(q);
        const matchItems = d.items?.some((i) => i.productName.toLowerCase().includes(q));
        if (!matchNo && !matchCustomer && !matchAddress && !matchItems) return false;
      }

      return true;
    });
  }, [
    allDeliveries,
    driverName,
    selectedYear,
    selectedMonth,
    dateFilterMode,
    customStartDate,
    customEndDate,
    statusFilter,
    searchQuery,
  ]);

  // Aggregate monthly statistics
  const stats = useMemo(() => {
    const totalCount = filteredDeliveries.length;
    const completedList = filteredDeliveries.filter((d) => d.status === 'DELIVERED');
    const completedCount = completedList.length;
    const inTransitCount = filteredDeliveries.filter((d) => d.status === 'OUT_FOR_DELIVERY' || d.status === 'ARRIVED').length;
    const pendingCount = filteredDeliveries.filter((d) => d.status === 'PENDING' || d.status === 'PREPARING').length;
    const cancelledCount = filteredDeliveries.filter((d) => d.status === 'CANCELLED').length;

    // Approximate distance: ~18 km average roundtrip per delivery drop in Cavite/Metro South
    const estimatedDistanceKm = Math.round(totalCount * 17.5 * 10) / 10;
    // Standard dropside delivery truck fuel economy ~8 km/L
    const estimatedFuelLiters = Math.round((estimatedDistanceKm / 8.0) * 10) / 10;
    const estimatedFuelCost = Math.round(estimatedFuelLiters * 60);

    const totalCodCollected = completedList.reduce(
      (sum, d) => sum + (d.codCollectedAmount || 0),
      0
    );

    const totalInvoiceValue = filteredDeliveries.reduce(
      (sum, d) => sum + (d.codAmount || d.codCollectedAmount || 0),
      0
    );

    const successRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      totalCount,
      completedCount,
      inTransitCount,
      pendingCount,
      cancelledCount,
      estimatedDistanceKm,
      estimatedFuelLiters,
      estimatedFuelCost,
      totalCodCollected,
      totalInvoiceValue,
      successRate,
    };
  }, [filteredDeliveries]);

  // Daily delivery productivity chart data across the month
  const dailyChartData = useMemo(() => {
    const map = new Map<
      string,
      {
        dateStr: string;
        dayNum: number;
        dayLabel: string;
        dayOfWeek: string;
        fullDateText: string;
        deliveriesCount: number;
        completedCount: number;
        itemsCount: number;
        codCollected: number;
      }
    >();

    if (dateFilterMode === 'MONTH') {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const ymd = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dObj = new Date(selectedYear, selectedMonth, day);
        const dayOfWeek = dObj.toLocaleDateString('en-US', { weekday: 'short' });
        map.set(ymd, {
          dateStr: ymd,
          dayNum: day,
          dayLabel: `Day ${day}`,
          dayOfWeek,
          fullDateText: `${MONTH_NAMES[selectedMonth].slice(0, 3)} ${day}, ${selectedYear} (${dayOfWeek})`,
          deliveriesCount: 0,
          completedCount: 0,
          itemsCount: 0,
          codCollected: 0,
        });
      }
    } else {
      const start = new Date(customStartDate || today.toISOString().slice(0, 10));
      const end = new Date(customEndDate || today.toISOString().slice(0, 10));
      const diffDays = Math.min(
        60,
        Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1)
      );
      for (let i = 0; i < diffDays; i++) {
        const curr = new Date(start);
        curr.setDate(start.getDate() + i);
        const ymd = curr.toISOString().slice(0, 10);
        const dayOfWeek = curr.toLocaleDateString('en-US', { weekday: 'short' });
        map.set(ymd, {
          dateStr: ymd,
          dayNum: curr.getDate(),
          dayLabel: `${curr.getMonth() + 1}/${curr.getDate()}`,
          dayOfWeek,
          fullDateText: `${curr.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} (${dayOfWeek})`,
          deliveriesCount: 0,
          completedCount: 0,
          itemsCount: 0,
          codCollected: 0,
        });
      }
    }

    filteredDeliveries.forEach((d) => {
      const delDateStr = (d.deliveredAt || d.createdAt || '').slice(0, 10);
      if (map.has(delDateStr)) {
        const entry = map.get(delDateStr)!;
        entry.deliveriesCount += 1;
        if (d.status === 'DELIVERED') entry.completedCount += 1;
        entry.itemsCount += (d.items || []).reduce((sum, item) => sum + item.qty, 0);
        entry.codCollected += d.codCollectedAmount || 0;
      }
    });

    const list = Array.from(map.values());
    const maxCount = Math.max(...list.map((item) => item.deliveriesCount), 0);
    const peakDays = list.filter((item) => item.deliveriesCount > 0 && item.deliveriesCount === maxCount);
    const activeDaysCount = list.filter((item) => item.deliveriesCount > 0).length;
    const totalDrops = list.reduce((sum, item) => sum + item.deliveriesCount, 0);
    const avgPerActiveDay = activeDaysCount > 0 ? (totalDrops / activeDaysCount).toFixed(1) : '0';

    return {
      chartList: list.map((item) => ({
        ...item,
        isPeak: item.deliveriesCount > 0 && item.deliveriesCount === maxCount,
      })),
      maxCount,
      peakDays,
      activeDaysCount,
      totalDrops,
      avgPerActiveDay,
    };
  }, [filteredDeliveries, dateFilterMode, selectedYear, selectedMonth, customStartDate, customEndDate, today]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header & Date Controls */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-black text-slate-100 tracking-tight">
                Driver Monthly Delivery Ledger
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete delivery fulfillment records, trip distances, and COD liquidation for{' '}
              <span className="font-bold text-amber-400">{driverName}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* DATE SELECTOR & ADJUSTER TOOLBAR */}
        <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setDateFilterMode('MONTH')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                dateFilterMode === 'MONTH'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly View
            </button>
            <button
              type="button"
              onClick={() => setDateFilterMode('CUSTOM')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                dateFilterMode === 'CUSTOM'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Custom Date Range
            </button>
          </div>

          {dateFilterMode === 'MONTH' ? (
            /* Month and Year Quick Selector */
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-amber-400 focus:outline-hidden cursor-pointer"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-amber-400 focus:outline-hidden cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027].map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCurrentMonth}
                className="px-2.5 py-1.5 text-[11px] font-bold text-slate-300 hover:text-amber-400 underline cursor-pointer ml-1"
              >
                Today
              </button>
            </div>
          ) : (
            /* Custom Date Range Picker */
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MONTHLY SUMMARY METRICS TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Deliveries */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span>Total Drops</span>
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono">
            {stats.totalCount}
          </div>
          <div className="text-[10px] text-slate-400">
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </div>
        </div>

        {/* Completed Deliveries */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Delivered</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            {stats.completedCount}
          </div>
          <div className="text-[10px] text-emerald-400/80 font-bold">
            {stats.successRate}% Success Rate
          </div>
        </div>

        {/* Estimated Distance */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5" />
            <span>Total Distance</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-300 font-mono">
            {stats.estimatedDistanceKm}{' '}
            <span className="text-xs font-bold text-slate-400">km</span>
          </div>
          <div className="text-[10px] text-slate-400">
            Cumulative routes
          </div>
        </div>

        {/* Estimated Fuel Consumed */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Fuel className="w-3.5 h-3.5" />
            <span>Fuel Est.</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
            {stats.estimatedFuelLiters}{' '}
            <span className="text-xs font-bold text-slate-400">L</span>
          </div>
          <div className="text-[10px] text-amber-400/80 font-medium">
            ≈ ₱{stats.estimatedFuelCost.toLocaleString()} (@₱60/L)
          </div>
        </div>

        {/* Total COD Remitted */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 space-y-1 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-400 uppercase tracking-wider">
            <Banknote className="w-3.5 h-3.5" />
            <span>COD Remitted</span>
          </div>
          <div className="text-lg sm:text-xl font-black text-yellow-300 font-mono truncate">
            ₱{stats.totalCodCollected.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400">
            Collected on delivery
          </div>
        </div>
      </div>

      {/* RECHARTS DAILY DELIVERY COUNT CHART & PEAK PRODUCTIVITY INSIGHT */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <BarChart3 className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">
                Daily Delivery Productivity &amp; Peak Days
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Visualizing driver daily delivery volume across {dateFilterMode === 'MONTH' ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}` : 'the selected date range'} to pinpoint peak productivity performance.
            </p>
          </div>

          {/* Chart Type Toggle & Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700">
              <button
                type="button"
                onClick={() => setChartType('BAR')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  chartType === 'BAR'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bar Chart
              </button>
              <button
                type="button"
                onClick={() => setChartType('AREA')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  chartType === 'AREA'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Area Trend
              </button>
            </div>
          </div>
        </div>

        {/* PEAK PRODUCTIVITY INSIGHT BANNER */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Peak Day Highlight Card */}
          <div className={`p-3 rounded-xl border flex items-center gap-3 ${
            dailyChartData.maxCount > 0
              ? 'bg-gradient-to-r from-amber-950/60 via-slate-850 to-slate-900 border-amber-500/40 shadow-sm'
              : 'bg-slate-850 border-slate-800'
          }`}>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                🏆 Peak Productivity Day
              </div>
              <div className="text-sm font-black text-white truncate">
                {dailyChartData.peakDays.length > 0
                  ? dailyChartData.peakDays.map((p) => p.fullDateText.split('(')[0].trim()).join(', ')
                  : 'No deliveries logged'}
              </div>
              <div className="text-[11px] font-mono text-amber-300 font-bold">
                {dailyChartData.maxCount > 0
                  ? `${dailyChartData.maxCount} drops in a single day`
                  : '0 drops'}
              </div>
            </div>
          </div>

          {/* Daily Average Card */}
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Daily Output Average
              </div>
              <div className="text-sm font-black text-white font-mono">
                {dailyChartData.avgPerActiveDay} drops / active day
              </div>
              <div className="text-[11px] text-slate-400">
                Active work days: {dailyChartData.activeDaysCount} days
              </div>
            </div>
          </div>

          {/* Fleet Productivity Rating Card */}
          <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                Driver Pacing &amp; Velocity
              </div>
              <div className="text-sm font-black text-white">
                {dailyChartData.maxCount >= 6 ? 'High Velocity Fleet ⚡' : dailyChartData.maxCount >= 3 ? 'Steady Fulfillment 🟢' : 'Standard Pace'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                {dailyChartData.totalDrops} total drops in period
              </div>
            </div>
          </div>
        </div>

        {/* RECHARTS CANVAS CONTAINER */}
        <div className="pt-2">
          {dailyChartData.totalDrops === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
              <BarChart3 className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs font-bold text-slate-300">
                No delivery data recorded for {driverName} in this period
              </p>
              <p className="text-[11px] text-slate-500">
                Daily delivery bars and peak indicators will render here once deliveries are recorded.
              </p>
            </div>
          ) : (
            <div className="w-full h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'BAR' ? (
                  <BarChart data={dailyChartData.chartList} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
                    <XAxis
                      dataKey="dayLabel"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickLine={false}
                      interval={dailyChartData.chartList.length > 20 ? 2 : 0}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-3 bg-slate-950/95 border border-slate-700 rounded-xl shadow-2xl text-xs space-y-1.5 text-slate-100 backdrop-blur-md min-w-[190px]">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                                <span className="font-bold text-white">{data.fullDateText}</span>
                                {data.isPeak && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-amber-500 text-slate-950 shadow-xs">
                                    🏆 Peak Day
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center justify-between font-mono">
                                <span className="text-slate-400">Total Deliveries:</span>
                                <span className="font-black text-amber-400 text-sm">
                                  {data.deliveriesCount} drops
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-slate-400">Delivered &amp; Unloaded:</span>
                                <span className="text-emerald-400 font-bold">
                                  {data.completedCount} drops
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-slate-400">Materials Hauled:</span>
                                <span className="text-sky-300 font-bold">
                                  {data.itemsCount} units
                                </span>
                              </div>
                              {data.codCollected > 0 && (
                                <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-slate-800">
                                  <span className="text-yellow-400">COD Remitted:</span>
                                  <span className="text-yellow-300 font-black">
                                    ₱{data.codCollected.toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="deliveriesCount" radius={[6, 6, 0, 0]}>
                      {dailyChartData.chartList.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isPeak ? '#f59e0b' : entry.deliveriesCount > 0 ? '#38bdf8' : '#334155'}
                          className="transition-all hover:opacity-80"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <AreaChart data={dailyChartData.chartList} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="deliveryGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
                    <XAxis
                      dataKey="dayLabel"
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickLine={false}
                      interval={dailyChartData.chartList.length > 20 ? 2 : 0}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-3 bg-slate-950/95 border border-slate-700 rounded-xl shadow-2xl text-xs space-y-1 text-slate-100 backdrop-blur-md">
                              <div className="font-bold text-white border-b border-slate-800 pb-1">
                                {data.fullDateText}
                              </div>
                              <div className="flex items-center justify-between font-mono">
                                <span className="text-slate-400">Deliveries:</span>
                                <span className="font-black text-amber-400 text-sm">
                                  {data.deliveriesCount} drops
                                </span>
                              </div>
                              {data.isPeak && (
                                <div className="text-[10px] text-amber-400 font-bold">
                                  🏆 Peak Productivity Day
                                </div>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="deliveriesCount"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#deliveryGradient)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search delivery #, customer, address, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 font-bold focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Statuses ({filteredDeliveries.length})</option>
            <option value="DELIVERED">Delivered ({stats.completedCount})</option>
            <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
            <option value="ARRIVED">Arrived</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* DELIVERIES LIST & RECORD CARDS */}
      <div className="space-y-3">
        {filteredDeliveries.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <Truck className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="font-bold text-slate-300 text-sm">
              No delivery records found for {driverName} in{' '}
              {dateFilterMode === 'MONTH'
                ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
                : `${customStartDate} to ${customEndDate}`}
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Any deliveries completed or assigned to this driver during this period will automatically appear here with full Proof of Delivery (POD) photo and customer digital signature.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredDeliveries.map((del) => {
              const isDelivered = del.status === 'DELIVERED';
              const hasPod = !!(del.proofOfDeliveryPhoto || del.customerSignature);
              const delDate = del.createdAt ? new Date(del.createdAt) : new Date();

              return (
                <div
                  key={del.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 hover:border-slate-700 transition-all shadow-sm space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-amber-400 text-xs">
                        #{del.deliveryNo}
                      </span>
                      <span className="text-slate-500 text-xs">·</span>
                      <span className="text-xs text-slate-300 font-medium">
                        {delDate.toLocaleDateString('en-PH', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        at{' '}
                        {delDate.toLocaleTimeString('en-PH', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {del.isCod && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
                          <Banknote className="w-3 h-3" />
                          <span>COD: ₱{(del.codCollectedAmount || del.codAmount || 0).toLocaleString()}</span>
                        </span>
                      )}

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isDelivered
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : del.status === 'OUT_FOR_DELIVERY'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {del.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Customer & Destination */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Customer / Site
                      </div>
                      <div className="font-bold text-slate-200 mt-0.5">
                        {del.customerName}
                      </div>
                      <div className="text-slate-400 text-[11px] truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{del.address}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Items &amp; Dispatch Package
                      </div>
                      <div className="text-slate-300 text-[11px] mt-0.5 line-clamp-2">
                        {del.items && del.items.length > 0
                          ? del.items.map((i) => `${i.productName} (${i.qty} ${i.unit})`).join(', ')
                          : 'General construction materials'}
                      </div>
                    </div>
                  </div>

                  {/* Proof of Delivery Details (if delivered) */}
                  {isDelivered && (
                    <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-slate-300">
                          Received by:{' '}
                          <span className="font-bold text-slate-100">
                            {del.proofReceivedBy || 'Customer Representative'}
                          </span>
                        </span>
                        {del.customerSignature && (
                          <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            ✍️ Digital Signature
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {hasPod && (
                          <button
                            type="button"
                            onClick={() => setSelectedPodDelivery(del)}
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View POD &amp; Signature</span>
                          </button>
                        )}

                        {onOpenReceipt && (
                          <button
                            type="button"
                            onClick={() => onOpenReceipt(del)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Receipt</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PROOF OF DELIVERY & DIGITAL SIGNATURE PREVIEW MODAL */}
      {selectedPodDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-sm text-slate-100">
                  Proof of Delivery — #{selectedPodDelivery.deliveryNo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPodDelivery(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Customer:</span>
                <span className="font-bold text-slate-100">{selectedPodDelivery.customerName}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Received By:</span>
                <span className="font-bold text-emerald-400">
                  {selectedPodDelivery.proofReceivedBy || 'Customer Representative'}
                </span>
              </div>
              {selectedPodDelivery.deliveredAt && (
                <div className="flex justify-between text-slate-300">
                  <span>Delivered At:</span>
                  <span className="font-mono text-slate-200">
                    {new Date(selectedPodDelivery.deliveredAt).toLocaleString('en-PH')}
                  </span>
                </div>
              )}

              {/* POD Photo */}
              {selectedPodDelivery.proofOfDeliveryPhoto && (
                <div>
                  <div className="font-bold text-slate-400 uppercase text-[10px] mb-1">
                    On-Site Delivery Photo
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-800 max-h-48 bg-slate-950 flex items-center justify-center">
                    <img
                      src={selectedPodDelivery.proofOfDeliveryPhoto}
                      alt="POD Photo"
                      className="w-full h-auto object-contain max-h-48"
                    />
                  </div>
                </div>
              )}

              {/* Customer Digital Signature */}
              {selectedPodDelivery.customerSignature && (
                <div>
                  <div className="font-bold text-slate-400 uppercase text-[10px] mb-1">
                    Customer E-Signature
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-slate-300 flex items-center justify-center">
                    <img
                      src={selectedPodDelivery.customerSignature}
                      alt="Customer Signature"
                      className="h-20 object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedPodDelivery(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
