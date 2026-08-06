import React from 'react';
import { Bot, Cpu, Download, Target, ChevronDown, Sparkles, Zap, ToggleLeft, ToggleRight, ShieldAlert } from 'lucide-react';
import { StrategyConfig, BankrollConfig, SpinRecord } from '../types';
import { generateBotSuggestion, evaluateAllStrategies, getStrategyIdFromName } from '../lib/roulette';
import { generateStrategyPDF } from '../utils/pdfStrategyGenerator';

interface ActiveStrategyPanelProps {
  strategy: StrategyConfig;
  onUpdateStrategy: (updated: Partial<StrategyConfig>) => void;
  config: BankrollConfig;
  spins: SpinRecord[];
  onOpenStrategyPdf?: () => void;
  disabledStrategies?: string[];
  onToggleStrategy?: (id: string) => void;
}

const STRATEGY_OPTIONS = [
  '🤖 [AUTO] Seleção Automática (Maior Retorno Financeiro)',
  'Estratégia Simples na Roleta Online',
  'Estratégia Dirty Done Cheap (Progressão em Dúzias)',
  'Estratégia Hopscotch Pro Max (Transição 1:1)',
  'Estratégia Split on the Corners (Cantos & Splits)',
  'Estratégia Martingale De Profissional Na Roleta',
  'Estratégia Guga TV (Linha do Tempo & Terminais)',
  'Análise de Terminais & Sequência (Estratégia do Gráfico)',
  'Alerta de Vizinhos do Cilindro',
  'Estratégia Romanosky (Cobertura 86.4%)',
  'Ciclo de Fechamento (Aposta em Ausentes)',
  'Aposta em 2 Dúzias Dominantes',
  'Método D\'Alembert (Chances Simples)',
  'Estratégia James Bond (007)',
  'Vizinhos do Zero (Voisins du Zéro)',
];

export const ActiveStrategyPanel: React.FC<ActiveStrategyPanelProps> = ({
  strategy,
  onUpdateStrategy,
  config,
  spins,
  onOpenStrategyPdf,
  disabledStrategies = [],
  onToggleStrategy,
}) => {
  const currentStrategy = strategy.activeStrategy || '🤖 [AUTO] Seleção Automática (Maior Retorno Financeiro)';
  const neighborRadius = strategy.neighborRadius || 2;
  const isAutoMode = currentStrategy.toLowerCase().includes('auto') || currentStrategy.toLowerCase().includes('automatica') || currentStrategy.toLowerCase().includes('automática');

  const botInfo = generateBotSuggestion(spins, {
    ...strategy,
  });
  
  const topRanked = isAutoMode ? evaluateAllStrategies(spins, neighborRadius, disabledStrategies)[0] : null;

  const currentStrategyId = getStrategyIdFromName(currentStrategy);
  const isCurrentDisabled = currentStrategyId ? disabledStrategies.includes(currentStrategyId) : false;

  const handleStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateStrategy({ activeStrategy: e.target.value });
  };

  const handleSelectRadius = (radius: 2 | 3 | 4 | 5 | 6 | 7) => {
    onUpdateStrategy({ neighborRadius: radius });
  };

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 rounded-2xl p-4 border border-indigo-500/20 shadow-xl flex flex-col justify-between h-full space-y-3">
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-indigo-500/20 pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-extrabold text-indigo-100 uppercase tracking-wide">
              BOT INTELIGENTE DE RECOMENDAÇÃO
            </h3>
          </div>
          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40">
            Nível: {botInfo.level}
          </span>
        </div>

        {/* Strategy Selector Control */}
        <div className="mb-3 space-y-1.5">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>Estratégia no Robô:</span>
            </label>
            {(currentStrategy.includes('Vizinhos do Cilindro') || isAutoMode) && (
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <span className="text-[9px] font-bold text-slate-400 px-1">Vizinhos:</span>
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
                    {count}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <select
                value={currentStrategy}
                onChange={handleStrategyChange}
                className={`w-full bg-slate-950 border text-xs rounded-xl px-3 py-2 appearance-none cursor-pointer focus:outline-none focus:ring-2 transition-all pr-8 font-extrabold ${
                  isAutoMode
                    ? 'border-emerald-500/50 text-emerald-300 bg-emerald-950/20 focus:ring-emerald-500/40'
                    : isCurrentDisabled
                    ? 'border-rose-500/50 text-rose-300 bg-rose-950/20 focus:ring-rose-500/40'
                    : 'border-indigo-500/30 text-amber-300 focus:ring-amber-500/40'
                }`}
              >
                {STRATEGY_OPTIONS.map((opt) => {
                  const sId = getStrategyIdFromName(opt);
                  const isOptDisabled = sId ? disabledStrategies.includes(sId) : false;
                  return (
                    <option key={opt} value={opt} className={`bg-slate-900 ${isOptDisabled ? 'text-rose-400 italic' : 'text-slate-200 font-semibold'}`}>
                      {opt} {isOptDisabled ? '⛔ (Desativada)' : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-amber-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {!isAutoMode && currentStrategyId && (
              <button
                type="button"
                onClick={() => onToggleStrategy && onToggleStrategy(currentStrategyId)}
                className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                  isCurrentDisabled
                    ? 'bg-rose-950/90 text-rose-300 border-rose-500/60 hover:bg-rose-900'
                    : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 hover:bg-emerald-900'
                }`}
                title={isCurrentDisabled ? 'Estratégia DESATIVADA (Salvo no F5). Clique para Habilitar.' : 'Estratégia HABILITADA (Salvo no F5). Clique para Desativar.'}
              >
                {isCurrentDisabled ? (
                  <>
                    <ToggleLeft className="w-4 h-4 text-rose-400" />
                    <span>Desativada</span>
                  </>
                ) : (
                  <>
                    <ToggleRight className="w-4 h-4 text-emerald-400" />
                    <span>Habilitada</span>
                  </>
                )}
              </button>
            )}
          </div>

          {isCurrentDisabled && !isAutoMode && (
            <div className="bg-rose-950/50 border border-rose-500/30 rounded-xl p-2 text-[10px] text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Atenção:</strong> Esta estratégia está <strong>Desabilitada</strong>. Clique no botão ao lado para reativá-la.
              </span>
            </div>
          )}

          {isAutoMode && topRanked && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2 text-[10px] text-emerald-300 flex items-center justify-between gap-1.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
                <span>
                  <strong>Seleção Automática Ativa:</strong> Recomendando a estratégia de maior lucro líquido no momento (excluindo desabilitadas): <strong className="text-amber-300">{topRanked.name}</strong> ({topRanked.netProfit >= 0 ? '+' : ''}R$ {topRanked.netProfit.toFixed(2)} | {topRanked.winRatePct.toFixed(1)}% acerto).
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Recommendation Output Box */}
        <div className="mb-3">
          <span className="text-[11px] text-slate-400 font-semibold block mb-1">
            Próxima Aposta Recomendada (Atualizada pelo Robô):
          </span>
          <div className="bg-slate-950/90 border border-indigo-500/30 rounded-xl p-3 text-xs sm:text-sm font-black text-amber-300 shadow-inner flex items-center justify-between gap-2">
            <span>{botInfo.suggestion}</span>
            <Bot className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          {isAutoMode
            ? 'O modo automático analisa a mesa a cada giro e alterna para a melhor estratégia habilitada com maior retorno em tempo real.'
            : 'O robô ajusta a sugestão de entrada em tempo real conforme a estratégia selecionada acima.'}
        </p>
      </div>

      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 gap-2 flex-wrap">
        <span>Estratégia Em Execução: <strong className="text-amber-400">{botInfo.strategyName}</strong></span>
        <button
          onClick={() => onOpenStrategyPdf ? onOpenStrategyPdf() : generateStrategyPDF(config)}
          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm"
          title="Baixar Manual da Estratégia em PDF"
        >
          <Download className="w-3 h-3 text-amber-400" />
          <span>Manual PDF</span>
        </button>
      </div>
    </div>
  );
};
