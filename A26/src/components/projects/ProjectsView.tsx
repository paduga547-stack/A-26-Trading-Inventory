import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Project } from '../../types';
import { Modal } from '../common/Modal';
import {
  HardHat,
  Plus,
  Edit2,
  Calendar,
  Phone,
  MapPin,
  FileText,
  Trash2,
} from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    customers,
    sales,
    rentals,
    deliveryOrders,
    createProject,
    updateProject,
    deleteProject,
    bulkDeleteProjects,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [ledgerProject, setLedgerProject] = useState<Project | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Form states
  const [name, setName] = useState('');
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<Project['status']>('ONGOING');
  const [notes, setNotes] = useState('');

  const openCreateModal = () => {
    setEditingProject(null);
    setName('');
    setCustomerId(customers[0]?.id || '');
    setAddress('');
    setContactPerson('');
    setContactNumber('');
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate('');
    setStatus('ONGOING');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Project) => {
    setEditingProject(p);
    setName(p.name);
    setCustomerId(p.customerId);
    setAddress(p.address);
    setContactPerson(p.contactPerson);
    setContactNumber(p.contactNumber);
    setStartDate(p.startDate);
    setEndDate(p.endDate);
    setStatus(p.status);
    setNotes(p.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    if (editingProject) {
      updateProject(editingProject.id, {
        name,
        customerId,
        address,
        contactPerson,
        contactNumber,
        startDate,
        endDate,
        status,
        notes,
      });
    } else {
      createProject({
        name,
        customerId,
        address,
        contactPerson,
        contactNumber,
        startDate: startDate || new Date().toISOString().slice(0, 10),
        endDate: endDate || '2026-12-31',
        status,
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
      setSelectedIds(new Set(projects.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    bulkDeleteProjects(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <HardHat className="w-4 h-4 text-amber-600" />
            <span>Active Contractor Construction Projects ({projects.length})</span>
          </h3>
          <p className="text-xs text-slate-500">
            Monitor materials invoiced, machinery rentals, and logistics deliveries per site location
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
            <span>Add New Project Site</span>
          </button>
        </div>
      </div>

      {projects.length > 0 && (
        <div className="flex items-center gap-2 px-1 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={selectedIds.size === projects.length && projects.length > 0}
            onChange={(e) => toggleSelectAll(e.target.checked)}
            className="rounded text-amber-500 focus:ring-amber-500"
            id="select-all-proj"
          />
          <label htmlFor="select-all-proj" className="cursor-pointer font-medium">
            Select All Project Sites ({projects.length})
          </label>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((proj) => {
          const cust = customers.find((c) => c.id === proj.customerId);
          const projSales = sales.filter((s) => s.projectId === proj.id && s.status !== 'VOIDED');
          const totalMaterialsBilled = projSales.reduce((sum, s) => sum + s.total, 0);
          const totalMaterialsUnpaid = projSales.reduce((sum, s) => sum + s.balance, 0);

          const projRentals = rentals.filter((r) => r.projectId === proj.id);
          const totalRentals = projRentals.reduce((sum, r) => sum + r.total, 0);

          const projDeliveries = deliveryOrders.filter((d) => d.projectId === proj.id);
          const isSelected = selectedIds.has(proj.id);

          return (
            <div
              key={proj.id}
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-amber-300 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => toggleSelect(proj.id, e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        proj.status === 'ONGOING'
                          ? 'bg-emerald-100 text-emerald-800'
                          : proj.status === 'COMPLETED'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(proj)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                      title="Edit Project Details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteProject(proj.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mt-2 leading-snug">
                  {proj.name}
                </h4>

                <div className="text-xs text-slate-600 font-semibold mt-1">
                  Contractor: <span className="text-slate-900">{cust?.name || 'General Contractor'}</span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{proj.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {proj.contactPerson} ({proj.contactNumber})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {proj.startDate} to {proj.endDate}
                    </span>
                  </div>
                </div>

                {/* Financial Ledger Snapshot */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Materials Invoiced:</span>
                    <span className="font-mono font-bold text-slate-900">{formatPHP(totalMaterialsBilled)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Machinery Rentals:</span>
                    <span className="font-mono font-bold text-slate-900">{formatPHP(totalRentals)}</span>
                  </div>
                  {totalMaterialsUnpaid > 0 && (
                    <div className="flex justify-between text-rose-700 font-bold pt-1 border-t border-slate-200">
                      <span>Unpaid Balance:</span>
                      <span className="font-mono">{formatPHP(totalMaterialsUnpaid)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400 text-[11px] pt-1">
                    <span>Dispatched Loads:</span>
                    <span>{projDeliveries.length} trip(s)</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setLedgerProject(proj)}
                  className="w-full py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-amber-500 hover:text-slate-950 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Project Ledger Breakdown</span>
                </button>
              </div>
            </div>
          );
        })}

        {projects.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            <HardHat className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-bold text-slate-700">No construction project sites registered</p>
            <p className="text-xs text-slate-400 mt-0.5">Click &quot;Add New Project Site&quot; above to link contractor job sites.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProject ? `Edit Project: ${editingProject.name}` : 'Register New Construction Site'}
        subtitle="Associate site address, contractor contact, and delivery milestones"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sunrise Residences Tower B"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Client / Contractor *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Project Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Project['status'])}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="ONGOING">Ongoing Site Work</option>
                <option value="COMPLETED">Completed / Handed Over</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Job Site Address *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Block 12 Lot 4, San Antonio Valley, Parañaque City"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Site Foreman / Contact Person
              </label>
              <input
                type="text"
                placeholder="e.g. Foreman Berting / Engr. Kevin"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                placeholder="e.g. 0919-345-6123"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Target Completion Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Project Specification / Material Requisition Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Requires 4000 bags cement and continuous 16mm rebar deliveries"
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
              Save Project Site
            </button>
          </div>
        </form>
      </Modal>

      {/* Project Financial Ledger Modal */}
      <Modal
        isOpen={!!ledgerProject}
        onClose={() => setLedgerProject(null)}
        title={`Project Site Ledger: ${ledgerProject?.name}`}
        subtitle="Complete history of materials supplied and equipment rentals dispatched to site"
        maxWidth="3xl"
      >
        {ledgerProject && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Client:</span>
                <div className="font-bold text-slate-800">
                  {customers.find((c) => c.id === ledgerProject.customerId)?.name || 'General Contractor'}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Foreman:</span>
                <div className="font-semibold text-slate-700">{ledgerProject.contactPerson}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Contact:</span>
                <div className="font-mono text-slate-700">{ledgerProject.contactNumber}</div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Timeline:</span>
                <div className="text-slate-700">{ledgerProject.startDate} ~ {ledgerProject.endDate}</div>
              </div>
            </div>

            {/* Sales Invoices for Project */}
            <div>
              <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-[11px] tracking-wider">
                Delivered Material Orders &amp; Invoices
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-[10px] uppercase text-slate-600">
                    <tr>
                      <th className="p-2">Invoice #</th>
                      <th className="p-2">Date</th>
                      <th className="p-2 text-right">Total</th>
                      <th className="p-2 text-right">Balance</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {sales
                      .filter((s) => s.projectId === ledgerProject.id)
                      .map((s) => (
                        <tr key={s.id}>
                          <td className="p-2 font-bold text-slate-800">{s.invoiceNo}</td>
                          <td className="p-2 text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                          <td className="p-2 text-right font-bold text-slate-900">{formatPHP(s.total)}</td>
                          <td className="p-2 text-right text-rose-600">{s.balance > 0 ? formatPHP(s.balance) : '—'}</td>
                          <td className="p-2 text-center">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 font-sans font-bold">
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    {sales.filter((s) => s.projectId === ledgerProject.id).length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">
                          No direct invoices billed to this site.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setLedgerProject(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold"
              >
                Close Ledger
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
