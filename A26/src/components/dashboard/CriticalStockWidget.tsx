import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Supplier } from '../../types';
import { Modal } from '../common/Modal';
import {
  AlertTriangle,
  AlertOctagon,
  TrendingDown,
  ShoppingCart,
  FileSpreadsheet,
  ArrowRight,
  Building2,
  CheckCircle2,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  RefreshCw,
  Plus,
} from 'lucide-react';

export const CriticalStockWidget: React.FC = () => {
  const { products, suppliers, createPurchaseOrder, setCurrentPage, showToast } = useApp();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'OUT_OF_STOCK' | 'LOW_STOCK'>('ALL');
  const [selectedProductForPO, setSelectedProductForPO] = useState<Product | null>(null);

  // PO Form Modal state
  const [poSupplierId, setPoSupplierId] = useState<string>('');
  const [poQuantity, setPoQuantity] = useState<number>(50);
  const [poUnitPrice, setPoUnitPrice] = useState<number>(0);
  const [poNotes, setPoNotes] = useState<string>('');

  // Critical Low Stock: currentStock <= minStock
  const allCriticalItems = products.filter(
    (p) => p.status === 'ACTIVE' && p.currentStock <= p.minStock
  );

  const outOfStockItems = allCriticalItems.filter((p) => p.currentStock <= 0);
  const lowStockItems = allCriticalItems.filter((p) => p.currentStock > 0);

  const displayItems =
    activeFilter === 'OUT_OF_STOCK'
      ? outOfStockItems
      : activeFilter === 'LOW_STOCK'
      ? lowStockItems
      : allCriticalItems;

  // Open Quick PO Modal for a single product
  const handleOpenQuickPO = (prod: Product) => {
    setSelectedProductForPO(prod);
    const matchedSupplier = suppliers.find((s) => s.id === prod.supplierId) || suppliers[0];
    setPoSupplierId(matchedSupplier ? matchedSupplier.id : '');
    // Calculate suggested reorder quantity (fill up to maxStock or at least 2x minStock)
    const suggested = Math.max(prod.maxStock - prod.currentStock, prod.minStock * 2, 20);
    setPoQuantity(suggested);
    setPoUnitPrice(prod.buyingPrice || 0);
    setPoNotes(`Automated replenishment trigger: current stock (${prod.currentStock} ${prod.unit}) is below minimum threshold (${prod.minStock} ${prod.unit}).`);
  };

  const handleCreateSinglePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForPO) return;
    if (!poSupplierId && suppliers.length > 0) {
      showToast('Please select a supplier for this purchase order', 'warning');
      return;
    }
    if (poQuantity <= 0) {
      showToast('Quantity must be greater than 0', 'warning');
      return;
    }

    createPurchaseOrder({
      supplierId: poSupplierId || (suppliers[0]?.id || 'DIRECT_VENDOR'),
      category: 'MATERIALS',
      items: [
        {
          productId: selectedProductForPO.id,
          productName: selectedProductForPO.name,
          qty: poQuantity,
          unit: selectedProductForPO.unit,
          unitPrice: poUnitPrice,
        },
      ],
      notes: poNotes,
    });

    showToast(`Purchase order generated for ${selectedProductForPO.name}!`, 'success');
    setSelectedProductForPO(null);
  };

  // Batch PO Generation for all critical items grouped by supplier
  const handleBatchGeneratePO = () => {
    if (allCriticalItems.length === 0) {
      showToast('No items currently below threshold!', 'info');
      return;
    }

    if (suppliers.length === 0) {
      showToast('Please register at least one supplier in Vendor Directory first', 'warning');
      return;
    }

    // Group critical items by supplierId (or assign default first supplier)
    const itemsBySupplier: Record<string, Product[]> = {};
    allCriticalItems.forEach((p) => {
      const supId = p.supplierId && suppliers.some((s) => s.id === p.supplierId)
        ? p.supplierId
        : suppliers[0].id;

      if (!itemsBySupplier[supId]) {
        itemsBySupplier[supId] = [];
      }
      itemsBySupplier[supId].push(p);
    });

    let poCount = 0;
    Object.entries(itemsBySupplier).forEach(([supId, prods]) => {
      const lineItems = prods.map((p) => {
        const reorderQty = Math.max(p.maxStock - p.currentStock, p.minStock * 2, 20);
        return {
          productId: p.id,
          productName: p.name,
          qty: reorderQty,
          unit: p.unit,
          unitPrice: p.buyingPrice,
        };
      });

      createPurchaseOrder({
        supplierId: supId,
        category: 'MATERIALS',
        items: lineItems,
        notes: `Bulk replenishment PO triggered from Dashboard for ${prods.length} critical low stock material(s).`,
      });
      poCount++;
    });

    showToast(`Successfully created ${poCount} Purchase Order(s) for ${allCriticalItems.length} low-stock item(s)!`);
  };

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-rose-200/80 shadow-md p-5 space-y-4">
      {/* Widget Header & Metrics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-rose-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Critical Low Stock &amp; PO Trigger Center
              </h3>
              {allCriticalItems.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-600 text-white animate-pulse">
                  {allCriticalItems.length} ALERT{allCriticalItems.length > 1 ? 'S' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Items at or below predefined minimum threshold (Reorder Point). Quickly issue Purchase Orders to suppliers.
            </p>
          </div>
        </div>

        {/* Global Batch Action Button */}
        {allCriticalItems.length > 0 && (
          <button
            type="button"
            onClick={handleBatchGeneratePO}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-amber-400 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shrink-0 shadow-xs cursor-pointer"
            title="Automatically generates Purchase Orders grouped by supplier for all low items"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate POs for All ({allCriticalItems.length})</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Threshold Stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Critical ({allCriticalItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('OUT_OF_STOCK')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
              activeFilter === 'OUT_OF_STOCK'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Out of Stock ({outOfStockItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('LOW_STOCK')}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
              activeFilter === 'LOW_STOCK'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            Low Warning ({lowStockItems.length})
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
          <span>
            Total Deficit: <strong className="text-rose-700">
              {allCriticalItems.reduce((acc, p) => acc + Math.max(0, p.minStock - p.currentStock), 0).toLocaleString()} units
            </strong>
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage('purchase-orders')}
            className="text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>View All POs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Critical Items Table / List */}
      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
        {displayItems.slice(0, 8).map((prod) => {
          const isOut = prod.currentStock <= 0;
          const deficit = Math.max(0, prod.minStock - prod.currentStock);
          const percent = prod.minStock > 0 ? Math.min(100, Math.round((prod.currentStock / prod.minStock) * 100)) : 0;
          const supplier = suppliers.find((s) => s.id === prod.supplierId);
          const suggestedQty = Math.max(prod.maxStock - prod.currentStock, prod.minStock * 2, 20);
          const estCost = suggestedQty * (prod.buyingPrice || 0);

          return (
            <div
              key={prod.id}
              className="p-3.5 bg-white hover:bg-rose-50/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              {/* Product Info */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                    isOut ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isOut ? <AlertOctagon className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {prod.sku}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      {prod.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Bay: {prod.location}
                    </span>
                    {isOut ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white uppercase tracking-wider">
                        Zero Stock
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-slate-950 uppercase tracking-wider">
                        {percent}% of Min
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mt-1 truncate" title={prod.name}>
                    {prod.name}
                  </h4>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>Supplier: <strong className="text-slate-700">{supplier?.name || 'In-House / Direct Quarry'}</strong></span>
                    </span>
                    <span>Cost: <strong>{formatPHP(prod.buyingPrice)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Stock Gauge & Threshold */}
              <div className="flex items-center gap-4 shrink-0 md:border-l md:border-slate-100 md:pl-4">
                <div className="text-right min-w-[100px]">
                  <div className="flex items-baseline justify-end gap-1">
                    <span
                      className={`text-sm font-black font-mono ${
                        isOut ? 'text-rose-600' : 'text-amber-600'
                      }`}
                    >
                      {prod.currentStock}
                    </span>
                    <span className="text-[11px] text-slate-400 font-bold">
                      / {prod.minStock} {prod.unit}
                    </span>
                  </div>
                  <div className="text-[10px] text-rose-600 font-semibold">
                    Deficit: -{deficit} {prod.unit}
                  </div>
                  {/* Visual Bar */}
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1 ml-auto">
                    <div
                      className={`h-full rounded-full ${
                        isOut ? 'bg-rose-600 w-0' : 'bg-amber-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Quick PO Trigger Action */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenQuickPO(prod)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-lg text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    title={`Create Purchase Order for ${suggestedQty} ${prod.unit} (Est: ${formatPHP(estCost)})`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Trigger PO</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentPage('stock-in')}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title="Direct Stock In receiving"
                  >
                    Stock In
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {allCriticalItems.length === 0 && (
          <div className="p-8 text-center bg-white space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">All Materials Stocked Above Threshold</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Inventory levels across all construction materials, cement, gravel, and steel are healthy and above their reorder points.
            </p>
          </div>
        )}
      </div>

      {allCriticalItems.length > 8 && (
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => setCurrentPage('products')}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
          >
            + View {allCriticalItems.length - 8} more low stock item(s) in Products Catalog →
          </button>
        </div>
      )}

      {/* Quick Purchase Order Trigger Modal */}
      {selectedProductForPO && (
        <Modal
          isOpen={!!selectedProductForPO}
          onClose={() => setSelectedProductForPO(null)}
          title={`Quick Purchase Order — ${selectedProductForPO.name}`}
          subtitle={`Urgent replenishment trigger for ${selectedProductForPO.sku} (Current Stock: ${selectedProductForPO.currentStock} ${selectedProductForPO.unit})`}
          maxWidth="md"
        >
          <form onSubmit={handleCreateSinglePO} className="space-y-4">
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-rose-700 block">Inventory Status:</span>
                <span className="font-bold text-rose-950">
                  {selectedProductForPO.currentStock} {selectedProductForPO.unit} on hand (Min: {selectedProductForPO.minStock} {selectedProductForPO.unit})
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Warehouse Bay:</span>
                <span className="font-mono font-bold text-slate-900">{selectedProductForPO.location}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                Select Supplier / Vendor *
              </label>
              <select
                required
                value={poSupplierId}
                onChange={(e) => setPoSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="">Select Vendor to Issue PO</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.contactPerson} - {s.phone})
                  </option>
                ))}
              </select>
              {suppliers.length === 0 && (
                <p className="text-[11px] text-amber-600 mt-1">
                  No suppliers registered yet. Please add a supplier first in Vendor Directory.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                  Reorder Quantity ({selectedProductForPO.unit}) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={poQuantity}
                  onChange={(e) => setPoQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Suggested replenishment</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                  Purchase Unit Cost (PHP) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={poUnitPrice}
                  onChange={(e) => setPoUnitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            {/* Total Reorder Estimation */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
              <span className="font-bold text-amber-950 uppercase text-[11px]">
                Estimated Purchase Order Total:
              </span>
              <span className="font-mono text-base font-black text-amber-900">
                {formatPHP(poQuantity * poUnitPrice)}
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
                PO Notes &amp; Dispatch Instructions
              </label>
              <textarea
                rows={2}
                value={poNotes}
                onChange={(e) => setPoNotes(e.target.value)}
                placeholder="e.g. Urgent delivery to Main Dasmariñas Warehouse Base..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedProductForPO(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-lg text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue Purchase Order</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
