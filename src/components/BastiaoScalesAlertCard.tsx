import React, { useMemo } from 'react';
import { Sparkles, Flame, Target, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { SpinRecord } from '../types';
import { detectBastiaoScalePatterns } from '../lib/bastiaoScalesStrategy';

interface BastiaoScalesAlertCardProps {
  spins: SpinRecord[];
  onOpenPanel?: () => void;
}

export const BastiaoScalesAlertCard: React.FC<BastiaoScalesAlertCardProps> = ({
  spins,
  onOpenPanel
}) => {
  const detectedPatterns = useMemo(() => {
    return detectBastiaoScalePatterns(spins);
  }, [spins]);

  if (detectedPatterns.length === 0) return null;

  const topPattern = detectedPatterns[0];

  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border-2 border-amber-500/70 rounded-2xl p-4 shadow-xl animate-fadeIn space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
          <span className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" /> Alerta de Escala do Bastião
          </span>
        </div>
        <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black uppercase rounded">
          Confiança {topPattern.confidencePct}%
        </span>
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-black text-white">{topPattern.title}</h4>
        <p className="text-[11px] text-slate-300">{topPattern.reason}</p>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400">Entrada Recomendada:</span>
          {topPattern.targetNumbers.map((num) => (
            <span
              key={num}
              className="px-2.5 py-0.5 bg-emerald-950 border border-emerald-500 text-emerald-300 font-black text-xs rounded"
            >
              {num}
            </span>
          ))}
        </div>

        {onOpenPanel && (
          <button
            type="button"
            onClick={onOpenPanel}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-lg flex items-center gap-1 transition-all shadow"
          >
            <span>Ver Estratégia do Vídeo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
