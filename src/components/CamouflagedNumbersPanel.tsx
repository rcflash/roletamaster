import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Target,
  Zap,
  Info,
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
  AlertTriangle
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { SpinRecord, BankrollConfig, StrategyConfig } from '../types';
import { getNumberColor } from '../lib/roulette';
import {
  TERMINALS_DATA,
  HORSE_FAMILIES_DATA,
  getTerminalOfNumber,
  getRepresentedTerminals,
  getHorseFamilyOfNumber,
  calculateCamouflagedAlert,
  runCamouflagedBacktest,
  evaluateCamouflagedPayout,
  HorseFamilyDefinition,
  TerminalDefinition
} from '../lib/camouflagedStrategy';

interface CamouflagedNumbersPanelProps {
  spins: SpinRecord[];
  config: BankrollConfig;
  strategy?: StrategyConfig;
  onUpdateStrategy?: (updated: Partial<StrategyConfig>) => void;
}

export const CamouflagedNumbersPanel: React.FC<CamouflagedNumbersPanelProps> = ({
  spins,
  config,
  strategy,
  onUpdateStrategy,
}) => {
  const [selectedTerminal, setSelectedTerminal] = useState<number | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<'1-4-7' | '2-5-8' | '0-3-6-9' | null>(null);
  const [strategyMode, setStrategyMode] = useState<'smart' | 'family' | 'terminal'>('smart');
  const [chipValue, setChipValue] = useState<number>(strategy?.neighborChipValue || 2.50);
  const [onlyAlertSpins, setOnlyAlertSpins] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'radar' | 'terminals' | 'backtest' | 'guide'>('radar');

  const lastSpin = spins.length > 0 ? spins[spins.length - 1] : null;
  const lastNum = lastSpin ? lastSpin.numero : 0;
  const lastTerminal = lastSpin ? getTerminalOfNumber(lastNum) : 0;
  const lastRepresented = lastSpin ? getRepresentedTerminals(lastNum) : [];
  const lastFamily = lastSpin ? getHorseFamilyOfNumber(lastNum) : '1-4-7';

  // Alerta em tempo real com base no histórico
  const alertInfo = useMemo(() => {
    return calculateCamouflagedAlert(spins, strategyMode, chipValue);
  }, [spins, strategyMode, chipValue]);

  // Backtest / Estatísticas em tempo real
  const backtestStats = useMemo(() => {
    return runCamouflagedBacktest(
      spins,
      config.initialBankroll || 100,
      chipValue,
      strategyMode,
      onlyAlertSpins
    );
  }, [spins, config.initialBankroll, chipValue, strategyMode, onlyAlertSpins]);

  // Contagem de frequência das 3 famílias nos últimos giros
  const recentSpins30 = useMemo(() => spins.slice(-30), [spins]);
  const recentSpins15 = useMemo(() => spins.slice(-15), [spins]);

  const familyCounts = useMemo(() => {
    const counts = { '1-4-7': 0, '2-5-8': 0, '0-3-6-9': 0 };
    recentSpins30.forEach((s) => {
      const fam = getHorseFamilyOfNumber(s.numero);
      counts[fam]++;
    });
    return counts;
  }, [recentSpins30]);

  // Sequência recente de Greens e Reds para esta estratégia
  const spinHistoryResults = useMemo(() => {
    if (spins.length < 2) return [];
    const results: {
      spinNumber: number;
      numero: number;
      isWin: boolean;
      hadAlert: boolean;
      betCount: number;
      netResult: number;
    }[] = [];

    spins.forEach((spin, idx) => {
      if (idx === 0) return;
      const historyBefore = spins.slice(0, idx);
      const alert = calculateCamouflagedAlert(historyBefore, strategyMode, chipValue);
      if (!alert) return;

      if (!alert.hasAlert && onlyAlertSpins) {
        return;
      }

      const payout = evaluateCamouflagedPayout(spin.numero, alert.betNumbers, chipValue, 36);
      results.push({
        spinNumber: spin.giro || idx + 1,
        numero: spin.numero,
        isWin: payout.isWin,
        hadAlert: alert.hasAlert,
        betCount: alert.betNumbers.length,
        netResult: payout.netResult,
      });
    });

    return results;
  }, [spins, strategyMode, chipValue, onlyAlertSpins]);

  // Sequência atual de Greens/Reds
  const currentStreak = useMemo(() => {
    if (spinHistoryResults.length === 0) return { type: 'NONE', count: 0 };
    const lastResult = spinHistoryResults[spinHistoryResults.length - 1];
    let count = 0;
    for (let i = spinHistoryResults.length - 1; i >= 0; i--) {
      if (spinHistoryResults[i].isWin === lastResult.isWin) {
        count++;
      } else {
        break;
      }
    }
    return { type: lastResult.isWin ? 'GREEN' : 'RED', count };
  }, [spinHistoryResults]);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header Banner com Título e Metodologia */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3" /> NOVO MÓDULO OFICIAL
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Eye className="w-3 h-3 text-amber-400" /> A FORTALEZA DA LEITURA
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              <Dices className="w-6 h-6 text-amber-400" />
              NÚMEROS CAMUFLADOS & CAVALOS
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Leitura avançada por <strong>soma dos dígitos</strong> (ex: 11 = 1+1=2 ➔ Camufla Terminal 2) combinada com 
              <strong> Famílias de Cavalos (1-4-7, 2-5-8 e 0-3-6-9)</strong> para antecipar puxadas e ciclos de mesa com alta assertividade.
            </p>
          </div>

          {/* Quick Settings Toolbar */}
          <div className="flex items-center gap-2 flex-wrap bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Ficha:</span>
              {[1.0, 2.5, 5.0, 10.0].map((val) => (
                <button
                  key={val}
                  onClick={() => {
                    setChipValue(val);
                    if (onUpdateStrategy) onUpdateStrategy({ neighborChipValue: val });
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-black transition-all ${
                    chipValue === val
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  R$ {val.toFixed(2)}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-slate-800" />

            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Modo:</span>
              <select
                value={strategyMode}
                onChange={(e) => setStrategyMode(e.target.value as 'smart' | 'family' | 'terminal')}
                className="bg-slate-900 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-lg px-2 py-1 outline-none"
              >
                <option value="smart">Smart Momentum (Família + Puxada)</option>
                <option value="family">Família de Cavalo Completa</option>
                <option value="terminal">Terminal + Camuflados Diretos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-800/80 flex-wrap">
          <button
            onClick={() => setActiveSubTab('radar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeSubTab === 'radar'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Radar em Tempo Real & Alertas</span>
          </button>
          <button
            onClick={() => setActiveSubTab('terminals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeSubTab === 'terminals'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Guia Interativo dos 10 Terminais</span>
          </button>
          <button
            onClick={() => setActiveSubTab('backtest')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeSubTab === 'backtest'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Simulador & Curva de Lucro ({spinHistoryResults.length} Jogadas)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('guide')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeSubTab === 'guide'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Regras & Resumo da Leitura</span>
          </button>
        </div>
      </div>

      {/* KPI Cards de Desempenho Rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Greens 🟢</span>
          <span className="text-lg sm:text-xl font-black text-emerald-400">{backtestStats.winCount}</span>
          <span className="text-[10px] text-slate-500 block">acertos no alvo</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reds 🔴</span>
          <span className="text-lg sm:text-xl font-black text-rose-400">{backtestStats.lossCount}</span>
          <span className="text-[10px] text-slate-500 block">erros fora do padrão</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Taxa de Acerto</span>
          <span className="text-lg sm:text-xl font-black text-amber-400">{backtestStats.winRatePct.toFixed(1)}%</span>
          <span className="text-[10px] text-slate-500 block">{backtestStats.totalEvaluated} jogadas avaliadas</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lucro Líquido</span>
          <span className={`text-lg sm:text-xl font-black ${backtestStats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {backtestStats.netProfit >= 0 ? '+' : ''}{config.currency} {backtestStats.netProfit.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 block">ROI: {backtestStats.roiPct.toFixed(1)}%</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sequência Atual</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`px-2 py-0.5 rounded text-xs font-black uppercase ${
                currentStreak.type === 'GREEN'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : currentStreak.type === 'RED'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {currentStreak.count}x {currentStreak.type}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Max Green: {backtestStats.maxConsecWins}x</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Família Ativa</span>
          <span className="text-base sm:text-lg font-black text-amber-300 block">{lastFamily}</span>
          <span className="text-[10px] text-slate-400 block">{HORSE_FAMILIES_DATA[lastFamily].name}</span>
        </div>
      </div>

      {/* VIEW 1: RADAR EM TEMPO REAL & ALERTAS */}
      {activeSubTab === 'radar' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Card Esquerdo: Leitura do Último Número & Alerta Ativo */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black">
                    <Crosshair className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                      Leitura de Camuflados do Último Giro
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Decomposição do número sorteado em Terminais e Família de Cavalo
                    </p>
                  </div>
                </div>

                {alertInfo?.hasAlert ? (
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 animate-pulse">
                    <Zap className="w-3.5 h-3.5" /> ENTRADA ATIVA!
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" /> EM OBSERVAÇÃO
                  </span>
                )}
              </div>

              {/* Informações Centrais do Último Número */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black text-2xl shadow-lg border-2 ${
                      getNumberColor(lastNum) === 'red'
                        ? 'bg-rose-600 border-rose-400 text-white shadow-rose-600/30'
                        : getNumberColor(lastNum) === 'green'
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-600/30'
                        : 'bg-slate-950 border-slate-600 text-white shadow-slate-950/50'
                    }`}
                  >
                    <span>{lastNum}</span>
                    <span className="text-[9px] uppercase tracking-wider font-bold opacity-80">Último</span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-black text-slate-200">
                      Terminal Puro: <span className="text-amber-400 text-sm font-black">Terminal {lastTerminal}</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Soma dos dígitos: <strong className="text-slate-200">{lastNum < 10 ? lastNum : `${Math.floor(lastNum/10)} + ${lastNum%10} = ${lastNum < 10 ? lastNum : Math.floor(lastNum/10) + (lastNum%10)}`}</strong>
                    </div>
                    <div className="text-xs text-slate-400">
                      Camuflagens diretas:{' '}
                      <span className="text-amber-300 font-bold">
                        [{lastRepresented.map((t) => `T${t}`).join(', ')}]
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center sm:text-right w-full sm:w-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Família de Cavalo</span>
                  <span className="text-base font-black text-amber-400 block">{HORSE_FAMILIES_DATA[lastFamily].name}</span>
                  <span className="text-[11px] text-slate-300 font-medium">Terminais [{HORSE_FAMILIES_DATA[lastFamily].terminals.join(', ')}]</span>
                </div>
              </div>

              {/* Caixa de Recomendação de Entrada */}
              <div
                className={`rounded-xl p-4 border transition-all ${
                  alertInfo?.hasAlert
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      alertInfo?.hasAlert ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {alertInfo?.hasAlert ? <Zap className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                  </div>

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                        {alertInfo?.hasAlert ? '🚨 RECOMENDAÇÃO DE ENTRADA ATIVA' : '⏳ STATUS OPERACIONAL'}
                      </h4>
                      {alertInfo && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                          Assertividade Estimada: {alertInfo.confidencePct}%
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-bold leading-relaxed">
                      {alertInfo?.reason || 'Aguardando giros adicionais para detecção de padrão de cavalos.'}
                    </p>

                    {/* Números da Aposta */}
                    {alertInfo && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-2">
                        <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                          <span>Casas a Cobrir ({alertInfo.betNumbersCount} números):</span>
                          <span className="text-amber-400 font-mono">
                            Custo: R$ {alertInfo.estimatedCost.toFixed(2)} (R$ {chipValue.toFixed(2)} / casa)
                          </span>
                        </div>

                        {/* Grid de Números a Apostar */}
                        <div className="flex flex-wrap gap-1.5 py-1">
                          {alertInfo.betNumbers.map((num) => {
                            const c = getNumberColor(num);
                            let bg = 'bg-slate-950 border-slate-700 text-white';
                            if (c === 'red') bg = 'bg-rose-600/90 border-rose-500 text-white';
                            else if (c === 'green') bg = 'bg-emerald-600 border-emerald-400 text-white';
                            return (
                              <div
                                key={num}
                                className={`px-2 py-1 rounded-lg text-xs font-black border shadow-xs flex items-center justify-center min-w-[32px] ${bg} ${
                                  num === lastNum ? 'ring-2 ring-amber-400 scale-105' : ''
                                }`}
                                title={`Número ${num} (Terminal ${getTerminalOfNumber(num)})`}
                              >
                                {num}
                              </div>
                            );
                          })}
                        </div>

                        {/* Retorno e Lucro Projetado */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Retorno no Acerto:</span>
                            <span className="font-black text-slate-100">
                              {config.currency} {alertInfo.expectedGrossReturn.toFixed(2)} (36x)
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Lucro Líquido:</span>
                            <span className="font-black text-emerald-400">
                              +{config.currency} {alertInfo.expectedNetProfit.toFixed(2)}
                            </span>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-slate-400 block text-[10px]">Família do Alvo:</span>
                            <span className="font-black text-amber-300">{alertInfo.activeFamily}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card Direito: Termômetro das 3 Famílias de Cavalos */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4 flex flex-col justify-between">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-black">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                      Termômetro de Famílias de Cavalos
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Distribuição de frequência nos últimos {recentSpins30.length} giros
                    </p>
                  </div>
                </div>
              </div>

              {/* As 3 Barras das Famílias */}
              <div className="space-y-3">
                {(['1-4-7', '2-5-8', '0-3-6-9'] as const).map((famId) => {
                  const fam = HORSE_FAMILIES_DATA[famId];
                  const count = familyCounts[famId];
                  const total = recentSpins30.length || 1;
                  const pct = Math.round((count / total) * 100);
                  const isCurrent = lastFamily === famId;

                  return (
                    <div
                      key={famId}
                      className={`p-3 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-amber-950/20 border-amber-500/40 shadow-md'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-slate-200">{fam.name}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500 text-slate-950">
                              ATIVA 🔥
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono font-bold text-amber-400">
                          {count} hits ({pct}%)
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pct >= 40
                              ? 'bg-gradient-to-r from-amber-500 to-emerald-400'
                              : pct >= 25
                              ? 'bg-gradient-to-r from-indigo-500 to-amber-400'
                              : 'bg-slate-600'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>

                      {/* Exemplo e Terminais */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Terminais: [{fam.terminals.join(', ')}]</span>
                        <span className="italic text-slate-500">Ex: {fam.examples[0]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dica da Imagem Oficial */}
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 space-y-1">
                <div className="font-bold text-amber-400 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" /> Padrão de Mesa (Cavalos):
                </div>
                <p className="text-slate-400 text-[10px] leading-tight">
                  São jogadas onde são marcados todos os números com o mesmo dígito final ou soma de dígitos correlata, 
                  fechando ciclos de rotação e repetição camuflada.
                </p>
              </div>
            </div>
          </div>

          {/* Sequência Recente de Giros & Placar de Greens/Reds */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                  Histórico Sequencial de Giros na Estratégia de Camuflados
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyAlertSpins}
                    onChange={(e) => setOnlyAlertSpins(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Apenas Giros com Alertas</span>
                </label>
              </div>
            </div>

            {/* Timeline Pills */}
            <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-thin">
              {spinHistoryResults.slice(-20).map((item, idx) => (
                <div
                  key={`seq-${idx}-${item.spinNumber}`}
                  className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-xl border shrink-0 transition-all ${
                    item.isWin
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                  }`}
                >
                  <span className="text-[9px] font-bold text-slate-400">#{item.spinNumber}</span>
                  <span className="text-sm font-black">{item.numero}</span>
                  <span
                    className={`text-[9px] font-black uppercase px-1 rounded mt-0.5 ${
                      item.isWin ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {item.isWin ? 'GREEN' : 'RED'}
                  </span>
                </div>
              ))}

              {spinHistoryResults.length === 0 && (
                <div className="text-xs text-slate-400 py-4 text-center w-full">
                  Nenhum giro registrado ainda. Lance números no teclado para iniciar a leitura.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: GUIA INTERATIVO DOS 10 TERMINAIS & CAMUFLADOS */}
      {activeSubTab === 'terminals' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-100 uppercase tracking-wide flex items-center gap-2">
                  <Hash className="w-5 h-5 text-amber-400" />
                  TABELA OFICIAL DE TERMINAIS E NÚMEROS CAMUFLADOS
                </h3>
                <p className="text-xs text-slate-400">
                  Clique em um terminal para inspecionar seus números puros, camuflados por soma e exemplos clássicos de leitura.
                </p>
              </div>

              {selectedTerminal !== null && (
                <button
                  onClick={() => setSelectedTerminal(null)}
                  className="text-xs text-amber-400 hover:underline font-bold"
                >
                  Limpar Seleção
                </button>
              )}
            </div>

            {/* Grid dos 10 Terminais (0 a 9) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((tNum) => {
                const term = TERMINALS_DATA[tNum];
                const isSelected = selectedTerminal === tNum;
                const isCurrentActive = lastTerminal === tNum;

                return (
                  <div
                    key={tNum}
                    onClick={() => setSelectedTerminal(isSelected ? null : tNum)}
                    className={`rounded-xl p-3.5 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-400 shadow-lg ring-1 ring-amber-400/50'
                        : isCurrentActive
                        ? 'bg-slate-900 border-amber-500/40 shadow-md'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Header do Card */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                            T{tNum}
                          </div>
                          <span className="font-black text-xs text-slate-100">Terminal {tNum}</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300">
                          {term.horseFamily}
                        </span>
                      </div>

                      {/* Terminais Puros */}
                      <div className="space-y-1 mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Puros:</span>
                        <div className="flex flex-wrap gap-1">
                          {term.pureNumbers.map((n) => (
                            <span
                              key={n}
                              className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${
                                getNumberColor(n) === 'red'
                                  ? 'bg-rose-900/60 text-rose-200 border border-rose-700/50'
                                  : getNumberColor(n) === 'green'
                                  ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-700/50'
                                  : 'bg-slate-900 text-slate-200 border border-slate-700'
                              }`}
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Números Camuflados */}
                      <div className="space-y-1 mb-2">
                        <span className="text-[10px] font-bold text-amber-400 uppercase block">Camuflados:</span>
                        <div className="flex flex-wrap gap-1">
                          {term.camouflagedNumbers.map((n) => (
                            <span
                              key={n}
                              className="px-1.5 py-0.5 rounded text-[11px] font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              title={`Camuflado por soma (${n.toString().split('').join('+')} = ${n.toString().split('').reduce((a,b)=>a+parseInt(b),0)})`}
                            >
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Exemplo de Leitura */}
                    <div className="pt-2 border-t border-slate-800/80 text-[10px]">
                      <span className="text-slate-500 block">Exemplo Clássico:</span>
                      <span className="font-mono text-slate-300 font-bold">{term.classicExample}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Painel Detalhado do Terminal Selecionado */}
            {selectedTerminal !== null && (
              <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-amber-400 uppercase">
                    Detalhamento Matemático: Terminal {selectedTerminal}
                  </h4>
                  <span className="text-xs text-slate-400">
                    Pertence à <strong>{HORSE_FAMILIES_DATA[TERMINALS_DATA[selectedTerminal].horseFamily].name}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                    <span className="font-bold text-slate-400 block text-[11px]">Somas que geram este terminal:</span>
                    <ul className="list-disc list-inside space-y-0.5 font-mono text-amber-300">
                      {TERMINALS_DATA[selectedTerminal].sumExplanation.map((exp, i) => (
                        <li key={i}>{exp}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-1">
                    <span className="font-bold text-slate-400 block text-[11px]">Leituras Combinadas de Mesa:</span>
                    <p className="font-mono text-slate-200">
                      • Leitura Básica: <strong>{TERMINALS_DATA[selectedTerminal].classicExample}</strong>
                    </p>
                    <p className="font-mono text-slate-200">
                      • Leitura Avançada: <strong>{TERMINALS_DATA[selectedTerminal].advancedExample}</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: SIMULADOR & CURVA DE LUCRO */}
      {activeSubTab === 'backtest' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-100 uppercase tracking-wide flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  SIMULADOR E BACKTEST DA ESTRATÉGIA DE CAMUFLADOS
                </h3>
                <p className="text-xs text-slate-400">
                  Curva de evolução do saldo aplicando as regras de cavalos e camuflados no histórico carregado
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Saldo Final Simulado:</span>
                <span className="text-base font-black text-emerald-400">
                  {config.currency} {backtestStats.finalBankroll.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Gráfico de Evolução de Saldo com Recharts */}
            <div className="h-64 w-full bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={backtestStats.chartHistory}>
                  <defs>
                    <linearGradient id="colorBalCamouflaged" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="spinIndex" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [`${config.currency} ${Number(value).toFixed(2)}`, 'Saldo']}
                    labelFormatter={(label) => `Giro #${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBalCamouflaged)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Métricas Avançadas de Backtest */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Drawdown Máximo</span>
                <span className="text-sm font-black text-rose-400">
                  {config.currency} {backtestStats.maxDrawdown.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Max Greens Seguidos</span>
                <span className="text-sm font-black text-emerald-400">{backtestStats.maxConsecWins}x</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Max Reds Seguidos</span>
                <span className="text-sm font-black text-rose-400">{backtestStats.maxConsecLosses}x</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Retorno s/ Investimento</span>
                <span className="text-sm font-black text-amber-400">{backtestStats.roiPct.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: GUIA DE LEITURA & REGRAS OFICIAIS */}
      {activeSubTab === 'guide' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-100 uppercase tracking-tight">
                METODOLOGIA OFICIAL: NÚMEROS CAMUFLADOS & CAVALOS
              </h3>
              <p className="text-xs text-slate-400">
                Documento de referência e princípios de leitura de mesa
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="font-black text-amber-400 uppercase text-xs">O que são Números Camuflados?</h4>
              <p>
                São números que, ao somar seus dígitos, resultam no mesmo terminal. 
                Exemplo: <strong>11</strong> ➔ na soma de 1+1=2, ou seja, o número 11 pode servir como um terminal 2.
              </p>
              <p>
                Isso permite identificar quando a mesa está repetindo um padrão de terminal ou de família de cavalo 
                mesmo que o número aparente na tela pareça diferente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-black text-amber-300 text-xs block">1. Terminais</span>
                <p className="text-xs text-slate-400">
                  Dão <strong>volume e frequência</strong>. São a base para identificar repetições imediatas e puxadas de vizinhos na mesa.
                </p>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-black text-amber-300 text-xs block">2. Cavalos</span>
                <p className="text-xs text-slate-400">
                  Aumentam o <strong>potencial de ganho</strong>. São jogadas onde são marcados todos os números com o mesmo dígito final ou da mesma família (1-4-7, 2-5-8, 0-3-6-9).
                </p>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <span className="font-black text-amber-300 text-xs block">3. Combinação</span>
                <p className="text-xs text-slate-400">
                  Equilíbrio entre <strong>risco e retorno</strong>. Ao combinar os terminais puros com os camuflados da família, fecha-se o ciclo de leitura da mesa.
                </p>
              </div>
            </div>

            {/* Aviso de Gestão de Risco */}
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-200">
                <strong>Atenção:</strong> Lembre-se que a vantagem da casa permanece ativa (+18). 
                Opere sempre com disciplina, respeitando o seu Stop Loss e a sua Meta Diária estipulada no Controle de Banca.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
