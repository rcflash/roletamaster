import React from 'react';
import { Flame, Snowflake } from 'lucide-react';
import { NumberStats } from '../types';

interface HotColdNumbersCardProps {
  numberStats: NumberStats[];
}

export const HotColdNumbersCard: React.FC<HotColdNumbersCardProps> = ({ numberStats }) => {
  const sortedHot = [...numberStats].sort((a, b) => b.count - a.count || a.num - b.num).slice(0, 5);
  const sortedCold = [...numberStats].sort((a, b) => b.spinsWithoutHit - a.spinsWithoutHit || a.num - b.num).slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top 5 Quentes */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-extrabold text-slate-100">TOP 5 QUENTES</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            Mais Frequentes
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {sortedHot.map((item) => (
            <div
              key={`hot-${item.num}`}
              className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center justify-center text-center shadow"
            >
              <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white mb-1 shadow-md ${
                item.color === 'red' ? 'bg-rose-600' : item.color === 'black' ? 'bg-slate-900 ring-1 ring-slate-700' : 'bg-emerald-600'
              }`}>
                {item.num}
              </span>
              <span className="text-xs font-black text-amber-400">{item.count}x</span>
              <span className="text-[10px] text-slate-500 font-medium">{item.frequencyPct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top 5 Frias / Atrasadas */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Snowflake className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-extrabold text-slate-100">TOP 5 FRIAS (ATRASADAS)</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            Sem Sair
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {sortedCold.map((item) => (
            <div
              key={`cold-${item.num}`}
              className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center justify-center text-center shadow"
            >
              <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white mb-1 shadow-md ${
                item.color === 'red' ? 'bg-rose-600' : item.color === 'black' ? 'bg-slate-900 ring-1 ring-slate-700' : 'bg-emerald-600'
              }`}>
                {item.num}
              </span>
              <span className="text-xs font-black text-cyan-400">{item.spinsWithoutHit}</span>
              <span className="text-[10px] text-slate-500 font-medium">giros sem sair</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
