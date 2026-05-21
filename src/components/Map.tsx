import { useState, useMemo, useEffect, useRef } from "react";
import { Station, ChargerSlot } from "../types";
import { Search, SlidersHorizontal, MapPin, Zap, Star, ShieldCheck, Navigation, Info, Compass, HelpCircle, AlertTriangle } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Helper range mapper to project percentage integers (0-100) onto realistic Mumbai GPS bounds
const mapPercentToReal = (latPercent: number, lngPercent: number) => {
  // Mumbai central bounds: Lat ~18.90 to 19.18, Lng ~72.81 to 72.98
  const realLat = 18.90 + (latPercent / 100) * 0.28;
  const realLng = 72.81 + (lngPercent / 100) * 0.17;
  return { lat: realLat, lng: realLng };
};

interface MapProps {
  stations: Station[];
  selectedStationId: string | null;
  onSelectStation: (stationId: string) => void;
  onBookStation: (station: Station) => void;
  userPos: { x: number; y: number }; // User location on radar grid (0-100)
  emergencyMode?: boolean;
  onToggleEmergencyMode?: (val: boolean) => void;
}

export default function Map({ 
  stations, 
  selectedStationId, 
  onSelectStation, 
  onBookStation, 
  userPos,
  emergencyMode = false,
  onToggleEmergencyMode
}: MapProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<string>("All");
  const [maxPrice, setMaxPrice] = useState<number>(20);
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [fastChargersOnly, setFastChargersOnly] = useState<boolean>(false);

  // Local physical GPS location override if user chooses Geolocation
  const [localUserCoords, setLocalUserCoords] = useState<[number, number] | null>(null);

  // References for Leaflet map elements
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Filtered stations list
  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      // Emergency mode filter override
      if (emergencyMode) {
        const isOnline = station.status === "Online";
        const hasFastAvailable = station.slots.some(
          s => s.status === "Online" && !s.isOccupied && (s.isFastCharger || s.powerOutput >= 100)
        );
        return isOnline && hasFastAvailable;
      }

      // 1. Search Query
      if (searchQuery && !station.name.toLowerCase().includes(searchQuery.toLowerCase()) && !station.address.toLowerCase().includes(searchQuery.toLowerCase())) {
        const matchPopularAreas = ["bandra", "colaba", "andheri", "powai", "thane", "chembur"].some(
          area => searchQuery.toLowerCase().includes(area)
        );
        if (!matchPopularAreas) return false;
      }
      // 2. Connector compatibility
      if (selectedConnector !== "All") {
        const hasConnector = station.slots.some(s => s.connectorType === selectedConnector);
        if (!hasConnector) return false;
      }
      // 3. Max Price filter
      if (station.basePricePerKwh > maxPrice) {
        return false;
      }
      // 4. Max Distance
      if (station.distance > maxDistance) {
        return false;
      }
      // 5. Fast Charger check
      if (fastChargersOnly) {
        const hasFast = station.slots.some(s => s.isFastCharger || s.powerOutput >= 100);
        if (!hasFast) return false;
      }
      return true;
    });
  }, [stations, searchQuery, selectedConnector, maxPrice, maxDistance, fastChargersOnly, emergencyMode]);

  const selectedStation = stations.find(s => s.id === selectedStationId);

  // Map station status to custom visual category (Green, Yellow, Red)
  const getStationLoadCategory = (station: Station) => {
    if (station.status !== "Online") return "Maintenance";
    const slots = station.slots;
    const occupiedCount = slots.filter(s => s.isOccupied).length;
    if (occupiedCount === slots.length) return "Full";
    if (occupiedCount >= slots.length / 2) return "Busy";
    return "Available";
  };

  // 1. INITIALIZE LEAFLET MAP INSTANCE
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center Map initially on Central Mumbai
    const initialCoords = mapPercentToReal(userPos.y, userPos.x); // convert percentage of user
    const map = L.map(mapContainerRef.current, {
      center: [initialCoords.lat, initialCoords.lng],
      zoom: 12,
      zoomControl: true,
      attributionControl: true
    });

    // Load OpenStreetMap Tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://openstreetmap.org">OSM</a>'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Trigger resize on load to verify rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. POPULAR PLACE SNAPPING EFFECT - SEARCHING LOCATION DIRECTLY
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !searchQuery) return;

    const queryLower = searchQuery.toLowerCase().trim();
    const areaCoords: { [key: string]: [number, number] } = {
      bandra: [19.0596, 72.8295],
      colaba: [18.9220, 72.8347],
      andheri: [19.1136, 72.8697],
      powai: [19.1176, 72.9060],
      thane: [19.2183, 72.9781],
      chembur: [19.0617, 72.8960]
    };

    const matchedKey = Object.keys(areaCoords).find(key => queryLower.includes(key));
    if (matchedKey) {
      const coords = areaCoords[matchedKey];
      map.setView(coords, 14, { animate: true });
    }
  }, [searchQuery]);

  // 3. SYNCHRONIZE MARKERS AND PINS
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // A) Clear previous station markers
    Object.keys(markersRef.current).forEach((key) => {
      markersRef.current[key]?.remove();
    });
    markersRef.current = {};

    // B) Clear previous user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    // C) Determine User marker placement (either mock percent coords or real physical geolocated coords)
    const userRealCoords = localUserCoords 
      ? { lat: localUserCoords[0], lng: localUserCoords[1] }
      : mapPercentToReal(userPos.y, userPos.x);

    // Create customized User marker
    const userMarkerIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-5 h-5 rounded-full bg-cyan-450 border-2 border-white shadow-lg flex items-center justify-center">
            <div class="absolute w-8 h-8 rounded-full bg-cyan-450/40 animate-ping pointer-events-none"></div>
          </div>
        </div>
      `,
      className: "user-location-marker-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    userMarkerRef.current = L.marker([userRealCoords.lat, userRealCoords.lng], {
      icon: userMarkerIcon
    }).addTo(map);
    userMarkerRef.current.bindPopup(`<b class="text-xs font-mono font-bold text-gray-100">🔌 MY VEHICLE COORD</b>`);

    // D) Add Station Markers
    filteredStations.forEach((st) => {
      const isSelected = selectedStationId === st.id;
      const loadCategory = getStationLoadCategory(st);

      // Map color style matching
      let pinColor = "bg-emerald-500 shadow-emerald-500/60";
      if (st.status === "Maintenance") {
        pinColor = "bg-gray-500 shadow-gray-500/60";
      } else if (loadCategory === "Full") {
        pinColor = "bg-rose-500 shadow-rose-500/60";
      } else if (loadCategory === "Busy") {
        pinColor = "bg-amber-500 shadow-amber-500/60";
      }

      const stCoords = mapPercentToReal(st.latitude, st.longitude);

      const stationIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <div class="w-4.5 h-4.5 rounded-full ${pinColor} border-2 border-[#0B1220] flex items-center justify-center hover:scale-125 transition-transform shadow-md">
              ${isSelected ? '<div class="absolute inset-[-4px] rounded-full border-2 border-[#00E676] animate-pulse"></div>' : ""}
              <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        `,
        className: `station-marker-icon-${st.id}`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const m = L.marker([stCoords.lat, stCoords.lng], {
        icon: stationIcon
      }).addTo(map);

      // Open a tooltip on mouseover for nice UX hover metadata
      m.bindTooltip(`<span class="text-[10px] font-mono font-bold text-gray-100">${st.name} (${st.distance}km)</span>`, {
        direction: "top",
        opacity: 0.9,
        className: "bg-[#0b1220] border-white/5 opacity-90 rounded p-1"
      });

      m.on("click", () => {
        onSelectStation(st.id);
      });

      markersRef.current[st.id] = m;
    });

    // E) Smooth-pan to selected station if active
    if (selectedStationId) {
      const targetSt = stations.find(s => s.id === selectedStationId);
      if (targetSt) {
        const targetCoords = mapPercentToReal(targetSt.latitude, targetSt.longitude);
        map.setView([targetCoords.lat, targetCoords.lng], 14, { animate: true });
      }
    }
  }, [filteredStations, selectedStationId, userPos, stations, localUserCoords]);

  // 4. ACTION FOR LIVE GPS device detection api - ASKING FOR PERMISSIONS
  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Set local geolocated coordinate
          setLocalUserCoords([latitude, longitude]);
          
          const map = mapInstanceRef.current;
          if (map) {
            map.setView([latitude, longitude], 14, { animate: true });
          }

          // Generate alert or helpful popup
          alert(`🎯 Real-Time Geolocation Secured!\n\nLatitude: ${latitude.toFixed(5)}°N\nLongitude: ${longitude.toFixed(5)}°E\n\nYour actual location is now marked with the Cyan GPS glow. Nearby stations inside your active metro segment have been populated.`);
        },
        (error) => {
          console.error("GPS error or block:", error);
          alert("⚠️ Browser Geolocation rejected or failed. Please check frame permissions or HTTPS configuration.");
        }
      );
    } else {
      alert("⚠️ Your browser does not support physical device Geolocation APIs.");
    }
  };

  return (
    <div id="interactive-map-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-1 md:p-6 bg-transparent text-gray-100 font-sans">
      
      {/* Sidebar - Search and matching station list */}
      <div className="lg:col-span-4 space-y-4">
        
        {/* Search Bar Module */}
        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3 shadow-md backdrop-blur-md">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-cyan-450" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search station (e.g. BlueVolt) or area (e.g. Bandra)..."
              className="w-full bg-white/5 border border-white/10 text-xs py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:border-[#00E676]/60 transition-colors font-mono text-white"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-1 text-xs text-[#64FFDA] hover:text-white transition-opacity font-mono cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#00E676]" />
              <span>{showFilters ? "Collapse Filters" : "Advanced Filters"}</span>
            </button>
            <span className="text-[10px] font-mono text-gray-400">
              {filteredStations.length} of {stations.length} matched
            </span>
          </div>

          {/* Collapsible advanced filters */}
          {showFilters && (
            <div className="pt-3 border-t border-white/5 space-y-4 text-xs">
              
              {/* Connector selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono text-gray-400">Connector Plug Type</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["All", "CCS", "Type 2", "Supercharger"].map((conn) => (
                    <button
                      key={conn}
                      onClick={() => setSelectedConnector(conn)}
                      className={`py-1.5 rounded-lg border text-[10px] font-mono tracking-xs font-semibold cursor-pointer ${selectedConnector === conn ? "bg-[#00E676]/10 text-[#00E676] border-[#00E676]" : "bg-white/5 text-gray-400 border-white/5 hover:text-white"}`}
                    >
                      {conn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-gray-400">MAX TARF TYPE RATE</span>
                  <span className="text-[#00E676] font-bold">₹{maxPrice}/kWh</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={25}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  className="w-full accent-[#00E676] bg-slate-950 h-1 rounded"
                />
              </div>

              {/* Distance Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-gray-400">MAX PRESET DISTANCE</span>
                  <span className="text-[#64FFDA] font-bold">{maxDistance} km</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={15}
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                  className="w-full accent-[#64FFDA] bg-slate-950 h-1 rounded"
                />
              </div>

              {/* Fast charging toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-mono text-gray-400">FAST CHARGERS ONLY (&gt;100kW DC)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fastChargersOnly}
                    onChange={(e) => setFastChargersOnly(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-450 after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#00E676] peer-checked:after:bg-[#0b1220]"></div>
                </label>
              </div>

            </div>
          )}
        </div>

        {/* Emergency Charge Active Banner Warning */}
        {emergencyMode && (
          <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-2xl flex flex-col space-y-2 text-xs shadow-md">
            <div className="flex items-center space-x-1.5 text-rose-400 font-bold font-mono text-[11px]">
              <AlertTriangle className="w-4 h-4 animate-pulse shrink-0" />
              <span>EMERGENCY ROUTING ACTIVE</span>
            </div>
            <p className="text-[10.5px] text-gray-300 leading-normal font-sans">
              Filtered strictly for ultra-fast DC stations with immediately available plugs. Other manual filters are bypassed.
            </p>
            {onToggleEmergencyMode && (
              <button
                onClick={() => onToggleEmergencyMode(false)}
                className="w-full bg-rose-950/40 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 hover:text-white font-mono font-bold py-1.5 rounded-xl text-[10px] transition-all cursor-pointer"
              >
                Deactivate Emergency Mode
              </button>
            )}
          </div>
        )}

        {/* Stations side scrollable list */}
        <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
          {filteredStations.map((station) => {
            const loadCat = getStationLoadCategory(station);
            const isSel = selectedStationId === station.id;
            return (
              <div
                key={station.id}
                onClick={() => onSelectStation(station.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${isSel ? "bg-white/10 border-[#00E676]/45 shadow-md shadow-[#00E676]/5" : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/[0.08]"}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {/* Status badges */}
                    {loadCat === "Available" && (
                      <span className="text-[9px] font-mono font-semibold bg-emerald-950/85 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/30">
                        🟢 AVAILABLE ({station.slots.filter(s => !s.isOccupied).length} Plugs)
                      </span>
                    )}
                    {loadCat === "Busy" && (
                      <span className="text-[9px] font-mono font-semibold bg-amber-950/85 text-amber-400 px-2 py-0.5 rounded border border-amber-900/30">
                        🟡 BUSY (1 Plug Free)
                      </span>
                    )}
                    {loadCat === "Full" && (
                      <span className="text-[9px] font-mono font-semibold bg-rose-950/85 text-rose-400 px-2 py-0.5 rounded border border-rose-900/30">
                        🔴 FULL (Queue Active)
                      </span>
                    )}
                    {loadCat === "Maintenance" && (
                      <span className="text-[9px] font-mono font-semibold bg-slate-900 text-gray-400 px-2 py-0.5 rounded border border-slate-800">
                        🛠️ MAINTENANCE (Offline)
                      </span>
                    )}

                    <span className="text-[10px] font-mono text-gray-400">{station.distance} km</span>
                  </div>

                  <h3 className="text-sm font-bold text-white font-mono">{station.name}</h3>
                  <p className="text-[11px] text-gray-400 mt-1 truncate">{station.address}</p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-400">₹{station.basePricePerKwh} / kWh</span>
                  <div className="flex items-center space-x-1.5">
                    {station.batterySwapAvailable && (
                      <span className="text-[8px] bg-cyan-950/60 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-900/30 font-bold mr-1">
                        🔄 SWAP BAY
                      </span>
                    )}
                    <span className="text-xs text-[#64FFDA] font-semibold">
                      {station.slots.filter(s => s.isFastCharger).length > 0 ? "⚡ DC Fast" : "🔌 AC Standard"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredStations.length === 0 && (
            <div className="p-8 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl text-gray-400 text-xs">
              No matching stations found. Adjust search boundaries or reset filters.
            </div>
          )}
        </div>
      </div>

      {/* Real Map Integration Container (Leaflet + OpenStreetMap) */}
      <div className="lg:col-span-8 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-md overflow-hidden relative min-h-[460px] flex flex-col justify-between shadow-xl">
        
        {/* Actual Leaflet Map Object mount target */}
        <div className="absolute inset-0 z-0">
          <div 
            ref={mapContainerRef} 
            className="w-full h-full rounded-2xl leaflet-dark-mode"
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {/* Floating top map controls overlay */}
        <div className="p-4 z-10 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <div className="flex items-center space-x-2 bg-black/75 backdrop-blur-md border border-white/15 py-1.5 px-3 rounded-xl pointer-events-auto shadow-lg">
            <Compass className="w-4 h-4 text-[#00E676] animate-spin-slow" />
            <span className="text-[10px] font-mono tracking-widest text-[#00E676] uppercase">MUMBAI HIGHWAY REAL-GRID</span>
          </div>

          <div className="flex items-center space-x-2 pointer-events-auto">
            {/* Direct Instant Geolocator asking button */}
            <button
              onClick={handleLocateMe}
              className="flex items-center space-x-1.5 bg-[#00E676] text-[#0B1220] hover:bg-[#64FFDA] px-3.5 py-1.5 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5 text-current transform rotate-45 shrink-0" />
              <span>🎯 ASK DEVICE GPS</span>
            </button>

            <div className="text-[10px] font-mono text-gray-400 bg-black/75 backdrop-blur-md border border-white/15 py-1.5 px-3 rounded-xl shadow-lg">
              GPS REF: <span className="text-[#64FFDA]">{localUserCoords ? "LIVE GPS" : "SIMULATED"}</span>
            </div>
          </div>
        </div>

        {/* Legend overlays */}
        <div className="absolute left-4 bottom-4 z-10 bg-black/75 border border-white/10 p-2 rounded-xl text-[9px] font-mono space-y-1.5 pointer-events-auto shadow-lg">
          <div className="text-gray-400 font-bold uppercase tracking-wider mb-0.5 border-b border-white/5 pb-0.5">Grid Status</div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>
            <span className="text-gray-300">Available</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 block"></span>
            <span className="text-gray-300">High Demand</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 block"></span>
            <span className="text-gray-300">Fully Booked</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-500 block"></span>
            <span className="text-gray-300">Offline</span>
          </div>
        </div>

        {/* Selected Station Bottom Action Drawer Card Overlay */}
        {selectedStation ? (
          <div className="m-4 z-10 p-5 bg-[#0e1726]/90 backdrop-blur-md border border-[#00E676]/20 rounded-2xl shadow-2xl relative block animate-fade-in shadow-[#00E676]/10 pointer-events-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <h4 className="text-base font-bold text-white font-mono">{selectedStation.name}</h4>
                  <span className="text-[10px] font-mono text-gray-300 flex items-center space-x-0.5">
                    <Star className="w-3 h-3 text-amber-450 fill-amber-455" />
                    <span>{selectedStation.rating}</span>
                  </span>
                </div>
                <p className="text-xs text-gray-400 flex items-center">
                  <MapPin className="w-3.5 h-3.5 text-[#64FFDA] mr-1" />
                  <span>{selectedStation.address}</span>
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedStation.amenities.map(a => (
                    <span key={a} className="bg-white/5 border border-white/5 text-[9.5px] font-mono px-2 py-0.5 rounded text-gray-400">
                      {a}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action columns */}
              <div className="flex sm:flex-col items-end gap-2 justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-mono text-gray-400 block uppercase">Estimated Journey</span>
                  <span className="text-sm font-bold text-[#64FFDA] font-mono block mt-0.5">
                    {Math.round(selectedStation.distance * 3 + 2)} mins ({selectedStation.distance} km away)
                  </span>
                </div>

                <div className="flex items-center space-x-3 mt-1.5">
                  {selectedStation.status === "Maintenance" ? (
                    <button 
                      disabled
                      className="px-6 py-2.5 rounded-xl text-xs font-bold text-gray-500 bg-white/5 border border-white/5 select-none cursor-not-allowed"
                    >
                      Bays Offline
                    </button>
                  ) : (
                    <button
                      onClick={() => onBookStation(selectedStation)}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold text-[#0B1220] bg-gradient-to-r from-[#00E676] to-[#64FFDA] hover:opacity-95 shadow-md shadow-[#00E676]/10 transition-opacity cursor-pointer flex items-center space-x-1"
                    >
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                      <span>Book Charger Now</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="m-4 z-10 p-5 bg-black/60 border border-dashed border-white/10 rounded-2xl text-center text-xs text-gray-400 pointer-events-auto">
            💡 Select any colored station pin directly on our interactive street map to compute distance routes, navigate, and access live booking slot configurations.
          </div>
        )}

      </div>
    </div>
  );
}
