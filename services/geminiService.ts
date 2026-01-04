
import { GoogleGenAI, Type } from "@google/genai";
import { TradingSignal, TradeDirection, SignalStatus } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const parseSignalMessage = async (rawText: string): Promise<Partial<TradingSignal> | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse the following trading signal from a Telegram message into JSON. 
      Raw Message: "${rawText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pair: { type: Type.STRING },
            direction: { type: Type.STRING, enum: ['LONG', 'SHORT'] },
            entryPrices: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            stopLoss: { type: Type.NUMBER },
            takeProfit: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            leverage: { type: Type.NUMBER }
          },
          required: ["pair", "direction", "entryPrices", "stopLoss", "takeProfit"]
        }
      }
    });

    const parsed = JSON.parse(response.text);
    return {
      ...parsed,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      status: SignalStatus.NEW
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
      contents: `Extract the user intent from this voice transcript: "${transcript}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            command: { 
              type: Type.STRING, 
              enum: ['CONFIRM_TRADE', 'CANCEL_SIGNAL', 'CLOSE_POSITION', 'SHOW_TRADES', 'SHOW_PNL', 'TOGGLE_ASSISTED', 'UNKNOWN'] 
            },
            targetId: { type: Type.STRING, description: 'Optional target ID mentioned' }
          },
          required: ["command"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error processing voice intent:", error);
    return { command: 'UNKNOWN' };
  }
};
