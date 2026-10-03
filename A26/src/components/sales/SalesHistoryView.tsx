import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale, PaymentMethod } from '../../types';
import { ReceiptModal } from './ReceiptModal';
import { Modal } from '../common/Modal';
import {
  Search,
  Printer,
  DollarSign,
  Ban,
  FileText,
  CreditCard,
  Trash2,
  Receipt,
  Truck,
} from 'lucide-react';

export const SalesHistoryView: React.FC = () => {
  const { sales, customers, projects, voidSale, recordPayment, bulkDeleteSales } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [receiptMode, setReceiptMode] = useState<'INVOICE' | 'THERMAL' | 'DELIVERY_RECEIPT'>('INVOICE');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Void modal
  const [voidTarget, setVoidTarget] = useState<Sale | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // Payment modal
  const [paymentTarget, setPaymentTarget] = useState<Sale | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('CASH');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const cust = customers.find((c) => c.id === s.customerId);
      const matchSearch =
        !searchTerm.trim() ||
        s.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cust && cust.name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [sales, customers, searchTerm, statusFilter]);

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidTarget || !voidReason.trim()) return;
    voidSale(voidTarget.id, voidReason.trim());
    setVoidTarget(null);
    setVoidReason('');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget || payAmount <= 0) return;
    recordPayment({
      salesId: paymentTarget.id,
      amount: payAmount,
      method: payMethod,
      reference: payRef || (payMethod === 'CASH' ? 'CASH-COLLECT' : `REF-${Date.now().toString().slice(-6)}`),
      notes: payNotes,
    });
    setPaymentTarget(null);
  };

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredSales.map((s) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    bulkDeleteSales(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice number (e.g. INV-2026-0001) or customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
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
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Paid in Full</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="UNPAID">Credit / Unpaid</option>
            <option value="VOIDED">Voided</option>
          </select>
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={filteredSales.length > 0 && selectedIds.size === filteredSales.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                </th>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Balance</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSales.map((s) => {
                const cust = customers.find((c) => c.id === s.customerId);
                const isVoided = s.status === 'VOIDED';
                const isSelected = selectedIds.has(s.id);

                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isVoided ? 'opacity-60 bg-rose-50/30' : ''
                    } ${isSelected ? 'bg-amber-50/40' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelect(s.id, e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-500"
                      />
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {s.invoiceNo}
                    </td>

                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleDateString('en-PH')}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{cust?.name || 'Walk-In'}</div>
                    </td>

                    <td className="px-4 py-3 font-medium">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                        {s.paymentMethod}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatPHP(s.total)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-emerald-700 font-semibold">
                      {formatPHP(s.paidAmount)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">
                      {s.balance > 0 ? formatPHP(s.balance) : '—'}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'PARTIALLY_PAID'
                            ? 'bg-amber-100 text-amber-800'
                            : s.status === 'UNPAID'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-200 text-slate-800 line-through'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Print Invoice (A4 / PDF) */}
                        <button
                          onClick={() => {
                            setReceiptMode('INVOICE');
                            setSelectedSaleForReceipt(s);
                          }}
                          title="Print Official Sales Invoice (A4 / PDF)"
                          className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Print Thermal POS Receipt */}
                        <button
                          onClick={() => {
                            setReceiptMode('THERMAL');
                            setSelectedSaleForReceipt(s);
                          }}
                          title="Print Thermal Receipt (58mm / 80mm POS Roll)"
                          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>

                        {/* Print Delivery Receipt (DR) */}
                        <button
                          onClick={() => {
                            setReceiptMode('DELIVERY_RECEIPT');
                            setSelectedSaleForReceipt(s);
                          }}
                          title="Print Delivery Receipt & Dispatch Note (DR)"
                          className="p-1.5 rounded-md text-sky-600 hover:bg-sky-50 hover:text-sky-700 transition-colors cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                        </button>

                        {/* Record Payment on Balance */}
                        {s.balance > 0 && s.status !== 'VOIDED' && (
                          <button
                            onClick={() => {
                              setPaymentTarget(s);
                              setPayAmount(s.balance);
                              setPayMethod('CASH');
                              setPayRef('');
                              setPayNotes('');
                            }}
                            title="Collect Payment"
                            className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Void Sale */}
                        {s.status !== 'VOIDED' && (
                          <button
                            onClick={() => {
                              setVoidTarget(s);
                              setVoidReason('');
                            }}
                            title="Void Sale"
                            className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Delete single */}
                        <button
                          onClick={() => {
                            bulkDeleteSales([s.id]);
                          }}
                          title="Delete invoice record"
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No matching sales records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedSaleForReceipt}
        onClose={() => setSelectedSaleForReceipt(null)}
        sale={selectedSaleForReceipt}
        initialMode={receiptMode}
      />

      {/* Void Sale Confirmation Modal */}
      <Modal
        isOpen={!!voidTarget}
        onClose={() => setVoidTarget(null)}
        title={`Void Invoice #${voidTarget?.invoiceNo}`}
        subtitle="This action will cancel the sale and restore all items back to active inventory stock."
        maxWidth="md"
      >
        <form onSubmit={handleConfirmVoid} className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
            <p className="font-bold">⚠️ Warning:</p>
            <p className="mt-0.5">
              Invoice <span className="font-mono font-bold">{voidTarget?.invoiceNo}</span> for{' '}
              <span className="font-bold">{formatPHP(voidTarget?.total || 0)}</span> will be marked VOIDED.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Reason for Voiding *
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Customer cancelled order, duplicate cashier tender, input mistake"
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setVoidTarget(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
            >
              Confirm Void
            </button>
          </div>
        </form>
      </Modal>

      {/* Collect Payment Modal */}
      <Modal
        isOpen={!!paymentTarget}
        onClose={() => setPaymentTarget(null)}
        title={`Collect Payment for #${paymentTarget?.invoiceNo}`}
        subtitle="Update balance and record transaction"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmPayment} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
            <span>Remaining Balance:</span>
            <span className="font-mono font-bold text-rose-600 text-sm">
              {formatPHP(paymentTarget?.balance || 0)}
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Payment Amount (PHP) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={paymentTarget?.balance}
              required
              value={payAmount}
              onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Payment Method *
            </label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white"
            >
              <option value="CASH">Cash</option>
              <option value="GCASH">GCash</option>
              <option value="MAYA">Maya</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHECK">Check</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Reference Number
            </label>
            <input
              type="text"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPaymentTarget(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
            >
              Post Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
