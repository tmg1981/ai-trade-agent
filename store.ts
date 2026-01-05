
import { create } from 'zustand';
import { 
  TradingSignal, 
  SignalStatus, 
  SignalType,
  AuditLogEntry, 
  AppConfig, 
  Position, 
  UserCredentials,
  TelegramAuthStatus
} from './types';
import { backend } from './services/backend';
import { telegramService } from './services/telegramService';
import { MarketService } from './services/marketService';

type AppTab = 'dashboard' | 'logs' | 'settings';

interface AppState {
  signals: TradingSignal[];
  positions: Position[];
  logs: AuditLogEntry[];
  config: AppConfig;
  credentials: UserCredentials;
  isLoading: boolean;
  activeTab: AppTab;
  monitoringActive: boolean;
  
  init: () => Promise<void>;
  setActiveTab: (tab: AppTab) => void;
  
  // Telegram User Session Logic
  requestTgOtp: (phone: string) => Promise<void>;
  submitTgOtp: (code: string) => Promise<void>;
  logoutTg: () => Promise<void>;
  addMonitoredChannel: (channel: string) => void;
  
  // Exchange Balance Logic
  syncBalance: () => Promise<void>;
  
  // Logic Actions
  handleIncomingSignal: (signal: Partial<TradingSignal> | null) => Promise<void>;
  confirmSignal: (id: string, forceImmediate?: boolean) => Promise<void>;
  cancelSignal: (id: string) => Promise<void>;
  executeSignal: (id: string) => Promise<void>;
  closePosition: (id: string) => Promise<void>;
  
  // Risk Engine
  calculateRisk: (signal: TradingSignal) => { calculatedSize: number; maxRisk: number; liquidationDistance: number };

  // Monitoring
  monitorMarket: () => Promise<void>;
  
  // Management Actions
  updateCredentials: (creds: Partial<UserCredentials>) => Promise<void>;
  updateConfig: (updates: Partial<AppConfig>) => void;
  addLog: (type: AuditLogEntry['type'], message: string, details?: string) => Promise<void>;
  clearData: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  signals: [],
  positions: [],
  logs: [],
  credentials: { 
    tgAuthStatus: 'UNAUTHENTICATED',
    tgMonitoredChannels: [],
    sessionStatus: 'UNSET', 
    futuresBalance: 1000, 
    riskPercent: 1.0 
  },
  isLoading: true,
  activeTab: 'dashboard',
  monitoringActive: false,
  config: {
    maxTradeSize: 500,
    dailyLossLimit: 100,
    executionMode: 'ASSISTED',
    isVoiceEnabled: true,
    riskMultiplier: 1.0
  },

  init: async () => {
    // CRITICAL: Register the handler regardless of loading state to fix Inject button
    telegramService.registerSignalHandler(get().handleIncomingSignal);

    if (!get().isLoading && get().monitoringActive) return;

    const [signals, positions, logs, credentials] = await Promise.all([
      backend.getSignals(),
      backend.getPositions(),
      backend.getLogs(),
      backend.getCredentials()
    ]);
    
    set({ 
      signals, 
      positions, 
      logs, 
      credentials: {
        ...get().credentials,
        ...credentials,
        futuresBalance: Number(credentials?.futuresBalance) || 1000,
        riskPercent: Number(credentials?.riskPercent) || 1.0
      }, 
      isLoading: false 
    });

    if (credentials?.tgAuthStatus === 'AUTHENTICATED') {
      telegramService.startUserSession();
    }

    if (!get().monitoringActive) {
      set({ monitoringActive: true });
      setInterval(() => get().monitorMarket(), 5000);
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  requestTgOtp: async (phone) => {
    if (!phone) return;
    await get().addLog('SYSTEM', 'Telegram Auth Initiated', `Requesting OTP for ${phone}. Check Audit Log for simulation code.`);
    
    // UI/UX Fix: Since we are in a simulation, "send" the code to the audit log so the user knows it.
    setTimeout(() => {
      get().addLog('SYSTEM', 'OTP RECEIVED', 'Your simulation code is: 12345');
    }, 1500);

    set({ credentials: { ...get().credentials, tgPhoneNumber: phone, tgAuthStatus: 'PENDING_OTP' } });
  },

  submitTgOtp: async (code) => {
    const isValid = await telegramService.verifyCode(code);
    if (isValid) {
      const updated = { ...get().credentials, tgAuthStatus: 'AUTHENTICATED' as const };
      await get().updateCredentials(updated);
      telegramService.startUserSession();
      await get().addLog('SYSTEM', 'Telegram User Session Established', 'Real-time channel listening active.');
    } else {
      set({ credentials: { ...get().credentials, tgAuthStatus: 'ERROR' } });
      await get().addLog('ERROR', 'Telegram Auth Failed', 'Invalid OTP code provided.');
    }
  },

  syncBalance: async () => {
    const { credentials } = get();
    if (credentials.sessionStatus !== 'VALID') {
      await get().addLog('ERROR', 'Sync Failed', 'Valid Exchange Session (Cookie) required to fetch balance.');
      return;
    }

    await get().addLog('SYSTEM', 'Fetching Balance...', 'Interacting with thetruetrade.io DOM via browser session.');
    
    // Simulate scraping logic
    await new Promise(r => setTimeout(r, 2000));
    
    // Simulate a value change
    const newBalance = credentials.futuresBalance + (Math.random() * 50 - 25);
    const updated = { ...credentials, futuresBalance: parseFloat(newBalance.toFixed(2)) };
    
    await get().updateCredentials(updated);
    await get().addLog('SYSTEM', 'Balance Synced', `Updated Futures Balance: $${updated.futuresBalance}`);
  },

  logoutTg: async () => {
    const updated = { ...get().credentials, tgAuthStatus: 'UNAUTHENTICATED' as const };
    await get().updateCredentials(updated);
    telegramService.stop();
    await get().addLog('SYSTEM', 'Telegram Session Terminated');
  },

  addMonitoredChannel: (channel) => {
    const channels = [...get().credentials.tgMonitoredChannels, channel];
    get().updateCredentials({ tgMonitoredChannels: channels });
  },

  calculateRisk: (signal) => {
    const { credentials } = get();
    const balance = Number(credentials.futuresBalance) || 0;
    const riskPercent = Number(credentials.riskPercent) || 0;
    const riskAmount = balance * (riskPercent / 100);
    
    const entry = Number(signal.entryPrices?.[0]) || 0;
    const sl = Number(signal.stopLoss) || 0;
    
    if (entry <= 0 || sl <= 0 || entry === sl) {
      return { calculatedSize: 0, maxRisk: riskAmount, liquidationDistance: 0 };
    }

    const slPercent = Math.abs(entry - sl) / entry;
    const sizeUSD = riskAmount / slPercent;
    
    return { 
      calculatedSize: parseFloat(sizeUSD.toFixed(2)), 
      maxRisk: parseFloat(riskAmount.toFixed(2)),
      liquidationDistance: signal.leverage > 0 ? (1 / signal.leverage) * 100 : 0
    };
  },

  monitorMarket: async () => {
    const { signals, positions } = get();
    
    const waiting = signals.filter(s => s.status === SignalStatus.WAITING_FOR_ENTRY);
    for (const signal of waiting) {
      const price = await MarketService.getCurrentPrice(signal.pair);
      if (price) {
        const isEntryHit = signal.direction === 'LONG' 
          ? price <= signal.entryPrices[0] 
          : price >= signal.entryPrices[0];
          
        if (isEntryHit) {
          await get().addLog('SYSTEM', `Entry triggered for ${signal.pair}`, `Price hit: ${price}`);
          await get().executeSignal(signal.id);
        }
      }
    }

    if (positions.length > 0) {
      const updatedPositions = await Promise.all(positions.map(async pos => {
        const price = await MarketService.getCurrentPrice(pos.pair);
        if (price) {
          const diff = pos.direction === 'LONG' ? price - pos.entryPrices[0] : pos.entryPrices[0] - price;
          const pnl = (diff / pos.entryPrices[0]) * pos.size * pos.leverage;
          return { ...pos, currentPrice: price, unrealizedPnL: pnl };
        }
        return pos;
      }));
      set({ positions: updatedPositions });
    }
  },

  handleIncomingSignal: async (parsedSignal) => {
    if (!parsedSignal) return;
    const signal = {
      ...parsedSignal,
      executionMode: 'ASSISTED',
      entryMode: 'CONDITIONAL'
    } as TradingSignal;

    if (signal.type === SignalType.NEW) {
      const risk = get().calculateRisk(signal);
      signal.calculatedSize = risk.calculatedSize;
      signal.maxRiskAmount = risk.maxRisk;
    }

    await backend.saveSignal(signal);
    await get().addLog('SIGNAL', `${signal.type} Detected`, `Asset: ${signal.pair}`);
    set({ signals: await backend.getSignals() });
  },

  confirmSignal: async (id, forceImmediate = false) => {
    const signal = get().signals.find(s => s.id === id);
    if (!signal) return;

    if (forceImmediate) {
      signal.entryMode = 'IMMEDIATE';
      signal.status = SignalStatus.EXECUTING;
      await backend.saveSignal(signal);
      await get().executeSignal(id);
    } else {
      signal.status = SignalStatus.WAITING_FOR_ENTRY;
      await backend.saveSignal(signal);
      await get().addLog('USER_ACTION', `Confirmed Signal: ${signal.pair}`, `Monitoring for entry.`);
    }
    set({ signals: await backend.getSignals() });
  },

  cancelSignal: async (id) => {
    const signal = get().signals.find(s => s.id === id);
    if (signal) {
      signal.status = SignalStatus.CANCELLED;
      await backend.saveSignal(signal);
      set({ signals: await backend.getSignals() });
      await get().addLog('USER_ACTION', `Cancelled signal: ${signal.pair}`);
    }
  },

  executeSignal: async (id) => {
    const signal = get().signals.find(s => s.id === id);
    if (!signal) return;
    
    if (get().credentials.sessionStatus !== 'VALID') {
       await get().addLog('ERROR', 'Blocked: Invalid Session', 'Active exchange session cookie required.');
       return;
    }

    const risk = get().calculateRisk(signal);
    if (risk.calculatedSize > get().credentials.futuresBalance * 20) {
       await get().addLog('ERROR', 'Execution Aborted', `Size too large for safety limits.`);
       return;
    }

    const position = await backend.openPosition({ ...signal, calculatedSize: risk.calculatedSize });
    await get().addLog('TRADE', `Position Opened: ${signal.pair}`, `Risk: $${risk.maxRisk}`);
    set({ 
      signals: await backend.getSignals(),
      positions: await backend.getPositions()
    });
  },

  closePosition: async (id) => {
    const pos = get().positions.find(p => p.id === id);
    const pnl = pos ? pos.unrealizedPnL : 0;
    await backend.closePosition(id, pnl);
    await get().addLog('TRADE', `Position Closed`, `PnL: $${pnl.toFixed(2)}`);
    set({ 
      signals: await backend.getSignals(),
      positions: await backend.getPositions()
    });
  },

  updateCredentials: async (creds) => {
    const updated = { ...get().credentials, ...creds };
    await backend.updateCredentials(updated);
    set({ credentials: updated });
  },

  updateConfig: (updates) => set((state) => ({ config: { ...state.config, ...updates } })),

  addLog: async (type, message, details) => {
    await backend.addLog({ type, message, details });
    set({ logs: await backend.getLogs() });
  },

  clearData: async () => {
    localStorage.clear();
    window.location.reload();
  }
}));
