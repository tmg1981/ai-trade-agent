
import React from 'react';
import { useStore } from '../store';
import { Clock, Info, AlertTriangle, User, Zap } from 'lucide-react';

const AuditLog: React.FC = () => {
  const { logs } = useStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'SIGNAL': return <Zap className="text-yellow-500" size={16} />;
      case 'USER_ACTION': return <User className="text-blue-500" size={16} />;
      case 'ERROR': return <AlertTriangle className="text-red-500" size={16} />;
      default: return <Info className="text-slate-500" size={16} />;
    }
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Audit Log</h2>
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Safe Execution Log</span>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getIcon(log.type)}
                <span className="text-[10px] font-bold uppercase tracking-tight text-slate-500">{log.type}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                <Clock size={12} />
                <span className="text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
            <p className="text-sm font-semibold">{log.message}</p>
            {log.details && <p className="text-xs text-slate-500 leading-relaxed">{log.details}</p>}
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-500 text-sm italic">No entries yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;
