import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StockMovementType } from '../../types';
import {
  History,
  Search,
  Download,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';

export const InventoryHistoryView: React.FC = () => {
  const { stockMovements, deleteStockMovement, bulkDeleteStockMovements } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredMovements = useMemo(() => {
    return stockMovements.filter((m) => {
      const matchSearch =
        !searchTerm.trim() ||
        (m.productName && m.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.reason && m.reason.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.referenceId && m.referenceId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.user && m.user.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = typeFilter === 'ALL' || m.type === typeFilter;

      return matchSearch && matchType;
    });
  }, [stockMovements, searchTerm, typeFilter]);

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredMovements.map((m) => m.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    bulkDeleteStockMovements(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleExportCSV = () => {
    const headers = ['Movement ID', 'Timestamp', 'Type', 'Product', 'Quantity', 'Unit', 'From Bay', 'To Bay', 'Reason', 'User'];
    const rows = filteredMovements.map((m) => [
      m.id,
      m.createdAt,
      m.type,
      `"${m.productName || 'N/A'}"`,
      m.qty,
      m.unit,
      `"${m.fromLocation || ''}"`,
      `"${m.toLocation || ''}"`,
      `"${m.reason.replace(/"/g, '""')}"`,
      `"${m.user}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `A26_Inventory_Movements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadge = (type: StockMovementType) => {
    if (type === 'IN') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
          <ArrowDownToLine className="w-3 h-3" />
          <span>IN (+)</span>
        </span>
      );
    }
    if (type === 'OUT') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
          <ArrowUpFromLine className="w-3 h-3" />
          <span>OUT (-)</span>
        </span>
      );
    }
    if (type === 'TRANSFER') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
          <ArrowLeftRight className="w-3 h-3" />
          <span>TRANSFER</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
        <SlidersHorizontal className="w-3 h-3" />
        <span>ADJUSTMENT</span>
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search movements by product, reason, reference, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700"
          >
            <option value="ALL">All Types</option>
            <option value="IN">Stock In (+)</option>
            <option value="OUT">Stock Out (-)</option>
            <option value="TRANSFER">Transfer</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={filteredMovements.length > 0 && selectedIds.size === filteredMovements.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                </th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Material / Product</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3">Location Route</th>
                <th className="px-4 py-3">Reason / Reference</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMovements.map((m) => {
                const isSelected = selectedIds.has(m.id);

                return (
                  <tr
                    key={m.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isSelected ? 'bg-amber-50/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelect(m.id, e.target.checked)}
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(m.createdAt).toLocaleString('en-PH', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{getBadge(m.type)}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 max-w-xs truncate">
                      {m.productName || 'Unspecified'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {m.type === 'OUT' ? '-' : m.type === 'IN' ? '+' : ''}
                      {m.qty} {m.unit}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {m.fromLocation ? m.fromLocation : '—'} ➔ {m.toLocation ? m.toLocation : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-sm truncate" title={m.reason}>
                      {m.reason}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                      {m.user}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => deleteStockMovement(m.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete log entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No inventory movements found</p>
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
