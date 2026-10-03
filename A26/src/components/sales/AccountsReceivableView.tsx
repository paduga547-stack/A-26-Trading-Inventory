import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale, PaymentMethod } from '../../types';
import { Modal } from '../common/Modal';
import {
  Wallet,
  DollarSign,
  AlertTriangle,
  Building,
  CreditCard,
  ShieldAlert,
  Trash2,
} from 'lucide-react';

export const AccountsReceivableView: React.FC = () => {
  const { sales, customers, recordPayment, bulkDeleteSales, voidSale, currentUser } = useApp();

  const [paymentTarget, setPaymentTarget] = useState<Sale | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('CASH');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Security check: Only Admin
  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs p-8">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Restricted Access (Admin Account Only)</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          The Accounts Receivable (Mga May Utang) module is strictly confidential and reserved for the Administrator (A26Jaya).
        </p>
      </div>
    );
  }

  // Unpaid or partially paid sales
  const creditSales = sales.filter((s) => s.status !== 'VOIDED' && s.balance > 0);
  const totalOutstanding = creditSales.reduce((sum, s) => sum + s.balance, 0);

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleCollectPayment = (e: React.FormEvent) => {
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
      setSelectedIds(new Set(creditSales.map((s) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    bulkDeleteSales(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  // Group by customer
  const customerDebts: Record<string, { customerName: string; totalBalance: number; count: number }> = {};
  creditSales.forEach((s) => {
    const cust = customers.find((c) => c.id === s.customerId);
    const name = cust?.name || 'Walk-In Client';
    if (!customerDebts[name]) {
      customerDebts[name] = { customerName: name, totalBalance: 0, count: 0 };
    }
    customerDebts[name].totalBalance += s.balance;
    customerDebts[name].count += 1;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner with Admin badge */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-600" />
            <span>Accounts Receivable &mdash; Listahan ng mga May Utang</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
              Admin Only
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Track customer balances, payment terms, debt aging, and collect settlements.
          </p>
        </div>

        {selectedIds.size > 0 && (
          <button
            onClick={handleBulkDelete}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected Invoices ({selectedIds.size})</span>
          </button>
        )}
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Outstanding Utang (A/R)</span>
          <div className="text-2xl font-black text-rose-600 mt-2 font-mono">
            {formatPHP(totalOutstanding)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Total pending balances across contractors</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unsettled Credit Invoices</span>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {creditSales.length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Invoices awaiting payment collection</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Debtors (Mga May Utang)</span>
          <div className="text-2xl font-black text-amber-600 mt-2 font-mono">
            {Object.keys(customerDebts).length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Contractor & client credit lines</p>
        </div>
      </div>

      {/* Top Debtors Breakdown */}
      {Object.keys(customerDebts).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-500" />
            <span>Summary of Debts by Client</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.values(customerDebts).map((deb) => (
              <div key={deb.customerName} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                <div className="text-xs font-bold text-slate-900 truncate">{deb.customerName}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-slate-500">{deb.count} invoice(s)</span>
                  <span className="text-xs font-black font-mono text-rose-700">
                    {formatPHP(deb.totalBalance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Unpaid Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Unsettled Accounts Receivable (Listahan ng Utang)</h3>
            <p className="text-xs text-slate-500">Collect partial or full settlement from contractors</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={creditSales.length > 0 && selectedIds.size === creditSales.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                </th>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Customer / Contractor</th>
                <th className="px-4 py-3 text-right">Invoice Total</th>
                <th className="px-4 py-3 text-right">Paid Amount</th>
                <th className="px-4 py-3 text-right">Utang (Balance Due)</th>
                <th className="px-4 py-3">Promised Due Date</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {creditSales.map((s) => {
                const cust = customers.find((c) => c.id === s.customerId);
                const isOverdue = s.dueDate && s.dueDate < new Date().toISOString().slice(0, 10);
                const isSelected = selectedIds.has(s.id);

                return (
                  <tr key={s.id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelect(s.id, e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-bold font-mono text-slate-900">{s.invoiceNo}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{cust?.name || 'Walk-In Client'}</div>
                      <div className="text-[10px] text-slate-400">{cust?.phone || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">{formatPHP(s.total)}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700 font-medium">{formatPHP(s.paidAmount)}</td>
                    <td className="px-4 py-3 text-right font-mono font-black text-rose-700 text-sm">
                      {formatPHP(s.balance)}
                    </td>
                    <td className="px-4 py-3">
                      {s.dueDate ? (
                        <div className={`font-mono text-xs ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                          {s.dueDate}
                          {isOverdue && <span className="block text-[9px] uppercase tracking-wider text-rose-700 font-black">OVERDUE</span>}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">No terms specified</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {s.status === 'PARTIALLY_PAID' ? 'Partial' : 'Unpaid (Utang)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setPaymentTarget(s);
                          setPayAmount(s.balance);
                          setPayRef('');
                          setPayNotes(`Settlement for ${s.invoiceNo}`);
                        }}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Collect Payment</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {creditSales.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                    No outstanding debts or unsettled invoices. All customer accounts are fully paid!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      <Modal
        isOpen={!!paymentTarget}
        onClose={() => setPaymentTarget(null)}
        title="Collect Customer Settlement"
        subtitle={`Apply payment to invoice #${paymentTarget?.invoiceNo}`}
        maxWidth="md"
      >
        {paymentTarget && (
          <form onSubmit={handleCollectPayment} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Total:</span>
                <span className="font-mono font-bold">{formatPHP(paymentTarget.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Previously Paid:</span>
                <span className="font-mono text-emerald-700">{formatPHP(paymentTarget.paidAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1">
                <span className="font-bold text-rose-700">Remaining Balance:</span>
                <span className="font-mono font-black text-rose-700 text-sm">
                  {formatPHP(paymentTarget.balance)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                Payment Amount to Collect (₱) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={paymentTarget.balance}
                required
                value={payAmount}
                onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                Payment Method *
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg bg-white"
              >
                <option value="CASH">Cash (Desk Payment)</option>
                <option value="GCASH">GCash</option>
                <option value="MAYA">Maya</option>
                <option value="BANK_TRANSFER">Bank Deposit / Transfer</option>
                <option value="CHECK">Check Clearing</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                Reference / Receipt Number
              </label>
              <input
                type="text"
                placeholder="e.g. OR# 4501, GCash Ref 8829"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                Collection Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Paid in full by Engr. Alex Bueno"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentTarget(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs"
              >
                Confirm Payment Collection
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
