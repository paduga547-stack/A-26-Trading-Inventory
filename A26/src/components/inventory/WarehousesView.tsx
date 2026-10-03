import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Warehouse } from '../../types';
import { Modal } from '../common/Modal';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  User,
  Package,
  Layers,
  Building,
  CheckCircle,
  Clock,
} from 'lucide-react';

export const WarehousesView: React.FC = () => {
  const { warehouses, products, createWarehouse, updateWarehouse, deleteWarehouse, bulkDeleteWarehouses } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<'MAIN' | 'BRANCH' | 'OPEN_YARD' | 'DEPOT'>('BRANCH');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [notes, setNotes] = useState('');

  const openCreateModal = () => {
    setEditingWarehouse(null);
    const nextNum = warehouses.length + 1;
    setCode(`WH-${nextNum.toString().padStart(2, '0')}`);
    setName('');
    setAddress('');
    setType('BRANCH');
    setContactPerson('');
    setContactPhone('');
    setStatus('ACTIVE');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (wh: Warehouse) => {
    setEditingWarehouse(wh);
    setCode(wh.code);
    setName(wh.name);
    setAddress(wh.address);
    setType(wh.type);
    setContactPerson(wh.contactPerson || '');
    setContactPhone(wh.contactPhone || '');
    setStatus(wh.status);
    setNotes(wh.notes || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    if (editingWarehouse) {
      updateWarehouse(editingWarehouse.id, {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        address: address.trim(),
        type,
        contactPerson: contactPerson.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        status,
        notes: notes.trim() || undefined,
      });
    } else {
      createWarehouse({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        address: address.trim(),
        type,
        contactPerson: contactPerson.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        status,
        notes: notes.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredWarehouses.map((w) => w.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    bulkDeleteWarehouses(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const filteredWarehouses = warehouses.filter((wh) => {
    const matchesSearch =
      wh.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wh.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wh.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wh.contactPerson && wh.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'ALL' || wh.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (t: string) => {
    switch (t) {
      case 'MAIN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">MAIN HUB</span>;
      case 'BRANCH':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">BRANCH DEPOT</span>;
      case 'OPEN_YARD':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">OPEN YARD</span>;
      case 'DEPOT':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">DISTRIBUTION DEPOT</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{t}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <WarehouseIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">{warehouses.length}</div>
            <div className="text-xs text-slate-500 font-semibold mt-1">Total Warehouses &amp; Yards</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">
              {warehouses.filter((w) => w.status === 'ACTIVE').length}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-1">Active Operating Sites</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">{products.length}</div>
            <div className="text-xs text-slate-500 font-semibold mt-1">Total Tracked SKUs in Fleet</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filter, Add */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search warehouse code, name, address, supervisor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Facility Types</option>
            <option value="MAIN">Main Hub</option>
            <option value="BRANCH">Branch Depot</option>
            <option value="OPEN_YARD">Open Yard</option>
            <option value="DEPOT">Distribution Depot</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Delete ({selectedIds.size})</span>
            </button>
          )}

          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Warehouse / Depot</span>
          </button>
        </div>
      </div>

      {/* Warehouse Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWarehouses.map((wh) => {
          const isSelected = selectedIds.has(wh.id);
          // Compute SKUs and units associated with this warehouse
          const matchedProducts = products.filter(
            (p) =>
              p.location &&
              (p.location.toUpperCase().includes(wh.code.toUpperCase()) ||
                p.location.toUpperCase().includes(wh.name.toUpperCase()))
          );
          const totalStockInWh = matchedProducts.reduce((sum, p) => sum + (p.currentStock || 0), 0);

          return (
            <div
              key={wh.id}
              className={`bg-white rounded-xl border p-4.5 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs'
              }`}
            >
              <div className="space-y-3">
                {/* Header with Code and Type */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectOne(wh.id, e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500 border-slate-300 w-4 h-4 cursor-pointer"
                    />
                    <div className="px-2.5 py-1 bg-slate-900 text-amber-400 font-mono font-black text-xs rounded-lg shadow-2xs">
                      {wh.code}
                    </div>
                    {getTypeBadge(wh.type)}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(wh)}
                      title="Edit Warehouse Details"
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteWarehouse(wh.id)}
                      title="Delete Warehouse"
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Warehouse Name */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{wh.name}</h3>
                  <div className="flex items-start gap-1.5 text-xs text-slate-600 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{wh.address || 'Address on record'}</span>
                  </div>
                </div>

                {/* Contact info */}
                {(wh.contactPerson || wh.contactPhone) && (
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                    {wh.contactPerson && (
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Supervisor: <strong>{wh.contactPerson}</strong></span>
                      </div>
                    )}
                    {wh.contactPhone && (
                      <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{wh.contactPhone}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {wh.notes && (
                  <p className="text-[11px] text-slate-500 italic bg-amber-50/50 p-2 rounded border border-amber-200/50">
                    &quot;{wh.notes}&quot;
                  </p>
                )}
              </div>

              {/* Bottom Storage Stats & Status */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div title="Total distinct material SKUs stored here">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">SKUs:</span>
                    <span className="font-mono font-bold text-slate-900">{matchedProducts.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Units:</span>
                    <span className="font-mono font-bold text-amber-700">{totalStockInWh.toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      wh.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {wh.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredWarehouses.length === 0 && (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <WarehouseIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No Warehouses Found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? `No warehouses matched "${searchTerm}". Try a different keyword.`
              : 'No warehouses registered yet. Click "+ Add Warehouse / Depot" to register your storage locations.'}
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Warehouse</span>
          </button>
        </div>
      )}

      {/* Add / Edit Warehouse Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWarehouse ? `Edit Warehouse — ${editingWarehouse.code}` : 'Add New Warehouse / Depot'}
        subtitle="Register additional warehouse, open batching yard, or satellite distribution center"
        maxWidth="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                Warehouse Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. WH-04, YARD-02"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                Facility Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="MAIN">Main Warehouse Base</option>
                <option value="BRANCH">Branch Depot</option>
                <option value="OPEN_YARD">Open Aggregates / Steel Yard</option>
                <option value="DEPOT">Satellite Distribution Depot</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Warehouse / Yard Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Silang Satellite Depot / Rebar Cutting Yard"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Address &amp; Location *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Km 32 Aguinaldo Highway, Silang, Cavite"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                Supervisor / Yard Master
              </label>
              <input
                type="text"
                placeholder="e.g. Foreman Dan"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                placeholder="e.g. 0917-000-0000"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                Operational Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="ACTIVE">ACTIVE (Receives &amp; Dispatches Stock)</option>
                <option value="INACTIVE">INACTIVE (Temporarily Closed / Renovating)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                Logistics Notes
              </label>
              <input
                type="text"
                placeholder="e.g. For heavy trucks only, 24/7 gate"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
            >
              {editingWarehouse ? 'Save Changes' : 'Register Warehouse'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
