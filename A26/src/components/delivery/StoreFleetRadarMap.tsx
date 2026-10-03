import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { DeliveryOrder, DriverDutyStatus } from '../../types';
import { computeLiveETA, EtaResult } from '../../utils/etaCalculator';
import {
  Truck,
  MapPin,
  Navigation,
  Clock,
  Radio,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Phone,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

declare const google: any;

interface StoreFleetRadarMapProps {
  deliveries: DeliveryOrder[];
  driverStatuses: DriverDutyStatus[];
  onSelectDelivery?: (delivery: DeliveryOrder) => void;
  onCallDriver?: (phone: string) => void;
}

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Base Warehouse marker coordinates in Dasmariñas, Cavite
const BASE_WAREHOUSE = {
  name: 'A-TWENTY SIX TRADING (Warehouse & Dispatch Hub)',
  lat: 14.3294,
  lng: 120.9367,
  address: 'Km 26 Aguinaldo Highway, Dasmariñas, Cavite',
};

// Polyline component for truck to destination route
const MapRadarRoutes: React.FC<{
  routes: { from: { lat: number; lng: number }; to: { lat: number; lng: number }; color: string }[];
}> = ({ routes }) => {
  const map = useMap();
  const polylinesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    // Clear old lines
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    routes.forEach((r) => {
      const poly = new google.maps.Polyline({
        path: [r.from, r.to],
        geodesic: true,
        strokeColor: r.color,
        strokeOpacity: 0.85,
        strokeWeight: 4,
      });
      poly.setMap(map);
      polylinesRef.current.push(poly);
    });

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routes]);

  return null;
};

export const StoreFleetRadarMap: React.FC<StoreFleetRadarMapProps> = ({
  deliveries,
  driverStatuses,
  onSelectDelivery,
  onCallDriver,
}) => {
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);
  const [isLivePolling, setIsLivePolling] = useState(true);
  const [lastPollTime, setLastPollTime] = useState<string>(new Date().toLocaleTimeString());
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');
  const [isExpanded, setIsExpanded] = useState(false);

  // Active in-transit deliveries
  const activeDeliveries = useMemo(() => {
    return deliveries.filter(
      (d) => d.status === 'OUT_FOR_DELIVERY' || d.status === 'ARRIVED' || d.status === 'PREPARING'
    );
  }, [deliveries]);

  // Compute live ETAs and proximity alerts for all active trips
  const deliveryEtaList = useMemo(() => {
    return activeDeliveries.map((del) => {
      // Find driver GPS or estimate from warehouse
      const driverStatus = driverStatuses.find(
        (s) => s.driverName.toLowerCase() === del.driver.toLowerCase()
      );
      const driverPos = driverStatus?.lastGps ||
        del.gpsLocation || {
          latitude: BASE_WAREHOUSE.lat + (Math.random() * 0.02 - 0.01),
          longitude: BASE_WAREHOUSE.lng + (Math.random() * 0.02 - 0.01),
          updatedAt: new Date().toISOString(),
        };

      // Destination coordinates (or Cavite project sites)
      const destPos = del.destinationGps || {
        latitude: BASE_WAREHOUSE.lat + 0.035 + (del.deliveryNo.charCodeAt(del.deliveryNo.length - 1) % 4) * 0.015,
        longitude: BASE_WAREHOUSE.lng + 0.025 + (del.deliveryNo.charCodeAt(del.deliveryNo.length - 2) % 4) * 0.012,
        addressLabel: del.address,
      };

      const eta = computeLiveETA(
        { lat: driverPos.latitude, lng: driverPos.longitude },
        { lat: destPos.latitude, lng: destPos.longitude }
      );

      return {
        order: del,
        driverName: del.driver,
        driverPos,
        destPos,
        eta,
      };
    });
  }, [activeDeliveries, driverStatuses, lastPollTime]);

  // Check for any driver near jobsite (within 2.5 km or <= 8 mins)
  const nearbyDeliveries = deliveryEtaList.filter((item) => item.eta.isNear && item.order.status !== 'DELIVERED');

  // Real-time polling timer (updates ETA & simulated GPS every 10 seconds)
  useEffect(() => {
    if (!isLivePolling) return;
    const interval = setInterval(() => {
      setLastPollTime(new Date().toLocaleTimeString());
    }, 10000);
    return () => clearInterval(interval);
  }, [isLivePolling]);

  // Polyline routes for map
  const routeLines = useMemo(() => {
    return deliveryEtaList.map((item) => ({
      from: { lat: item.driverPos.latitude, lng: item.driverPos.longitude },
      to: { lat: item.destPos.latitude, lng: item.destPos.longitude },
      color: item.order.status === 'ARRIVED' ? '#10b981' : item.eta.isNear ? '#f59e0b' : '#3b82f6',
    }));
  }, [deliveryEtaList]);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all ${
      isExpanded ? 'fixed inset-4 z-50 flex flex-col' : 'space-y-4 p-4'
    }`}>
      {/* Header with Live Status & Polling Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
            <Radio className="w-5 h-5 animate-pulse text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 leading-tight">
                Store Dispatch Fleet Radar &amp; Proximity Map
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Live Location Polling</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Real-time driver tracking, traffic estimation, and customer jobsite proximity radar.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Polling toggle */}
          <button
            type="button"
            onClick={() => setIsLivePolling(!isLivePolling)}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isLivePolling
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLivePolling ? 'animate-spin' : ''}`} />
            <span>{isLivePolling ? 'Live (10s)' : 'Paused'}</span>
          </button>

          {/* Map Type */}
          <select
            value={mapType}
            onChange={(e) => setMapType(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="roadmap">Roadmap</option>
            <option value="satellite">Satellite</option>
            <option value="hybrid">Hybrid</option>
          </select>

          {/* Expand Fullscreen */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title={isExpanded ? 'Exit Fullscreen' : 'Expand Fullscreen Radar'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Proximity Alerts Banner: "malaman kung malapit na ang driver" */}
      {nearbyDeliveries.length > 0 && (
        <div className="p-3 bg-amber-500/10 border-2 border-amber-500 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-amber-950 uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 text-amber-600 animate-bounce" />
            <span>Proximity Radar: Driver Approaching Destination ({nearbyDeliveries.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {nearbyDeliveries.map((item) => (
              <div
                key={item.order.id}
                className="p-2.5 bg-white rounded-lg border border-amber-300 shadow-2xs flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-amber-600" />
                    <span>{item.driverName}</span>
                    <span className="font-mono text-[10px] text-slate-500">({item.order.deliveryNo})</span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-semibold mt-0.5 truncate max-w-[200px]">
                    To: {item.order.customerName}
                  </div>
                  <div className="text-[10px] text-amber-700 font-black mt-0.5">
                    {item.eta.proximityMessage}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono font-black text-amber-600 text-sm">
                    {item.eta.durationText}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {item.eta.distanceText}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Map Container */}
      <div className={`relative rounded-xl overflow-hidden border border-slate-200 ${isExpanded ? 'flex-1 min-h-[400px]' : 'h-[440px]'}`}>
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            defaultCenter={{ lat: BASE_WAREHOUSE.lat, lng: BASE_WAREHOUSE.lng }}
            defaultZoom={12}
            mapTypeId={mapType}
            mapId="DEMO_MAP_ID"
            gestureHandling="greedy"
            disableDefaultUI={false}
            className="w-full h-full"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          >
            {/* 1. Base Warehouse Marker */}
            <AdvancedMarker
              position={{ lat: BASE_WAREHOUSE.lat, lng: BASE_WAREHOUSE.lng }}
              onClick={() => setSelectedMarker({ type: 'BASE', data: BASE_WAREHOUSE })}
            >
              <div className="flex flex-col items-center cursor-pointer group">
                <div className="px-2 py-0.5 bg-slate-950 text-amber-400 font-black text-[10px] rounded shadow-md border border-amber-500/40 whitespace-nowrap">
                  🏭 Main Base Hub
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-900 border-2 border-amber-400 text-amber-400 flex items-center justify-center shadow-lg -mt-1 group-hover:scale-110 transition-transform">
                  <Navigation className="w-4 h-4" />
                </div>
              </div>
            </AdvancedMarker>

            {/* 2. Active Driver Truck Markers */}
            {deliveryEtaList.map((item) => (
              <AdvancedMarker
                key={`truck-${item.order.id}`}
                position={{ lat: item.driverPos.latitude, lng: item.driverPos.longitude }}
                onClick={() => setSelectedMarker({ type: 'DRIVER', data: item })}
              >
                <div className="flex flex-col items-center cursor-pointer group">
                  <div className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded shadow-md whitespace-nowrap flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    <span>{item.driverName}</span>
                    <span className="font-mono text-[9px] bg-slate-950 text-amber-300 px-1 rounded">
                      {item.eta.durationText}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-amber-500 border-2 border-white text-slate-950 flex items-center justify-center shadow-lg -mt-1 group-hover:scale-110 transition-transform animate-pulse">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
              </AdvancedMarker>
            ))}

            {/* 3. Customer Destination Markers */}
            {deliveryEtaList.map((item) => (
              <AdvancedMarker
                key={`dest-${item.order.id}`}
                position={{ lat: item.destPos.latitude, lng: item.destPos.longitude }}
                onClick={() => setSelectedMarker({ type: 'DESTINATION', data: item })}
              >
                <div className="flex flex-col items-center cursor-pointer group">
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold shadow-md whitespace-nowrap ${
                    item.order.status === 'ARRIVED'
                      ? 'bg-emerald-600 text-white'
                      : item.eta.isNear
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-900 text-white'
                  }`}>
                    📍 {item.order.customerName}
                  </div>
                  <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center shadow-md -mt-1 ${
                    item.order.status === 'ARRIVED' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}>
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                </div>
              </AdvancedMarker>
            ))}

            {/* Draw Connecting Route Lines */}
            <MapRadarRoutes routes={routeLines} />

            {/* Info Window Popover */}
            {selectedMarker && (
              <InfoWindow
                position={
                  selectedMarker.type === 'BASE'
                    ? { lat: BASE_WAREHOUSE.lat, lng: BASE_WAREHOUSE.lng }
                    : selectedMarker.type === 'DRIVER'
                    ? { lat: selectedMarker.data.driverPos.latitude, lng: selectedMarker.data.driverPos.longitude }
                    : { lat: selectedMarker.data.destPos.latitude, lng: selectedMarker.data.destPos.longitude }
                }
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-1 max-w-xs text-xs space-y-2">
                  {selectedMarker.type === 'BASE' ? (
                    <div>
                      <h4 className="font-bold text-slate-900">{BASE_WAREHOUSE.name}</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">{BASE_WAREHOUSE.address}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b pb-1.5">
                        <span className="font-bold text-slate-900">
                          {selectedMarker.data.driverName}
                        </span>
                        <span className="font-mono text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                          {selectedMarker.data.order.deliveryNo}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">
                        Customer: <strong>{selectedMarker.data.order.customerName}</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        Address: {selectedMarker.data.order.address}
                      </div>

                      {/* Live ETA Card */}
                      <div className="p-2 bg-slate-50 rounded border border-slate-200 mt-1.5 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span>Distance:</span>
                          <strong className="font-mono">{selectedMarker.data.eta.distanceText}</strong>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span>Estimated Time:</span>
                          <strong className="font-mono text-amber-700">{selectedMarker.data.eta.durationText}</strong>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span>Traffic:</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            selectedMarker.data.eta.trafficCondition === 'LIGHT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : selectedMarker.data.eta.trafficCondition === 'HEAVY'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {selectedMarker.data.eta.trafficCondition} TRAFFIC
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        {onCallDriver && selectedMarker.data.order.contactPhone && (
                          <button
                            type="button"
                            onClick={() => onCallDriver(selectedMarker.data.order.contactPhone)}
                            className="px-2 py-1 bg-emerald-600 text-white font-bold rounded text-[10px] flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call Site</span>
                          </button>
                        )}
                        <span className="text-[9px] text-slate-400">
                          Status: {selectedMarker.data.order.status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>

        {/* Floating Mini Overlay Dashboard on the Map */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-xs text-white p-3 rounded-xl border border-slate-700 shadow-xl max-w-sm text-xs space-y-2 pointer-events-auto">
          <div className="flex items-center justify-between gap-4 font-bold border-b border-slate-700 pb-1.5">
            <span className="flex items-center gap-1.5 text-amber-400">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Delivery Trips ({activeDeliveries.length})</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Polled: {lastPollTime}
            </span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {deliveryEtaList.map((item) => (
              <div
                key={item.order.id}
                onClick={() => setSelectedMarker({ type: 'DRIVER', data: item })}
                className="p-1.5 bg-slate-800/80 hover:bg-slate-700/80 rounded border border-slate-700/60 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-white truncate text-[11px]">
                    {item.driverName} → {item.order.customerName}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {item.order.status === 'ARRIVED' ? '🟢 Arrived at Site' : `🚛 ${item.eta.distanceText} remaining`}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-amber-400 text-xs">
                    {item.eta.durationText}
                  </span>
                </div>
              </div>
            ))}
            {deliveryEtaList.length === 0 && (
              <div className="text-center py-2 text-slate-400 italic text-[11px]">
                No active delivery trucks on the road right now.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
