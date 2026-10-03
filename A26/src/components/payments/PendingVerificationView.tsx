import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, XCircle, Clock, ShieldCheck, AlertCircle } from 'lucide-react';

export const PendingVerificationView: React.FC = () => {
  const { payments, sales, customers, verifyPayment, rejectPayment, showToast } = useApp();

  const pendingPayments = payments.filter((p) => p.status === 'PENDING');

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Pending Digital & Bank Payment Clearance Queue ({pendingPayments.length})</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Verify GCash, Maya, Bank Transfers, and Check clearing against online banking notifications before updating contractor receivables balance.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Reference / Trace ID</th>
                <th className="px-4 py-3">Submission Date</th>
                <th className="px-4 py-3">Channel Method</th>
                <th className="px-4 py-3 text-right">Amount (PHP)</th>
                <th className="px-4 py-3">Linked Sales Invoice</th>
                <th className="px-4 py-3">Contractor / Client</th>
                <th className="px-4 py-3">Remarks & Proof</th>
                <th className="px-5 py-3 text-right">Clearance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {pendingPayments.map((p) => {
                const sale = sales.find((s) => s.id === p.salesId);
                const cust = sale ? customers.find((c) => c.id === sale.customerId) : null;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors bg-amber-50/20">
                    <td className="px-5 py-3 font-mono font-bold text-slate-900">{p.reference}</td>
                    <td className="px-4 py-3 text-slate-500">{p.date}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                        {p.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-black text-emerald-700 text-sm">
                      {formatPHP(p.amount)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                      {sale?.invoiceNo || 'N/A'}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{cust?.name || 'Walk-In'}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={p.notes}>
                      {p.notes || 'Awaiting bank reconciliation'}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            verifyPayment(p.id);
                            showToast(`Payment ${p.reference} approved and cleared!`);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Clear</span>
                        </button>

                        <button
                          onClick={() => {
                            rejectPayment(p.id);
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {pendingPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                    <p className="font-bold text-slate-800">No Pending Payment Verifications</p>
                    <p className="text-xs text-slate-400">All customer bank deposits and mobile wallet receipts are up to date.</p>
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
