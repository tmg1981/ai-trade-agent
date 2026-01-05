
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
  const { 
    signals, 
    positions, 
    confirmSignal, 
    closePosition, 
    cancelSignal, 
    addLog, 
    config, 
    updateConfig, 
    setActiveTab 
  } = useStore();

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

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
      speak("Command not recognized. Please try again.");
    }
  };

  const executeIntent = () => {
    const { command, targetId } = intent;
    let feedback = "Command executed.";
    
    switch (command) {
      case 'CONFIRM_TRADE':
        // Find latest signal in QUEUED or PENDING_CONFIRMATION
        const pending = signals
          .filter(s => s.status === SignalStatus.QUEUED || s.status === SignalStatus.PENDING_CONFIRMATION)
          .sort((a, b) => b.timestamp - a.timestamp)[0];
        if (pending) {
          confirmSignal(pending.id);
          addLog('USER_ACTION', `Voice confirm: ${pending.pair}`);
          feedback = `Trade confirmed for ${pending.pair}. Monitoring for entry.`;
        } else {
          feedback = "No pending trades found to confirm.";
        }
        break;

      case 'CANCEL_SIGNAL':
        // Find latest signal that isn't closed or cancelled
        const lastSignal = signals
          .filter(s => s.status !== SignalStatus.CLOSED && s.status !== SignalStatus.CANCELLED)
          .sort((a, b) => b.timestamp - a.timestamp)[0];
        if (lastSignal) {
          cancelSignal(lastSignal.id);
          addLog('USER_ACTION', `Voice cancel: ${lastSignal.pair}`);
          feedback = `Last signal for ${lastSignal.pair} has been cancelled.`;
        } else {
          feedback = "No active signals found to cancel.";
        }
        break;

      case 'CLOSE_POSITION':
        // Find positions with targetId (e.g. "BTC") or just the latest if none specified
        const target = targetId ? targetId.toUpperCase() : null;
        const toClose = positions.filter(p => !target || p.pair.toUpperCase().includes(target));
        if (toClose.length > 0) {
          toClose.forEach(p => closePosition(p.id));
          addLog('USER_ACTION', `Voice close: ${target || 'All positions'}`);
          feedback = target ? `Closing all ${target} positions.` : "Closing active positions.";
        } else {
          feedback = target ? `No active ${target} positions found.` : "No active positions found.";
        }
        break;

      case 'SHOW_TRADES':
        setActiveTab('dashboard');
        addLog('USER_ACTION', "Voice navigate: Dashboard");
        feedback = "Navigating to dashboard.";
        break;

      case 'PAUSE_TRADING':
        updateConfig({ executionMode: 'MANUAL' });
        addLog('USER_ACTION', "Voice pause: Manual mode activated");
        feedback = "Trading paused. Manual mode activated.";
        break;

      case 'TOGGLE_ASSISTED':
        const newMode = config.executionMode === 'ASSISTED' ? 'MANUAL' : 'ASSISTED';
        updateConfig({ executionMode: newMode });
        addLog('USER_ACTION', `Voice toggle execution mode: ${newMode}`);
        feedback = `Execution mode set to ${newMode}.`;
        break;
      
      default:
        feedback = "Unknown command.";
    }
    
    speak(feedback);
    setStatus('DONE');
    setTimeout(() => onClose(), 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
      <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 p-2 hover:bg-slate-800 rounded-full transition-colors">
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
            {status === 'CONFIRMING' && "Confirm Action?"}
            {status === 'DONE' && "Command Executed"}
          </h2>
          <p className="text-slate-400 min-h-[1.5rem] italic text-sm">
            "{transcript || "Try saying 'Confirm this trade'..."}"
          </p>
        </div>

        {status === 'CONFIRMING' && (
          <div className="flex gap-4 w-full">
            <button 
              onClick={executeIntent}
              className="flex-1 bg-blue-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <CheckCircle2 size={20} /> Yes, Do It
            </button>
            <button 
              onClick={() => {
                setStatus('IDLE');
                speak("Action cancelled.");
              }}
              className="flex-1 bg-slate-800 py-4 rounded-2xl font-bold active:scale-95 transition-transform"
            >
              Cancel
            </button>
          </div>
        )}

        {status === 'IDLE' && (
          <button 
            onClick={toggleListening}
            className="w-full bg-blue-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-blue-900/20"
          >
            <PlayCircle size={20} /> Start Voice Control
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistant;
