import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { UserState, LiveSession, SupportTicket, ChargingHistoryItem, Booking } from "../types";
import { BatteryCharging, ShieldAlert, CheckCircle, Zap, Leaf, Award, HelpCircle, Loader2, Send, MessageSquare, Plus, FileText, ChevronRight, Ban } from "lucide-react";

interface DashboardProps {
  userState: UserState;
  activeSession: LiveSession | null;
  tickets: SupportTicket[];
  onStopSession: (bookingId: string, finalSoc: number, finalCost: number, energyDeliveredKwh: number) => void;
  onPauseSession: () => void;
  onResumeSession: () => void;
  onSubmitTicket: (category: SupportTicket["category"], title: string, desc: string) => void;
}

export default function Dashboard({ userState, activeSession, tickets, onStopSession, onPauseSession, onResumeSession, onSubmitTicket }: DashboardProps) {
  // Tabs: "control" | "co2" | "support"
  const [activeTab, setActiveTab] = useState<"control" | "co2" | "support">("control");

  // Support ticket state
  const [ticketCategory, setTicketCategory] = useState<SupportTicket["category"]>("Charging Issue");
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  // Chat conversation state list
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "model"; text: string }[]>([
    { role: "model", text: "Hello! I am ChargeFlow AI, your operational EV copilot. If you encountered redundant UPI checkouts, socket locks, or heat issues, clarify here." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  // Auto-increment Charging loop tracker if active
  useEffect(() => {
    if (!activeSession || activeSession.status !== "Charging") return;

    const interval = setInterval(() => {
      if (activeSession.currentSoc >= activeSession.targetSoc) {
        // Automatically stop / complete session
        onStopSession(
          activeSession.bookingId, 
          activeSession.currentSoc, 
          activeSession.costIncurred, 
          activeSession.energyDeliveredKwh
        );
        clearInterval(interval);
        return;
      }

      // Increment progress variables moderately
      const incrementPercent = 1;
      const stepSoc = Math.min(activeSession.targetSoc, activeSession.currentSoc + incrementPercent);
      const kwhIncrement = parseFloat((activeSession.energyDeliveredKwh + 0.35).toFixed(2));
      const costIncrement = parseFloat((activeSession.costIncurred + 5.6).toFixed(2));
      
      // Update the active session details locally!
      // Since it's mutated in React parent state, let's trigger stop automatically if full,
      // or manually let it run. To ensure state changes properly we'll mutate variables
      activeSession.currentSoc = stepSoc;
      activeSession.energyDeliveredKwh = kwhIncrement;
      activeSession.costIncurred = costIncrement;
      activeSession.timeRemainingSeconds = Math.max(0, activeSession.timeRemainingSeconds - 12);
      activeSession.co2SavedKg = parseFloat((kwhIncrement * 0.44).toFixed(1));

    }, 3000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Support Chat submits
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: "user" as const, text: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setSendingChat(true);

    try {
      const response = await fetch("/api/chat-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg]
        })
      });
      const data = await response.json();
      if (data.reply) {
        setChatMessages((prev) => [...prev, { role: "model", text: data.reply }]);
      } else {
        setChatMessages((prev) => [...prev, { role: "model", text: "Something went wrong parsing the AI reply." }]);
      }
    } catch {
      setChatMessages((prev) => [...prev, { role: "model", text: "Offline fallback: Check your browser internet sync parameters." }]);
    } finally {
      setSendingChat(false);
    }
  };

  const handleTicketFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketTitle || !ticketDesc) return;
    setSubmittingTicket(true);
    
    setTimeout(() => {
      onSubmitTicket(ticketCategory, ticketTitle, ticketDesc);
      setTicketTitle("");
      setTicketDesc("");
      setSubmittingTicket(false);
      setTicketSuccess(true);
      setTimeout(() => setTicketSuccess(false), 4000);
    }, 1200);
  };

  return (
    <div id="driver-dashboard" className="frosted-glass backdrop-blur-xl border border-white/10 rounded-3xl p-1 md:p-6 text-gray-100 font-sans shadow-xl">
      
      {/* Tab Switch Headers */}
      <div className="flex border-b border-white/5 pb-4 justify-start space-x-6 text-xs font-mono">
        <button
          onClick={() => setActiveTab("control")}
          className={`pb-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${activeTab === "control" ? "text-[#00E676] font-bold border-b-2 border-[#00E676]" : "text-gray-400 hover:text-white"}`}
        >
          <BatteryCharging className="w-4.5 h-4.5 text-[#00E676]" />
          <span>Active Loop controls</span>
        </button>
        <button
          onClick={() => setActiveTab("co2")}
          className={`pb-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${activeTab === "co2" ? "text-emerald-400 font-bold border-b-2 border-emerald-400" : "text-gray-400 hover:text-white"}`}
        >
          <Leaf className="w-4.5 h-4.5 text-emerald-400" />
          <span>Carbon Footprint</span>
        </button>
        <button
          onClick={() => setActiveTab("support")}
          className={`pb-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${activeTab === "support" ? "text-[#64FFDA] font-bold border-b-2 border-[#64FFDA]" : "text-gray-400 hover:text-white"}`}
        >
          <MessageSquare className="w-4.5 h-4.5 text-cyan-400" />
          <span>Support Desk Chat</span>
        </button>
      </div>

      {/* RENDER ACTIVE TAB CODES */}
      <div className="pt-6">
        
        {/* TAB 1: ACTIVE CHARGING CONTROL */}
        {activeTab === "control" && (
          <div className="space-y-6">
            {activeSession ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Visual loop percentage gauge */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center bg-white/5 backdrop-blur-md p-6 border border-white/10 rounded-2xl">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    
                    {/* SVG Radial Battery Gauge background */}
                    <svg className="absolute w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="64"
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="64"
                        fill="none"
                        stroke="#00E676"
                        strokeWidth="8"
                        strokeDasharray={402.1}
                        strokeDashoffset={402.1 - (402.1 * activeSession.currentSoc) / 100}
                        style={{ transition: "stroke-dashoffset 1s ease" }}
                      />
                    </svg>

                    <div className="text-center z-10 space-y-1">
                      <Zap className="w-6 h-6 text-[#00E676] mx-auto animate-pulse select-none" />
                      <span className="text-3xl font-extrabold font-mono tracking-tight text-white select-all">{activeSession.currentSoc}%</span>
                      <span className="text-[9.5px] block font-mono text-gray-400 uppercase tracking-widest leading-none">STATE OF CHARGE</span>
                    </div>
                  </div>

                  {/* Charging Status tags */}
                  <div className="mt-4 text-center">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-mono shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>DOCK ACTIVE: {activeSession.status.toUpperCase()}</span>
                    </span>
                  </div>

                  {/* Emergency Termination Release Button */}
                  <div className="mt-6 w-full pt-4 border-t border-white/5 flex justify-center">
                    <button
                      onClick={() => onStopSession(activeSession.bookingId, activeSession.currentSoc, activeSession.costIncurred, activeSession.energyDeliveredKwh)}
                      className="w-full bg-rose-500/10 border border-rose-500/20 text-rose-450 hover:bg-rose-500 hover:text-[#0b1220] py-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <Ban className="w-4 h-4" />
                      <span>Terminate Charge (Stop)</span>
                    </button>
                  </div>
                </div>

                {/* Live energy telemetry dashboard info */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-xl">
                    <div>
                      <span className="text-[10px] font-mono text-gray-400 block">CURRENT STATION LOCATION</span>
                      <h4 className="text-sm font-extrabold font-mono text-white mt-0.5">{activeSession.stationName}</h4>
                    </div>
                    <span className="text-xs bg-[#64FFDA]/10 text-[#64FFDA] py-1 px-3 border border-[#64FFDA]/20 font-mono rounded-lg">
                      {activeSession.slotName}
                    </span>
                  </div>

                  {/* Telemetry Numbers Grid with motion.div stagger entrance */}
                  <motion.div 
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.08
                        }
                      }
                    }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-4"
                  >
                    <motion.div 
                      variants={{
                        hidden: { opacity: 0, y: 15 },
                        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
                      }}
                      className="bg-white/5 p-4.5 rounded-xl border border-white/5 shadow-md"
                    >
                      <span className="text-[10px] font-mono text-gray-400 block">DELIVERED ENERGY</span>
                      <span className="text-xl font-bold font-mono text-gray-200 block">{activeSession.energyDeliveredKwh} kWh</span>
                    </motion.div>

                    <motion.div 
                      variants={{
                        hidden: { opacity: 0, y: 15 },
                        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
                      }}
                      className="bg-white/5 p-4.5 rounded-xl border border-white/5 shadow-md"
                    >
                      <span className="text-[10px] font-mono text-gray-400 block">CHARGING RATE</span>
                      <span className="text-xl font-bold font-mono text-[#00E676] block">+{activeSession.chargingRateKw} kW DC</span>
                    </motion.div>

                    <motion.div 
                      variants={{
                        hidden: { opacity: 0, y: 15 },
                        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
                      }}
                      className="bg-white/5 p-4.5 rounded-xl border border-white/5 shadow-md"
                    >
                      <span className="text-[10px] font-mono text-gray-400 block">EST ACCRUED COST</span>
                      <span className="text-xl font-bold font-mono text-gray-200 block">₹{activeSession.costIncurred}</span>
                    </motion.div>

                    <motion.div 
                      variants={{
                        hidden: { opacity: 0, y: 15 },
                        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
                      }}
                      className="bg-white/5 p-4.5 rounded-xl border border-white/5 shadow-md"
                    >
                      <span className="text-[10px] font-mono text-gray-400 block">CO2 OFFSET INDEX</span>
                      <span className="text-xl font-bold font-mono text-emerald-400 block">-{activeSession.co2SavedKg} kg CO₂</span>
                    </motion.div>

                    <motion.div 
                      variants={{
                        hidden: { opacity: 0, y: 15 },
                        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
                      }}
                      className="bg-white/5 p-4.5 rounded-xl border border-white/5 shadow-md"
                    >
                      <span className="text-[10px] font-mono text-gray-400 block">TIME REMAINING</span>
                      <span className="text-xl font-bold font-mono text-gray-250 block">
                        {Math.floor(activeSession.timeRemainingSeconds / 60)}m {activeSession.timeRemainingSeconds % 60}s
                      </span>
                    </motion.div>

                    <motion.div 
                      variants={{
                        hidden: { opacity: 0, y: 15 },
                        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
                      }}
                      className="bg-white/5 p-4.5 rounded-xl border border-white/5 shadow-md"
                    >
                      <span className="text-[10px] font-mono text-gray-400 block">TARGET LIMIT</span>
                      <span className="text-xl font-bold font-mono text-[#64FFDA] block">Stop @ {activeSession.targetSoc}%</span>
                    </motion.div>
                  </motion.div>

                  {/* Simulator Controls */}
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-400">Simulate Loop Operations:</span>
                    <div className="flex space-x-2.5 bg-transparent p-0.5 rounded-lg">
                      {activeSession.status === "Charging" ? (
                        <button
                          onClick={onPauseSession}
                          className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-gray-300 font-bold bg-transparent transition-all cursor-pointer"
                        >
                          Pause charging
                        </button>
                      ) : (
                        <button
                          onClick={onResumeSession}
                          className="px-4 py-2 bg-emerald-500 text-[#0B1220] rounded-lg font-bold hover:bg-emerald-400 transition-colors cursor-pointer"
                        >
                          Resume Charging
                        </button>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              <div className="p-12 text-center bg-white/5 border border-dashed border-white/10 rounded-3xl space-y-4">
                <BatteryCharging className="w-16 h-16 text-gray-500 mx-auto animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white font-mono">No Active Charging Session</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                    You have no live plugs locks scheduled. Search of stations, choose convenient rates slots from the side selector, and initiate the booking checkouts.
                  </p>
                </div>
              </div>
            )}

            {/* Drivers Historic Bookings records */}
            <div className="pt-6 border-t border-white/5 space-y-4">
              <h3 className="text-sm font-bold font-mono text-white flex items-center">
                <FileText className="w-4.5 h-4.5 mr-2 text-[#64FFDA]" />
                <span>My Charging Activities History</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userState.history.map((hist) => (
                  <div key={hist.id} className="bg-white/5 p-4 rounded-xl border border-white/5 text-xs flex justify-between items-center hover:border-white/10 transition-colors shadow">
                    <div className="space-y-1">
                      <h4 className="font-bold text-white font-mono">{hist.stationName}</h4>
                      <p className="text-[10px] text-gray-400 font-mono">Date: {hist.date} • {hist.durationMins} mins duration</p>
                    </div>

                    <div className="text-right">
                      <span className="block font-bold text-white font-mono">₹{hist.cost}</span>
                      <span className="block text-[10px] text-emerald-400 font-mono">-{hist.co2SavedKg} kg CO₂</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: CARBON FOOTPRINT & BADGES */}
        {activeTab === "co2" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              
              {/* CO2 Stats Left Column */}
              <div className="bg-white/5 p-6 border border-white/5 rounded-2xl space-y-6">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Driver Impact Report</span>
                  <h3 className="text-xl font-bold text-white font-mono mt-1">Total Carbon Footprint Saved</h3>
                  <p className="text-xs text-gray-400 leading-relaxed mt-2">
                    Every localized kilowatt of green electric energy generated replaces approximately 1.2 kg of combusted carbon emissions generated by premium displacement ICE cars.
                  </p>
                </div>

                {/* Big cumulative badge numbers */}
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between shadow-inner">
                  <div>
                    <span className="text-[10px] text-gray-400 font-mono uppercase">Cumulative Savings</span>
                    <span className="text-4xl font-extrabold font-mono text-emerald-400 block mt-1 tracking-tight">
                      {userState.history.reduce((a, b) => a + b.co2SavedKg, 0).toFixed(1)} <span className="text-xs font-sans font-normal text-gray-450">kg CO₂</span>
                    </span>
                  </div>
                  <Award className="w-12 h-12 text-[#64FFDA] drop-shadow-[0_0_12px_rgba(100,255,218,0.3)] animate-bounce" />
                </div>

                <div className="space-y-2.5 text-xs text-gray-300">
                  <div className="flex justify-between font-mono">
                    <span>Equiv Trees Propagated:</span>
                    <span className="text-[#00E676] font-bold">~{Math.round(userState.history.reduce((a, b) => a + b.co2SavedKg, 0) / 1.5)} Saplings</span>
                  </div>
                  <div className="flex justify-between font-mono border-t border-white/5 pt-2.5">
                    <span>Clean Electric Miles Driven:</span>
                    <span className="text-white">~{Math.round(userState.history.reduce((a, b) => a + b.energyKwh, 0) * 4.2)} miles</span>
                  </div>
                </div>
              </div>

              {/* Badges Milestones Right Column */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono font-bold text-gray-450 uppercase tracking-wider">Unsealed Environmental Badges</h4>
                
                <div className="space-y-3">
                  {[
                    { name: "Eco Catalyst", desc: "Saved over 10 kg of CO2 emissions from entering atmosphere.", bound: 10, unlocked: true },
                    { name: "Carbon Negative Driver", desc: "Completed 2 cumulative super charging session loops.", bound: 25, unlocked: true },
                    { name: "Pure Green Pioneer", desc: "Accumulated more than 50 kg of raw CO2 grid offset metrics.", bound: 50, unlocked: false }
                  ].map((badge) => (
                    <div 
                      key={badge.name} 
                      className={`p-4 border rounded-xl flex items-center justify-between transition-all ${badge.unlocked ? "bg-white/5 border-emerald-500/20 text-white shadow-md" : "opacity-45 bg-transparent border-white/5"}`}
                    >
                      <div className="flex items-center space-x-3">
                        <Award className={`w-8 h-8 ${badge.unlocked ? "text-emerald-400" : "text-gray-500"}`} />
                        <div>
                          <h4 className="text-sm font-bold font-mono">{badge.name}</h4>
                          <p className="text-[11px] text-gray-400 mt-0.5">{badge.desc}</p>
                        </div>
                      </div>

                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-black/40">
                        {badge.unlocked ? "✅ OWNED" : "🔒 LOCKED"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER SUPPORT CHAT SANDBOX & TICKETS */}
        {activeTab === "support" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Form file ticket and status list */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4 shadow-md">
                  <h4 className="text-xs font-bold font-mono text-white">File Operational Support Ticket</h4>
                  
                  {ticketSuccess && (
                    <div className="p-3 text-xs bg-emerald-900/10 border border-emerald-500/20 text-emerald-400 rounded-lg font-mono">
                      Ticket logged successfully! Admins has been dispatched.
                    </div>
                  )}

                  <form onSubmit={handleTicketFormSubmit} className="space-y-3.5 text-xs">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-gray-400 uppercase">Issue Category</label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value as any)}
                        className="w-full bg-[#121E31]/90 border border-white/10 text-xs py-2.5 px-3 rounded-lg text-white font-mono focus:outline-none focus:border-[#00E676] [&>option]:bg-[#0c1322] [&>option]:text-white"
                      >
                        <option value="Charging Issue">Charging Issue / Cable Locks</option>
                        <option value="Payment Refund">Payment Refund</option>
                        <option value="App Bug">Software / App Bug</option>
                        <option value="Station Offline">Station Offline Status</option>
                        <option value="Other">Other Query</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-gray-400">TICKET TITLE</label>
                      <input
                        type="text"
                        required
                        value={ticketTitle}
                        onChange={(e) => setTicketTitle(e.target.value)}
                        placeholder="e.g. Double debate on UPI"
                        className="w-full bg-white/5 border border-white/10 py-2.5 px-3 rounded-lg text-white font-mono focus:outline-none focus:border-[#00E676]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-gray-400">PROBLEM STATEMENT DETAILS</label>
                      <textarea
                        required
                        rows={3}
                        value={ticketDesc}
                        onChange={(e) => setTicketDesc(e.target.value)}
                        placeholder="Log references, location info or billing amounts"
                        className="w-full bg-white/5 border border-white/10 py-2.5 px-3 rounded-lg text-white font-mono focus:outline-none focus:border-[#00E676]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-white/5 border border-white/10 hover:bg-[#00E676] hover:text-[#0b1220] transition-colors py-2.5 rounded-lg font-bold font-mono text-[#00E676] cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      {submittingTicket ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      <span>Log Ticket Request</span>
                    </button>
                  </form>
                </div>

                {/* Tickets list */}
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  <h4 className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">Logged Tickets States ({tickets.length})</h4>
                  {tickets.map((t) => (
                    <div key={t.id} className="p-3 border border-white/5 rounded-xl bg-white/[0.02] text-[11px] space-y-1 shadow">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-gray-400">ID: {t.id}</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold uppercase tracking-wide ${t.status === "Resolved" ? "bg-emerald-900/20 text-emerald-400" : "bg-cyan-900/20 text-cyan-400"}`}>
                          {t.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-white block">{t.title}</h4>
                      <p className="text-[10px] text-gray-400 leading-relaxed block">{t.description}</p>
                      
                      {t.replies.length > 0 && (
                        <div className="mt-2 pt-1.5 border-t border-white/5 text-[10px] text-cyan-400 block font-mono">
                          Latest response: "{t.replies[t.replies.length - 1].message}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Conversational AI support assistant sandbox */}
              <div className="lg:col-span-7 bg-white/5 rounded-2xl border border-white/5 p-4.5 flex flex-col justify-between min-h-[380px] shadow-sm relative backdrop-blur-md">
                
                <div className="space-y-2 border-b border-white/5 pb-3 mb-3">
                  <h4 className="text-xs font-bold font-mono text-white flex items-center space-x-1">
                    <MessageSquare className="w-4.5 h-4.5 text-[#00E676]" />
                    <span>Live Driver Support Chatbot</span>
                  </h4>
                  <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
                    Powered by server-side Gemini intelligence. Converses about billing anomaly, heating problems, connector types details, or offline maintenance alerts.
                  </p>
                </div>

                {/* Message list panel */}
                <div className="flex-1 space-y-3 max-h-[260px] overflow-y-auto pr-1 mb-4 select-text">
                  {chatMessages.map((msg, i) => {
                    const isAi = msg.role === "model";
                    return (
                      <div 
                        key={i} 
                        className={`flex ${isAi ? "justify-start" : "justify-end"}`}
                      >
                        <div 
                          className={`p-3 rounded-2xl max-w-sm text-xs leading-relaxed ${isAi ? "bg-[#121E31]/70 text-gray-300 rounded-tl-none border border-white/5" : "bg-[#00E676] text-[#0b1220] rounded-tr-none font-medium"}`}
                        >
                          {msg.text.split("\n").map((line, idx) => (
                            <p key={idx} className="mb-0.5">{line}</p>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {sendingChat && (
                    <div className="flex justify-start">
                      <div className="bg-[#121E31]/30 text-gray-400 p-3 rounded-2xl flex items-center space-x-2 text-xs font-mono border border-white/5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00E676]" />
                        <span>AI representative is composing...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form type controls */}
                <form onSubmit={handleSendChatMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    disabled={sendingChat}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type query: 'What happened to EcoPoint?', 'double charge'"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono focus:outline-none focus:border-emerald-500 text-white"
                  />
                  <button
                    type="submit"
                    disabled={sendingChat || !chatInput.trim()}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-[#00E676] text-gray-300 hover:text-[#0b1220] transition-all cursor-pointer flex items-center justify-center animate-glow"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
