
import { TradingSignal, Position, UserCredentials, AuditLogEntry, SignalStatus } from '../types';

/**
 * PERSISTENT DATABASE SERVICE
 * Simulates a PostgreSQL backend with localStorage persistence.
 */
class BackendDB {
  private STORAGE_KEY = 'trade_assist_db';

  private data = {
    signals: [] as TradingSignal[],
    positions: [] as Position[],
    logs: [] as AuditLogEntry[],
    credentials: {} as UserCredentials
  };

  constructor() {
    this.load();
  }

  private load() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.data = JSON.parse(saved);
      } catch (e) {
        console.error("Database corruption detected. Resetting state.");
      }
    }
  }

  private save() {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
  }

  // API Methods
  async getSignals() { return this.data.signals; }
  
  async saveSignal(signal: TradingSignal) {
    this.data.signals = [signal, ...this.data.signals.filter(s => s.id !== signal.id)];
    this.save();
    return signal;
  }

  async getPositions() { return this.data.positions; }

  async openPosition(signal: TradingSignal) {
    const position: Position = {
      ...signal,
      status: SignalStatus.EXECUTED,
      entryTime: Date.now(),
      currentPrice: signal.entryPrices[0],
      size: signal.calculatedSize || 100, // Now correctly respects calculated risk size
      unrealizedPnL: 0
    };
    this.data.positions.push(position);
    this.data.signals = this.data.signals.map(s => s.id === signal.id ? { ...s, status: SignalStatus.EXECUTED } : s);
    this.save();
    return position;
  }

  async closePosition(id: string, pnl: number) {
    this.data.positions = this.data.positions.filter(p => p.id !== id);
    this.data.signals = this.data.signals.map(s => s.id === id ? { ...s, status: SignalStatus.CLOSED, pnl } : s);
    this.save();
  }

  async getCredentials() { return this.data.credentials; }
  
  async updateCredentials(creds: UserCredentials) {
    this.data.credentials = { ...this.data.credentials, ...creds };
    this.save();
  }

  async getLogs() { return this.data.logs; }

  async addLog(log: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    const entry: AuditLogEntry = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
    this.data.logs = [entry, ...this.data.logs].slice(0, 100);
    this.save();
    return entry;
  }
}

export const backend = new BackendDB();
