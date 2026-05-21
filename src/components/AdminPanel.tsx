import React, { useState } from "react";
import { Station, ChargerSlot, DynamicPricingRule, SupportTicket, StationStatus } from "../types";
import { Activity, ShieldAlert, BarChart3, Settings, TrendingUp, Cpu, Trash2, Edit2, Plus, MessageSquare, AlertTriangle, HelpCircle, Flame, DollarSign, Zap, Power } from "lucide-react";

interface AdminPanelProps {
  stations: Station[];
  tickets: SupportTicket[];
  pricingRules: DynamicPricingRule[];
  onUpdateStationStatus: (stationId: string, status: StationStatus) => void;
  onUpdateStationTemp: (stationId: string, temp: number) => void;
  onAddStation: (newStation: Station) => void;
  onAddPricingRule: (newRule: DynamicPricingRule) => void;
  onDeletePricingRule: (ruleId: string) => void;
  onPostTicketReply: (ticketId: string, replyMessage: string) => void;
  loadBalancingActive?: boolean;
  onToggleLoadBalancing?: (val: boolean) => void;
}

export default function AdminPanel({ 
  stations, 
  tickets, 
  pricingRules, 
  onUpdateStationStatus, 
  onUpdateStationTemp,
  onAddStation, 
  onAddPricingRule, 
  onDeletePricingRule,
  onPostTicketReply,
  loadBalancingActive = true,
  onToggleLoadBalancing
}: AdminPanelProps) {
  // Navigation tabs: "stations" | "pricing" | "analytics" | "support"
  const [activeTab, setActiveTab] = useState<"stations" | "pricing" | "analytics" | "support">("stations");

  // Add station state indicators
  const [newStationName, setNewStationName] = useState("");
  const [newStationAddress, setNewStationAddress] = useState("");
  const [newStationBasePrice, setNewStationBasePrice] = useState(14);
  const [newStationX, setNewStationX] = useState(45);
  const [newStationY, setNewStationY] = useState(55);

  // Add pricing rule states
  const [pricingLabel, setPricingLabel] = useState("");
  const [pricingMultiplier, setPricingMultiplier] = useState(1.1);
  const [pricingStartHour, setPricingStartHour] = useState(6);
  const [pricingEndHour, setPricingEndHour] = useState(12);

  // Active tickets reply state
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [ticketReplyInput, setTicketReplyInput] = useState("");

  const handleCreateStationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationName || !newStationAddress) return;

    const newSt: Station = {
      id: "st-" + (stations.length + 1),
      name: newStationName,
      address: newStationAddress,
      latitude: newStationY,
      longitude: newStationX,
      distance: parseFloat((Math.random() * 5 + 2).toFixed(1)),
      status: "Online",
      basePricePerKwh: newStationBasePrice,
      amenities: ["WiFi", "Restrooms"],
      rating: 5.0,
      temperature: 26.5,
      reviews: [],
      slots: [
        {
          id: `st-${stations.length + 1}-s1`,
          name: "DC Rapid Dock 1",
          connectorType: "CCS",
          powerOutput: 150,
          isOccupied: false,
          isFastCharger: true,
          status: "Online"
        },
        {
          id: `st-${stations.length + 1}-s2`,
          name: "Standard AC Dock 2",
          connectorType: "Type 2",
          powerOutput: 22,
          isOccupied: false,
          isFastCharger: false,
          status: "Online"
        }
      ],
      queueList: [],
      peakHours: [10, 8, 4, 2, 5, 12, 22, 35, 45, 50, 55, 60, 58, 55, 58, 62, 70, 75, 70, 62, 50, 38, 24, 15]
    };

    onAddStation(newSt);
    setNewStationName("");
    setNewStationAddress("");
  };

  const handleCreatePricingRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingLabel) return;

    const newRule: DynamicPricingRule = {
      id: "p" + (pricingRules.length + 1),
      label: pricingLabel,
      startHour: pricingStartHour,
      endHour: pricingEndHour,
      priceMultiplier: pricingMultiplier
    };

    onAddPricingRule(newRule);
    setPricingLabel("");
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !ticketReplyInput) return;
    onPostTicketReply(selectedTicketId, ticketReplyInput);
    setTicketReplyInput("");
  };

  // Generate some aggregate diagnostics metrics to show in Admin
  const totalOccupiedSlots = stations.reduce((tot, st) => tot + st.slots.filter(s => s.isOccupied).length, 0);
  const totalSlotsCount = stations.reduce((tot, st) => tot + st.slots.length, 0);
  const occupancyPercentage = Math.round((totalOccupiedSlots / (totalSlotsCount || 1)) * 100);

  // Average Grid cooling temp
  const averageGridTemp = parseFloat((stations.reduce((acc, current) => acc + current.temperature, 0) / stations.length).toFixed(1));

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  return (
    <div className="frosted-glass backdrop-blur-xl border border-white/10 rounded-3xl p-1 md:p-6 text-gray-100 font-sans shadow-xl">
      
      {/* Top dashboard stats banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-gray-400 block">GRID OCCUPANCY RATE</span>
            <span className="text-xl md:text-2xl font-extrabold font-mono text-[#00E676]">{occupancyPercentage}%</span>
            <span className="text-[9px] text-gray-500 font-mono block">{totalOccupiedSlots} of {totalSlotsCount} Plugs Active</span>
          </div>
          <Activity className="w-8 h-8 text-[#00E676] opacity-60" />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-gray-400 block">AGGREGATE DEMAND TARIFF</span>
            <span className="text-xl md:text-2xl font-extrabold font-mono text-[#64FFDA]">₹16.50 / kWh</span>
            <span className="text-[9px] text-gray-500 font-mono block">Dynamic Rule Engine Live</span>
          </div>
          <TrendingUp className="w-8 h-8 text-[#64FFDA] opacity-60" />
        </div>

        <div className="bg-white/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#00E676] block">GLOBAL OPERATIONAL REVENUE</span>
            <span className="text-xl md:text-2xl font-extrabold font-mono text-white">₹42,520</span>
            <span className="text-[9px] text-gray-500 font-mono block">Month-to-date Ledger</span>
          </div>
          <DollarSign className="w-8 h-8 text-emerald-400 opacity-65 font-bold" />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-gray-400 block">GRID THERMAL HEALTH</span>
            <span className="text-xl md:text-2xl font-extrabold font-mono text-white">{averageGridTemp}°C</span>
            {averageGridTemp > 35 ? (
              <span className="text-[9px] text-rose-400 font-mono block animate-pulse">⚠️ THERMAL STRESS DETECTED</span>
            ) : (
              <span className="text-[9px] text-[#00E676] font-mono block">● Grid Thermal Safety OK</span>
            )}
          </div>
          <Flame className={`w-8 h-8 opacity-60 ${averageGridTemp > 35 ? "text-rose-400" : "text-gray-400"}`} />
        </div>

      </div>

      {/* Tabs list anchors */}
      <div className="flex border-b border-slate-900 pb-4 justify-start space-x-6 text-xs font-mono mb-6">
        <button
          onClick={() => setActiveTab("stations")}
          className={`pb-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${activeTab === "stations" ? "text-[#00E676] font-bold border-b-2 border-[#00E676]" : "text-gray-400 hover:text-white"}`}
        >
          <Settings className="w-4.5 h-4.5 text-[#00E676]" />
          <span>Station operations</span>
        </button>
        <button
          onClick={() => setActiveTab("pricing")}
          className={`pb-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${activeTab === "pricing" ? "text-[#64FFDA] font-bold border-b-2 border-[#64FFDA]" : "text-gray-400 hover:text-white"}`}
        >
          <DollarSign className="w-4.5 h-4.5 text-cyan-400" />
          <span>Grid dynamic pricing</span>
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${activeTab === "analytics" ? "text-white font-bold border-b-2 border-white" : "text-gray-400 hover:text-white"}`}
        >
          <BarChart3 className="w-4.5 h-4.5 text-orange-400" />
          <span>Macro Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab("support")}
          className={`pb-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${activeTab === "support" ? "text-yellow-400 font-bold border-b-2 border-yellow-400" : "text-gray-400 hover:text-white"}`}
        >
          <MessageSquare className="w-4.5 h-4.5 text-yellow-400" />
          <span>Ticket responder ({tickets.filter(t=>t.status!=="Resolved").length})</span>
        </button>
      </div>

      {/* RENDER DETAILED TAB CONTENT */}
      <div>
        
        {/* TAB 1: STATION OPERATIONS & STATUS TOGGLES */}
        {activeTab === "stations" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: List stations with status switches and temp sliders */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-sm font-bold font-mono text-white">Active Grid Locations Configs</h3>
                
                <div className="space-y-4">
                  {stations.map((st) => (
                    <div 
                      key={st.id} 
                      className="p-5 rounded-2xl bg-slate-900/40 border border-slate-850 space-y-4 hover:border-slate-800 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold font-mono text-white">{st.name}</h4>
                          <span className="text-[10px] text-gray-400 font-mono">Location coordinates x:{st.longitude} y:{st.latitude}</span>
                        </div>

                        {/* Status Toggle buttons */}
                        <div className="flex gap-1.5 p-1 bg-black/40 backdrop-blur-md rounded-xl max-w-xs">
                          {(["Online", "Offline", "Maintenance"] as const).map((stat) => (
                            <button
                              key={stat}
                              onClick={() => onUpdateStationStatus(st.id, stat)}
                              className={`py-1 px-3 text-[9px] font-mono font-bold rounded-lg transition-colors cursor-pointer ${st.status === stat ? "bg-white/10 text-[#00E676]" : "text-gray-400 hover:text-white"}`}
                            >
                              {stat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Coolant Sensors slider */}
                      <div className="pt-3 border-t border-slate-950/20 space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-gray-400 flex items-center space-x-1">
                            <Flame className={`w-3.5 h-3.5 ${st.temperature > 40 ? "text-rose-400 animate-pulse" : "text-orange-400"}`} />
                            <span>COOLDOWN PUMP THERMALS SENSOR ({st.temperature}°C)</span>
                          </span>
                          {st.temperature > 40 ? (
                            <span className="text-[9px] bg-rose-950 text-rose-400 font-bold border border-rose-900/30 px-1.5 py-0.2 rounded animate-bounce">
                              ⚠️ THERMAL STRESS CRITICAL
                            </span>
                          ) : (
                            <span className="text-[#00E676]">Sensor Normal</span>
                          )}
                        </div>
                        <input
                          type="range"
                          min={20}
                          max={50}
                          value={st.temperature}
                          onChange={(e) => onUpdateStationTemp(st.id, parseFloat(e.target.value))}
                          className="w-full accent-orange-500 bg-slate-950 h-1 rounded"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Build and append a brand new custom station */}
              <div className="lg:col-span-5 bg-slate-950/60 p-5 border border-slate-850 rounded-2xl space-y-4">
                <span className="text-xs font-mono font-bold text-gray-350 uppercase block border-b border-slate-900 pb-2">Deploy New Charging Node Hub</span>
                
                <form onSubmit={handleCreateStationSubmit} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-gray-400 uppercase">Registered Hub Name</label>
                    <input
                      type="text"
                      required
                      value={newStationName}
                      onChange={(e) => setNewStationName(e.target.value)}
                      placeholder="e.g. Pune Smart-Highway DC Plaza"
                      className="w-full bg-[#121E31]/55 border border-slate-800 py-2.5 px-3 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-gray-400 uppercase">Station Address</label>
                    <input
                      type="text"
                      required
                      value={newStationAddress}
                      onChange={(e) => setNewStationAddress(e.target.value)}
                      placeholder="Highway Exit 4B near Toll plaza"
                      className="w-full bg-[#121E31]/55 border border-slate-800 py-2.5 px-3 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-gray-400">BASE PRICE TARIFF (₹ / kWh)</label>
                    <input
                      type="number"
                      required
                      value={newStationBasePrice}
                      onChange={(e) => setNewStationBasePrice(parseInt(e.target.value))}
                      className="w-full bg-[#121E31]/55 border border-slate-800 py-2.5 px-3 rounded-lg text-white font-mono"
                    />
                  </div>

                  {/* Coordinates mapping sliders */}
                  <div className="grid grid-cols-2 gap-3 pb-2 border-b border-slate-900">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-gray-500">RADAR MAP X (LONG: {newStationX}%)</label>
                      <input
                        type="range"
                        min={15}
                        max={85}
                        value={newStationX}
                        onChange={(e) => setNewStationX(parseInt(e.target.value))}
                        className="w-full h-1 accent-[#64FFDA] bg-slate-900 rounded"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-gray-500">RADAR MAP Y (LAT: {newStationY}%)</label>
                      <input
                        type="range"
                        min={15}
                        max={85}
                        value={newStationY}
                        onChange={(e) => setNewStationY(parseInt(e.target.value))}
                        className="w-full h-1 accent-[#00E676] bg-slate-900 rounded"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#00E676] text-[#0b1220] py-3 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer text-center flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span>Deplate Hub to Radar Grid</span>
                  </button>
                </form>
              </div>

            </div>

            {/* NEW: DYNAMIC LOAD BALANCING OPERATOR COCKPIT SECTION */}
            <div className="bg-[#121E31]/40 border border-white/10 rounded-2xl p-6 space-y-6 mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-[#00E676] animate-pulse"></span>
                    <h3 className="text-sm font-bold font-mono text-white tracking-wide uppercase">Real-Time Grid Load Balancing & Peak Shaving</h3>
                  </div>
                  <p className="text-xs text-gray-400">Distributes power across slots dynamically to prevent transformer overload, decrease temperature, and save cost.</p>
                </div>

                {/* Switch Button */}
                <div className="flex items-center space-x-3 bg-black/40 px-4 py-2.5 rounded-xl border border-white/5 shrink-0">
                  <span className={`text-xs font-mono font-bold ${loadBalancingActive ? "text-[#00E676]" : "text-gray-400"}`}>
                    {loadBalancingActive ? "DYNAMIC CONTROLS UP" : "UNREGULATED DRAW"}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={loadBalancingActive}
                      onChange={(e) => onToggleLoadBalancing?.(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-450 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00E676] peer-checked:after:bg-[#0b1220]"></div>
                  </label>
                </div>
              </div>

              {/* Grid load balancing visual meter */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
                
                {/* Simulated Grid Metrics comparison */}
                <div className="md:col-span-4 bg-black/40 p-4 border border-white/5 rounded-xl space-y-4">
                  <span className="text-[10px] text-gray-400 font-mono block uppercase font-bold tracking-wider">Sub-station Telemetry Specs</span>
                  
                  <div className="space-y-3 font-mono">
                    <div>
                      <span className="text-gray-500 block">Total Grid safe limit:</span>
                      <span className="text-sm font-extrabold text-white">800.0 kW</span>
                    </div>

                    <div>
                      <span className="text-gray-500 block">Sum Charge bays draw:</span>
                      <span className={`text-sm font-extrabold ${loadBalancingActive ? "text-emerald-400" : "text-rose-400 animate-pulse"}`}>
                        {loadBalancingActive ? "584.0 kW (Safe)" : "1,140.0 kW (Overload!)"}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 block">Grid Stabilizer factor:</span>
                      <span className="text-sm font-extrabold text-cyan-400">
                        {loadBalancingActive ? "96.4% Optimized" : "Risk: Loss of Load"}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 block">Sub-station temperature:</span>
                      <span className={`text-sm font-extrabold ${loadBalancingActive ? "text-[#00E676]" : "text-rose-500 animate-bounce"}`}>
                        {loadBalancingActive ? "30.4 °C (Normal)" : "48.2 °C (Critical Heat Warning!)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Animated graphic representation of active slot allocation */}
                <div className="md:col-span-8 space-y-4">
                  <span className="text-[10px] text-gray-400 font-mono block uppercase font-bold tracking-wider">Dynamically Allocated Power distribution per Slot</span>
                  
                  <div className="space-y-3.5">
                    {[
                      { name: "Supercharger Bay 1", peak: 250, balanced: 125, active: true },
                      { name: "Supercharger Bay 2", peak: 250, balanced: 125, active: false },
                      { name: "Ultra CCS Slot 3", peak: 150, balanced: 100, active: true },
                      { name: "Standard AC Slot 4", peak: 22, balanced: 22, active: true },
                      { name: "Hyper CCS Bay A (st-3)", peak: 350, balanced: 180, active: true },
                      { name: "Hyper CCS Bay B (st-3)", peak: 350, balanced: 180, active: true },
                    ].map((item, id) => {
                      const percentage = loadBalancingActive 
                        ? (item.balanced / 350) * 100 
                        : (item.peak / 350) * 100;

                      return (
                        <div key={id} className="space-y-1.5 font-mono">
                          <div className="flex justify-between text-[10.5px]">
                            <span className="text-gray-300 font-semibold">{item.name} {item.active ? "🟢 [Active]" : "⚪ [Idle]"}</span>
                            <span className={loadBalancingActive ? "text-[#10e6a0]" : "text-rose-400"}>
                              {loadBalancingActive ? `${item.balanced} kW / Throttled` : `${item.peak} kW / Unregulated`}
                            </span>
                          </div>

                          <div className="w-full bg-black/30 h-3 rounded-full overflow-hidden p-0.5 border border-white/5 relative">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${loadBalancingActive ? "bg-gradient-to-r from-emerald-500 to-[#00E676]" : "bg-gradient-to-r from-orange-500 to-rose-500 animate-pulse"}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* TAB 2: DYNAMIC TARIFF ENGINE */}
        {activeTab === "pricing" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: active pricing multipliers */}
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-sm font-bold font-mono text-white">Active Grid Demand Rules List</h3>
                
                <div className="space-y-3">
                  {pricingRules.map((rule) => (
                    <div key={rule.id} className="p-4 rounded-xl border border-slate-850 bg-slate-900/40 text-xs flex justify-between items-center transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-white font-mono">{rule.label}</h4>
                          <span className="text-[9.5px] font-mono text-[#00E676] bg-[#00E676]/5 border border-[#00E676]/10 px-1.5 py-0.2 rounded">
                            {rule.priceMultiplier}x multiplier
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-mono">Applicable hours: {rule.startHour}:00 to {rule.endHour}:00 </p>
                      </div>

                      <button
                        onClick={() => onDeletePricingRule(rule.id)}
                        className="p-2 border border-slate-800 text-rose-400 hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Add price multiplier */}
              <div className="lg:col-span-5 bg-slate-950/60 p-5 border border-slate-850 rounded-2xl space-y-4">
                <span className="text-xs font-mono font-bold text-gray-350 uppercase block border-b border-slate-900 pb-2">Add Hour Demand Rule</span>
                
                <form onSubmit={handleCreatePricingRuleSubmit} className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-gray-400">TIE LABEL / TITLE</label>
                    <input
                      type="text"
                      required
                      value={pricingLabel}
                      onChange={(e) => setPricingLabel(e.target.value)}
                      placeholder="e.g. Afternoon Summer Peak"
                      className="w-full bg-[#121E31]/55 border border-slate-800 py-2.5 px-3 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-gray-400">GRID WEIGHT MULTIPLIER (e.g. 1.35x)</label>
                    <input
                      type="number"
                      step={0.05}
                      min={0.5}
                      max={2.5}
                      required
                      value={pricingMultiplier}
                      onChange={(e) => setPricingMultiplier(parseFloat(e.target.value))}
                      className="w-full bg-[#121E31]/55 border border-slate-800 py-2.5 px-3 rounded-lg text-white font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-gray-500">START HOUR (0-23)</label>
                      <input
                        type="number"
                        min={0}
                        max={23}
                        required
                        value={pricingStartHour}
                        onChange={(e) => setPricingStartHour(parseInt(e.target.value))}
                        className="w-full bg-[#121E31]/55 border border-slate-800 py-2 px-3 rounded-lg text-white font-mono text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-gray-500">END HOUR (1-24)</label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        required
                        value={pricingEndHour}
                        onChange={(e) => setPricingEndHour(parseInt(e.target.value))}
                        className="w-full bg-[#121E31]/55 border border-slate-800 py-2 px-3 rounded-lg text-white font-mono text-center"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#64FFDA] text-[#0b1220] py-3 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer text-center"
                  >
                    Deploy Dynamic Rule
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: GRID STATS & ANALYTICS CHARTS */}
        {activeTab === "analytics" && (
          <div className="space-y-6 text-xs">
            
            {/* Visual Peak Hours Demand diagram representation using standard CSS flex graph bars */}
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-950/20">
                <div>
                  <h4 className="font-bold text-white font-mono">24-Hour Grid Utilization Forecast</h4>
                  <span className="text-[10px] text-gray-500 font-mono">Simulated power draw metrics across clean-grid hubs</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-950 text-[#00E676] px-2 py-0.5 rounded border border-[#00E676]/10">
                  Forecast Optimizer OK
                </span>
              </div>

              <div className="flex items-end h-40 pt-4 gap-1 relative z-10 select-none">
                {[20, 15, 10, 5, 12, 28, 45, 68, 78, 85, 82, 75, 68, 72, 80, 88, 95, 98, 92, 84, 70, 55, 38, 24].map((load, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end items-center h-full group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-950/95 border border-slate-800 p-2 rounded text-[9px] font-mono hidden group-hover:block z-20 whitespace-nowrap shadow-xl">
                      Time: {i}:00<br />
                      Load output: {load}%<br />
                      Grid: {load > 80 ? "Peak Risk" : "Optimized"}
                    </div>
                    
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-300 ${load > 85 ? "bg-rose-500" : load > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                      style={{ height: `${load}%` }}
                    ></div>
                    
                    <span className="text-[8px] text-gray-500 font-mono mt-2 flex justify-center w-full scale-90">
                      {i % 4 === 0 ? `${i}h` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated revenue block and statistics logs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl space-y-3">
                <span className="font-mono text-gray-400 block font-bold uppercase tracking-wider text-[10px]">Premium Active Sessions Log</span>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {[
                    { id: "s-11", station: "BlueVolt Supercharge Plaza", slot: "Supercharger Bay 1", power: "250 kW", soc: "84%", user: "Aniket Patil" },
                    { id: "s-12", station: "GreenDrive Tech Galleria", slot: "Fast CCS Bay A", power: "150 kW", soc: "45%", user: "Elena Rostova" },
                    { id: "s-13", station: "PowerSync HyperCharge Hub", slot: "CHAdeMO Fast Slot", power: "100 kW", soc: "90%", user: "Rahul Sharma" }
                  ].map((actS) => (
                    <div key={actS.id} className="p-3 bg-slate-950/30 border border-slate-880 rounded-xl flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-white font-mono text-xs">{actS.station}</h4>
                        <span className="text-[9.5px] text-gray-500 font-mono block mt-0.5">{actS.slot} • Driver: {actS.user}</span>
                      </div>
                      <span className="text-[10px] bg-emerald-950 text-[#00E676] font-mono px-2 py-0.5 rounded font-bold">
                        {actS.soc} SOC (Lck)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 p-6 rounded-2xl space-y-3.5 shadow-md">
                <span className="font-mono text-gray-400 block font-bold uppercase tracking-wider text-[10px]">Real-Time Maintenance Log</span>
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-350 rounded-xl space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold font-mono">
                    <ShieldAlert className="w-4 h-4 text-rose-450 animate-pulse" />
                    <span>Active Cooling Pumps Alert limits exceeded</span>
                  </div>
                  <p className="text-[11px] leading-relaxed block text-rose-300">
                    EcoPoint Green Hub Temp Sensors registered sustained **42.8°C** cooldown pipe temperature. Auto shutdown override has been committed recursively at station level. Online crew has been dispatched for pump coolant calibration.
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: TICKETING RESPONDER CENTER */}
        {activeTab === "support" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Tickets list */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-sm font-bold font-mono text-white">Submitted Tickets Queue ({tickets.length})</h3>
                
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {tickets.map((t) => {
                    const isSelect = selectedTicketId === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicketId(t.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelect ? "bg-[#121E31]/75 border-yellow-400" : "bg-slate-900/40 border-slate-850 hover:border-slate-800"}`}
                      >
                        <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                          <span className="text-gray-400">ID: {t.id}</span>
                          <span className={`px-1.5 py-0.2 rounded font-mono font-bold ${t.status === "Open" ? "bg-rose-950 text-rose-400" : t.status === "Resolved" ? "bg-emerald-950 text-emerald-400" : "bg-cyan-950 text-cyan-400"}`}>
                            {t.status}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white font-mono">{t.title}</h4>
                        <p className="text-[10px] text-gray-500 font-mono mt-1">Creator: {t.userEmail.split("@")[0]}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Respond panel */}
              <div className="lg:col-span-7 bg-slate-950/60 p-5 border border-slate-850 rounded-2xl min-h-[340px] flex flex-col justify-between">
                {selectedTicket ? (
                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[220px] pb-4">
                      <div className="border-b border-slate-900 pb-3">
                        <span className="text-[9px] font-mono text-gray-500 block">TICKET DISPATCH DESCRIPTION</span>
                        <h4 className="text-sm font-bold font-mono text-white mt-1">"{selectedTicket.title}"</h4>
                        <p className="text-xs text-gray-300 leading-relaxed mt-1.5 font-sans bg-[#0c1322] p-3 rounded-xl border border-slate-880">
                          {selectedTicket.description}
                        </p>
                      </div>

                      {/* Conversations replies */}
                      <div className="space-y-3 text-xs">
                        <span className="text-[10px] font-mono text-gray-400 font-bold uppercase block">Interactive Thread Logs</span>
                        {selectedTicket.replies.map((rep) => (
                          <div key={rep.id} className={`p-3 rounded-xl ${rep.sender === "Admin" ? "bg-emerald-950/20 text-gray-200 border border-emerald-900/30 ml-4" : "bg-slate-905/30 border border-slate-850 text-gray-300 mr-4"}`}>
                            <div className="flex justify-between text-[9px] font-mono text-gray-550 mb-0.5">
                              <span>Sender: {rep.sender}</span>
                              <span>{new Date(rep.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <p className="leading-relaxed block text-xs">{rep.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Template helper responder */}
                    <div className="bg-slate-900/60 border border-slate-850 p-3 rounded-xl flex justify-between items-center text-[10px] font-mono mb-2">
                      <span className="text-cyan-400 flex items-center">
                        <Cpu className="w-3.5 h-3.5 mr-1 text-[#00E676] animate-pulse" />
                        AI Helper Quick Response Proposal
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedTicket.category === "Payment Refund") {
                            setTicketReplyInput("Hi, I checked our bank gateway logs and found the double ledger hold. I've initiated an automated reversal of ₹813.6 which will process back to your card within 2 days. Sincere apologies!");
                          } else if (selectedTicket.category === "Station Offline") {
                            setTicketReplyInput("Hello, EcoPoint is offline for pump replacements due to temperature trigger warnings. Crews are active; expected recovery scheduled by tomorrow afternoon.");
                          } else {
                            setTicketReplyInput("Hello, our operations team is looking into this parameter fault immediately to release cables.");
                          }
                        }}
                        className="text-[#64FFDA] hover:underline"
                      >
                        Auto-fill AI draft
                      </button>
                    </div>

                    {/* Reply submit form */}
                    <form onSubmit={handleReplySubmit} className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={ticketReplyInput}
                        onChange={(e) => setTicketReplyInput(e.target.value)}
                        placeholder="Type response back to user account..."
                        className="flex-1 bg-[#121E31]/55 border border-slate-800 text-xs py-3 px-3 rounded-xl focus:border-cyan-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-6 py-3 bg-[#00E676] hover:opacity-90 transition-opacity text-[#0b1220] text-xs font-mono font-bold rounded-xl cursor-pointer"
                      >
                        Send Reply
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-3 py-12 text-gray-500">
                    <MessageSquare className="w-12 h-12 text-slate-800" />
                    <p className="text-xs font-mono italic">Select any active driver ticket queue on the left to review ledger details and dispatch answers.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
