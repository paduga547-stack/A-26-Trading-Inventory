import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Search,
  Bell,
  ShoppingCart,
  UserCheck,
  ChevronDown,
  LogOut,
  ShieldAlert,
  Smartphone,
  Download,
  MessageSquare,
} from 'lucide-react';
import { DriverAppDownloadModal } from '../delivery/DriverAppDownloadModal';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    currentPage,
    setCurrentPage,
    lowStockCount,
    pendingPaymentCount,
    overdueRentalsCount,
    unreadDriverMessagesCount,
    currentUser,
    logout,
    globalSearch,
    setGlobalSearch,
    products,
    sales,
    customers,
    showToast,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDriverDownloadOpen, setIsDriverDownloadOpen] = useState(false);

  const pageTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: 'Executive Operations Dashboard', subtitle: 'Real-time overview of inventory, sales, logistics & rentals' },
    products: { title: 'Materials & Products Catalog', subtitle: 'Specifications, pricing, unit quantities, and stock thresholds' },
    categories: { title: 'Product Categories', subtitle: 'Manage construction item classifications and grouping' },
    warehouses: { title: 'Warehouses & Depots Directory', subtitle: 'Manage storage facilities, branch depots, batching yards, and bay capacities' },
    'stock-in': { title: 'Stock In & Receiving', subtitle: 'Record warehouse deliveries, batch lots, and supplier stock replenishment' },
    'stock-out': { title: 'Stock Out & Disposal', subtitle: 'Process material releases, breakage, internal usage, or wastage write-offs' },
    'stock-transfer': { title: 'Warehouse Bin Transfer', subtitle: 'Move items between warehouse bays, yards, and staging locations' },
    'stock-adjustment': { title: 'Physical Count Reconciliation', subtitle: 'Perform inventory audit adjustments against actual warehouse counts' },
    'inventory-history': { title: 'Inventory Movement Logs', subtitle: 'Complete immutable trace of all stock transactions with timestamps' },
    'new-sale': { title: 'Point of Sale (POS Register)', subtitle: 'Create invoices, apply discounts, select customer & project, tender payment' },
    'sales-history': { title: 'Sales Order History', subtitle: 'Archive of official receipts, delivery fees, VAT breakdown, and balances' },
    returns: { title: 'Customer Returns & Restocking', subtitle: 'Process return requests, verify product condition, and refund' },
    'voided-sales': { title: 'Voided Invoices Register', subtitle: 'Audited log of canceled sales transactions with stock restoration tracking' },
    'accounts-receivable': { title: 'Accounts Receivable (Mga Utang)', subtitle: 'Credit terms, outstanding contractor balances, and debt tracking (Admin Only)' },
    'delivery-orders': { title: 'Delivery Dispatch & Logistics', subtitle: 'Trip planning, driver/truck assignment, and delivery receipt notes' },
    projects: { title: 'Contractor Construction Projects', subtitle: 'Job site tracking, material allocations, and project cost ledgers' },
    equipment: { title: 'Equipment & Machinery Fleet', subtitle: 'Mixers, compactors, generators, scaffolding sets, and rental rates' },
    rentals: { title: 'Active Equipment Rentals', subtitle: 'Contracts, security deposits, inspection checklists, and return processing' },
    maintenance: { title: 'Equipment Maintenance Log', subtitle: 'Service schedules, repair downtime, and equipment readiness checks' },
    suppliers: { title: 'Vendor & Supplier Directory', subtitle: 'Gas stations, quarries, cement mills, and hardware distributors' },
    'purchase-orders': { title: 'Purchase Orders & Fuel Expenses', subtitle: 'Issue material POs and fleet fuel/gas expense tickets' },
    payments: { title: 'All Payments Ledger', subtitle: 'Cash tenders, bank transfers, GCash, Maya, and check clearings' },
    'pending-verification': { title: 'Pending Payment Verification', subtitle: 'Review digital transfers and checks before crediting contractor balance' },
    employees: { title: 'Staff, Drivers & Crew Directory', subtitle: 'Logistics personnel, mechanics, warehousemen, and sales clerks' },
    reports: { title: 'Business Analytics & Reports', subtitle: 'Revenue, category breakdown, top clients, and CSV data export' },
    notifications: { title: 'System Notification Center', subtitle: 'Prioritized alerts for low stock, pending payments, and overdue rentals' },
    'audit-logs': { title: 'System Audit Trail', subtitle: 'Traceability for all user operations, financial edits, and inventory moves' },
    'user-admin': { title: 'User Accounts Management', subtitle: 'Admin portal to create and manage staff accounts' },
    settings: { title: 'Company & System Settings', subtitle: 'VAT rates, official receipts, company info, and data management' },
  };

  const currentInfo = pageTitles[currentPage] || { title: 'Construction ERP', subtitle: 'A-TWENTY SIX TRADING' };
  const totalAlerts = lowStockCount + pendingPaymentCount + overdueRentalsCount;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSearch.trim()) return;
    const q = globalSearch.toLowerCase().trim();

    // Check if matches product
    const prod = products.find((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    if (prod) {
      setCurrentPage('products');
      showToast(`Found product: ${prod.name}`);
      return;
    }

    // Check if matches invoice
    const sale = sales.find((s) => s.invoiceNo.toLowerCase().includes(q));
    if (sale) {
      setCurrentPage('sales-history');
      showToast(`Found invoice: ${sale.invoiceNo}`);
      return;
    }

    // Check if matches customer
    const cust = customers.find((c) => c.name.toLowerCase().includes(q));
    if (cust) {
      setCurrentPage('projects');
      showToast(`Showing client info: ${cust.name}`);
      return;
    }

    showToast(`Search applied in current view for "${globalSearch}"`, 'info');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 lg:px-8 py-3 flex items-center justify-between gap-4 shadow-2xs no-print">
      {/* Left Title & Mobile Menu Button */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="truncate">
          <h2 className="text-base font-bold text-slate-900 leading-tight truncate">
            {currentInfo.title}
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block truncate">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls: Search, New POS button, Notifications, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search SKU, product, invoice..."
            className="w-48 lg:w-64 pl-9 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
          />
        </form>

        {/* TOP BUTTON: Direct Link / Download Driver Mobile App */}
        <button
          type="button"
          onClick={() => setIsDriverDownloadOpen(true)}
          title="Download & Link Driver Mobile App"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-lg text-xs font-black transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Download Driver App</span>
          <span className="sm:hidden">Driver App</span>
          <Download className="w-3 h-3 opacity-70 hidden md:inline" />
        </button>

        {/* Quick New Sale POS Button (hide for stockman) */}
        {currentUser?.role !== 'INVENTORY' && currentPage !== 'new-sale' && (
          <button
            onClick={() => setCurrentPage('new-sale')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden lg:inline">New Sale</span>
          </button>
        )}

        {/* Driver Messages / Updates Live Badge */}
        {(currentUser?.role === 'ADMIN' || currentUser?.role === 'DISPATCHER') && (
          <button
            onClick={() => setCurrentPage('delivery-orders')}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-amber-50 hover:text-amber-800 transition-colors cursor-pointer"
            title={`Driver Live Updates (${unreadDriverMessagesCount} unread)`}
          >
            <MessageSquare className="w-4 h-4 text-amber-600" />
            {unreadDriverMessagesCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center animate-bounce shadow-xs">
                {unreadDriverMessagesCount}
              </span>
            )}
          </button>
        )}

        {/* Notification Bell (admin/cashier) */}
        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => setCurrentPage('notifications')}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Notification Center"
          >
            <Bell className="w-4 h-4" />
            {totalAlerts > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {totalAlerts}
              </span>
            )}
          </button>
        )}

        {/* User Account Menu & Logout */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                {currentUser.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                  {currentUser.name}
                </div>
                <div className="text-[10px] font-semibold text-amber-600 leading-none">
                  @{currentUser.username} &bull; {currentUser.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Current Active Account
                  </p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {currentUser.name}
                  </p>
                  <p className="text-[11px] font-mono text-amber-600">
                    @{currentUser.username} ({currentUser.role})
                  </p>
                </div>

                <div className="py-1">
                  {currentUser.role === 'ADMIN' && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setCurrentPage('user-admin');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-900 font-medium transition-colors flex items-center gap-2"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Manage Users & Create Accounts</span>
                    </button>
                  )}

                  {currentUser.role === 'ADMIN' && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setCurrentPage('settings');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-100 font-medium transition-colors"
                    >
                      System Settings
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 font-bold transition-colors flex items-center gap-2 border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out of Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Driver App Download & Link Modal */}
      <DriverAppDownloadModal
        isOpen={isDriverDownloadOpen}
        onClose={() => setIsDriverDownloadOpen(false)}
      />
    </header>
  );
};
