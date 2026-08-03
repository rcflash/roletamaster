import React, { useState } from 'react';
import { RED_NUMBERS } from '../lib/roulette';

interface OvalRacetrackBoardProps {
  onSelectNumber: (num: number) => void;
  lastNumber?: number | null;
  highlightedNumbers?: number[];
  className?: string;
}

// Sector Number Sets
export const SECTORS = {
  VOISINS: [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25],
  TIER: [27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33],
  ORPHELINS: [1, 20, 14, 31, 9, 17, 34, 6],
  ZERO: [12, 35, 3, 26, 0, 32, 15],
};

// Exact top row numbers from left to right (as in image)
const TOP_ROW = [5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35];

// Right curve numbers from top to bottom (as in image)
const RIGHT_CURVE = [3, 26, 0];

// Bottom row numbers from right to left in wheel order -> left to right on screen (as in image)
const BOTTOM_ROW = [30, 11, 36, 13, 27, 6, 34, 17, 25, 2, 21, 4, 19, 15, 32];

// Left curve numbers from bottom to top (as in image)
const LEFT_CURVE = [8, 23, 10];

export const OvalRacetrackBoard: React.FC<OvalRacetrackBoardProps> = ({
  onSelectNumber,
  lastNumber,
  highlightedNumbers = [],
  className = '',
}) => {
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  // Helper to determine cell background and border styling
  const getCellClass = (num: number) => {
    const isRed = RED_NUMBERS.includes(num);
    const isZero = num === 0;
    const isLast = lastNumber === num;
    const isHighlighted = highlightedNumbers.includes(num);

    let sectorHighlight = false;
    if (hoveredSector && SECTORS[hoveredSector as keyof typeof SECTORS]) {
      sectorHighlight = SECTORS[hoveredSector as keyof typeof SECTORS].includes(num);
    }

    if (isLast) {
      return 'bg-amber-400 text-slate-950 font-black border-2 border-amber-200 ring-2 ring-amber-400/80 scale-105 z-20 shadow-lg shadow-amber-500/50';
    }

    if (isHighlighted || sectorHighlight) {
      return 'bg-amber-500/90 text-slate-950 font-black border-2 border-amber-300 ring-1 ring-amber-400 scale-100 z-10 shadow-md';
    }

    if (isZero) {
      return 'bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold border border-emerald-400/60 shadow-inner';
    }

    if (isRed) {
      return 'bg-rose-700 hover:bg-rose-600 text-white font-extrabold border border-rose-500/40 shadow-inner';
    }

    return 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 font-extrabold border border-zinc-700/60 shadow-inner';
  };

  return (
    <div className={`w-full bg-[#120b18] border border-purple-900/40 p-3 sm:p-4 rounded-3xl shadow-2xl overflow-x-auto ${className}`}>
      <div className="min-w-[720px] max-w-[920px] mx-auto select-none">
        
        {/* Outer Oval Stadium Layout */}
        <div className="relative p-2 rounded-[50px] border-2 border-purple-800/40 bg-gradient-to-b from-[#1c1226] to-[#0c0612] shadow-2xl">
          
          {/* Top Row Cells (5 to 35) */}
          <div className="flex items-center justify-between gap-0.5 px-10">
            {TOP_ROW.map((num) => (
              <button
                key={`top-${num}`}
                type="button"
                onClick={() => onSelectNumber(num)}
                className={`flex-1 h-10 sm:h-11 min-w-[32px] rounded-t-md flex flex-col items-center justify-center transition-all duration-150 active:scale-95 text-xs sm:text-sm ${getCellClass(num)}`}
                title={`Número ${num} (${RED_NUMBERS.includes(num) ? 'Vermelho' : 'Preto'})`}
              >
                <span>{num}</span>
                {lastNumber === num && (
                  <span className="text-[6px] leading-none bg-slate-950 text-amber-300 px-0.5 rounded font-black uppercase tracking-tighter">
                    ★
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Middle Section: Left Curve + Inner Oval Sectors + Right Curve */}
          <div className="flex items-stretch my-0.5">
            
            {/* Left Curve Column (10, 23, 8) */}
            <div className="w-12 sm:w-14 flex flex-col justify-between gap-0.5 shrink-0 pr-0.5">
              {LEFT_CURVE.map((num) => (
                <button
                  key={`left-${num}`}
                  type="button"
                  onClick={() => onSelectNumber(num)}
                  className={`h-9 sm:h-10 w-full rounded-l-2xl flex flex-col items-center justify-center transition-all duration-150 active:scale-95 text-xs sm:text-sm ${getCellClass(num)}`}
                  title={`Número ${num}`}
                >
                  <span>{num}</span>
                  {lastNumber === num && (
                    <span className="text-[6px] leading-none bg-slate-950 text-amber-300 px-0.5 rounded font-black uppercase">
                      ★
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Center Field: TIER, ORPHELINS, VOISINS, ZERO */}
            <div className="flex-1 grid grid-cols-12 gap-1 px-1 py-2 bg-purple-950/20 border border-purple-800/30 rounded-2xl my-0.5 items-center justify-center text-center">
              
              {/* TIER Sector */}
              <button
                type="button"
                onMouseEnter={() => setHoveredSector('TIER')}
                onMouseLeave={() => setHoveredSector(null)}
                className={`col-span-3 h-full min-h-[50px] rounded-xl border flex flex-col items-center justify-center p-1 transition-all ${
                  hoveredSector === 'TIER'
                    ? 'bg-purple-800/50 border-purple-400 text-purple-200 scale-105 shadow-lg'
                    : 'bg-purple-950/40 border-purple-800/40 text-purple-300 hover:bg-purple-900/40'
                }`}
              >
                <span className="font-black text-xs sm:text-sm tracking-wider uppercase">TIER</span>
                <span className="text-[9px] opacity-70 font-semibold">(12 casas)</span>
              </button>

              {/* ORPHELINS Sector */}
              <button
                type="button"
                onMouseEnter={() => setHoveredSector('ORPHELINS')}
                onMouseLeave={() => setHoveredSector(null)}
                className={`col-span-3 h-full min-h-[50px] rounded-xl border flex flex-col items-center justify-center p-1 transition-all ${
                  hoveredSector === 'ORPHELINS'
                    ? 'bg-purple-800/50 border-purple-400 text-purple-200 scale-105 shadow-lg'
                    : 'bg-purple-950/40 border-purple-800/40 text-purple-300 hover:bg-purple-900/40'
                }`}
              >
                <span className="font-black text-xs sm:text-sm tracking-wider uppercase">ORPHELINS</span>
                <span className="text-[9px] opacity-70 font-semibold">(8 casas)</span>
              </button>

              {/* VOISINS Sector */}
              <button
                type="button"
                onMouseEnter={() => setHoveredSector('VOISINS')}
                onMouseLeave={() => setHoveredSector(null)}
                className={`col-span-3 h-full min-h-[50px] rounded-xl border flex flex-col items-center justify-center p-1 transition-all ${
                  hoveredSector === 'VOISINS'
                    ? 'bg-purple-800/50 border-purple-400 text-purple-200 scale-105 shadow-lg'
                    : 'bg-purple-950/40 border-purple-800/40 text-purple-300 hover:bg-purple-900/40'
                }`}
              >
                <span className="font-black text-xs sm:text-sm tracking-wider uppercase">VOISINS</span>
                <span className="text-[9px] opacity-70 font-semibold">(17 casas)</span>
              </button>

              {/* ZERO Sector (Inner Oval) */}
              <button
                type="button"
                onMouseEnter={() => setHoveredSector('ZERO')}
                onMouseLeave={() => setHoveredSector(null)}
                className={`col-span-3 h-full min-h-[50px] rounded-full border-2 flex flex-col items-center justify-center p-1 transition-all ${
                  hoveredSector === 'ZERO'
                    ? 'bg-emerald-900/60 border-emerald-400 text-emerald-200 scale-105 shadow-lg'
                    : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-300 hover:bg-emerald-900/40'
                }`}
              >
                <span className="font-black text-xs sm:text-sm tracking-wider uppercase">ZERO</span>
                <span className="text-[9px] opacity-70 font-semibold">(7 casas)</span>
              </button>

            </div>

            {/* Right Curve Column (3, 26, 0) */}
            <div className="w-12 sm:w-14 flex flex-col justify-between gap-0.5 shrink-0 pl-0.5">
              {RIGHT_CURVE.map((num) => (
                <button
                  key={`right-${num}`}
                  type="button"
                  onClick={() => onSelectNumber(num)}
                  className={`h-9 sm:h-10 w-full rounded-r-2xl flex flex-col items-center justify-center transition-all duration-150 active:scale-95 text-xs sm:text-sm ${getCellClass(num)}`}
                  title={`Número ${num}`}
                >
                  <span>{num}</span>
                  {lastNumber === num && (
                    <span className="text-[6px] leading-none bg-slate-950 text-amber-300 px-0.5 rounded font-black uppercase">
                      ★
                    </span>
                  )}
                </button>
              ))}
            </div>

          </div>

          {/* Bottom Row Cells (30 to 32) */}
          <div className="flex items-center justify-between gap-0.5 px-10">
            {BOTTOM_ROW.map((num) => (
              <button
                key={`bottom-${num}`}
                type="button"
                onClick={() => onSelectNumber(num)}
                className={`flex-1 h-10 sm:h-11 min-w-[32px] rounded-b-md flex flex-col items-center justify-center transition-all duration-150 active:scale-95 text-xs sm:text-sm ${getCellClass(num)}`}
                title={`Número ${num}`}
              >
                <span>{num}</span>
                {lastNumber === num && (
                  <span className="text-[6px] leading-none bg-slate-950 text-amber-300 px-0.5 rounded font-black uppercase tracking-tighter">
                    ★
                  </span>
                )}
              </button>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
