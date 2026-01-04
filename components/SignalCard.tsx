
import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { TradingSignal, SignalStatus, TradeDirection } from '../types';
import { useStore } from '../store';

interface SignalCardProps {
  signal: TradingSignal;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const { updateSignal, addLog, config } = useStore();
  const [showAssistedWizard, setShowAssistedWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);

  const handleConfirm = () => {
    if (config.isAssistedModeEnabled) {
      setShowAssistedWizard(true);
      setWizardStep(1);
    } else {
      updateSignal(signal.id, { status: SignalStatus.EXECUTED });
      addLog('USER_ACTION', `Trade executed: ${signal.pair}`, `Direction: ${signal.direction}`);
    }
  };

  const handleCancel = () => {
    updateSignal(signal.id, { status: SignalStatus.CANCELLED });
    addLog('USER_ACTION', `Signal cancelled: ${signal.pair}`);
  };

  const handleClose = () => {
    // Random PnL for demo
    const randomPnL = Math.random() > 0.4 ? 45.20 : -12.40;
    updateSignal(signal.id, { status: SignalStatus.CLOSED, pnl: randomPnL });
    addLog('USER_ACTION', `Position closed: ${signal.pair}`, `Result: $${randomPnL}`);
  };

  const assistedSteps = [
    { title: "Open Exchange", desc: "Open thetruetrade.io in your mobile browser." },
    { title: "Select Pair", desc: `Search for ${signal.pair} in the assets list.` },
    { title: "Set Parameters", desc: `Enter ${signal.direction} position with ${signal.leverage}x leverage.` },
    { title: "Execute", desc: "Double check the price and tap BUY/SELL." }
  ];

  const nextStep = () => {
    if (wizardStep < assistedSteps.length) {
      setWizardStep(wizardStep + 1);
    } else {
      setShowAssistedWizard(false);
      updateSignal(signal.id, { status: SignalStatus.EXECUTED });
      addLog('SYSTEM', `Assisted execution completed for ${signal.pair}`);
    }
  };

  const statusColors = {
    [SignalStatus.NEW]: 'bg-yellow-500/10 text-yellow-500',
    [SignalStatus.VALIDATED]: 'bg-blue-500/10 text-blue-500',
    [SignalStatus.PENDING]: 'bg-orange-500/10 text-orange-500',
    [SignalStatus.EXECUTED]: 'bg-green-500/10 text-green-500',
    [SignalStatus.CANCELLED]: 'bg-slate-500/10 text-slate-400',
    [SignalStatus.CLOSED]: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden transition-all hover:border-slate-700">
      {/* Header Info */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${signal.direction === TradeDirection.LONG ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {signal.direction === TradeDirection.LONG ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
          <div>
            <h4 className="font-bold text-lg">{signal.pair}</h4>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tight ${statusColors[signal.status]}`}>
                {signal.status}
              </span>
              <span className="text-slate-500 text-[10px]">@{signal.source || 'Signal Bot'}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">{new Date(signal.timestamp).toLocaleTimeString()}</p>
          <p className="text-sm font-semibold text-blue-400">{signal.leverage}x Leverage</p>
        </div>
      </div>

      {/* Trade Parameters */}
      <div className="px-4 py-3 bg-slate-950/50 grid grid-cols-3 gap-2 border-y border-slate-800/50">
        <div className="space-y-1">
          <p className="text-[10px] uppercase text-slate-500 font-bold">Entry</p>
          <p className="text-sm font-medium">{signal.entryPrices[0]}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase text-red-500 font-bold">Stop Loss</p>
          <p className="text-sm font-medium">{signal.stopLoss}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase text-green-500 font-bold">Target</p>
          <p className="text-sm font-medium">{signal.takeProfit[0]}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-slate-900 flex gap-2">
        {signal.status === SignalStatus.EXECUTED ? (
          <button 
            onClick={handleClose}
            className="flex-1 bg-red-600/10 text-red-500 border border-red-500/20 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <XCircle size={18} /> Close Position
          </button>
        ) : (
          <>
            <button 
              onClick={handleConfirm}
              className="flex-[2] bg-blue-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-900/20"
            >
              <CheckCircle2 size={18} /> Confirm Trade
            </button>
            <button 
              onClick={handleCancel}
              className="flex-1 bg-slate-800 text-slate-400 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {/* Assisted Mode Wizard Overlay */}
      {showAssistedWizard && (
        <div className="absolute inset-0 bg-slate-950/95 z-[60] p-6 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mb-6 border border-blue-500/30">
            <Info size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Assisted Mode: Step {wizardStep}</h3>
          <h4 className="text-blue-400 font-semibold mb-4">{assistedSteps[wizardStep-1].title}</h4>
          <p className="text-slate-400 text-sm mb-8 max-w-xs">{assistedSteps[wizardStep-1].desc}</p>
          
          <div className="flex gap-3 w-full max-w-xs">
            <button 
              onClick={nextStep}
              className="flex-1 bg-blue-600 py-3 rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              {wizardStep === assistedSteps.length ? 'Finish' : 'Next Step'} <ChevronRight size={18} />
            </button>
            <button 
              onClick={() => setShowAssistedWizard(false)}
              className="flex-1 bg-slate-800 py-3 rounded-2xl font-bold"
            >
              Abort
            </button>
          </div>
          
          <p className="mt-8 text-[10px] text-slate-600 max-w-[200px]">
            The assistant does not have direct API access. Please follow the steps manually on the exchange.
          </p>
        </div>
      )}
    </div>
  );
};

export default SignalCard;
