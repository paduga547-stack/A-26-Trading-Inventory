import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  CircleDollarSign,
  Package,
  Download,
  Users,
  Building,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { sales, rentals, products, customers, purchaseOrders } = useApp();

  const totalSalesRevenue = sales
    .filter((s) => s.status !== 'VOIDED')
    .reduce((sum, s) => sum + s.total, 0);

  const totalRentalRevenue = rentals.reduce((sum, r) => sum + r.total, 0);
  const totalRevenue = totalSalesRevenue + totalRentalRevenue;

  const totalStockCost = products.reduce((sum, p) => sum + p.currentStock * p.buyingPrice, 0);
  const totalStockRetail = products.reduce((sum, p) => sum + p.currentStock * p.sellingPrice, 0);

  const totalAR = sales
    .filter((s) => s.status !== 'VOIDED' && s.balance > 0)
    .reduce((sum, s) => sum + s.balance, 0);

  const totalPurchases = purchaseOrders
    .filter((po) => po.status === 'RECEIVED')
    .reduce((sum, po) => sum + po.total, 0);

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Group sales by customer
  const clientRevenue: Record<string, { name: string; total: number; count: number }> = {};
  sales
    .filter((s) => s.status !== 'VOIDED')
    .forEach((s) => {
      const c = customers.find((x) => x.id === s.customerId);
      const name = c?.name || 'Walk-In Customer';
      if (!clientRevenue[name]) clientRevenue[name] = { name, total: 0, count: 0 };
      clientRevenue[name].total += s.total;
      clientRevenue[name].count += 1;
    });

  const topClients = Object.values(clientRevenue)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const maxClientTotal = topClients[0]?.total || 1;

  // Group sales by category
  const categorySales: Record<string, number> = {};
  sales
    .filter((s) => s.status !== 'VOIDED')
    .forEach((s) => {
      s.items.forEach((item) => {
        const p = products.find((x) => x.id === item.productId);
        const cat = p?.category || 'OTHERS';
        categorySales[cat] = (categorySales[cat] || 0) + item.qty * item.unitPrice;
      });
    });

  const sortedCategories = Object.entries(categorySales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const maxCatTotal = sortedCategories[0]?.[1] || 1;

  // CSV Exporters
  const exportSalesCSV = () => {
    const headers = ['Invoice No', 'Date', 'Customer', 'Subtotal', 'Discount', 'VAT', 'Delivery Fee', 'Total', 'Paid', 'Balance', 'Status', 'Method'];
    const rows = sales.map((s) => {
      const c = customers.find((x) => x.id === s.customerId);
      return [
        s.invoiceNo,
        s.createdAt.slice(0, 10),
        `"${c?.name || 'Walk-In'}"`,
        s.subtotal,
        s.discount,
        s.vat,
        s.deliveryFee,
        s.total,
        s.paidAmount,
        s.balance,
        s.status,
        s.paymentMethod,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `A26_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportInventoryCSV = () => {
    const headers = ['Product Name', 'SKU', 'Category', 'Brand', 'Unit', 'Buying Price', 'Selling Price', 'Current Stock', 'Stock Cost Basis', 'Retail Valuation', 'Location'];
    const rows = products.map((p) => [
      `"${p.name}"`,
      p.sku,
      p.category,
      `"${p.brand}"`,
      p.unit,
      p.buyingPrice,
      p.sellingPrice,
      p.currentStock,
      (p.currentStock * p.buyingPrice).toFixed(2),
      (p.currentStock * p.sellingPrice).toFixed(2),
      `"${p.location}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `A26_Inventory_Catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header and Exports */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-600" />
            <span>Executive Business Analytics & Financial Reports</span>
          </h3>
          <p className="text-xs text-slate-500">
            Real-time calculations of turnover, inventory asset valuation, and contractor credit health
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportSalesCSV}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Sales CSV</span>
          </button>
          <button
            onClick={exportInventoryCSV}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Inventory CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Business Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-2 font-mono">
            {formatPHP(totalRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Materials: {formatPHP(totalSalesRevenue)} • Rentals: {formatPHP(totalRentalRevenue)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Inventory Asset Value</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatPHP(totalStockCost)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Retail potential: <strong className="text-slate-700">{formatPHP(totalStockRetail)}</strong>
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Accounts Receivable (A/R)</span>
            <CircleDollarSign className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 mt-2 font-mono">
            {formatPHP(totalAR)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Contractor uncollected credit balance
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Vendor Purchases</span>
            <Building className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-600 mt-2 font-mono">
            {formatPHP(totalPurchases)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Delivered PO shipments received
          </p>
        </div>
      </div>

      {/* Analytics Visual Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Clients by Purchases */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              <span>Top 5 Key Accounts & Contractors</span>
            </h4>
            <span className="text-[11px] text-slate-400">By sales volume</span>
          </div>

          <div className="space-y-3">
            {topClients.map((client) => {
              const pct = Math.round((client.total / maxClientTotal) * 100);
              return (
                <div key={client.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-800">
                    <span className="truncate pr-2">{client.name}</span>
                    <span className="font-mono font-bold text-slate-900 shrink-0">
                      {formatPHP(client.total)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 text-right">
                    {client.count} completed order(s)
                  </div>
                </div>
              );
            })}

            {topClients.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">No client sales data recorded yet.</p>
            )}
          </div>
        </div>

        {/* Sales by Category */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Sales Revenue by Material Category</span>
            </h4>
            <span className="text-[11px] text-slate-400">Top demand groups</span>
          </div>

          <div className="space-y-3">
            {sortedCategories.map(([cat, total]) => {
              const pct = Math.round((total / maxCatTotal) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-800">
                    <span className="truncate pr-2">{cat}</span>
                    <span className="font-mono font-bold text-emerald-700 shrink-0">
                      {formatPHP(total)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {sortedCategories.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">No category breakdown data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
