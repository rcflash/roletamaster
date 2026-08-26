import React, { useMemo } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap, ChevronRight, Crosshair } from 'lucide-react';
import { SpinRecord } from '../types';
import { calculateHorseCyclesAlert, HORSE_FAMILIES } from '../lib/horseCyclesStrategy';
import { getNumberColor } from '../lib/roulette';

interface HorseCyclesAlertCardProps {
  spins: SpinRecord[];
  neighborRadius?: 0 | 1 | 2;
  onOpenFullPanel?: () => void;
}

export const HorseCyclesAlertCard: React.FC<HorseCyclesAlertCardProps> = ({
  spins,
  neighborRadius = 1,
  onOpenFullPanel,
}) => {
  const alert = useMemo(() => {
    const radius: 0 | 1 | 2 = neighborRadius === 0 ? 0 : neighborRadius === 2 ? 2 : 1;
    return calculateHorseCyclesAlert(spins, radius, 50);
  }, [spins, neighborRadius]);

  if (!alert.hasAlert) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 text-slate-400">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-500">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">
              Radar de Cavalos & Crescente de Ímpares (Bastião)
            </span>
            <span className="text-[11px] text-slate-500">
              Aguardando formação de 2 de 3 do cavalo, intercalação ou progressão ímpar.
            </span>
          </div>
        </div>
        {onOpenFullPanel && (
          <button
            onClick={onOpenFullPanel}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1 shrink-0"
          >
            <span>Ver Painel</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  const horseDef = HORSE_FAMILIES[alert.targetHorse];

  return (
    <div className="bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border border-sky-500/40 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/50 flex items-center justify-center text-sky-300 shadow-md">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black uppercase text-sky-200 tracking-tight">
                {alert.title}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-sky-500 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                {alert.confidencePct}% Convicção
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">{alert.message}</p>
          </div>
        </div>

        {onOpenFullPanel && (
          <button
            onClick={onOpenFullPanel}
            className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 shrink-0 shadow-lg shadow-sky-500/20"
          >
            <span>Abrir Estratégia</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black uppercase text-slate-400">Alvos Recomendados ({alert.wheelCoveredNumbers.length} números com vizinhos):</span>
          <div className="flex items-center gap-1 flex-wrap">
            {alert.wheelCoveredNumbers.slice(0, 14).map((num) => {
              const isDirect = alert.targetDirectNumbers.includes(num);
              return (
                <span
                  key={num}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white shadow-sm ${
                    num === 0
                      ? 'bg-emerald-600 ring-1 ring-emerald-300'
                      : isDirect
                      ? 'bg-sky-500 ring-2 ring-sky-300 text-slate-950 font-extrabold'
                      : getNumberColor(num) === 'red'
                      ? 'bg-rose-600'
                      : 'bg-slate-950 border border-slate-700'
                  }`}
                >
                  {num}
                </span>
              );
            })}
            {alert.wheelCoveredNumbers.length > 14 && (
              <span className="text-[10px] text-slate-400 font-bold">
                +{alert.wheelCoveredNumbers.length - 14} vizinhos
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>±{neighborRadius} Vizinho no Cilindro (Nunca Seco)</span>
        </div>
      </div>
    </div>
  );
};
