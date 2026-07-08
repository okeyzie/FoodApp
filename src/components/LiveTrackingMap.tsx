import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Compass, Navigation, MapPin, Bike, Store, Home } from 'lucide-react';
import { Order, Rider, Restaurant } from '../types';

interface LiveTrackingMapProps {
  order?: Order | null;
  rider?: Rider | null;
  restaurant?: Restaurant | null;
  allRiders?: Rider[];
  allRestaurants?: Restaurant[];
}

const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY';

export default function LiveTrackingMap({
  order,
  rider,
  restaurant,
  allRiders = [],
  allRestaurants = [],
}: LiveTrackingMapProps) {
  const [mapMode, setMapMode] = useState<'vector' | 'google'>(hasValidKey ? 'google' : 'vector');
  const [riderCoords, setRiderCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Default coordinate center (Lagos Lekki/VI Area)
  const defaultCenter = { lat: 6.4320, lng: 3.4480 };
  const customerCoords = { lat: 6.4350, lng: 3.4580 }; // Home/Office center

  // Get current active points
  const activeRest = restaurant || (order ? { lat: order.items[0]?.id ? 6.4350 : 6.4280, lng: 3.4350, name: order.restaurantName } : null);
  const activeRider = rider || (order?.riderId ? { lat: order.riderLat || 6.4320, lng: order.riderLng || 3.4480, name: order.riderName } : null);

  // Smoothly interpolate rider position from restaurant to customer if order is active
  useEffect(() => {
    if (!order) {
      setRiderCoords(null);
      return;
    }

    const startLat = 6.4280; // Default Restaurant
    const startLng = 3.4350;
    const destLat = customerCoords.lat;
    const destLng = customerCoords.lng;

    let intervalId: any;

    if (order.status === 'Preparing') {
      setRiderCoords({ lat: startLat, lng: startLng });
    } else if (order.status === 'Rider Assigned') {
      setRiderCoords({ lat: startLat + 0.003, lng: startLng + 0.003 });
    } else if (order.status === 'Rider En Route') {
      // Simulate live gliding along path
      let progress = 0.1;
      setRiderCoords({ lat: startLat + (destLat - startLat) * progress, lng: startLng + (destLng - startLng) * progress });

      intervalId = setInterval(() => {
        progress += 0.15;
        if (progress >= 0.8) {
          progress = 0.8;
          clearInterval(intervalId);
        }
        setRiderCoords({
          lat: startLat + (destLat - startLat) * progress,
          lng: startLng + (destLng - startLng) * progress,
        });
      }, 3000);
    } else if (order.status === 'Arriving Soon') {
      setRiderCoords({ lat: destLat - 0.001, lng: destLng - 0.001 });
    } else if (order.status === 'Delivered') {
      setRiderCoords({ lat: destLat, lng: destLng });
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [order?.status, order?.id]);

  // Convert GPS Coordinates to custom SVG local map coordinates (6.41 to 6.45 Lat, 3.42 to 3.47 Lng)
  const mapGPStoSVG = (lat: number, lng: number) => {
    const latMin = 6.4100;
    const latMax = 6.4550;
    const lngMin = 3.4200;
    const lngMax = 3.4750;

    const width = 600;
    const height = 400;

    // Scale X (lng)
    const x = ((lng - lngMin) / (lngMax - lngMin)) * width;
    // Scale Y (lat, inverted because SVG Y increases downwards)
    const y = height - ((lat - latMin) / (latMax - latMin)) * height;

    return { x: Math.max(10, Math.min(width - 10, x)), y: Math.max(10, Math.min(height - 10, y)) };
  };

  const customerPos = mapGPStoSVG(customerCoords.lat, customerCoords.lng);

  return (
    <div className="relative w-full h-[380px] bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Map Control Overlay */}
      <div className="absolute top-3 left-3 z-10 flex gap-2">
        <button
          onClick={() => setMapMode('vector')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
            mapMode === 'vector'
              ? 'bg-[#FF6B35] text-white'
              : 'bg-white/90 text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Radar GPS
        </button>
        <button
          onClick={() => {
            if (!hasValidKey) {
              alert("Google Maps Platform API Key is required for this view. Please follow the instructions to set GOOGLE_MAPS_PLATFORM_KEY in your AI Studio Secrets.");
              return;
            }
            setMapMode('google');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
            mapMode === 'google'
              ? 'bg-[#FF6B35] text-white'
              : 'bg-white/90 text-gray-700 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          Google Maps {!hasValidKey && '🔒'}
        </button>
      </div>

      {mapMode === 'vector' ? (
        /* VECTOR MOCK GPS RADAR */
        <div className="relative w-full h-full flex flex-col justify-between p-4 overflow-hidden bg-white">
          {/* Custom Ambient Grid Map */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="radar-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FF6B35" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#radar-grid)" />
            </svg>
          </div>

          {/* High Fidelity Vector Lagos Streets and Lagoon */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 400" preserveAspectRatio="none">
            {/* Lagos Lagoon Water Body */}
            <path d="M0,0 Q180,60 300,40 T600,20 L600,120 Q480,110 350,140 T0,110 Z" fill="#0ea5e9" fillOpacity="0.08" />
            <path d="M0,320 Q200,340 380,310 T600,350 L600,400 L0,400 Z" fill="#0ea5e9" fillOpacity="0.06" />

            {/* Simulated Lekki Roads */}
            {/* Admiralty Way */}
            <path d="M 50,220 Q 250,180 400,250 T 580,240" fill="none" stroke="#E2E8F0" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
            <path d="M 50,220 Q 250,180 400,250 T 580,240" fill="none" stroke="#F1F5F9" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
            {/* Kingsway Road */}
            <path d="M 120,50 L 140,350" fill="none" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
            {/* Third Mainland Connection */}
            <path d="M 280,50 L 320,380" fill="none" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
            {/* Ozumba Mbadiwe Ave */}
            <path d="M 80,160 Q 300,150 520,180" fill="none" stroke="#E2E8F0" strokeWidth="5" strokeLinecap="round" opacity="0.8" />

            {/* Active Delivery Path Polyline */}
            {order && (order.status === 'Rider En Route' || order.status === 'Arriving Soon') && (
              <path
                d={`M ${mapGPStoSVG(6.4280, 3.4350).x},${mapGPStoSVG(6.4280, 3.4350).y} Q 300,200 ${customerPos.x},${customerPos.y}`}
                fill="none"
                stroke="#FF6B35"
                strokeWidth="3"
                strokeDasharray="6,4"
                className="animate-[dash_10s_linear_infinite]"
              />
            )}
          </svg>

          {/* Map Elements/Pins (Placed dynamically based on scaled Coordinates) */}

          {/* 1. All restaurants (if menu open / browse) */}
          {allRestaurants.map((r) => {
            const pos = mapGPStoSVG(r.lat, r.lng);
            const isSelected = order?.restaurantId === r.id;
            return (
              <div
                key={r.id}
                style={{ left: pos.x, top: pos.y }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-20"
              >
                <div className={`p-2 rounded-full shadow-md border transition-all duration-300 flex items-center justify-center ${
                  isSelected
                    ? 'bg-[#FF6B35] text-white scale-125 border-[#FF6B35] animate-pulse shadow-lg'
                    : 'bg-white text-[#FF6B35] border-gray-200 hover:scale-110 shadow-sm'
                }`}>
                  <Store className="w-4.5 h-4.5" />
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded bg-gray-900 text-[10px] font-medium text-white whitespace-nowrap shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  {r.name}
                </div>
              </div>
            );
          })}

          {/* 2. Customer Home/Delivery Destination */}
          <div
            style={{ left: customerPos.x, top: customerPos.y }}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-30"
          >
            <div className="relative">
              <span className="absolute -inset-1 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="relative p-2 rounded-full bg-emerald-500 text-white shadow-md border border-emerald-400 flex items-center justify-center">
                <Home className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded bg-gray-900 text-[10px] font-medium text-white whitespace-nowrap shadow-md pointer-events-none opacity-100">
              Your Delivery Address
            </div>
          </div>

          {/* 3. Active Rider Icon */}
          {order && riderCoords && (
            <div
              style={{
                left: mapGPStoSVG(riderCoords.lat, riderCoords.lng).x,
                top: mapGPStoSVG(riderCoords.lat, riderCoords.lng).y
              }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-40 transition-all duration-1000 ease-linear"
            >
              <div className="relative">
                <span className="absolute -inset-1 rounded-full bg-amber-500/30 animate-ping" />
                <div className="relative p-2.5 rounded-full bg-amber-500 text-white shadow-md border border-amber-400 flex items-center justify-center">
                  <Bike className="w-5 h-5 animate-bounce" />
                </div>
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-0.5 rounded bg-gray-900 border border-[#FF6B35]/40 text-[10px] font-semibold text-white whitespace-nowrap shadow-md">
                🚴 {order.riderName || 'Rider'} ({order.status})
              </div>
            </div>
          )}

          {/* 4. Display Offline/Online Idle Riders (for Admin / Rider dashboards) */}
          {!order && allRiders.map((r) => {
            const pos = mapGPStoSVG(r.lat, r.lng);
            return (
              <div
                key={r.id}
                style={{ left: pos.x, top: pos.y }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-20"
              >
                <div className={`p-2 rounded-full shadow-sm border flex items-center justify-center ${
                  r.status === 'online'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-gray-100 text-gray-400 border-gray-200'
                }`}>
                  <Bike className="w-4 h-4" />
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded bg-gray-900 text-[9px] text-white whitespace-nowrap shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  {r.name} ({r.status})
                </div>
              </div>
            );
          })}

          {/* Bottom Indicators / Legend */}
          <div className="mt-auto flex justify-between items-center bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-gray-200 text-[11px] text-gray-500 font-medium z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#FF6B35]" /> Restaurant</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Destination</span>
              <span className="flex items-center gap-1 animate-pulse"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Online Rider</span>
            </div>
            <div className="text-[#FF6B35]/90 text-xs font-semibold">
              Lekki-VI Satellite Grid
            </div>
          </div>
        </div>
      ) : (
        /* REAL GOOGLE MAPS INTEGRATION */
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
          <Map
            defaultCenter={defaultCenter}
            defaultZoom={13}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
            className="w-full h-full"
          >
            {/* Custom home pin */}
            <AdvancedMarker position={customerCoords} title="Your Delivery Address">
              <Pin background="#10b981" glyphColor="#fff" />
            </AdvancedMarker>

            {/* Active Restaurant Pin */}
            {activeRest && (
              <AdvancedMarker position={{ lat: activeRest.lat, lng: activeRest.lng }} title={activeRest.name}>
                <Pin background="#FF6B35" glyphColor="#fff" />
              </AdvancedMarker>
            )}

            {/* Active Rider Pin */}
            {activeRider && (
              <AdvancedMarker
                position={{
                  lat: riderCoords?.lat || activeRider.lat,
                  lng: riderCoords?.lng || activeRider.lng,
                }}
                title={activeRider.name}
              >
                <Pin background="#FF6B35" glyphColor="#000" scale={1.2}>
                  🚴
                </Pin>
              </AdvancedMarker>
            )}

            {/* Fallback to show all restaurants on map if no active order */}
            {!order && allRestaurants.map(r => (
              <AdvancedMarker key={r.id} position={{ lat: r.lat, lng: r.lng }} title={r.name}>
                <Pin background="#3b82f6" glyphColor="#fff" />
              </AdvancedMarker>
            ))}
          </Map>
        </APIProvider>
      )}
    </div>
  );
}
