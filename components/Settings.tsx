
import React, { useState } from 'react';
import { 
  Smartphone, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Shield, 
  Wallet, 
  Database,
  Smartphone as PhoneIcon,
  LogOut,
  Hash,
  Info,
  ExternalLink
} from 'lucide-react';
import { useStore } from '../store';

const Settings: React.FC = () => {
  const { 
    credentials, 
    updateCredentials, 
    requestTgOtp, 
    submitTgOtp, 
    logoutTg,
    addMonitoredChannel,
    clearData,
    config,
    updateConfig
  } = useStore();

  const [phone, setPhone] = useState(credentials.tgPhoneNumber || '');
  const [otp, setOtp] = useState('');
  const [channelInput, setChannelInput] = useState('');
  const [sessionInput, setSessionInput] = useState(credentials.exchangeSessionCookie || '');

  const handleRequestOtp = () => requestTgOtp(phone);
  const handleSubmitOtp = () => submitTgOtp(otp);

  const getStatusIcon = (status: string) => {
    if (status === 'AUTHENTICATED' || status === 'VALID') return <CheckCircle2 size={14} className="text-green-500" />;
    return <AlertCircle size={14} className="text-red-500" />;
  };

  return (
    <div className="p-4 space-y-8 pb-24 max-w-lg mx-auto overflow-x-hidden">
      <div className="px-1 flex items-center justify-between">
         <h2 className="text-3xl font-black tracking-tight">Vault</h2>
         <Shield size={24} className="text-blue-500" />
      </div>

      {/* Telegram User Session */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Telegram Pipeline</h3>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
             {getStatusIcon(credentials.tgAuthStatus)}
             <span className="text-[8px] font-black uppercase text-slate-400">{credentials.tgAuthStatus}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 space-y-6">
          {credentials.tgAuthStatus === 'UNAUTHENTICATED' && (
            <div className="space-y-4">
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed italic">
                Connect your Telegram account to listen to signals from private channels without bot admin rights.
              </p>
              <div className="relative">
                <input 
                  type="tel"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs font-black focus:ring-2 focus:ring-blue-600/50 outline-none"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                />
                <PhoneIcon size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-700" />
              </div>
              <button 
                onClick={handleRequestOtp}
                className="w-full bg-blue-600 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest text-white active:scale-95"
              >
                Request Access Code
              </button>
            </div>
          )}

          {credentials.tgAuthStatus === 'PENDING_OTP' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                <Info size={14} className="text-blue-400" />
                <p className="text-[9px] font-bold text-blue-200">OTP sent to your Telegram account.</p>
              </div>
              <div className="relative">
                <input 
                  type="text"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs font-black focus:ring-2 focus:ring-blue-600/50 outline-none"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 5-digit code"
                  maxLength={5}
                />
                <Key size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-700" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleSubmitOtp}
                  className="flex-[2] bg-blue-600 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest text-white active:scale-95"
                >
                  Verify Session
                </button>
                <button 
                  onClick={() => updateCredentials({ tgAuthStatus: 'UNAUTHENTICATED' })}
                  className="flex-1 bg-slate-800 py-4 rounded-3xl font-black text-[10px] uppercase text-slate-400"
                >
                  Back
                </button>
              </div>
            </div>
          )}

          {credentials.tgAuthStatus === 'AUTHENTICATED' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                     <CheckCircle2 size={20} className="text-green-500" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase text-slate-300">Linked Account</p>
                     <p className="text-[9px] font-bold text-slate-500">{credentials.tgPhoneNumber}</p>
                   </div>
                </div>
                <button onClick={logoutTg} className="p-2 text-slate-600 hover:text-red-500">
                  <LogOut size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Monitor Channels</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs"
                    placeholder="@channel_name"
                    value={channelInput}
                    onChange={(e) => setChannelInput(e.target.value)}
                  />
                  <button 
                    onClick={() => { addMonitoredChannel(channelInput); setChannelInput(''); }}
                    className="bg-blue-600/20 text-blue-400 border border-blue-500/20 px-4 rounded-2xl text-[10px] font-black uppercase"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {credentials.tgMonitoredChannels.map(ch => (
                    <span key={ch} className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-[9px] font-bold text-slate-400">{ch}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Risk Governance */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Risk Governance Engine</h3>
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 space-y-6">
          <div className="space-y-4">
             <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black uppercase text-slate-500">Account Balance (Futures)</label>
                <span className="text-xs font-black text-blue-400 tabular-nums">${credentials.futuresBalance.toLocaleString()}</span>
             </div>
             <div className="relative">
                <input 
                  type="number" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs font-black focus:ring-2 focus:ring-blue-600/50 outline-none"
                  value={credentials.futuresBalance}
                  onChange={(e) => updateCredentials({ futuresBalance: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
                <Wallet size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-700" />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Risk Per Trade (%)</label>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 flex items-center justify-between">
                <span className="text-xs font-black text-red-500">{credentials.riskPercent}%</span>
                <input 
                  type="range" min="0.5" max="10" step="0.5"
                  className="w-24 accent-red-600"
                  value={credentials.riskPercent}
                  onChange={(e) => updateCredentials({ riskPercent: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Daily Stop ($)</label>
              <input 
                type="number"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs font-black"
                value={config.dailyLossLimit}
                onChange={(e) => updateConfig({ dailyLossLimit: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Exchange Session */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Exchange Integration</h3>
          <div className={`px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[8px] font-black uppercase ${credentials.sessionStatus === 'VALID' ? 'text-green-500' : 'text-slate-500'}`}>
             {credentials.sessionStatus || 'UNSET'}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 space-y-4">
           <p className="text-[9px] font-bold text-slate-500 leading-relaxed italic">
             Extract session cookies from <span className="underline italic">thetruetrade.io</span> using your browser's DevTools to enable assisted automation.
           </p>
           <textarea 
             className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-xs font-mono resize-none h-24"
             value={sessionInput}
             onChange={(e) => setSessionInput(e.target.value)}
             placeholder="Paste exchange cookies here..."
           />
           <button 
             onClick={() => updateCredentials({ exchangeSessionCookie: sessionInput, sessionStatus: 'VALID' })}
             className="w-full bg-slate-800 py-4 rounded-3xl font-black text-[10px] uppercase text-white active:scale-95"
           >
             Save & Validate Session
           </button>
        </div>
      </section>

      <div className="pt-4 px-2 flex flex-col items-center">
        <button onClick={clearData} className="text-red-900/40 hover:text-red-600 text-[9px] font-black uppercase tracking-[0.4em] flex items-center gap-2">
          <Database size={10} /> Reset System State
        </button>
      </div>
    </div>
  );
};

export default Settings;
