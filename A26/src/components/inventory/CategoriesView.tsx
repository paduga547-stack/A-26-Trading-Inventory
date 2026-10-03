import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryType } from '../../types';
import { Tags, Plus, Package, ArrowRight, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';

export const CategoriesView: React.FC = () => {
  const { categories, products, addCategory, deleteCategory, bulkDeleteCategories, setCurrentPage } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedCats, setSelectedCats] = useState<Set<CategoryType>>(new Set());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim().toUpperCase() as CategoryType);
    setNewCatName('');
    setIsAddOpen(false);
  };

  const toggleSelect = (cat: CategoryType) => {
    const next = new Set(selectedCats);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setSelectedCats(next);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCats(new Set(categories));
    } else {
      setSelectedCats(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedCats.size === 0) return;
    bulkDeleteCategories(Array.from(selectedCats));
    setSelectedCats(new Set());
  };

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Classification Categories ({categories.length})</h3>
          <p className="text-xs text-slate-500">Categories organize materials for rapid POS lookups and inventory valuation</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedCats.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Delete ({selectedCats.size})</span>
            </button>
          )}

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex items-center gap-2 px-1 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={selectedCats.size === categories.length && categories.length > 0}
            onChange={(e) => toggleSelectAll(e.target.checked)}
            className="rounded text-amber-500 focus:ring-amber-500"
            id="select-all-cats"
          />
          <label htmlFor="select-all-cats" className="cursor-pointer font-medium">
            Select All Categories ({categories.length})
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const itemsInCat = products.filter((p) => p.category === cat && p.status === 'ACTIVE');
          const totalStockUnits = itemsInCat.reduce((sum, p) => sum + p.currentStock, 0);
          const totalValuation = itemsInCat.reduce((sum, p) => sum + p.currentStock * p.sellingPrice, 0);
          const isSelected = selectedCats.has(cat);

          return (
            <div
              key={cat}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-50/60 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-amber-300 hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(cat)}
                      className="rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                      <Tags className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      {itemsInCat.length} SKUs
                    </span>
                    <button
                      onClick={() => deleteCategory(cat)}
                      title="Delete category"
                      className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h4 className="text-xs font-bold text-slate-900 tracking-wide">{cat}</h4>
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Total Units:</span>
                    <span className="font-mono font-bold text-slate-700">{totalStockUnits.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Stock Value:</span>
                    <span className="font-mono font-bold text-emerald-700">{formatPHP(totalValuation)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => setCurrentPage('products')}
                  className="text-amber-600 hover:text-amber-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Browse SKUs</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <Package className="w-3.5 h-3.5 text-slate-300" />
              </div>
            </div>
          );
        })}

        {categories.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
            <Tags className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs font-bold text-slate-700">No categories found</p>
            <p className="text-xs text-slate-400 mt-0.5">Click &quot;Add Category&quot; above to create one.</p>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Category"
        subtitle="Create a new classification category for materials"
        maxWidth="md"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AGGREGATES & GRAVEL"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg uppercase"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-xs"
            >
              Save Category
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
