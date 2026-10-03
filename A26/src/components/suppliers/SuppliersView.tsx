import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Supplier } from '../../types';
import { Modal } from '../common/Modal';
import { Building2, Plus, Edit2, Phone, Mail, MapPin, Trash2 } from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const { suppliers, createSupplier, updateSupplier, deleteSupplier, bulkDeleteSuppliers } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<Supplier['status']>('ACTIVE');

  const openCreateModal = () => {
    setEditingSupplier(null);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setContactPerson(s.contactPerson);
    setPhone(s.phone);
    setEmail(s.email);
    setAddress(s.address);
    setStatus(s.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        name,
        contactPerson,
        phone,
        email,
        address,
        status,
      });
    } else {
      createSupplier({
        name,
        contactPerson,
        phone,
        email,
        address,
        status,
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
      setSelectedIds(new Set(suppliers.map((s) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    bulkDeleteSuppliers(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>Vendors &amp; Fuel Suppliers Directory ({suppliers.length})</span>
          </h3>
          <p className="text-xs text-slate-500">
            Approved manufacturing mills, aggregate quarries, cement plants, and gasoline fuel stations
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
            <span>Add New Vendor / Station</span>
          </button>
        </div>
      </div>

      {suppliers.length > 0 && (
        <div className="flex items-center gap-2 px-1 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={selectedIds.size === suppliers.length && suppliers.length > 0}
            onChange={(e) => toggleSelectAll(e.target.checked)}
            className="rounded text-amber-500 focus:ring-amber-500"
            id="select-all-sup"
          />
          <label htmlFor="select-all-sup" className="cursor-pointer font-medium">
            Select All Vendors ({suppliers.length})
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((sup) => {
          const isSelected = selectedIds.has(sup.id);

          return (
            <div
              key={sup.id}
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
                      onChange={(e) => toggleSelect(sup.id, e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        sup.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {sup.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(sup)}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                      title="Edit Vendor"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteSupplier(sup.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 cursor-pointer"
                      title="Delete Vendor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mt-2">{sup.name}</h4>
                <div className="text-xs text-amber-600 font-medium">Attn: {sup.contactPerson}</div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sup.phone}</span>
                  </div>
                  {sup.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{sup.email}</span>
                    </div>
                  )}
                  {sup.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-slate-500">{sup.address}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
                <span>ID: {sup.id}</span>
                <span>Added: {sup.createdAt}</span>
              </div>
            </div>
          );
        })}

        {suppliers.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-bold text-slate-700">No suppliers or fuel stations registered</p>
            <p className="text-xs text-slate-400 mt-0.5">Click &quot;Add New Vendor / Station&quot; above to create one.</p>
          </div>
        )}
      </div>

      {/* Supplier Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? 'Edit Vendor / Supplier' : 'Add New Vendor / Fuel Station'}
        subtitle="Manage contact details and business directory information"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Company / Vendor Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Petron Gas Depot / Steel Asia Inc"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Contact Person / Sales Executive *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Juan Perez (Branch Manager)"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                Phone *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 0917-123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Supplier['status'])}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. sales@vendor.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Plant / Depot / Station Address
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Km 28 Aguinaldo Highway, Dasmariñas, Cavite"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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
              Save Vendor
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
