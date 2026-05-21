import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Lazy load/Helper to get Gemini client
  const getGeminiClient = () => {
    const key = process.env.GEMINI_API_KEY;
    // Basic verification of presence
    if (!key || key === "MY_GEMINI_API_KEY") {
      return null;
    }
    try {
      return new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch {
      return null;
    }
  };

  // API 1: Healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", keyConfigured: !!process.env.GEMINI_API_KEY });
  });

  // API 2: Smart AI Station & Trip charging recommendation
  app.post("/api/recommendations", async (req, res) => {
    const { 
      currentSoc, 
      targetSoc, 
      batteryCapacity, 
      connectorType, 
      tripDistance,
      vehicleModel 
    } = req.body;

    const systemPrompt = `You are ChargeFlow AI, an intelligent EV Charging Route & Energy Optimizer. 
Your objective is to provide highly precise, scientific, yet actionable charging advice.
Keep your answer relatively concise, structured in simple Markdown, using bullet points or short paragraphs. Avoid long intros.`;

    const userPrompt = `I am driving a ${vehicleModel || "EV"} with a ${batteryCapacity || 75}kWh battery capacity. 
* Current SoC (State of Charge): ${currentSoc || 20}%
* Target SoC: ${targetSoc || 80}%
* Vehicle Connector Type: ${connectorType || "CCS"}
* Intended travel / day trip distance: ${tripDistance || 120} km

Provide a 3-step recommendation:
1. **Range Feasibility & Travel Assessment**: Whether I can reach ${tripDistance || 120}km safely with my current ${currentSoc}% SoC before charging, and when I should recharge.
2. **Optimal Charging Strategy**: Estimate how much energy (kWh) is needed to hit my target of ${targetSoc}% SoC. Suggest the best charging rate profile and thermal conditioning (e.g. standard pre-conditioning or optimal peak rates).
3. **Eco Impact (CO2 Reduction)**: Give me a short statement on the carbon savings from this journey compared to a typical Euro 6 ICE vehicle (approx 120g/km output).`;

    const client = getGeminiClient();

    if (!client) {
      // Elegant, high-fidelity mock fallback if API Key is not set or inactive
      const kwhNeeded = Math.max(0, (((targetSoc || 80) - (currentSoc || 20)) / 100) * (batteryCapacity || 75));
      const rangeNowKm = Math.round((currentSoc || 20) * 3.5); // Approx 350km full range
      const warningMessage = rangeNowKm < (tripDistance || 120) 
        ? `⚠️ **Recharge alert:** Your active EV has ${rangeNowKm}km of remaining range. Reaching the full ${tripDistance}km trip directly is tight without a quick 15-minute standard top-up.`
        : `✅ **Fully Feasible:** Your EV currently has ${rangeNowKm}km of estimated range. You will comfortably reach the ${tripDistance}km destination but should top-up upon arrival.`;

      const mockResponse = `### 🔋 ChargeFlow AI Optimization (Sandbox Offline Mode)

${warningMessage}

1. **Range & Travel Assessment**
   * Driven Distance safe zone: Your ${vehicleModel} is operating at ${currentSoc}% SoC.
   * Total trip distance of ${tripDistance}km requires approx **${Math.round(tripDistance * 0.18)} kWh** of energy. We suggest utilizing **BlueVolt Supercharge Plaza (CCS)** at the 20km mark to avoid range-depletion risks.

2. **Optimal Charging Strategy**
   * To transition from ${currentSoc}% to ${targetSoc}% SoC, you need to deliver **${kwhNeeded.toFixed(1)} kWh** of energy.
   * **Thermal advice:** Pre-condition your pack 10 minutes prior to arrival. Charging at speeds up to **150kW DC** will fill your battery in approximately **22 minutes**, avoiding the higher thermal throttling rates above 80% SoC. 

3. **Carbon Neutral Impact (CO₂ Saved)**
   * Completing this ${tripDistance}km trip electric will save approximately **${(tripDistance * 0.12).toFixed(1)} kg of CO₂ emissions** compared to premium internal combustion vehicles. Great driving!
   
*Note: Set your GEMINI_API_KEY in the Secrets panel to activate personalized, live custom model analysis!*`;

      return res.json({ recommendation: mockResponse });
    }

    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });
      res.json({ recommendation: response.text });
    } catch (err: any) {
      console.error("Gemini API Error details:", err);
      res.status(500).json({ error: "Failed to generate AI advice", details: err?.message });
    }
  });

  // API 3: Active Support Chatbot with pre-trained platform context
  app.post("/api/chat-support", async (req, res) => {
    const { messages } = req.body; // Array of { role: 'user' | 'model', message: string }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const client = getGeminiClient();

    const systemPromptMessage = `You are ChargeFlow AI, the automated Smart EV Charging Platform customer support representative. 
Your goal is to answer technical questions about EV charging, active states, connectors, and account issues.
Platform knowledge boundaries:
- "Double Charge Payment / Multi-Debit Alert": Instruct the user to submit an official refund ticket in the "Support Center" on their dashboard under the "Payment Refund" category. Assure them we will trace log hashes and reverse any duplicate UPI or Card charges within 48 hours.
- "EcoPoint Green Hub": This station is currently in "Maintenance" (Offline) because of high cooling pump temperatures (42.8°C logs). Maintenance crews are dispatched to recalibrate the liquid coolants. Expect restore by tomorrow.
- "Pricing": Standard pricing is ₹14-18/kWh. Dynamic Peak Hours (6 PM to 9 PM) invoke a 1.35x surcharge (₹22/kWh). Off-peak hours (11 PM - 6 AM) have a 20% saver discount.
- "Connectors": CCS is compatible with Tesla, Audi, Hyundai. Type 2 is default AC. CHAdeMO is legacy Japanese (such as Leaf).
- Make sure to keep your answers concise, empathetic, and scannable. Limit answers to under 3-4 bullet points or sentences.`;

    if (!client) {
      // Premium Mock AI Chatbot answers based on requested message keywords for robust performance
      const lastMessage = messages[messages.length - 1]?.text?.toLowerCase() || "";
      let reply = "Hello! I am ChargeFlow AI, your EV Charging copilot. How can I assist with your stations, charging loops, or billing today?";

      if (lastMessage.includes("double") || lastMessage.includes("charge") || lastMessage.includes("refund") || lastMessage.includes("money") || lastMessage.includes("payment")) {
        reply = `💳 **Double Charge / Payment Refund Assistance**\n\nI understand you experienced a billing anomaly. To handle this securely:\n1. Navigate to the **Support Center** tab here on the Dashboard.\n2. Submit a ticket under the **Payment Refund** category with your transaction amount.\n3. Our system logs will trace the merchant API ledger. Any redundant bank hold of ₹813.6 or other billing will be voided back to your account within 48 hours automatically.`;
      } else if (lastMessage.includes("offline") || lastMessage.includes("ecopoint") || lastMessage.includes("maintenance") || lastMessage.includes("station 4")) {
        reply = `🔧 **EcoPoint Green Hub Status Alert**\n\nYes, the EcoPoint Hub is offline. Our thermal sensors triggered safety cut-offs at 42.8°C in the cooler circulation pumps. Maintenance crews are active and scheduled to restore CCS/AC slots by tomorrow morning. Please use nearby **BlueVolt Supercharge Plaza** instead.`;
      } else if (lastMessage.includes("price") || lastMessage.includes("pricing") || lastMessage.includes("cost") || lastMessage.includes("peak")) {
        reply = `⚡ **ChargeFlow Dynamic Rates**\n\nWe utilize smart dynamic grid loads:\n* **Standard Rate:** ₹14–18/kWh\n* **Evening Peak Surcharge (6 PM–9 PM):** ₹22/kWh (1.35x power demand)\n* **Super Saver Off-Peak (11 PM–6 AM):** 20% discount for off-peak grid easing.`;
      } else if (lastMessage.includes("connector") || lastMessage.includes("compatible") || lastMessage.includes("tesla") || lastMessage.includes("tata") || lastMessage.includes("nexon")) {
        reply = `🔌 **EV Connector Compatibility**\n\n1. **CCS & Supercharger:** Best for fast DC charging (Tesla, Ioniq 5, Audi e-tron).\n2. **Type 2:** Excellent for light AC charging (Tata Nexon, standard plug-ins).\n3. **CHAdeMO:** Compatible with legacy vehicle imports (Nissan Leaf). No converters required at our locations!`;
      } else if (lastMessage.includes("hello") || lastMessage.includes("hi") || lastMessage.includes("hey")) {
        reply = `👋 **Hey there! Welcome to ChargeFlow AI!**\n\nI can assist you instantly with:\n* 🔧 Station statuses (like EcoPoint's maintenance details)\n* 💳 Payment deductions and UPI refund tickets\n* 🔌 Port and connector compatibility maps\n* ⚡ Optimal vehicle speeds and battery preservation tips.\n\nWhat can I clarify for you today?`;
      }

      return res.json({ reply });
    }

    try {
      // Re-map messages array appropriately to GoogleGenAI specification
      // Ensure format: contents: messages matching GoogleGenAI spec
      const formattedContents = messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: systemPromptMessage,
          temperature: 0.7,
        }
      });

      res.json({ reply: response.text });
    } catch (err: any) {
      console.error("Gemini support chat error:", err);
      res.status(500).json({ error: "Failed to generate support reply", details: err?.message });
    }
  });

  // Integration of Vite Dev Server / Static Files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ChargeFlow Server] Booted successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
