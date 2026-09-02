import React, { useState } from 'react';
import {
  Sparkles,
  Flame,
  Target,
  TrendingUp,
  Layers,
  Dices,
  BarChart3,
  ShieldCheck,
  Zap,
  BookOpen,
  ChevronDown,
  Filter,
  CheckCircle2,
  Sliders,
  DollarSign
} from 'lucide-react';
import { SpinRecord, BankrollConfig, StrategyConfig } from '../types';
import { BastiaoScalesPanel } from './BastiaoScalesPanel';
import { HorseCyclesPanel } from './HorseCyclesPanel';
import { CamouflagedNumbersPanel } from './CamouflagedNumbersPanel';
import { ColumnSurfingPanel } from './ColumnSurfingPanel';
import { StrategyBacktestPanel } from './StrategyBacktestPanel';
import { ActiveStrategyPanel } from './ActiveStrategyPanel';

export type SubStrategyId =
  | 'bastiao_scales'
  | 'horse_cycles'
  | 'camouflaged'
  | 'column_surfing'
  | 'backtest_lab'
  | 'active_bot';

interface StrategiesHubPanelProps {
  spins: SpinRecord[];
  config: BankrollConfig;
  strategy: StrategyConfig;
  onUpdateStrategy: (updated: Partial<StrategyConfig>) => void;
  initialSubStrategy?: SubStrategyId;
}

export const STRATEGY_OPTIONS = [
  {
    id: 'backtest_lab',
    label: 'Laboratório de Backtests (10+ Estratégias)',
    shortLabel: 'Laboratório Backtests',
    tag: '🔬 Simulador',
    category: 'classicas',
    icon: BarChart3,
    color: 'from-purple-500 to-purple-600',
    description: 'Simulador avançado com Romanosky, D\'Alembert, Martingale, James Bond, Terminais Quentes e Voisins.'
  },
  {
    id: 'bastiao_scales',
    label: 'Escalas & Subtração (Bastião)',
    shortLabel: 'Escalas & Subtração',
    tag: '⚡ Nova Estratégia',
    category: 'bastião',
    icon: Flame,
    color: 'from-amber-500 to-amber-600',
    description: 'Leitura de sequências crescentes/decrescentes, alternância de ímpares e subtração de dígitos (|D₂ - D₁|).'
  },
  {
    id: 'horse_cycles',
    label: 'Cavalos & Ímpares (Bastião)',
    shortLabel: 'Cavalos & Ímpares',
    tag: '🐎 Oficial',
    category: 'bastião',
    icon: Sparkles,
    color: 'from-indigo-500 to-indigo-600',
    description: 'Ciclos de cavalos de terminação (1-4, 2-5, 3-6) e inversão de fluxo de ímpares.'
  },
  {
    id: 'camouflaged',
    label: 'Números Camuflados (Soma de Dígitos)',
    shortLabel: 'Números Camuflados',
    tag: '🎭 Bastião',
    category: 'bastião',
    icon: Target,
    color: 'from-emerald-500 to-emerald-600',
    description: 'Identificação de terminais ocultos gerados pela soma de dígitos (ex: 28 = 2+8 = 10 ➔ 1 e 0).'
  },
  {
    id: 'column_surfing',
    label: 'Surfe de Colunas & Repetições',
    shortLabel: 'Surfe de Colunas',
    tag: '🌊 Bastião',
    category: 'bastião',
    icon: Zap,
    color: 'from-cyan-500 to-cyan-600',
    description: 'Monitoramento de fluxo dominante de colunas e momentos ideais de surfe de repetição.'
  },
  {
    id: 'active_bot',
    label: 'Radar do Bot & Dicas em Tempo Real',
    shortLabel: 'Radar & Dicas Bot',
    tag: '🤖 Assistente',
    category: 'assistente',
    icon: ShieldCheck,
    color: 'from-rose-500 to-rose-600',
    description: 'Painel de sugestões dinâmicas calculadas automaticamente para a próxima rodada da mesa.'
  }
];

export const StrategiesHubPanel: React.FC<StrategiesHubPanelProps> = ({
  spins,
  config,
  strategy,
  onUpdateStrategy,
  initialSubStrategy = 'bastiao_scales'
}) => {
  const [activeSubStrategy, setActiveSubStrategy] = useState<SubStrategyId>(initialSubStrategy);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const currentOption = STRATEGY_OPTIONS.find((opt) => opt.id === activeSubStrategy) || STRATEGY_OPTIONS[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Barra de Seleção e Navegação do Hub */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] uppercase rounded">
                Central de Estratégias
              </span>
              <span className="text-xs text-slate-400">
                Selecione o método desejado:
              </span>
            </div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              {React.createElement(currentOption.icon, { className: 'w-5 h-5 text-amber-400' })}
              <span>{currentOption.label}</span>
            </h2>
          </div>

          {/* Menu Dropdown Seletor Compacto */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-2xl text-xs font-black uppercase tracking-wider text-white flex items-center justify-between gap-3 transition-all shadow-md"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Trocar Estratégia</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase px-3 py-1.5 border-b border-slate-800/80">
                  Estratégias Disponíveis
                </div>
                {STRATEGY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setActiveSubStrategy(opt.id as SubStrategyId);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left text-xs transition-all flex items-start gap-2.5 ${
                      activeSubStrategy === opt.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    {React.createElement(opt.icon, { className: 'w-4 h-4 mt-0.5 text-amber-400 shrink-0' })}
                    <div className="space-y-0.5">
                      <div className="font-bold leading-tight">{opt.label}</div>
                      <div className="text-[10px] text-slate-400">{opt.tag}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Abas Horizontais Rápidas com Quebra Fluida (SEM Barra de Rolagem) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          {STRATEGY_OPTIONS.map((opt) => {
            const isSelected = activeSubStrategy === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setActiveSubStrategy(opt.id as SubStrategyId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-extrabold ring-1 ring-amber-300'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {React.createElement(opt.icon, { className: `w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-amber-400'}` })}
                <span>{opt.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo Dinâmico da Estratégia Selecionada */}
      <div className="transition-all duration-200">
        {activeSubStrategy === 'bastiao_scales' && (
          <BastiaoScalesPanel
            spins={spins}
            config={config}
          />
        )}

        {activeSubStrategy === 'horse_cycles' && (
          <HorseCyclesPanel
            spins={spins}
            config={config}
          />
        )}

        {activeSubStrategy === 'camouflaged' && (
          <CamouflagedNumbersPanel
            spins={spins}
            config={config}
            strategy={strategy}
            onUpdateStrategy={onUpdateStrategy}
          />
        )}

        {activeSubStrategy === 'column_surfing' && (
          <ColumnSurfingPanel
            spins={spins}
            config={config}
          />
        )}

        {activeSubStrategy === 'backtest_lab' && (
          <StrategyBacktestPanel
            spins={spins}
            config={config}
          />
        )}

        {activeSubStrategy === 'active_bot' && (
          <ActiveStrategyPanel
            strategy={strategy}
            onUpdateStrategy={onUpdateStrategy}
            spins={spins}
            config={config}
          />
        )}
      </div>
    </div>
  );
};
