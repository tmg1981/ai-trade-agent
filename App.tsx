
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Settings as SettingsIcon, 
  ScrollText, 
  Mic, 
  AlertOctagon,
  Bell
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import AuditLog from './components/AuditLog';
import VoiceAssistant from './components/VoiceAssistant';
import { useStore } from './store';
import { SignalStatus } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'settings'>('dashboard');
  const [showVoice, setShowVoice] = useState(false);
  const { signals, addLog, updateSignal, config } = useStore();

  const handleKillSwitch = () => {
    const activeSignals = signals.filter(s => 
      s.status === SignalStatus.EXECUTED || s.status === SignalStatus.PENDING
    );
    activeSignals.forEach(s => {
      updateSignal(s.id, { status: SignalStatus.CLOSED, pnl: -1 }); // Simulating a quick exit
    });
    addLog('SYSTEM', 'EMERGENCY KILL SWITCH ACTIVATED', 'All pending and active trades closed immediately.');
    alert('Emergency Kill Switch activated. All positions closed.');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">TradeAssist</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {config.isVoiceControlEnabled && (
            <button 
              onClick={() => setShowVoice(true)}
              className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
            >
              <Mic size={20} className="text-blue-400" />
            </button>
          )}
          <button 
            onClick={handleKillSwitch}
            className="p-2 bg-red-600/20 text-red-500 rounded-full border border-red-500/30 hover:bg-red-600/30 transition-colors"
          >
            <AlertOctagon size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'logs' && <AuditLog />}
        {activeTab === 'settings' && <Settings />}
      </main>

      {/* Navigation */}
      <nav className="bg-slate-900/80 backdrop-blur-lg border-t border-slate-800 safe-bottom">
        <div className="flex justify-around items-center py-3">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'dashboard' ? 'text-blue-500' : 'text-slate-400'}`}
          >
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-medium uppercase tracking-wider">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('logs')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'logs' ? 'text-blue-500' : 'text-slate-400'}`}
          >
            <ScrollText size={24} />
            <span className="text-[10px] font-medium uppercase tracking-wider">Audit Log</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'settings' ? 'text-blue-500' : 'text-slate-400'}`}
          >
            <SettingsIcon size={24} />
            <span className="text-[10px] font-medium uppercase tracking-wider">Settings</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      {showVoice && <VoiceAssistant onClose={() => setShowVoice(false)} />}
    </div>
  );
};

export default App;
