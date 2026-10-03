import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DeliveryOrder } from '../../types';
import {
  X,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Phone,
  User,
  MapPin,
  QrCode,
  Printer,
  Share2,
} from 'lucide-react';

interface DriverCodModalProps {
  delivery: DeliveryOrder;
  driverName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DriverCodModal: React.FC<DriverCodModalProps> = ({
  delivery,
  driverName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { collectDeliveryCod, sales, showToast } = useApp();

  const linkedSale = sales.find((s) => s.id === delivery.salesId);
  const totalAmount = linkedSale?.total || delivery.codAmount || 0;
  const downpaymentPaid = linkedSale ? linkedSale.paidAmount : 0;
  const targetCodBalance = delivery.codAmount || (linkedSale ? linkedSale.balance : 0);

  const [amountCollected, setAmountCollected] = useState<number>(targetCodBalance);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'GCASH' | 'CHECK'>('CASH');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  if (!isOpen) return null;

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleConfirmCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (amountCollected <= 0) {
      showToast('Amount collected must be greater than ₱0', 'error');
      return;
    }

    collectDeliveryCod(
      delivery.id,
      amountCollected,
      paymentMethod,
      reference.trim() || undefined,
      notes.trim() || `Collected by driver ${driverName} upon site turnover`
    );

    setIsCompleted(true);
    if (onSuccess) onSuccess();
  };

  const handlePrintAcknowledgement = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl text-white overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-slate-950/40 text-amber-300 border border-amber-400/30">
              <Banknote className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-white">
                Cash On Delivery (COD) Collection
              </h3>
              <p className="text-[11px] text-amber-200">
                DR #{delivery.deliveryNo} — {delivery.customerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-amber-200 hover:text-white rounded-lg hover:bg-slate-950/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {!isCompleted ? (
          <form onSubmit={handleConfirmCollection} className="p-4 space-y-4">
            {/* Delivery & Customer Quick Info */}
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <strong>Customer:</strong>
                </span>
                <span className="font-bold text-white">{delivery.customerName || 'Walk-in / Phone Customer'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <strong>Contact:</strong>
                </span>
                <a href={`tel:${delivery.contactPhone}`} className="font-mono text-emerald-400 hover:underline">
                  {delivery.contactPhone || 'N/A'}
                </a>
              </div>
              <div className="flex items-start gap-1 text-slate-400 pt-1 border-t border-slate-700/50">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span className="truncate">{delivery.address}</span>
              </div>
            </div>

            {/* Financial Breakdown (Shows partial downpayment if paid at store!) */}
            <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center justify-between">
                <span>Payment &amp; COD Balance Summary</span>
                {downpaymentPaid > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 text-[9px]">
                    Partial Paid at Store
                  </span>
                )}
              </div>

              <div className="space-y-1 text-xs">
                {totalAmount > targetCodBalance && (
                  <div className="flex justify-between text-slate-400">
                    <span>Total Order Amount:</span>
                    <span className="font-mono font-medium">{formatPHP(totalAmount)}</span>
                  </div>
                )}

                {downpaymentPaid > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Downpayment Paid at Counter:</span>
                    <span className="font-mono font-semibold">- {formatPHP(downpaymentPaid)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1.5 border-t border-amber-500/20 text-white">
                  <span className="font-bold text-xs uppercase text-amber-300">
                    Required COD to Collect:
                  </span>
                  <span className="font-mono font-black text-lg text-amber-400">
                    {formatPHP(targetCodBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Amount to Collect Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Amount Collected by Driver (₱) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-amber-400 text-sm">
                  ₱
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={amountCollected}
                  onChange={(e) => setAmountCollected(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-800 border border-amber-400/50 rounded-xl font-mono font-black text-lg text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Quick shortcut buttons */}
              <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setAmountCollected(targetCodBalance)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-lg border border-slate-700 cursor-pointer"
                >
                  Exact (100% COD)
                </button>
                {targetCodBalance > 1000 && (
                  <button
                    type="button"
                    onClick={() => setAmountCollected(Math.round(targetCodBalance / 2))}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg border border-slate-700 cursor-pointer"
                  >
                    Half (50%)
                  </button>
                )}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Payment Tender Received on Site *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'CASH'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Cash on Hand</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('GCASH')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'GCASH'
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md font-black'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>GCash QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CHECK')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'CHECK'
                      ? 'bg-purple-500 text-white border-purple-400 shadow-md font-black'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Bank Check</span>
                </button>
              </div>
            </div>

            {/* Reference Number */}
            {paymentMethod !== 'CASH' && (
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-slate-300">
                  {paymentMethod === 'GCASH' ? 'GCash Reference Number *' : 'Check Number & Bank *'}
                </label>
                <input
                  type="text"
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={paymentMethod === 'GCASH' ? 'e.g. 102938475612' : 'e.g. BDO Check #0045231'}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            )}

            {/* Collector notes */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold uppercase text-slate-300">
                Driver Notes / Remarks
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Handed to site foreman Engr. Mark, received exact cash"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Cash Collection of {formatPHP(amountCollected)}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Success Screen & Digital Acknowledgement Receipt */
          <div className="p-5 space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-base font-black text-white uppercase tracking-tight">
                COD Payment Successfully Recorded!
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                The store accounting and dispatch balance have been automatically updated.
              </p>
            </div>

            {/* Printable Digital Acknowledgement Slip */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-left space-y-2.5 text-xs font-mono">
              <div className="text-center pb-2 border-b border-slate-800">
                <div className="font-black text-amber-400 text-sm">A-TWENTY SIX TRADING</div>
                <div className="text-[10px] text-slate-400">COD CASH COLLECTION ACKNOWLEDGEMENT</div>
              </div>

              <div className="space-y-1 text-slate-300 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Receipt:</span>
                  <span className="font-bold text-white">#{delivery.deliveryNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer:</span>
                  <span className="text-white">{delivery.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Collected Amount:</span>
                  <span className="font-bold text-amber-400">{formatPHP(amountCollected)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="text-white">{paymentMethod} {reference ? `(${reference})` : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Collected By:</span>
                  <span className="text-white">{driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Timestamp:</span>
                  <span className="text-slate-400">{new Date().toLocaleString('en-PH')}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] text-emerald-400 font-bold text-center">
                ✓ COD BALANCE CLEARED ON SITE
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrintAcknowledgement}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Slip</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
              >
                <span>Done</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
