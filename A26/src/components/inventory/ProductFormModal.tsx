import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ProductSource, CategoryType } from '../../types';
import { INITIAL_UNITS } from '../../data/initialData';
import { Modal } from '../common/Modal';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { categories, suppliers, addProduct, updateProduct, settings, warehouses, createWarehouse } = useApp();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState<CategoryType>('CEMENT');
  const [subcategory, setSubcategory] = useState('');
  const [brand, setBrand] = useState('');
  const [specification, setSpecification] = useState('');
  const [size, setSize] = useState('');
  const [thickness, setThickness] = useState('');
  const [length, setLength] = useState('');
  const [color, setColor] = useState('');
  const [unit, setUnit] = useState('PCS');
  const [customUnit, setCustomUnit] = useState('');
  const [buyingPrice, setBuyingPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [minStock, setMinStock] = useState(10);
  const [maxStock, setMaxStock] = useState(1000);
  const [supplierId, setSupplierId] = useState<string>('');
  const [location, setLocation] = useState(settings.defaultLocation);
  const [vatStatus, setVatStatus] = useState<'VATABLE' | 'EXEMPT'>('VATABLE');
  const [source, setSource] = useState<ProductSource>('PURCHASED');
  const [manufacturer, setManufacturer] = useState('');
  const [initialStock, setInitialStock] = useState(0);

  // Quick Add Warehouse inline state
  const [isQuickWhOpen, setIsQuickWhOpen] = useState(false);
  const [quickWhCode, setQuickWhCode] = useState('');
  const [quickWhName, setQuickWhName] = useState('');
  const [quickWhAddress, setQuickWhAddress] = useState('');

  const handleQuickAddWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickWhCode.trim() || !quickWhName.trim()) return;
    const finalCode = quickWhCode.trim().toUpperCase();
    const finalName = quickWhName.trim();
    createWarehouse({
      code: finalCode,
      name: finalName,
      address: quickWhAddress.trim() || 'Cavite Operating Facility',
      type: 'BRANCH',
      status: 'ACTIVE',
    });
    setLocation(`${finalCode} (${finalName})`);
    setIsQuickWhOpen(false);
    setQuickWhCode('');
    setQuickWhName('');
    setQuickWhAddress('');
  };

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setBarcode(productToEdit.barcode || '');
      setCategory(productToEdit.category as CategoryType);
      setSubcategory(productToEdit.subcategory || '');
      setBrand(productToEdit.brand);
      setSpecification(productToEdit.specification || '');
      setSize(productToEdit.size || '');
      setThickness(productToEdit.thickness || '');
      setLength(productToEdit.length || '');
      setColor(productToEdit.color || '');
      if (INITIAL_UNITS.includes(productToEdit.unit)) {
        setUnit(productToEdit.unit);
        setCustomUnit('');
      } else {
        setUnit('OTHER');
        setCustomUnit(productToEdit.unit);
      }
      setBuyingPrice(productToEdit.buyingPrice);
      setSellingPrice(productToEdit.sellingPrice);
      setMinStock(productToEdit.minStock);
      setMaxStock(productToEdit.maxStock);
      setSupplierId(productToEdit.supplierId || '');
      setLocation(productToEdit.location);
      setVatStatus(productToEdit.vatStatus);
      setSource(productToEdit.source);
      setManufacturer(productToEdit.manufacturer || '');
      setInitialStock(productToEdit.currentStock);
    } else {
      // Reset form
      setName('');
      setSku(`SKU-${Date.now().toString().slice(-5)}`);
      setBarcode('');
      setCategory(categories[0] || 'CEMENT');
      setSubcategory('');
      setBrand('');
      setSpecification('');
      setSize('');
      setThickness('');
      setLength('');
      setColor('');
      setUnit('PCS');
      setCustomUnit('');
      setBuyingPrice(0);
      setSellingPrice(0);
      setMinStock(20);
      setMaxStock(1000);
      setSupplierId('');
      setLocation(settings.defaultLocation);
      setVatStatus('VATABLE');
      setSource('PURCHASED');
      setManufacturer('');
      setInitialStock(0);
    }
  }, [productToEdit, isOpen, categories, settings.defaultLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUnit = unit === 'OTHER' && customUnit.trim() ? customUnit.trim().toUpperCase() : unit;

    const payload = {
      name,
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-5)}`,
      barcode: barcode.trim(),
      category,
      subcategory,
      brand,
      specification,
      size,
      thickness,
      length,
      color,
      unit: finalUnit,
      buyingPrice: Number(buyingPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      minStock: Number(minStock) || 0,
      maxStock: Number(maxStock) || 1000,
      supplierId: supplierId || null,
      location: location || settings.defaultLocation,
      vatStatus,
      vatRate: settings.vatRate,
      status: 'ACTIVE' as const,
      source,
      manufacturer: source === 'OWN MANUFACTURED' ? manufacturer || settings.businessName : manufacturer,
      currentStock: productToEdit ? productToEdit.currentStock : Number(initialStock) || 0,
    };

    if (productToEdit) {
      updateProduct(productToEdit.id, payload);
    } else {
      addProduct(payload);
    }
    onClose();
  };

  const markupPercent = buyingPrice > 0 ? (((sellingPrice - buyingPrice) / buyingPrice) * 100).toFixed(1) : '0';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? `Edit Product: ${productToEdit.name}` : 'Register New Construction Material'}
      subtitle="Enter specifications, inventory thresholds, pricing, and storage location"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Core Product Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Product Description / Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Portland Cement Type 1 (40kg)"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Category *
            </label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryType)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Brand, Subcategory, Source */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Brand / Manufacturer *
            </label>
            <input
              type="text"
              required
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Republic Cement, Steel Asia"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Material Source *
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as ProductSource)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
            >
              <option value="PURCHASED">PURCHASED (from supplier)</option>
              <option value="OWN MANUFACTURED">OWN MANUFACTURED (in-house batching)</option>
              <option value="BOTH">BOTH (Purchased & Manufactured)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Subcategory / Classification
            </label>
            <input
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="e.g. Hydraulic, Deformed Bar"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Technical Specs: Size, Thickness, Length, Color, Spec */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Technical Dimension & Material Specifications
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Size / Gauge</label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. 10mm, 4x8x16, 2x2"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Thickness</label>
              <input
                type="text"
                value={thickness}
                onChange={(e) => setThickness(e.target.value)}
                placeholder="e.g. 0.50mm, Sch 40"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Length</label>
              <input
                type="text"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="e.g. 6M, 8FT, 12FT"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">Color / Coating</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Spanish Red, Gray, White"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
              />
            </div>
          </div>
          <div className="mt-2">
            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">ASTM / PNS Standard</label>
            <input
              type="text"
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
              placeholder="e.g. PNS 49 Grade 60 (415 MPa), ASTM C150 Type 1"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
            />
          </div>
        </div>

        {/* Pricing, Cost & Markup */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-amber-50/50 p-3 rounded-lg border border-amber-200">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Unit Measure *
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              {INITIAL_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
              <option value="OTHER">Other (Custom Unit)</option>
            </select>
            {unit === 'OTHER' && (
              <input
                type="text"
                placeholder="Type unit (e.g. BDL, DRUM)"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                className="mt-1 w-full px-2 py-1 text-xs border border-amber-400 rounded-md uppercase"
              />
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Buying Price (PHP) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={buyingPrice}
              onChange={(e) => setBuyingPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white font-bold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Selling Price (PHP) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={sellingPrice}
              onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white font-bold text-emerald-700"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Profit Margin
            </label>
            <div className="px-3 py-2 text-xs font-mono rounded-lg bg-white border border-slate-200 text-slate-700 font-bold flex items-center justify-between">
              <span>{markupPercent}%</span>
              <span className="text-[10px] text-slate-400 font-normal">
                +₱{(sellingPrice - buyingPrice).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Control & Thresholds */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              {productToEdit ? 'Current Stock Level' : 'Initial Stock In *'}
            </label>
            <input
              type="number"
              disabled={!!productToEdit}
              value={initialStock}
              onChange={(e) => setInitialStock(parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 text-xs font-mono border rounded-lg ${
                productToEdit ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-300 font-bold'
              }`}
            />
            {productToEdit && (
              <span className="text-[10px] text-slate-400">Use Stock In/Out to alter live stock</span>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Min Stock (Reorder Point) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={minStock}
              onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Max Stock Capacity
            </label>
            <input
              type="number"
              min="0"
              value={maxStock}
              onChange={(e) => setMaxStock(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg bg-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold uppercase text-slate-600">
                Warehouse Bay / Yard
              </label>
              <button
                type="button"
                onClick={() => {
                  setQuickWhCode(`WH-${(warehouses.length + 1).toString().padStart(2, '0')}`);
                  setIsQuickWhOpen(!isQuickWhOpen);
                }}
                className="text-[10px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-0.5 cursor-pointer"
              >
                + Add Warehouse
              </button>
            </div>
            <input
              type="text"
              list="product-form-warehouses"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. WH-01 (Main Warehouse) / Bay A"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            />
            <datalist id="product-form-warehouses">
              {warehouses.map((wh) => (
                <option key={wh.id} value={`${wh.code} (${wh.name})`}>
                  {wh.code} — {wh.name}
                </option>
              ))}
            </datalist>

            {/* Quick Inline Warehouse Addition Popover */}
            {isQuickWhOpen && (
              <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2 shadow-xs">
                <div className="font-bold text-slate-800 text-[11px] flex justify-between items-center">
                  <span>Quick Add New Warehouse Facility</span>
                  <button
                    type="button"
                    onClick={() => setIsQuickWhOpen(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Code (e.g. WH-04)"
                    value={quickWhCode}
                    onChange={(e) => setQuickWhCode(e.target.value.toUpperCase())}
                    className="px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Warehouse Name"
                    value={quickWhName}
                    onChange={(e) => setQuickWhName(e.target.value)}
                    className="px-2 py-1 text-xs border border-slate-300 rounded bg-white font-medium"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Address / Location (e.g. Silang, Cavite)"
                  value={quickWhAddress}
                  onChange={(e) => setQuickWhAddress(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded bg-white"
                />
                <button
                  type="button"
                  onClick={handleQuickAddWarehouse}
                  className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-xs transition-colors cursor-pointer"
                >
                  Save &amp; Select Warehouse
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Identifiers & Vendor */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">SKU Code</label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Barcode / UPC</label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan or enter barcode"
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">Preferred Supplier</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="">None / Own Production</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors shadow-xs"
          >
            {productToEdit ? 'Save Changes' : 'Create Product SKU'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
