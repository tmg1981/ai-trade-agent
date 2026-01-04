
import { create } from 'zustand';
import { TradingSignal, SignalStatus, AuditLogEntry, AppConfig, ExecutionMode } from './types';

interface AppState {
  signals: TradingSignal[];
  logs: AuditLogEntry[];
  config: AppConfig;
  executionMode: ExecutionMode;
  
  addSignal: (signal: TradingSignal) => void;
  updateSignal: (id: string, updates: Partial<TradingSignal>) => void;
  addLog: (type: AuditLogEntry['type'], message: string, details?: string) => void;
  updateConfig: (updates: Partial<AppConfig>) => void;
  setExecutionMode: (mode: ExecutionMode) => void;
  clearSignals: () => void;
}

export const useStore = create<AppState>((set) => ({
  signals: [],
  logs: [],
  executionMode: ExecutionMode.MANUAL,
  config: {
    telegramChannel: "@TradingAlphaSignals",
    maxTradeSize: 1000,
    dailyLossLimit: 200,
    isAssistedModeEnabled: false,
    isVoiceControlEnabled: true,
    isAutoConfirmationEnabled: false,
  },

  addSignal: (signal) => set((state) => ({ 
    signals: [signal, ...state.signals],
    logs: [{
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type: 'SIGNAL',
      message: `New signal detected: ${signal.pair} ${signal.direction}`,
    }, ...state.logs]
  })),

  updateSignal: (id, updates) => set((state) => ({
    signals: state.signals.map(s => s.id === id ? { ...s, ...updates } : s)
  })),

  addLog: (type, message, details) => set((state) => ({
    logs: [{
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      type,
      message,
      details
    }, ...state.logs]
  })),

  updateConfig: (updates) => set((state) => ({
    config: { ...state.config, ...updates }
  })),

  setExecutionMode: (mode) => set({ executionMode: mode }),
  
  clearSignals: () => set({ signals: [] }),
}));
