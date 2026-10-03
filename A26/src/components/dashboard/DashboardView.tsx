import React from 'react';
import { useApp } from '../../context/AppContext';
import { CriticalStockWidget } from './CriticalStockWidget';
import {
  Package,
  CircleDollarSign,
  TrendingUp,
  Truck,
  Wrench,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShoppingCart,
  ArrowDownToLine,
  CalendarDays,
  FileCheck2,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    products,
    sales,
    payments,
    rentals,
    deliveryOrders,
    customers,
    projects,
    equipment,
    lowStockCount,
    outOfStockCount,
    todaySalesTotal,
    stockValueCost,
    activeRentalsCount,
    openDeliveriesCount,
    setCurrentPage,
    verifyPayment,
    showToast,
  } = useApp();

  const outOfStockItems = products.filter((p) => p.status === 'ACTIVE' && p.currentStock <= 0);
  const lowStockItems = products.filter((p) => p.status === 'ACTIVE' && p.currentStock > 0 && p.currentStock <= p.minStock);
  const pendingPayments = payments.filter((p) => p.status === 'PENDING');
  const overdueRentals = rentals.filter((r) => r.status === 'OVERDUE');

  // Total Accounts Receivable balance
  const totalReceivables = sales
    .filter((s) => s.status !== 'VOIDED' && s.balance > 0)
    .reduce((sum, s) => sum + s.balance, 0);

  const recentSales = sales.slice(0, 6);
  const activeRentalsList = rentals.filter((r) => r.status === 'ACTIVE' || r.status === 'OVERDUE').slice(0, 5);

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {outOfStockItems.length > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-900">
                CRITICAL OUT-OF-STOCK ALERT ({outOfStockItems.length} items exhausted)
              </p>
              <p className="text-xs text-rose-700 mt-0.5">
                {outOfStockItems.map((p) => p.name).slice(0, 3).join(', ')}
                {outOfStockItems.length > 3 ? ` and ${outOfStockItems.length - 3} more` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentPage('stock-in')}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5"
          >
            <span>Restock Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {pendingPayments.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">
                {pendingPayments.length} Payment Verification(s) Pending Clearance
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Digital GCash, Maya, and Bank transfers awaiting approval to clear balances.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentPage('pending-verification')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5"
          >
            <span>Review Payments</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {overdueRentals.length > 0 && (
        <div className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-r-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-purple-900">
                {overdueRentals.length} Equipment Rental(s) OVERDUE for Return
              </p>
              <p className="text-xs text-purple-700 mt-0.5">
                Contracts past expected return date. Contact site contractors to inspect machinery.
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentPage('rentals')}
            className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
          >
            View Overdue Equipment
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Total SKUs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Materials SKUs</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            {products.filter((p) => p.status === 'ACTIVE').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>In-stock categories</span>
          </div>
        </div>

        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Today's Sales</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-2 font-mono truncate" title={formatPHP(todaySalesTotal)}>
            {formatPHP(todaySalesTotal)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Official receipts issued
          </div>
        </div>

        {/* Stock Valuation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inventory Value</span>
            <CircleDollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono truncate" title={formatPHP(stockValueCost)}>
            {formatPHP(stockValueCost)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            At purchase cost basis
          </div>
        </div>

        {/* Outstanding AR */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Receivables A/R</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 mt-2 font-mono truncate" title={formatPHP(totalReceivables)}>
            {formatPHP(totalReceivables)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Contractor uncollected
          </div>
        </div>

        {/* Logistics / Deliveries */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">Deliveries</span>
            <Truck className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-600 mt-2 font-mono">
            {openDeliveriesCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {deliveryOrders.filter((d) => d.status === 'OUT_FOR_DELIVERY').length} in transit now
          </div>
        </div>

        {/* Equipment Rentals */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Machinery Out</span>
            <Wrench className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-600 mt-2 font-mono">
            {activeRentalsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Mixers, vibrators, etc.
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts Bar */}
      <div className="bg-slate-900 text-white rounded-xl p-4 shadow-sm border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Quick Operations Shortcuts
          </h3>
          <span className="text-[11px] text-slate-400">Standard workflows</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => setCurrentPage('new-sale')}
            className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 transition-all font-semibold text-xs text-left group"
          >
            <div className="p-2 rounded-md bg-slate-700 group-hover:bg-amber-600 group-hover:text-slate-950 shrink-0">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold">New Sale POS</div>
              <div className="text-[10px] text-slate-400 group-hover:text-slate-900">Issue official receipt</div>
            </div>
          </button>

          <button
            onClick={() => setCurrentPage('stock-in')}
            className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all font-semibold text-xs text-left group"
          >
            <div className="p-2 rounded-md bg-slate-700 text-emerald-400 shrink-0">
              <ArrowDownToLine className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold">Stock In Goods</div>
              <div className="text-[10px] text-slate-400">Receive supplier lot</div>
            </div>
          </button>

          <button
            onClick={() => setCurrentPage('delivery-orders')}
            className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all font-semibold text-xs text-left group"
          >
            <div className="p-2 rounded-md bg-slate-700 text-sky-400 shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold">Dispatch Delivery</div>
              <div className="text-[10px] text-slate-400">Assign truck & driver</div>
            </div>
          </button>

          <button
            onClick={() => setCurrentPage('rentals')}
            className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all font-semibold text-xs text-left group"
          >
            <div className="p-2 rounded-md bg-slate-700 text-purple-400 shrink-0">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold">Rent Equipment</div>
              <div className="text-[10px] text-slate-400">Machinery contracts</div>
            </div>
          </button>
        </div>
      </div>

      {/* Critical Low Stock & Quick Purchase Order Widget */}
      <CriticalStockWidget />

      {/* Two Column Grid: Pending Clearances & Active Leases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Stock Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
              <h3 className="text-sm font-bold text-slate-800">Inventory Warning Items</h3>
            </div>
            <button
              onClick={() => setCurrentPage('products')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>View All Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {outOfStockItems.concat(lowStockItems).slice(0, 5).map((prod) => {
              const isOut = prod.currentStock <= 0;
              return (
                <div key={prod.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                    <p className="text-[11px] text-slate-500">
                      SKU: <span className="font-mono">{prod.sku}</span> • Bay: {prod.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className={`text-xs font-black font-mono ${isOut ? 'text-rose-600' : 'text-amber-600'}`}>
                        {prod.currentStock} {prod.unit}
                      </div>
                      <div className="text-[10px] text-slate-400">Min: {prod.minStock} {prod.unit}</div>
                    </div>
                    <button
                      onClick={() => setCurrentPage('stock-in')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-bold transition-colors"
                    >
                      Stock In
                    </button>
                  </div>
                </div>
              );
            })}
            {outOfStockItems.length === 0 && lowStockItems.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">
                ✅ All inventory levels are optimal and above reorder points!
              </p>
            )}
          </div>
        </div>

        {/* Right: Pending Payments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              <h3 className="text-sm font-bold text-slate-800">Pending Financial Clearances</h3>
            </div>
            <button
              onClick={() => setCurrentPage('pending-verification')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>Verification Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {pendingPayments.slice(0, 5).map((pay) => {
              const sale = sales.find((s) => s.id === pay.salesId);
              const cust = sale ? customers.find((c) => c.id === sale.customerId) : null;
              return (
                <div key={pay.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 font-mono">{pay.reference}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold uppercase">
                        {pay.method}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {cust?.name || 'Customer'} • Invoice #{sale?.invoiceNo || 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-emerald-600 font-mono">
                      {formatPHP(pay.amount)}
                    </span>
                    <button
                      onClick={() => {
                        verifyPayment(pay.id);
                        showToast(`Verified payment ${pay.reference}`);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold transition-colors flex items-center gap-1"
                      title="Approve & Clear Balance"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              );
            })}
            {pendingPayments.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-400">
                ✅ No pending payment verifications. All digital transfers cleared!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Sales Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Sales & Invoices</h3>
            <p className="text-xs text-slate-500">Official sales transactions issued recently</p>
          </div>
          <button
            onClick={() => setCurrentPage('sales-history')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>Full Sales Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer / Contractor</th>
                <th className="px-4 py-3">Project Site</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Total (PHP)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentSales.map((s) => {
                const cust = customers.find((c) => c.id === s.customerId);
                const proj = projects.find((p) => p.id === s.projectId);
                const itemCount = s.items.reduce((acc, i) => acc + i.qty, 0);

                let badge = <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">PAID</span>;
                if (s.status === 'PARTIALLY_PAID') {
                  badge = <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">PARTIAL</span>;
                } else if (s.status === 'UNPAID') {
                  badge = <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">CREDIT</span>;
                } else if (s.status === 'VOIDED') {
                  badge = <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 line-through">VOIDED</span>;
                }

                return (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-bold font-mono text-slate-900">{s.invoiceNo}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{cust?.name || 'Walk-In'}</td>
                    <td className="px-4 py-3 text-slate-500 truncate max-w-[150px]">{proj?.name || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{itemCount}</td>
                    <td className="px-4 py-3 text-right font-bold font-mono text-slate-900">{formatPHP(s.total)}</td>
                    <td className="px-4 py-3 text-center">{badge}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => setCurrentPage('sales-history')}
                        className="text-amber-600 hover:text-amber-800 font-bold hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Equipment Rentals Snapshot */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Deployed Machinery & Rentals</h3>
            <p className="text-xs text-slate-500">Currently deployed construction machinery on sites</p>
          </div>
          <button
            onClick={() => setCurrentPage('rentals')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>All Rentals & Returns</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeRentalsList.map((rent) => {
            const eq = equipment.find((e) => e.id === rent.equipmentId);
            const cust = customers.find((c) => c.id === rent.customerId);
            const isOverdue = rent.status === 'OVERDUE';

            return (
              <div
                key={rent.id}
                className={`p-3.5 rounded-xl border ${
                  isOverdue ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-slate-50/60'
                } flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{rent.rentalNo}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        isOverdue ? 'bg-rose-500 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {rent.status}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">{eq?.name || 'Equipment'}</h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Client: {cust?.name || 'Contractor'}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-slate-400">Return: </span>
                    <span className={`font-semibold ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                      {rent.endDate}
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentPage('rentals')}
                    className="text-amber-600 font-bold hover:underline"
                  >
                    Process Return
                  </button>
                </div>
              </div>
            );
          })}
          {activeRentalsList.length === 0 && (
            <div className="col-span-full py-4 text-center text-xs text-slate-400">
              No active equipment rental contracts at this time.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
