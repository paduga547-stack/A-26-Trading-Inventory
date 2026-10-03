import React from 'react';
import { useApp } from '../../context/AppContext';
import { NavigationPage } from '../../types';
import {
  LayoutDashboard,
  Package,
  Tags,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  History,
  ShoppingCart,
  Receipt,
  Undo2,
  Ban,
  Wallet,
  Truck,
  HardHat,
  Wrench,
  CalendarDays,
  Hammer,
  Building2,
  FileSpreadsheet,
  CreditCard,
  CheckCircle2,
  Users2,
  BarChart3,
  Bell,
  ClipboardList,
  ShieldCheck,
  Settings,
  X,
  LogOut,
  User,
  Smartphone,
  Warehouse as WarehouseIcon,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    currentPage,
    setCurrentPage,
    currentUser,
    logout,
    lowStockCount,
    outOfStockCount,
    pendingPaymentCount,
    overdueRentalsCount,
    openDeliveriesCount,
    settings,
  } = useApp();

  const handleNav = (page: NavigationPage) => {
    setCurrentPage(page);
    onClose();
  };

  const navItem = (page: NavigationPage, label: string, icon: React.ReactNode, badge?: number | string, badgeColor = 'bg-amber-500 text-white') => {
    const isActive = currentPage === page;
    return (
      <button
        key={page}
        onClick={() => handleNav(page)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
          isActive
            ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <span className={`shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'}`}>
            {icon}
          </span>
          <span className="truncate">{label}</span>
        </div>
        {badge !== undefined && Number(badge) > 0 && (
          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${badgeColor}`}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  // Role permissions:
  // Stockman (INVENTORY): stock in, stock out, stock transfer (+ inventory history & products view)
  const isStockman = currentUser?.role === 'INVENTORY';
  const isDriver = currentUser?.role === 'DRIVER';
  const isAdmin = currentUser?.role === 'ADMIN';
  const isCashier = currentUser?.role === 'CASHIER';
  const isDispatcher = currentUser?.role === 'DISPATCHER';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl tracking-tighter shadow-md shadow-amber-500/20">
              A26
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-wide text-white leading-tight">
                {settings.businessName}
              </h1>
              <p className="text-[10px] font-bold tracking-widest uppercase text-amber-400">
                Supply & Equipment ERP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        {currentUser && (
          <div className="px-3 py-2.5 mx-3 mt-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0">
                {currentUser.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                  {currentUser.role}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable Nav Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-5 text-slate-400 select-none">
          {/* Driver Role View */}
          {isDriver ? (
            <div>
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Driver Operations
              </div>
              <div className="space-y-0.5">
                {navItem('driver-app', 'Driver Mobile App', <Smartphone className="w-4 h-4 text-amber-400" />)}
                {navItem('delivery-orders', 'Delivery Orders View', <Truck className="w-4 h-4" />)}
              </div>
            </div>
          ) : isStockman ? (
            <div>
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                Stockman Operations
              </div>
              <div className="space-y-0.5">
                {navItem('stock-in', 'Stock In (Receiving)', <ArrowDownToLine className="w-4 h-4" />)}
                {navItem('stock-out', 'Stock Out (Disposal)', <ArrowUpFromLine className="w-4 h-4" />)}
                {navItem('stock-transfer', 'Stock Transfer', <ArrowLeftRight className="w-4 h-4" />)}
                {navItem('stock-adjustment', 'Stock Adjustment', <SlidersHorizontal className="w-4 h-4" />)}
                {navItem('inventory-history', 'Movement Logs', <History className="w-4 h-4" />)}
                {navItem('products', 'View Materials Catalog', <Package className="w-4 h-4" />)}
                {navItem('warehouses', 'Warehouses & Depots', <WarehouseIcon className="w-4 h-4" />)}
              </div>
            </div>
          ) : (
            <>
              {/* Overview (All non-stockman) */}
              <div>
                <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Overview
                </div>
                <div className="space-y-0.5">
                  {navItem('dashboard', 'Dashboard', <LayoutDashboard className="w-4 h-4" />)}
                </div>
              </div>

              {/* Inventory (Admin, Cashier, Dispatcher) */}
              <div>
                <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>Inventory</span>
                  {lowStockCount + outOfStockCount > 0 && (
                    <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1 rounded">
                      {lowStockCount + outOfStockCount} Alerts
                    </span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {navItem('products', 'Products Catalog', <Package className="w-4 h-4" />, lowStockCount + outOfStockCount, 'bg-rose-500 text-white')}
                  {navItem('categories', 'Categories', <Tags className="w-4 h-4" />)}
                  {navItem('warehouses', 'Warehouses & Depots', <WarehouseIcon className="w-4 h-4" />)}
                  {navItem('stock-in', 'Stock In', <ArrowDownToLine className="w-4 h-4" />)}
                  {navItem('stock-out', 'Stock Out', <ArrowUpFromLine className="w-4 h-4" />)}
                  {navItem('stock-transfer', 'Stock Transfer', <ArrowLeftRight className="w-4 h-4" />)}
                  {navItem('stock-adjustment', 'Stock Adjustment', <SlidersHorizontal className="w-4 h-4" />)}
                  {navItem('inventory-history', 'Movement Logs', <History className="w-4 h-4" />)}
                </div>
              </div>

              {/* Sales & Cashier */}
              <div>
                <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Sales & POS
                </div>
                <div className="space-y-0.5">
                  {navItem('new-sale', 'New Sale (POS)', <ShoppingCart className="w-4 h-4" />)}
                  {navItem('sales-history', 'Sales History', <Receipt className="w-4 h-4" />)}
                  {navItem('returns', 'Returns & Refunds', <Undo2 className="w-4 h-4" />)}
                  {navItem('voided-sales', 'Voided Sales', <Ban className="w-4 h-4" />)}
                  {/* Accounts Receivable / Debts: ADMIN-ONLY per prompt */}
                  {isAdmin && (
                    navItem('accounts-receivable', 'Accounts Receivable (Utang)', <Wallet className="w-4 h-4" />)
                  )}
                </div>
              </div>

              {/* Delivery & Logistics */}
              <div>
                <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Logistics &amp; Delivery
                </div>
                <div className="space-y-0.5">
                  {navItem('delivery-orders', 'Delivery Dispatch', <Truck className="w-4 h-4" />, openDeliveriesCount, 'bg-sky-500 text-white')}
                  {navItem('driver-app', 'Driver Mobile App', <Smartphone className="w-4 h-4 text-amber-400" />)}
                </div>
              </div>

              {/* Contractor Sites */}
              <div>
                <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Contractor Sites
                </div>
                <div className="space-y-0.5">
                  {navItem('projects', 'Projects Ledger', <HardHat className="w-4 h-4" />)}
                </div>
              </div>

              {/* Equipment Rentals */}
              <div>
                <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Rentals & Tools
                </div>
                <div className="space-y-0.5">
                  {navItem('equipment', 'Equipment Registry', <Wrench className="w-4 h-4" />)}
                  {navItem('rentals', 'Active Rentals', <CalendarDays className="w-4 h-4" />, overdueRentalsCount, 'bg-rose-500 text-white')}
                  {navItem('maintenance', 'Maintenance Log', <Hammer className="w-4 h-4" />)}
                </div>
              </div>

              {/* Procurement & Expenses (Gas PO) */}
              <div>
                <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Procurement & Fuel
                </div>
                <div className="space-y-0.5">
                  {navItem('suppliers', 'Suppliers & Stations', <Building2 className="w-4 h-4" />)}
                  {navItem('purchase-orders', 'Purchase Orders (PO / Gas)', <FileSpreadsheet className="w-4 h-4" />)}
                </div>
              </div>

              {/* Financials (Admin or Cashier) */}
              {(isAdmin || isCashier) && (
                <div>
                  <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    Financials
                  </div>
                  <div className="space-y-0.5">
                    {navItem('payments', 'Payments Ledger', <CreditCard className="w-4 h-4" />)}
                    {isAdmin && navItem('pending-verification', 'Pending Clearance', <CheckCircle2 className="w-4 h-4" />, pendingPaymentCount, 'bg-amber-500 text-slate-950 font-bold')}
                  </div>
                </div>
              )}

              {/* Administration: ADMIN ONLY */}
              {isAdmin && (
                <div>
                  <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Admin Portal
                  </div>
                  <div className="space-y-0.5">
                    {navItem('user-admin', 'Users & Accounts (Admin)', <ShieldCheck className="w-4 h-4" />)}
                    {navItem('employees', 'Staff & Crew', <Users2 className="w-4 h-4" />)}
                    {navItem('reports', 'Reports & Metrics', <BarChart3 className="w-4 h-4" />)}
                    {navItem('notifications', 'Notification Center', <Bell className="w-4 h-4" />)}
                    {navItem('audit-logs', 'Audit Trail', <ClipboardList className="w-4 h-4" />)}
                    {navItem('settings', 'System Settings', <Settings className="w-4 h-4" />)}
                  </div>
                </div>
              )}
            </>
          )}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-300 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>ERP Synced</span>
          </div>
          <button
            onClick={logout}
            className="text-[10px] text-slate-400 hover:text-amber-400 font-bold flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
