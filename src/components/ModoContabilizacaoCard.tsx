import React from 'react';
import { Sliders, Bot } from 'lucide-react';
import { StrategyConfig, BankrollConfig, SpinRecord } from '../types';
import { generateBotSuggestion } from '../lib/roulette';

interface ModoContabilizacaoCardProps {
  strategy: StrategyConfig;
  onUpdateStrategy: (updated: Partial<StrategyConfig>) => void;
  config: BankrollConfig;
  spins: SpinRecord[];
}

export const ModoContabilizacaoCard: React.FC<ModoContabilizacaoCardProps> = ({
  strategy,
  onUpdateStrategy,
  config,
  spins,
}) => {
  const botInfo = generateBotSuggestion(spins);

  const straightNumbersList = Object.entries(strategy.straightNumberBets || {})
    .filter(([, v]) => (v as number) > 0)
    .map(([k]) => k)
    .join(', ');

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
            ▶ MODO DE CONTABILIZAÇÃO DO SALDO
          </h3>
        </div>
        <span
          className={`text-[10px] font-black px-2.5 py-0.5 rounded border ${
            strategy.useBotRecommendation !== false
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}
        >
          {strategy.useBotRecommendation !== false ? '🤖 BOT AUTOMÁTICO' : '🎯 MANUAL / PRESET'}
        </span>
      </div>

      {strategy.useBotRecommendation !== false ? (
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/30 p-3 rounded-xl border border-emerald-500/30 space-y-1.5 text-xs mb-3">
          <span className="font-black text-emerald-400 flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-emerald-400" />
            Calculando Saldo pelas Tips do Bot Inteligente
          </span>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            A cada novo giro, o sistema avalia o ganho/perda de acordo com a recomendação em tempo real enviada pelo Bot Inteligente.
          </p>
          <div className="text-[10px] font-bold text-amber-300 bg-slate-950/80 p-2 rounded-lg border border-slate-800">
            Próxima Entrada: {botInfo.suggestion}
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-xs mb-3">
          <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-300 font-semibold">1ª Dúzia:</span>
            <span className="font-bold text-amber-400">{config.currency} {strategy.dozen1Bet}</span>
          </div>

          <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-300 font-semibold">2ª Dúzia:</span>
            <span className="font-bold text-amber-400">{config.currency} {strategy.dozen2Bet}</span>
          </div>

          <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-300 font-semibold">Números Individuais (Top 5 + Zero):</span>
            <span className="font-bold text-emerald-400 truncate max-w-[180px]">
              {straightNumbersList ? `[${straightNumbersList}]` : 'Nenhum'}
            </span>
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] font-semibold text-slate-400">Modo de Aposta:</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              onUpdateStrategy({
                useBotRecommendation: true,
              })
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              strategy.useBotRecommendation !== false
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Tips do Bot</span>
          </button>
          <button
            onClick={() =>
              onUpdateStrategy({
                useBotRecommendation: false,
                activePreset: 'top5_hot',
                dozen1Bet: 5,
                dozen2Bet: 5,
                dozen3Bet: 0,
                straightNumberBets: { 0: 1, 15: 1, 30: 1, 19: 1, 31: 1 },
              })
            }
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
              strategy.useBotRecommendation === false
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Estratégia Fixa
          </button>
        </div>
      </div>
    </div>
  );
};
