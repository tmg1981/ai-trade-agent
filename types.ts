
export enum SignalStatus {
  RECEIVED = 'RECEIVED',
  PARSED = 'PARSED',
  QUEUED = 'QUEUED',
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  WAITING_FOR_ENTRY = 'WAITING_FOR_ENTRY',
  EXECUTING = 'EXECUTING',
  EXECUTED = 'EXECUTED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
  CLOSED = 'CLOSED'
}

export enum SignalType {
  NEW = 'NEW',
  UPDATE = 'UPDATE',
  CLOSE = 'CLOSE'
}

export enum TradeDirection {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export interface TradingSignal {
  id: string;
  parentSignalId?: string;
  type: SignalType;
  timestamp: number;
  source: string;
  rawText: string;
  pair: string;
  direction: TradeDirection;
  entryPrices: number[];
  stopLoss: number;
  takeProfit: number[];
  leverage: number;
  status: SignalStatus;
  pnl?: number;
  allocationHint?: string;
  notes?: string;
  calculatedSize?: number;
  maxRiskAmount?: number;
  executionMode: 'MANUAL' | 'ASSISTED';
  entryMode: 'IMMEDIATE' | 'CONDITIONAL';
}

export interface Position extends TradingSignal {
  entryTime: number;
  currentPrice: number;
  size: number;
  unrealizedPnL: number;
}

export type TelegramAuthStatus = 'UNAUTHENTICATED' | 'PENDING_OTP' | 'AUTHENTICATED' | 'EXPIRED' | 'ERROR';

export interface UserCredentials {
  // Telegram User Session (Phase 2 Upgrade)
  tgPhoneNumber?: string;
  tgAuthStatus: TelegramAuthStatus;
  tgLastSync?: number;
  tgMonitoredChannels: string[]; // IDs or usernames
  
  // Exchange Session
  exchangeSessionCookie?: string;
  futuresBalance: number;
  riskPercent: number; // 1-5%
  sessionStatus?: 'VALID' | 'INVALID' | 'EXPIRED' | 'UNSET';
}

export interface AppConfig {
  maxTradeSize: number;
  dailyLossLimit: number;
  executionMode: 'MANUAL' | 'ASSISTED';
  isVoiceEnabled: boolean;
  riskMultiplier: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  type: 'SIGNAL' | 'USER_ACTION' | 'SYSTEM' | 'ERROR' | 'TRADE';
  message: string;
  details?: string;
}
