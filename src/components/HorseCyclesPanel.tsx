import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Target,
  Zap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart3,
  Dices,
  RefreshCw,
  Award,
  Layers,
  ArrowUpRight,
  Flame,
  ChevronRight,
  Eye,
  Crosshair,
  Hash,
  AlertTriangle,
  Play,
  Clock,
  BookOpen,
  DollarSign,
  Compass,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { SpinRecord, BankrollConfig, StrategyConfig } from '../types';
import { getNumberColor, EUROPEAN_WHEEL_ORDER, getWheelNeighbors } from '../lib/roulette';
import {
  HORSE_FAMILIES,
  ODD_PROGRESSION_SUMS,
  HorseFamilyType,
  BASTIAO_HORSE_LESSON_MOMENTS,
  VideoLessonMoment,
  calculateHorseCyclesAlert,
  calculateHorseStats,
  runHorseCyclesBacktest,
  expandWithWheelNeighbors,
  getTerminal,
  getSumOfDigits,
  getHorseFamily
} from '../lib/horseCyclesStrategy';

interface HorseCyclesPanelProps {
  spins: SpinRecord[];
  config: BankrollConfig;
  strategy?: StrategyConfig;
  onUpdateStrategy?: (updated: Partial<StrategyConfig>) => void;
  onLoadVideoSpins?: (sampleNumbers: number[]) => void;
}

export const HorseCyclesPanel: React.FC<HorseCyclesPanelProps> = ({
  spins,
  config,
  strategy,
  onUpdateStrategy,
  onLoadVideoSpins,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'radar' | 'yield_calc' | 'odd_progression' | 'video_sync' | 'cylinder_map' | 'backtest' | 'guide'
  >('radar');

  const [neighborRadius, setNeighborRadius] = useState<0 | 1 | 2>(1);
  const [chipValue, setChipValue] = useState<number>(strategy?.neighborChipValue || 2.50);
  const [selectedMoment, setSelectedMoment] = useState<VideoLessonMoment | null>(
    BASTIAO_HORSE_LESSON_MOMENTS[0]
  );
  const [filterOnlyAlerts, setFilterOnlyAlerts] = useState<boolean>(true);

  // Alerta em tempo real com base no histórico
  const alert = useMemo(() => {
    return calculateHorseCyclesAlert(spins, neighborRadius, 50);
  }, [spins, neighborRadius]);

  // Estatísticas dos últimos 50 giros
  const stats50 = useMemo(() => {
    return calculateHorseStats(spins, 50);
  }, [spins]);

  // Backtest em tempo real
  const backtest = useMemo(() => {
    return runHorseCyclesBacktest(
      spins,
      config.initialBankroll || 300,
      chipValue,
      neighborRadius,
      filterOnlyAlerts
    );
  }, [spins, config.initialBankroll, chipValue, neighborRadius, filterOnlyAlerts]);

  const lastSpin = spins.length > 0 ? spins[spins.length - 1] : null;
  const lastNum = lastSpin ? lastSpin.numero : 0;
  const lastTerm = lastSpin ? getTerminal(lastNum) : 0;
  const lastSum = lastSpin ? getSumOfDigits(lastNum) : 0;
  const lastFam = lastSpin ? getHorseFamily(lastNum) : '1-4-7';

  // Cálculos Financeiros
  const targetNumbersCount = alert.wheelCoveredNumbers.length || 11;
  const totalBetAmount = targetNumbersCount * chipValue;
  const grossWinAmount = chipValue * 36;
  const netProfitOnWin = grossWinAmount - totalBetAmount;
  const roiOnWinPct = totalBetAmount > 0 ? (netProfitOnWin / totalBetAmount) * 100 : 0;

  const handleLoadSample = (sampleNumbers: number[]) => {
    if (onLoadVideoSpins) {
      onLoadVideoSpins(sampleNumbers);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Principal do Painel de Cavalos & Crescente de Ímpares */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/20 to-purple-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 shadow-lg shrink-0">
              <Dices className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-100 uppercase tracking-tight">
                  Cavalos de Terminais & Crescente de Ímpares
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 text-[10px] font-black uppercase tracking-wider">
                  Método Bastião (Últimos 50 Giros)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Leitura de ciclos <strong>1-4-7</strong>, <strong>2-5-8</strong>, <strong>0-3-6-9</strong>, padrão intercalado, crescente <strong>1➔3➔5➔7➔9</strong> com números camuflados (somas) e cobertura com vizinhos no cilindro.
              </p>
            </div>
          </div>

          {/* Seletor de Raio de Vizinhos (Regra do Bastião: Nunca Seco!) */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Vizinhos no Cilindro:</span>
            {[
              { val: 0, label: 'Seco (0)' },
              { val: 1, label: '±1 Vizinho (Recomendado)' },
              { val: 2, label: '±2 Vizinhos (Máx. Segurança)' },
            ].map((item) => (
              <button
                key={item.val}
                onClick={() => setNeighborRadius(item.val as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                  neighborRadius === item.val
                    ? 'bg-sky-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sub-Aba de Navegação Interna */}
        <div className="flex items-center gap-1.5 border-t border-slate-800/80 pt-3 mt-4 overflow-x-auto pb-1">
          {[
            { id: 'radar', label: 'Radar & Sinal ao Vivo', icon: Sparkles, color: 'text-sky-400' },
            { id: 'yield_calc', label: 'Cálculo de Rendimento', icon: TrendingUp, color: 'text-emerald-400' },
            { id: 'odd_progression', label: 'Crescente de Ímpares & Somas', icon: Hash, color: 'text-amber-400' },
            { id: 'video_sync', label: 'Aula do Bastião (10 Momentos)', icon: Play, color: 'text-rose-400' },
            { id: 'cylinder_map', label: 'Mapeamento no Cilindro', icon: Compass, color: 'text-cyan-400' },
            { id: 'backtest', label: 'Simulação & Histórico', icon: BarChart3, color: 'text-indigo-400' },
            { id: 'guide', label: 'Guia da Estratégia', icon: BookOpen, color: 'text-purple-400' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: RADAR & SINAL AO VIVO */}
      {activeSubTab === 'radar' && (
        <div className="space-y-4">
          {/* Card de Alerta Ativo */}
          <div
            className={`rounded-2xl p-4 sm:p-5 border transition-all ${
              alert.hasAlert
                ? 'bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border-sky-500/50 shadow-2xl shadow-sky-500/10 ring-1 ring-sky-400/30'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                    alert.hasAlert
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Sparkles className={`w-5 h-5 ${alert.hasAlert ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-slate-100 uppercase tracking-tight">
                      {alert.title}
                    </h3>
                    {alert.hasAlert && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase">
                        SINAL ATIVO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{alert.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
                  Último: <strong className="text-white font-black">{lastNum}</strong> (Term. {lastTerm}, Soma {lastSum})
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/40 font-bold">
                  {alert.confidencePct}% Convicção
                </span>
              </div>
            </div>

            {/* Números Alvos da Entrada */}
            <div className="mt-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-sky-400" />
                  Números Cobertos na Entrada ({alert.wheelCoveredNumbers.length} Casas com ±{neighborRadius} Vizinhos):
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Custo da Entrada: <strong className="text-amber-300">R$ {totalBetAmount.toFixed(2)}</strong> | Lucro no Green: <strong className="text-emerald-400">+R$ {netProfitOnWin.toFixed(2)}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                {alert.wheelCoveredNumbers.map((num) => {
                  const isDirect = alert.targetDirectNumbers.includes(num);
                  const isCamou = alert.camouflagedNumbers.some((c) => c.num === num);
                  const isZero = num === 0;

                  return (
                    <div
                      key={num}
                      className={`relative flex flex-col items-center justify-center p-1 rounded-lg transition-all ${
                        isDirect
                          ? 'bg-sky-500/20 border border-sky-400 shadow-sm'
                          : isCamou
                          ? 'bg-amber-500/20 border border-amber-400 shadow-sm'
                          : 'bg-slate-900 border border-slate-800'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white ${
                          isZero
                            ? 'bg-emerald-600'
                            : isDirect
                            ? 'bg-sky-500 text-slate-950 font-black ring-1 ring-white'
                            : getNumberColor(num) === 'red'
                            ? 'bg-rose-600'
                            : 'bg-slate-950 border border-slate-700'
                        }`}
                      >
                        {num}
                      </span>
                      <span className="text-[8px] font-bold uppercase mt-0.5 text-slate-400">
                        {isDirect ? 'Direto' : isCamou ? 'Camou' : 'Viz'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Cards das 3 Famílias de Cavalos nos Últimos 50 Giros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['1-4-7', '2-5-8', '0-3-6-9'] as const).map((famKey) => {
              const famDef = HORSE_FAMILIES[famKey];
              const count =
                famKey === '1-4-7'
                  ? stats50.count147
                  : famKey === '2-5-8'
                  ? stats50.count258
                  : stats50.count0369;
              const pct =
                famKey === '1-4-7'
                  ? stats50.pct147
                  : famKey === '2-5-8'
                  ? stats50.pct258
                  : stats50.pct0369;
              const isTarget = alert.targetHorse === famKey;

              return (
                <div
                  key={famKey}
                  className={`rounded-2xl p-4 border transition-all ${
                    isTarget
                      ? 'bg-slate-900 border-sky-500 shadow-lg ring-1 ring-sky-500/40'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <span className="text-xs font-black uppercase text-slate-100 flex items-center gap-1.5">
                        {famDef.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Terminais: [{famDef.terminals.join(', ')}]
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono ${
                        pct >= 38
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {count} ({pct.toFixed(0)}%)
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
                    {famDef.description}
                  </p>

                  <div className="flex items-center gap-1 flex-wrap mt-3 pt-2.5 border-t border-slate-800/80">
                    {famDef.numbers.map((n) => (
                      <span
                        key={n}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                          n === 0
                            ? 'bg-emerald-600'
                            : getNumberColor(n) === 'red'
                            ? 'bg-rose-600'
                            : 'bg-slate-950 border border-slate-700'
                        }`}
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sequência Giro a Giro dos Últimos 20 Números com Identificação do Cavalo */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Histórico Giro a Giro com Família do Cavalo
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Esquerda = Mais recente &larr; Direita = Antigo
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {spins.slice(-18).reverse().map((spin, idx) => {
                const fam = getHorseFamily(spin.numero);
                const term = getTerminal(spin.numero);
                const sum = getSumOfDigits(spin.numero);
                const isTargetFam = alert.targetHorse === fam;

                return (
                  <div
                    key={spin.id || idx}
                    className={`flex flex-col items-center p-2 rounded-xl border min-w-[56px] shrink-0 transition-all ${
                      isTargetFam
                        ? 'bg-sky-950/40 border-sky-500/60 shadow-sm'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow-sm ${
                        spin.numero === 0
                          ? 'bg-emerald-600'
                          : getNumberColor(spin.numero) === 'red'
                          ? 'bg-rose-600'
                          : 'bg-slate-950 border border-slate-700'
                      }`}
                    >
                      {spin.numero}
                    </span>
                    <span className="text-[9px] font-black uppercase mt-1 text-sky-300">
                      {fam}
                    </span>
                    <span className="text-[8px] text-slate-500 font-mono">
                      T:{term} | S:{sum}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CÁLCULO DE RENDIMENTO FINANCEIRO & METAS */}
      {activeSubTab === 'yield_calc' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Calculadora de Rendimento do Cavalo com Vizinhos
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simulação de custo, retorno pleno (36x) e lucro líquido ao cercar cavalos e seus vizinhos físicos.
                </p>
              </div>

              {/* Botões Rápidos de Valor de Ficha */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Ficha / Pleno:</span>
                {[1.0, 2.5, 5.0, 10.0, 15.0].map((v) => (
                  <button
                    key={v}
                    onClick={() => setChipValue(v)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono transition-all ${
                      chipValue === v
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    R$ {v.toFixed(2)}
                  </button>
                ))}
              </div>
            </div>

            {/* Comparativo dos 3 Modos de Cobertura */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Modo Seco */}
              <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-xs font-black uppercase text-slate-300">1. Modo Seco</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                    11 Números
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Custo Total:</span>
                    <strong className="font-mono text-amber-300">R$ {(11 * chipValue).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Retorno Pleno (36x):</span>
                    <strong className="font-mono text-slate-100">R$ {(36 * chipValue).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800">
                    <span>Lucro Líquido:</span>
                    <strong className="font-mono">+R$ {(25 * chipValue).toFixed(2)} (+227%)</strong>
                  </div>
                </div>
                <p className="text-[10px] text-rose-400 italic">
                  * Alto risco de "quase-green" (bola parando no vizinho).
                </p>
              </div>

              {/* Modo ±1 Vizinho (Recomendado pelo Bastião) */}
              <div className="bg-slate-950/80 rounded-xl p-3.5 border border-sky-500/50 space-y-2.5 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-xs font-black uppercase text-sky-300">2. ±1 Vizinho (Recomendado)</span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-black">
                    ~20 Números
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Custo Total Médio:</span>
                    <strong className="font-mono text-amber-300">R$ {(20 * chipValue).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Retorno Pleno (36x):</span>
                    <strong className="font-mono text-slate-100">R$ {(36 * chipValue).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800">
                    <span>Lucro Líquido:</span>
                    <strong className="font-mono">+R$ {(16 * chipValue).toFixed(2)} (+80%)</strong>
                  </div>
                </div>
                <p className="text-[10px] text-sky-300 italic font-medium">
                  * Protege o green contra saltos de casas adjacentes.
                </p>
              </div>

              {/* Modo ±2 Vizinhos (Máxima Segurança) */}
              <div className="bg-slate-950/80 rounded-xl p-3.5 border border-indigo-500/40 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-xs font-black uppercase text-indigo-300">3. ±2 Vizinhos</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-black">
                    ~25 Números
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Custo Total Médio:</span>
                    <strong className="font-mono text-amber-300">R$ {(25 * chipValue).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Retorno Pleno (36x):</span>
                    <strong className="font-mono text-slate-100">R$ {(36 * chipValue).toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800">
                    <span>Lucro Líquido:</span>
                    <strong className="font-mono">+R$ {(11 * chipValue).toFixed(2)} (+44%)</strong>
                  </div>
                </div>
                <p className="text-[10px] text-indigo-300 italic">
                  * Cobertura de quase 70% da roleta para bater meta rápida.
                </p>
              </div>
            </div>

            {/* Tabela de Projeção de Metas */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-black uppercase text-slate-200 block">
                Projeção de Metas Financeiras com a Configuração Atual (R$ {chipValue.toFixed(2)} / Pleno):
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {[1, 2, 3, 5, 8, 10].map((greens) => (
                  <div key={greens} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block">
                      {greens} {greens === 1 ? 'Green' : 'Greens'}
                    </span>
                    <span className="text-base font-black font-mono text-emerald-400 mt-1 block">
                      +R$ {(greens * netProfitOnWin).toFixed(2)}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      +{(greens * roiOnWinPct).toFixed(0)}% s/ entrada
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CRESCENTE DE ÍMPARES & NÚMEROS CAMUFLADOS */}
      {activeSubTab === 'odd_progression' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-2">
                <Hash className="w-5 h-5 text-amber-400" />
                A Crescente de Ímpares (1 ➔ 3 ➔ 5 ➔ 7 ➔ 9) & Números Camuflados (Somas)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Padrão avançado ensinado na aula do Bastião: como a roleta avança nos números ímpares usando tanto o último dígito quanto a <strong>soma dos dígitos</strong> dos números.
              </p>
            </div>

            {/* Ciclo Visual da Crescente de Ímpares */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[1, 3, 5, 7, 9].map((oddNum) => {
                const oddDef = ODD_PROGRESSION_SUMS[oddNum];
                const isCurrentTarget = alert.targetTerminals.includes(oddNum);

                return (
                  <div
                    key={oddNum}
                    className={`rounded-xl p-3 border transition-all ${
                      isCurrentTarget
                        ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-black uppercase text-amber-300">
                        Ímpar {oddNum}
                      </span>
                      {isCurrentTarget && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black uppercase">
                          Alvo Atual
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block mb-1">Diretos:</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {oddDef.directNumbers.map((n) => (
                            <span
                              key={n}
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                                getNumberColor(n) === 'red' ? 'bg-rose-600' : 'bg-slate-950 border border-slate-700'
                              }`}
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-amber-400 font-bold block mb-1">Camuflados (Soma {oddNum}):</span>
                        <div className="space-y-1">
                          {oddDef.sumCamouflagedNumbers.map((camou) => (
                            <div
                              key={camou.num}
                              className="flex items-center justify-between bg-slate-900 px-2 py-1 rounded text-[10px] font-mono text-slate-300 border border-slate-800"
                            >
                              <strong className="text-amber-300">{camou.num}</strong>
                              <span className="text-slate-400">{camou.sumFormula}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Destaque Explicativo do Caso 23 (2+3=5) citado no vídeo */}
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-950 to-indigo-950/40 border border-amber-500/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase text-amber-200">
                  O Exemplo Prático da Aula: O Número 23 e o Fechamento no 19
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Na aula, o Bastião identificou: <strong className="text-white">30 (soma 3)</strong> ➔ <strong className="text-white">11 (term. 1)</strong> ➔ <strong className="text-white">33 (term. 3)</strong> ➔ <strong className="text-amber-300">23 (2+3=5 camuflado!)</strong> ➔ <strong className="text-amber-300">16 (1+6=7 camuflado!)</strong> ➔ e fechou com Green no <strong className="text-emerald-400">19 (term. 9)</strong>. Isso comprova que a soma dos dígitos conecta os cavalos de forma matemática!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: VÍDEO SINCRONIZADO / 10 MOMENTOS DA AULA */}
      {activeSubTab === 'video_sync' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-2">
                <Play className="w-5 h-5 text-rose-400" />
                Sincronizador da Aula do Bastião (10 Momentos Exatos da Transcrição)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Clique em qualquer momento para carregar a jogada correspondente, ler as citações originais e testar na roleta.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Lista dos 10 Momentos */}
              <div className="lg:col-span-5 space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {BASTIAO_HORSE_LESSON_MOMENTS.map((moment) => {
                  const isSelected = selectedMoment?.id === moment.id;
                  return (
                    <button
                      key={moment.id}
                      onClick={() => setSelectedMoment(moment)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-sky-950/50 border-sky-500 shadow-md ring-1 ring-sky-400/40'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-sky-300 font-mono text-[10px] font-black shrink-0">
                        {moment.timestamp}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-slate-200">
                            {moment.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {moment.summary}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Detalhes do Momento Selecionado */}
              <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5">
                {selectedMoment ? (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-sky-500 text-slate-950 font-black text-xs font-mono">
                          {selectedMoment.timestamp}
                        </span>
                        <h4 className="text-sm font-black text-slate-100 uppercase">
                          {selectedMoment.title}
                        </h4>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${selectedMoment.badgeColor}`}>
                        {selectedMoment.badge}
                      </span>
                    </div>

                    <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 space-y-1.5">
                      <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                        Citação Exata do Bastião no Vídeo:
                      </span>
                      <p className="text-xs text-slate-200 italic leading-relaxed">
                        {selectedMoment.transcriptionQuote}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-300 uppercase block">
                        Ensinamento & Leitura Prática:
                      </span>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {selectedMoment.lessonInsight}
                      </p>
                    </div>

                    {/* Botão de Carregar Amostra */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Giros Deste Momento:</span>
                        {selectedMoment.sampleSpins.map((num) => (
                          <span
                            key={num}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                              num === 0
                                ? 'bg-emerald-600'
                                : getNumberColor(num) === 'red'
                                ? 'bg-rose-600'
                                : 'bg-slate-950 border border-slate-700'
                            }`}
                          >
                            {num}
                          </span>
                        ))}
                      </div>

                      {onLoadVideoSpins && (
                        <button
                          onClick={() => handleLoadSample(selectedMoment.sampleSpins)}
                          className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-sky-500/20"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Carregar na Roleta</span>
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-10">
                    Selecione um momento ao lado para visualizar os detalhes.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: MAPEAMENTO NO CILINDRO EUROPEU */}
      {activeSubTab === 'cylinder_map' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-cyan-400" />
                  Mapeamento Físico na Roleta Europeia (37 Casas)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualização da ordem real do cilindro. As casas em destaque representam a cobertura do cavalo com vizinhos.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded bg-sky-500/20 text-sky-300 border border-sky-400/40 font-bold">
                  {alert.wheelCoveredNumbers.length} / 37 Casas Cobertas ({((alert.wheelCoveredNumbers.length / 37) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>

            {/* Racetrack em Grade Circular / Linear */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">
                Ordem Sequencial no Cilindro:
              </span>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                {EUROPEAN_WHEEL_ORDER.map((num, idx) => {
                  const isCovered = alert.wheelCoveredNumbers.includes(num);
                  const isDirect = alert.targetDirectNumbers.includes(num);
                  const isLast = lastNum === num;

                  return (
                    <div
                      key={num}
                      className={`flex flex-col items-center justify-center p-1 rounded-lg min-w-[38px] shrink-0 border transition-all ${
                        isLast
                          ? 'bg-amber-500/30 border-amber-400 ring-2 ring-amber-300'
                          : isDirect
                          ? 'bg-sky-500/30 border-sky-400 ring-1 ring-sky-300'
                          : isCovered
                          ? 'bg-indigo-950/40 border-indigo-500/50'
                          : 'bg-slate-900/60 border-slate-800/80 opacity-50'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white ${
                          num === 0
                            ? 'bg-emerald-600'
                            : getNumberColor(num) === 'red'
                            ? 'bg-rose-600'
                            : 'bg-slate-950 border border-slate-700'
                        }`}
                      >
                        {num}
                      </span>
                      <span className="text-[8px] font-mono mt-0.5 text-slate-400">
                        {isDirect ? 'Direto' : isCovered ? 'Viz' : `#${idx + 1}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Destaque do 14 vizinho do 31 */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <strong className="text-sky-300 block uppercase">
                💡 A Regra do 14 e do 31 (Explicada no Vídeo):
              </strong>
              <p>
                No cilindro europeu, a sequência é: <strong className="text-white">... 20 ➔ 14 ➔ 31 ➔ 9 ...</strong>. Quando o Bastião aposta no terminal 1 (número 31) com 1 vizinho, ele cobre automaticamente o 14 e o 9. Quando a bola caiu no 14, a aposta foi salva pelo vizinho, gerando o Green!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: SIMULAÇÃO & BACKTEST */}
      {activeSubTab === 'backtest' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-400" />
                  Simulação de Performance & Backtest em Tempo Real
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Resultado simulado da estratégia de Cavalos & Crescente de Ímpares sobre os {spins.length} giros registrados.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterOnlyAlerts(!filterOnlyAlerts)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                    filterOnlyAlerts
                      ? 'bg-sky-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {filterOnlyAlerts ? 'Apenas com Sinal Ativo' : 'Todos os Giros'}
                </button>
              </div>
            </div>

            {/* KPIs do Backtest */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Lucro Líquido</span>
                <span
                  className={`text-lg font-black font-mono mt-1 block ${
                    backtest.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {backtest.netProfit >= 0 ? '+' : ''}R$ {backtest.netProfit.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  ROI: {backtest.roiPct >= 0 ? '+' : ''}{backtest.roiPct.toFixed(1)}%
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Taxa de Acerto</span>
                <span className="text-lg font-black font-mono text-cyan-300 mt-1 block">
                  {backtest.winRatePct.toFixed(1)}%
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {backtest.wins} Greens / {backtest.losses} Reds
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Maior Sequência Green</span>
                <span className="text-lg font-black font-mono text-emerald-400 mt-1 block">
                  {backtest.maxGreenStreak} seguidos
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  Máx Red: {backtest.maxRedStreak}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total de Entradas</span>
                <span className="text-lg font-black font-mono text-slate-100 mt-1 block">
                  {backtest.totalBets}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  Ficha R$ {chipValue.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Tabela de Histórico do Backtest */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-black uppercase text-slate-300 block">
                Histórico de Entradas no Backtest:
              </span>

              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {backtest.history.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">
                    Nenhuma entrada disparada no período selecionado.
                  </p>
                ) : (
                  backtest.history.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                        item.isWin
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400 font-bold">#{item.giro}</span>
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white ${
                            item.numero === 0
                              ? 'bg-emerald-600'
                              : getNumberColor(item.numero) === 'red'
                              ? 'bg-rose-600'
                              : 'bg-slate-950 border border-slate-700'
                          }`}
                        >
                          {item.numero}
                        </span>
                        <span className="text-slate-300 font-medium text-[11px] truncate max-w-[220px]">
                          {item.reason}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-slate-400">
                          Aposta: R$ {item.betAmount.toFixed(2)} ({item.coveredCount} casas)
                        </span>
                        <strong
                          className={`font-black ${
                            item.isWin ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {item.isWin ? '+' : ''}R$ {item.netProfit.toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 7: GUIA DA ESTRATÉGIA */}
      {activeSubTab === 'guide' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                Manual Completo: As 5 Regras de Ouro dos Cavalos & Crescente de Ímpares
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Resumo definitivo dos ensinamentos repassados pelo Bastião para operar com consistência e segurança.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-sky-400 font-black text-xs uppercase">
                  <span className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center text-xs">1</span>
                  Verificação Prévia dos Últimos 50 Giros
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Nunca faça entradas logo ao sentar na mesa. Baixe o histórico para 50 rodadas e confirme se a roleta está respeitando os ciclos dos cavalos ou a progressão ímpar.
                </p>
              </div>

              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-purple-400 font-black text-xs uppercase">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs">2</span>
                  A Regra dos 2 para Buscar o 3º
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Quando saem dois números da mesma família (ex: saiu 7 e depois 4 no cavalo 1-4-7), o gatilho se arma para buscar o terminal restante (1) e completar o ciclo.
                </p>
              </div>

              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">3</span>
                  Padrão Intercalado (Pula 1 Casa)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Se a mesa alternar um terminal do cavalo, uma rodada de outro número, e voltar ao cavalo, jogue para fechar o ciclo na casa seguinte (pós-salto).
                </p>
              </div>

              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">4</span>
                  Nunca Seco: A Proteção dos Vizinhos
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  A física da roleta faz a bola pular nas casas adjacentes (ex: 14 é vizinho colado do 31). Jogar com ±1 ou ±2 vizinhos é o segredo para transformar "quase-reds" em Greens garantidos.
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase">
                <span className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-xs">5</span>
                A Crescente de Ímpares e os Números Camuflados
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                A roleta adora progressões ímpares (1 ➔ 3 ➔ 5 ➔ 7 ➔ 9). Não fique preso só ao último dígito: números como 23 (2+3=5), 16 (1+6=7) e 34 (3+4=7) atuam como terminais camuflados pela soma dos seus dígitos!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
