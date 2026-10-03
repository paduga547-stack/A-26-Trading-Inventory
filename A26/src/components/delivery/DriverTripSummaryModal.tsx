import React, { useState, useMemo } from 'react';
import { DeliveryOrder, DriverShift } from '../../types';
import {
  Truck,
  MapPin,
  Clock,
  Fuel,
  CheckCircle2,
  Banknote,
  Printer,
  X,
  Share2,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Sliders,
  FileText,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';

interface DriverTripSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  driverName: string;
  deliveries: DeliveryOrder[];
  activeShift?: DriverShift | null;
  onConfirmEndShift: (stats: {
    totalDistanceKm: number;
    fuelConsumptionLiters: number;
    fuelEstimatedCost: number;
    completedDeliveriesCount: number;
    totalDeliveriesAssigned: number;
    totalCodCollected: number;
    vehicleType?: string;
    notes?: string;
  }) => void;
}

// Default base warehouse in Dasmariñas, Cavite
const BASE_WAREHOUSE = {
  name: 'A-TWENTY SIX TRADING (Warehouse & Dispatch Base)',
  lat: 14.3294,
  lng: 120.9367,
  address: 'Km 26 Aguinaldo Highway, Dasmariñas, Cavite',
};

// Haversine distance formula in kilometers
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const DriverTripSummaryModal: React.FC<DriverTripSummaryModalProps> = ({
  isOpen,
  onClose,
  driverName,
  deliveries,
  activeShift,
  onConfirmEndShift,
}) => {
  if (!isOpen) return null;

  // Customizable vehicle & fuel parameters
  const [vehicleType, setVehicleType] = useState<string>(
    activeShift?.vehicleType || 'Dropside Truck (4-Wheeler)'
  );
  const [fuelEconomyKmPerL, setFuelEconomyKmPerL] = useState<number>(8.0); // 8.0 km/L standard delivery truck
  const [dieselPricePerL, setDieselPricePerL] = useState<number>(60.0); // ₱60.00 / L
  const [shiftNotes, setShiftNotes] = useState<string>('');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isEnding, setIsEnding] = useState<boolean>(false);

  // Today's shift start time
  const shiftStartTime = useMemo(() => {
    if (activeShift?.startTime) return new Date(activeShift.startTime);
    // Fallback: 8 hours ago today or 8:00 AM
    const fallback = new Date();
    fallback.setHours(8, 0, 0, 0);
    return fallback;
  }, [activeShift]);

  const shiftEndTime = new Date();
  const shiftDurationMs = Math.max(0, shiftEndTime.getTime() - shiftStartTime.getTime());
  const shiftDurationHours = Math.floor(shiftDurationMs / (1000 * 60 * 60));
  const shiftDurationMinutes = Math.floor((shiftDurationMs % (1000 * 60 * 60)) / (1000 * 60));

  // Driver deliveries for this shift / today
  const shiftDeliveries = useMemo(() => {
    return deliveries.filter(
      (d) => d.driver.toLowerCase() === driverName.toLowerCase()
    );
  }, [deliveries, driverName]);

  const completedDeliveries = useMemo(() => {
    return shiftDeliveries.filter((d) => d.status === 'DELIVERED');
  }, [shiftDeliveries]);

  const pendingDeliveries = useMemo(() => {
    return shiftDeliveries.filter(
      (d) => d.status !== 'DELIVERED' && d.status !== 'CANCELLED'
    );
  }, [shiftDeliveries]);

  // Automated Distance Calculation:
  // Base -> Stop 1 -> Stop 2 -> ... -> Base Return (using GPS coords or simulated Cavite delivery radius)
  const totalDistanceKm = useMemo(() => {
    if (shiftDeliveries.length === 0) return 18.5; // baseline minimum depot transit

    let distance = 0;
    let currentPoint = { lat: BASE_WAREHOUSE.lat, lng: BASE_WAREHOUSE.lng };

    shiftDeliveries.forEach((d) => {
      const destLat =
        d.destinationGps?.latitude ||
        BASE_WAREHOUSE.lat + 0.035 + (d.deliveryNo.charCodeAt(d.deliveryNo.length - 1) % 5) * 0.02;
      const destLng =
        d.destinationGps?.longitude ||
        BASE_WAREHOUSE.lng + 0.025 + (d.deliveryNo.charCodeAt(d.deliveryNo.length - 2) % 5) * 0.018;

      // Road factor approximation (~1.3x haversine direct line for Cavite roads)
      const directKm = calculateHaversineKm(
        currentPoint.lat,
        currentPoint.lng,
        destLat,
        destLng
      );
      distance += Math.max(4.5, directKm * 1.32);
      currentPoint = { lat: destLat, lng: destLng };
    });

    // Return to base warehouse
    const returnDirectKm = calculateHaversineKm(
      currentPoint.lat,
      currentPoint.lng,
      BASE_WAREHOUSE.lat,
      BASE_WAREHOUSE.lng
    );
    distance += Math.max(6.0, returnDirectKm * 1.32);

    return Math.round(distance * 10) / 10;
  }, [shiftDeliveries]);

  // Fuel Consumption calculation
  const fuelConsumptionLiters = useMemo(() => {
    const liters = totalDistanceKm / Math.max(1, fuelEconomyKmPerL);
    return Math.round(liters * 10) / 10;
  }, [totalDistanceKm, fuelEconomyKmPerL]);

  const fuelEstimatedCost = useMemo(() => {
    return Math.round(fuelConsumptionLiters * dieselPricePerL);
  }, [fuelConsumptionLiters, dieselPricePerL]);

  // Total COD collected by driver
  const totalCodCollected = useMemo(() => {
    return completedDeliveries.reduce((sum, d) => sum + (d.codCollectedAmount || 0), 0);
  }, [completedDeliveries]);

  const totalCodPending = useMemo(() => {
    return shiftDeliveries
      .filter((d) => d.isCod && d.codStatus !== 'COLLECTED')
      .reduce((sum, d) => sum + (d.codAmount || 0), 0);
  }, [shiftDeliveries]);

  const handlePrint = () => {
    window.print();
  };

  const handleConfirm = () => {
    setIsEnding(true);
    onConfirmEndShift({
      totalDistanceKm,
      fuelConsumptionLiters,
      fuelEstimatedCost,
      completedDeliveriesCount: completedDeliveries.length,
      totalDeliveriesAssigned: shiftDeliveries.length,
      totalCodCollected,
      vehicleType,
      notes: shiftNotes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-slate-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow-md">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-950/70">
                Shift End Liquidation Report
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                Delivery Trip Summary
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 transition-colors cursor-pointer"
              title="Print Shift Summary Slip"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Driver & Shift Details Banner */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Driver &amp; Dispatch Unit
              </div>
              <div className="text-base font-black text-slate-100 mt-0.5">
                {driverName}
              </div>
              <div className="text-xs text-amber-400 font-medium">
                {vehicleType} · {BASE_WAREHOUSE.name.split('(')[0]}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Shift Duration
              </div>
              <div className="text-base font-black text-slate-100 font-mono mt-0.5">
                {shiftDurationHours}h {shiftDurationMinutes}m
              </div>
              <div className="text-xs text-slate-400">
                {shiftStartTime.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })} - {shiftEndTime.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* 4 CORE AUTOMATED METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Distance */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/70 space-y-1">
              <div className="flex items-center gap-1.5 text-sky-400 text-xs font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>Total Distance</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-100 font-mono">
                {totalDistanceKm} <span className="text-xs font-bold text-slate-400">km</span>
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {shiftDeliveries.length} drops + depot return
              </div>
            </div>

            {/* 2. Fuel Consumption Estimate */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/70 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Fuel className="w-3.5 h-3.5 shrink-0" />
                <span>Fuel Estimate</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                {fuelConsumptionLiters} <span className="text-xs font-bold text-slate-400">L</span>
              </div>
              <div className="text-[10px] text-amber-400/80 font-medium">
                ≈ ₱{fuelEstimatedCost.toLocaleString()} (@₱{dieselPricePerL}/L)
              </div>
            </div>

            {/* 3. Successful Deliveries */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/70 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Deliveries</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                {completedDeliveries.length}{' '}
                <span className="text-xs font-bold text-slate-400">/ {shiftDeliveries.length}</span>
              </div>
              <div className="text-[10px] text-emerald-400/80 font-bold">
                {shiftDeliveries.length > 0
                  ? `${Math.round((completedDeliveries.length / shiftDeliveries.length) * 100)}% Fulfilled`
                  : 'No drops today'}
              </div>
            </div>

            {/* 4. Total COD Collection */}
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/70 space-y-1">
              <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-bold uppercase tracking-wider">
                <Banknote className="w-3.5 h-3.5 shrink-0" />
                <span>COD Collected</span>
              </div>
              <div className="text-lg sm:text-xl font-black text-yellow-300 font-mono truncate">
                ₱{totalCodCollected.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">
                Ready for cash turnover
              </div>
            </div>
          </div>

          {/* Pending Delivery Warning (if any) */}
          {pendingDeliveries.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Notice:</span> You still have{' '}
                <span className="font-black text-amber-300">{pendingDeliveries.length} uncompleted delivery order(s)</span>{' '}
                assigned. Ending your shift will leave these orders in their current status for tomorrow or another driver.
              </div>
            </div>
          )}

          {/* Deliveries Breakdown Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
              <span>Shift Stops Breakdown</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {shiftDeliveries.length} Total Drops
              </span>
            </div>

            {shiftDeliveries.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 text-center text-xs text-slate-400">
                No delivery orders recorded for this driver shift yet.
              </div>
            ) : (
              <div className="border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/80 bg-slate-900/60 text-xs">
                {shiftDeliveries.map((del, idx) => {
                  const isDone = del.status === 'DELIVERED';
                  return (
                    <div
                      key={del.id}
                      className="p-3 flex flex-wrap items-center justify-between gap-2 hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-200 truncate">
                            {del.customerName}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {del.address}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-auto text-right">
                        {del.isCod && (
                          <div className="text-[11px] font-mono">
                            <span className="text-slate-400">COD: </span>
                            <span className="text-amber-400 font-bold">
                              ₱{(del.codCollectedAmount || del.codAmount || 0).toLocaleString()}
                            </span>
                          </div>
                        )}

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            isDone
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isDone ? 'Delivered' : del.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Toggleable Fuel & Mileage Calibration */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-850">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Adjust Vehicle &amp; Fuel Rate Parameters</span>
              </div>
              <span className="text-slate-500 text-[11px]">
                {showSettings ? '▲ Hide' : '▼ Expand'}
              </span>
            </button>

            {showSettings && (
              <div className="p-4 pt-1 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                  >
                    <option value="Dropside Truck (4-Wheeler)">Dropside Truck (4-Wheeler)</option>
                    <option value="6-Wheeler Forward Truck">6-Wheeler Forward Truck</option>
                    <option value="Boom / Crane Truck">Boom / Crane Truck</option>
                    <option value="L300 / Delivery Van">L300 / Delivery Van</option>
                    <option value="Multicab / Utility">Multicab / Utility</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Fuel Economy (km / L)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="3"
                    max="20"
                    value={fuelEconomyKmPerL}
                    onChange={(e) => setFuelEconomyKmPerL(Math.max(1, parseFloat(e.target.value) || 8.0))}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Diesel Price (₱ / L)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="40"
                    max="100"
                    value={dieselPricePerL}
                    onChange={(e) => setDieselPricePerL(Math.max(10, parseFloat(e.target.value) || 60.0))}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* End Shift Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              End-of-Shift Notes / Vehicle Condition Report
            </label>
            <input
              type="text"
              placeholder="e.g. Good trip, vehicle parked at Base Yard with full tire pressure, diesel gauge 3/4."
              value={shiftNotes}
              onChange={(e) => setShiftNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancel / Back
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>

            <button
              type="button"
              disabled={isEnding}
              onClick={handleConfirm}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEnding ? 'Finalizing...' : 'Confirm End Shift & Submit'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
