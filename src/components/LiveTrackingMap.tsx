import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { 
  Compass, 
  Navigation, 
  MapPin, 
  Bike, 
  Store, 
  Home, 
  Activity, 
  Wifi, 
  Gauge, 
  Clock, 
  RefreshCw, 
  Play, 
  Pause, 
  ChevronRight,
  ShieldAlert,
  Info
} from 'lucide-react';
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

// A sub-component to handle map auto-centering on the rider's active coordinates
function MapPanController({ center, autoCenter }: { center: { lat: number; lng: number } | null; autoCenter: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (map && center && autoCenter) {
      map.panTo(center);
    }
  }, [map, center, autoCenter]);
  return null;
}

// A sub-component to calculate and render real-time Google Maps Routes and Polylines
function RouteDisplay({ 
  origin, 
  destination 
}: { 
  origin: { lat: number; lng: number }; 
  destination: { lat: number; lng: number };
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!routesLib || !map) return;

    // Clear previous route polylines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    routesLib.Route.computeRoutes({
      origin,
      destination,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    }).then(({ routes }) => {
      if (routes?.[0]) {
        const newPolylines = routes[0].createPolylines();
        newPolylines.forEach(p => {
          p.setOptions({
            strokeColor: '#FF6B35',
            strokeOpacity: 0.85,
            strokeWeight: 5,
          });
          p.setMap(map);
        });
        polylinesRef.current = newPolylines;
      }
    }).catch(err => {
      console.error("Failed to compute real-time Google Maps route:", err);
    });

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [routesLib, map, origin.lat, origin.lng, destination.lat, destination.lng]);

  return null;
}

export default function LiveTrackingMap({
  order,
  rider,
  restaurant,
  allRiders = [],
  allRestaurants = [],
}: LiveTrackingMapProps) {
  const [mapMode, setMapMode] = useState<'vector' | 'google'>(hasValidKey ? 'google' : 'vector');
  const [progress, setProgress] = useState(0.15);
  const [isPaused, setIsPaused] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [autoCenter, setAutoCenter] = useState(true);
  const [showKeyInstructions, setShowKeyInstructions] = useState(false);

  // Default coordinate center (Lagos Lekki/VI Area)
  const defaultCenter = { lat: 6.4320, lng: 3.4480 };
  const customerCoords = { lat: 6.4350, lng: 3.4580 }; // Customer Delivery destination

  // Coordinates of the restaurant
  const activeRest = restaurant || (order ? { lat: 6.4280, lng: 3.4350, name: order.restaurantName } : { lat: 6.4280, lng: 3.4350, name: 'Main Kitchen' });

  // Sync initial progress based on active order lifecycle status
  useEffect(() => {
    if (!order) {
      setProgress(0);
      return;
    }
    if (order.status === 'Preparing') {
      setProgress(0.01);
    } else if (order.status === 'Rider Assigned') {
      setProgress(0.12);
    } else if (order.status === 'Rider En Route') {
      setProgress(0.15);
    } else if (order.status === 'Arriving Soon') {
      setProgress(0.88);
    } else if (order.status === 'Delivered') {
      setProgress(1.0);
    }
  }, [order?.status, order?.id]);

  // Live GPS progression interval
  useEffect(() => {
    if (!order || order.status !== 'Rider En Route' || isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const step = 0.005 * speedMultiplier;
        const next = prev + step;
        if (next >= 0.95) {
          // Pause at 95% progress representing the "Arriving Soon" doorstep stage
          return 0.95;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [order?.status, order?.id, isPaused, speedMultiplier]);

  // Compute live high-precision GPS coordinates from progress parameter with realistic road jitter
  const getCoordinates = (p: number) => {
    const startLat = activeRest.lat;
    const startLng = activeRest.lng;
    const destLat = customerCoords.lat;
    const destLng = customerCoords.lng;

    if (p <= 0) return { lat: startLat, lng: startLng };
    if (p >= 1) return { lat: destLat, lng: destLng };

    // Beautiful trigonometry jitter curves to simulate actual roads rather than simple laser straight lines
    const jitterLat = Math.sin(p * Math.PI * 3.5) * 0.0012;
    const jitterLng = Math.cos(p * Math.PI * 3.5) * 0.0008;

    const lat = startLat + (destLat - startLat) * p + (p < 0.95 ? jitterLat : 0);
    const lng = startLng + (destLng - startLng) * p + (p < 0.95 ? jitterLng : 0);

    return { lat, lng };
  };

  const riderCoords = getCoordinates(progress);

  // Derive dynamic details
  const totalDistance = 2800; // 2.8 km default route
  const currentDistanceMeters = Math.max(0, Math.round(totalDistance * (1 - progress)));
  const currentDistanceKm = (currentDistanceMeters / 1000).toFixed(2);
  
  // Speed is 0 if paused or arrived, otherwise fluctuating normally around 32 km/h
  const currentSpeed = progress >= 1 ? 0 : isPaused ? 0 : Math.round(34 + Math.sin(Date.now() / 3000) * 4);
  const currentSpeedDisplay = currentSpeed > 0 ? `${currentSpeed} km/h` : 'Stopped';

  // ETA in minutes/seconds
  const currentEtaSeconds = Math.max(0, Math.round(480 * (1 - progress)));
  const formatETA = (sec: number) => {
    if (sec <= 0 || progress >= 1) return 'Arrived';
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  // Convert GPS coordinates to custom SVG coordinates for high fidelity fallback Vector Map (6.41 to 6.45 Lat, 3.42 to 3.47 Lng)
  const mapGPStoSVG = (lat: number, lng: number) => {
    const latMin = 6.4100;
    const latMax = 6.4550;
    const lngMin = 3.4200;
    const lngMax = 3.4750;

    const width = 600;
    const height = 400;

    const x = ((lng - lngMin) / (lngMax - lngMin)) * width;
    const y = height - ((lat - latMin) / (latMax - latMin)) * height;

    return { 
      x: Math.max(15, Math.min(width - 15, x)), 
      y: Math.max(15, Math.min(height - 15, y)) 
    };
  };

  const customerPos = mapGPStoSVG(customerCoords.lat, customerCoords.lng);
  const activeRestPos = mapGPStoSVG(activeRest.lat, activeRest.lng);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row min-h-[460px]">
      
      {/* 1. LEFT COLUMN: MAP AREA (Google Maps / High-Fidelity Vector Radar) */}
      <div className="relative flex-1 h-[320px] sm:h-[380px] md:h-auto min-h-[320px] bg-gray-50 flex flex-col justify-between overflow-hidden border-b md:border-b-0 md:border-r border-gray-100">
        
        {/* Toggle Controls Map Overlay */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button
            onClick={() => setMapMode('vector')}
            className={`px-3 py-1.5 text-[10px] font-extrabold rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-sm cursor-pointer ${
              mapMode === 'vector'
                ? 'bg-emerald-800 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/80'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Radar Grid
          </button>
          
          <button
            onClick={() => {
              if (!hasValidKey) {
                setShowKeyInstructions(true);
                return;
              }
              setMapMode('google');
            }}
            className={`px-3 py-1.5 text-[10px] font-extrabold rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-sm cursor-pointer ${
              mapMode === 'google'
                ? 'bg-emerald-800 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/80'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            Google Maps {!hasValidKey && '🔒'}
          </button>
        </div>

        {/* Dynamic Map Rendering Block */}
        {mapMode === 'vector' ? (
          
          /* VECTOR GRID RADAR fallback */
          <div className="relative w-full h-full flex flex-col justify-between p-4 overflow-hidden bg-white select-none">
            
            {/* Radar Background Pattern */}
            <div className="absolute inset-0 opacity-4 pointer-events-none">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="vector-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#10B981" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#vector-grid)" />
              </svg>
            </div>

            {/* Simulated Lagos Coastline, Waterway and Expressways */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 600 400" preserveAspectRatio="none">
              {/* Lagoon water shape */}
              <path d="M0,0 Q180,50 320,30 T600,10 L600,100 Q460,90 320,120 T0,90 Z" fill="#10B981" fillOpacity="0.05" />
              <path d="M0,340 Q240,360 400,330 T600,360 L600,400 L0,400 Z" fill="#10B981" fillOpacity="0.04" />

              {/* Major Roads */}
              <path d="M 50,220 Q 250,180 400,250 T 580,240" fill="none" stroke="#F1F5F9" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
              <path d="M 50,220 Q 250,180 400,250 T 580,240" fill="none" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" opacity="1" />
              
              <path d="M 120,40 L 140,360" fill="none" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
              <path d="M 280,40 L 320,380" fill="none" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round" opacity="0.6" />

              {/* Active Delivery Route Polyline */}
              {order && (progress > 0 && progress < 1) && (
                <path
                  d={`M ${activeRestPos.x},${activeRestPos.y} Q 280,210 ${customerPos.x},${customerPos.y}`}
                  fill="none"
                  stroke="#FF6B35"
                  strokeWidth="3.5"
                  strokeDasharray="8,5"
                  className="animate-[dash_12s_linear_infinite]"
                  style={{
                    strokeDashoffset: -100,
                  }}
                />
              )}
            </svg>

            {/* 1. Restaurant Pin */}
            <div 
              style={{ left: activeRestPos.x, top: activeRestPos.y }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group"
            >
              <div className="p-2 rounded-full bg-[#FF6B35] border-2 border-white text-white shadow-md flex items-center justify-center animate-pulse">
                <Store className="w-3.5 h-3.5" />
              </div>
              <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded bg-gray-900/90 text-[9px] font-bold text-white whitespace-nowrap shadow-sm">
                Kitchen
              </span>
            </div>

            {/* 2. Customer Home Pin */}
            <div 
              style={{ left: customerPos.x, top: customerPos.y }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 group"
            >
              <div className="p-2 rounded-full bg-emerald-600 border-2 border-white text-white shadow-md flex items-center justify-center">
                <Home className="w-3.5 h-3.5" />
              </div>
              <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded bg-gray-900/90 text-[9px] font-bold text-white whitespace-nowrap shadow-sm">
                You
              </span>
            </div>

            {/* 3. Simulated Moving Rider */}
            {order && (
              <div 
                style={{ 
                  left: mapGPStoSVG(riderCoords.lat, riderCoords.lng).x, 
                  top: mapGPStoSVG(riderCoords.lat, riderCoords.lng).y 
                }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-1000 ease-linear"
              >
                <div className="relative">
                  <span className="absolute -inset-1.5 rounded-full bg-amber-500/35 animate-ping" />
                  <div className="p-2.5 rounded-full bg-amber-500 border-2 border-white text-white shadow-lg flex items-center justify-center">
                    <Bike className="w-4 h-4" />
                  </div>
                </div>
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-0.5 rounded bg-amber-600 text-[9px] font-bold text-white whitespace-nowrap shadow-sm">
                  🚴 {order.riderName || 'Rider'}
                </span>
              </div>
            )}

            {/* Empty Spacer */}
            <div />

            {/* General Fallback Key Notification Box */}
            {!hasValidKey && (
              <div className="absolute bottom-4 left-4 right-4 bg-emerald-800/10 backdrop-blur-md border border-emerald-800/20 rounded-xl p-3 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-emerald-800">
                  <span className="text-sm">🔑</span>
                  <p className="text-[10px] font-bold leading-tight">
                    Want to see Satellite & Street views? Connect your Google Maps API Key.
                  </p>
                </div>
                <button 
                  onClick={() => setShowKeyInstructions(true)}
                  className="px-2.5 py-1 bg-emerald-800 text-white text-[9px] font-extrabold rounded-lg hover:bg-emerald-900 transition-colors cursor-pointer"
                >
                  Configure
                </button>
              </div>
            )}

          </div>
          
        ) : (
          
          /* REAL GOOGLE MAPS INTEGRATION */
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
            <Map
              defaultCenter={defaultCenter}
              defaultZoom={14}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
              className="w-full h-full"
            >
              {/* Customer Residence Marker */}
              <AdvancedMarker position={customerCoords} title="Your Delivery Address">
                <Pin background="#10B981" glyphColor="#fff" />
              </AdvancedMarker>

              {/* Restaurant Kitchen Marker */}
              <AdvancedMarker position={{ lat: activeRest.lat, lng: activeRest.lng }} title={activeRest.name}>
                <Pin background="#FF6B35" glyphColor="#fff" />
              </AdvancedMarker>

              {/* Dynamic Rider Marker with Live Position coordinates */}
              {order && (
                <AdvancedMarker 
                  position={{ lat: riderCoords.lat, lng: riderCoords.lng }} 
                  title={order.riderName || 'Rider'}
                >
                  <Pin background="#f59e0b" glyphColor="#fff" scale={1.15}>
                    🚴
                  </Pin>
                </AdvancedMarker>
              )}

              {/* Map Pan Controller to smooth follow coordinate changes */}
              <MapPanController center={riderCoords} autoCenter={autoCenter} />

              {/* Compute and Render Route Path */}
              {order && (
                <RouteDisplay 
                  origin={{ lat: activeRest.lat, lng: activeRest.lng }} 
                  destination={customerCoords} 
                />
              )}

            </Map>
          </APIProvider>
        )}

      </div>

      {/* 2. RIGHT COLUMN: RIDER GPS TELEMETRY & LIVE TRACKER HUD PANEL */}
      <div className="w-full md:w-[340px] bg-gray-50 flex flex-col p-5 justify-between border-t md:border-t-0 border-gray-200 select-none">
        
        {/* Top Section: Active Status and Signal Indicator */}
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-200/60">
            <div>
              <h4 className="text-xs font-black text-gray-800 tracking-tight uppercase">Order Tracker</h4>
              <p className="text-[10px] text-gray-400 mt-0.5 font-bold">LIVE GPS SAT-LINK</p>
            </div>
            
            {order?.status === 'Rider En Route' ? (
              <span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] text-emerald-600 font-extrabold tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                ACTIVE TRACKING
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-gray-200/60 px-2.5 py-1 rounded-full text-[10px] text-gray-500 font-extrabold tracking-wider">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                AWAITING EN-ROUTE
              </span>
            )}
          </div>

          {/* Rider profile card */}
          {order && (
            <div className="bg-white border border-gray-200/60 p-3 rounded-xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="text-[11px] font-black text-gray-800 leading-none">{order.riderName || 'Assigned Rider'}</h5>
                  <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">Dispatch Team</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 font-bold block">{order.riderPhone || '+234 811 200 0000'}</span>
              </div>
            </div>
          )}

          {/* Core GPS Coordinates HUD box (High Fidelity dark design) */}
          <div className="bg-gray-900 text-gray-200 rounded-2xl p-4 space-y-3 shadow-md font-mono border border-gray-800">
            <div className="flex justify-between items-center border-b border-gray-800 pb-2 text-[10px] text-gray-500 font-bold">
              <span>GPS TRANSMITTER</span>
              <span className="flex items-center gap-1.5 text-emerald-500">
                <Wifi className="w-3.5 h-3.5 animate-pulse" />
                SIGNAL EXCELLENT
              </span>
            </div>

            <div className="space-y-2 text-xs leading-none">
              <div className="flex justify-between">
                <span className="text-gray-500">LATITUDE</span>
                <span className="text-gray-100 font-bold tracking-wider">
                  {riderCoords ? `${riderCoords.lat.toFixed(6)}° N` : '6.428000° N'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">LONGITUDE</span>
                <span className="text-gray-100 font-bold tracking-wider">
                  {riderCoords ? `${riderCoords.lng.toFixed(6)}° E` : '3.435000° E'}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-800/80 pt-2 text-[10px]">
                <span className="text-gray-500">ACCURACY</span>
                <span className="text-emerald-400 font-bold">±2.4 Meters</span>
              </div>
            </div>
          </div>

          {/* Speedometer, Distance, and ETA HUD Grid */}
          <div className="grid grid-cols-3 gap-2 text-center select-none">
            
            <div className="bg-white border border-gray-200 p-2.5 rounded-xl shadow-xs">
              <Gauge className="w-4 h-4 text-[#FF6B35] mx-auto mb-1" />
              <span className="text-[9px] font-bold text-gray-400 block uppercase">Velocity</span>
              <span className="text-xs font-black text-gray-800 mt-1 block">
                {order?.status === 'Rider En Route' ? currentSpeedDisplay : 'Stopped'}
              </span>
            </div>

            <div className="bg-white border border-gray-200 p-2.5 rounded-xl shadow-xs">
              <MapPin className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <span className="text-[9px] font-bold text-gray-400 block uppercase">Distance</span>
              <span className="text-xs font-black text-gray-800 mt-1 block">
                {order?.status === 'Rider En Route' || order?.status === 'Arriving Soon' || order?.status === 'Delivered' ? `${currentDistanceKm} km` : '2.80 km'}
              </span>
            </div>

            <div className="bg-white border border-gray-200 p-2.5 rounded-xl shadow-xs">
              <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <span className="text-[9px] font-bold text-gray-400 block uppercase">Est. ETA</span>
              <span className="text-xs font-black text-[#FF6B35] mt-1 block">
                {order?.status === 'Rider En Route' ? formatETA(currentEtaSeconds) : order?.status === 'Arriving Soon' ? '1m 20s' : order?.status === 'Delivered' ? 'Arrived' : '8m 00s'}
              </span>
            </div>

          </div>

          {/* Interactive Live Cruise controls */}
          {order?.status === 'Rider En Route' && (
            <div className="bg-white border border-gray-200 p-3 rounded-xl space-y-2.5 shadow-xs">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-extrabold text-gray-600 uppercase">Interactive Rider Simulator</span>
                <span className="text-[#FF6B35] font-black tracking-wider text-[9px] uppercase">Lekki Transit Hub</span>
              </div>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className={`flex-1 py-1.5 px-2.5 rounded-lg text-[10px] font-extrabold transition-colors flex items-center justify-center gap-1 shadow-xs cursor-pointer ${
                    isPaused
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                  <span>{isPaused ? 'Resume Cruising' : 'Pause Rider'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProgress(0.15);
                    setIsPaused(false);
                  }}
                  className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-extrabold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                  title="Restart Cruise"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Restart</span>
                </button>
              </div>

              {/* Cruise speed multipliers */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[10px]">
                <span className="text-gray-400 font-bold">Cruising Multiplier</span>
                <div className="flex gap-1">
                  {[1, 2, 4].map((mult) => (
                    <button
                      key={mult}
                      onClick={() => setSpeedMultiplier(mult)}
                      className={`px-2 py-0.5 rounded text-[9px] font-black transition-all cursor-pointer ${
                        speedMultiplier === mult
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {mult}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 text-[10px] text-gray-400">
                <span className="font-bold">Auto-Center Map on Rider</span>
                <input
                  type="checkbox"
                  checked={autoCenter}
                  onChange={(e) => setAutoCenter(e.target.checked)}
                  className="rounded text-[#FF6B35] focus:ring-[#FF6B35] cursor-pointer"
                />
              </div>

            </div>
          )}

        </div>

        {/* Bottom Section: Helpful details / info indicator */}
        <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-start gap-1.5 text-[9px] text-gray-400">
          <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
          <p className="leading-tight font-bold">
            Simulated high-precision GPS coordinate polling operates in the background continuously while the dispatch rider is on the road.
          </p>
        </div>

      </div>

      {/* 3. ABSOLUTE MODAL: Google Maps Secrets Setup Instructions Modal */}
      {showKeyInstructions && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xl text-gray-700">
            
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-2">
                <span className="text-lg">🗺️</span>
                <div>
                  <h4 className="text-sm font-black text-gray-800">Google Maps Integration Setup</h4>
                  <p className="text-[10px] text-gray-400">Unlock fully interactive, live satellite and street tracking maps</p>
                </div>
              </div>
              <button 
                onClick={() => setShowKeyInstructions(false)} 
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              
              <div className="space-y-2 border border-orange-100 bg-orange-50/50 p-3 rounded-xl">
                <p className="text-[10px] font-black text-orange-800 uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  API Secret Required
                </p>
                <p className="text-[10px] text-orange-700 leading-relaxed font-bold">
                  A Google Maps Platform API key is required to render real-world maps. However, your app will run beautifully on the custom high-fidelity Radar Grid fallback anytime!
                </p>
              </div>

              <div className="space-y-3 text-[11px] leading-relaxed text-gray-600">
                <p className="font-bold text-gray-800">To add your API key:</p>
                <ol className="list-decimal pl-4 space-y-2 font-semibold">
                  <li>
                    Get an API key from the Google Cloud Console:
                    <a 
                      href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-emerald-700 hover:underline block font-extrabold mt-0.5"
                    >
                      https://console.cloud.google.com/google/maps-apis/start
                    </a>
                  </li>
                  <li>
                    Open <strong>Settings</strong> (⚙️ gear icon, top-right corner of AI Studio workspace).
                  </li>
                  <li>
                    Go to <strong>Secrets</strong> menu.
                  </li>
                  <li>
                    Add a new secret named <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-800 text-[10px]">GOOGLE_MAPS_PLATFORM_KEY</code>.
                  </li>
                  <li>
                    Paste your Google Maps API Key in the value box and press <strong>Enter</strong>.
                  </li>
                </ol>
                <p className="text-[10px] text-gray-400 italic">
                  Once saved, the app compiles automatically to activate real Google Maps overlays instantly. No manual page refresh needed!
                </p>
              </div>

              <button
                onClick={() => setShowKeyInstructions(false)}
                className="w-full py-2 bg-emerald-800 text-white font-extrabold rounded-xl hover:bg-emerald-900 transition-colors cursor-pointer text-center"
              >
                Close & Continue with Radar Grid
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
