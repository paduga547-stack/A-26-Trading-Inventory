import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, PaymentMethod, Sale } from '../../types';
import { ReceiptModal } from './ReceiptModal';
import { Modal } from '../common/Modal';
import { ThermalScannerModal } from '../common/ThermalScannerModal';
import { playScanSuccessBeep, playScanErrorBeep } from '../../utils/scannerAudio';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  HardHat,
  UserPlus,
  Percent,
  Receipt,
  Truck,
  FileText,
  Banknote,
  PhoneCall,
  Store,
  Scan,
  Barcode,
} from 'lucide-react';

interface CartItem {
  product: Product;
  qty: number;
  unitPrice: number;
}

export const POSView: React.FC = () => {
  const {
    products,
    categories,
    customers,
    projects,
    settings,
    createSale,
    createDeliveryOrder,
    createCustomer,
    showToast,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Customer & Order Source: WALK_IN | PHONE_CALL | CONTRACTOR
  const [customerSource, setCustomerSource] = useState<'WALK_IN' | 'PHONE_CALL' | 'CONTRACTOR'>('WALK_IN');
  const [manualCustomerName, setManualCustomerName] = useState('Walk-in Customer');
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');

  // Customer & Project
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    customers[0]?.id || ''
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Fulfillment & Delivery options
  const [fulfillmentType, setFulfillmentType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [autoDispatchOrder, setAutoDispatchOrder] = useState(true);
  const [receiptInitialMode, setReceiptInitialMode] = useState<'INVOICE' | 'THERMAL' | 'DELIVERY_RECEIPT'>('INVOICE');

  // BIR Tax & Discount controls
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [birTaxRate, setBirTaxRate] = useState<number>(settings.vatRate || 12);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  // Payment Tender & COD
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [paidAmount, setPaidAmount] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState('');
  const [saleNotes, setSaleNotes] = useState('');

  // COD & Partial Downpayment state
  const [isCodEnabled, setIsCodEnabled] = useState(false);
  const [codDownpayment, setCodDownpayment] = useState<number>(0);
  const [codDownpaymentMethod, setCodDownpaymentMethod] = useState<'CASH' | 'GCASH' | 'MAYA' | 'BANK_TRANSFER'>('CASH');
  const [codDownpaymentRef, setCodDownpaymentRef] = useState('');

  // Modals
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isNewCustOpen, setIsNewCustOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Global Hardware Barcode / Thermal Scanner Wedge Listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleWindowKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing inside an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') {
        return;
      }

      const now = Date.now();
      const diff = now - lastKeyTime;
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 2) {
          const scannedCode = buffer.trim();
          const found = products.find(
            (p) =>
              (p.barcode && p.barcode.toLowerCase() === scannedCode.toLowerCase()) ||
              (p.sku && p.sku.toLowerCase() === scannedCode.toLowerCase())
          );
          if (found) {
            addToCart(found);
            playScanSuccessBeep();
            showToast(`Thermal Scan: ${found.name} added to cart!`);
          } else {
            playScanErrorBeep();
            showToast(`No item matching barcode "${scannedCode}"`, 'warning');
          }
          buffer = '';
        }
      } else if (e.key.length === 1) {
        // Fast burst typical of barcode scanner (keystrokes < 80ms apart)
        if (diff > 90 && buffer.length > 0) {
          buffer = '';
        }
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [products]);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status !== 'ACTIVE') return false;
      const matchCat = selectedCat === 'ALL' || p.category === selectedCat;
      const matchSearch =
        !searchTerm.trim() ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCat, searchTerm]);

  // Projects of selected customer
  const customerProjects = useMemo(() => {
    return projects.filter((p) => p.customerId === selectedCustomerId && p.status === 'ONGOING');
  }, [projects, selectedCustomerId]);

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      showToast(`${product.name} is currently out of stock!`, 'error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.currentStock) {
          showToast(`Cannot add more than available stock (${product.currentStock} ${product.unit})`, 'warning');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1, unitPrice: product.sellingPrice }];
    });
  };

  const updateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    const p = products.find((x) => x.id === productId);
    if (p && newQty > p.currentStock) {
      showToast(`Requested quantity exceeds available stock (${p.currentStock})`, 'warning');
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, qty: newQty } : item))
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountInput(0);
    setDeliveryFee(0);
    setFulfillmentType('PICKUP');
    setDeliveryAddress('');
    setDeliveryPhone('');
    setPaidAmount(null);
    setPaymentReference('');
    setIsCodEnabled(false);
    setCodDownpayment(0);
    setCodDownpaymentRef('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

  // Compute calculated discount amount
  const calculatedDiscount = useMemo(() => {
    if (discountType === 'PERCENT') {
      return Math.round(subtotal * (discountInput / 100) * 100) / 100;
    }
    return Math.min(subtotal, Math.max(0, discountInput));
  }, [subtotal, discountType, discountInput]);

  const activeDeliveryFee = fulfillmentType === 'DELIVERY' ? (deliveryFee || 0) : 0;
  const taxableBase = Math.max(0, subtotal - calculatedDiscount);
  // BIR tax calculated
  const birTaxAmount = Math.round(taxableBase * (birTaxRate / 100) * 100) / 100;
  const grandTotal = taxableBase + birTaxAmount + activeDeliveryFee;

  const isCodActive = paymentMethod === 'COD' || isCodEnabled;
  const actualPaid = isCodActive ? codDownpayment : (paidAmount === null ? grandTotal : paidAmount);
  const codBalanceToCollect = isCodActive ? Math.max(0, grandTotal - codDownpayment) : 0;
  const remainingBalance = isCodActive ? codBalanceToCollect : Math.max(0, grandTotal - actualPaid);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Your cart is empty! Add products to proceed.', 'error');
      return;
    }

    if (fulfillmentType === 'DELIVERY' && !deliveryAddress.trim()) {
      showToast('Please specify a delivery address for customer delivery.', 'warning');
      return;
    }

    const effectiveFee = fulfillmentType === 'DELIVERY' ? deliveryFee : 0;
    const selectedCust = customers.find((c) => c.id === selectedCustomerId);

    const resolvedCustName =
      customerSource === 'CONTRACTOR'
        ? selectedCust?.name || 'Customer'
        : manualCustomerName.trim() || (customerSource === 'PHONE_CALL' ? 'Phone Order Customer' : 'Walk-in Customer');

    const resolvedPhone =
      deliveryPhone.trim() || manualCustomerPhone.trim() || selectedCust?.phone || '0900-000-0000';

    const newSale = createSale({
      customerId: customerSource === 'CONTRACTOR' ? (selectedCustomerId || customers[0]?.id || 'WALK-IN') : 'WALK-IN',
      projectId: customerSource === 'CONTRACTOR' ? (selectedProjectId || null) : null,
      items: cart.map((i) => ({ productId: i.product.id, qty: i.qty, unitPrice: i.unitPrice })),
      discount: calculatedDiscount,
      birTaxRate,
      deliveryFee: effectiveFee,
      paymentMethod: isCodActive ? (codDownpayment > 0 ? codDownpaymentMethod : 'COD') : paymentMethod,
      paidAmount: actualPaid,
      paymentReference: isCodActive
        ? (codDownpaymentRef.trim() || (codDownpayment > 0 ? 'PARTIAL-DOWNPAYMENT' : 'COD-ORDER'))
        : paymentReference,
      dueDate: remainingBalance > 0 ? dueDate : undefined,
      notes: [
        customerSource === 'PHONE_CALL' ? '[PHONE CALL ORDER]' : customerSource === 'WALK_IN' ? '[WALK-IN ORDER]' : '[CONTRACTOR ACCOUNT]',
        resolvedCustName !== selectedCust?.name ? `Customer: ${resolvedCustName}` : '',
        fulfillmentType === 'DELIVERY' ? `FOR DELIVERY: ${deliveryAddress}` : 'PICK-UP AT STORE',
        isCodActive ? `COD BALANCE: ₱${codBalanceToCollect.toLocaleString()} (Downpayment: ₱${codDownpayment.toLocaleString()})` : '',
        saleNotes,
      ].filter(Boolean).join(' | '),
    });

    // Auto-create delivery order if requested
    if (fulfillmentType === 'DELIVERY' && autoDispatchOrder) {
      createDeliveryOrder({
        salesId: newSale.id,
        customerId: newSale.customerId,
        customerName: resolvedCustName,
        projectId: newSale.projectId || null,
        items: cart.map((i) => ({ productId: i.product.id, qty: i.qty })),
        driver: settings.defaultDriver,
        vehicle: settings.defaultVehicle,
        address: deliveryAddress.trim() || selectedCust?.address || 'Site Delivery',
        contactPhone: resolvedPhone,
        isCod: isCodActive,
        codAmount: codBalanceToCollect,
        notes: `Dispatched from Sale #${newSale.invoiceNo}. ${isCodActive ? `COLLECT COD: ₱${codBalanceToCollect.toLocaleString()} upon turnover (Downpayment paid: ₱${codDownpayment.toLocaleString()}).` : 'PAID IN FULL.'} Delivery fee: ₱${effectiveFee}`,
      });
      setReceiptInitialMode('DELIVERY_RECEIPT');
      showToast(
        isCodActive
          ? `Sale #${newSale.invoiceNo} saved & Dispatched with COD ₱${codBalanceToCollect.toLocaleString()}!`
          : `Sale #${newSale.invoiceNo} saved & Delivery Order auto-dispatched!`,
        'success'
      );
    } else {
      setReceiptInitialMode('INVOICE');
      showToast(`Sale #${newSale.invoiceNo} completed!`, 'success');
    }

    setCompletedSale(newSale);
    clearCart();
  };

  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const created = createCustomer({
      name: newCustName.trim(),
      type: 'CONTRACTOR',
      contactPerson: newCustName.trim(),
      phone: newCustPhone.trim() || '0900-000-0000',
      email: '',
      address: newCustAddress.trim() || 'Cavite / Metro Manila',
      status: 'ACTIVE',
      creditLimit: 100000,
    });

    setSelectedCustomerId(created.id);
    setIsNewCustOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
  };

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* LEFT: Product Catalog & Search (7 Cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search & Category Tabs */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search material description, brand, or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-amber-400 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
              title="Open Thermal & Barcode Scanner for POS"
            >
              <Scan className="w-4 h-4 text-amber-400" />
              <span>Thermal Scanner</span>
            </button>
          </div>

          {/* Categories Tab Scroll */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCat('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCat === 'ALL'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3 py-1.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCat === cat
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[680px] overflow-y-auto pr-1">
          {filteredProducts.map((p) => {
            const isOut = p.currentStock <= 0;
            const isLow = p.currentStock > 0 && p.currentStock <= p.minStock;

            return (
              <div
                key={p.id}
                onClick={() => !isOut && addToCart(p)}
                className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between select-none ${
                  isOut
                    ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                    : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-xs cursor-pointer active:scale-98'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-mono">{p.sku}</span>
                    <span className="font-semibold text-slate-500">{p.unit}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2" title={p.name}>
                    {p.name}
                  </h4>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {p.brand} {p.size ? `• ${p.size}` : ''}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black font-mono text-slate-900">
                    {formatPHP(p.sellingPrice)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isOut
                        ? 'bg-rose-100 text-rose-800'
                        : isLow
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isOut ? 'Out of Stock' : `${p.currentStock} ${p.unit}`}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-bold text-slate-700">No materials available in catalog</p>
              <p className="text-xs text-slate-400 mt-0.5">Add materials in Products Catalog or adjust filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Register Cart Drawer & Checkout (5 Cols) */}
      <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        {/* Customer Selector & Order Source */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold uppercase text-slate-700">
              Customer / Order Source *
            </label>
            <button
              onClick={() => setIsNewCustOpen(true)}
              className="text-[11px] text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3 h-3" />
              <span>+ Quick Add Client</span>
            </button>
          </div>

          {/* Quick Source Pills */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => {
                setCustomerSource('WALK_IN');
                setManualCustomerName('Walk-in Customer');
              }}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                customerSource === 'WALK_IN'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Walk-In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomerSource('PHONE_CALL');
                setManualCustomerName('Phone Order Customer');
                setFulfillmentType('DELIVERY');
                setIsCodEnabled(true);
                setPaymentMethod('COD');
              }}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                customerSource === 'PHONE_CALL'
                  ? 'bg-sky-600 text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Order</span>
            </button>

            <button
              type="button"
              onClick={() => setCustomerSource('CONTRACTOR')}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                customerSource === 'CONTRACTOR'
                  ? 'bg-slate-900 text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>Contractor</span>
            </button>
          </div>

          {customerSource === 'CONTRACTOR' ? (
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setSelectedProjectId('');
              }}
              className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
              {customers.length === 0 && (
                <option value="WALK-IN">Walk-In Customer (Counter Cash)</option>
              )}
            </select>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                  {customerSource === 'PHONE_CALL' ? 'Caller Name *' : 'Customer Name'}
                </label>
                <input
                  type="text"
                  value={manualCustomerName}
                  onChange={(e) => setManualCustomerName(e.target.value)}
                  placeholder="e.g. Mang Kanor / Engr. Reyes"
                  className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={manualCustomerPhone}
                  onChange={(e) => {
                    setManualCustomerPhone(e.target.value);
                    if (!deliveryPhone) setDeliveryPhone(e.target.value);
                  }}
                  placeholder="e.g. 0917-123-4567"
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          )}

          {/* Project Site (Optional) */}
          {customerSource === 'CONTRACTOR' && customerProjects.length > 0 && (
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1 flex items-center gap-1">
                <HardHat className="w-3.5 h-3.5 text-amber-600" />
                <span>Link to Project Site (Optional)</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="">No Project (General Counter Sale)</option>
                {customerProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.address}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Cart Item Lines */}
        <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-56 overflow-y-auto">
          {cart.map((item) => (
            <div key={item.product.id} className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-slate-900 truncate">{item.product.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {formatPHP(item.unitPrice)} / {item.product.unit}
                </div>
              </div>

              {/* Quantity Incrementer */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => updateCartQty(item.product.id, item.qty - 1)}
                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={item.product.currentStock}
                  value={item.qty}
                  onChange={(e) => updateCartQty(item.product.id, parseInt(e.target.value) || 1)}
                  className="w-12 text-center text-xs font-mono font-bold border border-slate-200 rounded py-0.5"
                />
                <button
                  type="button"
                  onClick={() => updateCartQty(item.product.id, item.qty + 1)}
                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Line Subtotal */}
              <div className="text-right shrink-0 min-w-[70px]">
                <div className="text-xs font-black font-mono text-slate-900">
                  {formatPHP(item.qty * item.unitPrice)}
                </div>
                <button
                  type="button"
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-[10px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 inline mr-0.5" /> Remove
                </button>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs">
              <ShoppingCart className="w-6 h-6 mx-auto mb-1 opacity-50" />
              Cart is currently empty. Click materials on the left to add.
            </div>
          )}
        </div>

        {/* BIR TAXES & DISCOUNT CONFIGURATION */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-amber-600" />
              <span>BIR Taxes &amp; Discount Configuration</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Discount selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase text-slate-600">Discount</label>
                <div className="flex text-[10px] font-bold rounded bg-slate-200 p-0.5">
                  <button
                    type="button"
                    onClick={() => setDiscountType('FIXED')}
                    className={`px-1.5 py-0.5 rounded ${discountType === 'FIXED' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'}`}
                  >
                    ₱
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('PERCENT')}
                    className={`px-1.5 py-0.5 rounded ${discountType === 'PERCENT' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'}`}
                  >
                    %
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountInput}
                onChange={(e) => setDiscountInput(parseFloat(e.target.value) || 0)}
                placeholder={discountType === 'PERCENT' ? 'e.g. 5%' : 'e.g. ₱500'}
                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-white"
              />
              {calculatedDiscount > 0 && (
                <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                  Less: -{formatPHP(calculatedDiscount)}
                </div>
              )}
            </div>

            {/* BIR Tax Rate */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
                BIR Tax Rate (%)
              </label>
              <select
                value={birTaxRate}
                onChange={(e) => setBirTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-lg bg-white"
              >
                <option value="12">12% Standard BIR VAT</option>
                <option value="5">5% Withholding VAT (Gov/Corp)</option>
                <option value="3">3% Percentage Tax (Non-VAT)</option>
                <option value="0">0% VAT Exempt / Zero-Rated</option>
              </select>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                Tax: {formatPHP(birTaxAmount)}
              </div>
            </div>
          </div>
        </div>

        {/* FULFILLMENT METHOD: STORE PICK-UP VS FOR DELIVERY */}
        <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-700" />
              <span>Fulfillment &amp; Delivery Option</span>
            </span>
            <div className="flex bg-white rounded-lg p-0.5 border border-amber-300 text-xs font-bold shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  setFulfillmentType('PICKUP');
                  setDeliveryFee(0);
                }}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  fulfillmentType === 'PICKUP'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Store Pick-Up
              </button>
              <button
                type="button"
                onClick={() => {
                  setFulfillmentType('DELIVERY');
                  if (deliveryFee === 0) setDeliveryFee(300);
                  const cust = customers.find((c) => c.id === selectedCustomerId);
                  if (cust && !deliveryAddress) setDeliveryAddress(cust.address);
                  if (cust && !deliveryPhone) setDeliveryPhone(cust.phone);
                }}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  fulfillmentType === 'DELIVERY'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                For Delivery (Hauling)
              </button>
            </div>
          </div>

          {fulfillmentType === 'DELIVERY' && (
            <div className="space-y-2 pt-2 border-t border-amber-200/60 text-xs animate-in fade-in">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-0.5">
                    Delivery Fee (₱) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                    placeholder="Enter fee (e.g. 300)"
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="flex gap-1 mt-1 text-[9px]">
                    {[0, 150, 300, 500, 1000].map((fee) => (
                      <button
                        key={fee}
                        type="button"
                        onClick={() => setDeliveryFee(fee)}
                        className="px-1.5 py-0.5 rounded bg-white hover:bg-amber-200 text-slate-700 border border-amber-200 font-mono font-bold cursor-pointer"
                      >
                        {fee === 0 ? 'Free' : `₱${fee}`}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-0.5">
                    On-Site Contact Phone
                  </label>
                  <input
                    type="text"
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    placeholder="e.g. 0917-123-4567"
                    className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-700 mb-0.5">
                  Delivery Site Destination Address *
                </label>
                <input
                  type="text"
                  required={fulfillmentType === 'DELIVERY'}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Block/Lot, Street, Barangay, City / Project Site..."
                  className="w-full px-2.5 py-1.5 text-xs border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={autoDispatchOrder}
                  onChange={(e) => setAutoDispatchOrder(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span className="text-[11px] font-bold text-amber-950">
                  Auto-create Delivery Dispatch Order &amp; Generate Delivery Receipt (DR)
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Totals Summary */}
        <div className="space-y-1.5 pt-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Gross Materials Subtotal:</span>
            <span className="font-mono font-semibold">{formatPHP(subtotal)}</span>
          </div>

          {calculatedDiscount > 0 && (
            <div className="flex justify-between text-rose-600 font-semibold">
              <span>Applied Discount:</span>
              <span className="font-mono">- {formatPHP(calculatedDiscount)}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-600">
            <span>BIR Tax ({birTaxRate}%):</span>
            <span className="font-mono">{formatPHP(birTaxAmount)}</span>
          </div>

          {activeDeliveryFee > 0 && (
            <div className="flex justify-between text-amber-800 font-bold">
              <span>Hauling &amp; Delivery Fee:</span>
              <span className="font-mono">{formatPHP(activeDeliveryFee)}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t-2 border-slate-900 text-slate-950">
            <span className="font-black text-sm uppercase">Total Payable:</span>
            <span className="font-mono font-black text-lg text-amber-600">
              {formatPHP(grandTotal)}
            </span>
          </div>
        </div>

        {/* Payment Tender Form */}
        <form onSubmit={handleCheckout} className="space-y-3 pt-3 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  const val = e.target.value as PaymentMethod;
                  setPaymentMethod(val);
                  if (val === 'COD') setIsCodEnabled(true);
                  else if (!fulfillmentType || fulfillmentType !== 'DELIVERY') setIsCodEnabled(false);
                }}
                className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
              >
                <option value="CASH">Cash (Cash at Desk)</option>
                <option value="COD">Cash on Delivery (COD - Driver Collects On Site)</option>
                <option value="GCASH">GCash (Online QR)</option>
                <option value="MAYA">Maya</option>
                <option value="BANK_TRANSFER">Bank Transfer (BDO/BPI/MB)</option>
                <option value="CHECK">PDC / Post-Dated Check</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                {isCodActive ? 'Downpayment Amount (₱)' : 'Amount Tendered (₱) *'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={isCodActive ? codDownpayment : (paidAmount === null ? grandTotal : paidAmount)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  if (isCodActive) setCodDownpayment(val);
                  else setPaidAmount(val);
                }}
                className="w-full px-2.5 py-1.5 text-xs font-mono font-black border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* CASH ON DELIVERY (COD) & PARTIAL DOWNPAYMENT CONFIGURATION */}
          {(paymentMethod === 'COD' || fulfillmentType === 'DELIVERY' || isCodActive) && (
            <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-amber-200">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-950">
                  <Banknote className="w-4 h-4 text-amber-600" />
                  <span>Cash on Delivery (COD) &amp; Partial Downpayment</span>
                </div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCodActive}
                    onChange={(e) => {
                      setIsCodEnabled(e.target.checked);
                      if (e.target.checked) setPaymentMethod('COD');
                      else setPaymentMethod('CASH');
                    }}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Enable COD</span>
                </label>
              </div>

              {isCodActive && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase text-slate-700">
                        Partial Downpayment Tendered Now (₱)
                      </label>
                      <span className="text-[10px] text-slate-500">
                        (Paunang bayad sa tawag/walk-in)
                      </span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500">
                        ₱
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={grandTotal}
                        value={codDownpayment}
                        onChange={(e) =>
                          setCodDownpayment(
                            Math.min(grandTotal, Math.max(0, parseFloat(e.target.value) || 0))
                          )
                        }
                        placeholder="0.00 (Leave 0 for 100% COD)"
                        className="w-full pl-7 pr-3 py-1.5 text-xs font-mono font-black border border-amber-300 rounded-lg bg-white"
                      />
                    </div>

                    {/* Quick downpayment shortcuts */}
                    <div className="flex flex-wrap items-center gap-1 pt-1 text-[10px] font-bold">
                      <span className="text-slate-500 text-[10px]">Presets:</span>
                      <button
                        type="button"
                        onClick={() => setCodDownpayment(0)}
                        className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          codDownpayment === 0
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        0% (Full COD)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCodDownpayment(Math.round(grandTotal * 0.2 * 100) / 100)
                        }
                        className="px-1.5 py-0.5 rounded bg-white hover:bg-amber-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
                      >
                        20% Down
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCodDownpayment(Math.round(grandTotal * 0.3 * 100) / 100)
                        }
                        className="px-1.5 py-0.5 rounded bg-white hover:bg-amber-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
                      >
                        30% Down
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCodDownpayment(Math.round(grandTotal * 0.5 * 100) / 100)
                        }
                        className="px-1.5 py-0.5 rounded bg-white hover:bg-amber-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
                      >
                        50% Down
                      </button>
                    </div>
                  </div>

                  {/* Downpayment tender method if > 0 */}
                  {codDownpayment > 0 && (
                    <div className={`grid ${codDownpaymentMethod === 'CASH' ? 'grid-cols-1' : 'grid-cols-2'} gap-2 pt-1 border-t border-amber-200/60`}>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                          Downpayment Paid Via:
                        </label>
                        <select
                          value={codDownpaymentMethod}
                          onChange={(e) => {
                            const newMethod = e.target.value as any;
                            setCodDownpaymentMethod(newMethod);
                            if (newMethod === 'CASH') {
                              setCodDownpaymentRef('');
                            }
                          }}
                          className="w-full px-2 py-1 text-xs font-semibold border border-slate-300 rounded-md bg-white"
                        >
                          <option value="CASH">Cash (Counter)</option>
                          <option value="GCASH">GCash QR</option>
                          <option value="MAYA">Maya</option>
                          <option value="BANK_TRANSFER">Bank Deposit</option>
                        </select>
                      </div>
                      {codDownpaymentMethod !== 'CASH' && (
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                            Downpayment Ref / Notes:
                          </label>
                          <input
                            type="text"
                            value={codDownpaymentRef}
                            onChange={(e) => setCodDownpaymentRef(e.target.value)}
                            placeholder="e.g. GCash Ref# 12345"
                            className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md bg-white"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Computed COD Balance Box */}
                  <div className="p-2.5 bg-amber-100/90 rounded-lg border border-amber-300 text-xs space-y-1">
                    <div className="flex justify-between text-slate-700">
                      <span>Total Materials &amp; Delivery:</span>
                      <span className="font-mono font-bold">{formatPHP(grandTotal)}</span>
                    </div>
                    {codDownpayment > 0 && (
                      <div className="flex justify-between text-emerald-800 font-semibold">
                        <span>Less Downpayment Paid:</span>
                        <span className="font-mono">- {formatPHP(codDownpayment)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1 border-t border-amber-300 text-amber-950 font-black">
                      <span className="uppercase text-[11px]">
                        Balance to Collect by Driver (COD):
                      </span>
                      <span className="font-mono text-sm text-amber-700">
                        {formatPHP(Math.max(0, grandTotal - codDownpayment))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* If partial/credit debt, show remaining debt / due date */}
          {!isCodActive && remainingBalance > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-rose-900 uppercase">Contractor Debt (Utang):</span>
                <span className="font-mono font-black text-rose-700 text-sm">
                  {formatPHP(remainingBalance)}
                </span>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-rose-800 mb-0.5">
                  Promised Payment Due Date:
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-rose-300 rounded bg-white"
                />
              </div>
            </div>
          )}

          {paymentMethod !== 'CASH' && (
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                Reference No. / Check No. / Transaction Hash
              </label>
              <input
                type="text"
                placeholder="e.g. GCash Ref# 10293849 / Check # 882910"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
              Invoice Order Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Free delivery included, driver to call upon arrival"
              value={saleNotes}
              onChange={(e) => setSaleNotes(e.target.value)}
              className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <button
            type="submit"
            disabled={cart.length === 0}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-98 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Complete Sale &amp; Print Official Receipt</span>
          </button>
        </form>
      </div>

      {/* Official Printable Receipt Modal */}
      {completedSale && (
        <ReceiptModal
          isOpen={!!completedSale}
          onClose={() => setCompletedSale(null)}
          sale={completedSale}
          initialMode={receiptInitialMode}
        />
      )}

      {/* Quick Customer Add Modal */}
      <Modal
        isOpen={isNewCustOpen}
        onClose={() => setIsNewCustOpen(false)}
        title="Quick Add Customer"
        subtitle="Quickly register contractor or walk-in client profile"
        maxWidth="md"
      >
        <form onSubmit={handleQuickAddCustomer} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Customer / Company Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ABC Construction Corp / Engr. Dela Cruz"
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              placeholder="e.g. 0917-123-4567"
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-700 mb-1">
              Delivery Address
            </label>
            <input
              type="text"
              placeholder="e.g. Block 4 Lot 5, Dasmariñas, Cavite"
              value={newCustAddress}
              onChange={(e) => setNewCustAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsNewCustOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Thermal / Barcode Scanner Modal for POS */}
      <ThermalScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        mode="sales"
        onProductScanned={(prod) => addToCart(prod)}
        cartItemCount={cart.length}
        cartTotal={grandTotal}
      />
    </div>
  );
};
