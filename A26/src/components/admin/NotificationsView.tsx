import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  AlertTriangle,
  Clock,
  Wrench,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const {
    products,
    payments,
    rentals,
    sales,
    customers,
    equipment,
    setCurrentPage,
    verifyPayment,
    showToast,
  } = useApp();

  const outOfStock = products.filter((p) => p.status === 'ACTIVE' && p.currentStock <= 0);
  const lowStock = products.filter((p) => p.status === 'ACTIVE' && p.currentStock > 0 && p.currentStock <= p.minStock);
  const pendingPayments = payments.filter((p) => p.status === 'PENDING');
  const overdueRentals = rentals.filter((r) => r.status === 'OVERDUE');

  const totalNotifications = outOfStock.length + lowStock.length + pendingPayments.length + overdueRentals.length;

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600" />
            <span>Centralized System Notifications & Action Queue</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalNotifications === 0
              ? 'All operating systems normal. No pending action items.'
              : `${totalNotifications} operation item(s) requiring attention or approval.`}
          </p>
        </div>
        {totalNotifications === 0 && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <CheckCircle className="w-4 h-4" />
            <span>Up to Date</span>
          </span>
        )}
      </div>

      {/* Out of Stock Section */}
      {outOfStock.length > 0 && (
        <div className="bg-white rounded-xl border border-rose-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
                Critical: Out of Stock Materials ({outOfStock.length})
              </h4>
            </div>
            <button
              onClick={() => setCurrentPage('stock-in')}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1"
            >
              <span>Stock In Receiving</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100 p-2">
            {outOfStock.map((p) => (
              <div key={p.id} className="p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{p.name}</span>
                  <span className="text-slate-400 font-mono ml-2">({p.sku})</span>
                  <div className="text-[11px] text-slate-500">
                    Category: {p.category} • Bay: {p.location} • Min: {p.minStock} {p.unit}
                  </div>
                </div>
                <button
                  onClick={() => setCurrentPage('stock-in')}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs"
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock Warning */}
      {lowStock.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Warning: Low Stock Below Reorder Threshold ({lowStock.length})
              </h4>
            </div>
            <button
              onClick={() => setCurrentPage('purchase-orders')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
            >
              <span>Issue Purchase Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100 p-2">
            {lowStock.map((p) => (
              <div key={p.id} className="p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{p.name}</span>
                  <span className="text-slate-400 font-mono ml-2">({p.sku})</span>
                  <div className="text-[11px] text-slate-500">
                    Remaining: <strong className="text-amber-700 font-mono">{p.currentStock} {p.unit}</strong> (Min Reorder: {p.minStock})
                  </div>
                </div>
                <button
                  onClick={() => setCurrentPage('stock-in')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Stock In
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Payment Clearances */}
      {pendingPayments.length > 0 && (
        <div className="bg-white rounded-xl border border-sky-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-sky-50/70 border-b border-sky-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-900">
                Pending Payment Clearances ({pendingPayments.length})
              </h4>
            </div>
            <button
              onClick={() => setCurrentPage('pending-verification')}
              className="text-xs font-bold text-sky-800 hover:text-sky-950 flex items-center gap-1"
            >
              <span>Full Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100 p-2">
            {pendingPayments.map((p) => {
              const sale = sales.find((s) => s.id === p.salesId);
              const cust = sale ? customers.find((c) => c.id === sale.customerId) : null;
              return (
                <div key={p.id} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{p.reference}</span>
                    <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-bold ml-2 text-[10px] uppercase">
                      {p.method}
                    </span>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {cust?.name || 'Customer'} • Invoice #{sale?.invoiceNo || 'N/A'} • Submitted {p.date}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-emerald-700">{formatPHP(p.amount)}</span>
                    <button
                      onClick={() => {
                        verifyPayment(p.id);
                        showToast(`Verified payment ${p.reference}`);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overdue Machinery Rentals */}
      {overdueRentals.length > 0 && (
        <div className="bg-white rounded-xl border border-purple-200 shadow-2xs overflow-hidden">
          <div className="p-4 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                Overdue Equipment Rentals ({overdueRentals.length})
              </h4>
            </div>
            <button
              onClick={() => setCurrentPage('rentals')}
              className="text-xs font-bold text-purple-800 hover:text-purple-950 flex items-center gap-1"
            >
              <span>Manage Rentals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100 p-2">
            {overdueRentals.map((r) => {
              const eq = equipment.find((e) => e.id === r.equipmentId);
              const cust = customers.find((c) => c.id === r.customerId);
              return (
                <div key={r.id} className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{r.rentalNo}</span>
                    <span className="font-bold text-slate-800 ml-2">{eq?.name}</span>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Contractor: {cust?.name} • Target Return Date: <strong className="text-rose-600">{r.endDate}</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentPage('rentals')}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs"
                  >
                    Process Return
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
