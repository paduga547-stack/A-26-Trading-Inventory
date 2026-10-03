import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Equipment, MaintenanceStatus, EquipmentCondition } from '../../types';
import { Modal } from '../common/Modal';
import { Hammer, Wrench, CheckCircle2, AlertCircle } from 'lucide-react';

export const MaintenanceView: React.FC = () => {
  const { equipment, updateEquipment, showToast } = useApp();

  const [selectedEq, setSelectedEq] = useState<Equipment | null>(null);
  const [newStatus, setNewStatus] = useState<MaintenanceStatus>('MAINTENANCE');
  const [newCondition, setNewCondition] = useState<EquipmentCondition>('GOOD');
  const [maintenanceNotes, setMaintenanceNotes] = useState('');

  const handleOpenMaintenanceModal = (eq: Equipment) => {
    setSelectedEq(eq);
    setNewStatus(eq.maintenanceStatus === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE');
    setNewCondition(eq.condition);
    setMaintenanceNotes(eq.notes || '');
  };

  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEq) return;

    updateEquipment(selectedEq.id, {
      maintenanceStatus: newStatus,
      condition: newCondition,
      notes: maintenanceNotes,
    });

    showToast(`Updated maintenance status for ${selectedEq.name} to ${newStatus}`);
    setSelectedEq(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Hammer className="w-4 h-4 text-amber-600" />
          <span>Machinery Maintenance & Repair Operations</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Schedule equipment tune-ups, track downtime, and ensure machinery safety before dispatching to contractor job sites.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Asset Code</th>
                <th className="px-4 py-3">Equipment Machinery</th>
                <th className="px-4 py-3">Physical Condition</th>
                <th className="px-4 py-3 text-center">Current Status</th>
                <th className="px-4 py-3">Maintenance & Repair Remarks</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {equipment.map((eq) => {
                const isUnderMaintenance = eq.maintenanceStatus === 'MAINTENANCE';

                return (
                  <tr
                    key={eq.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isUnderMaintenance ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="px-5 py-3 font-mono font-bold text-slate-900">{eq.code}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{eq.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {eq.condition}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          eq.maintenanceStatus === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : eq.maintenanceStatus === 'RENTED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-rose-100 text-rose-800 animate-pulse'
                        }`}
                      >
                        {eq.maintenanceStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-sm truncate" title={eq.notes}>
                      {eq.notes || 'Routine readiness check'}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenMaintenanceModal(eq)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ml-auto ${
                          isUnderMaintenance
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        {isUnderMaintenance ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Ready / Available</span>
                          </>
                        ) : (
                          <>
                            <Wrench className="w-3.5 h-3.5" />
                            <span>Send to Shop Maintenance</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance Update Modal */}
      <Modal
        isOpen={!!selectedEq}
        onClose={() => setSelectedEq(null)}
        title={`Maintenance Operation: ${selectedEq?.name}`}
        subtitle={`Asset Code: ${selectedEq?.code}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveMaintenance} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Readiness Status *
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as MaintenanceStatus)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-bold"
            >
              <option value="AVAILABLE">AVAILABLE (Passed Inspection / Ready to Rent)</option>
              <option value="MAINTENANCE">MAINTENANCE (Under Repair / In Service Bay)</option>
              <option value="RENTED">RENTED (Deployed on Job Site)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Physical Condition Rating *
            </label>
            <select
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value as EquipmentCondition)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="NEW">NEW</option>
              <option value="EXCELLENT">EXCELLENT</option>
              <option value="GOOD">GOOD</option>
              <option value="FAIR">FAIR</option>
              <option value="POOR">POOR</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Repair & Service Notes *
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Changed engine motor oil, replaced carburetor gasket, cleaned spark plug"
              value={maintenanceNotes}
              onChange={(e) => setMaintenanceNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedEq(null)}
              className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-lg shadow-xs"
            >
              Save Maintenance Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
