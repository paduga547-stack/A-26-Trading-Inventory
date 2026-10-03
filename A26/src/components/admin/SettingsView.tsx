import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SystemSettings } from '../../types';
import {
  Settings,
  Save,
  Download,
  Upload,
  Building,
  ShieldAlert,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    warehouses,
    updateSettings,
    exportDataJson,
    importDataJson,
    showToast,
  } = useApp();

  const [formData, setFormData] = useState<SystemSettings>({ ...settings });

  const handleChange = (field: keyof SystemSettings, val: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `A26_Construction_ERP_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Database exported successfully as JSON file!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importDataJson(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-600" />
          <span>System Settings & Configuration</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure official invoice branding, VAT taxation percentage, default logistics fleet, and database backups.
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 pb-2 border-b border-slate-100">
          <Building className="w-4 h-4 text-slate-500" />
          <span>Official Company & Receipt Information</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Registered Business Name *
            </label>
            <input
              type="text"
              required
              value={formData.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Business Type / Subtitle
            </label>
            <input
              type="text"
              value={formData.businessType}
              onChange={(e) => handleChange('businessType', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Official Physical Address (Printed on Receipts) *
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Telephone / Mobile Contact
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Official Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              BIR Tax Identification (TIN)
            </label>
            <input
              type="text"
              value={formData.tinNumber}
              onChange={(e) => handleChange('tinNumber', e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Value Added Tax (VAT Rate %) *
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              required
              value={formData.vatRate}
              onChange={(e) => handleChange('vatRate', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg text-amber-700"
            />
          </div>
        </div>

        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 pt-4 pb-2 border-b border-slate-100">
          <span>Logistics & Warehouse Defaults</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Default Delivery Driver
            </label>
            <input
              type="text"
              value={formData.defaultDriver}
              onChange={(e) => handleChange('defaultDriver', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Default Transport Truck
            </label>
            <input
              type="text"
              value={formData.defaultVehicle}
              onChange={(e) => handleChange('defaultVehicle', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
              Default Warehouse Bay
            </label>
            <input
              type="text"
              list="settings-warehouse-list"
              value={formData.defaultLocation}
              onChange={(e) => handleChange('defaultLocation', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
            <datalist id="settings-warehouse-list">
              {warehouses.map((wh) => (
                <option key={wh.id} value={`${wh.code} (${wh.name})`}>
                  {wh.code} — {wh.name} ({wh.address})
                </option>
              ))}
            </datalist>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save System Settings</span>
          </button>
        </div>
      </form>

      {/* Database Backup & Disaster Recovery */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 pb-2 border-b border-slate-100">
          <span>Database Backup, Restore & Data Lifecycle</span>
        </h4>
        <p className="text-xs text-slate-500">
          Export full JSON snapshots of inventory, orders, deliveries, and rental ledgers. You can restore this backup anytime on any machine.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Export */}
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Download Database Backup (JSON)</span>
          </button>

          {/* Import */}
          <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-300">
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Restore from JSON File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
