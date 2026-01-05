
import { parseSignalMessage } from './geminiService';
import { TradingSignal, SignalStatus } from '../types';

export class TelegramService {
  private static instance: TelegramService;
  private isListening = false;
  private pollInterval?: number;
  private onSignalReceived?: (signal: Partial<TradingSignal>) => void;

  static getInstance() {
    if (!this.instance) this.instance = new TelegramService();
    return this.instance;
  }

  /**
   * Register the handler for incoming signals. 
   * This ensures the "Inject" button works even if the user session isn't active.
   */
  registerSignalHandler(callback: (signal: Partial<TradingSignal>) => void) {
    this.onSignalReceived = callback;
  }

  async requestOtp(phone: string): Promise<boolean> {
    console.log(`Telegram Auth: Requesting code for ${phone}`);
    // Simulated delay
    await new Promise(r => setTimeout(r, 1000));
    return true;
  }

  async verifyCode(code: string): Promise<boolean> {
    console.log(`Telegram Auth: Verifying code ${code}`);
    await new Promise(r => setTimeout(r, 1200));
    return code === '12345';
  }

  startUserSession() {
    if (this.isListening) return;
    this.isListening = true;

    console.log("Telegram User Session: Listening for real-time channel updates...");

    this.pollInterval = window.setInterval(async () => {
      // Simulation of a user-subscribed channel post
      if (Math.random() > 0.99) {
        const mockMessages = [
          "URGENT: BTC/USDT LONG ENTRY 64800 SL 63200 TP 67000. Risk 2% of capital.",
          "UPDATE: Move SL on ETH/USDT to 3450.",
          "CLOSE SOL/USDT NOW @ MARKET. Full profits booked."
        ];
        const randomMsg = mockMessages[Math.floor(Math.random() * mockMessages.length)];
        
        const parsed = await parseSignalMessage(randomMsg);
        if (parsed && this.onSignalReceived) {
          this.onSignalReceived({
            ...parsed,
            source: "Telegram Channel (User Session)",
            status: SignalStatus.QUEUED
          });
        }
      }
    }, 15000);
  }

  stop() {
    this.isListening = false;
    if (this.pollInterval) window.clearInterval(this.pollInterval);
  }

  async simulateIncomingMessage(text: string) {
    // If no handler is registered, we can't do anything
    if (!this.onSignalReceived) {
      console.warn("TelegramService: No signal handler registered.");
      return;
    }

    const parsed = await parseSignalMessage(text);
    if (parsed) {
      this.onSignalReceived({
        ...parsed,
        source: "Manual Ingestion",
        status: SignalStatus.QUEUED
      });
    }
  }
}

export const telegramService = TelegramService.getInstance();
