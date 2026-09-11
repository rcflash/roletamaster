import React, { useMemo } from 'react';
import { Shield, CheckCircle2, ArrowRight, Zap, Target } from 'lucide-react';
import { SpinRecord, BankrollConfig } from '../types';
import { detectJamesBondAlerts } from '../lib/jamesBondStrategy';

interface JamesBondAlertCardProps {
  spins: SpinRecord[];
  config: BankrollConfig;
  onOpenPanel?: () => void;
}

export const JamesBondAlertCard: React.FC<JamesBondAlertCardProps> = ({
  spins,
  config,
  onOpenPanel,
}) => {
  const chipVal = config.defaultSpinCost ? Math.max(0.5, Number((config.defaultSpinCost / 20).toFixed(2))) : 0.5;

  const alerts = useMemo(() => {
    return detectJamesBondAlerts(spins, chipVal);
  }, [spins, chipVal]);

  if (alerts.length === 0) return null;

  const topAlert = alerts[0];

  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border-2 border-amber-500/70 rounded-2xl p-4 shadow-xl animate-fadeIn space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
          <span className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-amber-400" /> Alerta James Bond (007)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase rounded">
            {topAlert.badge}
          </span>
          <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black uppercase rounded">
            Confiança {topAlert.confidencePct}%
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-black text-white flex items-center gap-1.5">
          <span>{topAlert.title}</span>
        </h4>
        <p className="text-[11px] text-slate-300 leading-relaxed">{topAlert.description}</p>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-800 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400">Distribuição Sugerida:</span>
          <span className="px-3 py-1 bg-amber-950/90 border border-amber-500/80 text-amber-300 font-black text-xs rounded-lg flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            20 Fichas ({config.currency} {(20 * chipVal).toFixed(2)})
          </span>
          <span className="text-[10px] text-slate-400">
            {topAlert.distributionText}
          </span>
        </div>

        {onOpenPanel && (
          <button
            onClick={onOpenPanel}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center gap-1 shadow-md hover:scale-105 active:scale-95"
          >
            <span>Ver Guia & Simulador 007</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
