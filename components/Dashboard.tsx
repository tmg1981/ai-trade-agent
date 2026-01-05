
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap,
  MessageSquarePlus,
  Loader2,
  Bell,
  Clock,
  ArrowRightCircle,
  Wallet,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useStore } from '../store';
import SignalCard from './SignalCard';
import { SignalStatus } from '../types';
import { telegramService } from '../services/telegramService';

const Dashboard: React.FC = () => {
  const { signals, positions, init, isLoading, credentials, config, syncBalance } = useStore();
  const [simText, setSimText] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => { init(); }, []);

  const closedSignals = signals.filter(s => s.status === SignalStatus.CLOSED);
  const totalClosedPnL = closedSignals.reduce((acc, s) => acc + (s.pnl || 0), 0);
  const unrealizedPnL = positions.reduce((acc, p) => acc + (p.unrealizedPnL || 0), 0);
  const totalPnL = totalClosedPnL + unrealizedPnL;
  
  const winCount = closedSignals.filter(s => (s.pnl || 0) > 0).length;
  const winRate = closedSignals.length > 0 ? (winCount / closedSignals.length) * 100 : 0;

  const handleSimulateMessage = async () => {
    if (!simText.trim()) return;
    setIsSimulating(true);
    await telegramService.simulateIncomingMessage(simText);
    setSimText('');
    setIsSimulating(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await syncBalance();
    setIsSyncing(false);
  };

  if (isLoading) return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-950">
      <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
      <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Syncing Exchange Data...</p>
    </div>
  );

  return (
    <div className="p-4 space-y-6 pb-24 max-w-lg mx-auto">
      {/* Capital & Balance Overview */}
      <section className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Wallet size={80} />
        </div>
        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Futures Capital</p>
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className={`p-1 hover:bg-slate-800 rounded-full transition-colors ${isSyncing ? 'animate-spin' : ''}`}
              >
                <RefreshCw size={10} className="text-slate-500" />
              </button>
            </div>
            <h2 className="text-4xl font-black tabular-nums text-white">
              ${credentials.futuresBalance.toLocaleString()}
            </h2>
          </div>
          <div className="text-right">
             <div className="bg-blue-600/20 px-3 py-1 rounded-full border border-blue-500/30">
                <span className="text-[10px] font-black text-blue-400">RISK: {credentials.riskPercent}%</span>
             </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800/50">
           <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Global PnL</span>
              <span className={`text-sm font-black ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </span>
           </div>
           <div className="flex flex-col text-right">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Efficiency</span>
              <span className="text-sm font-black text-blue-400">{winRate.toFixed(1)}% WR</span>
           </div>
        </div>
      </section>

      {/* Stats Summary Bar */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 text-green-500 rounded-xl"><Activity size={16} /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase">Live</span>
          </div>
          <span className="text-sm font-black">{positions.length}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl"><ShieldCheck size={16} /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase">Mode</span>
          </div>
          <span className="text-[10px] font-black text-orange-400 uppercase tracking-tighter">{config.executionMode}</span>
        </div>
      </section>

      {/* Manual Ingestion */}
      <section className="bg-slate-900/50 border border-slate-800 p-5 rounded-[2.5rem]">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquarePlus size={18} className="text-blue-500" />
          <h3 className="text-xs font-black uppercase tracking-widest">Direct Signal Input</h3>
        </div>
        <div className="flex gap-2">
          <input 
            type="text"
            placeholder="Paste raw signal text..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs focus:ring-1 focus:ring-blue-600 outline-none transition-all"
            value={simText}
            onChange={(e) => setSimText(e.target.value)}
          />
          <button 
            disabled={isSimulating}
            onClick={handleSimulateMessage}
            className="bg-blue-600 px-5 rounded-2xl font-black text-[10px] uppercase active:scale-95 disabled:opacity-50 text-white"
          >
            {isSimulating ? '...' : 'Inject'}
          </button>
        </div>
      </section>

      {/* Signals Feed */}
      <div className="space-y-6">
        {positions.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest px-1 flex items-center gap-2">
              <Activity size={14} /> Active Positions
            </h3>
            {positions.map(pos => <SignalCard key={pos.id} signal={pos} />)}
          </section>
        )}

        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest px-1 flex items-center gap-2">
            <Clock size={14} /> Processing Queue
          </h3>
          <div className="space-y-4">
            {signals.filter(s => [SignalStatus.QUEUED, SignalStatus.PENDING_CONFIRMATION, SignalStatus.WAITING_FOR_ENTRY, SignalStatus.PARSED].includes(s.status)).map(signal => (
              <SignalCard key={signal.id} signal={signal} />
            ))}
            {signals.filter(s => [SignalStatus.QUEUED, SignalStatus.PENDING_CONFIRMATION, SignalStatus.WAITING_FOR_ENTRY, SignalStatus.PARSED].includes(s.status)).length === 0 && (
              <div className="py-10 text-center bg-slate-900/40 rounded-[2.5rem] border border-dashed border-slate-800">
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Pipeline Empty</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
