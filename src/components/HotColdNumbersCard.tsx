import React from 'react';
import { Flame, Snowflake } from 'lucide-react';
import { NumberStats } from '../types';

interface HotColdNumbersCardProps {
  numberStats: NumberStats[];
}

export const HotColdNumbersCard: React.FC<HotColdNumbersCardProps> = ({
  numberStats,
}) => {
  const totalSpins = numberStats.reduce((acc, s) => acc + s.count, 0);

  // Top 5 Quentes calculados do Total Geral da Mesa (mais frequentes; desempate por menor atraso)
  const sortedHot = [...numberStats]
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count || a.spinsWithoutHit - b.spinsWithoutHit || a.num - b.num)
    .slice(0, 5);

  // Top 5 Frias calculadas do Total Geral da Mesa (mais rodadas sem sair; desempate por menor count)
  const sortedCold = [...numberStats]
    .sort((a, b) => b.spinsWithoutHit - a.spinsWithoutHit || a.count - b.count || a.num - b.num)
    .slice(0, 5);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top 5 Quentes */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h3 className="text-sm font-extrabold text-slate-100">5 NÚMEROS QUENTES</h3>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
              Total Geral ({totalSpins}r)
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {sortedHot.map((item, idx) => (
              <div
                key={`hot-${item.num}-${idx}`}
                className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow hover:border-rose-500/40 transition-colors"
              >
                <span className="text-[9px] font-mono text-slate-500 uppercase mb-0.5">#{idx + 1}</span>
                <span className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-black text-white mb-1 shadow-md ${
                  item.color === 'red' ? 'bg-rose-600' : item.color === 'black' ? 'bg-slate-900 ring-1 ring-slate-700' : 'bg-emerald-600 text-slate-950'
                }`}>
                  {item.num}
                </span>
                <span className="text-xs font-black text-amber-400">
                  {item.count}x
                </span>
                <span className="text-[9px] text-slate-500 font-medium">
                  {totalSpins > 0 ? `${item.frequencyPct.toFixed(1)}%` : '0%'}
                </span>
              </div>
            ))}
            {sortedHot.length === 0 && (
              <div className="col-span-5 py-6 text-center text-xs text-slate-500">
                Aguardando lançamentos para calcular os números quentes.
              </div>
            )}
          </div>
        </div>

        {/* Top 5 Frias / Atrasadas */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Snowflake className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-extrabold text-slate-100">5 NÚMEROS FRIOS</h3>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
              Sem Sair (Atraso)
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {sortedCold.map((item, idx) => (
              <div
                key={`cold-${item.num}-${idx}`}
                className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow hover:border-sky-500/40 transition-colors"
              >
                <span className="text-[9px] font-mono text-slate-500 uppercase mb-0.5">#{idx + 1}</span>
                <span className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-black text-white mb-1 shadow-md ${
                  item.color === 'red' ? 'bg-rose-600' : item.color === 'black' ? 'bg-slate-900 ring-1 ring-slate-700' : 'bg-emerald-600 text-slate-950'
                }`}>
                  {item.num}
                </span>
                <span className="text-xs font-black text-cyan-400">
                  {item.spinsWithoutHit}r
                </span>
                <span className="text-[9px] text-slate-500 font-medium">
                  {item.spinsWithoutHit > 0 ? 'sem sair' : 'recente'}
                </span>
              </div>
            ))}
            {sortedCold.length === 0 && (
              <div className="col-span-5 py-6 text-center text-xs text-slate-500">
                Aguardando lançamentos para calcular os números frios.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
