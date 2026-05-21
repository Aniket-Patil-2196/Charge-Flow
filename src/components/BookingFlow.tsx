import React, { useState, useEffect } from "react";
import { Station, EVVehicle, Booking, ChargerSlot, DynamicPricingRule } from "../types";
import { Zap, ArrowLeft, BatteryCharging, ShoppingBag, Info, CloudSun, Calendar, ShieldCheck, Ticket, Sparkles, CreditCard, Wallet, QrCode } from "lucide-react";

interface BookingFlowProps {
  station: Station;
  vehicles: EVVehicle[];
  activePricingRules: DynamicPricingRule[];
  onBack: () => void;
  onBookingConfirmed: (newBooking: Booking) => void;
  onJoinQueue: (stationId: string, vehicleModel: string) => void;
}

export default function BookingFlow({ station, vehicles, activePricingRules, onBack, onBookingConfirmed, onJoinQueue }: BookingFlowProps) {
  // Booking Steps: 1: Charger & Vehicle selection 2: Prediction & Dynamic tariff checks 3: Payment Checkout
  const [step, setStep] = useState<number>(1);
  
  // Selections
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles[0]?.id || "");
  const [startSoc, setStartSoc] = useState<number>(20);
  const [targetSoc, setTargetSoc] = useState<number>(80);

  // checkout state
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "Card" | "Wallet">("Card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [upiId, setUpiId] = useState("aniket@okaxis");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [invalidCoupon, setInvalidCoupon] = useState(false);

  // AI Recommendation Text state
  const [aiAdvice, setAiAdvice] = useState<string>("");
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  // Select first slot by default if available
  useEffect(() => {
    const defaultSlot = station.slots.find(s => !s.isOccupied && s.status === "Online");
    if (defaultSlot) {
      setSelectedSlotId(defaultSlot.id);
    } else {
      const anySlot = station.slots.find(s => s.status === "Online");
      if (anySlot) setSelectedSlotId(anySlot.id);
    }
  }, [station]);

  // DERIVED DATA
  const selectedSlot = station.slots.find(s => s.id === selectedSlotId);
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];

  // Dynamic pricing multiplier assessment based on active hour.
  // We check current time of day
  const currentHour = new Date().getHours();
  const currentRule = activePricingRules.find(r => currentHour >= r.startHour && currentHour < r.endHour) || activePricingRules[1];
  const priceMultiplier = currentRule ? currentRule.priceMultiplier : 1.0;
  const activeRatePerKwh = parseFloat((station.basePricePerKwh * priceMultiplier).toFixed(2));

  // MATHEMATICAL CHARGING CALCULATIONS
  const energyKwhNeeded = useMemoCalculation();

  function useMemoCalculation() {
    if (!selectedVehicle) return 0;
    const socDecimalNeeded = (targetSoc - startSoc) / 100;
    return Math.max(0, socDecimalNeeded * selectedVehicle.batteryCapacity);
  }

  const chargeSpeedKaw = selectedSlot && selectedVehicle 
    ? Math.min(selectedSlot.powerOutput, selectedVehicle.chargingSpeedLimit) 
    : 50;

  // Time in minutes: (energy / power) * 60, plus allowance above 80% for trickle charge
  const estimatedTimeMins = (() => {
    if (chargeSpeedKaw <= 0 || energyKwhNeeded <= 0) return 0;
    let baseHours = energyKwhNeeded / chargeSpeedKaw;
    // Add 15% thermal pacing overhead
    let totalMins = baseHours * 60 * 1.15;
    return Math.round(totalMins);
  })();

  const baseCost = energyKwhNeeded * activeRatePerKwh;
  const couponDiscount = couponApplied ? baseCost * 0.20 : 0; // 20% discount coupon
  const finalCost = Math.max(0, parseFloat((baseCost - couponDiscount).toFixed(2)));

  // Carbon savings: approx 0.44 kg CO2 saved per kWh delivered compared to thermal combustion
  const co2SavingsKg = parseFloat((energyKwhNeeded * 0.44).toFixed(1));

  // FETCH REAL SERVER-SIDE GEMINI PREDICTIONS
  const handleLoadAiAdvice = async () => {
    if (!selectedVehicle) return;
    setLoadingAi(true);
    setAiAdvice("");
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSoc: startSoc,
          targetSoc: targetSoc,
          batteryCapacity: selectedVehicle.batteryCapacity,
          connectorType: selectedSlot?.connectorType || selectedVehicle.connectorType,
          tripDistance: Math.round(selectedVehicle.batteryCapacity * 4.2 * (startSoc / 100)), // dynamic trip estimate 
          vehicleModel: `${selectedVehicle.brand} ${selectedVehicle.model}`
        })
      });
      const data = await response.json();
      if (data.recommendation) {
        setAiAdvice(data.recommendation);
      } else {
        setAiAdvice("Failed to parse Gemini dynamic reasoning parameters.");
      }
    } catch {
      setAiAdvice("Failed to synchronize with server-side AI model node.");
    } finally {
      setLoadingAi(false);
    }
  };

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === "ECODRIVER20") {
      setCouponApplied(true);
      setInvalidCoupon(false);
    } else {
      setInvalidCoupon(true);
      setCouponApplied(false);
    }
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) return;

    const newBooking: Booking = {
      id: "b-" + Math.floor(Math.random() * 900000 + 100000),
      userId: "user-main-id",
      userName: "Aniket Patil",
      userEmail: "aniketjaysingpatil3513@gmail.com",
      stationId: station.id,
      stationName: station.name,
      slotId: selectedSlotId,
      slotName: selectedSlot?.name || "Charger Dock",
      connectorType: selectedSlot?.connectorType || "CCS",
      vehicleModel: `${selectedVehicle.brand} ${selectedVehicle.model}`,
      vehicleBatteryCapacity: selectedVehicle.batteryCapacity,
      startSoc: startSoc,
      targetSoc: targetSoc,
      estimatedDuration: estimatedTimeMins,
      estimatedCost: finalCost,
      paymentMethod: paymentMethod,
      paymentStatus: "Paid",
      startTime: new Date().toISOString(),
      status: "Booked"
    };

    onBookingConfirmed(newBooking);
  };

  // Determine if station is fully occupied
  const isFullyOccupied = station.slots.every(s => s.isOccupied || s.status === "Maintenance");

  return (
    <div className="frosted-glass backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden text-gray-100 font-sans shadow-xl">
      {/* Background aesthetic */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#00E676]/5 rounded-full blur-[90px] pointer-events-none"></div>

      {/* Top Header */}
      <div className="flex items-center justify-between pb-5 border-b border-white/5 mb-6 sticky top-0 bg-black/40 backdrop-blur z-10">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-mono text-[#64FFDA] hover:text-white transition-opacity cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#00E676]" />
          <span>Back to Live Grid Map</span>
        </button>

        <span className="text-[10px] font-mono hover:text-white text-gray-400 bg-white/5 border border-white/10 px-3 py-1 rounded-lg">
          Live Temperature: <span className="text-orange-400 font-bold">{station.temperature}°C</span>
        </span>
      </div>

      {/* Flow Stage Indicator */}
      <div className="flex justify-center items-center space-x-6 mb-8 text-xs font-mono py-1 rounded-xl bg-slate-950/20 max-w-lg mx-auto">
        <span className={`pb-1 ${step >= 1 ? "text-[#00E676] font-bold border-b-2 border-[#00E676]" : "text-gray-500"}`}>1. Dock & EV selection</span>
        <span className="text-gray-650">→</span>
        <span className={`pb-1 ${step >= 2 ? "text-[#00E676] font-bold border-b-2 border-[#00E676]" : "text-gray-500"}`}>2. AI Optimizer</span>
        <span className="text-gray-650">→</span>
        <span className={`pb-1 ${step >= 3 ? "text-[#00E676] font-bold border-b-2 border-[#00E676]" : "text-gray-500"}`}>3. Dynamic Check-out</span>
      </div>

      {/* GRID LAYOUT SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* STEP 1: CHARGER SELECTION & VEHCLE CHOICE */}
        {step === 1 && (
          <div className="md:col-span-12 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Column: Choose Slots */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold font-mono text-white flex items-center space-x-1.5">
                    <CloudSun className="w-4 h-4 text-amber-400" />
                    <span>Select Docking Charger</span>
                  </h3>
                  <span className="text-[10px] font-mono text-gray-400">
                    Tariff Rate: ₹{activeRatePerKwh}/kWh
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {station.slots.map((slot) => {
                    const isSelect = selectedSlotId === slot.id;
                    const canSelect = slot.status === "Online" && !slot.isOccupied;
                    
                    return (
                      <div
                        key={slot.id}
                        onClick={() => {
                          if (slot.status === "Online") setSelectedSlotId(slot.id);
                        }}
                        className={`p-4 rounded-2xl border transition-all relative cursor-pointer ${slot.status === "Offline" ? "opacity-40 cursor-not-allowed bg-[#0b1220]/20 border-white/5" : ""} ${isSelect ? "bg-white/15 border-[#00E676] shadow-md shadow-[#00E676]/5" : "bg-white/5 border-white/5 hover:border-white/10"}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${slot.isOccupied ? "bg-rose-950/60 text-rose-400" : "bg-emerald-950/60 text-emerald-400"}`}>
                            {slot.isOccupied ? "OCCUPIED" : "VACANT"}
                          </span>
                          <span className="text-xs font-mono text-[#64FFDA] font-semibold">{slot.powerOutput} kW</span>
                        </div>

                        <h4 className="text-xs font-bold text-white font-mono">{slot.name}</h4>
                        <span className="text-[10px] text-gray-400 font-mono mt-1 block">Plug: {slot.connectorType}</span>

                        {/* Fast Charging Glow indicator */}
                        {slot.isFastCharger && (
                          <span className="absolute bottom-2.5 right-2.5 text-[9px] font-mono text-[#00E676] flex items-center bg-[#00E676]/5 border border-[#00E676]/15 px-1 rounded animate-pulse">
                            ⚡ FAST
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Queue handling if occupied */}
                {isFullyOccupied && (
                  <div className="bg-rose-950/20 border border-rose-900/30 rounded-2xl p-4.5 space-y-3 mt-4">
                    <p className="text-xs text-rose-400 leading-relaxed font-mono">
                      ⚠️ **All Charging Bays Busy:** There are currently **{station.queueList.length}** vehicles registered in the virtual waitlist cue. Expected queue waiting index is #{(station.queueList.length + 1)}.
                    </p>
                    <button
                      onClick={() => onJoinQueue(station.id, selectedVehicle.model)}
                      className="w-full bg-[#0b1220] border border-rose-800 text-rose-400 hover:bg-rose-900 hover:text-white py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
                    >
                      Join Virtual Queue waitlist (Est: {station.queueList.length * 12 + 12} mins wait)
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: EV Vehicle parameters selection */}
              <div className="space-y-4">
                <h3 className="text-base font-bold font-mono text-white flex items-center space-x-1.5">
                  <BatteryCharging className="w-4.5 h-4.5 text-[#00E676]" />
                  <span>Select Registered Vehicle</span>
                </h3>

                <div className="space-y-3">
                  {vehicles.map((v) => {
                    const isSelect = selectedVehicleId === v.id;
                    const compatibilityMatched = selectedSlot && selectedSlot.connectorType === v.connectorType;
                    
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVehicleId(v.id)}
                        className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${isSelect ? "bg-white/15 border-[#00E676]/80" : "bg-white/5 border-white/5 hover:border-white/10"}`}
                      >
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-gray-200 font-mono">{v.brand} {v.model}</h4>
                          <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-mono">
                            <span>Battery: {v.batteryCapacity} kWh</span>
                            <span>•</span>
                            <span>Limit: {v.chargingSpeedLimit} kW</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded text-white ${compatibilityMatched ? "bg-[#00E676]/20 text-[#00E676]" : "bg-amber-950 text-amber-400"}`}>
                            {v.connectorType}
                          </span>
                          {!compatibilityMatched && selectedSlot && (
                            <span className="block text-[8px] text-amber-500 font-mono mt-1">Plug Mismatch</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Micro peak utilization graph representation */}
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-gray-400">
                    <span>GRID LOAD ANALYSIS</span>
                    <span className="text-[#64FFDA]">Dynamic Pricing Schedule</span>
                  </div>
                  <div className="flex items-end h-16 pt-2 gap-0.5 select-none">
                    {station.peakHours.map((load, index) => {
                      const isCurrentHour = index === currentHour;
                      let barColor = isCurrentHour ? "bg-[#00E676]" : "bg-white/15";
                      if (!isCurrentHour && load > 80) barColor = "bg-rose-500/15";
                      return (
                        <div
                          key={index}
                          className={`flex-1 rounded-t-sm ${barColor}`}
                          style={{ height: `${load}%` }}
                          title={`Hour ${index}: ${load}% grid loading`}
                        ></div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[8px] font-mono text-gray-500 pt-0.5">
                    <span>12 AM</span>
                    <span className="text-[#00E676] font-semibold">📍 NOW ({currentHour} hrs — Multiplier {priceMultiplier}x)</span>
                    <span>12 PM</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Stepper bottom action */}
            <div className="pt-6 border-t border-slate-900 flex justify-end">
              <button
                disabled={!selectedSlotId}
                onClick={() => {
                  setStep(2);
                  handleLoadAiAdvice();
                }}
                className="px-8 py-3.5 rounded-xl font-bold text-[#0B1220] bg-gradient-to-r from-[#00E676] to-[#64FFDA] hover:opacity-95 shadow-md shadow-[#00E676]/20 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              >
                Estimate Charging Rates
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PREDICTION ENGINE & SLIDERS */}
        {step === 2 && (
          <div className="md:col-span-12 space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left 6 columns: Controls and sliders */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* State of Charge sliders */}
                <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-5">
                  <h4 className="text-xs font-mono font-bold text-gray-350 tracking-wider uppercase">Set Battery Level Intervals</h4>
                  
                  {/* Start Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-gray-400">Start Battery Charge</span>
                      <span className="text-[#64FFDA] font-bold">{startSoc}% SoC</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={75}
                      value={startSoc}
                      onChange={(e) => {
                        const startVal = parseInt(e.target.value);
                        setStartSoc(startVal);
                        if (startVal >= targetSoc) setTargetSoc(startVal + 5);
                      }}
                      className="w-full accent-[#64FFDA] bg-slate-950 h-1.5 rounded"
                    />
                  </div>

                  {/* Target Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono border-t border-slate-950/20 pt-3">
                      <span className="text-gray-400">Target Battery Charge</span>
                      <span className="text-[#00E676] font-bold">{targetSoc}% SoC</span>
                    </div>
                    <input
                      type="range"
                      min={startSoc + 5}
                      max={100}
                      value={targetSoc}
                      onChange={(e) => setTargetSoc(parseInt(e.target.value))}
                      className="w-full accent-[#00E676] bg-slate-950 h-1.5 rounded"
                    />
                  </div>
                </div>

                {/* Mathematical predictive metrics cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#121E31]/40 border border-slate-800 rounded-2xl p-4.5 space-y-1">
                    <span className="text-[10px] font-mono text-gray-500 uppercase">Estimated Charge Duration</span>
                    <span className="text-2xl font-bold font-mono text-white tracking-tight">{estimatedTimeMins} mins</span>
                    <span className="text-[9px] text-gray-400 font-mono block">Max speed limited to {chargeSpeedKaw}kW</span>
                  </div>
                  <div className="bg-[#121E31]/40 border border-[#00E676]/10 rounded-2xl p-4.5 space-y-1">
                    <span className="text-[10px] font-mono text-[#00E676] uppercase">Est Billing (Tariff)</span>
                    <span className="text-2xl font-bold font-mono text-[#00E676] tracking-tight">₹{baseCost.toFixed(2)}</span>
                    <span className="text-[9px] text-gray-400 font-mono block">Energy: {energyKwhNeeded.toFixed(1)} kWh delivered</span>
                  </div>
                </div>

                {/* Carbon footer marker */}
                <div className="bg-emerald-950/25 border border-emerald-900/30 p-4 rounded-xl flex items-center space-x-3 text-emerald-400">
                  <Zap className="w-5 h-5 animate-pulse shrink-0" />
                  <p className="text-xs font-sans">
                    🌱 **Carbon Footprint Impact:** Delivering this charge will save approximately **{co2SavingsKg} kg of CO₂** emissions compared to traditional petrol alternatives.
                  </p>
                </div>
              </div>

              {/* Right 6 columns: Active Server-Side Gemini Recommendation */}
              <div className="lg:col-span-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <h3 className="text-sm font-bold font-mono text-white flex items-center space-x-1">
                    <Sparkles className="w-4 h-4 text-[#00E676] animate-pulse" />
                    <span>Gemini AI Battery Optimizer</span>
                  </h3>
                  <button
                    onClick={handleLoadAiAdvice}
                    className="text-[10px] font-mono text-[#64FFDA] hover:underline"
                  >
                    Refresh Advice
                  </button>
                </div>

                <div className="min-h-[220px] bg-slate-950/60 p-5 rounded-2xl border border-slate-850 overflow-y-auto text-xs max-h-[280px] text-gray-300 leading-relaxed font-sans scrollbar-thin">
                  {loadingAi ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-3 py-12">
                      <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#00E676] animate-spin"></div>
                      <p className="text-xs font-mono text-[#00E676] animate-pulse">Consulting server model parameters...</p>
                    </div>
                  ) : (
                    <div className="markdown-body space-y-3">
                      {aiAdvice ? (
                        aiAdvice.split("\n").map((line, i) => (
                          <p key={i} className="mb-1 leading-relaxed">
                            {line}
                          </p>
                        ))
                      ) : (
                        <p className="text-gray-500 italic text-center py-10">
                          Click Refresh Advice to consult the Gemini platform AI for optimized thermal limits, charging curves, and eco-impact reports.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Steps navigation buttons */}
            <div className="pt-6 border-t border-slate-900 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="bg-slate-900 border border-slate-800 text-gray-400 hover:text-white px-6 py-3 rounded-xl text-xs font-mono font-bold cursor-pointer"
              >
                Back to Configs
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-[#00E676] text-[#0b1220] px-8 py-3 rounded-xl text-xs font-bold shadow-md shadow-[#00E676]/10 cursor-pointer"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: MOCK CHECKOUT BILLING */}
        {step === 3 && (
          <div className="md:col-span-12 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Checkout options */}
              <div className="lg:col-span-7 space-y-5">
                <h3 className="text-sm font-bold font-mono text-white">Select Billing Channel</h3>
                
                <div className="grid grid-cols-3 gap-2 border border-slate-850 p-1.5 rounded-xl bg-slate-950/60 max-w-sm">
                  {(["Card", "UPI", "Wallet"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 text-[10px] font-mono font-bold rounded-lg transition-colors cursor-pointer ${paymentMethod === method ? "bg-[#00E676] text-[#0B1220]" : "text-gray-400 hover:text-gray-200"}`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {/* Coupons integration */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[10px] text-gray-400 font-mono uppercase block">Apply Code / Coupons</span>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="ECODRIVER20"
                      className="flex-1 bg-[#121E31]/55 border border-slate-800 text-xs py-2 px-3 rounded-lg text-white font-mono focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-xs font-mono font-bold text-[#64FFDA] cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {couponApplied && (
                    <span className="text-[10px] font-mono text-emerald-400 block pb-0.5">🟢 Code 'ECODRIVER20' Applied: 20% discount on entire delivery!</span>
                  )}
                  {invalidCoupon && (
                    <span className="text-[10px] font-mono text-rose-400 block pb-0.5">⚠️ Invalid or expired coupon code.</span>
                  )}
                  <span className="block text-[8.5px] text-gray-500 font-mono italic">
                    *Tip: Use 'ECODRIVER20' code in the input above to test invoice discount ledgers.
                  </span>
                </div>

                {/* Conditionally rendered parameters */}
                {paymentMethod === "Card" && (
                  <div className="p-5 border border-slate-850 rounded-2xl bg-slate-900/40 space-y-3.5">
                    <span className="text-xs font-mono text-gray-400 block uppercase">Enter Card Credentials</span>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-gray-500">CARD INDEX NUMBER</label>
                      <input
                        type="text"
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-[#121E31]/50 border border-slate-800 py-2.5 px-3 rounded-xl text-xs font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-gray-500">EXPIRY DATE (MM/YY)</label>
                        <input
                          type="text"
                          placeholder="09/28"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-[#121E31]/50 border border-slate-800 py-2.5 px-3 rounded-xl text-xs font-mono text-center"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono text-gray-500">SECURITY CODE CVV</label>
                        <input
                          type="password"
                          placeholder="***"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full bg-[#121E31]/50 border border-slate-800 py-2.5 px-3 rounded-xl text-xs font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === "UPI" && (
                  <div className="p-5 border border-slate-850 rounded-2xl bg-slate-900/40 text-center space-y-4">
                    <span className="text-xs font-mono text-gray-400 block uppercase font-bold">UPI Integrated QR Gateway</span>
                    <div className="w-28 h-28 bg-white p-2 rounded-xl mx-auto flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-slate-900" />
                    </div>
                    <div className="space-y-1.5 text-left max-w-sm mx-auto">
                      <label className="text-[9px] font-mono text-gray-500 block text-center">OR INPUT UPI ALIAS VPA</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="aniket@okaxis"
                        className="w-full bg-[#121E31]/55 border border-slate-800 py-2.5 px-3 rounded-xl text-xs font-mono text-center"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === "Wallet" && (
                  <div className="p-5 border border-slate-850 rounded-2xl bg-slate-900/40 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block font-mono">CHARGEFLOW PRE-PAID WALLET Balance</span>
                      <span className="text-2xl font-bold font-mono text-[#00E676] block mt-1">₹1,200.00</span>
                    </div>
                    <Wallet className="w-10 h-10 text-[#64FFDA]" />
                  </div>
                )}
              </div>

              {/* Right Column: Dynamic Invoice Ledger Summary */}
              <div className="lg:col-span-5 bg-slate-950/80 p-5 rounded-2xl border border-slate-850 space-y-5">
                <span className="text-xs font-mono font-bold text-gray-350 tracking-wider uppercase block border-b border-slate-900 pb-2">Receipt Invoice Ledger</span>
                
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between font-mono text-gray-400">
                    <span>Driver Account:</span>
                    <span className="text-white font-semibold">Aniket Patil</span>
                  </div>
                  <div className="flex justify-between font-mono text-gray-400">
                    <span>Active Vehicle:</span>
                    <span className="text-white font-semibold">{selectedVehicle?.brand} {selectedVehicle?.model}</span>
                  </div>
                  <div className="flex justify-between font-mono text-gray-400">
                    <span>Charger Port chosen:</span>
                    <span className="text-[#64FFDA] font-semibold">{selectedSlot?.connectorType || "CCS"} DC ({selectedSlot?.name})</span>
                  </div>
                  <div className="flex justify-between font-mono text-gray-400 border-b border-slate-900 pb-3">
                    <span>Target intervals:</span>
                    <span className="text-white font-semibold">{startSoc}% To {targetSoc}% SoC</span>
                  </div>

                  <div className="flex justify-between font-mono text-gray-400">
                    <span>Base Energy Delivered:</span>
                    <span className="text-white font-semibold">{energyKwhNeeded.toFixed(1)} kWh</span>
                  </div>
                  <div className="flex justify-between font-mono text-gray-400">
                    <span>Active Dynamic Rate:</span>
                    <span className="text-white font-semibold">₹{activeRatePerKwh}/kWh</span>
                  </div>

                  {couponApplied && (
                    <div className="flex justify-between font-mono text-emerald-400">
                      <span>Coupon applied (20%):</span>
                      <span className="font-semibold">-₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-mono items-center border-t border-slate-900 pt-3.5 text-sm">
                    <span className="text-gray-350 uppercase tracking-widest font-bold">TOTAL DUE</span>
                    <span className="text-xl font-extrabold text-[#00E676]">₹{finalCost.toFixed(2)}</span>
                  </div>
                </div>

                <form onSubmit={handleBookSubmit}>
                  <button
                    type="submit"
                    className="w-full bg-[#00E676] text-[#0b1220] py-4 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer text-center flex items-center justify-center space-x-1.5"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span>Authorize & Lock Slot</span>
                  </button>
                </form>

                <p className="text-[9.5px] text-gray-500 font-mono text-center">
                  *Your slot will be reserved at terminal microprocessors immediately upon successful mock checkout validation.
                </p>
              </div>

            </div>

            {/* Steps bottom action */}
            <div className="pt-6 border-t border-slate-900 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="bg-slate-900 border border-slate-800 text-gray-400 hover:text-white px-6 py-3 rounded-xl text-xs font-mono font-bold cursor-pointer"
              >
                Back to Predictions
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
