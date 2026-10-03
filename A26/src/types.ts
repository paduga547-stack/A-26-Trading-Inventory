export type CategoryType =
  | 'CEMENT'
  | 'SAND & GRAVEL'
  | 'CHB & MASONRY'
  | 'STEEL & REBAR'
  | 'LUMBER'
  | 'ROOFING'
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'PAINT'
  | 'HARDWARE'
  | 'FASTENERS'
  | 'TILES'
  | 'ADHESIVES'
  | 'TOOLS'
  | 'SAFETY EQUIPMENT'
  | 'CONSTRUCTION CHEMICALS'
  | 'WATERPROOFING'
  | 'EQUIPMENT'
  | 'OTHERS';

export type ProductSource = 'PURCHASED' | 'OWN MANUFACTURED' | 'BOTH';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: CategoryType | string;
  subcategory?: string;
  brand: string;
  specification?: string;
  size?: string;
  thickness?: string;
  length?: string;
  color?: string;
  unit: string;
  buyingPrice: number;
  sellingPrice: number;
  minStock: number;
  maxStock: number;
  supplierId?: string | null;
  location: string;
  vatStatus: 'VATABLE' | 'EXEMPT';
  vatRate: number;
  status: 'ACTIVE' | 'INACTIVE';
  source: ProductSource;
  manufacturer?: string | null;
  currentStock: number;
  createdAt: string;
  updatedAt: string;
}

export type CustomerType = 'WALK-IN' | 'CONTRACTOR' | 'CONSTRUCTION COMPANY' | 'DEVELOPER' | 'ENGINEER' | 'INDIVIDUAL';

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE';
  creditLimit?: number;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  customerId: string;
  address: string;
  contactPerson: string;
  contactNumber: string;
  startDate: string;
  endDate: string;
  status: 'ONGOING' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
  createdAt: string;
  notes?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  unit: string;
  qty: number;
  unitPrice: number;
  costPrice: number;
}

export type PaymentMethod = 'CASH' | 'GCASH' | 'MAYA' | 'BANK_TRANSFER' | 'CHECK' | 'COD';
export type SaleStatus = 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'VOIDED';

export interface Sale {
  id: string;
  invoiceNo: string;
  customerId: string;
  projectId?: string | null;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  vat: number;
  deliveryFee: number;
  total: number;
  status: SaleStatus;
  paidAmount: number;
  balance: number;
  dueDate?: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
  cashierName: string;
  voidedReason?: string | null;
  voidedAt?: string | null;
  voidedBy?: string | null;
  notes?: string;
  isCod?: boolean;
  codAmount?: number;
  codStatus?: 'PENDING' | 'COLLECTED' | 'NOT_APPLICABLE';
  codCollectedAmount?: number;
  codCollectedAt?: string;
  codCollectedBy?: string;
}

export interface Payment {
  id: string;
  salesId: string;
  reference: string;
  method: PaymentMethod;
  amount: number;
  date: string;
  proof?: string | null;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  verifiedBy?: string | null;
  verificationDate?: string | null;
  notes?: string;
}

export type DeliveryStatus = 'PENDING' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'ARRIVED' | 'DELIVERED' | 'CANCELLED';

export interface OfflineQueueItem {
  id: string;
  type: 'STATUS_UPDATE' | 'POD_SIGNATURE' | 'COD_COLLECTED' | 'GPS_UPDATE';
  deliveryId?: string;
  payload: any;
  timestamp: string;
  synced: boolean;
}

export interface DeliveryOrder {
  id: string;
  deliveryNo: string;
  salesId?: string | null;
  customerId: string;
  customerName?: string;
  projectId?: string | null;
  items: { productId: string; productName: string; qty: number; unit: string }[];
  driver: string;
  vehicle: string;
  status: DeliveryStatus;
  address: string;
  contactPhone: string;
  createdAt: string;
  deliveredAt?: string | null;
  notes?: string;
  gpsLocation?: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  } | null;
  destinationGps?: {
    latitude: number;
    longitude: number;
    addressLabel?: string;
  } | null;
  liveEta?: {
    durationText: string;
    durationMinutes: number;
    distanceText: string;
    distanceKm: number;
    trafficCondition: 'LIGHT' | 'MODERATE' | 'HEAVY';
    updatedAt: string;
  } | null;
  isNear?: boolean;
  proofOfDeliveryPhoto?: string | null;
  proofReceivedBy?: string | null;
  customerSignature?: string | null;
  isCod?: boolean;
  codAmount?: number;
  codStatus?: 'PENDING' | 'COLLECTED' | 'NOT_APPLICABLE';
  codCollectedAmount?: number;
  codPaymentMethod?: 'CASH' | 'GCASH' | 'CHECK';
  codReference?: string;
  codCollectedAt?: string;
  codNotes?: string;
}

export interface DriverDutyStatus {
  driverName: string;
  isOnBreak: boolean;
  breakStartTime?: string | null;
  currentShiftId?: string | null;
  shiftStartTime?: string | null;
  lastGps?: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  } | null;
}

export interface DriverShift {
  id: string;
  driverName: string;
  shiftDate: string; // YYYY-MM-DD
  startTime: string; // ISO
  endTime?: string | null; // ISO
  status: 'ACTIVE' | 'COMPLETED';
  totalDistanceKm: number;
  fuelConsumptionLiters: number;
  fuelEstimatedCost: number;
  completedDeliveriesCount: number;
  totalDeliveriesAssigned: number;
  totalCodCollected: number;
  vehicleType?: string;
  notes?: string;
  createdAt: string;
}

export type DriverMessageCategory =
  | 'EN_ROUTE'
  | 'TRAFFIC'
  | 'ARRIVED'
  | 'WAITING'
  | 'ISSUE'
  | 'COMPLETED'
  | 'GENERAL';

export interface DriverMessage {
  id: string;
  driverName: string;
  deliveryId?: string | null;
  deliveryNo?: string | null;
  text: string;
  category: DriverMessageCategory;
  sender: 'DRIVER' | 'STORE_ADMIN';
  createdAt: string;
  isReadByStore: boolean;
  isReadByDriver: boolean;
}

export type EquipmentCondition = 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
export type MaintenanceStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE';

export interface Equipment {
  id: string;
  name: string;
  code: string;
  condition: EquipmentCondition;
  rentalUnit: string; // e.g. 'DAY', 'SET/DAY', 'WEEK'
  rate: number;
  depositAmount: number;
  maintenanceStatus: MaintenanceStatus;
  notes?: string;
}

export interface Rental {
  id: string;
  rentalNo: string;
  equipmentId: string;
  customerId: string;
  projectId?: string | null;
  qty: number;
  rate: number;
  startDate: string;
  endDate: string;
  duration: number; // days
  rentalAmount: number;
  securityDeposit: number;
  vat: number;
  total: number;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'CANCELLED';
  conditionBefore: {
    condition: EquipmentCondition;
    engine: string;
    body: string;
    accessories: string;
  };
  conditionAfter?: {
    condition: EquipmentCondition;
    engine: string;
    body: string;
    accessories: string;
  } | null;
  damageNotes?: string | null;
  additionalCharges: number;
  depositRefunded?: number;
  actualReturnDate?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  qty: number;
  unit: string;
  unitPrice: number;
}

export interface PurchaseOrder {
  id: string;
  poNo: string;
  supplierId: string;
  category?: 'MATERIALS' | 'GAS_FUEL' | 'OFFICE_SUPPLIES' | 'EQUIPMENT_PARTS' | 'OTHER';
  fuelVehicle?: string;
  fuelDriver?: string;
  fuelLiters?: number;
  items: PurchaseOrderItem[];
  total: number;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  createdAt: string;
  receivedAt?: string | null;
  notes?: string;
}

export type StockMovementType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  type: StockMovementType;
  productId?: string | null;
  productName?: string;
  qty: number;
  unit: string;
  referenceType: 'SALES' | 'PURCHASE_ORDER' | 'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER' | 'ADJUSTMENT' | 'RENTAL' | 'RENTAL_RETURN' | 'RETURN_RESTOCK';
  referenceId?: string | null;
  fromLocation?: string | null;
  toLocation?: string | null;
  reason: string;
  createdAt: string;
  user: string;
}

export interface Employee {
  id: string;
  name: string;
  position: 'Driver' | 'Sales Clerk' | 'Warehouse Staff' | 'Cashier' | 'Manager' | 'Mechanic';
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
  referenceId?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: 'ADMIN' | 'CASHIER' | 'INVENTORY' | 'DISPATCHER' | 'DRIVER';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  createdBy?: string;
}

export interface SystemSettings {
  businessName: string;
  businessType: string;
  address: string;
  phone: string;
  email: string;
  tinNumber: string;
  vatRate: number;
  currency: string;
  defaultDriver: string;
  defaultVehicle: string;
  defaultLocation: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  contactPerson?: string;
  contactPhone?: string;
  type: 'MAIN' | 'BRANCH' | 'OPEN_YARD' | 'DEPOT';
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
  createdAt: string;
}

export type NavigationPage =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'warehouses'
  | 'stock-in'
  | 'stock-out'
  | 'stock-transfer'
  | 'stock-adjustment'
  | 'inventory-history'
  | 'new-sale'
  | 'sales-history'
  | 'returns'
  | 'voided-sales'
  | 'accounts-receivable'
  | 'delivery-orders'
  | 'driver-app'
  | 'projects'
  | 'equipment'
  | 'rentals'
  | 'maintenance'
  | 'suppliers'
  | 'purchase-orders'
  | 'payments'
  | 'pending-verification'
  | 'employees'
  | 'reports'
  | 'notifications'
  | 'audit-logs'
  | 'user-admin'
  | 'settings';
