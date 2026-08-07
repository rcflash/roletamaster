import React from 'react';
import { Sliders, Compass, Sparkles } from 'lucide-react';
import { StrategyConfig, BankrollConfig, SpinRecord } from '../types';
import { generateBotSuggestion, getWheelNeighbors } from '../lib/roulette';

interface ModoContabilizacaoCardProps {
  strategy: StrategyConfig;
  onUpdateStrategy: (updated: Partial<StrategyConfig>) => void;
  config: BankrollConfig;
  spins: SpinRecord[];
}

export const ModoContabilizacaoCard: React.FC<ModoContabilizacaoCardProps> = ({
  strategy,
  onUpdateStrategy,
  spins,
}) => {
  const botInfo = generateBotSuggestion(spins, strategy.neighborRadius || 2);
  const radius = strategy.neighborRadius || 2;
  const chipValue = strategy.neighborChipValue || 2.5;

  const lastSpin = spins.length > 0 ? spins[spins.length - 1] : null;
  const targetNum = lastSpin ? lastSpin.numero : 0;
  const neighbors = getWheelNeighbors(targetNum, radius);
  const totalBet = neighbors.length * chipValue;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
            ▶ MODO DE CONTABILIZAÇÃO DO SALDO
          </h3>
        </div>
        <span className="text-[10px] font-black px-2.5 py-0.5 rounded border bg-amber-500/20 text-amber-300 border-amber-500/40 flex items-center gap-1">
          <Compass className="w-3 h-3 text-amber-400" />
          ALERTA DE VIZINHOS
        </span>
      </div>

      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/30 p-3 rounded-xl border border-amber-500/30 space-y-2 text-xs mb-3">
        <span className="font-black text-amber-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Estratégia Única: Alerta de Vizinhos do Cilindro
        </span>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          O saldo e os lucros/perdas são contabilizados <strong>exclusivamente</strong> com a estratégia de Vizinhos do Cilindro. A cada novo giro, o sistema avalia o acerto ou erro da aposta nos números ao redor do último número sorteado ({neighbors.length} casas).
        </p>
        <div className="text-[10px] font-bold text-emerald-300 bg-slate-950/90 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
          <span>Próxima Aposta: {botInfo.suggestion}</span>
          <span className="text-amber-400 font-extrabold text-xs">Aposta: R$ {totalBet.toFixed(2)}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] font-semibold text-slate-400">Cobertura no Cilindro:</span>
        <div className="flex items-center gap-1 flex-wrap">
          {([2, 3, 4, 5, 6, 7] as const).map((cnt) => (
            <button
              key={cnt}
              onClick={() => onUpdateStrategy({ neighborRadius: cnt })}
              className={`px-2.5 py-1 rounded text-xs font-black transition-all ${
                radius === cnt
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cnt} VIZ ({cnt * 2 + 1} casas)
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
