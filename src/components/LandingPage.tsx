import { useState } from "react";
import { motion } from "motion/react";
import { Zap, MapPin, Shield, Star, Clock, Trophy, ArrowRight, Activity, BatteryCharging, Leaf, Sparkles, AlertTriangle } from "lucide-react";
import { Station } from "../types";

interface LandingPageProps {
  onExplore: () => void;
  onLogin: () => void;
  stations: Station[];
  emergencyMode: boolean;
  onToggleEmergencyMode: (val: boolean) => void;
  role: string;
  onRoleToggle: (role: any) => void;
}

export default function LandingPage({ 
  onExplore, 
  onLogin, 
  stations, 
  emergencyMode, 
  onToggleEmergencyMode,
  role,
  onRoleToggle
}: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<"how" | "stats">("how");

  // Get online stations only for landing quickview
  const activeStations = stations.filter(s => s.status === "Online").slice(0, 3);

  return (
    <div id="landing-container" className="min-h-screen bg-[#0B1220] text-gray-100 overflow-x-hidden font-sans selection:bg-[#00E676] selection:text-[#0B1220]">
      {/* Animated Charging Particles in Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-[#00E676]/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#64FFDA]/15 rounded-full blur-[150px]"></div>
        
        {/* CSS-only flowing particles */}
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-1.5 h-1.5 bg-[#00E676] rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.7 + 0.3,
                animation: `floatUp ${5 + Math.random() * 8}s linear infinite`,
                animationDelay: `${Math.random() * i}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Navigation Headers */}
      <header id="landing-header" className="sticky top-0 z-50 backdrop-blur-md bg-[#0B1220]/50 border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00E676] to-[#64FFDA] p-0.5 flex items-center justify-center shadow-lg shadow-[#00E676]/10">
              <div className="w-full h-full bg-[#0B1220] rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#00E676]" />
              </div>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white font-mono flex items-center">
                Charge<span className="text-[#00E676]">Flow</span>
              </span>
              <span className="text-[9px] text-[#64FFDA] font-mono tracking-widest block uppercase">Smart eV Station</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-gray-300">
            <a href="#nearby" className="hover:text-[#00E676] transition-colors">Stations</a>
            <a href="#how-it-works" className="hover:text-[#00E676] transition-colors">How it Works</a>
            <a href="#features" className="hover:text-[#00E676] transition-colors">Benefits</a>
            <a href="#testimonials" className="hover:text-[#00E676] transition-colors">Community</a>
          </nav>

          <div className="flex items-center space-x-4">
            {/* Quick 1-Click Preset Switcher to eliminate complex authentication requirements */}
            <div className="hidden sm:flex bg-white/5 p-1 rounded-xl border border-white/10 shadow-inner text-xs font-mono shrink-0">
              <button
                id="landing-role-user"
                onClick={() => onRoleToggle("User")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                  role === "User" 
                    ? "bg-[#00E676] text-[#0B1220] shadow" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <span>🚗 Driver Preset</span>
              </button>
              <button
                id="landing-role-admin"
                onClick={() => onRoleToggle("Admin")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                  role !== "User" 
                    ? "bg-[#00E676] text-[#0B1220] shadow" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <span>⚙️ Admin Preset</span>
              </button>
            </div>

            <button 
              id="btn-login"
              onClick={onLogin}
              className="px-4.5 py-2 text-sm font-semibold rounded-lg text-white border border-white/10 hover:border-[#00E676] bg-white/5 hover:bg-[#00E676]/10 transition-all cursor-pointer font-mono"
            >
              Access Platform
            </button>
            <button 
              id="btn-quick-explore"
              onClick={onExplore}
              className="px-5 py-2 text-sm font-bold font-mono rounded-lg text-[#0b1220] glow-btn-green shadow-lg shadow-[#00E676]/20 hover:shadow-[#00E676]/35 transition-all cursor-pointer flex items-center space-x-1"
            >
              <span>Explore Stations</span>
              <ArrowRight className="w-4 h-4 text-emerald-950" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="landing-hero" className="relative pt-12 pb-20 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 z-10">
          <div className="inline-flex items-center space-x-2 bg-slate-900/80 border border-[#00E676]/20 px-3 py-1.5 rounded-full text-xs text-[#64FFDA]">
            <Sparkles className="w-3.5 h-3.5 text-[#00E676] animate-pulse" />
            <span className="font-mono tracking-wider font-semibold">2026 EDITION — CHARGEFLOW 2.0</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
            Charge <span className="text-[#00E676] bg-gradient-to-r from-[#00E676] to-[#64FFDA] bg-clip-text text-transparent">Smarter</span>.<br />
            Drive <span className="text-white relative font-mono">Further.</span>
          </h1>

          <p className="text-gray-300 text-base sm:text-lg max-w-lg leading-relaxed">
            The next-generation smart charging ecosystem. Locate top-tier fast-charging docks, make instantaneous slot bookings, access live queuing trackers, and calculate optimized battery intervals with precision AI predictions.
          </p>

          {/* Emergency Charging Mode Banner/Activation */}
          <div className="bg-rose-500/10 border border-rose-500/25 p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-lg shadow-rose-950/20 max-w-lg">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-450 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold font-mono text-white tracking-wide uppercase">BATTERY DRAINED / EMERGENCY?</p>
                <p className="text-[11px] text-gray-300 leading-normal">
                  Reroute instantly to nearest ultra-fast DC chargers (&gt;100kW DC) with active vacant connector plugs.
                </p>
              </div>
            </div>
            <button
              id="btn-emergency-mode"
              onClick={() => onToggleEmergencyMode(!emergencyMode)}
              className={`px-5 py-2.5 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer whitespace-nowrap text-center ${emergencyMode ? "bg-emerald-500 text-[#0b1220] shadow-md shadow-emerald-500/20" : "bg-rose-600 hover:bg-rose-500 border border-rose-550 text-white shadow-md shadow-rose-650/40 hover:shadow-rose-500/50"}`}
            >
              {emergencyMode ? "🟢 Active (Reroute...)" : "🚨 Activate Mode"}
            </button>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button 
              id="hero-btn-book"
              onClick={onExplore}
              className="px-8 py-4 rounded-xl text-base font-bold text-[#0B1220] bg-gradient-to-r from-[#00E676] to-[#64FFDA] shadow-xl shadow-[#00E676]/20 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer text-center"
            >
              Book Charging Slot
            </button>
            <a 
              href="#nearby"
              className="px-8 py-4 rounded-xl text-base font-semibold text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-center flex items-center justify-center space-x-2"
            >
              <span>See Live Chargers</span>
              <MapPin className="w-4 h-4 text-[#64FFDA]" />
            </a>
          </div>

          {/* Micro stats banner */}
          <div className="pt-8 grid grid-cols-3 gap-4 border-t border-slate-800/80 max-w-md">
            <div>
              <p className="text-2xl font-bold text-white font-mono">4</p>
              <p className="text-xs text-gray-400">Micro Hubs</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#00E676] font-mono">100%</p>
              <p className="text-xs text-gray-400">Green Power</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#64FFDA] font-mono">0.05s</p>
              <p className="text-xs text-gray-400">API Sync Rate</p>
            </div>
          </div>
        </div>

        {/* Floating Animated EV Presentation Component */}
        <div className="relative flex justify-center items-center">
          <div className="absolute w-[360px] h-[360px] rounded-full border border-white/5 animate-spin-slow"></div>
          <div className="absolute w-[240px] h-[240px] rounded-full border border-dashed border-[#64FFDA]/15"></div>
          
          <motion.div 
            initial={{ y: 0 }}
            animate={{ y: [-15, 15, -15] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="z-10 frosted-glass-teal border border-[#64FFDA]/25 rounded-3xl p-6 shadow-2xl max-w-sm relative"
          >
            {/* Battery Indicator Graphic */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 flex items-center space-x-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>FAST CHARGE LIVE</span>
              </span>
              <span className="text-xs font-mono text-gray-400">CCS 150 kW</span>
            </div>

            {/* Simulated EV Car Graphics */}
            <div className="h-44 bg-gradient-to-b from-[#0B1220] to-[#121E31] rounded-2xl flex flex-col items-center justify-center border border-slate-850 relative overflow-hidden">
              {/* Vertical charging particles background */}
              <div className="absolute inset-0 flex items-center justify-around opacity-30 pointer-events-none">
                <div className="w-0.5 h-12 bg-[#00E676] rounded animate-bounce"></div>
                <div className="w-0.5 h-16 bg-[#64FFDA] rounded animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                <div className="w-0.5 h-10 bg-[#00E676] rounded animate-bounce" style={{ animationDelay: '0.8s' }}></div>
              </div>

              <BatteryCharging className="w-16 h-16 text-[#00E676] drop-shadow-[0_0_15px_rgba(0,230,118,0.5)] z-10" />
              <p className="text-2xl font-mono font-semibold text-white mt-3 z-10">84%</p>
              <span className="text-[10px] text-gray-400 tracking-wider">Charging in progress — Range +180km</span>
            </div>

            {/* Dashboard parameters */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="text-[9px] text-[#64FFDA] font-mono tracking-wider">ENERGY RATE</p>
                <p className="text-sm font-semibold font-mono text-gray-200 mt-0.5">₹16.0 / kWh</p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="text-[9px] text-[#00E676] font-mono tracking-wider">CARBON SAVED</p>
                <p className="text-sm font-semibold font-mono text-emerald-400 mt-0.5">29.6 kg CO₂</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Micro Features Section */}
      <section id="features" className="py-20 border-t border-slate-900 bg-slate-900/35 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-[11px] font-mono text-[#00E676] font-bold uppercase tracking-widest bg-emerald-900/30 border border-[#00E676]/20 px-3 py-1 rounded-full">
              Full-Stack Platform Capabilities
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Designed For EV Owners & Station Admins
            </h2>
            <p className="text-gray-400 text-sm md:text-base">
              ChargeFlow bridges grid power and driver telemetry. Explore are main pillars developed for ultimate reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="frosted-glass p-8 rounded-2xl hover:translate-y-[-4px] hover:border-[#00E676]/40 transition-all group shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-[#00E676]/10 flex items-center justify-center text-[#00E676] mb-6 group-hover:bg-[#00E676] group-hover:text-[#0B1220] transition-all">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-mono">Interactive Live Map</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Check active status of individual stations. See color-coded signals mapping available sockets, physical charger limits, peak periods and parking amenities.
              </p>
            </div>

            {/* Card 2 */}
            <div className="frosted-glass p-8 rounded-2xl hover:translate-y-[-4px] hover:border-[#64FFDA]/40 transition-all group shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-[#64FFDA]/10 flex items-center justify-center text-[#64FFDA] mb-6 group-hover:bg-[#64FFDA] group-hover:text-[#0B1220] transition-all">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-mono">AI Predictions Engine</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Utilize server-side Gemini intelligence. Instantly calculate accurate charging times and costs adjusted for vehicle models, grid fluctuations, and temperature constraints.
              </p>
            </div>

            {/* Card 3 */}
            <div className="frosted-glass p-8 rounded-2xl hover:translate-y-[-4px] hover:border-[#00E676]/40 transition-all group shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-[#00E676]/10 flex items-center justify-center text-[#00E676] mb-6 group-hover:bg-[#00E676] group-hover:text-[#0B1220] transition-all">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-mono">Seamless Queue Control</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                No more redundant driving. If a high-power terminal is fully occupied, simply tap to join the virtual queue and automatically receive ETA notifications on when to dock.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Stations List section */}
      <section id="nearby" className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-[#64FFDA] tracking-widest uppercase block">MICRO GRID SENSORS</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Featured Premium Stations Nearby
            </h2>
            <p className="text-sm text-gray-400">
              Live statuses synced from terminal microprocessors in the last 15 seconds.
            </p>
          </div>

          <button 
            id="explore-all"
            onClick={onExplore}
            className="px-5 py-2.5 text-xs font-mono font-bold text-[#00E676] border border-[#00E676]/30 hover:border-[#00E676] hover:bg-[#00E676]/5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <span>Live Interactive Grid Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Station Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {activeStations.map((station) => (
            <div 
              key={station.id}
              className="frosted-glass rounded-2xl p-6 flex flex-col justify-between hover:border-[#00E676]/40 transition-all shadow-xl group relative overflow-hidden"
            >
              {/* Top Row */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {/* Status Indicator */}
                  <span className="text-[10px] font-mono tracking-wider bg-[#00E676]/10 border border-[#00E676]/20 text-[#00E676] px-2.5 py-1 rounded-md">
                    ● STATION ONLINE
                  </span>
                  <span className="text-xs text-gray-400 font-mono flex items-center space-x-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>{station.rating}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-[#00E676] transition-colors font-mono">{station.name}</h3>
                  <p className="text-xs text-gray-400 flex items-center mt-1">
                    <MapPin className="w-3 h-3 text-cyan-400 mr-1 shrink-0" />
                    <span className="truncate">{station.address}</span>
                  </p>
                </div>

                {/* Sockets Details */}
                <div className="py-2.5 border-t border-b border-white/5 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[9.5px] font-mono uppercase tracking-wider">AVAILABLE PLUGS</span>
                    <span className="text-gray-200 block font-semibold font-mono mt-1 text-xs">
                      {station.slots.filter(s => !s.isOccupied).length} of {station.slots.length} Slots Open
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9.5px] font-mono uppercase tracking-wider">BASE TARIFF</span>
                    <span className="text-[#00E676] block font-bold font-mono mt-0.5 text-sm">
                      ₹{station.basePricePerKwh} <span className="text-gray-400 font-sans text-[10px] font-normal">/ kWh</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 flex items-center justify-between pt-1">
                <span className="text-xs text-[#64FFDA] font-semibold bg-[#64FFDA]/10 border border-[#64FFDA]/15 px-2 py-0.5 rounded font-mono">
                  ETA: {Math.round(station.distance * 3 + 2)} mins ({station.distance} km)
                </span>
                
                <button 
                  onClick={onExplore}
                  className="p-2 rounded-lg bg-white/5 hover:bg-[#00E676] text-gray-300 hover:text-[#0B1220] transition-all cursor-pointer border border-white/5"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tabs explanation detail */}
      <section id="how-it-works" className="py-20 bg-white/[0.005] border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex justify-center mb-10 border-b border-white/5 p-1 bg-[#0B1220]/40 backdrop-blur-md rounded-xl max-w-sm mx-auto">
            <button
              onClick={() => setActiveTab("how")}
              className={`flex-1 py-2 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer ${activeTab === "how" ? "bg-[#00E676] text-[#0B1220]" : "text-gray-400 hover:text-white"}`}
            >
              How It Works
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex-1 py-2 text-xs font-bold font-mono rounded-lg transition-all cursor-pointer ${activeTab === "stats" ? "bg-[#00E676] text-[#0B1220]" : "text-gray-400 hover:text-white"}`}
            >
              System Statistics
            </button>
          </div>

          {activeTab === "how" ? (
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-[#00E676] shrink-0">1</div>
                <div>
                  <h4 className="text-lg font-bold text-white font-mono">Select Station & Check Load</h4>
                  <p className="text-sm text-gray-400">Browse the map to find nearby docks customized for your vehicle’s connector plug type (such as DC CCS, CHAdeMO or standard AC Type 2).</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-[#00E676] shrink-0">2</div>
                <div>
                  <h4 className="text-lg font-bold text-white font-mono">AI Energy Prediction</h4>
                  <p className="text-sm text-gray-400">Input starting status of battery. Our server-side neural assistant will dynamically compute charging rates, cooling requirements, trip cost estimations, and local peak price thresholds.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-[#00E676] shrink-0">3</div>
                <div>
                  <h4 className="text-lg font-bold text-white font-mono">Charge & Keep Updated</h4>
                  <p className="text-sm text-gray-400">Initiate live simulation sessions. Watch vehicle charge rates increments in real-time, get queue notifications if busy, select multiple convenient e-wallet billing channels, and track total net carbon outputs saved.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="frosted-glass-dark p-6 rounded-2xl">
                <Leaf className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white font-mono">1,142 kg</p>
                <p className="text-xs text-gray-400 mt-1">Net CO₂ Reduction This Week</p>
              </div>
              <div className="frosted-glass-dark p-6 rounded-2xl">
                <Trophy className="w-8 h-8 text-[#64FFDA] mx-auto mb-2" />
                <p className="text-3xl font-bold text-white font-mono">99.98%</p>
                <p className="text-xs text-gray-400 mt-1">Charging Bay Active Uptime</p>
              </div>
              <div className="frosted-glass-dark p-6 rounded-2xl">
                <Star className="w-8 h-8 text-[#00E676] mx-auto mb-2" />
                <p className="text-3xl font-bold text-white font-mono">4.75</p>
                <p className="text-xs text-gray-400 mt-1">Platform Average Driver Rating</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Trust Testimonials Section */}
      <section id="testimonials" className="py-20 max-w-7xl mx-auto px-6">
        <h3 className="text-2xl font-bold text-center tracking-tight text-white font-mono mb-12">Driven by Clean Tech Drivers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="frosted-glass p-6 rounded-2xl relative">
            <div className="flex items-center space-x-1.5 text-amber-400 mb-3">
              <Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" /><Star className="w-4 h-4 fill-amber-400" />
            </div>
            <p className="text-sm text-gray-300 italic">"ChargeFlow solved my EV routing issues. The AI predictor correctly predicted my Nexon Max charging rate profile, allowing me to plan coffee stops flawlessly. Beautiful interface."</p>
            <p className="text-xs text-[#00E676] font-mono mt-4 font-semibold">— Aniket S., Pune, Nexon Max Owner</p>
          </div>

          <div className="frosted-glass p-6 rounded-2xl relative">
            <div className="flex items-center space-x-1.5 text-[#64FFDA] mb-3">
              <Star className="w-4 h-4 fill-teal-400" /><Star className="w-4 h-4 fill-teal-400" /><Star className="w-4 h-4 fill-teal-400" /><Star className="w-4 h-4 fill-teal-400" /><Star className="w-4 h-4 fill-teal-400" />
            </div>
            <p className="text-sm text-gray-300 italic">"Offline virtual queuing and notification is an absolute life-saver. Getting a direct text estimate of my wait duration at busy freeway hubs makes routing completely stress-free."</p>
            <p className="text-xs text-[#64FFDA] font-mono mt-4 font-semibold">— Shruti K., Tesla Model 3 Owner</p>
          </div>
        </div>
      </section>

      {/* Universal Footer */}
      <footer id="landing-footer" className="py-10 border-t border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-gray-300 font-mono font-bold tracking-widest text-[11px] uppercase">Charge<span className="text-[#00E676]">Flow</span></span>
            <span>© 2026 Smart EV Stations Platform. All Rights Reserved.</span>
          </div>
          <div className="flex items-center space-x-6 font-mono">
            <a href="#landing-container" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#landing-container" className="hover:text-white transition-colors">Infrastructure status</a>
            <a href="#landing-container" className="text-[#00E676] hover:underline" onClick={onLogin}>Platform Console Login</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
