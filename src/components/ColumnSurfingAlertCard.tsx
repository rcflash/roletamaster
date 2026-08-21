import React, { useMemo } from 'react';
import {
  Waves,
  Flame,
  Clock,
  ArrowRight,
  ShieldCheck,
  Target,
  Sparkles
} from 'lucide-react';
import { SpinRecord, StrategyConfig } from '../types';
import {
  COLUMN_LABELS,
  calculateColumnSurfingAlert
} from '../lib/columnSurfingStrategy';

interface ColumnSurfingAlertCardProps {
  spins: SpinRecord[];
  strategy?: StrategyConfig;
  onUpdateStrategy?: (updated: Partial<StrategyConfig>) => void;
  onNavigateToPanel: () => void;
}

export const ColumnSurfingAlertCard: React.FC<ColumnSurfingAlertCardProps> = ({
  spins,
  onNavigateToPanel
}) => {
  const alert = useMemo(() => {
    return calculateColumnSurfingAlert(spins, 20, 65);
  }, [spins]);

  return (
    <div
      className={`rounded-xl border p-3.5 sm:p-4 shadow-sm transition-all ${
        alert.hasAlert
          ? alert.alertType === 'BREAKOUT_TRIGGER'
            ? 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-indigo-950/80 border-amber-500/50 ring-2 ring-amber-500/30'
            : 'bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/80 border-cyan-500/50 ring-2 ring-cyan-500/30'
          : 'bg-slate-900 border-slate-800'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-md ring-1 ring-indigo-400/40 shrink-0 mt-0.5 sm:mt-0">
            <Waves className="w-5 h-5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-100 uppercase tracking-tight">
                Alerta de Surfe de Colunas (Método Bastião)
              </span>

              {alert.hasAlert ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm animate-pulse">
                  <Flame className="w-3 h-3" />
                  {alert.alertType === 'BREAKOUT_TRIGGER' ? 'Gatilho de Quebra' : 'Onda Ativa'}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-slate-700">
                  <Clock className="w-3 h-3" />
                  Monitorando
                </span>
              )}

              {alert.isQuireraMode && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase">
                  <ShieldCheck className="w-3 h-3 inline mr-1" />
                  Quirera ({alert.currentSurfStreak}x Greens)
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-snug">
              {alert.reason}
            </p>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap pt-0.5">
              <span>Entrada:</span>
              <strong className="text-cyan-300 font-bold">
                {COLUMN_LABELS[alert.dominantCols[0]]} + {COLUMN_LABELS[alert.dominantCols[1]]}
              </strong>
              <span>|</span>
              <span>Terminais:</span>
              <strong className="text-amber-300 font-bold font-mono">
                {alert.recommendedTerminals.join(', ')}
              </strong>
            </div>
          </div>
        </div>

        <button
          onClick={onNavigateToPanel}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm shrink-0 w-full sm:w-auto justify-center"
        >
          <span>Abrir Painel & Vídeo</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
