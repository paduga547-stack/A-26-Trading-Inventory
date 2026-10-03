import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee } from '../../types';
import { Modal } from '../common/Modal';
import { Users2, Plus, Trash2, Phone, Briefcase } from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const { employees, createEmployee, deleteEmployee, bulkDeleteEmployees, showToast } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [position, setPosition] = useState<Employee['position']>('Driver');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<Employee['status']>('ACTIVE');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createEmployee({
      name,
      position,
      phone: phone.trim() || '0900-000-0000',
      status,
    });

    setName('');
    setPhone('');
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
      setSelectedIds(new Set(employees.map((e) => e.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    bulkDeleteEmployees(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users2 className="w-4 h-4 text-amber-600" />
            <span>Personnel &amp; Logistics Staff Directory ({employees.length})</span>
          </h3>
          <p className="text-xs text-slate-500">
            Truck drivers, warehouse dispatchers, equipment mechanics, and sales cashiers
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
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {employees.length > 0 && (
        <div className="flex items-center gap-2 px-1 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={selectedIds.size === employees.length && employees.length > 0}
            onChange={(e) => toggleSelectAll(e.target.checked)}
            className="rounded text-amber-500 focus:ring-amber-500"
            id="select-all-emp"
          />
          <label htmlFor="select-all-emp" className="cursor-pointer font-medium">
            Select All Personnel ({employees.length})
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {employees.map((emp) => {
          const isSelected = selectedIds.has(emp.id);

          return (
            <div
              key={emp.id}
              className={`bg-white rounded-xl border p-5 flex flex-col justify-between transition-all ${
                isSelected
                  ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/20'
                  : 'border-slate-200 hover:border-amber-300 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => toggleSelect(emp.id, e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </div>

                  <button
                    onClick={() => deleteEmployee(emp.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 cursor-pointer"
                    title="Remove Employee"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mt-2">{emp.name}</h4>
                <div className="text-xs text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
                  <Briefcase className="w-3 h-3" />
                  <span>{emp.position}</span>
                </div>

                <div className="mt-3 text-xs text-slate-600 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{emp.phone}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
                <span>Staff ID: {emp.id}</span>
                <span>Hired: {emp.createdAt}</span>
              </div>
            </div>
          );
        })}

        {employees.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            <Users2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-bold text-slate-700">No personnel records registered</p>
            <p className="text-xs text-slate-400 mt-0.5">Click &quot;Add Employee&quot; above to register drivers, clerks, and mechanics.</p>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Personnel / Staff"
        subtitle="Register driver, logistics personnel, or warehouse worker"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pedro Santos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Position / Department Role *
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as Employee['position'])}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="Driver">Company Truck Driver</option>
              <option value="Warehouse Staff">Warehouse / Stockman Staff</option>
              <option value="Sales Clerk">Sales / POS Clerk</option>
              <option value="Cashier">Cashier</option>
              <option value="Mechanic">Equipment Fleet Mechanic</option>
              <option value="Manager">Operations Manager</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Mobile Contact Number
            </label>
            <input
              type="text"
              placeholder="e.g. 0917-889-1001"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Employment Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Employee['status'])}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="ACTIVE">Active Employment</option>
              <option value="INACTIVE">Inactive / On Leave</option>
            </select>
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
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-xs"
            >
              Save Employee
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
