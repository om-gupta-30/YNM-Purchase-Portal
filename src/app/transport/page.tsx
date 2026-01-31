'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/layout/Header';

// World currencies with symbols
const currencies = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
];

// Coordinate type
interface Coordinates {
  lat: number;
  lng: number;
}

// Haversine formula to calculate distance between two coordinates (fallback)
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Geocode location using OpenStreetMap Nominatim (free, no API key needed)
async function geocodeLocation(query: string): Promise<{ lat: number; lng: number; displayName: string }> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
    {
      headers: {
        'User-Agent': 'YNM-Transport-Calculator/1.0',
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`Geocoding failed for: ${query}`);
  }
  
  const data = await response.json();
  
  if (!data || data.length === 0) {
    throw new Error(`Location not found: "${query}"`);
  }
  
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name.split(',').slice(0, 2).join(','),
  };
}

// Get route using OSRM (free, no API key needed)
async function getRoute(from: Coordinates, to: Coordinates): Promise<{
  distance: number;
  duration: string;
  geometry: [number, number][];
}> {
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
  );
  
  if (!response.ok) {
    throw new Error('Could not calculate route');
  }
  
  const data = await response.json();
  
  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error('No route found between these locations');
  }
  
  const route = data.routes[0];
  const distanceKm = Math.round(route.distance / 1000);
  const durationSeconds = route.duration;
  
  // Format duration
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const durationStr = hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
  
  return {
    distance: distanceKm,
    duration: durationStr,
    geometry: route.geometry.coordinates,
  };
}

export default function TransportPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [distance, setDistance] = useState<number | null>(null);
  const [transportCost, setTransportCost] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState('');
  const [distanceType, setDistanceType] = useState<'air' | 'road'>('road');
  const [fromDisplayName, setFromDisplayName] = useState('');
  const [toDisplayName, setToDisplayName] = useState('');
  const [duration, setDuration] = useState<string | null>(null);
  
  // Map state
  const mapRef = useRef<HTMLDivElement>(null);
  const [fromCoords, setFromCoords] = useState<Coordinates | null>(null);
  const [toCoords, setToCoords] = useState<Coordinates | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeLayerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  
  // Custom rate state
  const [ratePerKm, setRatePerKm] = useState<string>('10');
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]); // Default INR

  // Leaflet module reference
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);

  // Track if component is mounted
  const isMountedRef = useRef(false);

  // Initialize Leaflet map
  const initializeMap = useCallback(async () => {
    // Don't initialize if already initialized or container doesn't exist
    if (!mapRef.current || leafletMapRef.current) return;
    
    // Check if container already has a map (React Strict Mode double mount)
    const container = mapRef.current as HTMLElement & { _leaflet_id?: number };
    if (container._leaflet_id) {
      return;
    }
    
    // Dynamically import Leaflet
    const L = await import('leaflet');
    leafletRef.current = L;
    
    // Double check after async import
    if (!mapRef.current || leafletMapRef.current) return;
    
    // Create map centered on India
    const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    
    leafletMapRef.current = map;
    setMapLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Initialize map on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        initializeMap();
      }
    }, 100);
    
    return () => {
      isMountedRef.current = false;
      clearTimeout(timer);
      
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch {
          // Ignore errors during cleanup
        }
        leafletMapRef.current = null;
      }
    };
  }, [initializeMap]);

  // Update map when route changes
  useEffect(() => {
    const L = leafletRef.current;
    const map = leafletMapRef.current;
    if (!L || !map) return;

    // Clear existing markers and route
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    // Add markers for from and to locations
    if (fromCoords) {
      const fromIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background: #22c55e; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const marker = L.marker([fromCoords.lat, fromCoords.lng], { icon: fromIcon }).addTo(map);
      markersRef.current.push(marker);
    }

    if (toCoords) {
      const toIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const marker = L.marker([toCoords.lat, toCoords.lng], { icon: toIcon }).addTo(map);
      markersRef.current.push(marker);
    }

    // Draw route if available
    if (routeGeometry && routeGeometry.length > 0) {
      const latLngs = routeGeometry.map(coord => [coord[1], coord[0]] as [number, number]);
      routeLayerRef.current = L.polyline(latLngs, {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
      }).addTo(map);
      map.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });
    } else if (fromCoords && toCoords) {
      // Fit to markers if no route
      const bounds = L.latLngBounds([
        [fromCoords.lat, fromCoords.lng],
        [toCoords.lat, toCoords.lng],
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [fromCoords, toCoords, routeGeometry]);

  // Auto-hide errors
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Recalculate cost when rate or currency changes (if distance exists)
  // This is intentional - we want to update cost when user changes the rate
  useEffect(() => {
    if (distance !== null && ratePerKm) {
      const rate = parseFloat(ratePerKm) || 0;
      setTransportCost(distance * rate);
    }
  }, [ratePerKm, distance]);

  const calculateDistance = async () => {
    if (!fromLocation.trim() || !toLocation.trim()) {
      setError('Please enter both locations');
      return;
    }

    if (fromLocation.toLowerCase() === toLocation.toLowerCase()) {
      setError('From and To locations cannot be the same');
      return;
    }

    const rate = parseFloat(ratePerKm);
    if (!rate || rate <= 0) {
      setError('Please enter a valid rate per km');
      return;
    }

    setError('');
    setIsCalculating(true);
    setDistance(null);
    setTransportCost(null);
    setRouteGeometry(null);
    setDuration(null);

    try {
      // Geocode both locations using OpenStreetMap Nominatim
      const [fromResult, toResult] = await Promise.all([
        geocodeLocation(fromLocation),
        geocodeLocation(toLocation),
      ]);

      const fromLatLng = { lat: fromResult.lat, lng: fromResult.lng };
      const toLatLng = { lat: toResult.lat, lng: toResult.lng };

      setFromCoords(fromLatLng);
      setToCoords(toLatLng);
      setFromDisplayName(fromResult.displayName);
      setToDisplayName(toResult.displayName);

      // Try to get road route using OSRM
      try {
        const routeResult = await getRoute(fromLatLng, toLatLng);
        
        setDistance(routeResult.distance);
        setTransportCost(routeResult.distance * rate);
        setDistanceType('road');
        setDuration(routeResult.duration);
        setRouteGeometry(routeResult.geometry);
      } catch {
        // Fallback to air distance if no road route available
        const airDistance = calculateHaversineDistance(
          fromLatLng.lat, fromLatLng.lng,
          toLatLng.lat, toLatLng.lng
        );
        setDistance(airDistance);
        setTransportCost(airDistance * rate);
        setDistanceType('air');
        setError('No road route available. Showing air distance instead.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error calculating distance. Please try again.');
    }

    setIsCalculating(false);
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/${encodeURIComponent(
      fromLocation
    )}/${encodeURIComponent(toLocation)}`;
    window.open(url, '_blank');
  };

  const swapLocations = () => {
    setFromLocation(toLocation);
    setToLocation(fromLocation);
    setDistance(null);
    setTransportCost(null);
    setFromDisplayName('');
    setToDisplayName('');
    setRouteGeometry(null);
  };

  const clearForm = () => {
    setFromLocation('');
    setToLocation('');
    setDistance(null);
    setTransportCost(null);
    setError('');
    setFromDisplayName('');
    setToDisplayName('');
    setRouteGeometry(null);
    setFromCoords(null);
    setToCoords(null);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const currency = currencies.find(c => c.code === e.target.value);
    if (currency) {
      setSelectedCurrency(currency);
    }
  };

  const formatCost = (cost: number) => {
    return cost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner-lg"></div>
          <p className="text-cream/80 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-card max-w-5xl mx-auto p-5 md:p-8 animate-fadeIn">
      <Header title="Transport Calculator" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Input Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-dark">Global Distance Calculator</h2>
              <p className="text-text-muted text-sm">Calculate distance between any two places worldwide</p>
            </div>
          </div>

          {/* World Badge */}
          <div className="flex items-center gap-2 mb-6 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-blue-700 text-sm font-medium">Works for any location worldwide - cities, countries, addresses</span>
          </div>

          {/* Location Inputs with Visual Connection */}
          <div className="relative mb-6">
            {/* From Location */}
            <div className="relative flex items-start gap-4 mb-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="w-0.5 h-16 bg-gradient-to-b from-green-400 via-gray-300 to-red-400 mt-2"></div>
              </div>
              <div className="flex-1 pt-1">
                <label className="block text-text-dark font-semibold mb-2 text-sm">Origin</label>
                <input
                  type="text"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  placeholder="e.g., Mumbai, India or New York, USA"
                  className="input w-full px-4 py-3.5 text-base"
                />
              </div>
            </div>

            {/* Swap Button */}
            <button
              onClick={swapLocations}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-maroon hover:border-maroon hover:bg-maroon/5 transition-all shadow-sm z-10"
              title="Swap locations"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>

            {/* To Location */}
            <div className="relative flex items-start gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                </div>
              </div>
              <div className="flex-1 pt-1">
                <label className="block text-text-dark font-semibold mb-2 text-sm">Destination</label>
                <input
                  type="text"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  placeholder="e.g., London, UK or Tokyo, Japan"
                  className="input w-full px-4 py-3.5 text-base"
                />
              </div>
            </div>
          </div>

          {/* Rate Input Section */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 mb-6 border border-purple-100">
            <label className="block text-text-dark font-semibold mb-3 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Rate Per Kilometer
            </label>
            <div className="flex gap-3">
              {/* Currency Dropdown */}
              <div className="relative">
                <select
                  value={selectedCurrency.code}
                  onChange={handleCurrencyChange}
                  className="input h-full px-3 py-3 pr-8 text-base font-medium appearance-none cursor-pointer bg-white min-w-[110px]"
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code}
                    </option>
                  ))}
                </select>
                <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {/* Rate Input */}
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={ratePerKm}
                  onChange={(e) => setRatePerKm(e.target.value)}
                  placeholder="Enter rate..."
                  min="0"
                  step="0.01"
                  className="input w-full px-4 py-3 text-base pr-16"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">
                  /km
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3 animate-slideUp">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={calculateDistance}
              disabled={isCalculating || !fromLocation.trim() || !toLocation.trim() || !ratePerKm}
              className="btn-primary flex-1 py-4 rounded-xl text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCalculating ? (
                <>
                  <div className="spinner-sm border-text-dark/30 border-t-text-dark"></div>
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Calculate Distance</span>
                </>
              )}
            </button>
            
            {(fromLocation || toLocation) && (
              <button
                onClick={clearForm}
                className="w-14 h-14 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all flex items-center justify-center"
                title="Clear form"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Right Column - Results Section */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          {/* OpenStreetMap via Leaflet - Always show */}
          <div className="mb-6">
            <div
              ref={mapRef}
              style={{
                width: '100%',
                height: '400px',
                borderRadius: '16px',
              }}
              className="z-0"
            />
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl">
                <div className="spinner-lg"></div>
              </div>
            )}
          </div>

          {distance === null ? (
            // Empty State
            <div className="flex flex-col items-center justify-center text-center py-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-text-dark mb-2">Calculate Road Distance</h3>
              <p className="text-text-muted text-sm max-w-xs mb-4">
                Enter two locations to see the actual road distance and route on the map.
              </p>
              <div className="flex flex-wrap gap-2 justify-center text-xs">
                <span className="px-2 py-1 bg-gray-100 rounded-full text-gray-600">Mumbai → Delhi</span>
                <span className="px-2 py-1 bg-gray-100 rounded-full text-gray-600">New York → LA</span>
                <span className="px-2 py-1 bg-gray-100 rounded-full text-gray-600">London → Paris</span>
              </div>
            </div>
          ) : (
            // Results Display
            <div className="animate-slideUp">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-dark">Route Calculated!</h3>
                  <p className="text-text-muted text-xs">
                    {distanceType === 'road' ? 'Showing actual road distance' : 'Showing air distance (no road route)'}
                  </p>
                </div>
              </div>
              
              {/* Route Visual */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-4 border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  {/* From */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-xs text-text-muted font-medium uppercase tracking-wide">From</span>
                    </div>
                    <p className="text-text-dark font-semibold text-xs">{fromDisplayName || fromLocation}</p>
                  </div>
                  
                  {/* Icon based on distance type */}
                  <div className="flex flex-col items-center px-2">
                    <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center">
                      {distanceType === 'road' ? (
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs text-blue-600 font-semibold mt-1">{distance.toLocaleString()} km</span>
                  </div>
                  
                  {/* To */}
                  <div className="flex-1 text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <span className="text-xs text-text-muted font-medium uppercase tracking-wide">To</span>
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    </div>
                    <p className="text-text-dark font-semibold text-xs">{toDisplayName || toLocation}</p>
                  </div>
                </div>

                {/* Distance Type & Duration Badge */}
                <div className="flex items-center justify-center gap-2 pt-3 border-t border-blue-200/50">
                  {distanceType === 'road' ? (
                    <>
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-green-700 font-medium">
                        Road Distance {duration && `• Est. ${duration}`}
                      </span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-amber-700">Air distance - no road route available</span>
                    </>
                  )}
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <span className="text-text-dark font-medium text-sm">Distance</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{distance.toLocaleString()} km</span>
                </div>
                
                {duration && distanceType === 'road' && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-text-dark font-medium text-sm">Travel Time</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">{duration}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <span className="text-text-dark font-medium text-sm">Your Rate</span>
                  </div>
                  <span className="text-base font-semibold text-purple-600">{selectedCurrency.symbol}{ratePerKm}/km</span>
                </div>
              </div>

              {/* Total Cost */}
              <div className="bg-gradient-to-r from-maroon to-maroon-dark rounded-xl p-4 text-center mb-4">
                <p className="text-cream/80 text-xs mb-1">Estimated Total Cost</p>
                <p className="text-3xl font-bold text-cream">
                  {selectedCurrency.symbol}{formatCost(transportCost || 0)}
                </p>
                <p className="text-cream/60 text-xs mt-1">{selectedCurrency.name} ({selectedCurrency.code})</p>
              </div>

              {/* Google Maps Button */}
              <button
                onClick={openInGoogleMaps}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                View Route on Google Maps
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Info */}
      <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200/50">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-green-800 font-semibold">Powered by OpenStreetMap & OSRM</p>
            <p className="text-green-700 text-sm mt-1">
              Distance shown is the actual road distance calculated using OSRM (Open Source Routing Machine). The route displayed on the map shows the recommended driving path. Map data provided by OpenStreetMap contributors.
            </p>
          </div>
        </div>
      </div>

      {/* Leaflet CSS - loaded dynamically */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
    </div>
  );
}
