import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ClipboardList, Search, Trash2 } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { auditLogs, deleteAuditLog, bulkDeleteAuditLogs, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((a) => {
      const matchSearch =
        !searchTerm.trim() ||
        a.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.referenceId && a.referenceId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchModule = moduleFilter === 'ALL' || a.module === moduleFilter;

      return matchSearch && matchModule;
    });
  }, [auditLogs, searchTerm, moduleFilter]);

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredLogs.map((l) => l.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    bulkDeleteAuditLogs(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail by user, action, details, reference ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700"
          >
            <option value="ALL">All Modules</option>
            <option value="AUTH">Authentication & Users</option>
            <option value="SALES">Sales & POS</option>
            <option value="INVENTORY">Inventory & Stock</option>
            <option value="PAYMENTS">Payments</option>
            <option value="DELIVERY">Delivery</option>
            <option value="RENTALS">Rentals & Equipment</option>
            <option value="PURCHASE">Procurement</option>
            <option value="SYSTEM">System & Settings</option>
          </select>
        </div>

        {selectedIds.size > 0 && currentUser?.role === 'ADMIN' && (
          <button
            onClick={handleBulkDelete}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
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
                {currentUser?.role === 'ADMIN' && (
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={filteredLogs.length > 0 && selectedIds.size === filteredLogs.length}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                  </th>
                )}
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-4 py-3">User Operator</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Action Type</th>
                <th className="px-4 py-3">Audit Details</th>
                <th className="px-5 py-3">Reference ID</th>
                {currentUser?.role === 'ADMIN' && (
                  <th className="px-4 py-3 text-right">Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map((log) => {
                const isSelected = selectedIds.has(log.id);

                return (
                  <tr
                    key={log.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isSelected ? 'bg-amber-50/50' : ''
                    }`}
                  >
                    {currentUser?.role === 'ADMIN' && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelect(log.id, e.target.checked)}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                      </td>
                    )}
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-PH', {
                        dateStyle: 'medium',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                      {log.user}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-md truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {log.referenceId || '—'}
                    </td>
                    {currentUser?.role === 'ADMIN' && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => deleteAuditLog(log.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete log"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={currentUser?.role === 'ADMIN' ? 8 : 6} className="py-12 text-center text-slate-400">
                    <ClipboardList className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No audit events found</p>
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
