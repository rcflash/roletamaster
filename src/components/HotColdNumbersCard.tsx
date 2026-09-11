import React from 'react';
import { Flame, Snowflake, Sparkles, RefreshCw } from 'lucide-react';
import { NumberStats, CasinoSyncConfig } from '../types';
import { getNumberColor } from '../lib/roulette';

interface HotColdNumbersCardProps {
  numberStats: NumberStats[];
  casinoSync?: CasinoSyncConfig;
  onOpenSyncModal?: () => void;
}

export const HotColdNumbersCard: React.FC<HotColdNumbersCardProps> = ({
  numberStats,
  casinoSync,
  onOpenSyncModal,
}) => {
  const totalSpins = numberStats.reduce((acc, s) => acc + s.count, 0);

  // Top 4 Quentes calculados do Total Geral (mais frequentes; desempate por menor atraso)
  const sortedHot = [...numberStats]
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count || a.spinsWithoutHit - b.spinsWithoutHit || a.num - b.num)
    .slice(0, 4);

  // Top 4 Frias calculadas do Total Geral (mais rodadas sem sair; desempate por menor count)
  const sortedCold = [...numberStats]
    .sort((a, b) => b.spinsWithoutHit - a.spinsWithoutHit || a.count - b.count || a.num - b.num)
    .slice(0, 4);

  const isSyncActive = casinoSync?.enabled && ((casinoSync.hotNumbers?.length || 0) > 0 || (casinoSync.coldNumbers?.length || 0) > 0);

  // If sync is active, use the casino's 4 hot and 4 cold
  const statsMap = new Map<number, NumberStats>();
  numberStats.forEach((s) => statsMap.set(s.num, s));

  const displayHot = isSyncActive && casinoSync?.hotNumbers && casinoSync.hotNumbers.length > 0
    ? casinoSync.hotNumbers.map((num) => {
        const existing = statsMap.get(num);
        return existing || {
          num,
          color: getNumberColor(num),
          count: 0,
          frequencyPct: 0,
          spinsWithoutHit: 0,
        };
      })
    : sortedHot;

  const displayCold = isSyncActive && casinoSync?.coldNumbers && casinoSync.coldNumbers.length > 0
    ? casinoSync.coldNumbers.map((num) => {
        const existing = statsMap.get(num);
        return existing || {
          num,
          color: getNumberColor(num),
          count: 0,
          frequencyPct: 0,
          spinsWithoutHit: 0,
        };
      })
    : sortedCold;

  return (
    <div className="space-y-2">
      {onOpenSyncModal && (
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Modo Térmico:</span>
            {isSyncActive ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Sincronizado com Roleta ao Vivo ({casinoSync?.casinoRounds || 1000} rodadas)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold">
                Automático (Total da Mesa: {totalSpins} rodadas)
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-black transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSyncActive ? 'Editar 4 Quentes / 4 Frios' : 'Sincronizar com a Casa'}</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top 4 Quentes */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
              <h3 className="text-sm font-extrabold text-slate-100">4 NÚMEROS QUENTES</h3>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
              {isSyncActive ? `Casa (${casinoSync?.casinoRounds || 1000}r)` : `Total Geral (${totalSpins}r)`}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {displayHot.map((item, idx) => (
              <div
                key={`hot-${item.num}-${idx}`}
                className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center justify-center text-center shadow hover:border-rose-500/40 transition-colors"
              >
                <span className="text-[9px] font-mono text-slate-500 uppercase mb-0.5">#{idx + 1}</span>
                <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white mb-1 shadow-md ${
                  item.color === 'red' ? 'bg-rose-600' : item.color === 'black' ? 'bg-slate-900 ring-1 ring-slate-700' : 'bg-emerald-600 text-slate-950'
                }`}>
                  {item.num}
                </span>
                <span className="text-xs font-black text-amber-400">{item.count}x</span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {totalSpins > 0 ? `${item.frequencyPct.toFixed(1)}%` : 'Casa'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 4 Frias / Atrasadas */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Snowflake className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-extrabold text-slate-100">4 NÚMEROS FRIOS</h3>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-mono">
              {isSyncActive ? `Casa (${casinoSync?.casinoRounds || 1000}r)` : `Sem Sair`}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {displayCold.map((item, idx) => (
              <div
                key={`cold-${item.num}-${idx}`}
                className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center justify-center text-center shadow hover:border-sky-500/40 transition-colors"
              >
                <span className="text-[9px] font-mono text-slate-500 uppercase mb-0.5">#{idx + 1}</span>
                <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white mb-1 shadow-md ${
                  item.color === 'red' ? 'bg-rose-600' : item.color === 'black' ? 'bg-slate-900 ring-1 ring-slate-700' : 'bg-emerald-600 text-slate-950'
                }`}>
                  {item.num}
                </span>
                <span className="text-xs font-black text-cyan-400">
                  {item.spinsWithoutHit > 0 ? `${item.spinsWithoutHit}g` : 'Frio'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {item.spinsWithoutHit > 0 ? 'sem sair' : 'atrasado'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

