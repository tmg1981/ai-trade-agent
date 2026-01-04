
import React from 'react';
import { 
  ShieldAlert, 
  Smartphone, 
  Target, 
  BellRing, 
  ChevronRight,
  Database,
  Lock
} from 'lucide-react';
import { useStore } from '../store';

const Settings: React.FC = () => {
  const { config, updateConfig, clearSignals, addLog } = useStore();

  const handleReset = () => {
    if (confirm("Clear all signals and history? This cannot be undone.")) {
      clearSignals();
      addLog('USER_ACTION', 'Signal database cleared by user');
    }
  };

  return (
    <div className="p-4 space-y-8 pb-20">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      {/* Signal Source */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Signal Source</h3>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Smartphone size={20} /></div>
              <div>
                <p className="text-sm font-semibold">Telegram Source</p>
                <p className="text-xs text-slate-500">{config.telegramChannel}</p>
              </div>
            </div>
            <button className="text-blue-500 text-xs font-bold">Edit</button>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 text-orange-400 rounded-lg"><Lock size={20} /></div>
              <p className="text-sm font-semibold">Exchange Session</p>
            </div>
            <span className="text-green-500 text-[10px] font-bold uppercase">Active</span>
          </div>
        </div>
      </section>

      {/* Risk Parameters */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Risk & Safety</h3>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Max Trade Size ($)</label>
              <span className="text-blue-400 font-bold">{config.maxTradeSize}</span>
            </div>
            <input 
              type="range" min="10" max="5000" step="10"
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              value={config.maxTradeSize}
              onChange={(e) => updateConfig({ maxTradeSize: Number(e.target.value) })}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Daily Loss Limit ($)</label>
              <span className="text-red-400 font-bold">{config.dailyLossLimit}</span>
            </div>
            <input 
              type="range" min="50" max="1000" step="50"
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-600"
              value={config.dailyLossLimit}
              onChange={(e) => updateConfig({ dailyLossLimit: Number(e.target.value) })}
            />
          </div>
        </div>
      </section>

      {/* Feature Toggles */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Execution & Interface</h3>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><Target size={20} /></div>
              <div>
                <p className="text-sm font-semibold">Assisted Mode (Phase 2)</p>
                <p className="text-[10px] text-slate-500">Guides you through manual execution</p>
              </div>
            </div>
            <input 
              type="checkbox" 
              checked={config.isAssistedModeEnabled}
              onChange={(e) => updateConfig({ isAssistedModeEnabled: e.target.checked })}
              className="w-10 h-6 bg-slate-700 rounded-full appearance-none relative checked:bg-blue-600 transition-all after:content-[''] after:absolute after:w-4 after:h-4 after:bg-white after:rounded-full after:top-1 after:left-1 checked:after:left-5 after:transition-all"
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg"><BellRing size={20} /></div>
              <p className="text-sm font-semibold">Auto-Confirm (Risky)</p>
            </div>
            <input 
              type="checkbox" 
              checked={config.isAutoConfirmationEnabled}
              onChange={(e) => updateConfig({ isAutoConfirmationEnabled: e.target.checked })}
              className="w-10 h-6 bg-slate-700 rounded-full appearance-none relative checked:bg-red-600 transition-all after:content-[''] after:absolute after:w-4 after:h-4 after:bg-white after:rounded-full after:top-1 after:left-1 checked:after:left-5 after:transition-all"
            />
          </div>
        </div>
      </section>

      {/* Critical Actions */}
      <section className="pt-4">
        <button 
          onClick={handleReset}
          className="w-full bg-red-600/10 text-red-500 border border-red-500/30 py-4 rounded-2xl font-bold text-sm active:bg-red-600/20 transition-all flex items-center justify-center gap-2"
        >
          <Database size={18} /> Reset Application Data
        </button>
        <p className="text-[10px] text-center text-slate-600 mt-4 leading-relaxed">
          Version 0.2.0 (Phase 1 & 2) <br />
          TradeAssist is a decision support tool. No financial guarantees.
        </p>
      </section>
    </div>
  );
};

export default Settings;
