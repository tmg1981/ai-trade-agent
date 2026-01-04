
import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  Activity, 
  Zap,
  MessageSquarePlus
} from 'lucide-react';
import { useStore } from '../store';
import SignalCard from './SignalCard';
import { SignalStatus, TradeDirection } from '../types';
import { parseSignalMessage } from '../services/geminiService';

const Dashboard: React.FC = () => {
  const { signals, addSignal, addLog } = useStore();
  const [simText, setSimText] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // Stats calculation
  const closedSignals = signals.filter(s => s.status === SignalStatus.CLOSED);
  const totalPnL = closedSignals.reduce((acc, s) => acc + (s.pnl || 0), 0);
  const winCount = closedSignals.filter(s => (s.pnl || 0) > 0).length;
  const winRate = closedSignals.length > 0 ? (winCount / closedSignals.length) * 100 : 0;
  const openCount = signals.filter(s => s.status === SignalStatus.EXECUTED).length;

  const handleSimulateSignal = async () => {
    if (!simText.trim()) return;
    setIsParsing(true);
    const parsed = await parseSignalMessage(simText);
    if (parsed) {
      addSignal(parsed as any);
      setSimText('');
    } else {
      addLog('ERROR', 'Failed to parse signal message', simText);
      alert('Could not parse signal. Check format.');
    }
    setIsParsing(false);
  };

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Portfolio Overview */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <p className="text-slate-400 text-xs font-medium uppercase mb-1">Total PnL</p>
          <div className="flex items-end gap-2">
            <h2 className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${totalPnL.toFixed(2)}
            </h2>
            <Activity size={16} className="mb-1 text-slate-600" />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
          <p className="text-slate-400 text-xs font-medium uppercase mb-1">Win Rate</p>
          <div className="flex items-end gap-2">
            <h2 className="text-2xl font-bold text-blue-400">{winRate.toFixed(0)}%</h2>
            <Zap size={16} className="mb-1 text-slate-600" />
          </div>
        </div>
      </section>

      {/* Signal Simulation Tool (Phase 1 placeholder for Telegram monitoring) */}
      <section className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquarePlus size={18} className="text-blue-400" />
          <h3 className="text-sm font-semibold">Simulate Telegram Signal</h3>
        </div>
        <div className="flex gap-2">
          <input 
            type="text"
            placeholder="e.g. BTCUSDT LONG ENTRY 65000..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={simText}
            onChange={(e) => setSimText(e.target.value)}
          />
          <button 
            disabled={isParsing}
            onClick={handleSimulateSignal}
            className="bg-blue-600 px-4 py-2 rounded-xl text-sm font-bold active:scale-95 transition-all disabled:opacity-50"
          >
            {isParsing ? '...' : 'Add'}
          </button>
        </div>
      </section>

      {/* Active Trades */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            Active Trades <span className="bg-slate-800 text-xs px-2 py-0.5 rounded-full">{openCount}</span>
          </h3>
        </div>
        <div className="space-y-4">
          {signals.filter(s => s.status === SignalStatus.EXECUTED).map(signal => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
          {openCount === 0 && (
            <div className="text-center py-8 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
              <p className="text-slate-500 text-sm">No active positions</p>
            </div>
          )}
        </div>
      </section>

      {/* New & Pending Signals */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            Signals Queue
          </h3>
        </div>
        <div className="space-y-4">
          {signals.filter(s => [SignalStatus.NEW, SignalStatus.VALIDATED, SignalStatus.PENDING].includes(s.status)).map(signal => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
          {signals.filter(s => [SignalStatus.NEW, SignalStatus.VALIDATED, SignalStatus.PENDING].includes(s.status)).length === 0 && (
            <div className="text-center py-8 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
              <p className="text-slate-500 text-sm">Signal queue empty</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
