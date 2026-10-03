import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PurchaseOrder } from '../../types';
import { Modal } from '../common/Modal';
import {
  FileSpreadsheet,
  Plus,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Trash2,
  Fuel,
  Package,
  Truck,
  User,
} from 'lucide-react';

export const PurchaseOrdersView: React.FC = () => {
  const {
    purchaseOrders,
    suppliers,
    products,
    employees,
    settings,
    createPurchaseOrder,
    receivePurchaseOrder,
    deletePurchaseOrder,
    bulkDeletePurchaseOrders,
    showToast,
  } = useApp();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderCategory, setOrderCategory] = useState<'MATERIALS' | 'GAS_FUEL' | 'OFFICE_SUPPLIES' | 'EQUIPMENT_PARTS'>('MATERIALS');
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [notes, setNotes] = useState('');

  // Fuel / Gas PO specific fields
  const [fuelVehicle, setFuelVehicle] = useState(settings.defaultVehicle);
  const [fuelDriver, setFuelDriver] = useState(settings.defaultDriver);
  const [fuelType, setFuelType] = useState('Diesel');
  const [fuelLiters, setFuelLiters] = useState<number>(50);
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState<number>(62.5);

  // Material PO items
  const [items, setItems] = useState<{ productId: string; qty: number; unitPrice: number; productName?: string; unit?: string }[]>([]);

  const openCreateModal = (cat: 'MATERIALS' | 'GAS_FUEL' = 'MATERIALS') => {
    setOrderCategory(cat);
    setSupplierId(suppliers[0]?.id || '');
    setNotes('');
    if (cat === 'MATERIALS') {
      if (products.length > 0) {
        setItems([{ productId: products[0].id, qty: 50, unitPrice: products[0].buyingPrice }]);
      } else {
        setItems([]);
      }
    } else {
      // Gas PO default line
      setFuelVehicle(settings.defaultVehicle);
      setFuelDriver(settings.defaultDriver);
      setFuelType('Diesel (Euro 4)');
      setFuelLiters(60);
      setFuelPricePerLiter(62.0);
    }
    setIsModalOpen(true);
  };

  const addItemLine = () => {
    if (products.length > 0) {
      setItems((prev) => [
        ...prev,
        { productId: products[0].id, qty: 20, unitPrice: products[0].buyingPrice },
      ]);
    }
  };

  const updateItemLine = (idx: number, productId: string, qty: number, unitPrice: number) => {
    const p = products.find((x) => x.id === productId);
    setItems((prev) =>
      prev.map((item, index) =>
        index === idx
          ? {
              productId,
              qty,
              unitPrice: unitPrice !== undefined ? unitPrice : p?.buyingPrice || 0,
            }
          : item
      )
    );
  };

  const removeItemLine = (idx: number) => {
    setItems((prev) => prev.filter((_, index) => index !== idx));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId && suppliers.length > 0) {
      showToast('Please select a supplier or fuel station', 'error');
      return;
    }

    if (orderCategory === 'GAS_FUEL') {
      const fuelTotal = fuelLiters * fuelPricePerLiter;
      createPurchaseOrder({
        supplierId: supplierId || 'GAS-STATION',
        category: 'GAS_FUEL',
        fuelVehicle,
        fuelDriver,
        fuelLiters,
        items: [
          {
            productId: 'GAS-FUEL-ITEM',
            productName: `Fuel: ${fuelType} for ${fuelVehicle} (Driver: ${fuelDriver})`,
            qty: fuelLiters,
            unit: 'LITERS',
            unitPrice: fuelPricePerLiter,
          },
        ],
        notes: `Gas / Fuel PO Expense: ${fuelVehicle} driven by ${fuelDriver}. ${notes}`,
      });
    } else {
      if (items.length === 0) {
        showToast('Add at least one item line to purchase order', 'error');
        return;
      }
      createPurchaseOrder({
        supplierId,
        category: 'MATERIALS',
        items,
        notes,
      });
    }

    setIsModalOpen(false);
  };

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
      setSelectedIds(new Set(filteredPOs.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    bulkDeletePurchaseOrders(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const filteredPOs = purchaseOrders.filter((po) => {
    if (filterCategory === 'ALL') return true;
    if (filterCategory === 'GAS_FUEL') return po.category === 'GAS_FUEL';
    if (filterCategory === 'MATERIALS') return po.category !== 'GAS_FUEL';
    return true;
  });

  const totalFuelExpenses = purchaseOrders
    .filter((po) => po.category === 'GAS_FUEL')
    .reduce((sum, po) => sum + po.total, 0);

  const totalMaterialPOs = purchaseOrders
    .filter((po) => po.category !== 'GAS_FUEL')
    .reduce((sum, po) => sum + po.total, 0);

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
            <span>Procurement & Fuel Expense Purchase Orders ({purchaseOrders.length})</span>
          </h3>
          <p className="text-xs text-slate-500">
            Issue material purchase orders and company fuel / gas expense tickets with vehicle & driver assignment.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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
            onClick={() => openCreateModal('GAS_FUEL')}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
          >
            <Fuel className="w-4 h-4" />
            <span>+ Fuel / Gas PO</span>
          </button>

          <button
            onClick={() => openCreateModal('MATERIALS')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Materials PO</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Total Procurement POs</span>
          <div className="text-xl font-black text-slate-900 font-mono mt-1">
            {formatPHP(totalMaterialPOs)}
          </div>
          <span className="text-[11px] text-slate-400">Inventory raw materials</span>
        </div>

        <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-200 shadow-2xs">
          <span className="text-[11px] font-bold text-sky-800 uppercase flex items-center gap-1">
            <Fuel className="w-3.5 h-3.5 text-sky-600" />
            <span>Company Gas / Fuel Expenses</span>
          </span>
          <div className="text-xl font-black text-sky-900 font-mono mt-1">
            {formatPHP(totalFuelExpenses)}
          </div>
          <span className="text-[11px] text-sky-700">Trucks & logistics fuel PO</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">Category Filter</span>
            <div className="mt-1">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2.5 py-1 text-xs font-bold border border-slate-300 rounded-lg bg-slate-50"
              >
                <option value="ALL">All Categories</option>
                <option value="GAS_FUEL">Gas / Fuel PO Only</option>
                <option value="MATERIALS">Materials PO Only</option>
              </select>
            </div>
          </div>
          <span className="text-xs text-slate-400">
            Showing <strong className="text-slate-800">{filteredPOs.length}</strong> POs
          </span>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={filteredPOs.length > 0 && selectedIds.size === filteredPOs.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                </th>
                <th className="px-4 py-3">PO Number</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Vendor / Station</th>
                <th className="px-4 py-3">Vehicle / Driver / Items</th>
                <th className="px-4 py-3 text-right">Total Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPOs.map((po) => {
                const sup = suppliers.find((s) => s.id === po.supplierId);
                const isGas = po.category === 'GAS_FUEL';
                const isSelected = selectedIds.has(po.id);

                return (
                  <tr
                    key={po.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelect(po.id, e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-500"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-slate-900">{po.poNo}</div>
                      <div className="text-[10px] text-slate-400">{po.createdAt}</div>
                    </td>

                    <td className="px-4 py-3">
                      {isGas ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                          <Fuel className="w-3 h-3" />
                          <span>GAS / FUEL PO</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                          <Package className="w-3 h-3" />
                          <span>MATERIALS</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{sup?.name || po.supplierId || 'Gas Station Depot'}</div>
                      {sup?.contactPerson && (
                        <div className="text-[10px] text-slate-400">Attn: {sup.contactPerson}</div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {isGas ? (
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-800 flex items-center gap-1">
                            <Truck className="w-3 h-3 text-slate-500" />
                            <span>{po.fuelVehicle || 'Company Truck'}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>Driver: {po.fuelDriver || 'Assigned Driver'} &bull; {po.fuelLiters || 0} Liters</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="font-bold text-slate-800">{po.items.length} material lines</span>
                          <div className="text-[10px] text-slate-400 truncate max-w-xs">
                            {po.items.map((i) => `${i.productName} (${i.qty} ${i.unit})`).join(', ')}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {formatPHP(po.total)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {po.status === 'RECEIVED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Received</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {po.status === 'PENDING' && !isGas && (
                          <button
                            onClick={() => receivePurchaseOrder(po.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                            title="Receive items and auto-increment stock"
                          >
                            <ArrowDownToLine className="w-3 h-3" />
                            <span>Receive</span>
                          </button>
                        )}
                        <button
                          onClick={() => deletePurchaseOrder(po.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Delete PO"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredPOs.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                    No purchase orders found. Create a Materials PO or Fuel/Gas Expense PO above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Draft Purchase Order (Materials or Fuel) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={orderCategory === 'GAS_FUEL' ? 'Issue Fuel / Gas Expense Purchase Order' : 'Draft Materials Purchase Order'}
        subtitle={orderCategory === 'GAS_FUEL' ? 'Official company PO for logistics fleet gasoline & diesel expenses' : 'Issue procurement order to approved supplier'}
        maxWidth="2xl"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {/* Category Toggle in modal */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setOrderCategory('MATERIALS')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                orderCategory === 'MATERIALS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Materials Purchase Order</span>
            </button>
            <button
              type="button"
              onClick={() => setOrderCategory('GAS_FUEL')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                orderCategory === 'GAS_FUEL'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Fuel className="w-3.5 h-3.5" />
              <span>Fuel / Gas Company PO</span>
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              {orderCategory === 'GAS_FUEL' ? 'Gas Station / Fuel Depot *' : 'Supplier Mill / Quarry / Depot *'}
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.contactPerson})
                </option>
              ))}
              {suppliers.length === 0 && (
                <option value="GENERAL_VENDOR">Petron / Shell / General Gas Station</option>
              )}
            </select>
          </div>

          {/* GAS / FUEL SPECIFIC FORM */}
          {orderCategory === 'GAS_FUEL' ? (
            <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                <Fuel className="w-4 h-4 text-sky-600" />
                <span>Gasoline & Diesel Logistics Details</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Company Vehicle / Plate No *
                  </label>
                  <input
                    type="text"
                    required
                    value={fuelVehicle}
                    onChange={(e) => setFuelVehicle(e.target.value)}
                    placeholder="e.g. TRUCK-001 (Forward 6-Wheeler) / NDF-1234"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Assigned Driver *
                  </label>
                  <input
                    type="text"
                    required
                    value={fuelDriver}
                    onChange={(e) => setFuelDriver(e.target.value)}
                    placeholder="e.g. Pedro Santos / Juan Gomez"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Fuel Product Type
                  </label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Diesel (Euro 4)">Diesel (Euro 4 / Bio-Diesel)</option>
                    <option value="Gasoline Unleaded">Gasoline Unleaded (91 Octane)</option>
                    <option value="Gasoline Premium">Gasoline Premium (95 Octane)</option>
                    <option value="Engine Oil / Lubricants">Engine Oil / Brake Fluid</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Liters *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={fuelLiters}
                      onChange={(e) => setFuelLiters(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Price/Liter (₱)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      required
                      value={fuelPricePerLiter}
                      onChange={(e) => setFuelPricePerLiter(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-sky-200/80 flex items-center justify-between text-xs">
                <span className="font-bold text-sky-950 uppercase">Computed Fuel Expense Total:</span>
                <span className="font-mono font-black text-base text-sky-900">
                  {formatPHP(fuelLiters * fuelPricePerLiter)}
                </span>
              </div>
            </div>
          ) : (
            /* MATERIALS PO FORM */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase text-slate-700">
                  Order Line Items
                </label>
                <button
                  type="button"
                  onClick={addItemLine}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="space-y-2 border border-slate-200 rounded-lg p-3 max-h-56 overflow-y-auto">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={item.productId}
                      onChange={(e) => updateItemLine(idx, e.target.value, item.qty, item.unitPrice)}
                      className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) =>
                        updateItemLine(idx, item.productId, parseInt(e.target.value) || 1, item.unitPrice)
                      }
                      className="w-20 px-2 py-1.5 text-xs font-mono border border-slate-300 rounded"
                      placeholder="Qty"
                    />

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItemLine(idx, item.productId, item.qty, parseFloat(e.target.value) || 0)
                      }
                      className="w-24 px-2 py-1.5 text-xs font-mono border border-slate-300 rounded"
                      placeholder="Unit Cost"
                    />

                    <button
                      type="button"
                      onClick={() => removeItemLine(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {items.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-3">
                    No items in purchase order. Click &quot;Add Line Item&quot; above.
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center text-xs pt-1">
                <span className="font-bold text-slate-700 uppercase">Materials Order Total:</span>
                <span className="font-mono font-black text-sm text-slate-900">
                  {formatPHP(items.reduce((s, i) => s + i.qty * i.unitPrice, 0))}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Purchase Order Notes / Authorization
            </label>
            <input
              type="text"
              placeholder="e.g. Authorized by Operations Manager, job site batch, delivery requested Friday"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-xs cursor-pointer"
            >
              {orderCategory === 'GAS_FUEL' ? 'Confirm Gas PO' : 'Confirm Purchase Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
