import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Product,
  Customer,
  Project,
  Equipment,
  Rental,
  Supplier,
  PurchaseOrder,
  Sale,
  Payment,
  DeliveryOrder,
  Employee,
  AuditLog,
  UserAccount,
  SystemSettings,
  StockMovement,
  NavigationPage,
  CategoryType,
  DeliveryStatus,
  PaymentMethod,
  DriverDutyStatus,
  DriverMessage,
  DriverMessageCategory,
  Warehouse,
  DriverShift,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_EMPLOYEES,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_PROJECTS,
  INITIAL_PRODUCTS,
  INITIAL_EQUIPMENT,
  INITIAL_RENTALS,
  INITIAL_SALES,
  INITIAL_PAYMENTS,
  INITIAL_DELIVERIES,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_WAREHOUSES,
} from '../data/initialData';

const INITIAL_DRIVER_MESSAGES: DriverMessage[] = [
  {
    id: 'dm-1',
    driverName: 'Pedro Santos',
    deliveryId: 'del-1',
    deliveryNo: 'DR-2026-0001',
    text: 'Papunta na po sa Cavite Jobsite. Est. arrival 10:30 AM.',
    category: 'EN_ROUTE',
    sender: 'DRIVER',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isReadByStore: true,
    isReadByDriver: true,
  },
  {
    id: 'dm-2',
    driverName: 'Pedro Santos',
    deliveryId: 'del-1',
    deliveryNo: 'DR-2026-0001',
    text: 'Medyo traffic sa Aguinaldo Highway dahil sa road repairs, pero moving pa naman po.',
    category: 'TRAFFIC',
    sender: 'DRIVER',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    isReadByStore: false,
    isReadByDriver: true,
  },
  {
    id: 'dm-3',
    driverName: 'Juan Dela Cruz',
    deliveryId: 'del-2',
    deliveryNo: 'DR-2026-0002',
    text: 'Nandito na sa project site ng ABC Construction. Sinisimulan na i-unload ang semento.',
    category: 'ARRIVED',
    sender: 'DRIVER',
    createdAt: new Date(Date.now() - 900000).toISOString(),
    isReadByStore: false,
    isReadByDriver: true,
  },
];

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface AppContextType {
  products: Product[];
  categories: CategoryType[];
  customers: Customer[];
  projects: Project[];
  equipment: Equipment[];
  rentals: Rental[];
  sales: Sale[];
  payments: Payment[];
  deliveryOrders: DeliveryOrder[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  stockMovements: StockMovement[];
  employees: Employee[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
  users: UserAccount[];
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  currentPage: NavigationPage;
  globalSearch: string;
  toasts: ToastMessage[];

  // Authentication
  login: (username: string, password: string) => boolean;
  logout: () => void;
  createUserAccount: (data: { username: string; password: string; name: string; role: UserAccount['role'] }) => boolean;
  deleteUserAccount: (id: string) => void;
  bulkDeleteUsers: (ids: string[]) => void;
  resetUserPassword: (userId: string, newPassword: string) => boolean;

  // Navigation & UI
  setCurrentPage: (page: NavigationPage) => void;
  setCurrentUser: (user: UserAccount) => void;
  setGlobalSearch: (q: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;

  // Products & Inventory
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  bulkDeleteProducts: (ids: string[]) => void;
  stockIn: (productId: string, qty: number, unitCost: number, reason: string, location?: string, supplierNameOrId?: string) => void;
  stockOut: (productId: string, qty: number, reason: string, destination?: string) => void;
  stockTransfer: (productId: string, qty: number, fromLocation: string, toLocation: string, reason: string) => void;
  stockAdjustment: (productId: string, countedStock: number, reason: string) => void;
  addCategory: (cat: CategoryType) => void;
  deleteCategory: (cat: CategoryType) => void;
  bulkDeleteCategories: (cats: CategoryType[]) => void;

  // Warehouses
  warehouses: Warehouse[];
  createWarehouse: (warehouse: Omit<Warehouse, 'id' | 'createdAt'>) => void;
  updateWarehouse: (id: string, updates: Partial<Warehouse>) => void;
  deleteWarehouse: (id: string) => void;
  bulkDeleteWarehouses: (ids: string[]) => void;

  // Sales
  createSale: (saleData: {
    customerId: string;
    projectId?: string | null;
    items: { productId: string; qty: number; unitPrice: number }[];
    discount: number;
    birTaxRate?: number;
    deliveryFee: number;
    paymentMethod: PaymentMethod;
    paidAmount: number;
    paymentReference?: string;
    dueDate?: string;
    notes?: string;
  }) => Sale;
  voidSale: (saleId: string, reason: string) => void;
  deleteSale: (saleId: string) => void;
  bulkDeleteSales: (ids: string[]) => void;
  processReturn: (
    saleId: string,
    items: { productId: string; qty: number; restock: boolean }[],
    refundAmount: number,
    reason: string
  ) => void;

  // Payments
  recordPayment: (paymentData: {
    salesId: string;
    reference: string;
    method: PaymentMethod;
    amount: number;
    notes?: string;
  }) => void;
  verifyPayment: (paymentId: string) => void;
  rejectPayment: (paymentId: string) => void;
  deletePayment: (id: string) => void;
  bulkDeletePayments: (ids: string[]) => void;

  // Deliveries
  createDeliveryOrder: (data: {
    salesId?: string | null;
    customerId: string;
    customerName?: string;
    projectId?: string | null;
    items: { productId: string; qty: number }[];
    driver: string;
    vehicle: string;
    address: string;
    contactPhone: string;
    notes?: string;
    isCod?: boolean;
    codAmount?: number;
    destinationGps?: { latitude: number; longitude: number; addressLabel?: string } | null;
  }) => void;
  updateDeliveryStatus: (id: string, status: DeliveryStatus) => void;
  deleteDeliveryOrder: (id: string) => void;
  bulkDeleteDeliveryOrders: (ids: string[]) => void;
  assignDriver: (deliveryId: string, driverName: string) => void;
  updateDeliveryPOD: (
    deliveryId: string,
    photoDataUrl: string,
    receivedBy: string,
    signatureDataUrl?: string
  ) => void;
  updateDriverGps: (driverName: string, latitude: number, longitude: number) => void;
  setDriverBreakStatus: (driverName: string, isOnBreak: boolean) => void;
  collectDeliveryCod: (
    deliveryId: string,
    amountCollected: number,
    paymentMethod: 'CASH' | 'GCASH' | 'CHECK',
    reference?: string,
    notes?: string
  ) => void;
  driverDutyStatuses: DriverDutyStatus[];
  driverMessages: DriverMessage[];
  unreadDriverMessagesCount: number;
  sendDriverMessage: (data: {
    driverName: string;
    text: string;
    category?: DriverMessageCategory;
    deliveryId?: string | null;
    deliveryNo?: string | null;
    sender?: 'DRIVER' | 'STORE_ADMIN';
  }) => DriverMessage;
  markDriverMessagesAsRead: (driverName?: string, byWhom?: 'STORE' | 'DRIVER') => void;

  // Driver Shifts & Trip Summaries
  driverShifts: DriverShift[];
  startDriverShift: (driverName: string, vehicleType?: string) => DriverShift;
  endDriverShift: (
    driverName: string,
    stats: {
      totalDistanceKm: number;
      fuelConsumptionLiters: number;
      fuelEstimatedCost: number;
      completedDeliveriesCount: number;
      totalDeliveriesAssigned: number;
      totalCodCollected: number;
      vehicleType?: string;
      notes?: string;
    }
  ) => DriverShift;

  // Projects
  createProject: (data: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  bulkDeleteProjects: (ids: string[]) => void;

  // Equipment & Rentals
  createEquipment: (data: Omit<Equipment, 'id'>) => void;
  updateEquipment: (id: string, updates: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;
  bulkDeleteEquipment: (ids: string[]) => void;
  createRental: (data: {
    equipmentId: string;
    customerId: string;
    projectId?: string | null;
    qty: number;
    startDate: string;
    endDate: string;
    conditionNotes?: string;
  }) => void;
  returnRental: (
    rentalId: string,
    data: {
      condition: Equipment['condition'];
      engine: string;
      body: string;
      accessories: string;
      damageNotes?: string;
      additionalCharges: number;
    }
  ) => void;
  deleteRental: (id: string) => void;
  bulkDeleteRentals: (ids: string[]) => void;

  // Suppliers & POs
  createSupplier: (data: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  bulkDeleteSuppliers: (ids: string[]) => void;
  createPurchaseOrder: (data: {
    supplierId: string;
    category?: 'MATERIALS' | 'GAS_FUEL' | 'OFFICE_SUPPLIES' | 'EQUIPMENT_PARTS' | 'OTHER';
    fuelVehicle?: string;
    fuelDriver?: string;
    fuelLiters?: number;
    items: { productId: string; qty: number; unitPrice: number; productName?: string; unit?: string }[];
    notes?: string;
  }) => void;
  receivePurchaseOrder: (poId: string) => void;
  deletePurchaseOrder: (id: string) => void;
  bulkDeletePurchaseOrders: (ids: string[]) => void;

  // Customers & Employees
  createCustomer: (data: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  bulkDeleteCustomers: (ids: string[]) => void;
  createEmployee: (data: Omit<Employee, 'id' | 'createdAt'>) => void;
  deleteEmployee: (id: string) => void;
  bulkDeleteEmployees: (ids: string[]) => void;

  // Stock Movements & Audit
  deleteStockMovement: (id: string) => void;
  bulkDeleteStockMovements: (ids: string[]) => void;
  deleteAuditLog: (id: string) => void;
  bulkDeleteAuditLogs: (ids: string[]) => void;

  // System
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  resetToInitialData: () => void;
  clearAllData: () => void;
  exportDataJson: () => string;
  importDataJson: (json: string) => boolean;

  // Computed
  lowStockCount: number;
  outOfStockCount: number;
  pendingPaymentCount: number;
  overdueRentalsCount: number;
  todaySalesTotal: number;
  stockValueCost: number;
  stockValueSelling: number;
  activeRentalsCount: number;
  openDeliveriesCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Storage key with versioning so we can seamlessly start fresh
const STORAGE_PREFIX = 'a26_construction_erp_v2_';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const getStored = <T,>(key: string, fallback: T): T => {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  };

  const [products, setProducts] = useState<Product[]>(() => getStored('products', INITIAL_PRODUCTS));
  const [categories, setCategories] = useState<CategoryType[]>(() => getStored('categories', INITIAL_CATEGORIES));
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => getStored('warehouses', INITIAL_WAREHOUSES));
  const [customers, setCustomers] = useState<Customer[]>(() => getStored('customers', INITIAL_CUSTOMERS));
  const [projects, setProjects] = useState<Project[]>(() => getStored('projects', INITIAL_PROJECTS));
  const [equipment, setEquipment] = useState<Equipment[]>(() => getStored('equipment', INITIAL_EQUIPMENT));
  const [rentals, setRentals] = useState<Rental[]>(() => getStored('rentals', INITIAL_RENTALS));
  const [sales, setSales] = useState<Sale[]>(() => getStored('sales', INITIAL_SALES));
  const [payments, setPayments] = useState<Payment[]>(() => getStored('payments', INITIAL_PAYMENTS));
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>(() => getStored('deliveries', INITIAL_DELIVERIES));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getStored('suppliers', INITIAL_SUPPLIERS));
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => getStored('pos', INITIAL_PURCHASE_ORDERS));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => getStored('movements', INITIAL_STOCK_MOVEMENTS));
  const [employees, setEmployees] = useState<Employee[]>(() => getStored('employees', INITIAL_EMPLOYEES));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getStored('audit', INITIAL_AUDIT_LOGS));
  const [settings, setSettings] = useState<SystemSettings>(() => getStored('settings', INITIAL_SETTINGS));
  const [users, setUsers] = useState<UserAccount[]>(() => getStored('users', INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getStored('session_user', null));
  const [currentPage, setCurrentPage] = useState<NavigationPage>('dashboard');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [driverDutyStatuses, setDriverDutyStatuses] = useState<DriverDutyStatus[]>(() =>
    getStored('driver_duty_statuses', [
      { driverName: 'Pedro Santos', isOnBreak: false, breakStartTime: null, lastGps: null },
      { driverName: 'Juan Dela Cruz', isOnBreak: false, breakStartTime: null, lastGps: null },
    ])
  );
  const [driverMessages, setDriverMessages] = useState<DriverMessage[]>(() =>
    getStored('driver_messages', INITIAL_DRIVER_MESSAGES)
  );
  const [driverShifts, setDriverShifts] = useState<DriverShift[]>(() =>
    getStored('driver_shifts', [])
  );

  // Auto-sync storage
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'driver_duty_statuses', JSON.stringify(driverDutyStatuses));
  }, [driverDutyStatuses]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'driver_messages', JSON.stringify(driverMessages));
  }, [driverMessages]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'driver_shifts', JSON.stringify(driverShifts));
  }, [driverShifts]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'products', JSON.stringify(products));
  }, [products]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'categories', JSON.stringify(categories));
  }, [categories]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'warehouses', JSON.stringify(warehouses));
  }, [warehouses]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'customers', JSON.stringify(customers));
  }, [customers]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'projects', JSON.stringify(projects));
  }, [projects]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'equipment', JSON.stringify(equipment));
  }, [equipment]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'rentals', JSON.stringify(rentals));
  }, [rentals]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'sales', JSON.stringify(sales));
  }, [sales]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'payments', JSON.stringify(payments));
  }, [payments]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'deliveries', JSON.stringify(deliveryOrders));
  }, [deliveryOrders]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'suppliers', JSON.stringify(suppliers));
  }, [suppliers]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'pos', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'movements', JSON.stringify(stockMovements));
  }, [stockMovements]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'employees', JSON.stringify(employees));
  }, [employees]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'audit', JSON.stringify(auditLogs));
  }, [auditLogs]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'settings', JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'users', JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_PREFIX + 'session_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_PREFIX + 'session_user');
    }
  }, [currentUser]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 3800);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const logAudit = (action: string, module: string, details: string, refId?: string) => {
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      user: currentUser?.name || 'System Admin',
      action,
      module,
      details,
      referenceId: refId,
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 499)]);
  };

  // ------------------- AUTHENTICATION -------------------
  const login = (usernameInput: string, passwordInput: string): boolean => {
    const match = users.find(
      (u) =>
        u.username.toLowerCase() === usernameInput.toLowerCase().trim() &&
        (u.password === passwordInput || (!u.password && passwordInput === '123456789')) &&
        u.status === 'ACTIVE'
    );

    if (match) {
      setCurrentUser(match);
      logAudit('LOGIN_SUCCESS', 'AUTH', `User ${match.username} logged in successfully`, match.id);
      showToast(`Welcome back, ${match.name}!`);
      // If stockman (INVENTORY), send directly to stock-in
      if (match.role === 'INVENTORY') {
        setCurrentPage('stock-in');
      } else {
        setCurrentPage('dashboard');
      }
      return true;
    }

    showToast('Invalid username or password', 'error');
    return false;
  };

  const logout = () => {
    if (currentUser) {
      logAudit('LOGOUT', 'AUTH', `User ${currentUser.username} logged out`, currentUser.id);
    }
    setCurrentUser(null);
    setCurrentPage('dashboard');
    showToast('Logged out successfully', 'info');
  };

  const createUserAccount = (data: {
    username: string;
    password: string;
    name: string;
    role: UserAccount['role'];
  }): boolean => {
    if (currentUser?.role !== 'ADMIN') {
      showToast('Permission denied: Only the Admin account can create new user accounts!', 'error');
      return false;
    }

    const trimmedUser = data.username.trim();
    if (!trimmedUser || !data.password.trim()) {
      showToast('Username and password are required', 'error');
      return false;
    }

    if (users.some((u) => u.username.toLowerCase() === trimmedUser.toLowerCase())) {
      showToast(`Username "${trimmedUser}" is already taken!`, 'error');
      return false;
    }

    const newUser: UserAccount = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      username: trimmedUser,
      password: data.password,
      name: data.name.trim() || trimmedUser,
      role: data.role,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      createdBy: currentUser.username,
    };

    setUsers((prev) => [...prev, newUser]);
    logAudit('CREATE_USER', 'USERS', `Admin created new ${data.role} account @${newUser.username}`, newUser.id);
    showToast(`Account @${newUser.username} (${data.role}) created successfully!`);
    return true;
  };

  const deleteUserAccount = (id: string) => {
    if (currentUser?.role !== 'ADMIN') {
      showToast('Only Admin can delete user accounts', 'error');
      return;
    }
    const target = users.find((u) => u.id === id);
    if (!target) return;
    if (target.username.toLowerCase() === 'a26jaya') {
      showToast('The master admin account (A26Jaya) cannot be deleted!', 'error');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    logAudit('DELETE_USER', 'USERS', `Deleted user account @${target.username}`, id);
    showToast(`Account @${target.username} deleted`);
  };

  const bulkDeleteUsers = (ids: string[]) => {
    if (currentUser?.role !== 'ADMIN') {
      showToast('Only Admin can delete user accounts', 'error');
      return;
    }
    const validIds = ids.filter((id) => {
      const u = users.find((x) => x.id === id);
      return u && u.username.toLowerCase() !== 'a26jaya';
    });
    setUsers((prev) => prev.filter((u) => !validIds.includes(u.id)));
    showToast(`Deleted ${validIds.length} user accounts`);
  };

  const resetUserPassword = (userId: string, newPassword: string): boolean => {
    if (currentUser?.role !== 'ADMIN') {
      showToast('Permission denied: Only the Admin can reset account passwords!', 'error');
      return false;
    }
    const trimmed = newPassword.trim();
    if (!trimmed) {
      showToast('Password cannot be empty', 'error');
      return false;
    }
    const target = users.find((u) => u.id === userId);
    if (!target) {
      showToast('User account not found', 'error');
      return false;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: trimmed } : u))
    );
    if (currentUser.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, password: trimmed } : null));
    }
    logAudit('RESET_PASSWORD', 'USERS', `Admin reset password for user @${target.username} (${target.name})`, userId);
    showToast(`Password successfully updated for @${target.username}!`, 'success');
    return true;
  };

  // ------------------- PRODUCTS & INVENTORY -------------------
  const addProduct = (pData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `PROD-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...pData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    setProducts((prev) => [newProduct, ...prev]);
    logAudit('ADD_PRODUCT', 'INVENTORY', `Added material: ${newProduct.name} (${newProduct.sku})`, id);
    showToast(`Product "${newProduct.name}" added successfully`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
  };

  const deleteProduct = (id: string) => {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setProducts((prev) => prev.filter((x) => x.id !== id));
    logAudit('DELETE_PRODUCT', 'INVENTORY', `Deleted material: ${p.name}`, id);
    showToast(`Deleted material: "${p.name}"`);
  };

  const bulkDeleteProducts = (ids: string[]) => {
    const toDeleteSet = new Set(ids);
    setProducts((prev) => prev.filter((p) => !toDeleteSet.has(p.id)));
    logAudit('BULK_DELETE_PRODUCTS', 'INVENTORY', `Bulk deleted ${ids.length} materials`);
    showToast(`Deleted ${ids.length} materials`);
  };

  const stockIn = (
    productId: string,
    qty: number,
    unitCost: number,
    reason: string,
    location?: string,
    supplierNameOrId?: string
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const newStock = prod.currentStock + qty;
    updateProduct(productId, {
      currentStock: newStock,
      buyingPrice: unitCost > 0 ? unitCost : prod.buyingPrice,
      location: location || prod.location,
    });
    const moveId = `STM-${Date.now().toString().slice(-6)}`;
    const move: StockMovement = {
      id: moveId,
      type: 'IN',
      productId,
      productName: prod.name,
      qty,
      unit: prod.unit,
      referenceType: 'STOCK_IN',
      referenceId: moveId,
      fromLocation: supplierNameOrId ? `SUPPLIER: ${supplierNameOrId}` : 'SUPPLIER / PRODUCTION',
      toLocation: location || prod.location,
      reason: reason || 'Stock In Replenishment',
      createdAt: new Date().toISOString(),
      user: currentUser?.name || 'Stockman',
    };
    setStockMovements((prev) => [move, ...prev]);
    logAudit('STOCK_IN', 'INVENTORY', `Stock In +${qty} ${prod.unit} for ${prod.name} (Source: ${supplierNameOrId || 'Direct'})`, productId);
    showToast(`Stock In: +${qty} ${prod.unit} for ${prod.name}`);
  };

  const stockOut = (productId: string, qty: number, reason: string, destination?: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    if (prod.currentStock < qty) {
      showToast(`Cannot stock out ${qty}. Available stock is only ${prod.currentStock}!`, 'error');
      return;
    }
    const newStock = prod.currentStock - qty;
    updateProduct(productId, { currentStock: newStock });
    const moveId = `STM-${Date.now().toString().slice(-6)}`;
    const move: StockMovement = {
      id: moveId,
      type: 'OUT',
      productId,
      productName: prod.name,
      qty,
      unit: prod.unit,
      referenceType: 'STOCK_OUT',
      referenceId: moveId,
      fromLocation: prod.location,
      toLocation: destination || 'RELEASED / DISPATCH',
      reason: reason || 'Manual Stock Out / Spoilage',
      createdAt: new Date().toISOString(),
      user: currentUser?.name || 'Stockman',
    };
    setStockMovements((prev) => [move, ...prev]);
    logAudit('STOCK_OUT', 'INVENTORY', `Stock Out -${qty} ${prod.unit} for ${prod.name} (Destination: ${destination || reason || 'Direct'})`, productId);
    showToast(`Stock Out: -${qty} ${prod.unit} for ${prod.name}`);
  };

  const stockTransfer = (productId: string, qty: number, fromLocation: string, toLocation: string, reason: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const moveId = `STM-${Date.now().toString().slice(-6)}`;
    const move: StockMovement = {
      id: moveId,
      type: 'TRANSFER',
      productId,
      productName: prod.name,
      qty,
      unit: prod.unit,
      referenceType: 'TRANSFER',
      referenceId: moveId,
      fromLocation,
      toLocation,
      reason: reason || `Transfer ${fromLocation} -> ${toLocation}`,
      createdAt: new Date().toISOString(),
      user: currentUser?.name || 'Stockman',
    };
    setStockMovements((prev) => [move, ...prev]);
    updateProduct(productId, { location: toLocation });
    logAudit('STOCK_TRANSFER', 'INVENTORY', `Transferred ${qty} ${prod.unit} of ${prod.name} to ${toLocation}`, productId);
    showToast(`Transferred ${qty} ${prod.unit} to ${toLocation}`);
  };

  const stockAdjustment = (productId: string, countedStock: number, reason: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const diff = countedStock - prod.currentStock;
    updateProduct(productId, { currentStock: countedStock });
    const moveId = `STM-${Date.now().toString().slice(-6)}`;
    const move: StockMovement = {
      id: moveId,
      type: 'ADJUSTMENT',
      productId,
      productName: prod.name,
      qty: Math.abs(diff),
      unit: prod.unit,
      referenceType: 'ADJUSTMENT',
      referenceId: moveId,
      fromLocation: prod.location,
      toLocation: prod.location,
      reason: `Audit adjustment: was ${prod.currentStock}, adjusted to ${countedStock}. ${reason}`,
      createdAt: new Date().toISOString(),
      user: currentUser?.name || 'Stockman',
    };
    setStockMovements((prev) => [move, ...prev]);
    logAudit('STOCK_ADJUSTMENT', 'INVENTORY', `Adjusted stock for ${prod.name}: ${diff >= 0 ? '+' : ''}${diff}`, productId);
    showToast(`Stock adjusted to ${countedStock} ${prod.unit}`);
  };

  const addCategory = (cat: CategoryType) => {
    if (categories.includes(cat)) {
      showToast(`Category "${cat}" already exists`, 'warning');
      return;
    }
    setCategories((prev) => [...prev, cat]);
    showToast(`Category "${cat}" added`);
  };

  const deleteCategory = (cat: CategoryType) => {
    setCategories((prev) => prev.filter((c) => c !== cat));
    showToast(`Category "${cat}" removed`);
  };

  const bulkDeleteCategories = (cats: CategoryType[]) => {
    const catSet = new Set(cats);
    setCategories((prev) => prev.filter((c) => !catSet.has(c)));
    showToast(`Deleted ${cats.length} categories`);
  };

  // ------------------- WAREHOUSES MANAGEMENT -------------------
  const createWarehouse = (data: Omit<Warehouse, 'id' | 'createdAt'>) => {
    const newId = `WH-${Date.now().toString().slice(-4)}`;
    const newWarehouse: Warehouse = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
    };
    setWarehouses((prev) => [newWarehouse, ...prev]);
    logAudit('CREATE_WAREHOUSE', 'INVENTORY', `Created new warehouse: ${data.name} (${data.code})`, newId);
    showToast(`Warehouse "${data.name}" added successfully!`);
  };

  const updateWarehouse = (id: string, updates: Partial<Warehouse>) => {
    setWarehouses((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
    showToast('Warehouse details updated!');
  };

  const deleteWarehouse = (id: string) => {
    const target = warehouses.find((w) => w.id === id);
    setWarehouses((prev) => prev.filter((w) => w.id !== id));
    logAudit('DELETE_WAREHOUSE', 'INVENTORY', `Deleted warehouse ${target?.name || id}`, id);
    showToast(`Warehouse removed.`);
  };

  const bulkDeleteWarehouses = (ids: string[]) => {
    setWarehouses((prev) => prev.filter((w) => !ids.includes(w.id)));
    logAudit('BULK_DELETE_WAREHOUSES', 'INVENTORY', `Bulk removed ${ids.length} warehouses`, ids.join(','));
    showToast(`Removed ${ids.length} warehouses.`);
  };

  // ------------------- SALES & POS -------------------
  const createSale = (saleData: {
    customerId: string;
    projectId?: string | null;
    items: { productId: string; qty: number; unitPrice: number }[];
    discount: number;
    birTaxRate?: number;
    deliveryFee: number;
    paymentMethod: PaymentMethod;
    paidAmount: number;
    paymentReference?: string;
    dueDate?: string;
    notes?: string;
  }) => {
    const saleId = `INV-2026-${String(sales.length + 1).padStart(4, '0')}`;
    const invoiceNo = saleId;

    const lineItems = saleData.items.map((item) => {
      const p = products.find((x) => x.id === item.productId);
      return {
        productId: item.productId,
        productName: p?.name || 'Material Item',
        unit: p?.unit || 'PCS',
        qty: item.qty,
        unitPrice: item.unitPrice,
        costPrice: p?.buyingPrice || 0,
      };
    });

    const subtotal = lineItems.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);
    const discountAmount = Math.max(0, saleData.discount || 0);
    const taxableBase = Math.max(0, subtotal - discountAmount);
    const taxRate = saleData.birTaxRate !== undefined ? saleData.birTaxRate : settings.vatRate;
    const vat = Math.round(taxableBase * (taxRate / 100) * 100) / 100;
    const total = taxableBase + vat + (saleData.deliveryFee || 0);

    const paid = saleData.paidAmount || 0;
    const balance = Math.max(0, total - paid);
    let status: Sale['status'] = 'UNPAID';
    if (balance <= 0) status = 'PAID';
    else if (paid > 0) status = 'PARTIALLY_PAID';

    const newSale: Sale = {
      id: saleId,
      invoiceNo,
      customerId: saleData.customerId,
      projectId: saleData.projectId || null,
      items: lineItems,
      subtotal,
      discount: discountAmount,
      vat,
      deliveryFee: saleData.deliveryFee || 0,
      total,
      status,
      paidAmount: paid,
      balance,
      dueDate: saleData.dueDate,
      paymentMethod: saleData.paymentMethod,
      createdAt: new Date().toISOString(),
      cashierName: currentUser?.name || 'Cashier',
      notes: saleData.notes,
    };

    // Deduct stock
    lineItems.forEach((item) => {
      const p = products.find((x) => x.id === item.productId);
      if (p) {
        const remaining = Math.max(0, p.currentStock - item.qty);
        updateProduct(p.id, { currentStock: remaining });
        const move: StockMovement = {
          id: `STM-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 4)}`,
          type: 'OUT',
          productId: p.id,
          productName: p.name,
          qty: item.qty,
          unit: p.unit,
          referenceType: 'SALES',
          referenceId: invoiceNo,
          fromLocation: p.location,
          toLocation: 'CUSTOMER DISPATCH',
          reason: `Sale ${invoiceNo}`,
          createdAt: new Date().toISOString(),
          user: currentUser?.name || 'Cashier',
        };
        setStockMovements((prev) => [move, ...prev]);
      }
    });

    // Record payment if paid
    if (paid > 0) {
      const isCash = saleData.paymentMethod === 'CASH';
      const paymentEntry: Payment = {
        id: `PAY-${Date.now().toString().slice(-6)}`,
        salesId: saleId,
        reference: saleData.paymentReference || (isCash ? 'CASH-TENDER' : `REF-${Date.now().toString().slice(-6)}`),
        method: saleData.paymentMethod,
        amount: paid,
        date: new Date().toISOString().slice(0, 10),
        status: isCash ? 'VERIFIED' : 'PENDING',
        verifiedBy: isCash ? (currentUser?.name || 'Cashier') : null,
        verificationDate: isCash ? new Date().toISOString().slice(0, 10) : null,
        notes: isCash ? 'Cash at Counter' : 'Online / Bank Transfer pending clearance',
      };
      setPayments((prev) => [paymentEntry, ...prev]);
    }

    setSales((prev) => [newSale, ...prev]);
    logAudit('SALE_CREATED', 'SALES', `Created invoice ${invoiceNo} for ₱${total.toLocaleString()}`, saleId);
    showToast(`Invoice ${invoiceNo} generated! ₱${total.toLocaleString()}`);
    return newSale;
  };

  const voidSale = (saleId: string, reason: string) => {
    const s = sales.find((x) => x.id === saleId);
    if (!s || s.status === 'VOIDED') return;

    // Restore stock
    s.items.forEach((item) => {
      const p = products.find((x) => x.id === item.productId);
      if (p) {
        updateProduct(p.id, { currentStock: p.currentStock + item.qty });
        const move: StockMovement = {
          id: `STM-${Date.now().toString().slice(-6)}`,
          type: 'IN',
          productId: p.id,
          productName: p.name,
          qty: item.qty,
          unit: p.unit,
          referenceType: 'RETURN_RESTOCK',
          referenceId: s.invoiceNo,
          fromLocation: 'VOIDED SALE RESTORATION',
          toLocation: p.location,
          reason: `Restored stock from voided invoice ${s.invoiceNo}: ${reason}`,
          createdAt: new Date().toISOString(),
          user: currentUser?.name || 'Admin',
        };
        setStockMovements((prev) => [move, ...prev]);
      }
    });

    setSales((prev) =>
      prev.map((x) =>
        x.id === saleId
          ? {
              ...x,
              status: 'VOIDED',
              voidedReason: reason,
              voidedAt: new Date().toISOString(),
              voidedBy: currentUser?.name || 'Admin',
            }
          : x
      )
    );

    logAudit('VOID_SALE', 'SALES', `Voided invoice ${s.invoiceNo}: ${reason}`, saleId);
    showToast(`Invoice ${s.invoiceNo} has been VOIDED and inventory restored`, 'warning');
  };

  const deleteSale = (id: string) => {
    setSales((prev) => prev.filter((s) => s.id !== id));
    logAudit('DELETE_SALE', 'SALES', `Deleted sales invoice record`, id);
    showToast(`Invoice record removed`);
  };

  const bulkDeleteSales = (ids: string[]) => {
    const idSet = new Set(ids);
    setSales((prev) => prev.filter((s) => !idSet.has(s.id)));
    logAudit('BULK_DELETE_SALES', 'SALES', `Deleted ${ids.length} sales invoice records`);
    showToast(`Deleted ${ids.length} invoices`);
  };

  const processReturn = (
    saleId: string,
    items: { productId: string; qty: number; restock: boolean }[],
    refundAmount: number,
    reason: string
  ) => {
    const s = sales.find((x) => x.id === saleId);
    if (!s) return;

    items.forEach((item) => {
      if (item.restock) {
        const p = products.find((x) => x.id === item.productId);
        if (p) {
          updateProduct(p.id, { currentStock: p.currentStock + item.qty });
          const move: StockMovement = {
            id: `STM-${Date.now().toString().slice(-6)}`,
            type: 'IN',
            productId: p.id,
            productName: p.name,
            qty: item.qty,
            unit: p.unit,
            referenceType: 'RETURN_RESTOCK',
            referenceId: s.invoiceNo,
            fromLocation: 'CUSTOMER_RETURN',
            toLocation: p.location,
            reason: `Return restocked: ${reason}`,
            createdAt: new Date().toISOString(),
            user: currentUser?.name || 'Staff',
          };
          setStockMovements((prev) => [move, ...prev]);
        }
      }
    });

    logAudit('RETURN_PROCESSED', 'SALES', `Processed return for ${s.invoiceNo}. Refunded ₱${refundAmount}`, saleId);
    showToast(`Processed return for ${s.invoiceNo}. Refund ₱${refundAmount.toLocaleString()}`);
  };

  // ------------------- PAYMENTS -------------------
  const recordPayment = (paymentData: {
    salesId: string;
    reference: string;
    method: PaymentMethod;
    amount: number;
    notes?: string;
  }) => {
    const s = sales.find((x) => x.id === paymentData.salesId);
    if (!s) return;

    const isCash = paymentData.method === 'CASH';
    const payEntry: Payment = {
      id: `PAY-${Date.now().toString().slice(-6)}`,
      salesId: s.id,
      reference: paymentData.reference,
      method: paymentData.method,
      amount: paymentData.amount,
      date: new Date().toISOString().slice(0, 10),
      status: isCash ? 'VERIFIED' : 'PENDING',
      verifiedBy: isCash ? (currentUser?.name || 'Cashier') : null,
      verificationDate: isCash ? new Date().toISOString().slice(0, 10) : null,
      notes: paymentData.notes,
    };

    setPayments((prev) => [payEntry, ...prev]);

    if (isCash) {
      const newPaid = s.paidAmount + paymentData.amount;
      const newBal = Math.max(0, s.total - newPaid);
      setSales((prev) =>
        prev.map((x) =>
          x.id === s.id
            ? {
                ...x,
                paidAmount: newPaid,
                balance: newBal,
                status: newBal <= 0 ? 'PAID' : 'PARTIALLY_PAID',
              }
            : x
        )
      );
      showToast(`Payment of ₱${paymentData.amount.toLocaleString()} posted immediately (Cash)`);
    } else {
      showToast(`Payment submitted! Awaiting clearance verification (${paymentData.method})`, 'warning');
    }

    logAudit('RECORD_PAYMENT', 'PAYMENTS', `Recorded payment ₱${paymentData.amount} for ${s.invoiceNo}`, s.id);
  };

  const verifyPayment = (paymentId: string) => {
    const p = payments.find((x) => x.id === paymentId);
    if (!p || p.status === 'VERIFIED') return;

    const s = sales.find((x) => x.id === p.salesId);
    if (s) {
      const newPaid = s.paidAmount + p.amount;
      const newBal = Math.max(0, s.total - newPaid);
      setSales((prev) =>
        prev.map((x) =>
          x.id === s.id
            ? {
                ...x,
                paidAmount: newPaid,
                balance: newBal,
                status: newBal <= 0 ? 'PAID' : 'PARTIALLY_PAID',
              }
            : x
        )
      );
    }

    setPayments((prev) =>
      prev.map((x) =>
        x.id === paymentId
          ? {
              ...x,
              status: 'VERIFIED',
              verifiedBy: currentUser?.name || 'Admin',
              verificationDate: new Date().toISOString().slice(0, 10),
            }
          : x
      )
    );

    logAudit('VERIFY_PAYMENT', 'PAYMENTS', `Verified payment ${p.reference} (₱${p.amount})`, paymentId);
    showToast(`Payment ${p.reference} has been VERIFIED & balance updated!`);
  };

  const rejectPayment = (paymentId: string) => {
    const p = payments.find((x) => x.id === paymentId);
    if (!p) return;

    setPayments((prev) =>
      prev.map((x) =>
        x.id === paymentId
          ? {
              ...x,
              status: 'REJECTED',
              verifiedBy: currentUser?.name || 'Admin',
              verificationDate: new Date().toISOString().slice(0, 10),
            }
          : x
      )
    );

    logAudit('REJECT_PAYMENT', 'PAYMENTS', `Rejected payment ${p.reference}`, paymentId);
    showToast(`Payment ${p.reference} has been marked REJECTED`, 'error');
  };

  const deletePayment = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
    showToast('Payment record deleted');
  };

  const bulkDeletePayments = (ids: string[]) => {
    const idSet = new Set(ids);
    setPayments((prev) => prev.filter((p) => !idSet.has(p.id)));
    showToast(`Deleted ${ids.length} payment records`);
  };

  // ------------------- DELIVERIES -------------------
  const createDeliveryOrder = (data: {
    salesId?: string | null;
    customerId: string;
    customerName?: string;
    projectId?: string | null;
    items: { productId: string; qty: number }[];
    driver: string;
    vehicle: string;
    address: string;
    contactPhone: string;
    notes?: string;
    isCod?: boolean;
    codAmount?: number;
    destinationGps?: { latitude: number; longitude: number; addressLabel?: string } | null;
  }) => {
    const delNo = `DEL-2026-${String(deliveryOrders.length + 1).padStart(4, '0')}`;
    const cust = customers.find((c) => c.id === data.customerId);
    const resolvedCustName = data.customerName?.trim() || cust?.name || 'Customer';

    const items = data.items.map((i) => {
      const p = products.find((x) => x.id === i.productId);
      return {
        productId: i.productId,
        productName: p?.name || 'Material Item',
        qty: i.qty,
        unit: p?.unit || 'PCS',
      };
    });

    // Provide default destination GPS coordinates in the delivery area if not provided
    const defaultDestLat = 14.3294 + (Math.random() - 0.5) * 0.05;
    const defaultDestLng = 120.9367 + (Math.random() - 0.5) * 0.05;

    const newOrder: DeliveryOrder = {
      id: delNo,
      deliveryNo: delNo,
      salesId: data.salesId || null,
      customerId: data.customerId,
      customerName: resolvedCustName,
      projectId: data.projectId || null,
      items,
      driver: data.driver || settings.defaultDriver,
      vehicle: data.vehicle || settings.defaultVehicle,
      status: 'PENDING',
      address: data.address,
      contactPhone: data.contactPhone,
      createdAt: new Date().toISOString(),
      deliveredAt: null,
      notes: data.notes,
      gpsLocation: null,
      destinationGps: data.destinationGps || {
        latitude: defaultDestLat,
        longitude: defaultDestLng,
        addressLabel: data.address,
      },
      proofOfDeliveryPhoto: null,
      proofReceivedBy: null,
      isCod: data.isCod || false,
      codAmount: data.codAmount || 0,
      codStatus: data.isCod && (data.codAmount || 0) > 0 ? 'PENDING' : 'NOT_APPLICABLE',
      codCollectedAmount: 0,
    };

    setDeliveryOrders((prev) => [newOrder, ...prev]);
    logAudit('CREATE_DELIVERY', 'DELIVERY', `Created delivery order ${delNo} for ${resolvedCustName}${newOrder.isCod ? ` (COD: ₱${newOrder.codAmount})` : ''}`, delNo);
    showToast(`Delivery Order ${delNo} scheduled for driver ${newOrder.driver}`);
  };

  const updateDeliveryStatus = (id: string, status: DeliveryStatus) => {
    setDeliveryOrders((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const deliveredAt = status === 'DELIVERED' ? new Date().toISOString() : d.deliveredAt;
          logAudit('DELIVERY_STATUS', 'DELIVERY', `Delivery ${d.deliveryNo} -> ${status}`, id);
          return { ...d, status, deliveredAt };
        }
        return d;
      })
    );
    showToast(`Delivery status updated to ${status}`);
  };

  const assignDriver = (deliveryId: string, driverName: string) => {
    setDeliveryOrders((prev) =>
      prev.map((d) => {
        if (d.id === deliveryId) {
          const newStatus = d.status === 'PENDING' ? 'PREPARING' : d.status;
          return { ...d, driver: driverName, status: newStatus };
        }
        return d;
      })
    );
    logAudit('ASSIGN_DRIVER', 'DELIVERY', `Delivery ${deliveryId} accepted/assigned to driver ${driverName}`, deliveryId);
    showToast(`Delivery order assigned to ${driverName}!`, 'success');
  };

  const updateDeliveryPOD = (
    deliveryId: string,
    photoDataUrl: string,
    receivedBy: string,
    signatureDataUrl?: string
  ) => {
    const now = new Date().toISOString();
    setDeliveryOrders((prev) =>
      prev.map((d) => {
        if (d.id === deliveryId) {
          return {
            ...d,
            status: 'DELIVERED',
            deliveredAt: now,
            proofOfDeliveryPhoto: photoDataUrl,
            proofReceivedBy: receivedBy.trim() || 'Customer Representative',
            customerSignature: signatureDataUrl || null,
          };
        }
        return d;
      })
    );
    logAudit('DELIVERY_POD', 'DELIVERY', `Proof of delivery & signature captured for ${deliveryId} received by ${receivedBy}`, deliveryId);
    showToast(`Delivery verified with photo proof & customer signature!`, 'success');
  };

  const updateDriverGps = (driverName: string, latitude: number, longitude: number) => {
    const now = new Date().toISOString();
    const gps = { latitude, longitude, updatedAt: now };

    setDriverDutyStatuses((prev) => {
      const idx = prev.findIndex((d) => d.driverName.toLowerCase() === driverName.toLowerCase());
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], lastGps: gps };
        return next;
      }
      return [...prev, { driverName, isOnBreak: false, breakStartTime: null, lastGps: gps }];
    });

    // Also update any active delivery order assigned to this driver
    setDeliveryOrders((prev) =>
      prev.map((d) =>
        d.driver.toLowerCase() === driverName.toLowerCase() && d.status !== 'DELIVERED' && d.status !== 'CANCELLED'
          ? { ...d, gpsLocation: gps }
          : d
      )
    );
    showToast(`Driver GPS updated: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, 'info');
  };

  const setDriverBreakStatus = (driverName: string, isOnBreak: boolean) => {
    const now = new Date().toISOString();
    setDriverDutyStatuses((prev) => {
      const idx = prev.findIndex((d) => d.driverName.toLowerCase() === driverName.toLowerCase());
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          isOnBreak,
          breakStartTime: isOnBreak ? now : null,
        };
        return next;
      }
      return [
        ...prev,
        { driverName, isOnBreak, breakStartTime: isOnBreak ? now : null, lastGps: null },
      ];
    });

    logAudit(
      isOnBreak ? 'DRIVER_BREAK' : 'DRIVER_RESUME',
      'DELIVERY',
      `Driver ${driverName} is now ${isOnBreak ? 'ON BREAK' : 'BACK ON DUTY'}`,
      driverName
    );
    showToast(`Driver ${driverName} is now ${isOnBreak ? 'ON BREAK (Coffee / Lunch)' : 'BACK ON DUTY / READY FOR DISPATCH'}!`, 'info');
  };

  const deleteDeliveryOrder = (id: string) => {
    setDeliveryOrders((prev) => prev.filter((d) => d.id !== id));
    showToast('Delivery order deleted');
  };

  const bulkDeleteDeliveryOrders = (ids: string[]) => {
    const idSet = new Set(ids);
    setDeliveryOrders((prev) => prev.filter((d) => !idSet.has(d.id)));
    showToast(`Deleted ${ids.length} delivery orders`);
  };

  const collectDeliveryCod = (
    deliveryId: string,
    amountCollected: number,
    paymentMethod: 'CASH' | 'GCASH' | 'CHECK',
    reference?: string,
    notes?: string
  ) => {
    const now = new Date().toISOString();
    let affectedSalesId: string | null = null;
    let driverWhoCollected = 'Driver';
    let targetDelNo = deliveryId;

    setDeliveryOrders((prev) =>
      prev.map((d) => {
        if (d.id === deliveryId) {
          affectedSalesId = d.salesId || null;
          driverWhoCollected = d.driver;
          targetDelNo = d.deliveryNo;
          const currentCollected = (d.codCollectedAmount || 0) + amountCollected;
          const isFullyCollected = currentCollected >= (d.codAmount || 0);
          return {
            ...d,
            codStatus: isFullyCollected ? 'COLLECTED' : 'PENDING',
            codCollectedAmount: currentCollected,
            codPaymentMethod: paymentMethod,
            codReference: reference || d.codReference,
            codCollectedAt: now,
            codNotes: notes ? `${d.codNotes || ''} | ${notes}` : d.codNotes,
          };
        }
        return d;
      })
    );

    // If linked to a sale, record payment and reduce balance!
    if (affectedSalesId) {
      setSales((prev) =>
        prev.map((s) => {
          if (s.id === affectedSalesId) {
            const newPaid = s.paidAmount + amountCollected;
            const newBal = Math.max(0, s.total - newPaid);
            return {
              ...s,
              paidAmount: newPaid,
              balance: newBal,
              status: newBal <= 0 ? 'PAID' : 'PARTIALLY_PAID',
              codStatus: newBal <= 0 ? 'COLLECTED' : 'PENDING',
              codCollectedAmount: (s.codCollectedAmount || 0) + amountCollected,
              codCollectedAt: now,
              codCollectedBy: driverWhoCollected,
            };
          }
          return s;
        })
      );

      // Also record payment in payments ledger
      const pId = `PAY-${Date.now().toString().slice(-6)}`;
      const newPayment: Payment = {
        id: pId,
        salesId: affectedSalesId,
        reference: reference || `COD-${targetDelNo}`,
        method: paymentMethod,
        amount: amountCollected,
        date: now.slice(0, 10),
        status: 'VERIFIED',
        verifiedBy: driverWhoCollected,
        verificationDate: now,
        notes: `COD payment collected on site by driver ${driverWhoCollected}. ${notes || ''}`,
      };
      setPayments((prev) => [newPayment, ...prev]);
    }

    logAudit(
      'COD_COLLECTED',
      'DELIVERY',
      `Driver ${driverWhoCollected} collected ₱${amountCollected.toLocaleString()} COD for delivery ${targetDelNo} via ${paymentMethod}`,
      driverWhoCollected
    );
    showToast(`COD collection of ₱${amountCollected.toLocaleString()} received via ${paymentMethod}!`, 'success');
  };

  const sendDriverMessage = (data: {
    driverName: string;
    text: string;
    category?: DriverMessageCategory;
    deliveryId?: string | null;
    deliveryNo?: string | null;
    sender?: 'DRIVER' | 'STORE_ADMIN';
  }): DriverMessage => {
    const newMsg: DriverMessage = {
      id: `DM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      driverName: data.driverName,
      text: data.text.trim(),
      category: data.category || 'GENERAL',
      deliveryId: data.deliveryId || null,
      deliveryNo: data.deliveryNo || null,
      sender: data.sender || 'DRIVER',
      createdAt: new Date().toISOString(),
      isReadByStore: data.sender === 'STORE_ADMIN',
      isReadByDriver: data.sender === 'DRIVER',
    };

    setDriverMessages((prev) => [newMsg, ...prev]);

    logAudit(
      'DRIVER_UPDATE',
      'DELIVERY',
      `Message [${newMsg.category}] from ${newMsg.sender}: "${newMsg.text}" (${newMsg.driverName})`,
      newMsg.sender === 'DRIVER' ? newMsg.driverName : (currentUser?.username || 'Store Admin')
    );

    if (data.sender === 'DRIVER') {
      showToast(`Quick update from Driver ${data.driverName}: "${data.text}"`, 'info');
    } else {
      showToast(`Dispatched message to Driver ${data.driverName}`, 'success');
    }

    return newMsg;
  };

  const markDriverMessagesAsRead = (driverName?: string, byWhom: 'STORE' | 'DRIVER' = 'STORE') => {
    setDriverMessages((prev) =>
      prev.map((m) => {
        const matchDriver = !driverName || m.driverName.toLowerCase() === driverName.toLowerCase();
        if (!matchDriver) return m;

        if (byWhom === 'STORE' && !m.isReadByStore) {
          return { ...m, isReadByStore: true };
        }
        if (byWhom === 'DRIVER' && !m.isReadByDriver) {
          return { ...m, isReadByDriver: true };
        }
        return m;
      })
    );
  };

  const startDriverShift = (driverName: string, vehicleType = 'Dropside Truck (4-Wheeler)') => {
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const newShift: DriverShift = {
      id: 'SHIFT-' + Date.now(),
      driverName,
      shiftDate: today,
      startTime: now,
      endTime: null,
      status: 'ACTIVE',
      totalDistanceKm: 0,
      fuelConsumptionLiters: 0,
      fuelEstimatedCost: 0,
      completedDeliveriesCount: 0,
      totalDeliveriesAssigned: 0,
      totalCodCollected: 0,
      vehicleType,
      createdAt: now,
    };

    setDriverShifts((prev) => [newShift, ...prev]);
    setDriverDutyStatuses((prev) => {
      const idx = prev.findIndex((d) => d.driverName.toLowerCase() === driverName.toLowerCase());
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          currentShiftId: newShift.id,
          shiftStartTime: now,
          isOnBreak: false,
        };
        return next;
      }
      return [
        ...prev,
        { driverName, isOnBreak: false, currentShiftId: newShift.id, shiftStartTime: now, lastGps: null },
      ];
    });

    logAudit('DRIVER_SHIFT_START', 'DELIVERY', `Driver ${driverName} started shift (${vehicleType})`, newShift.id);
    showToast(`Duty Shift started for ${driverName}! Ingat sa biyahe.`, 'success');
    return newShift;
  };

  const endDriverShift = (
    driverName: string,
    stats: {
      totalDistanceKm: number;
      fuelConsumptionLiters: number;
      fuelEstimatedCost: number;
      completedDeliveriesCount: number;
      totalDeliveriesAssigned: number;
      totalCodCollected: number;
      vehicleType?: string;
      notes?: string;
    }
  ) => {
    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    let completedShift: DriverShift | null = null;

    setDriverShifts((prev) => {
      const activeIdx = prev.findIndex(
        (s) => s.driverName.toLowerCase() === driverName.toLowerCase() && s.status === 'ACTIVE'
      );
      if (activeIdx >= 0) {
        const updated = [...prev];
        completedShift = {
          ...updated[activeIdx],
          endTime: now,
          status: 'COMPLETED',
          totalDistanceKm: stats.totalDistanceKm,
          fuelConsumptionLiters: stats.fuelConsumptionLiters,
          fuelEstimatedCost: stats.fuelEstimatedCost,
          completedDeliveriesCount: stats.completedDeliveriesCount,
          totalDeliveriesAssigned: stats.totalDeliveriesAssigned,
          totalCodCollected: stats.totalCodCollected,
          vehicleType: stats.vehicleType || updated[activeIdx].vehicleType,
          notes: stats.notes,
        };
        updated[activeIdx] = completedShift;
        return updated;
      }

      completedShift = {
        id: 'SHIFT-' + Date.now(),
        driverName,
        shiftDate: today,
        startTime: now,
        endTime: now,
        status: 'COMPLETED',
        totalDistanceKm: stats.totalDistanceKm,
        fuelConsumptionLiters: stats.fuelConsumptionLiters,
        fuelEstimatedCost: stats.fuelEstimatedCost,
        completedDeliveriesCount: stats.completedDeliveriesCount,
        totalDeliveriesAssigned: stats.totalDeliveriesAssigned,
        totalCodCollected: stats.totalCodCollected,
        vehicleType: stats.vehicleType || 'Dropside Truck',
        notes: stats.notes,
        createdAt: now,
      };
      return [completedShift, ...prev];
    });

    setDriverDutyStatuses((prev) => {
      const idx = prev.findIndex((d) => d.driverName.toLowerCase() === driverName.toLowerCase());
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          currentShiftId: null,
          shiftStartTime: null,
          isOnBreak: false,
        };
        return next;
      }
      return prev;
    });

    logAudit(
      'DRIVER_SHIFT_END',
      'DELIVERY',
      `Driver ${driverName} ended shift: ${stats.totalDistanceKm.toFixed(1)} km, ${stats.fuelConsumptionLiters.toFixed(1)} L fuel, ${stats.completedDeliveriesCount} drops completed`,
      driverName
    );
    showToast(`Shift ended successfully for ${driverName}! Trip Summary recorded.`, 'success');
    return completedShift!;
  };

  // ------------------- PROJECTS -------------------
  const createProject = (data: Omit<Project, 'id' | 'createdAt'>) => {
    const id = `PRJ-${String(projects.length + 1).padStart(4, '0')}`;
    const newProj: Project = {
      ...data,
      id,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setProjects((prev) => [newProj, ...prev]);
    logAudit('CREATE_PROJECT', 'PROJECTS', `Created project ${newProj.name}`, id);
    showToast(`Project "${newProj.name}" created`);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
    showToast('Project updated');
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    showToast('Project site removed');
  };

  const bulkDeleteProjects = (ids: string[]) => {
    const idSet = new Set(ids);
    setProjects((prev) => prev.filter((p) => !idSet.has(p.id)));
    showToast(`Deleted ${ids.length} projects`);
  };

  // ------------------- EQUIPMENT & RENTALS -------------------
  const createEquipment = (data: Omit<Equipment, 'id'>) => {
    const id = `EQP-${String(equipment.length + 1).padStart(4, '0')}`;
    const newEq: Equipment = { ...data, id };
    setEquipment((prev) => [...prev, newEq]);
    logAudit('CREATE_EQUIPMENT', 'RENTALS', `Added equipment ${newEq.name} (${newEq.code})`, id);
    showToast(`Equipment "${newEq.name}" added`);
  };

  const updateEquipment = (id: string, updates: Partial<Equipment>) => {
    setEquipment((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    showToast('Equipment updated');
  };

  const deleteEquipment = (id: string) => {
    setEquipment((prev) => prev.filter((e) => e.id !== id));
    showToast('Equipment deleted');
  };

  const bulkDeleteEquipment = (ids: string[]) => {
    const idSet = new Set(ids);
    setEquipment((prev) => prev.filter((e) => !idSet.has(e.id)));
    showToast(`Deleted ${ids.length} equipment items`);
  };

  const createRental = (data: {
    equipmentId: string;
    customerId: string;
    projectId?: string | null;
    qty: number;
    startDate: string;
    endDate: string;
    conditionNotes?: string;
  }) => {
    const eq = equipment.find((e) => e.id === data.equipmentId);
    if (!eq) return;

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));

    const rentalAmount = eq.rate * diffDays * data.qty;
    const vat = Math.round(rentalAmount * (settings.vatRate / 100) * 100) / 100;
    const deposit = eq.depositAmount * data.qty;
    const total = rentalAmount + vat;

    const rentalId = `REN-2026-${String(rentals.length + 1).padStart(4, '0')}`;
    const newRental: Rental = {
      id: rentalId,
      rentalNo: rentalId,
      equipmentId: data.equipmentId,
      customerId: data.customerId,
      projectId: data.projectId || null,
      qty: data.qty,
      rate: eq.rate,
      startDate: data.startDate,
      endDate: data.endDate,
      duration: diffDays,
      rentalAmount,
      securityDeposit: deposit,
      vat,
      total,
      status: 'ACTIVE',
      conditionBefore: {
        condition: eq.condition,
        engine: 'Operational inspected before dispatch',
        body: 'Clean chassis',
        accessories: data.conditionNotes || 'Standard accessories included',
      },
      additionalCharges: 0,
    };

    updateEquipment(eq.id, { maintenanceStatus: 'RENTED' });
    setRentals((prev) => [newRental, ...prev]);

    logAudit('CREATE_RENTAL', 'RENTALS', `Dispatched rental ${rentalId} for ${eq.name}`, rentalId);
    showToast(`Rental ${rentalId} booked! ₱${total.toLocaleString()} (${diffDays} days)`);
  };

  const returnRental = (
    rentalId: string,
    data: {
      condition: Equipment['condition'];
      engine: string;
      body: string;
      accessories: string;
      damageNotes?: string;
      additionalCharges: number;
    }
  ) => {
    const r = rentals.find((x) => x.id === rentalId);
    if (!r) return;
    const eq = equipment.find((x) => x.id === r.equipmentId);

    const actualReturnDate = new Date().toISOString().slice(0, 10);
    const depositRefunded = Math.max(0, r.securityDeposit - (data.additionalCharges || 0));

    setRentals((prev) =>
      prev.map((x) =>
        x.id === rentalId
          ? {
              ...x,
              status: 'RETURNED',
              conditionAfter: {
                condition: data.condition,
                engine: data.engine,
                body: data.body,
                accessories: data.accessories,
              },
              damageNotes: data.damageNotes || null,
              additionalCharges: data.additionalCharges || 0,
              depositRefunded,
              actualReturnDate,
            }
          : x
      )
    );

    if (eq) {
      const nextStatus = data.condition === 'POOR' || data.damageNotes ? 'MAINTENANCE' : 'AVAILABLE';
      updateEquipment(eq.id, {
        maintenanceStatus: nextStatus,
        condition: data.condition,
        notes: data.damageNotes ? `Returned with damage: ${data.damageNotes}` : eq.notes,
      });
    }

    logAudit('RETURN_RENTAL', 'RENTALS', `Rental ${r.rentalNo} returned. Refunded deposit ₱${depositRefunded}`, rentalId);
    showToast(`Rental ${r.rentalNo} returned! Refunded deposit: ₱${depositRefunded.toLocaleString()}`);
  };

  const deleteRental = (id: string) => {
    setRentals((prev) => prev.filter((r) => r.id !== id));
    showToast('Rental contract deleted');
  };

  const bulkDeleteRentals = (ids: string[]) => {
    const idSet = new Set(ids);
    setRentals((prev) => prev.filter((r) => !idSet.has(r.id)));
    showToast(`Deleted ${ids.length} rental records`);
  };

  // ------------------- SUPPLIERS & PO -------------------
  const createSupplier = (data: Omit<Supplier, 'id' | 'createdAt'>) => {
    const id = `SUP-${String(suppliers.length + 1).padStart(4, '0')}`;
    const newSup: Supplier = { ...data, id, createdAt: new Date().toISOString().slice(0, 10) };
    setSuppliers((prev) => [...prev, newSup]);
    logAudit('CREATE_SUPPLIER', 'SUPPLIERS', `Added supplier ${newSup.name}`, id);
    showToast(`Supplier "${newSup.name}" created`);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    showToast('Supplier updated');
  };

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    showToast('Supplier removed');
  };

  const bulkDeleteSuppliers = (ids: string[]) => {
    const idSet = new Set(ids);
    setSuppliers((prev) => prev.filter((s) => !idSet.has(s.id)));
    showToast(`Deleted ${ids.length} suppliers`);
  };

  const createPurchaseOrder = (data: {
    supplierId: string;
    category?: 'MATERIALS' | 'GAS_FUEL' | 'OFFICE_SUPPLIES' | 'EQUIPMENT_PARTS' | 'OTHER';
    fuelVehicle?: string;
    fuelDriver?: string;
    fuelLiters?: number;
    items: { productId: string; qty: number; unitPrice: number; productName?: string; unit?: string }[];
    notes?: string;
  }) => {
    const poNo = `PO-2026-${String(purchaseOrders.length + 1).padStart(4, '0')}`;
    const lineItems = data.items.map((i) => {
      const p = products.find((x) => x.id === i.productId);
      return {
        productId: i.productId,
        productName: i.productName || p?.name || 'Expense Item',
        qty: i.qty,
        unit: i.unit || p?.unit || 'PCS',
        unitPrice: i.unitPrice,
      };
    });
    const total = lineItems.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);

    const newPO: PurchaseOrder = {
      id: poNo,
      poNo,
      supplierId: data.supplierId,
      category: data.category || 'MATERIALS',
      fuelVehicle: data.fuelVehicle,
      fuelDriver: data.fuelDriver,
      fuelLiters: data.fuelLiters,
      items: lineItems,
      total,
      status: 'PENDING',
      createdAt: new Date().toISOString().slice(0, 10),
      notes: data.notes,
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);
    const catLabel = data.category === 'GAS_FUEL' ? 'Gas/Fuel Expense PO' : 'Purchase Order';
    logAudit('CREATE_PO', 'PURCHASE', `Created ${catLabel} ${poNo} (₱${total.toLocaleString()})`, poNo);
    showToast(`${catLabel} ${poNo} created`);
  };

  const receivePurchaseOrder = (poId: string) => {
    const po = purchaseOrders.find((x) => x.id === poId);
    if (!po || po.status === 'RECEIVED') return;

    // Increment stocks only if items match actual products
    po.items.forEach((item) => {
      const p = products.find((x) => x.id === item.productId);
      if (p) {
        updateProduct(p.id, {
          currentStock: p.currentStock + item.qty,
          buyingPrice: item.unitPrice > 0 ? item.unitPrice : p.buyingPrice,
        });
        const move: StockMovement = {
          id: `STM-${Date.now().toString().slice(-6)}`,
          type: 'IN',
          productId: p.id,
          productName: p.name,
          qty: item.qty,
          unit: p.unit,
          referenceType: 'PURCHASE_ORDER',
          referenceId: po.poNo,
          fromLocation: 'SUPPLIER RECEIPT',
          toLocation: p.location,
          reason: `PO Received: ${po.poNo}`,
          createdAt: new Date().toISOString(),
          user: currentUser?.name || 'Staff',
        };
        setStockMovements((prev) => [move, ...prev]);
      }
    });

    setPurchaseOrders((prev) =>
      prev.map((x) =>
        x.id === poId
          ? {
              ...x,
              status: 'RECEIVED',
              receivedAt: new Date().toISOString().slice(0, 10),
            }
          : x
      )
    );

    logAudit('RECEIVE_PO', 'PURCHASE', `Received PO ${po.poNo}`, poId);
    showToast(`PO ${po.poNo} received!`);
  };

  const deletePurchaseOrder = (id: string) => {
    setPurchaseOrders((prev) => prev.filter((p) => p.id !== id));
    showToast('Purchase Order deleted');
  };

  const bulkDeletePurchaseOrders = (ids: string[]) => {
    const idSet = new Set(ids);
    setPurchaseOrders((prev) => prev.filter((p) => !idSet.has(p.id)));
    showToast(`Deleted ${ids.length} purchase orders`);
  };

  // ------------------- CUSTOMERS & EMPLOYEES -------------------
  const createCustomer = (data: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const id = `CUS-${String(customers.length + 1).padStart(4, '0')}`;
    const newCust: Customer = { ...data, id, createdAt: new Date().toISOString().slice(0, 10) };
    setCustomers((prev) => [...prev, newCust]);
    logAudit('CREATE_CUSTOMER', 'CUSTOMERS', `Added customer ${newCust.name}`, id);
    showToast(`Customer "${newCust.name}" registered`);
    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    showToast('Customer profile updated');
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    showToast('Customer removed');
  };

  const bulkDeleteCustomers = (ids: string[]) => {
    const idSet = new Set(ids);
    setCustomers((prev) => prev.filter((c) => !idSet.has(c.id)));
    showToast(`Deleted ${ids.length} customers`);
  };

  const createEmployee = (data: Omit<Employee, 'id' | 'createdAt'>) => {
    const id = `EMP-${String(employees.length + 1).padStart(4, '0')}`;
    const newEmp: Employee = { ...data, id, createdAt: new Date().toISOString().slice(0, 10) };
    setEmployees((prev) => [...prev, newEmp]);
    showToast(`Employee "${newEmp.name}" added`);
  };

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    showToast('Employee removed');
  };

  const bulkDeleteEmployees = (ids: string[]) => {
    const idSet = new Set(ids);
    setEmployees((prev) => prev.filter((e) => !idSet.has(e.id)));
    showToast(`Deleted ${ids.length} employees`);
  };

  // ------------------- STOCK MOVEMENTS & AUDIT -------------------
  const deleteStockMovement = (id: string) => {
    setStockMovements((prev) => prev.filter((m) => m.id !== id));
    showToast('Movement entry deleted');
  };

  const bulkDeleteStockMovements = (ids: string[]) => {
    const idSet = new Set(ids);
    setStockMovements((prev) => prev.filter((m) => !idSet.has(m.id)));
    showToast(`Deleted ${ids.length} movement entries`);
  };

  const deleteAuditLog = (id: string) => {
    setAuditLogs((prev) => prev.filter((a) => a.id !== id));
    showToast('Audit log deleted');
  };

  const bulkDeleteAuditLogs = (ids: string[]) => {
    const idSet = new Set(ids);
    setAuditLogs((prev) => prev.filter((a) => !idSet.has(a.id)));
    showToast(`Deleted ${ids.length} audit logs`);
  };

  // ------------------- SETTINGS & DATA RESET -------------------
  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    logAudit('UPDATE_SETTINGS', 'SYSTEM', 'Updated system preferences');
    showToast('System settings saved successfully');
  };

  const clearAllData = () => {
    setProducts([]);
    setCustomers([]);
    setProjects([]);
    setEquipment([]);
    setRentals([]);
    setSales([]);
    setPayments([]);
    setDeliveryOrders([]);
    setDriverShifts([]);
    setSuppliers([]);
    setPurchaseOrders([]);
    setStockMovements([]);
    setEmployees([]);
    setAuditLogs([
      {
        id: `AUD-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        user: currentUser?.name || 'A26 Jaya',
        action: 'DATA_CLEARED',
        module: 'SYSTEM',
        details: 'All operational records, products, sales, and accounts were cleared.',
      },
    ]);
    showToast('All data has been cleared!', 'warning');
  };

  const resetToInitialData = () => {
    clearAllData();
  };

  const exportDataJson = () => {
    const exportBundle = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      business: settings.businessName,
      products,
      categories,
      warehouses,
      customers,
      projects,
      equipment,
      rentals,
      sales,
      payments,
      deliveryOrders,
      driverShifts,
      suppliers,
      purchaseOrders,
      stockMovements,
      employees,
      auditLogs,
      settings,
      users,
    };
    return JSON.stringify(exportBundle, null, 2);
  };

  const importDataJson = (jsonStr: string): boolean => {
    try {
      const bundle = JSON.parse(jsonStr);
      if (bundle.products) setProducts(bundle.products);
      if (bundle.categories) setCategories(bundle.categories);
      if (bundle.warehouses) setWarehouses(bundle.warehouses);
      if (bundle.customers) setCustomers(bundle.customers);
      if (bundle.projects) setProjects(bundle.projects);
      if (bundle.equipment) setEquipment(bundle.equipment);
      if (bundle.rentals) setRentals(bundle.rentals);
      if (bundle.sales) setSales(bundle.sales);
      if (bundle.payments) setPayments(bundle.payments);
      if (bundle.deliveryOrders) setDeliveryOrders(bundle.deliveryOrders);
      if (bundle.driverShifts) setDriverShifts(bundle.driverShifts);
      if (bundle.suppliers) setSuppliers(bundle.suppliers);
      if (bundle.purchaseOrders) setPurchaseOrders(bundle.purchaseOrders);
      if (bundle.stockMovements) setStockMovements(bundle.stockMovements);
      if (bundle.employees) setEmployees(bundle.employees);
      if (bundle.auditLogs) setAuditLogs(bundle.auditLogs);
      if (bundle.settings) setSettings(bundle.settings);
      if (bundle.users) setUsers(bundle.users);
      showToast('Database restore completed successfully!');
      return true;
    } catch {
      showToast('Invalid backup file JSON', 'error');
      return false;
    }
  };

  // ------------------- COMPUTED STATS -------------------
  const lowStockCount = products.filter((p) => p.status === 'ACTIVE' && p.currentStock > 0 && p.currentStock <= p.minStock).length;
  const outOfStockCount = products.filter((p) => p.status === 'ACTIVE' && p.currentStock <= 0).length;
  const pendingPaymentCount = payments.filter((p) => p.status === 'PENDING').length;
  const overdueRentalsCount = rentals.filter((r) => r.status === 'OVERDUE').length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySalesTotal = sales
    .filter((s) => s.status !== 'VOIDED' && s.createdAt.slice(0, 10) === todayStr)
    .reduce((sum, s) => sum + s.total, 0);

  const stockValueCost = products.reduce((sum, p) => sum + (p.currentStock || 0) * (p.buyingPrice || 0), 0);
  const stockValueSelling = products.reduce((sum, p) => sum + (p.currentStock || 0) * (p.sellingPrice || 0), 0);
  const activeRentalsCount = rentals.filter((r) => r.status === 'ACTIVE' || r.status === 'OVERDUE').length;
  const openDeliveriesCount = deliveryOrders.filter((d) => d.status === 'PENDING' || d.status === 'PREPARING' || d.status === 'OUT_FOR_DELIVERY').length;
  const unreadDriverMessagesCount = driverMessages.filter((m) => m.sender === 'DRIVER' && !m.isReadByStore).length;

  return (
    <AppContext.Provider
      value={{
        products,
        categories,
        customers,
        projects,
        equipment,
        rentals,
        sales,
        payments,
        deliveryOrders,
        suppliers,
        purchaseOrders,
        stockMovements,
        employees,
        auditLogs,
        settings,
        users,
        currentUser,
        isAuthenticated: !!currentUser,
        currentPage,
        globalSearch,
        toasts,

        login,
        logout,
        createUserAccount,
        deleteUserAccount,
        bulkDeleteUsers,
        resetUserPassword,

        setCurrentPage,
        setCurrentUser,
        setGlobalSearch,
        showToast,
        removeToast,

        addProduct,
        updateProduct,
        deleteProduct,
        bulkDeleteProducts,
        stockIn,
        stockOut,
        stockTransfer,
        stockAdjustment,
        addCategory,
        deleteCategory,
        bulkDeleteCategories,

        warehouses,
        createWarehouse,
        updateWarehouse,
        deleteWarehouse,
        bulkDeleteWarehouses,

        createSale,
        voidSale,
        deleteSale,
        bulkDeleteSales,
        processReturn,

        recordPayment,
        verifyPayment,
        rejectPayment,
        deletePayment,
        bulkDeletePayments,

        createDeliveryOrder,
        updateDeliveryStatus,
        deleteDeliveryOrder,
        bulkDeleteDeliveryOrders,
        assignDriver,
        updateDeliveryPOD,
        updateDriverGps,
        setDriverBreakStatus,
        collectDeliveryCod,
        driverDutyStatuses,
        driverMessages,
        unreadDriverMessagesCount,
        sendDriverMessage,
        markDriverMessagesAsRead,
        driverShifts,
        startDriverShift,
        endDriverShift,

        createProject,
        updateProject,
        deleteProject,
        bulkDeleteProjects,

        createEquipment,
        updateEquipment,
        deleteEquipment,
        bulkDeleteEquipment,
        createRental,
        returnRental,
        deleteRental,
        bulkDeleteRentals,

        createSupplier,
        updateSupplier,
        deleteSupplier,
        bulkDeleteSuppliers,
        createPurchaseOrder,
        receivePurchaseOrder,
        deletePurchaseOrder,
        bulkDeletePurchaseOrders,

        createCustomer,
        updateCustomer,
        deleteCustomer,
        bulkDeleteCustomers,
        createEmployee,
        deleteEmployee,
        bulkDeleteEmployees,

        deleteStockMovement,
        bulkDeleteStockMovements,
        deleteAuditLog,
        bulkDeleteAuditLogs,

        updateSettings,
        resetToInitialData,
        clearAllData,
        exportDataJson,
        importDataJson,

        lowStockCount,
        outOfStockCount,
        pendingPaymentCount,
        overdueRentalsCount,
        todaySalesTotal,
        stockValueCost,
        stockValueSelling,
        activeRentalsCount,
        openDeliveriesCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
