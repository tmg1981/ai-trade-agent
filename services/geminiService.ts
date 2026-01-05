
import { GoogleGenAI, Type } from "@google/genai";
import { TradingSignal, TradeDirection, SignalStatus, SignalType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Advanced JSON extraction and sanitization.
 * Handles common model errors like thousands separators in numbers, trailing commas,
 * and markdown noise.
 */
const extractJson = (text: string) => {
  if (!text) return null;

  // 1. Initial cleanup of markdown blocks
  let clean = text.replace(/```json/g, "").replace(/```/g, "").trim();

  // 2. Locate the actual JSON object boundaries
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  
  if (start === -1 || end === -1) {
    throw new Error("No valid JSON object found in response");
  }

  let jsonStr = clean.substring(start, end + 1);

  // 3. Robust Sanitization
  try {
    // Attempt 1: Standard parse
    return JSON.parse(jsonStr);
  } catch (e) {
    try {
      // Attempt 2: Fix trailing commas [1, 2,] or {"a": 1,}
      let sanitized = jsonStr.replace(/,\s*([}\]])/g, '$1');
      
      // Attempt 3: Fix thousands separators in numbers (e.g., 65,000.00 -> 65000.00)
      // This looks for digits followed by a comma followed by exactly 3 digits,
      // which is likely a thousands separator, and removes the comma.
      sanitized = sanitized.replace(/(\d),(\d{3})/g, '$1$2');
      
      return JSON.parse(sanitized);
    } catch (e2) {
      console.error("Critical JSON Parsing Error. Raw text:", text);
      throw e2;
    }
  }
};

export const parseSignalMessage = async (rawText: string): Promise<Partial<TradingSignal> | null> => {
  try {
    // Truncate input to avoid model context overflow
    const safeText = rawText.substring(0, 2000);
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert trading signal parser. Convert this Telegram message into a structured JSON. 
      Detect if it is a NEW trade, an UPDATE to an existing trade, or a CLOSE instruction.
      
      CRITICAL INSTRUCTIONS:
      - Numbers MUST NOT contain commas as thousands separators (e.g., use 65000, not 65,000).
      - Ensure the output is valid JSON.
      
      Raw Message: "${safeText}"`,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 1024,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['NEW', 'UPDATE', 'CLOSE'] },
            pair: { type: Type.STRING },
            direction: { type: Type.STRING, enum: ['LONG', 'SHORT'] },
            entryPrices: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Support ranges if provided" },
            stopLoss: { type: Type.NUMBER },
            takeProfit: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            leverage: { type: Type.NUMBER },
            allocationHint: { type: Type.STRING },
            notes: { type: Type.STRING, description: "Confidence or reasoning notes" }
          },
          required: ["type", "pair"]
        }
      }
    });

    const parsed = extractJson(response.text);
    if (!parsed) return null;

    return {
      ...parsed,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      status: SignalStatus.PARSED,
      rawText: rawText
    };
  } catch (error) {
    console.error("Error parsing signal:", error);
    return null;
  }
};

export const processVoiceIntent = async (transcript: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract user intent from voice: "${transcript}".
      Intent List: CONFIRM_TRADE, CANCEL_SIGNAL, CLOSE_POSITION, SHOW_TRADES, PAUSE_TRADING.
      Return JSON only.`,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 512,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            command: { 
              type: Type.STRING, 
              enum: ['CONFIRM_TRADE', 'CANCEL_SIGNAL', 'CLOSE_POSITION', 'SHOW_TRADES', 'PAUSE_TRADING', 'UNKNOWN'] 
            },
            targetId: { type: Type.STRING, description: 'Optional asset name' }
          },
          required: ["command"]
        }
      }
    });
    return extractJson(response.text) || { command: 'UNKNOWN' };
  } catch (error) {
    console.error("Error processing voice intent:", error);
    return { command: 'UNKNOWN' };
  }
};
