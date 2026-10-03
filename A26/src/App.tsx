import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/common/ToastContainer';

// Views
import { LoginView } from './components/admin/LoginView';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProductsView } from './components/inventory/ProductsView';
import { CategoriesView } from './components/inventory/CategoriesView';
import { WarehousesView } from './components/inventory/WarehousesView';
import { StockActionsView } from './components/inventory/StockActionsView';
import { InventoryHistoryView } from './components/inventory/InventoryHistoryView';
import { POSView } from './components/sales/POSView';
import { SalesHistoryView } from './components/sales/SalesHistoryView';
import { ReturnsView } from './components/sales/ReturnsView';
import { VoidedSalesView } from './components/sales/VoidedSalesView';
import { AccountsReceivableView } from './components/sales/AccountsReceivableView';
import { DeliveryOrdersView } from './components/delivery/DeliveryOrdersView';
import { DriverMobileAppView } from './components/delivery/DriverMobileAppView';
import { ProjectsView } from './components/projects/ProjectsView';
import { EquipmentView } from './components/rentals/EquipmentView';
import { RentalsView } from './components/rentals/RentalsView';
import { MaintenanceView } from './components/rentals/MaintenanceView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { PurchaseOrdersView } from './components/suppliers/PurchaseOrdersView';
import { PaymentsView } from './components/payments/PaymentsView';
import { PendingVerificationView } from './components/payments/PendingVerificationView';
import { EmployeesView } from './components/admin/EmployeesView';
import { ReportsView } from './components/reports/ReportsView';
import { NotificationsView } from './components/admin/NotificationsView';
import { AuditLogsView } from './components/admin/AuditLogsView';
import { UserAdminView } from './components/admin/UserAdminView';
import { SettingsView } from './components/admin/SettingsView';

const MainLayout: React.FC = () => {
  const { currentPage, currentUser, setCurrentPage } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuota = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // If user is not logged in, display the login panel
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">
        <LoginView />
        <ToastContainer />
      </div>
    );
  }

  // Stockman (INVENTORY role) access boundary:
  // "ang sa stockman is yung yung stock in stock out at stock transfer"
  const isStockman = currentUser.role === 'INVENTORY';
  const stockmanAllowedPages = [
    'stock-in',
    'stock-out',
    'stock-transfer',
    'stock-adjustment',
    'inventory-history',
    'products',
  ];

  if (isStockman && !stockmanAllowedPages.includes(currentPage)) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="lg:pl-64 flex-1 flex flex-col min-w-0 transition-all duration-200">
          <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <StockActionsView mode="stock-in" />
          </main>
        </div>
        <ToastContainer />
      </div>
    );
  }

  // Driver role access boundary:
  const isDriver = currentUser.role === 'DRIVER';
  const driverAllowedPages = ['driver-app', 'delivery-orders'];

  if (isDriver && !driverAllowedPages.includes(currentPage)) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="lg:pl-64 flex-1 flex flex-col min-w-0 transition-all duration-200">
          <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <DriverMobileAppView />
          </main>
        </div>
        <ToastContainer />
      </div>
    );
  }

  const renderActiveView = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardView />;
      case 'products':
        return <ProductsView />;
      case 'categories':
        return <CategoriesView />;
      case 'warehouses':
        return <WarehousesView />;
      case 'stock-in':
      case 'stock-out':
      case 'stock-transfer':
      case 'stock-adjustment':
        return <StockActionsView mode={currentPage} />;
      case 'inventory-history':
        return <InventoryHistoryView />;
      case 'new-sale':
        return <POSView />;
      case 'sales-history':
        return <SalesHistoryView />;
      case 'returns':
        return <ReturnsView />;
      case 'voided-sales':
        return <VoidedSalesView />;
      case 'accounts-receivable':
        // Strict Admin Check
        return currentUser.role === 'ADMIN' ? (
          <AccountsReceivableView />
        ) : (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
            <h3 className="font-bold text-rose-600 text-sm">Access Restricted</h3>
            <p className="text-xs text-slate-500 mt-1">Accounts Receivable (Utang) is restricted to the Administrator.</p>
          </div>
        );
      case 'delivery-orders':
        return <DeliveryOrdersView />;
      case 'driver-app':
        return <DriverMobileAppView />;
      case 'projects':
        return <ProjectsView />;
      case 'equipment':
        return <EquipmentView />;
      case 'rentals':
        return <RentalsView />;
      case 'maintenance':
        return <MaintenanceView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'purchase-orders':
        return <PurchaseOrdersView />;
      case 'payments':
        return <PaymentsView />;
      case 'pending-verification':
        return <PendingVerificationView />;
      case 'employees':
        return <EmployeesView />;
      case 'reports':
        return <ReportsView />;
      case 'notifications':
        return <NotificationsView />;
      case 'audit-logs':
        return <AuditLogsView />;
      case 'user-admin':
        return <UserAdminView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased">
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm flex items-center justify-between">
          <span className="flex-1">
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
          <button
            onClick={() => setGmpQuotaExceeded(false)}
            className="ml-3 text-amber-800 hover:text-amber-950 font-bold text-sm px-2 py-0.5 rounded hover:bg-amber-200/50"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0 transition-all duration-200">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>
      </div>

      {/* Floating System Notifications */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
