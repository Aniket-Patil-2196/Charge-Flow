import { useState } from "react";
import { UserRole, Station, Booking, LiveSession, SupportTicket, DynamicPricingRule, UserState, StationStatus } from "./types";
import { 
  INITIAL_STATIONS, 
  INITIAL_VEHICLES, 
  INITIAL_PRICING_RULES, 
  INITIAL_USER, 
  INITIAL_TICKETS 
} from "./mockData";
import LandingPage from "./components/LandingPage";
import AuthPage from "./components/AuthPage";
import Map from "./components/Map";
import BookingFlow from "./components/BookingFlow";
import Dashboard from "./components/Dashboard";
import AdminPanel from "./components/AdminPanel";
import BatterySwapBay from "./components/BatterySwapBay";
import { Zap, LogOut, Compass, LayoutDashboard, Database, HelpCircle, Wallet, UserCheck, AlertTriangle, ArrowLeftRight } from "lucide-react";

export default function App() {
  // Navigation Screens: "landing" | "app"
  const [screen, setScreen] = useState<"landing" | "app">("landing");
  // Sub views inside app screen: "map" | "dashboard" | "admin"
  const [activeSubView, setActiveSubView] = useState<"map" | "dashboard" | "admin">("map");

  // Global Sync States
  const [stations, setStations] = useState<Station[]>(INITIAL_STATIONS);
  const [pricingRules, setPricingRules] = useState<DynamicPricingRule[]>(INITIAL_PRICING_RULES);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [userState, setUserState] = useState<UserState>(INITIAL_USER);
  
  // Active charging parameters
  const [activeSession, setActiveSession] = useState<LiveSession | null>(null);

  // Overlays
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // Active Station for booking flow sub-screen
  const [bookingStation, setBookingStation] = useState<Station | null>(null);

  // Emergency DC Fast Charging filter mode state
  const [emergencyMode, setEmergencyMode] = useState<boolean>(false);
  const [loadBalancingActive, setLoadBalancingActive] = useState<boolean>(true);

  // Helper for mock GPS user location
  const userPos = { x: 42, y: 58 }; // default coordinates on grid

  // LOGIN SUCCESS SYNCHRONIZER
  const handleLoginSuccess = (email: string, role: UserRole) => {
    setUserState((prev) => ({
      ...prev,
      email: email,
      role: role,
      name: role === UserRole.User ? "Aniket Patil" : role === UserRole.Admin ? "Mumbai Operations Manager" : "Global Architect Admin"
    }));
    setShowAuthModal(false);
    setScreen("app");
    // Default route view based on permission role group
    if (role === UserRole.User) {
      setActiveSubView("map");
    } else {
      setActiveSubView("admin");
    }
  };

  const handleLogout = () => {
    setScreen("landing");
    setBookingStation(null);
    setSelectedStationId(null);
    setEmergencyMode(false);
    setUserState((prev) => ({
      ...prev,
      role: UserRole.User,
      name: "Aniket Patil",
      email: "aniketjaysingpatil3513@gmail.com"
    }));
  };

  // STATION OPERATION CALLS
  const handleUpdateStationStatus = (stationId: string, status: StationStatus) => {
    setStations((prev) =>
      prev.map((s) => (s.id === stationId ? { ...s, status: status } : s))
    );
  };

  const handleUpdateStationTemp = (stationId: string, temp: number) => {
    setStations((prev) =>
      prev.map((s) => (s.id === stationId ? { ...s, temperature: temp } : s))
    );
  };

  const handleAddStation = (newStation: Station) => {
    setStations((prev) => [...prev, newStation]);
  };

  // DYNAMIC PRICING ENGINE MUTATIONS
  const handleAddPricingRule = (newRule: DynamicPricingRule) => {
    setPricingRules((prev) => [...prev, newRule]);
  };

  const handleDeletePricingRule = (ruleId: string) => {
    setPricingRules((prev) => prev.filter((r) => r.id !== ruleId));
  };

  // BOOKING CONTROL SYSTEMS
  const handleBookingConfirmed = (newBooking: Booking) => {
    // Check if user has enough balance in case wallet billing was chose
    if (newBooking.paymentMethod === "Wallet" && userState.walletBalance < newBooking.estimatedCost) {
      alert("⚠️ Pre-paid wallet balance is insufficient. Please adjust SoC parameters or choose Card checkout.");
      return;
    }

    // Allocate wallet ledger if necessary
    if (newBooking.paymentMethod === "Wallet") {
      setUserState(prev => ({
        ...prev,
        walletBalance: parseFloat((prev.walletBalance - newBooking.estimatedCost).toFixed(2))
      }));
    }

    // Toggle Station slots to reflect occupied state
    setStations((prev) =>
      prev.map((s) => {
        if (s.id !== newBooking.stationId) return s;
        return {
          ...s,
          slots: s.slots.map((sl) =>
            sl.id === newBooking.slotId ? { ...sl, isOccupied: true, currentOccupantUserId: "user-main-id" } : sl
          ),
        };
      })
    );

    // Bootstrap Live Charging Simulator
    const activeSes: LiveSession = {
      bookingId: newBooking.id,
      userId: "user-main-id",
      stationId: newBooking.stationId,
      stationName: newBooking.stationName,
      slotName: newBooking.slotName,
      startSoc: newBooking.startSoc,
      targetSoc: newBooking.targetSoc,
      currentSoc: newBooking.startSoc,
      energyDeliveredKwh: 0,
      chargingRateKw: newBooking.connectorType === "Supercharger" || newBooking.connectorType === "CCS" ? 150 : 22,
      timeRemainingSeconds: newBooking.estimatedDuration * 60,
      co2SavedKg: 0,
      status: "Charging",
      costIncurred: 0
    };

    setActiveSession(activeSes);
    setBookingStation(null);
    setActiveSubView("dashboard");
  };

  // QUEUE CONTROL STRATEGY
  const handleJoinQueue = (stationId: string, vehicleModel: string) => {
    setStations((prev) =>
      prev.map((s) => {
        if (s.id !== stationId) return s;
        return {
          ...s,
          queueList: [...s.queueList, "user-main-id"]
        };
      })
    );
    alert(`🎯 Queue Waitlist Registered Account!\n\nYou have joined the waiting queue at spot #${stations.find(s=>s.id===stationId)!.queueList.length + 1}. You will be notified when a cable resolves.`);
    setBookingStation(null);
  };

  // ACTIVE charging terminate
  const handleStopChargingSession = (bookingId: string, finalSoc: number, finalCost: number, energyDeliveredKwh: number) => {
    if (!activeSession) return;

    // Release slot occupation
    setStations((prev) =>
      prev.map((s) => {
        if (s.id !== activeSession.stationId) return s;
        return {
          ...s,
          slots: s.slots.map((sl) =>
            sl.name === activeSession.slotName ? { ...sl, isOccupied: false, currentOccupantUserId: undefined } : sl
          ),
        };
      })
    );

    // Save item to historic database
    const co2Saved = parseFloat((energyDeliveredKwh * 0.44).toFixed(1));
    const historyItem = {
      id: "hist-" + Math.floor(Math.random() * 9000 + 1000),
      stationName: activeSession.stationName,
      chargerName: activeSession.slotName,
      date: new Date().toISOString().split("T")[0],
      energyKwh: energyDeliveredKwh,
      durationMins: Math.round(((finalSoc - activeSession.startSoc)/100)*65),
      cost: finalCost,
      co2SavedKg: co2Saved,
    };

    setUserState((prev) => ({
      ...prev,
      co2SavedTotal: parseFloat((prev.co2SavedTotal + co2Saved).toFixed(1)),
      history: [historyItem, ...prev.history]
    }));

    setActiveSession(null);
    alert("🎉 Charging Cycle Completed Successfully! Your invoice ledger records have been synchronized.");
  };

  const handlePauseCharging = () => {
    if (activeSession) {
      setActiveSession({ ...activeSession, status: "Paused", chargingRateKw: 0 });
    }
  };

  const handleResumeCharging = () => {
    if (activeSession) {
      const isFast = activeSession.slotName.toLowerCase().includes("super") || activeSession.slotName.toLowerCase().includes("ccs");
      setActiveSession({ ...activeSession, status: "Charging", chargingRateKw: isFast ? 150 : 22 });
    }
  };

  // TICKETS RESPONDERS
  const handleAddNewTicket = (category: SupportTicket["category"], title: string, desc: string) => {
    const newT: SupportTicket = {
      id: "t-" + Math.floor(Math.random() * 9000 + 1000),
      userId: "user-main-id",
      userEmail: userState.email,
      title: title,
      description: desc,
      category: category,
      status: "Open",
      createdAt: new Date().toISOString(),
      replies: []
    };
    setTickets((prev) => [newT, ...prev]);
  };

  const handlePostTicketReply = (ticketId: string, replyMessage: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          status: "In Progress",
          replies: [
            ...t.replies,
            {
              id: "rep-" + (t.replies.length + 1),
              sender: "Admin",
              message: replyMessage,
              createdAt: new Date().toISOString()
            }
          ]
        };
      })
    );
  };

  return (
    <div id="chargeflow-app" className="min-h-screen bg-[#0B1220] text-gray-100 font-sans selection:bg-[#00E676] selection:text-[#0B1220] relative overflow-x-hidden">
      {/* Dynamic Glowing Mesh Background Blobs for ultimate Frosted Glass depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-[#00E676]/10 to-[#64FFDA]/10 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute bottom-10 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-[#64FFDA]/10 to-[#00E676]/10 rounded-full blur-[160px]"></div>
      </div>
      
      {/* 1. LANDING SCREEN CONTAINER */}
      {screen === "landing" && (
        <LandingPage
          stations={stations}
          role={userState.role}
          onRoleToggle={(newRole) => {
            setUserState((prev) => ({
              ...prev,
              role: newRole,
              name: newRole === UserRole.User ? "Aniket Patil" : "Mumbai Operations Manager"
            }));
            if (newRole === UserRole.User) {
              setActiveSubView("map");
            } else {
              setActiveSubView("admin");
            }
          }}
          onExplore={() => {
            setScreen("app"); 
            if (userState.role === UserRole.User) {
              setActiveSubView("map");
            } else {
              setActiveSubView("admin");
            }
          }}
          onLogin={() => setShowAuthModal(true)}
          emergencyMode={emergencyMode}
          onToggleEmergencyMode={(val) => {
            setEmergencyMode(val);
            if (val) {
              setScreen("app");
              setActiveSubView("map");
            }
          }}
        />
      )}

      {/* 2. CORE WORKSPACE FLOWS APP */}
      {screen === "app" && (
        <div className="flex min-h-screen flex-col md:flex-row relative z-10">
          
          {/* Cyber Lateral Sidebar Navigation Menu */}
          <aside className="w-full md:w-64 frosted-sidebar flex flex-col justify-between p-6 shrink-0 z-30">
            <div className="space-y-8">
              
              {/* Sidebar Header Brand */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#00E676] to-[#64FFDA] p-0.5 flex items-center justify-center">
                  <div className="w-full h-full bg-[#0B1220]/90 rounded-[7px] flex items-center justify-center">
                    <Zap className="w-4.5 h-4.5 text-[#00E676]" />
                  </div>
                </div>
                <div>
                  <span className="text-base font-bold font-mono tracking-tight text-white block">
                    Charge<span className="text-[#00E676]">Flow</span>
                  </span>
                  <span className="text-[8px] font-mono tracking-widest text-[#64FFDA] block uppercase">Operator Panel</span>
                </div>
              </div>

              {/* Navigation Anchors Switches */}
              <nav className="space-y-2 text-xs font-mono">
                {userState.role === UserRole.User && (
                  <>
                    {/* View maps */}
                    <button
                      onClick={() => { setActiveSubView("map"); setBookingStation(null); }}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center space-x-3 transition-colors cursor-pointer ${activeSubView === "map" ? "bg-[#00E676] text-[#0B1220]" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                    >
                      <Compass className="w-4 h-4 shrink-0" />
                      <span>Stations Map Scanner</span>
                    </button>

                    {/* View Charging dashboard */}
                    <button
                      onClick={() => { setActiveSubView("dashboard"); setBookingStation(null); }}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center space-x-3 transition-colors cursor-pointer ${activeSubView === "dashboard" ? "bg-[#00E676] text-[#0B1220]" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                    >
                      <LayoutDashboard className="w-4 h-4 shrink-0" />
                      <span>Driver Dashboard</span>
                    </button>

                    {/* NEW: Battery Swap Exchange Bay */}
                    <button
                      onClick={() => { setActiveSubView("swap"); setBookingStation(null); }}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center space-x-3 transition-colors cursor-pointer ${activeSubView === "swap" ? "bg-[#00E676] text-[#0B1220]" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                    >
                      <ArrowLeftRight className="w-4 h-4 shrink-0" />
                      <span>Battery Swap Bay</span>
                    </button>
                  </>
                )}

                {/* Unified admin anchors switch indicators if permitted */}
                {(userState.role === UserRole.Admin || userState.role === UserRole.SuperAdmin) && (
                  <>
                    <button
                      onClick={() => setActiveSubView("admin")}
                      className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center space-x-3 transition-colors cursor-pointer ${activeSubView === "admin" ? "bg-[#00E676] text-[#0B1220]" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
                    >
                      <Database className="w-4 h-4 shrink-0" />
                      <span>Admin Cockpit</span>
                    </button>

                    <button
                      onClick={() => {
                        // Support driver map mode for testing compatibilities
                        setUserState(prev => ({ ...prev, role: UserRole.User }));
                        setActiveSubView("map");
                      }}
                      className="w-full py-3 px-4 rounded-xl border border-dashed border-white/10 hover:border-white/20 text-cyan-400 text-[10px] flex items-center space-x-2 mt-4 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Switch to Driver Mode</span>
                    </button>
                  </>
                )}
              </nav>
            </div>

            {/* Sidebar Account block */}
            <div className="pt-6 border-t border-white/10 space-y-4">
              <div className="background-blur-md bg-white/5 p-3 rounded-xl border border-white/10 space-y-1.5 text-xs">
                <span className="text-[9.5px] font-mono text-gray-400 block uppercase">Permissions Profile</span>
                <span className="text-white font-mono font-bold truncate block">{userState.name}</span>
                <span className="text-[9px] font-mono text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded uppercase inline-block font-semibold">
                  {userState.role}
                </span>
                <span className="block text-[10px] text-gray-400 font-mono mt-1.5 flex items-center">
                  <Wallet className="w-3 h-3 text-[#64FFDA] mr-1" /> Balance: ₹{userState.walletBalance}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-gray-500">
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="hover:text-white transition-colors cursor-pointer text-[10px]"
                >
                  Change Account Role
                </button>
                <button 
                  onClick={handleLogout}
                  className="text-rose-500 hover:text-rose-400 cursor-pointer flex items-center space-x-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </aside>

          {/* Core Content Area */}
          <main className="flex-1 min-w-0 p-4 md:p-8 flex flex-col justify-between">
            
            {/* Header notification or thermal warnings alert */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-white/5 mb-6 gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold font-mono text-white tracking-tight"> 
                  ChargeFlow Workspace 
                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/10 text-gray-400 font-mono font-normal uppercase tracking-wider ml-2">
                    {userState.role} View
                  </span>
                </h1>
                <p className="text-xs text-gray-400">Integrated EV Terminal Controllers & Operator cockpit</p>
              </div>

              {/* Dynamic Prominent 1-Click Role Switcher */}
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shadow-inner shrink-0">
                <button
                  id="header-role-switch-user"
                  onClick={() => {
                    setUserState((prev) => ({
                      ...prev,
                      role: UserRole.User,
                      name: "Aniket Patil"
                    }));
                    setActiveSubView("map");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center space-x-1.5 ${
                    userState.role === UserRole.User 
                      ? "bg-[#00E676] text-[#0B1220] shadow-md" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <span>🚗 Driver</span>
                </button>
                <button
                  id="header-role-switch-admin"
                  onClick={() => {
                    setUserState((prev) => ({
                      ...prev,
                      role: UserRole.Admin,
                      name: "Mumbai Operations Manager"
                    }));
                    setActiveSubView("admin");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer flex items-center space-x-1.5 ${
                    userState.role !== UserRole.User 
                      ? "bg-[#00E676] text-[#0B1220] shadow-md" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <span>⚙️ Admin Cockpit</span>
                </button>
              </div>

              {/* Thermal alarms notifications handler */}
              {stations.some(s => s.temperature > 40) && (
                <div className="bg-rose-950/45 border border-rose-900/60 p-2 rounded-xl text-rose-400 text-[10px] font-mono flex items-center space-x-2 animate-pulse max-w-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>WARNING: Heat Alarm Raised at EcoPoint!</span>
                </div>
              )}
            </header>

            {/* CONDITIONAL SUB VIEWS */}
            <section className="flex-1">
              {activeSubView === "map" && !bookingStation && (
                <Map
                  stations={stations}
                  selectedStationId={selectedStationId}
                  onSelectStation={(id) => setSelectedStationId(id)}
                  userPos={userPos}
                  onBookStation={(st) => setBookingStation(st)}
                  emergencyMode={emergencyMode}
                  onToggleEmergencyMode={setEmergencyMode}
                />
              )}

              {activeSubView === "map" && bookingStation && (
                <BookingFlow
                  station={bookingStation}
                  vehicles={INITIAL_VEHICLES}
                  activePricingRules={pricingRules}
                  onBack={() => setBookingStation(null)}
                  onBookingConfirmed={handleBookingConfirmed}
                  onJoinQueue={handleJoinQueue}
                />
              )}

              {activeSubView === "dashboard" && (
                <Dashboard
                  userState={userState}
                  activeSession={activeSession}
                  tickets={tickets}
                  onStopSession={handleStopChargingSession}
                  onPauseSession={handlePauseCharging}
                  onResumeSession={handleResumeCharging}
                  onSubmitTicket={handleAddNewTicket}
                />
              )}

              {activeSubView === "swap" && (
                <BatterySwapBay
                  stations={stations}
                  userState={userState}
                  onUpdateWallet={(amt) => setUserState(prev => ({ ...prev, walletBalance: parseFloat((prev.walletBalance + amt).toFixed(2)) }))}
                  onAddHistoryItem={(item) => setUserState(prev => ({ ...prev, history: [item, ...prev.history], co2SavedTotal: parseFloat((prev.co2SavedTotal + item.co2SavedKg).toFixed(1)) }))}
                  onIncrementStationSwap={(stationId) => setStations(prev => prev.map(s => s.id === stationId ? { ...s, availableBatteriesCount: Math.max(0, (s.availableBatteriesCount || 1) - 1), totalSwapsCompleted: (s.totalSwapsCompleted || 0) + 1 } : s))}
                />
              )}

              {activeSubView === "admin" && (
                <AdminPanel
                  stations={stations}
                  tickets={tickets}
                  pricingRules={pricingRules}
                  onUpdateStationStatus={handleUpdateStationStatus}
                  onUpdateStationTemp={handleUpdateStationTemp}
                  onAddStation={handleAddStation}
                  onAddPricingRule={handleAddPricingRule}
                  onDeletePricingRule={handleDeletePricingRule}
                  onPostTicketReply={handlePostTicketReply}
                  loadBalancingActive={loadBalancingActive}
                  onToggleLoadBalancing={setLoadBalancingActive}
                />
              )}
            </section>

          </main>

        </div>
      )}

      {/* 3. OPTIONAL AUTH OVERLAY */}
      {showAuthModal && (
        <AuthPage
          onLoginSuccess={handleLoginSuccess}
          onClose={() => setShowAuthModal(false)}
        />
      )}

    </div>
  );
}
