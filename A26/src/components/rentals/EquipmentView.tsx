import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Equipment, EquipmentCondition, MaintenanceStatus } from '../../types';
import { Modal } from '../common/Modal';
import { Wrench, Plus, Edit2, Trash2 } from 'lucide-react';

export const EquipmentView: React.FC = () => {
  const { equipment, createEquipment, updateEquipment, deleteEquipment, bulkDeleteEquipment } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [condition, setCondition] = useState<EquipmentCondition>('GOOD');
  const [rentalUnit, setRentalUnit] = useState('DAY');
  const [rate, setRate] = useState<number>(1000);
  const [depositAmount, setDepositAmount] = useState<number>(3000);
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus>('AVAILABLE');
  const [notes, setNotes] = useState('');

  const openCreateModal = () => {
    setEditingEquipment(null);
    setName('');
    setCode(`EQP-${Date.now().toString().slice(-4)}`);
    setCondition('GOOD');
    setRentalUnit('DAY');
    setRate(1200);
    setDepositAmount(4000);
    setMaintenanceStatus('AVAILABLE');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (eq: Equipment) => {
    setEditingEquipment(eq);
    setName(eq.name);
    setCode(eq.code);
    setCondition(eq.condition);
    setRentalUnit(eq.rentalUnit);
    setRate(eq.rate);
    setDepositAmount(eq.depositAmount);
    setMaintenanceStatus(eq.maintenanceStatus);
    setNotes(eq.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingEquipment) {
      updateEquipment(editingEquipment.id, {
        name,
        code,
        condition,
        rentalUnit,
        rate: Number(rate) || 0,
        depositAmount: Number(depositAmount) || 0,
        maintenanceStatus,
        notes,
      });
    } else {
      createEquipment({
        name,
        code: code || `EQP-${Date.now().toString().slice(-4)}`,
        condition,
        rentalUnit,
        rate: Number(rate) || 0,
        depositAmount: Number(depositAmount) || 0,
        maintenanceStatus,
        notes,
      });
    }
    setIsModalOpen(false);
  };

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(equipment.map((e) => e.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    bulkDeleteEquipment(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStatusBadge = (ms: MaintenanceStatus) => {
    if (ms === 'AVAILABLE') {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">AVAILABLE</span>;
    }
    if (ms === 'RENTED') {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">ON SITE / RENTED</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">MAINTENANCE</span>;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-600" />
            <span>Heavy Machinery &amp; Rental Fleet Registry ({equipment.length})</span>
          </h3>
          <p className="text-xs text-slate-500">
            Concrete mixers, vibrators, generators, jackhammers, compactors, and scaffolding
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Delete ({selectedIds.size})</span>
            </button>
          )}

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Machinery</span>
          </button>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={equipment.length > 0 && selectedIds.size === equipment.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                </th>
                <th className="px-4 py-3">Asset Code</th>
                <th className="px-4 py-3">Equipment Name</th>
                <th className="px-4 py-3">Physical Condition</th>
                <th className="px-4 py-3">Rental Unit</th>
                <th className="px-4 py-3 text-right">Daily Rate (PHP)</th>
                <th className="px-4 py-3 text-right">Security Deposit</th>
                <th className="px-4 py-3 text-center">Availability Status</th>
                <th className="px-4 py-3">Maintenance Remarks</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {equipment.map((eq) => {
                const isSelected = selectedIds.has(eq.id);

                return (
                  <tr key={eq.id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-amber-50/40' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelect(eq.id, e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{eq.code}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{eq.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {eq.condition}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-600">{eq.rentalUnit}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatPHP(eq.rate)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600 font-semibold">
                      {formatPHP(eq.depositAmount)}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {getStatusBadge(eq.maintenanceStatus)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={eq.notes}>
                      {eq.notes || '—'}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(eq)}
                          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteEquipment(eq.id)}
                          className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Equipment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {equipment.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Wrench className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-40" />
                    <p className="font-semibold text-slate-600">No machinery registered in fleet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEquipment ? `Edit: ${editingEquipment.name}` : 'Register Machinery'}
        subtitle="Catalog heavy equipment, mixer specs, and rental rates"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Equipment Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. One-Bagger Concrete Mixer (7HP Robin Engine)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Asset Code *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Physical Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as EquipmentCondition)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="NEW">Brand New</option>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good / Serviceable</option>
                <option value="FAIR">Fair (Needs Monitoring)</option>
                <option value="POOR">Poor (Overhaul Required)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Rental Unit
              </label>
              <input
                type="text"
                value={rentalUnit}
                onChange={(e) => setRentalUnit(e.target.value)}
                placeholder="DAY"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Rate / Unit (₱)
              </label>
              <input
                type="number"
                min="0"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Security Deposit
              </label>
              <input
                type="number"
                min="0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Availability Status
            </label>
            <select
              value={maintenanceStatus}
              onChange={(e) => setMaintenanceStatus(e.target.value as MaintenanceStatus)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="AVAILABLE">Available for Rent</option>
              <option value="RENTED">Currently On-Site (Rented)</option>
              <option value="MAINTENANCE">Under Repair / Maintenance</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Maintenance Remarks / Engine Spec
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Robin EY20 engine, 400L drum capacity, oil changed 2026"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs"
            >
              Save Machinery
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
