import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Ban, FileX, Trash2 } from 'lucide-react';

export const VoidedSalesView: React.FC = () => {
  const { sales, customers, projects, deleteSale, bulkDeleteSales } = useApp();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const voidedSales = sales.filter((s) => s.status === 'VOIDED');

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(voidedSales.map((s) => s.id)));
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
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Ban className="w-4 h-4 text-rose-600" />
            <span>Voided Sales Register ({voidedSales.length})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Audited log of all canceled invoices. Inventory items for these sales have been automatically returned to warehouse bins.
          </p>
        </div>

        {selectedIds.size > 0 && (
          <button
            onClick={handleBulkDelete}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-center shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected ({selectedIds.size})</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={voidedSales.length > 0 && selectedIds.size === voidedSales.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                </th>
                <th className="px-4 py-3">Voided Invoice #</th>
                <th className="px-4 py-3">Original Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3 text-right">Voided Amount</th>
                <th className="px-4 py-3">Reason for Void</th>
                <th className="px-4 py-3">Authorized By</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {voidedSales.map((s) => {
                const cust = customers.find((c) => c.id === s.customerId);
                const proj = projects.find((p) => p.id === s.projectId);
                const isSelected = selectedIds.has(s.id);

                return (
                  <tr
                    key={s.id}
                    className={`hover:bg-slate-50/70 transition-colors bg-rose-50/20 ${
                      isSelected ? 'bg-amber-50/60' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelect(s.id, e.target.checked)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-rose-700 line-through">
                      {s.invoiceNo}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{cust?.name || 'Walk-In'}</td>
                    <td className="px-4 py-3 text-slate-500">{proj?.name || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                      {formatPHP(s.total)}
                    </td>
                    <td className="px-4 py-3 text-rose-800 font-medium">
                      {s.voidedReason || 'No reason specified'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">
                      {s.voidedBy || 'Administrator'}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          deleteSale(s.id);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete voided record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {voidedSales.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileX className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No voided transactions</p>
                    <p className="text-xs text-slate-400">All registered sales invoices are active and verified.</p>
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
