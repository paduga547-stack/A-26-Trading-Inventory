import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationPage } from '../../types';
import { ThermalScannerModal } from '../common/ThermalScannerModal';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  Package,
  CheckCircle2,
  Building2,
  Plus,
  Scan,
} from 'lucide-react';

interface StockActionsViewProps {
  mode: 'stock-in' | 'stock-out' | 'stock-transfer' | 'stock-adjustment';
}

export const StockActionsView: React.FC<StockActionsViewProps> = ({ mode }) => {
  const {
    products,
    suppliers,
    warehouses,
    settings,
    stockIn,
    stockOut,
    stockTransfer,
    stockAdjustment,
    setCurrentPage,
    currentUser,
  } = useApp();

  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [qty, setQty] = useState<number>(10);
  const [unitCost, setUnitCost] = useState<number>(products[0]?.buyingPrice || 0);
  const [location, setLocation] = useState<string>(settings.defaultLocation || 'WH-01-A');
  const [fromLocation, setFromLocation] = useState<string>('WH-01-BAY-A');
  const [toLocation, setToLocation] = useState<string>('YARD-BATCHING-01');
  const [countedStock, setCountedStock] = useState<number>(products[0]?.currentStock || 0);
  const [reason, setReason] = useState<string>('');
  const [releaseDestination, setReleaseDestination] = useState<string>('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Dual source selection for Stock In:
  // 1. Select from registered supplier dropdown
  // 2. OR manual custom typing
  const [supplierSelect, setSupplierSelect] = useState<string>('');
  const [manualSupplierSource, setManualSupplierSource] = useState<string>('');
  const [sourceMode, setSourceMode] = useState<'SELECT' | 'MANUAL'>('SELECT');

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Update defaults when product changes
  const handleProductSelect = (id: string) => {
    setSelectedProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) {
      setUnitCost(p.buyingPrice);
      setLocation(p.location);
      setFromLocation(p.location);
      setCountedStock(p.currentStock);
      setSupplierSelect(p.supplierId || '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (mode === 'stock-in') {
      const chosenSupplier =
        sourceMode === 'MANUAL'
          ? manualSupplierSource.trim()
          : supplierSelect
          ? suppliers.find((s) => s.id === supplierSelect)?.name || supplierSelect
          : 'Direct Hauling / In-House';

      stockIn(
        selectedProduct.id,
        qty,
        unitCost,
        reason || 'Stock In receiving batch',
        location,
        chosenSupplier
      );
    } else if (mode === 'stock-out') {
      const finalRelease = releaseDestination.trim() || 'Manual Stock Release';
      const finalReason = reason.trim() ? `${reason} (Released To: ${finalRelease})` : `Released To: ${finalRelease}`;
      stockOut(selectedProduct.id, qty, finalReason, finalRelease);
    } else if (mode === 'stock-transfer') {
      stockTransfer(selectedProduct.id, qty, fromLocation, toLocation, reason || 'Warehouse bay relocation');
    } else if (mode === 'stock-adjustment') {
      stockAdjustment(selectedProduct.id, countedStock, reason || 'Physical inventory audit');
    }

    setCurrentPage('inventory-history');
  };

  const navModes: { id: NavigationPage; label: string; icon: React.ReactNode }[] = [
    { id: 'stock-in', label: 'Stock In (Receiving)', icon: <ArrowDownToLine className="w-4 h-4 text-emerald-600" /> },
    { id: 'stock-out', label: 'Stock Out (Disposal / Use)', icon: <ArrowUpFromLine className="w-4 h-4 text-rose-600" /> },
    { id: 'stock-transfer', label: 'Stock Transfer (Bay Relocation)', icon: <ArrowLeftRight className="w-4 h-4 text-sky-600" /> },
    { id: 'stock-adjustment', label: 'Stock Adjustment (Physical Audit)', icon: <SlidersHorizontal className="w-4 h-4 text-amber-600" /> },
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {navModes.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentPage(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="p-3 bg-slate-100 rounded-xl">
              {mode === 'stock-in' && <ArrowDownToLine className="w-6 h-6 text-emerald-600" />}
              {mode === 'stock-out' && <ArrowUpFromLine className="w-6 h-6 text-rose-600" />}
              {mode === 'stock-transfer' && <ArrowLeftRight className="w-6 h-6 text-sky-600" />}
              {mode === 'stock-adjustment' && <SlidersHorizontal className="w-6 h-6 text-amber-600" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {mode === 'stock-in' && 'Stock In / Lot Receiving Form'}
                {mode === 'stock-out' && 'Stock Out / Material Release & Spoilage Form'}
                {mode === 'stock-transfer' && 'Warehouse Bay Stock Transfer'}
                {mode === 'stock-adjustment' && 'Physical Inventory Count Reconciliation'}
              </h3>
              <p className="text-xs text-slate-500">
                Logged as: <strong className="text-slate-800">{currentUser?.name}</strong> ({currentUser?.role})
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No materials registered in catalog yet!</p>
              <p className="text-xs text-slate-500 mt-1">Please add materials in the Products Catalog first.</p>
              <button
                type="button"
                onClick={() => setCurrentPage('products')}
                className="mt-3 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs"
              >
                Go to Materials Catalog
              </button>
            </div>
          ) : (
            <>
              {/* Product Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase text-slate-700">
                    Select Material / Product SKU *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-lg text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    title="Scan material barcode to auto-select"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    <span>Scan Barcode</span>
                  </button>
                </div>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  {products
                    .filter((p) => p.status === 'ACTIVE')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) — Current: {p.currentStock} {p.unit} [{p.location}]
                      </option>
                    ))}
                </select>
              </div>

              {/* Current Material Details Snapshot */}
              {selectedProduct && (
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-slate-800">{selectedProduct.name}</span>
                    <span className="font-mono text-slate-500">({selectedProduct.sku})</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-slate-400">Current Stock: </span>
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {selectedProduct.currentStock} {selectedProduct.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Bay Location: </span>
                      <span className="font-mono font-semibold text-slate-700">{selectedProduct.location}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Buying Cost: </span>
                      <span className="font-mono font-semibold text-slate-700">₱{selectedProduct.buyingPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Mode Inputs */}
              {mode === 'stock-in' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                        Quantity Received ({selectedProduct?.unit}) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={qty}
                        onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                      />
                    </div>

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

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                        Storage Bay / Yard Location
                      </label>
                      <input
                        type="text"
                        list="warehouse-locations-list"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. WH-01-BAY-A"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Registered Warehouses Datalist */}
                  <datalist id="warehouse-locations-list">
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={`${wh.code} (${wh.name})`}>
                        {wh.code} — {wh.name} ({wh.address})
                      </option>
                    ))}
                  </datalist>

                  {/* Supplier Source: Selection or Manual Type */}
                  <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold uppercase text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Supplier Source (Select or Type Manually)</span>
                      </label>
                      <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                        <button
                          type="button"
                          onClick={() => setSourceMode('SELECT')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                            sourceMode === 'SELECT'
                              ? 'bg-amber-500 text-slate-950'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Select List
                        </button>
                        <button
                          type="button"
                          onClick={() => setSourceMode('MANUAL')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                            sourceMode === 'MANUAL'
                              ? 'bg-amber-500 text-slate-950'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Manual Type
                        </button>
                      </div>
                    </div>

                    {sourceMode === 'SELECT' ? (
                      <div>
                        <select
                          value={supplierSelect}
                          onChange={(e) => setSupplierSelect(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="">In-House Batching Yard / Direct Hauler</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.contactPerson})
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Choose from existing vendor directory or click &quot;Manual Type&quot; above to enter a new source.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="text"
                          required={sourceMode === 'MANUAL'}
                          placeholder="Type supplier / source name (e.g. Petron Gas Station, Direct Batching, Quarry Site...)"
                          value={manualSupplierSource}
                          onChange={(e) => setManualSupplierSource(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Manual type: Enter supplier name, gas station branch, quarry site, or batch batching plant.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {mode === 'stock-out' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                        Quantity to Release / Scrap ({selectedProduct?.unit}) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={selectedProduct?.currentStock}
                        required
                        value={qty}
                        onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1 flex items-center justify-between">
                        <span>Released To / Destination (Manual Type) *</span>
                        <span className="text-[10px] text-amber-600 font-bold lowercase">manual entry</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Type recipient, project site, customer, or purpose (e.g. Engr. Mark Ramos, Site B, Scrap write-off)..."
                        value={releaseDestination}
                        onChange={(e) => setReleaseDestination(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Quick Suggestions for 1-Tap Typing */}
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                      Quick Suggestions (Click to fill &amp; customize):
                    </span>
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {[
                        'Spoilage / Broken / Damaged Write-off',
                        'Internal Yard Construction & Maintenance',
                        'Direct Job Site Dispatch (No Sales Invoice)',
                        'Subcontractor Hauling Release',
                        'Customer Direct Yard Pickup',
                        'Sample Quality Testing / Engineer Inspection',
                        'Batching Plant Production Mix',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setReleaseDestination(preset)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
                            releaseDestination === preset
                              ? 'bg-amber-500 text-slate-950 font-bold border-amber-600 shadow-2xs'
                              : 'bg-white text-slate-700 hover:bg-amber-100/60 border-slate-200'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {mode === 'stock-transfer' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Quantity to Transfer ({selectedProduct?.unit}) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedProduct?.currentStock}
                      required
                      value={qty}
                      onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      From Bay Location *
                    </label>
                    <input
                      type="text"
                      required
                      list="warehouse-locations-list"
                      value={fromLocation}
                      onChange={(e) => setFromLocation(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      To Target Bay Location *
                    </label>
                    <input
                      type="text"
                      required
                      list="warehouse-locations-list"
                      value={toLocation}
                      onChange={(e) => setToLocation(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {mode === 'stock-adjustment' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Actual Physical Count ({selectedProduct?.unit}) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={countedStock}
                      onChange={(e) => setCountedStock(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Variance from System
                    </label>
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold">
                      {selectedProduct ? countedStock - selectedProduct.currentStock : 0} {selectedProduct?.unit}
                    </div>
                  </div>
                </div>
              )}

              {/* Reason note */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Reason / Notes / Reference ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. Delivery receipt DR#1024, site replenishment, physical count audit"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage('products')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-xs"
                >
                  Confirm &amp; Record Movement
                </button>
              </div>
            </>
          )}
        </form>
      </div>

      {/* Thermal / Barcode Scanner Modal for Stock Actions */}
      <ThermalScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        mode="inventory"
        onProductScanned={(p) => {
          handleProductSelect(p.id);
          setIsScannerOpen(false);
        }}
      />
    </div>
  );
};
