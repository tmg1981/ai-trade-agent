
import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Loader2, PlayCircle, CheckCircle2 } from 'lucide-react';
import { processVoiceIntent } from '../services/geminiService';
import { useStore } from '../store';
import { SignalStatus } from '../types';

interface VoiceAssistantProps {
  onClose: () => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'LISTENING' | 'PROCESSING' | 'CONFIRMING' | 'DONE'>('IDLE');
  const [intent, setIntent] = useState<any>(null);
  
  const recognitionRef = useRef<any>(null);
  const { signals, updateSignal, addLog, config, updateConfig } = useStore();

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript;
        setTranscript(result);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcript) handleProcess(transcript);
      };
    }
  }, [transcript]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      setStatus('LISTENING');
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleProcess = async (text: string) => {
    setStatus('PROCESSING');
    const result = await processVoiceIntent(text);
    setIntent(result);
    if (result.command !== 'UNKNOWN') {
      setStatus('CONFIRMING');
    } else {
      setStatus('IDLE');
      alert("Command not recognized. Try 'Confirm this trade' or 'Close position'");
    }
  };

  const executeIntent = () => {
    const { command, targetId } = intent;
    
    switch (command) {
      case 'CONFIRM_TRADE':
        const pending = signals.find(s => s.status === SignalStatus.VALIDATED || s.status === SignalStatus.NEW);
        if (pending) {
          updateSignal(pending.id, { status: SignalStatus.EXECUTED });
          addLog('USER_ACTION', `Voice confirm: ${pending.pair}`);
        }
        break;
      case 'CLOSE_POSITION':
        const active = signals.find(s => s.status === SignalStatus.EXECUTED);
        if (active) {
          updateSignal(active.id, { status: SignalStatus.CLOSED, pnl: 0 });
          addLog('USER_ACTION', `Voice close: ${active.pair}`);
        }
        break;
      case 'TOGGLE_ASSISTED':
        updateConfig({ isAssistedModeEnabled: !config.isAssistedModeEnabled });
        addLog('USER_ACTION', `Voice toggle assisted mode: ${!config.isAssistedModeEnabled}`);
        break;
    }
    
    setStatus('DONE');
    setTimeout(() => onClose(), 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
      <button onClick={onClose} className="absolute top-8 right-8 text-slate-400">
        <X size={32} />
      </button>

      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-8">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 relative ${
          status === 'LISTENING' ? 'bg-blue-600 scale-110 shadow-[0_0_50px_rgba(37,99,235,0.5)]' : 'bg-slate-800'
        }`}>
          {status === 'LISTENING' && (
             <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-20"></div>
          )}
          {status === 'PROCESSING' ? <Loader2 className="animate-spin text-white" size={48} /> : <Mic size={48} className="text-white" />}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">
            {status === 'IDLE' && "Tap to Speak"}
            {status === 'LISTENING' && "Listening..."}
            {status === 'PROCESSING' && "Analyzing Command..."}
            {status === 'CONFIRMING' && "Confirm Execution?"}
            {status === 'DONE' && "Command Executed"}
          </h2>
          <p className="text-slate-400 min-h-[1.5rem] italic">
            "{transcript || "Try saying 'Confirm latest signal'..."}"
          </p>
        </div>

        {status === 'CONFIRMING' && (
          <div className="flex gap-4 w-full">
            <button 
              onClick={executeIntent}
              className="flex-1 bg-blue-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={20} /> Yes, Execute
            </button>
            <button 
              onClick={() => setStatus('IDLE')}
              className="flex-1 bg-slate-800 py-4 rounded-2xl font-bold"
            >
              Cancel
            </button>
          </div>
        )}

        {status === 'IDLE' && (
          <button 
            onClick={toggleListening}
            className="w-full bg-blue-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <PlayCircle size={20} /> Start Voice Control
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistant;
