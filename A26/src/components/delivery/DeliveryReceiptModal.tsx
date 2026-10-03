import React, { useEffect } from 'react';
import { DeliveryOrder } from '../../types';
import { useApp } from '../../context/AppContext';
import { Printer, X } from 'lucide-react';

interface DeliveryReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: DeliveryOrder | null;
}

export const DeliveryReceiptModal: React.FC<DeliveryReceiptModalProps> = ({
  isOpen,
  onClose,
  delivery,
}) => {
  const { settings, customers, projects } = useApp();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !delivery) return null;

  const cust = customers.find((c) => c.id === delivery.customerId);
  const proj = projects.find((p) => p.id === delivery.projectId);

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
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white no-print">
          <div className="text-xs font-bold flex items-center gap-2">
            <span className="text-amber-400 font-black uppercase tracking-wider">
              DELIVERY RECEIPT &amp; DISPATCH NOTE
            </span>
            <span className="font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs">
              #{delivery.deliveryNo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
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

        {/* Printable Delivery Receipt */}
        <div className="p-8 text-slate-900 bg-white space-y-6 font-sans">
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">
              {settings.businessName}
            </h1>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mt-0.5">
              Hauling & Logistics Dispatch Note
            </p>
            <p className="text-[11px] text-slate-600 mt-1">{settings.address} • Tel: {settings.phone}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-slate-400 font-bold uppercase text-[10px]">Deliver To:</div>
              <div className="font-bold text-sm text-slate-900 mt-0.5">{delivery.customerName || cust?.name || 'Customer'}</div>
              <div className="text-slate-700 mt-0.5 font-medium">{delivery.address}</div>
              <div className="text-slate-600 mt-0.5">Contact on Site: {delivery.contactPhone}</div>
              {proj && (
                <div className="mt-1 text-[11px] text-amber-700 font-semibold">
                  Project: {proj.name}
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="inline-block text-left space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400 font-semibold">DR Number:</span>
                  <span className="font-mono font-black text-slate-900">{delivery.deliveryNo}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400 font-semibold">Dispatch Date:</span>
                  <span className="text-slate-700 font-medium">
                    {new Date(delivery.createdAt).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400 font-semibold">Assigned Driver:</span>
                  <span className="font-bold text-slate-900">{delivery.driver}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400 font-semibold">Vehicle Unit:</span>
                  <span className="font-bold text-slate-900">{delivery.vehicle}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400 font-semibold">Dispatch Status:</span>
                  <span className="font-bold text-amber-700 uppercase">{delivery.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Checklist Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px] text-slate-700">
                <tr>
                  <th className="px-3 py-2 text-center w-12">No.</th>
                  <th className="px-3 py-2">Item Description & Specifications</th>
                  <th className="px-3 py-2 text-right">Quantity</th>
                  <th className="px-3 py-2 text-center">Unit</th>
                  <th className="px-3 py-2 text-center w-24">Site Checked [✓]</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {delivery.items.map((item, idx) => (
                  <tr key={idx} className="font-medium text-slate-800">
                    <td className="px-3 py-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-bold">{item.productName}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-black text-slate-900">{item.qty}</td>
                    <td className="px-3 py-2.5 text-center text-slate-600 font-semibold">{item.unit}</td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="w-5 h-5 border border-slate-400 rounded-sm mx-auto"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {delivery.notes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <strong className="text-slate-800">Dispatch Notes / Gate Instructions:</strong> {delivery.notes}
            </div>
          )}

          {delivery.isCod && (
            <div
              className={`p-3 rounded-lg border text-xs ${
                delivery.codStatus === 'COLLECTED'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}
            >
              <div className="flex justify-between items-center font-bold">
                <span className="uppercase tracking-wider">
                  CASH ON DELIVERY (COD) / BAYAD PAGKA-DELIVER:
                </span>
                <span className="font-mono text-sm font-black">
                  {formatPHP(delivery.codAmount || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] mt-1 text-slate-700">
                <span>
                  Status:{' '}
                  <strong>
                    {delivery.codStatus === 'COLLECTED'
                      ? `COLLECTED (${formatPHP(delivery.codCollectedAmount || 0)}) via ${
                          delivery.codPaymentMethod || 'CASH'
                        }`
                      : 'PENDING CASH COLLECTION BY DRIVER UPON TURNOVER'}
                  </strong>
                </span>
                {delivery.codCollectedAt && (
                  <span className="font-mono text-[10px] text-slate-500">
                    Collected: {new Date(delivery.codCollectedAt).toLocaleString('en-PH')}
                  </span>
                )}
              </div>
            </div>
          )}

          {delivery.proofOfDeliveryPhoto && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase">
                  ✓ Verified Proof of Delivery (Captured On-Site by Driver Camera)
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">
                  Received by: <strong>{delivery.proofReceivedBy || 'Customer'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-4">
                <img
                  src={delivery.proofOfDeliveryPhoto}
                  alt="Proof of Delivery"
                  className="w-48 h-32 object-cover rounded-lg border border-emerald-300 shadow-xs"
                />
                <div className="text-[11px] text-slate-600 space-y-1">
                  <div><strong>Delivered Timestamp:</strong> {delivery.deliveredAt ? new Date(delivery.deliveredAt).toLocaleString('en-PH') : 'Verified'}</div>
                  {delivery.gpsLocation && (
                    <div><strong>GPS Coordinates:</strong> {delivery.gpsLocation.latitude.toFixed(5)}, {delivery.gpsLocation.longitude.toFixed(5)}</div>
                  )}
                  <div className="text-emerald-800 font-medium">Digital camera image timestamped & validated by A26 Trading Dispatch system.</div>
                </div>
              </div>
            </div>
          )}

          {/* Acknowledgement Signatures */}
          <div className="pt-10 border-t border-slate-300 grid grid-cols-2 gap-12 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 pb-8"></div>
              <div className="font-bold text-slate-900 mt-1">{delivery.driver}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                Truck Driver / Warehouse Dispatcher
              </div>
            </div>
            <div>
              <div className="relative border-b border-slate-400 pb-2 min-h-[50px] flex items-end justify-center">
                {delivery.customerSignature ? (
                  <img
                    src={delivery.customerSignature}
                    alt="Customer E-Signature"
                    className="max-h-12 max-w-[180px] object-contain mx-auto"
                  />
                ) : (
                  <div className="h-8"></div>
                )}
              </div>
              <div className="font-bold text-slate-900 mt-1">
                {delivery.proofReceivedBy || 'Printed Name & Signature'}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                Received by Site Engineer / Customer Representative
              </div>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 pt-3">
            White Copy: Customer / Green Copy: Driver Return / Yellow Copy: Warehouse Accounting File
          </div>
        </div>

        {/* Modal Bottom Sticky Actions (no-print) */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <X className="w-4 h-4 text-slate-500" />
            <span>Close (Isara)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt / PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
