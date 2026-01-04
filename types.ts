
export enum SignalStatus {
  NEW = 'NEW',
  VALIDATED = 'VALIDATED',
  PENDING = 'PENDING',
  EXECUTED = 'EXECUTED',
  CANCELLED = 'CANCELLED',
  CLOSED = 'CLOSED'
}

export enum TradeDirection {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export interface TradingSignal {
  id: string;
  timestamp: number;
  source: string;
  pair: string;
  direction: TradeDirection;
  entryPrices: number[];
  stopLoss: number;
  takeProfit: number[];
  leverage: number;
  status: SignalStatus;
  pnl?: number;
}

export interface AppConfig {
  telegramChannel: string;
  maxTradeSize: number;
  dailyLossLimit: number;
  isAssistedModeEnabled: boolean;
  isVoiceControlEnabled: boolean;
  isAutoConfirmationEnabled: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  type: 'SIGNAL' | 'USER_ACTION' | 'SYSTEM' | 'ERROR';
  message: string;
  details?: string;
}

export enum ExecutionMode {
  MANUAL = 'MANUAL',
  ASSISTED = 'ASSISTED'
}
