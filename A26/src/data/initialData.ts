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
  CategoryType,
  Warehouse,
} from '../types';

export const INITIAL_CATEGORIES: CategoryType[] = [
  'CEMENT',
  'SAND & GRAVEL',
  'CHB & MASONRY',
  'STEEL & REBAR',
  'LUMBER',
  'ROOFING',
  'PLUMBING',
  'ELECTRICAL',
  'PAINT',
  'HARDWARE',
  'FASTENERS',
  'TILES',
  'ADHESIVES',
  'TOOLS',
  'SAFETY EQUIPMENT',
  'CONSTRUCTION CHEMICALS',
  'WATERPROOFING',
  'EQUIPMENT',
  'OTHERS',
];

export const INITIAL_UNITS = [
  'PCS',
  'BAG',
  'KG',
  'METER',
  'ROLL',
  'BOX',
  'SET',
  'GAL',
  'LITER',
  'CU.M',
  'TRUCKLOAD',
  'SHEET',
  'LENGTH',
  'PAIR',
  'BUCKET',
];

export const INITIAL_SETTINGS: SystemSettings = {
  businessName: 'A-TWENTY SIX TRADING',
  businessType: 'Construction Supply & Equipment Rental',
  address: 'Km 26 Aguinaldo Highway, Dasmariñas, Cavite / Metro Manila, Philippines',
  phone: '(02) 8826-2626 / 0917-262-6262',
  email: 'sales@atwentysixtrading.ph',
  tinNumber: '260-123-456-000 VAT',
  vatRate: 12,
  currency: 'PHP',
  defaultDriver: 'Company Driver',
  defaultVehicle: 'TRUCK-001 (Isuzu Forward 6-Wheeler)',
  defaultLocation: 'WH-01-A (Main Warehouse)',
};

// Only the master Administrator account specified by user
export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'USR-0001',
    username: 'A26Jaya',
    password: '123456789',
    name: 'A26 Jaya (System Administrator)',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'WH-001',
    code: 'WH-01',
    name: 'Main Warehouse & Batching Base',
    address: 'Km 26 Aguinaldo Highway, Dasmariñas, Cavite',
    contactPerson: 'Warehouse Supervisor',
    contactPhone: '0917-262-6262',
    type: 'MAIN',
    status: 'ACTIVE',
    notes: 'Central logistics hub and cement/rebar staging',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'WH-002',
    code: 'WH-02',
    name: 'Cavite North Depot',
    address: 'Emilio Aguinaldo Highway, Imus, Cavite',
    contactPerson: 'Depot Manager',
    contactPhone: '0918-262-6202',
    type: 'BRANCH',
    status: 'ACTIVE',
    notes: 'Distribution warehouse for north projects',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'WH-003',
    code: 'WH-03',
    name: 'Aggregates & Steel Open Yard',
    address: 'Molino-Paliparan Road, Dasmariñas, Cavite',
    contactPerson: 'Yard Master',
    contactPhone: '0920-262-6203',
    type: 'OPEN_YARD',
    status: 'ACTIVE',
    notes: 'Sand, gravel, CHB and structural steel stocking',
    createdAt: new Date().toISOString(),
  },
];

// Clean empty datasets as requested: "clear lahat ng data"
export const INITIAL_EMPLOYEES: Employee[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_PROJECTS: Project[] = [];
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_EQUIPMENT: Equipment[] = [];
export const INITIAL_RENTALS: Rental[] = [];
export const INITIAL_SALES: Sale[] = [];
export const INITIAL_PAYMENTS: Payment[] = [];
export const INITIAL_DELIVERIES: DeliveryOrder[] = [];
export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [];
export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-0001',
    timestamp: new Date().toISOString(),
    user: 'A26 Jaya (System Administrator)',
    action: 'SYSTEM_INITIALIZED',
    module: 'SYSTEM',
    details: 'System cleared and initialized with master admin A26Jaya',
    referenceId: 'A26Jaya',
  },
];
