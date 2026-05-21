import { useState, useEffect } from "react";
import { Station, UserState, EVVehicle } from "../types";
import { 
  CheckCircle, ArrowLeftRight, Cpu, Compass, RotateCcw, 
  ShieldCheck, AlertCircle, Sparkles, Navigation, Wallet, 
  Info, Zap, Loader2, Gauge, BatteryCharging 
} from "lucide-react";

interface BatterySwapBayProps {
  stations: Station[];
  userState: UserState;
  onUpdateWallet: (amount: number) => void;
  onAddHistoryItem: (item: any) => void;
  onIncrementStationSwap: (stationId: string) => void;
}

type SwapStep = "idle" | "align" | "unlock" | "extract" | "insert" | "init" | "complete";

export default function BatterySwapBay({
  stations,
  userState,
  onUpdateWallet,
  onAddHistoryItem,
  onIncrementStationSwap,
}: BatterySwapBayProps) {
  // Find stations supporting battery swap
  const swapStations = stations.filter((s) => s.batterySwapAvailable && s.status === "Online");
  
  const [selectedStation, setSelectedStation] = useState<Station | null>(swapStations[0] || null);
  const [selectedVehicle, setSelectedVehicle] = useState<EVVehicle | null>(
    userState.vehicles.find(v => v.id === userState.selectedVehicleId) || userState.vehicles[0] || null
  );
  
  // Simulation states
  const [activeStep, setActiveStep] = useState<SwapStep>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [simulatedOldSoc, setSimulatedOldSoc] = useState(14);
  const [selectedPayment, setSelectedPayment] = useState<"Wallet" | "UPI">("Wallet");

  // Step messages and intervals
  useEffect(() => {
    let timer: any;
    if (activeStep === "align") {
      setProgress(0);
      setStatusMessage("Locking vehicle chassis onto laser-guided pneumatic rails...");
      timer = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(timer);
            setActiveStep("unlock");
            return 100;
          }
          return p + 10;
        });
      }, 300);
    } else if (activeStep === "unlock") {
      setProgress(0);
      setStatusMessage("Unscrewing high-yield titanium locking hex-bolts structural bracket...");
      timer = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(timer);
            setActiveStep("extract");
            return 100;
          }
          return p + 12;
        });
      }, 300);
    } else if (activeStep === "extract") {
      setProgress(0);
      setStatusMessage("Descending hydraulic lift bay. Safely cooling depleted lithium cores...");
      timer = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(timer);
            setActiveStep("insert");
            return 100;
          }
          return p + 10;
        });
      }, 350);
    } else if (activeStep === "insert") {
      setProgress(0);
      setStatusMessage("Inserting fresh certified 100% capacity pre-charged silicon-anode cell...");
      timer = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(timer);
            setActiveStep("init");
            return 100;
          }
          return p + 8;
        });
      }, 400);
    } else if (activeStep === "init") {
      setProgress(0);
      setStatusMessage("Re-coupling structural locks. Injecting CAN-bus firmware handshake...");
      timer = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(timer);
            setActiveStep("complete");
            return 100;
          }
          return p + 15;
        });
      }, 250);
    } else if (activeStep === "complete") {
      setProgress(100);
      setStatusMessage("Swap successfully finished 🌟! Standard drive components initialized.");
      
      // Execute final charge logic once
      if (selectedStation && selectedVehicle) {
        const cost = selectedStation.batterySwapPrice || 500;
        if (selectedPayment === "Wallet") {
          onUpdateWallet(-cost);
        }
        
        onIncrementStationSwap(selectedStation.id);

        const newHist = {
          id: "swap-" + Math.floor(Math.random() * 9000 + 1000),
          stationName: selectedStation.name,
          chargerName: "🔄 Automatic Swap Bay 1",
          date: new Date().toISOString().split("T")[0],
          energyKwh: selectedVehicle.batteryCapacity,
          durationMins: 3, // rapid swap has a flat 3 mins duration
          cost: cost,
          co2SavedKg: parseFloat((selectedVehicle.batteryCapacity * 0.44).toFixed(1)),
        };
        onAddHistoryItem(newHist);
      }
    }

    return () => clearInterval(timer);
  }, [activeStep]);

  const handleStartSwap = () => {
    if (!selectedStation) return;
    const cost = selectedStation.batterySwapPrice || 500;
    
    if (selectedPayment === "Wallet" && userState.walletBalance < cost) {
      alert("⚠️ Your pre-paid Wallet Balance is too low for this shift exchange option. Recharge or change payment method.");
      return;
    }

    // Set a random depleted SoC between 5% and 22% for realistic feedback
    setSimulatedOldSoc(Math.floor(Math.random() * 17) + 5);
    setActiveStep("align");
  };

  const handleReset = () => {
    setActiveStep("idle");
    setProgress(0);
    setStatusMessage("");
  };

  return (
    <div id="battery-swap-routing-bay" className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-1 md:p-6 bg-transparent text-gray-100 font-sans">
      
      {/* Simulation Workspace Panel */}
      <div className="lg:col-span-8 bg-white/5 border border-white/5 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden shadow-xl flex flex-col justify-between">
        
        <div className="space-y-4">
          <div className="flex justify-between items-start border-b border-white/5 pb-4">
            <div>
              <div className="flex items-center space-x-2 text-[#00E676] font-mono text-[10.5px] tracking-widest uppercase">
                <ArrowLeftRight className="w-4.5 h-4.5 text-[#00E676] animate-pulse" />
                <span>ROBOTIC BATTERY SPLITSHIFT EXCHANGE</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold font-mono text-white mt-1">Instant Hot-Swap Terminal</h2>
              <p className="text-xs text-gray-400 mt-1">Ditch charging downtime completely. Exchange depleted cells with certified 100% full packs in under 3 minutes.</p>
            </div>

            <div className="bg-emerald-950/80 border border-emerald-900/30 py-1.5 px-3 rounded-xl hidden sm:block">
              <span className="text-[10px] text-emerald-400 font-mono font-semibold uppercase flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ROBOTICS ACTIVE</span>
              </span>
            </div>
          </div>

          {activeStep === "idle" ? (
            <div className="space-y-6 py-4">
              
              {/* Select swap station */}
              <div className="space-y-2">
                <label className="text-[10.5px] font-mono text-gray-400 uppercase tracking-wider block">1. Select Exchange Depot Location</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {swapStations.map((st) => {
                    const isSelected = selectedStation?.id === st.id;
                    return (
                      <div
                        key={st.id}
                        onClick={() => setSelectedStation(st)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? "bg-white/10 border-[#00E676] shadow-md" : "bg-white/5 border-white/5 hover:bg-white/[0.08]"}`}
                      >
                        <h4 className="text-xs font-bold text-white font-mono">{st.name.split(" ")[0]} Hub</h4>
                        <div className="flex items-center justify-between mt-3 text-[10.5px] font-mono">
                          <span className="text-emerald-400">🔋 {st.availableBatteriesCount} packs</span>
                          <span className="text-gray-400">₹{st.batterySwapPrice}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Select vehicle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10.5px] font-mono text-gray-400 uppercase tracking-wider block">2. Verify Configured EV Bracket</label>
                  <select
                    value={selectedVehicle?.id}
                    onChange={(e) => setSelectedVehicle(userState.vehicles.find(v => v.id === e.target.value) || null)}
                    className="w-full bg-[#121E31]/55 border border-white/10 rounded-xl px-3 py-3 text-xs font-mono focus:border-[#00E676] focus:outline-none"
                  >
                    {userState.vehicles.map(v => (
                      <option key={v.id} value={v.id} className="bg-[#0b1220]">
                        {v.brand} {v.model} ({v.batteryCapacity} kWh)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10.5px] font-mono text-gray-400 uppercase tracking-wider block">3. Transaction Protocol</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedPayment("Wallet")}
                      className={`py-2 px-3.5 border rounded-xl font-mono text-xs cursor-pointer flex items-center justify-center space-x-1 ${selectedPayment === "Wallet" ? "bg-cyan-950/40 border-cyan-500 text-cyan-400" : "bg-white/5 border-white/5 text-gray-400"}`}
                    >
                      <Wallet className="w-3.5 h-3.5 shrink-0" />
                      <span>Wallet Balance</span>
                    </button>
                    <button
                      onClick={() => setSelectedPayment("UPI")}
                      className={`py-2 px-3.5 border rounded-xl font-mono text-xs cursor-pointer flex items-center justify-center space-x-1 ${selectedPayment === "UPI" ? "bg-cyan-950/40 border-cyan-500 text-cyan-400" : "bg-white/5 border-white/5 text-gray-400"}`}
                    >
                      <BatteryCharging className="w-3.5 h-3.5 shrink-0" />
                      <span>Instant UPI</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Summary checkout invoice */}
              {selectedStation && selectedVehicle && (
                <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-400 font-mono block">EXCHANGE TARIFF INCLUDES DEPOSIT</span>
                    <span className="text-xl font-extrabold font-mono text-white">₹{selectedStation.batterySwapPrice} <span className="text-xs font-normal text-gray-400">Flat Charge</span></span>
                  </div>

                  <div className="text-left sm:text-right font-mono text-xs">
                    <span className="text-[#00E676] font-bold block">Estimated execution: 3 mins</span>
                    <span className="text-gray-400 block mt-0.5">Compatible with standard {selectedVehicle.brand} sliding chassis</span>
                  </div>
                </div>
              )}

              {/* Big Start trigger */}
              <button
                onClick={handleStartSwap}
                disabled={!selectedStation || !selectedVehicle}
                className="w-full bg-gradient-to-r from-[#00E676] to-[#64FFDA] text-[#0b1220] py-4 rounded-2xl text-xs font-bold font-mono uppercase tracking-wider hover:opacity-95 transition-opacity cursor-pointer shadow-lg shadow-[#00E676]/10 flex items-center justify-center space-x-2"
              >
                <ArrowLeftRight className="w-4 h-4 shrink-0" />
                <span>Initialize Robotic Swap Exchange Sequence</span>
              </button>

            </div>
          ) : (
            /* Simulation Live Progress screen */
            <div className="py-8 space-y-8 flex flex-col justify-center items-center">
              
              {/* Dynamic exchange graphics simulator */}
              <div className="relative w-44 h-44 rounded-full border-4 border-dashed border-[#00E676]/20 bg-slate-950/40 flex items-center justify-center">
                
                {activeStep !== "complete" && (
                  <div className="absolute inset-0 rounded-full border-4 border-[#00E676] border-t-transparent animate-spin"></div>
                )}

                <div className="text-center space-y-1.5 z-10 px-4">
                  {activeStep === "align" && <Compass className="w-10 h-10 mx-auto text-[#00E676] animate-pulse" />}
                  {activeStep === "unlock" && <Cpu className="w-10 h-10 mx-auto text-cyan-400 animate-spin" />}
                  {activeStep === "extract" && <ArrowLeftRight className="w-10 h-10 mx-auto text-[#64FFDA] transform rotate-90" />}
                  {activeStep === "insert" && <BatteryCharging className="w-10 h-10 mx-auto text-emerald-400 animate-pulse" />}
                  {activeStep === "init" && <Gauge className="w-10 h-10 mx-auto text-amber-400 animate-spin-slow" />}
                  {activeStep === "complete" && <CheckCircle className="w-12 h-12 mx-auto text-[#00E676]" />}

                  <span className="text-lg font-bold font-mono text-white block">
                    {progress}%
                  </span>
                  <span className="text-[9px] font-mono text-[#00E676] uppercase tracking-wider block">
                    {activeStep} Active
                  </span>
                </div>
              </div>

              {/* Step indicator pipeline */}
              <div className="w-full max-w-lg">
                <div className="flex justify-between items-center text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-3">
                  <span className={activeStep === "align" ? "text-[#00E676] font-bold" : ""}>Alignment</span>
                  <span className={activeStep === "unlock" ? "text-cyan-400 font-bold" : ""}>Unbolt</span>
                  <span className={activeStep === "extract" ? "text-cyan-400 font-bold" : ""}>Extract</span>
                  <span className={activeStep === "insert" ? "text-emerald-400 font-bold" : ""}>Insert</span>
                  <span className={activeStep === "init" ? "text-amber-400 font-bold" : ""}>Verify</span>
                </div>

                <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <div 
                    className="bg-gradient-to-r from-[#00E676] to-[#64FFDA] h-full rounded-full transition-all duration-300"
                    style={{ width: `${activeStep === "complete" ? 100 : progress}%` }}
                  />
                </div>
              </div>

              {/* Status information */}
              <div className="text-center space-y-2 border border-white/5 bg-white/5 p-4 rounded-xl w-full max-w-lg backdrop-blur shadow">
                <p className="text-xs font-mono text-white tracking-wide">{statusMessage}</p>
                <span className="text-[10px] text-gray-400 font-mono block">Simulation Thread ID: #SW-{Math.abs(progress - 3)*11}</span>
              </div>

              {activeStep === "complete" && (
                <div className="space-y-4 text-center">
                  <div className="bg-emerald-950/50 border border-emerald-900/40 p-4 rounded-xl max-w-md text-xs leading-normal">
                    <p className="text-emerald-400 font-mono font-bold block text-sm">🔋 BATTERY TRANSITION DEPLOYED</p>
                    <p className="text-gray-300 mt-1 font-mono">
                      Your depleted cell ({simulatedOldSoc}% SoC) has been safely decoupled and sent to the thermal coolant regeneration rack. Your vehicle is now outfitted with a premium 100% full capacity cell.
                    </p>
                    <div className="border-t border-emerald-900/20 pt-2 mt-2 flex justify-between font-mono text-[10.5px] text-gray-400">
                      <span>Price: ₹{selectedStation?.batterySwapPrice}</span>
                      <span>Balance: ₹{userState.walletBalance}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleReset}
                    className="bg-white/10 hover:bg-white/15 px-6 py-2.5 rounded-xl text-xs font-mono font-bold text-white transition-all cursor-pointer inline-flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Return to Terminal</span>
                  </button>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Informational Footer */}
        <div className="border-t border-white/5 pt-4 mt-6 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-gray-400 gap-3">
          <div className="flex items-center space-x-3">
            <span className="flex items-center text-cyan-400">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Fully compatible with local ISO-8877 guidelines
            </span>
          </div>

          <div className="text-gray-500">
            Average Swap Speed: <span className="text-white">180s</span>
          </div>
        </div>

      </div>

      {/* Right Sidebar: Swap Bay status and FAQ guidelines */}
      <div className="lg:col-span-4 space-y-4">
        
        {/* Real-time depot status mapping */}
        <div className="bg-white/5 border border-white/5 rounded-3xl p-5 backdrop-blur-md shadow-lg space-y-4">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider block">Live Swapping Network Status</h3>
          
          <div className="space-y-3.5 text-xs">
            {swapStations.map((st) => (
              <div 
                key={st.id}
                onClick={() => setSelectedStation(st)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${selectedStation?.id === st.id ? "bg-[#121E31]/75 border-[#00E676]/30" : "bg-black/25 border-white/5 hover:border-white/10"}`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-bold font-mono text-white text-xs">{st.name.split(" ")[0]} Terminal</span>
                  <span className="text-[10px] font-mono text-[#00E676] bg-emerald-950/80 px-2 py-0.5 rounded uppercase">
                    ONLINE
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[10px] font-mono text-gray-400">
                  <div>
                    <span>Ready Packs:</span>
                    <span className="text-[#64FFDA] font-bold block text-xs mt-0.5">{st.availableBatteriesCount} / 16</span>
                  </div>
                  <div>
                    <span>Exchange rate:</span>
                    <span className="text-white block text-xs mt-0.5">₹{st.batterySwapPrice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works educational sidebar info */}
        <div className="bg-white/5 border border-white/5 rounded-3xl p-5 backdrop-blur-md shadow-md space-y-3">
          <span className="text-[10px] font-mono font-bold text-[#64FFDA] uppercase block">EXCHANGE STANDARDS FAQ</span>
          
          <div className="space-y-3 text-[11px] leading-relaxed text-gray-300 font-sans">
            <div className="space-y-1">
              <h5 className="font-bold text-white font-mono text-xs">Does this void my vehicle warranty?</h5>
              <p className="text-gray-400 font-mono text-[10.5px]">
                No, ChargeFlow uses ISO-standardised mechanical battery plates licensed directly by EV manufacturers (Tesla, Hyundai, Tata).
              </p>
            </div>

            <div className="space-y-1 pt-2 border-t border-white/5">
              <h5 className="font-bold text-white font-mono text-xs">Is my state of health evaluated?</h5>
              <p className="text-gray-400 font-mono text-[10.5px]">
                Yes, every battery returned enters an automated dual-axis impedance spectroscopic measurement check.
              </p>
            </div>

            <div className="space-y-1 pt-2 border-t border-white/5">
              <h5 className="font-bold text-[#00E676] font-mono text-xs flex items-center">
                <BatteryCharging className="w-3.5 h-3.5 mr-1" />
                Dynamic Load Balancing integration
              </h5>
              <p className="text-gray-400 font-mono text-[10.5px]">
                Grid load balancing throttles battery charging bays to limit peak highway grid draw during peak pricing slots.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
