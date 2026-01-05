
import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Info,
  Code,
  ArrowUpRight
} from 'lucide-react';
import { TradingSignal, SignalStatus, TradeDirection, Position, SignalType } from '../types';
import { useStore } from '../store';
import { ExecutionService, ExecutionStep } from '../services/executionService';

interface SignalCardProps {
  signal: TradingSignal | Position;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const { executeSignal, confirmSignal, closePosition, cancelSignal, config, calculateRisk } = useStore();
  const [isExecuting, setIsExecuting] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [steps, setSteps] = useState<ExecutionStep[]>([]);

  const risk = calculateRisk(signal);

  const handleConfirm = async () => {
    await confirmSignal(signal.id, false);
  };

  const handleExecuteNow = async () => {
    setIsExecuting(true);
    if (config.executionMode === 'ASSISTED') {
      const success = await ExecutionService.executeAssisted(signal, (updatedSteps) => {
        setSteps(updatedSteps);
      });
      if (success) {
        await confirmSignal(signal.id, true);
      } else {
        alert("Assisted Execution Aborted. Page structure mismatch.");
      }
    } else {
      await confirmSignal(signal.id, true);
    }
    setTimeout(() => setIsExecuting(false), 2000);
  };

  const isPosition = signal.status === SignalStatus.EXECUTED;
  const isWaiting = signal.status === SignalStatus.WAITING_FOR_ENTRY;
  const isReviewable = [SignalStatus.QUEUED, SignalStatus.PARSED, SignalStatus.PENDING_CONFIRMATION].includes(signal.status);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden relative transition-all shadow-xl">
      <div className={`absolute top-0 left-0 right-0 h-1 ${signal.direction === TradeDirection.LONG ? 'bg-green-500' : 'bg-red-500'}`}></div>

      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${signal.direction === TradeDirection.LONG ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              {signal.direction === TradeDirection.LONG ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
            <div>
              <h4 className="font-black text-base flex items-center gap-2">
                {signal.pair}
                <span className={`text-[8px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-500`}>
                  {signal.type}
                </span>
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[8px] font-black uppercase tracking-widest ${
                  isPosition ? 'text-green-500' : isWaiting ? 'text-orange-500 animate-pulse' : 'text-slate-500'
                }`}>
                  {signal.status}
                </span>
                <span className="text-slate-600 text-[8px] font-black">LEV {signal.leverage}X</span>
              </div>
            </div>
          </div>
          <button onClick={() => setShowRaw(!showRaw)} className="p-2 text-slate-700 hover:text-blue-500 transition-colors">
            <Code size={16} />
          </button>
        </div>

        {showRaw ? (
          <div className="bg-slate-950 p-4 rounded-3xl border border-slate-800 font-mono text-[9px] text-slate-500 leading-relaxed max-h-32 overflow-y-auto">
             {signal.rawText}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/50 p-3 rounded-3xl border border-slate-800/50">
                <p className="text-[7px] font-black text-slate-500 uppercase mb-1">Calculated Size</p>
                <p className="text-xs font-black text-blue-400">${risk.calculatedSize.toLocaleString()}</p>
                <p className="text-[8px] text-slate-600 font-bold mt-0.5">Risking ${risk.maxRisk}</p>
              </div>
              <div className="bg-slate-950/50 p-3 rounded-3xl border border-slate-800/50">
                <p className="text-[7px] font-black text-slate-500 uppercase mb-1">Liquidation Distance</p>
                <p className="text-xs font-black text-orange-500">{risk.liquidationDistance.toFixed(1)}%</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-4 rounded-3xl border border-slate-800">
              <div>
                <p className="text-[7px] font-black text-slate-600 uppercase mb-1">Entry</p>
                <p className="text-xs font-black tabular-nums">{signal.entryPrices[0] || '---'}</p>
              </div>
              <div>
                <p className="text-[7px] font-black text-red-600/60 uppercase mb-1">Stop</p>
                <p className="text-xs font-black tabular-nums text-red-500/80">{signal.stopLoss || '---'}</p>
              </div>
              <div>
                <p className="text-[7px] font-black text-green-600/60 uppercase mb-1">Target</p>
                <p className="text-xs font-black tabular-nums text-green-500/80">{signal.takeProfit[0] || '---'}</p>
              </div>
            </div>

            {signal.notes && (
              <div className="flex gap-2 items-start bg-slate-800/20 p-3 rounded-2xl">
                <Info size={12} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-slate-400 font-medium italic">{signal.notes}</p>
              </div>
            )}
          </div>
        )}

        <div className="pt-2 flex flex-col gap-2">
          {isPosition ? (
            <button onClick={() => closePosition(signal.id)} className="w-full bg-red-600/10 text-red-500 border border-red-500/20 py-4 rounded-3xl font-black text-[9px] uppercase tracking-widest active:scale-95">
              Close Position
            </button>
          ) : (
            <>
              {isReviewable && (
                <div className="flex gap-2">
                   <button 
                    onClick={handleConfirm}
                    className="flex-1 bg-slate-800 text-white py-4 rounded-3xl font-black text-[9px] uppercase tracking-widest"
                  >
                    Confirm (Wait)
                  </button>
                  <button 
                    onClick={handleExecuteNow}
                    className="flex-1 bg-blue-600 text-white py-4 rounded-3xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-900/20"
                  >
                    <Zap size={14} fill="currentColor" /> Execute Now
                  </button>
                </div>
              )}
              {isWaiting && (
                 <button 
                  onClick={handleExecuteNow}
                  className="w-full bg-orange-600 text-white py-4 rounded-3xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <ArrowUpRight size={14} /> Force Market Entry
                </button>
              )}
              <button onClick={() => cancelSignal(signal.id)} className="w-full bg-slate-900 text-slate-600 py-3 rounded-3xl font-black text-[8px] uppercase tracking-widest">
                Discard Signal
              </button>
            </>
          )}
        </div>
      </div>

      {isExecuting && (
        <div className="absolute inset-0 z-50 bg-slate-950/98 flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-6 relative">
             <ShieldCheck size={32} className="text-blue-500" />
             <div className="absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="w-full space-y-3">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${step.status === 'DONE' ? 'bg-green-500' : step.status === 'RUNNING' ? 'bg-blue-500 animate-pulse' : 'bg-slate-800'}`}></div>
                <p className={`text-[9px] font-black uppercase ${step.status === 'RUNNING' ? 'text-white' : 'text-slate-500'}`}>{step.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SignalCard;
