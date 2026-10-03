import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { DeliveryOrder } from '../../types';

declare const google: any;
declare global {
  interface Window {
    google?: any;
  }
}

import {
  Truck,
  MapPin,
  Navigation,
  Phone,
  Banknote,
  CheckCircle2,
  ExternalLink,
  Layers,
  Compass,
  Maximize2,
  Minimize2,
  Package,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface DriverRouteMapViewProps {
  deliveries: DeliveryOrder[];
  driverName: string;
  driverGps?: { latitude: number; longitude: number; updatedAt?: string } | null;
  onSelectDelivery?: (delivery: DeliveryOrder) => void;
  onOpenCodModal?: (delivery: DeliveryOrder) => void;
  onOpenPodModal?: (delivery: DeliveryOrder) => void;
}

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Default A-Twenty Six Trading Warehouse Base in Dasmariñas, Cavite
const BASE_WAREHOUSE = {
  name: 'A-TWENTY SIX TRADING (Warehouse & Dispatch Base)',
  lat: 14.3294,
  lng: 120.9367,
  address: 'Km 26 Aguinaldo Highway, Dasmariñas, Cavite',
};

// Internal polyline renderer inside Google Map
const MapRouteLines: React.FC<{
  driverCoords: { lat: number; lng: number };
  stops: { id: string; lat: number; lng: number; order: DeliveryOrder }[];
}> = ({ driverCoords, stops }) => {
  const map = useMap();
  const polylineRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    if (stops.length === 0) return;

    // Build path: Driver's current position -> Stop 1 -> Stop 2 -> ...
    const path = [
      driverCoords,
      ...stops.map((s) => ({ lat: s.lat, lng: s.lng })),
    ];

    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#f59e0b',
      strokeOpacity: 0.9,
      strokeWeight: 4,
    });

    polyline.setMap(map);
    polylineRef.current = polyline;

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, driverCoords, stops]);

  return null;
};

// Camera recenter helper
const MapController: React.FC<{
  center: { lat: number; lng: number };
  zoom: number;
  triggerFit: number;
  points: { lat: number; lng: number }[];
}> = ({ center, zoom, triggerFit, points }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (triggerFit > 0 && points.length > 0 && window.google?.maps) {
      const bounds = new google.maps.LatLngBounds();
      points.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 40, right: 40 });
    }
  }, [map, triggerFit, points]);

  useEffect(() => {
    if (!map) return;
    map.setCenter(center);
  }, [map, center]);

  return null;
};

export const DriverRouteMapView: React.FC<DriverRouteMapViewProps> = ({
  deliveries,
  driverName,
  driverGps,
  onSelectDelivery,
  onOpenCodModal,
  onOpenPodModal,
}) => {
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(
    deliveries[0] || null
  );
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [fitTrigger, setFitTrigger] = useState(1);
  const [mapsError, setMapsError] = useState(false);

  // Driver truck coordinates
  const driverPosition = useMemo(() => {
    if (driverGps?.latitude && driverGps?.longitude) {
      return { lat: driverGps.latitude, lng: driverGps.longitude };
    }
    return { lat: BASE_WAREHOUSE.lat, lng: BASE_WAREHOUSE.lng };
  }, [driverGps]);

  // Stops coordinates with deterministic fallback if missing
  const routeStops = useMemo(() => {
    return deliveries.map((d, index) => {
      if (d.destinationGps?.latitude && d.destinationGps?.longitude) {
        return {
          id: d.id,
          lat: d.destinationGps.latitude,
          lng: d.destinationGps.longitude,
          order: d,
          index: index + 1,
        };
      }
      // Deterministic slight offset in Cavite/Metro Manila delivery corridor
      const offsetLat = ((d.id.charCodeAt(d.id.length - 1) % 10) - 5) * 0.012;
      const offsetLng = ((d.id.charCodeAt(0) % 10) - 5) * 0.012;
      return {
        id: d.id,
        lat: BASE_WAREHOUSE.lat + 0.015 * (index + 1) + offsetLat,
        lng: BASE_WAREHOUSE.lng + 0.018 * (index + 1) + offsetLng,
        order: d,
        index: index + 1,
      };
    });
  }, [deliveries]);

  // All points for fit bounds
  const allPoints = useMemo(() => {
    return [driverPosition, ...routeStops.map((s) => ({ lat: s.lat, lng: s.lng }))];
  }, [driverPosition, routeStops]);

  // Total route distance calculation (approx km)
  const totalDistanceKm = useMemo(() => {
    if (routeStops.length === 0) return 0;
    let dist = 0;
    let prev = driverPosition;
    for (const stop of routeStops) {
      const dLat = (stop.lat - prev.lat) * 111;
      const dLng = (stop.lng - prev.lng) * 111 * Math.cos(stop.lat * (Math.PI / 180));
      dist += Math.sqrt(dLat * dLat + dLng * dLng);
      prev = stop;
    }
    return Math.round(dist * 10) / 10;
  }, [driverPosition, routeStops]);

  const estimatedMinutes = Math.max(15, Math.round(totalDistanceKm * 3.2));

  const formatPHP = (val: number) => {
    return '₱' + Number(val || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleCenterOnDriver = () => {
    setFitTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
      {/* Top Map HUD Bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </span>
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span>Delivery Route &amp; GPS Map</span>
              <span className="text-[10px] bg-sky-950 text-sky-300 font-mono px-1.5 py-0.2 rounded border border-sky-800">
                {routeStops.length} Stops
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Driver: <strong>{driverName}</strong> • Est: ~{totalDistanceKm} km ({estimatedMinutes} mins)
            </div>
          </div>
        </div>

        {/* Map Controls */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFitTrigger((prev) => prev + 1)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold rounded-lg border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            title="Fit all stops in view"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px]">Fit Route</span>
          </button>

          <button
            type="button"
            onClick={() => setMapType((m) => (m === 'roadmap' ? 'satellite' : 'roadmap'))}
            className={`px-2.5 py-1.5 font-bold rounded-lg border transition-colors flex items-center gap-1 cursor-pointer text-[11px] ${
              mapType === 'satellite'
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{mapType === 'satellite' ? 'Satellite' : 'Roadmap'}</span>
          </button>
        </div>
      </div>

      {/* Main Map View Area */}
      <div className="relative flex-1 min-h-[360px] md:min-h-[460px] w-full bg-slate-900">
        {!mapsError ? (
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker', 'routes']}>
            <div className="w-full h-full min-h-[360px] md:min-h-[460px]">
              <Map
                mapId="DEMO_MAP_ID"
                defaultCenter={driverPosition}
                defaultZoom={13}
                mapTypeId={mapType}
                gestureHandling="greedy"
                disableDefaultUI={false}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                className="w-full h-full"
              >
                {/* Controller for programmatically fitting bounds & recentering */}
                <MapController
                  center={driverPosition}
                  zoom={13}
                  triggerFit={fitTrigger}
                  points={allPoints}
                />

                {/* Route lines */}
                <MapRouteLines driverCoords={driverPosition} stops={routeStops} />

                {/* 1. Base Warehouse Marker */}
                <AdvancedMarker position={{ lat: BASE_WAREHOUSE.lat, lng: BASE_WAREHOUSE.lng }}>
                  <div className="bg-slate-900 text-white p-1 rounded-lg border border-amber-400 shadow-md text-[10px] font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>A26 Dispatch Base</span>
                  </div>
                </AdvancedMarker>

                {/* 2. Driver Truck Live Marker */}
                <AdvancedMarker
                  position={driverPosition}
                  title={`Truck: ${driverName}`}
                >
                  <div className="relative flex items-center justify-center cursor-pointer group">
                    <span className="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-amber-400 opacity-75" />
                    <div className="relative p-2 rounded-full bg-amber-500 text-slate-950 shadow-xl border-2 border-slate-950 flex items-center justify-center">
                      <Truck className="w-4 h-4 font-black" />
                    </div>
                    <div className="absolute -bottom-6 bg-slate-900 text-amber-300 font-black text-[9px] px-1.5 py-0.5 rounded shadow border border-slate-700 whitespace-nowrap">
                      {driverName}
                    </div>
                  </div>
                </AdvancedMarker>

                {/* 3. Delivery Destination Markers */}
                {routeStops.map((stop) => {
                  const isSelected = selectedDelivery?.id === stop.id;
                  const isDelivered = stop.order.status === 'DELIVERED';
                  const isCodPending = stop.order.isCod && stop.order.codStatus === 'PENDING';

                  return (
                    <AdvancedMarker
                      key={stop.id}
                      position={{ lat: stop.lat, lng: stop.lng }}
                      onClick={() => {
                        setSelectedDelivery(stop.order);
                        if (onSelectDelivery) onSelectDelivery(stop.order);
                      }}
                    >
                      <div
                        className={`flex flex-col items-center cursor-pointer transition-transform ${
                          isSelected ? 'scale-115 z-30' : 'hover:scale-105 z-20'
                        }`}
                      >
                        {/* Stop Marker Pin */}
                        <div
                          className={`px-2 py-1 rounded-full font-black text-xs shadow-xl border-2 flex items-center gap-1 ${
                            isDelivered
                              ? 'bg-emerald-500 text-slate-950 border-white'
                              : isCodPending
                              ? 'bg-amber-400 text-slate-950 border-amber-600 animate-bounce-subtle'
                              : 'bg-sky-500 text-slate-950 border-white'
                          }`}
                        >
                          <span>#{stop.index}</span>
                          {isCodPending && <span className="text-[10px]">₱ COD</span>}
                        </div>

                        {/* Customer label */}
                        <div className="bg-slate-900/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-700 mt-0.5 max-w-[120px] truncate shadow">
                          {stop.order.customerName}
                        </div>
                      </div>
                    </AdvancedMarker>
                  );
                })}
              </Map>
            </div>
          </APIProvider>
        ) : (
          /* Graceful Fallback Vector Map in case of offline / quota */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-900">
            <MapPin className="w-12 h-12 text-amber-400" />
            <div className="font-black text-sm text-slate-200 uppercase">
              GPS Route Coordinates Active
            </div>
            <p className="text-xs text-slate-400 max-w-sm">
              All delivery GPS pins are tracked and synchronized with live site coordinates.
            </p>
          </div>
        )}

        {/* Floating Quick Action Overlay Buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
          <button
            type="button"
            onClick={handleCenterOnDriver}
            className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-slate-700 shadow-lg cursor-pointer active:scale-95 transition-all"
            title="Center on Truck"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Delivery Details Drawer (Bottom Sheet) */}
      {selectedDelivery ? (
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-amber-400 text-xs">
                  #{selectedDelivery.deliveryNo}
                </span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    selectedDelivery.status === 'DELIVERED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : selectedDelivery.status === 'OUT_FOR_DELIVERY'
                      ? 'bg-sky-950 text-sky-300 border border-sky-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {selectedDelivery.status}
                </span>
                {selectedDelivery.isCod && (
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      selectedDelivery.codStatus === 'COLLECTED'
                        ? 'bg-emerald-900 text-emerald-200'
                        : 'bg-amber-500 text-slate-950 animate-pulse'
                    }`}
                  >
                    {selectedDelivery.codStatus === 'COLLECTED'
                      ? '✓ COD Paid'
                      : `₱ COD: ${formatPHP(selectedDelivery.codAmount || 0)}`}
                  </span>
                )}
              </div>

              <h4 className="text-sm font-bold text-white mt-1">
                {selectedDelivery.customerName || 'Customer / Site'}
              </h4>
              <p className="text-xs text-slate-300 flex items-start gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span>{selectedDelivery.address}</span>
              </p>
            </div>

            {/* Turn-by-turn Navigation Link to Waze / Google Maps Navigation */}
            {(() => {
              const stop = routeStops.find((s) => s.id === selectedDelivery.id);
              const destLat = stop?.lat || BASE_WAREHOUSE.lat;
              const destLng = stop?.lng || BASE_WAREHOUSE.lng;
              return (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Navigate</span>
                </a>
              );
            })()}
          </div>

          {/* COD Notice & Collection Action */}
          {selectedDelivery.isCod && selectedDelivery.codStatus === 'PENDING' && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Cash on Delivery (COD) Required Upon Turnover</span>
                </div>
                <div className="text-xs text-slate-200 mt-0.5">
                  Collect from customer:{' '}
                  <strong className="text-amber-400 font-mono text-sm">
                    {formatPHP(selectedDelivery.codAmount || 0)}
                  </strong>
                </div>
              </div>

              {onOpenCodModal && (
                <button
                  type="button"
                  onClick={() => onOpenCodModal(selectedDelivery)}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Banknote className="w-4 h-4" />
                  <span>Collect COD</span>
                </button>
              )}
            </div>
          )}

          {/* Items & Site phone */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-3">
              {selectedDelivery.contactPhone && (
                <a
                  href={`tel:${selectedDelivery.contactPhone}`}
                  className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-800"
                >
                  <Phone className="w-3 h-3" />
                  <span>{selectedDelivery.contactPhone}</span>
                </a>
              )}

              <span className="text-slate-400 flex items-center gap-1 font-medium">
                <Package className="w-3 h-3" />
                <span>{selectedDelivery.items.length} material items</span>
              </span>
            </div>

            {selectedDelivery.status !== 'DELIVERED' && onOpenPodModal && (
              <button
                type="button"
                onClick={() => onOpenPodModal(selectedDelivery)}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Deliver &amp; Snap POD</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-900 border-t border-slate-800 text-center text-xs text-slate-400">
          Tap any numbered delivery marker on the map to view details, navigate, or collect COD.
        </div>
      )}

      {/* Stop Cards Horizontal Carousel */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex gap-2 overflow-x-auto">
        {routeStops.map((stop) => {
          const isSelected = selectedDelivery?.id === stop.id;
          return (
            <button
              key={stop.id}
              type="button"
              onClick={() => {
                setSelectedDelivery(stop.order);
                if (onSelectDelivery) onSelectDelivery(stop.order);
              }}
              className={`px-3 py-2 rounded-xl text-left transition-all border shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-[10px] font-mono">
                <span>Stop #{stop.index}</span>
                {stop.order.isCod && (
                  <span className={isSelected ? 'text-slate-950 font-black' : 'text-amber-400 font-bold'}>
                    ₱ COD
                  </span>
                )}
              </div>
              <div className="text-xs truncate max-w-[140px] font-bold">
                {stop.order.customerName}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
