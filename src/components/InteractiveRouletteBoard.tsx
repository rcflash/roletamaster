import React from 'react';
import { RED_NUMBERS } from '../lib/roulette';
import { NumberStats } from '../types';

interface InteractiveRouletteBoardProps {
  numberStats: NumberStats[];
  lastNumber: number | null;
  onSelectNumber?: (num: number) => void;
}

export const InteractiveRouletteBoard: React.FC<InteractiveRouletteBoardProps> = ({
  numberStats,
  lastNumber,
  onSelectNumber,
}) => {
  const statsMap: { [num: number]: NumberStats } = {};
  numberStats.forEach((s) => {
    statsMap[s.num] = s;
  });

  const maxHits = Math.max(1, ...numberStats.map((s) => s.count));

  // Rows for column layout:
  // Row 1 (Col 3): 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36
  // Row 2 (Col 2): 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35
  // Row 3 (Col 1): 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34
  const row3 = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36];
  const row2 = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35];
  const row1 = [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34];

  const renderNumberCell = (num: number) => {
    const isRed = RED_NUMBERS.includes(num);
    const count = statsMap[num]?.count || 0;
    const isLast = lastNumber === num;
    const heatOpacity = count > 0 ? 0.2 + (count / maxHits) * 0.8 : 0;

    return (
      <button
        key={`board-num-${num}`}
        onClick={() => onSelectNumber && onSelectNumber(num)}
        className={`relative h-11 flex flex-col items-center justify-center rounded-lg border font-black text-sm transition-all active:scale-95 ${
          isLast
            ? 'ring-2 ring-amber-400 border-amber-300 bg-amber-500/20 shadow-lg shadow-amber-500/20 z-10'
            : isRed
            ? 'bg-rose-950/80 border-rose-800/80 text-rose-100 hover:bg-rose-800/80'
            : 'bg-slate-950 border-slate-800 text-slate-100 hover:bg-slate-800'
        }`}
      >
        {/* Heatmap overlay */}
        {count > 0 && (
          <div
            className="absolute inset-0 rounded-lg pointer-events-none bg-amber-400 transition-opacity"
            style={{ opacity: heatOpacity * 0.25 }}
          />
        )}

        <span className="relative z-10 font-black">{num}</span>

        {count > 0 && (
          <span className="relative z-10 text-[9px] font-extrabold text-amber-400 bg-slate-900/90 px-1 rounded-full border border-slate-700 -mt-0.5">
            {count}x
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl overflow-x-auto">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
          MESA INTERATIVA DA ROLETA (MAPA DE CALOR)
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">
          Destaque em dourado = último número sorteado
        </span>
      </div>

      <div className="min-w-[700px] flex gap-2">
        {/* Zero Column */}
        <button
          onClick={() => onSelectNumber && onSelectNumber(0)}
          className={`w-14 rounded-xl border flex flex-col items-center justify-center font-black text-lg text-white transition-all active:scale-95 ${
            lastNumber === 0
              ? 'ring-2 ring-amber-400 border-amber-300 bg-emerald-600 shadow-lg shadow-amber-500/20'
              : 'bg-emerald-700 border-emerald-500 hover:bg-emerald-600'
          }`}
        >
          <span>0</span>
          {statsMap[0]?.count > 0 && (
            <span className="text-xs text-amber-300 bg-slate-900/80 px-1.5 py-0.5 rounded-full mt-1 border border-emerald-400">
              {statsMap[0].count}x
            </span>
          )}
        </button>

        {/* Numbers & Outside Bets */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Row 3 (Col 3) */}
          <div className="grid grid-cols-12 gap-1.5">
            {row3.map(renderNumberCell)}
          </div>

          {/* Row 2 (Col 2) */}
          <div className="grid grid-cols-12 gap-1.5">
            {row2.map(renderNumberCell)}
          </div>

          {/* Row 1 (Col 1) */}
          <div className="grid grid-cols-12 gap-1.5">
            {row1.map(renderNumberCell)}
          </div>

          {/* Dozen Rows */}
          <div className="grid grid-cols-3 gap-1.5 mt-1">
            <div className="h-8 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-300 uppercase tracking-wider">
              1ª Dúzia (1-12)
            </div>
            <div className="h-8 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-300 uppercase tracking-wider">
              2ª Dúzia (13-24)
            </div>
            <div className="h-8 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-300 uppercase tracking-wider">
              3ª Dúzia (25-36)
            </div>
          </div>

          {/* Even-Money Outside Bets */}
          <div className="grid grid-cols-6 gap-1.5">
            <div className="h-8 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
              1-18
            </div>
            <div className="h-8 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
              Par
            </div>
            <div className="h-8 bg-rose-950/80 border border-rose-800 rounded-lg flex items-center justify-center text-xs font-bold text-rose-300">
              Vermelho
            </div>
            <div className="h-8 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-300">
              Preto
            </div>
            <div className="h-8 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
              Ímpar
            </div>
            <div className="h-8 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
              19-36
            </div>
          </div>
        </div>

        {/* 2 to 1 Column Labels */}
        <div className="flex flex-col gap-1.5 w-12">
          <div className="h-11 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center text-xs font-extrabold text-amber-400">
            2:1
          </div>
          <div className="h-11 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center text-xs font-extrabold text-amber-400">
            2:1
          </div>
          <div className="h-11 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center text-xs font-extrabold text-amber-400">
            2:1
          </div>
        </div>
      </div>
    </div>
  );
};
