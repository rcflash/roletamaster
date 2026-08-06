import React from 'react';
import { Compass, Flame, AlertCircle, Sparkles, Crosshair } from 'lucide-react';
import { SpinRecord, StrategyConfig } from '../types';
import { getWheelNeighbors, calculateNeighborsAlert, getNumberColor } from '../lib/roulette';

interface WheelNeighborsAlertCardProps {
  spins: SpinRecord[];
  strategy?: StrategyConfig;
  onUpdateStrategy?: (updated: Partial<StrategyConfig>) => void;
}

export const WheelNeighborsAlertCard: React.FC<WheelNeighborsAlertCardProps> = ({
  spins,
  strategy,
  onUpdateStrategy,
}) => {
  const neighborRadius = strategy?.neighborRadius || 2;
  const alertData = calculateNeighborsAlert(spins, neighborRadius);

  const lastSpin = spins.length > 0 ? spins[spins.length - 1] : null;
  const targetNum = lastSpin ? lastSpin.numero : 0;
  const currentNeighbors = getWheelNeighbors(targetNum, neighborRadius);

  const chipValue = strategy?.neighborChipValue || 2.5;
  const totalBet = currentNeighbors.length * chipValue;

  const handleSelectRadius = (count: 2 | 3 | 4 | 5 | 6 | 7) => {
    if (onUpdateStrategy) {
      onUpdateStrategy({ neighborRadius: count });
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-2 border-b border-indigo-500/20 pb-1.5 flex-wrap gap-1.5">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
              ALERTA DE VIZINHOS DO CILINDRO
            </h3>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 px-1">Vizinhos:</span>
            {([2, 3, 4, 5, 6, 7] as const).map((count) => (
              <button
                key={count}
                onClick={() => handleSelectRadius(count)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-black transition-all ${
                  neighborRadius === count
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {count} VIZ
              </button>
            ))}
          </div>
        </div>

        {/* Target & Neighbor Wheel Map */}
        <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/80 mb-3">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              Último Número: <span className="text-amber-400 font-extrabold text-sm">#{targetNum}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              {currentNeighbors.length} números ({neighborRadius} p/ cada lado)
            </span>
          </div>

          {/* Visual Sequence of Neighbors */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap py-0.5">
            {currentNeighbors.map((num, index) => {
              const isCenter = num === targetNum;
              const colorType = getNumberColor(num);
              
              let colorStyle = 'bg-slate-950 border-slate-700/80 text-white';
              if (colorType === 'red') {
                colorStyle = 'bg-rose-600/90 border-rose-500/90 text-white shadow-xs';
              } else if (colorType === 'green') {
                colorStyle = 'bg-emerald-600 border-emerald-400 text-white shadow-xs';
              } else {
                colorStyle = 'bg-slate-950 border-slate-700/80 text-white shadow-xs';
              }

              return (
                <div
                  key={`neighbor-${num}-${index}`}
                  className={`flex flex-col items-center justify-center rounded-lg px-2.5 py-1 transition-all border ${colorStyle} ${
                    isCenter
                      ? 'ring-2 ring-amber-400 border-amber-400 font-black shadow-md scale-105 z-10'
                      : 'font-bold'
                  }`}
                >
                  <span className={`text-xs ${isCenter ? 'text-amber-300 font-black' : 'text-slate-100 font-extrabold'}`}>
                    {num}
                  </span>
                  <span className={`text-[8px] font-medium ${isCenter ? 'text-amber-300 font-bold' : 'text-slate-300'}`}>
                    {isCenter ? 'CENTRO' : 'VIZINHO'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alert Banner or Footer */}
      {alertData?.hasAlert ? (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/30 p-2.5 rounded-xl border border-amber-500/40 flex items-start gap-2 shadow-md mt-2">
          <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1 text-xs">
            <span className="font-extrabold text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> ALERTA DE REPETIÇÃO DETECTADO!
            </span>
            <p className="text-slate-200 leading-tight font-medium text-[11px]">
              {alertData.alertMessage}
            </p>
            <div className="text-[10px] font-bold text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 mt-1 inline-block">
              💰 Aposta Sugerida: R$ {chipValue.toFixed(2)} por casa em [{currentNeighbors.join(', ')}] (Total R$ {totalBet.toFixed(2)})
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 font-medium text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            Monitore a frequência no setor do #{targetNum}. Se repetir, alerta surgirá!
          </span>
          <span className="text-[10px] font-black text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0">
            Custo {currentNeighbors.length} vizinhos: R$ {totalBet.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
};
