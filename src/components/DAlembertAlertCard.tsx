import React, { useMemo } from 'react';
import { Scale, ArrowRight, Zap, CheckCircle2, ShieldCheck, Flame, TrendingUp } from 'lucide-react';
import { SpinRecord, BankrollConfig } from '../types';
import { detectDAlembertAlerts, DAlembertPatternAlert } from '../lib/dalembertStrategy';

interface DAlembertAlertCardProps {
  spins: SpinRecord[];
  config: BankrollConfig;
  onOpenPanel?: () => void;
}

export const DAlembertAlertCard: React.FC<DAlembertAlertCardProps> = ({
  spins,
  config,
  onOpenPanel,
}) => {
  const baseUnit = config.defaultSpinCost ? Math.max(1, Math.round(config.defaultSpinCost / 5)) : 5;

  const alerts = useMemo(() => {
    return detectDAlembertAlerts(spins, baseUnit);
  }, [spins, baseUnit]);

  if (alerts.length === 0) return null;

  const topAlert = alerts[0];

  return (
    <div className="bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border-2 border-sky-500/70 rounded-2xl p-4 shadow-xl animate-fadeIn space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping"></span>
          <span className="text-xs font-black uppercase text-sky-300 tracking-wider flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-sky-400" /> Alerta de Entrada D'Alembert
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-black uppercase rounded">
            {topAlert.badge}
          </span>
          <span className="px-2.5 py-0.5 bg-sky-500 text-slate-950 text-[10px] font-black uppercase rounded">
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
          <span className="text-[11px] font-bold text-slate-400">Aposta Sugerida:</span>
          <span className="px-3 py-1 bg-emerald-950 border border-emerald-500 text-emerald-300 font-black text-xs rounded-lg flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {topAlert.recommendedBet} ({config.currency} {topAlert.suggestedUnitBet.toFixed(2)})
          </span>
          <span className="text-[10px] text-slate-400">
            Regra: se errar ➔ +1 ficha; se acertar ➔ -1 ficha
          </span>
        </div>

        {onOpenPanel && (
          <button
            type="button"
            onClick={onOpenPanel}
            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-[11px] rounded-xl flex items-center gap-1.5 transition-all shadow-md hover:scale-[1.02]"
          >
            <span>Abrir Guia D'Alembert</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
