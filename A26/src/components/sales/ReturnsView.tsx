import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import { Modal } from '../common/Modal';
import { Undo2, Search, CheckCircle, Package } from 'lucide-react';

export const ReturnsView: React.FC = () => {
  const { sales, customers, processReturn, showToast } = useApp();

  const [searchInvoice, setSearchInvoice] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  // Return item quantities & restock option
  const [returnItems, setReturnItems] = useState<{ productId: string; qty: number; restock: boolean }[]>([]);
  const [reason, setReason] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>(0);

  const handleSelectSale = (sale: Sale) => {
    setSelectedSale(sale);
    setReturnItems(
      sale.items.map((i) => ({
        productId: i.productId,
        qty: 0,
        restock: true,
      }))
    );
    setReason('');
    setRefundAmount(0);
  };

  const updateItemQty = (productId: string, qty: number) => {
    setReturnItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, qty } : item))
    );

    // Auto-calculate suggested refund
    if (selectedSale) {
      let total = 0;
      selectedSale.items.forEach((line) => {
        if (line.productId === productId) {
          total += qty * line.unitPrice;
        } else {
          const other = returnItems.find((x) => x.productId === line.productId);
          if (other) total += other.qty * line.unitPrice;
        }
      });
      setRefundAmount(Math.round(total * 1.12 * 100) / 100);
    }
  };

  const updateItemRestock = (productId: string, restock: boolean) => {
    setReturnItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, restock } : item))
    );
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;
    const itemsToReturn = returnItems.filter((i) => i.qty > 0);
    if (itemsToReturn.length === 0) {
      showToast('Select at least one item quantity to return!', 'error');
      return;
    }

    processReturn(selectedSale.id, itemsToReturn, refundAmount, reason || 'Customer return');
    setSelectedSale(null);
  };

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const eligibleSales = sales.filter((s) => {
    if (s.status === 'VOIDED') return false;
    if (!searchInvoice.trim()) return true;
    return s.invoiceNo.toLowerCase().includes(searchInvoice.toLowerCase());
  });

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Undo2 className="w-4 h-4 text-amber-600" />
          <span>Process Customer Material Return</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Search for the original sales invoice to select returned items and credit customer or refund cash.
        </p>

        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice number to return (e.g. INV-2026-0001)..."
            value={searchInvoice}
            onChange={(e) => setSearchInvoice(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
      </div>

      {/* Eligible Invoices List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Recent Invoices Available for Returns
          </h4>
        </div>
        <div className="divide-y divide-slate-100">
          {eligibleSales.slice(0, 10).map((s) => {
            const cust = customers.find((c) => c.id === s.customerId);
            return (
              <div key={s.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-900">{s.invoiceNo}</span>
                    <span className="text-xs text-slate-500">
                      • {new Date(s.createdAt).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium mt-0.5">
                    {cust?.name || 'Walk-In'} • Total: <span className="font-bold text-slate-900">{formatPHP(s.total)}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {s.items.map((i) => `${i.qty} ${i.unit} ${i.productName}`).join(', ')}
                  </div>
                </div>

                <button
                  onClick={() => handleSelectSale(s)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1.5"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Select Items to Return</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Return Items Modal */}
      <Modal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title={`Process Return for Invoice ${selectedSale?.invoiceNo}`}
        subtitle="Select returned quantities and whether materials can be safely restocked into inventory."
        maxWidth="2xl"
      >
        <form onSubmit={handleConfirmReturn} className="space-y-4">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2">Item Description</th>
                  <th className="px-3 py-2 text-right">Sold Qty</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                  <th className="px-3 py-2 text-center w-28">Return Qty</th>
                  <th className="px-3 py-2 text-center">Restock?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedSale?.items.map((item) => {
                  const state = returnItems.find((x) => x.productId === item.productId);
                  return (
                    <tr key={item.productId}>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {item.productName}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-500">
                        {item.qty} {item.unit}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-600">
                        {formatPHP(item.unitPrice)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max={item.qty}
                          value={state?.qty || 0}
                          onChange={(e) => updateItemQty(item.productId, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-center font-mono font-bold text-xs border border-slate-300 rounded"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <label className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={state?.restock ?? true}
                            onChange={(e) => updateItemRestock(item.productId, e.target.checked)}
                            className="rounded text-amber-500"
                          />
                          <span className="text-[10px] font-semibold text-slate-600">Restock Bay</span>
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Refund Amount (PHP) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={refundAmount}
                onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg text-emerald-700"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Reason for Return *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Excess job site surplus, wrong diameter bar requested"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedSale(null)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-lg flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm Return & Refund</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
