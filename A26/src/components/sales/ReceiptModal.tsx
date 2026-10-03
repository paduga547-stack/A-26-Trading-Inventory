import React, { useState, useEffect } from 'react';
import { Sale } from '../../types';
import { useApp } from '../../context/AppContext';
import { Printer, X, FileText, Receipt, Truck, Download } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  initialMode?: 'INVOICE' | 'THERMAL' | 'DELIVERY_RECEIPT';
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  initialMode = 'INVOICE',
}) => {
  const { settings, customers, projects } = useApp();
  const [formatMode, setFormatMode] = useState<'INVOICE' | 'THERMAL' | 'DELIVERY_RECEIPT'>(initialMode);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !sale) return null;

  const cust = customers.find((c) => c.id === sale.customerId);
  const proj = projects.find((p) => p.id === sale.projectId);

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full overflow-hidden my-6 transition-all ${
          formatMode === 'THERMAL' ? 'max-w-md' : 'max-w-3xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Actions (no-print) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-5 py-3.5 bg-slate-900 text-white gap-3 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-wider uppercase text-amber-400">
              Receipt & Invoice Center
            </span>
            <span className="font-mono text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
              #{sale.invoiceNo}
            </span>
          </div>

          {/* Format Selector Tabs */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFormatMode('INVOICE')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                formatMode === 'INVOICE'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>A4 Invoice</span>
            </button>
            <button
              type="button"
              onClick={() => setFormatMode('THERMAL')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                formatMode === 'THERMAL'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Thermal POS</span>
            </button>
            <button
              type="button"
              onClick={() => setFormatMode('DELIVERY_RECEIPT')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                formatMode === 'DELIVERY_RECEIPT'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Delivery Receipt</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
              title="Close window (Esc)"
            >
              <X className="w-4 h-4 text-slate-400" />
              <span>Close (Isara)</span>
            </button>
          </div>
        </div>

        {/* Printable Content Area */}
        <div id="printable-receipt" className="p-6 sm:p-8 text-slate-900 bg-white">
          {/* FORMAT 1: STANDARD A4 SALES INVOICE */}
          {formatMode === 'INVOICE' && (
            <div className="space-y-6 font-sans">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start justify-between border-b-2 border-slate-900 pb-5 gap-4">
                <div>
                  <div className="inline-block px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-xs uppercase rounded mb-1">
                    Official Sales Invoice
                  </div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">
                    {settings.businessName}
                  </h1>
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                    {settings.businessType}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1 max-w-sm">
                    {settings.address}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Tel: {settings.phone} • Email: {settings.email}
                  </p>
                  <p className="text-[11px] font-mono text-slate-700 font-bold mt-0.5">
                    VAT Reg. TIN: {settings.tinNumber}
                  </p>
                </div>

                <div className="text-right sm:text-right w-full sm:w-auto">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 inline-block text-left min-w-[200px]">
                    <div className="flex justify-between gap-4 text-xs">
                      <span className="text-slate-400 font-semibold">Invoice No:</span>
                      <span className="font-mono font-black text-slate-950 text-sm">#{sale.invoiceNo}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-xs">
                      <span className="text-slate-400 font-semibold">Date:</span>
                      <span className="text-slate-700 font-medium">
                        {new Date(sale.createdAt).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 text-xs">
                      <span className="text-slate-400 font-semibold">Payment:</span>
                      <span className="font-bold text-slate-900">{sale.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-xs">
                      <span className="text-slate-400 font-semibold">Status:</span>
                      <span className="font-bold text-emerald-700 uppercase text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {sale.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer and Project Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Customer / Contractor Billed:</span>
                  <div className="font-bold text-sm text-slate-900 mt-0.5">{cust?.name || 'Walk-In Customer'}</div>
                  {cust?.address && <div className="text-slate-600 mt-0.5">{cust.address}</div>}
                  {cust?.phone && <div className="text-slate-600">Contact: {cust.phone}</div>}
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Project / Site Destination:</span>
                  <div className="font-semibold text-slate-900 mt-0.5">{proj?.name || 'Store Pick-Up / Direct Site'}</div>
                  {proj?.address && <div className="text-slate-600">{proj.address}</div>}
                  <div className="text-slate-500 mt-1">Cashier: <strong>{sale.cashierName}</strong></div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px] text-slate-700">
                    <tr>
                      <th className="px-3 py-2.5 text-center w-12">Qty</th>
                      <th className="px-2 py-2.5">Unit</th>
                      <th className="px-3 py-2.5">Item Description & Specifications</th>
                      <th className="px-3 py-2.5 text-right">Unit Price</th>
                      <th className="px-3 py-2.5 text-right">Amount (PHP)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sale.items.map((item, idx) => (
                      <tr key={idx} className="font-medium text-slate-800">
                        <td className="px-3 py-2.5 text-center font-mono font-bold">{item.qty}</td>
                        <td className="px-2 py-2.5 text-slate-600">{item.unit}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-900">{item.productName}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                          {formatPHP(item.unitPrice)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                          {formatPHP(item.qty * item.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="flex justify-end text-xs">
                <div className="w-80 space-y-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-medium">
                  <div className="flex justify-between text-slate-600">
                    <span>Materials Subtotal:</span>
                    <span className="font-mono font-semibold">{formatPHP(sale.subtotal)}</span>
                  </div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>Applied Discount:</span>
                      <span className="font-mono">- {formatPHP(sale.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>BIR Value Added Tax ({settings.vatRate}%):</span>
                    <span className="font-mono">{formatPHP(sale.vat)}</span>
                  </div>
                  {sale.deliveryFee > 0 && (
                    <div className="flex justify-between text-amber-800 font-semibold">
                      <span>Hauling & Delivery Fee:</span>
                      <span className="font-mono">{formatPHP(sale.deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-950 font-black text-sm pt-2 border-t-2 border-slate-900">
                    <span>TOTAL AMOUNT DUE:</span>
                    <span className="font-mono">{formatPHP(sale.total)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold pt-1">
                    <span>Amount Paid / Tendered:</span>
                    <span className="font-mono">{formatPHP(sale.paidAmount)}</span>
                  </div>
                  {sale.balance > 0 ? (
                    <div className={`flex justify-between font-black pt-1 border-t ${
                      sale.isCod ? 'text-amber-800 border-amber-300' : 'text-rose-700 border-rose-200'
                    }`}>
                      <span>{sale.isCod ? 'Cash on Delivery (COD) Balance:' : 'Outstanding Balance (Utang):'}</span>
                      <span className="font-mono">{formatPHP(sale.balance)}</span>
                    </div>
                  ) : (
                    <div className="text-right text-emerald-600 font-black text-[11px] pt-1">
                      ✓ FULLY SETTLED / PAID IN FULL
                    </div>
                  )}
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 pb-8"></div>
                  <div className="font-bold text-slate-800 mt-1">{sale.cashierName}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Authorized Warehouse Cashier</div>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-8"></div>
                  <div className="font-bold text-slate-800 mt-1">
                    {cust?.contactPerson || 'Customer Representative'}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Received Goods in Good Count & Order
                  </div>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-2">
                This serves as an Official Sales Invoice. Thank you for your business with {settings.businessName}!
              </div>
            </div>
          )}

          {/* FORMAT 2: 58mm / 80mm THERMAL RECEIPT */}
          {formatMode === 'THERMAL' && (
            <div className="max-w-[320px] mx-auto font-mono text-[11px] text-slate-950 leading-relaxed bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
              <div className="text-center space-y-0.5 pb-2">
                <div className="font-black text-sm uppercase tracking-tight">{settings.businessName}</div>
                <div className="text-[10px] uppercase font-semibold text-slate-600">{settings.businessType}</div>
                <div className="text-[10px] text-slate-600">{settings.address}</div>
                <div className="text-[10px] text-slate-600">Tel: {settings.phone}</div>
                <div className="text-[10px] font-bold mt-1">TIN: {settings.tinNumber}</div>
              </div>

              <div className="text-center text-[10px] py-1 border-y border-dashed border-slate-400 font-bold">
                *** SALES RECEIPT ***
              </div>

              <div className="py-2 space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>INVOICE:</span>
                  <span className="font-bold">#{sale.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span>DATE:</span>
                  <span>{new Date(sale.createdAt).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="flex justify-between">
                  <span>CASHIER:</span>
                  <span>{sale.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>CUSTOMER:</span>
                  <span className="font-bold truncate max-w-[150px]">{cust?.name || 'Walk-In'}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-400 py-1.5">
                <div className="flex justify-between text-[10px] font-bold pb-1">
                  <span>ITEM / QTY</span>
                  <span>AMOUNT</span>
                </div>
                <div className="space-y-1">
                  {sale.items.map((item, idx) => (
                    <div key={idx}>
                      <div className="font-bold truncate">{item.productName}</div>
                      <div className="flex justify-between text-slate-600 text-[10px]">
                        <span>{item.qty} {item.unit} @ {formatPHP(item.unitPrice)}</span>
                        <span className="font-bold text-slate-900">{formatPHP(item.qty * item.unitPrice)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-dashed border-slate-400 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>{formatPHP(sale.subtotal)}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>DISCOUNT:</span>
                    <span>-{formatPHP(sale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>VAT ({settings.vatRate}%):</span>
                  <span>{formatPHP(sale.vat)}</span>
                </div>
                {sale.deliveryFee > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>DELIVERY FEE:</span>
                    <span>{formatPHP(sale.deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-900">
                  <span>TOTAL:</span>
                  <span>{formatPHP(sale.total)}</span>
                </div>
                <div className="flex justify-between font-bold pt-0.5">
                  <span>PAID ({sale.paymentMethod}):</span>
                  <span>{formatPHP(sale.paidAmount)}</span>
                </div>
                {sale.isCod && sale.balance > 0 ? (
                  <div className="flex justify-between text-amber-800 font-black">
                    <span>COD BALANCE:</span>
                    <span>{formatPHP(sale.balance)}</span>
                  </div>
                ) : sale.balance > 0 ? (
                  <div className="flex justify-between text-rose-700 font-black">
                    <span>BALANCE:</span>
                    <span>{formatPHP(sale.balance)}</span>
                  </div>
                ) : (
                  <div className="text-center font-bold text-emerald-700 text-[10px] pt-1">
                    PAID IN FULL
                  </div>
                )}
              </div>

              <div className="text-center text-[9px] pt-4 pb-2 border-t border-dashed border-slate-400 mt-3 space-y-0.5">
                <div>THANK YOU FOR SHOPPING!</div>
                <div>PLEASE KEEP THIS RECEIPT</div>
                <div>FOR WARRANTY & RETURNS</div>
              </div>
            </div>
          )}

          {/* FORMAT 3: DELIVERY RECEIPT (DR) */}
          {formatMode === 'DELIVERY_RECEIPT' && (
            <div className="space-y-6 font-sans">
              <div className="border-b-2 border-slate-900 pb-4 text-center">
                <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[11px] uppercase rounded">
                  Official Delivery Receipt (DR) & Dispatch Slip
                </span>
                <h1 className="text-2xl font-black uppercase text-slate-950 mt-1">
                  {settings.businessName}
                </h1>
                <p className="text-xs font-semibold text-slate-600">{settings.address} • Tel: {settings.phone}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Deliver To Contractor:</span>
                  <div className="font-bold text-sm text-slate-900">{cust?.name || 'Walk-In Customer'}</div>
                  <div className="text-slate-600 mt-0.5">{cust?.address || 'Site Delivery Destination'}</div>
                  <div className="text-slate-600">Contact: {cust?.phone || 'On-site Contact'}</div>
                  {proj && <div className="text-amber-800 font-semibold mt-1">Project Site: {proj.name}</div>}
                </div>
                <div className="text-right space-y-1">
                  <div>Ref Invoice: <strong className="font-mono">#{sale.invoiceNo}</strong></div>
                  <div>Date: <strong>{new Date(sale.createdAt).toLocaleDateString('en-PH')}</strong></div>
                  <div>Delivery Fee: <strong className="font-mono">{formatPHP(sale.deliveryFee)}</strong></div>
                  <div className="text-emerald-700 font-bold uppercase">Authorized Dispatch</div>
                </div>
              </div>

              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px] text-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-center w-12">No.</th>
                      <th className="px-3 py-2">Item Description</th>
                      <th className="px-3 py-2 text-center">Unit</th>
                      <th className="px-3 py-2 text-right">Quantity Dispatched</th>
                      <th className="px-3 py-2 text-center w-24">Received [✓]</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sale.items.map((item, idx) => (
                      <tr key={idx} className="font-medium">
                        <td className="px-3 py-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-bold text-slate-900">{item.productName}</td>
                        <td className="px-3 py-2.5 text-center text-slate-600">{item.unit}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-black text-slate-950 text-sm">{item.qty}</td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="w-5 h-5 border border-slate-400 rounded-sm mx-auto"></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 pb-8"></div>
                  <div className="font-bold text-slate-800 mt-1">Dispatched By</div>
                  <div className="text-[10px] text-slate-500 uppercase">Warehouse Logistics Team</div>
                </div>
                <div>
                  <div className="border-b border-slate-400 pb-8"></div>
                  <div className="font-bold text-slate-800 mt-1">Site Representative / Received By</div>
                  <div className="text-[10px] text-slate-500 uppercase">Signature over Printed Name</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Sticky Actions (no-print) */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4 text-slate-500" />
            <span>Close Receipt (Isara)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
