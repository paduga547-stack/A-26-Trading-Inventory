import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Rental, Equipment, EquipmentCondition } from '../../types';
import { Modal } from '../common/Modal';
import {
  CalendarDays,
  Plus,
  Undo2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  DollarSign,
  Trash2,
} from 'lucide-react';

export const RentalsView: React.FC = () => {
  const {
    rentals,
    equipment,
    customers,
    projects,
    createRental,
    returnRental,
    deleteRental,
    bulkDeleteRentals,
    settings,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'RETURNED'>('ACTIVE');
  const [isNewRentalOpen, setIsNewRentalOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState<Rental | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // New rental form
  const availableEquipment = equipment.filter((e) => e.maintenanceStatus === 'AVAILABLE');
  const [equipmentId, setEquipmentId] = useState(availableEquipment[0]?.id || equipment[0]?.id || '');
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [projectId, setProjectId] = useState('');
  const [qty, setQty] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [conditionNotes, setConditionNotes] = useState('Standard accessories and oil checked');

  // Return inspection form
  const [returnCondition, setReturnCondition] = useState<EquipmentCondition>('GOOD');
  const [engineNotes, setEngineNotes] = useState('Engine starts smoothly, oil clean');
  const [bodyNotes, setBodyNotes] = useState('No structural dents or bent frames');
  const [accessoriesNotes, setAccessoriesNotes] = useState('All accessories and cables returned');
  const [damageNotes, setDamageNotes] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState<number>(0);

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const selectedEqForNew = equipment.find((e) => e.id === equipmentId);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
  const estimatedRentTotal = (selectedEqForNew?.rate || 0) * durationDays * qty;
  const estimatedVat = Math.round(estimatedRentTotal * (settings.vatRate / 100) * 100) / 100;
  const estimatedDeposit = (selectedEqForNew?.depositAmount || 0) * qty;

  const handleCreateRental = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentId || !customerId) return;
    createRental({
      equipmentId,
      customerId,
      projectId: projectId || null,
      qty,
      startDate,
      endDate,
      conditionNotes,
    });
    setIsNewRentalOpen(false);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnTarget) return;

    returnRental(returnTarget.id, {
      condition: returnCondition,
      engine: engineNotes,
      body: bodyNotes,
      accessories: accessoriesNotes,
      damageNotes: damageNotes.trim() || undefined,
      additionalCharges: Number(additionalCharges) || 0,
    });

    setReturnTarget(null);
  };

  const activeRentals = rentals.filter((r) => r.status === 'ACTIVE' || r.status === 'OVERDUE');
  const returnedRentals = rentals.filter((r) => r.status === 'RETURNED');

  return (
    <div className="space-y-4">
      {/* Top Banner and Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'ACTIVE'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active Contracts ({activeRentals.length})
            </button>
            <button
              onClick={() => setActiveTab('RETURNED')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'RETURNED'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Returned History ({returnedRentals.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={() => {
                bulkDeleteRentals(Array.from(selectedIds));
                setSelectedIds(new Set());
              }}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Delete ({selectedIds.size})</span>
            </button>
          )}

          <button
            onClick={() => {
              if (availableEquipment.length === 0) {
                showToast('No machinery is currently AVAILABLE in fleet', 'warning');
              }
              setIsNewRentalOpen(true);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Machinery Rental Contract</span>
          </button>
        </div>
      </div>

      {/* Active Rentals Table */}
      {activeTab === 'ACTIVE' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={activeRentals.length > 0 && selectedIds.size === activeRentals.length}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(new Set(activeRentals.map((r) => r.id)));
                        else setSelectedIds(new Set());
                      }}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                  </th>
                  <th className="px-5 py-3">Rental #</th>
                  <th className="px-4 py-3">Machinery / Equipment</th>
                  <th className="px-4 py-3">Customer / Contractor</th>
                  <th className="px-4 py-3">Project Site</th>
                  <th className="px-4 py-3">Contract Dates</th>
                  <th className="px-4 py-3 text-right">Rental Total</th>
                  <th className="px-4 py-3 text-right">Security Deposit</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {activeRentals.map((r) => {
                  const eq = equipment.find((e) => e.id === r.equipmentId);
                  const cust = customers.find((c) => c.id === r.customerId);
                  const proj = projects.find((p) => p.id === r.projectId);
                  const isOverdue = r.status === 'OVERDUE';
                  const isSelected = selectedIds.has(r.id);

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isOverdue ? 'bg-rose-50/30' : ''
                      } ${isSelected ? 'bg-amber-50/40' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const next = new Set(selectedIds);
                            if (e.target.checked) next.add(r.id);
                            else next.delete(r.id);
                            setSelectedIds(next);
                          }}
                          className="rounded text-amber-500 focus:ring-amber-500"
                        />
                      </td>
                      <td className="px-5 py-3 font-mono font-bold text-slate-900">{r.rentalNo}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{eq?.name || 'Equipment'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Asset ID: {eq?.code}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{cust?.name || 'Contractor'}</td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-[130px]">{proj?.name || 'Direct Job Site'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-slate-800 font-medium">
                          {r.startDate} ➔ {r.endDate}
                        </div>
                        <div className={`text-[10px] font-mono ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                          {r.duration} day(s) {isOverdue && '⚠️ OVERDUE'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatPHP(r.total)}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700 font-bold">{formatPHP(r.securityDeposit)}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isOverdue
                              ? 'bg-rose-500 text-white animate-pulse'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setReturnTarget(r);
                              setReturnCondition('GOOD');
                              setAdditionalCharges(0);
                              setDamageNotes('');
                            }}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1.5"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            <span>Process Return</span>
                          </button>
                          <button
                            onClick={() => deleteRental(r.id)}
                            title="Delete Rental"
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {activeRentals.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <CalendarDays className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-600">No active equipment rentals</p>
                      <p className="text-xs text-slate-400">All machinery is safely stored in warehouse fleet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Returned History Table */}
      {activeTab === 'RETURNED' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Contract #</th>
                  <th className="px-4 py-3">Machinery</th>
                  <th className="px-4 py-3">Contractor</th>
                  <th className="px-4 py-3 text-right">Rental Total</th>
                  <th className="px-4 py-3 text-right">Damage / Charges</th>
                  <th className="px-4 py-3 text-right">Deposit Refunded</th>
                  <th className="px-4 py-3">Return Condition & Damage Notes</th>
                  <th className="px-5 py-3 text-right">Actual Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {returnedRentals.map((r) => {
                  const eq = equipment.find((e) => e.id === r.equipmentId);
                  const cust = customers.find((c) => c.id === r.customerId);

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-slate-900">{r.rentalNo}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{eq?.name || 'Equipment'}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{cust?.name || 'Contractor'}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatPHP(r.total)}</td>
                      <td className="px-4 py-3 text-right font-mono text-rose-600 font-bold">
                        {r.additionalCharges > 0 ? formatPHP(r.additionalCharges) : 'None'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-700 font-bold">
                        {formatPHP(r.depositRefunded ?? r.securityDeposit)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {r.damageNotes ? (
                          <span className="text-rose-700 font-semibold">{r.damageNotes}</span>
                        ) : (
                          <span className="text-emerald-700">✓ Returned in operational condition</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-500 whitespace-nowrap">
                        {r.actualReturnDate || r.endDate}
                      </td>
                    </tr>
                  );
                })}

                {returnedRentals.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No returned equipment records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Rental Modal */}
      <Modal
        isOpen={isNewRentalOpen}
        onClose={() => setIsNewRentalOpen(false)}
        title="Create Machinery Rental Contract"
        subtitle="Reserve machinery, calculate deposit, and record dispatch condition"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateRental} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Select Fleet Machinery *
              </label>
              <select
                value={equipmentId}
                onChange={(e) => setEquipmentId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-semibold"
              >
                {equipment.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} [{e.code}] — {formatPHP(e.rate)}/{e.rentalUnit} ({e.maintenanceStatus})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Contractor / Customer *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Destination Construction Site (Optional)
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="">No Project (Direct Contractor Dispatch)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.address}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Dispatch Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Expected Return Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Pricing Estimation Snapshot */}
          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Rental Duration</span>
              <div className="font-mono font-black text-slate-900 mt-0.5">{durationDays} Day(s)</div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Rental Fee (+VAT)</span>
              <div className="font-mono font-black text-amber-700 mt-0.5">
                {formatPHP(estimatedRentTotal + estimatedVat)}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Required Deposit</span>
              <div className="font-mono font-black text-emerald-700 mt-0.5">
                {formatPHP(estimatedDeposit)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Pre-Dispatch Inspection Remarks
            </label>
            <input
              type="text"
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsNewRentalOpen(false)}
              className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-lg shadow-xs"
            >
              Confirm Rental Dispatch
            </button>
          </div>
        </form>
      </Modal>

      {/* Return Inspection Modal */}
      <Modal
        isOpen={!!returnTarget}
        onClose={() => setReturnTarget(null)}
        title={`Process Equipment Return: ${returnTarget?.rentalNo}`}
        subtitle="Inspect machine condition, assess damage charges, and refund remaining security deposit"
        maxWidth="2xl"
      >
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400">Security Deposit Held:</span>
              <div className="font-mono font-black text-emerald-700 text-sm">
                {formatPHP(returnTarget?.securityDeposit || 0)}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Contract Total:</span>
              <div className="font-mono font-bold text-slate-900 text-sm">
                {formatPHP(returnTarget?.total || 0)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Post-Return Overall Condition *
              </label>
              <select
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value as EquipmentCondition)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-semibold"
              >
                <option value="EXCELLENT">EXCELLENT (Like New)</option>
                <option value="GOOD">GOOD (Normal Wear)</option>
                <option value="FAIR">FAIR (Noticeable Scuffs)</option>
                <option value="POOR">POOR (Damaged / Needs Shop Service)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Damage / Penalty Charges (PHP)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={additionalCharges}
                onChange={(e) => setAdditionalCharges(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-rose-300 rounded-lg text-rose-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Engine Status</label>
              <input
                type="text"
                value={engineNotes}
                onChange={(e) => setEngineNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Body / Chassis</label>
              <input
                type="text"
                value={bodyNotes}
                onChange={(e) => setBodyNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Accessories Check</label>
              <input
                type="text"
                value={accessoriesNotes}
                onChange={(e) => setAccessoriesNotes(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Damage Assessment & Specifics (if any)
            </label>
            <input
              type="text"
              placeholder="e.g. Broken poker hose clamp, dented mixer drum shield"
              value={damageNotes}
              onChange={(e) => setDamageNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          {/* Refund Calculation */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-900">
              Net Deposit Refund to Customer:
            </span>
            <span className="font-mono font-black text-emerald-700 text-base">
              {formatPHP(Math.max(0, (returnTarget?.securityDeposit || 0) - additionalCharges))}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setReturnTarget(null)}
              className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-lg shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete Return & Refund</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
