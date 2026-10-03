import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, CreditCard, CheckCircle, Clock, XCircle, Trash2 } from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const { payments, sales, customers, deletePayment, bulkDeletePayments } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const sale = sales.find((s) => s.id === p.salesId);
      const cust = sale ? customers.find((c) => c.id === sale.customerId) : null;

      const matchSearch =
        !searchTerm.trim() ||
        p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale && sale.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cust && cust.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchMethod = methodFilter === 'ALL' || p.method === methodFilter;
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;

      return matchSearch && matchMethod && matchStatus;
    });
  }, [payments, sales, customers, searchTerm, methodFilter, statusFilter]);

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
          <CheckCircle className="w-3 h-3" />
          <span>VERIFIED</span>
        </span>
      );
    }
    if (status === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
          <Clock className="w-3 h-3" />
          <span>PENDING</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
        <XCircle className="w-3 h-3" />
        <span>REJECTED</span>
      </span>
    );
  };

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredPayments.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    bulkDeletePayments(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by reference trace number, invoice #, customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Delete ({selectedIds.size})</span>
            </button>
          )}

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="CASH">Cash</option>
            <option value="GCASH">GCash</option>
            <option value="MAYA">Maya</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CHECK">Check</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700"
          >
            <option value="ALL">All Clearance Status</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending Clearance</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={filteredPayments.length > 0 && selectedIds.size === filteredPayments.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                </th>
                <th className="px-5 py-3">Reference / Trace #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3 text-right">Amount (PHP)</th>
                <th className="px-4 py-3">Associated Invoice</th>
                <th className="px-4 py-3">Customer / Contractor</th>
                <th className="px-4 py-3 text-center">Clearance Status</th>
                <th className="px-4 py-3">Verified By</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPayments.map((p) => {
                const sale = sales.find((s) => s.id === p.salesId);
                const cust = sale ? customers.find((c) => c.id === sale.customerId) : null;
                const isSelected = selectedIds.has(p.id);

                return (
                  <tr key={p.id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelect(p.id, e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-500"
                      />
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-slate-900">{p.reference}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{p.date}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                        {p.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-black text-emerald-700">
                      {formatPHP(p.amount)}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-600">
                      {sale?.invoiceNo || 'General'}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{cust?.name || 'Walk-In'}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">{getStatusBadge(p.status)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {p.verifiedBy ? (
                        <span>
                          {p.verifiedBy} ({p.verificationDate})
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Awaiting Review</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deletePayment(p.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Delete Payment Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <CreditCard className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-40" />
                    <p className="font-semibold text-slate-600">No payment records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
