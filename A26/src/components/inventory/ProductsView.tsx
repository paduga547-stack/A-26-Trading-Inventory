import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { ProductFormModal } from './ProductFormModal';
import { ThermalScannerModal } from '../common/ThermalScannerModal';
import {
  Plus,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  Edit2,
  Trash2,
  AlertTriangle,
  Boxes,
  Scan,
} from 'lucide-react';

interface QuickStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  mode: 'IN' | 'OUT';
}

const QuickStockModal: React.FC<QuickStockModalProps> = ({ isOpen, onClose, product, mode }) => {
  const { stockIn, stockOut } = useApp();
  const [qty, setQty] = useState<number>(10);
  const [reason, setReason] = useState<string>('');
  const [unitCost, setUnitCost] = useState<number>(product?.buyingPrice || 0);

  if (!isOpen || !product) return null;

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0) return;
    if (mode === 'IN') {
      stockIn(product.id, qty, unitCost, reason || 'Manual Stock Replenishment');
    } else {
      stockOut(product.id, qty, reason || 'Manual Stock Release');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 animate-in fade-in zoom-in-95">
        <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
          {mode === 'IN' ? (
            <ArrowDownToLine className="w-4 h-4 text-emerald-600" />
          ) : (
            <ArrowUpFromLine className="w-4 h-4 text-rose-600" />
          )}
          <span>{mode === 'IN' ? 'Stock In Inventory' : 'Stock Out Inventory'}</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Item: <span className="font-bold text-slate-800">{product.name}</span> ({product.sku})
          <br />
          Current Stock: <span className="font-mono font-bold">{product.currentStock} {product.unit}</span>
        </p>

        <form onSubmit={handleAction} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Quantity to {mode === 'IN' ? 'Add (+)' : 'Deduct (-)'} ({product.unit}) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {mode === 'IN' && (
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Purchase Unit Cost (PHP)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Reason / Reference Note
            </label>
            <input
              type="text"
              placeholder={mode === 'IN' ? 'e.g. Delivery receipt DR-882, fresh cured batch' : 'e.g. Broken blocks, job site release'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg transition-colors ${
                mode === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              Confirm {mode === 'IN' ? 'Stock In' : 'Stock Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ProductsView: React.FC = () => {
  const { products, categories, warehouses, deleteProduct, bulkDeleteProducts } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [quickStockTarget, setQuickStockTarget] = useState<Product | null>(null);
  const [quickStockMode, setQuickStockMode] = useState<'IN' | 'OUT'>('IN');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchTerm.trim() ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.specification && p.specification.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCat = selectedCat === 'ALL' || p.category === selectedCat;
      const matchSource = selectedSource === 'ALL' || p.source === selectedSource;
      const matchWh =
        selectedWarehouse === 'ALL' ||
        (p.location &&
          (p.location.toUpperCase().includes(selectedWarehouse.toUpperCase())));

      let matchStatus = true;
      if (selectedStatus === 'LOW_STOCK') {
        matchStatus = p.currentStock > 0 && p.currentStock <= p.minStock;
      } else if (selectedStatus === 'OUT_OF_STOCK') {
        matchStatus = p.currentStock <= 0;
      } else if (selectedStatus === 'IN_STOCK') {
        matchStatus = p.currentStock > p.minStock;
      }

      return matchSearch && matchCat && matchWh && matchSource && matchStatus;
    });
  }, [products, searchTerm, selectedCat, selectedWarehouse, selectedSource, selectedStatus]);

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    bulkDeleteProducts(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Search, Filters, Add Button */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by material name, brand, SKU code, or standard..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-amber-400 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Open Thermal / Barcode Scanner for Inventory Lookup"
            >
              <Scan className="w-4 h-4 text-amber-400" />
              <span>Thermal Scanner</span>
            </button>

            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.size})</span>
              </button>
            )}

            <button
              onClick={() => {
                setEditingProduct(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Material</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Category Filter */}
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium focus:outline-hidden"
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Warehouse Location Filter */}
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium focus:outline-hidden"
          >
            <option value="ALL">All Warehouses ({warehouses.length})</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.code}>
                {w.code} — {w.name}
              </option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium focus:outline-hidden"
          >
            <option value="ALL">All Sources</option>
            <option value="PURCHASED">Purchased Supplies</option>
            <option value="OWN MANUFACTURED">Own Manufactured (Batching)</option>
            <option value="BOTH">Both</option>
          </select>

          {/* Stock Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium focus:outline-hidden"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN_STOCK">Healthy Stock</option>
            <option value="LOW_STOCK">⚠️ Low Stock (Below Minimum)</option>
            <option value="OUT_OF_STOCK">🔴 Out of Stock</option>
          </select>

          <span className="text-slate-400 ml-auto text-[11px] font-medium">
            Showing <strong className="text-slate-700">{filteredProducts.length}</strong> of {products.length} materials
          </span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                </th>
                <th className="px-3 py-3">Material Description</th>
                <th className="px-3 py-3">SKU / Code</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Unit</th>
                <th className="px-3 py-3 text-right">Buying Cost</th>
                <th className="px-3 py-3 text-right">Selling Price</th>
                <th className="px-3 py-3 text-center">Stock Level</th>
                <th className="px-3 py-3">Warehouse Bay</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.map((p) => {
                const isSelected = selectedIds.has(p.id);
                const isOut = p.currentStock <= 0;
                const isLow = p.currentStock > 0 && p.currentStock <= p.minStock;

                let stockBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                if (isOut) stockBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
                else if (isLow) stockBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelect(p.id, e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-500"
                      />
                    </td>

                    {/* Product Name & Brand */}
                    <td className="px-3 py-3 max-w-xs">
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-medium text-slate-600">{p.brand}</span>
                        {p.specification && <span>• {p.specification}</span>}
                        {p.source === 'OWN MANUFACTURED' && (
                          <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1 rounded">
                            Own Batch
                          </span>
                        )}
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-3 py-3 font-mono font-medium text-slate-600">
                      {p.sku}
                    </td>

                    {/* Category */}
                    <td className="px-3 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                        {p.category}
                      </span>
                    </td>

                    {/* Unit */}
                    <td className="px-3 py-3 font-semibold text-slate-700">{p.unit}</td>

                    {/* Buying */}
                    <td className="px-3 py-3 text-right font-mono text-slate-500">
                      {formatPHP(p.buyingPrice)}
                    </td>

                    {/* Selling */}
                    <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                      {formatPHP(p.sellingPrice)}
                    </td>

                    {/* Current Stock */}
                    <td className="px-3 py-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-md font-mono font-bold text-xs border ${stockBadgeClass}`}
                        >
                          {p.currentStock} {p.unit}
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5">
                          Min: {p.minStock} | Max: {p.maxStock}
                        </span>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-3 py-3 font-mono text-xs text-slate-500">
                      {p.location || '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Quick Stock In */}
                        <button
                          onClick={() => {
                            setQuickStockTarget(p);
                            setQuickStockMode('IN');
                          }}
                          title="Stock In (+)"
                          className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                        </button>

                        {/* Quick Stock Out */}
                        <button
                          onClick={() => {
                            setQuickStockTarget(p);
                            setQuickStockMode('OUT');
                          }}
                          title="Stock Out (-)"
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          <ArrowUpFromLine className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setIsFormOpen(true);
                          }}
                          title="Edit Product"
                          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => deleteProduct(p.id)}
                          title="Delete / Archive"
                          className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No matching construction materials found</p>
                    <p className="text-xs text-slate-400">Try adjusting your search terms or category filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        productToEdit={editingProduct}
      />

      {/* Quick Stock In/Out Modal */}
      <QuickStockModal
        isOpen={!!quickStockTarget}
        onClose={() => setQuickStockTarget(null)}
        product={quickStockTarget}
        mode={quickStockMode}
      />

      {/* Thermal / Barcode Scanner Modal for Inventory */}
      <ThermalScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        mode="inventory"
        onProductScanned={(p) => setSearchTerm(p.sku)}
        onQuickStockIn={(p) => {
          setQuickStockTarget(p);
          setQuickStockMode('IN');
          setIsScannerOpen(false);
        }}
        onQuickStockOut={(p) => {
          setQuickStockTarget(p);
          setQuickStockMode('OUT');
          setIsScannerOpen(false);
        }}
      />
    </div>
  );
};
