import React, { useState, useMemo } from 'react';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Percent,
  Zap,
  CheckCircle2,
  XCircle,
  Flame,
  Layers,
  BarChart3,
  Dices,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Filter,
  DollarSign,
  Sparkles,
  Sliders,
  Award
} from 'lucide-react';
import { SpinRecord, BankrollConfig } from '../types';
import { getNumberColor, calculateNeighborsAlert, EUROPEAN_WHEEL_ORDER } from '../lib/roulette';
import { detectBastiaoScalePatterns, runBastiaoScalesBacktest } from '../lib/bastiaoScalesStrategy';
import { calculateHorseCyclesAlert } from '../lib/horseCyclesStrategy';
import { calculateCamouflagedAlert, evaluateCamouflagedPayout } from '../lib/camouflagedStrategy';
import { calculateColumnSurfingAlert } from '../lib/columnSurfingStrategy';

interface StrategiesLivePerformancePanelProps {
  spins: SpinRecord[];
  config: BankrollConfig;
  onSelectStrategy?: (strategyId: string) => void;
}

export interface LiveStrategyMetric {
  id: string;
  name: string;
  category: 'bastião' | 'cobertura' | 'ciclos' | 'chances_simples';
  badge: string;
  description: string;
  betCostPerSpin: number;
  totalBetsCount: number;
  winCount: number;
  lossCount: number;
  winRatePct: number;
  netProfit: number;
  roiPct: number;
  currentStreak: {
    type: 'GREEN' | 'RED' | 'WAITING';
    count: number;
  };
  status: 'HOT' | 'PROFIT' | 'NEUTRAL' | 'DRAWDOWN' | 'WAITING_SPINS';
  latestTargetSuggestion?: string;
}

const VOISINS_SET = new Set([22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25]);
const ROMANOSKY_SET = new Set([
  ...Array.from({ length: 24 }, (_, i) => i + 1),
  25, 26, 28, 29, 32, 33, 35, 36
]);

function getWheelNeighbors(num: number, countPerSide = 2): Set<number> {
  const idx = EUROPEAN_WHEEL_ORDER.indexOf(num);
  if (idx === -1) return new Set();
  const set = new Set<number>();
  for (let i = -countPerSide; i <= countPerSide; i++) {
    const neighborIdx = (idx + i + EUROPEAN_WHEEL_ORDER.length) % EUROPEAN_WHEEL_ORDER.length;
    set.add(EUROPEAN_WHEEL_ORDER[neighborIdx]);
  }
  return set;
}

export const StrategiesLivePerformancePanel: React.FC<StrategiesLivePerformancePanelProps> = ({
  spins,
  config,
  onSelectStrategy
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'bastião' | 'cobertura' | 'ciclos' | 'chances_simples'>('all');
  const [sortBy, setSortBy] = useState<'profit' | 'winrate' | 'wins'>('profit');
  const [customUnit, setCustomUnit] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('estrategias_custom_unit');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch {
      // ignore
    }
    return config.defaultSpinCost || 2.5;
  });
  const [viewMode, setViewMode] = useState<'columns' | 'table'>('columns');

  const handleSetCustomUnit = (val: number) => {
    setCustomUnit(val);
    try {
      localStorage.setItem('estrategias_custom_unit', val.toString());
    } catch {
      // ignore
    }
  };

  const sortedSpins = useMemo(() => {
    return [...spins].sort((a, b) => a.giro - b.giro);
  }, [spins]);

  // Cálculo individual de Lucro/Red para cada estratégia em tempo real
  const strategiesMetrics = useMemo<LiveStrategyMetric[]>(() => {
    const list: LiveStrategyMetric[] = [];
    const total = sortedSpins.length;
    const unit = customUnit;

    if (total === 0) return [];

    // --- 1. NÚMEROS VIZINHOS (2 VIZINHOS NO CILINDRO - ESTRATÉGIA PRINCIPAL) ---
    {
      let wins = 0;
      let losses = 0;
      let profit = 0;
      let streakType: 'GREEN' | 'RED' | 'WAITING' = 'WAITING';
      let streakCount = 0;
      let betCount = 0;

      for (let i = 1; i < total; i++) {
        const prevNum = sortedSpins[i - 1].numero;
        const curNum = sortedSpins[i].numero;
        const neighbors = getWheelNeighbors(prevNum, 2);
        betCount++;
        if (neighbors.has(curNum)) {
          wins++;
          profit += unit * (36 / 5 - 1); // 5 números cobertos
          if (streakType === 'GREEN') streakCount++;
          else { streakType = 'GREEN'; streakCount = 1; }
        } else {
          losses++;
          profit -= unit;
          if (streakType === 'RED') streakCount++;
          else { streakType = 'RED'; streakCount = 1; }
        }
      }

      list.push({
        id: 'vizinhos_cilindro',
        name: 'Números Vizinhos (2 Viz. Cilindro)',
        category: 'bastião',
        badge: '🎯 Principal',
        description: 'Aposta em 5 números vizinhos ao último sorteado no cilindro europeu.',
        betCostPerSpin: unit,
        totalBetsCount: betCount,
        winCount: wins,
        lossCount: losses,
        winRatePct: betCount > 0 ? (wins / betCount) * 100 : 0,
        netProfit: profit,
        roiPct: betCount > 0 ? (profit / (betCount * unit)) * 100 : 0,
        currentStreak: { type: streakType, count: streakCount },
        status: profit > 0 ? 'PROFIT' : profit < 0 ? 'DRAWDOWN' : 'NEUTRAL',
        latestTargetSuggestion: total > 0 ? `Vizinhos de ${sortedSpins[total - 1].numero}` : undefined
      });
    }

    // --- 2. ESCALAS & SUBTRAÇÃO (BASTIÃO) ---
    {
      const backtest = runBastiaoScalesBacktest(sortedSpins, unit);
      const activePatterns = detectBastiaoScalePatterns(sortedSpins);
      let streakType: 'GREEN' | 'RED' | 'WAITING' = 'WAITING';
      let streakCount = 0;

      if (backtest.history.length > 0) {
        for (let i = backtest.history.length - 1; i >= 0; i--) {
          const isWin = backtest.history[i].isWin;
          const type = isWin ? 'GREEN' : 'RED';
          if (streakType === 'WAITING') {
            streakType = type;
            streakCount = 1;
          } else if (streakType === type) {
            streakCount++;
          } else {
            break;
          }
        }
      }

      list.push({
        id: 'bastiao_scales',
        name: 'Escalas & Subtração (Bastião)',
        category: 'bastião',
        badge: '⚡ Nova do Bastião',
        description: 'Leitura de progressões crescentes/decrescentes e números camuflados por |D₂ - D₁| (ex: 28 = 6).',
        betCostPerSpin: unit,
        totalBetsCount: backtest.totalEntries,
        winCount: backtest.wins,
        lossCount: backtest.losses,
        winRatePct: backtest.winRatePct,
        netProfit: backtest.netProfit,
        roiPct: backtest.totalEntries > 0 ? (backtest.netProfit / (backtest.totalEntries * unit * 3)) * 100 : 0,
        currentStreak: { type: streakType, count: streakCount },
        status: activePatterns.length > 0 ? 'HOT' : backtest.netProfit > 0 ? 'PROFIT' : 'NEUTRAL',
        latestTargetSuggestion: activePatterns.length > 0 ? activePatterns[0].title : 'Aguardando gatilho de escala'
      });
    }

    // --- 3. CAVALOS & ÍMPARES (BASTIÃO) ---
    {
      const horseAlert = calculateHorseCyclesAlert(sortedSpins, 1);
      let wins = 0;
      let losses = 0;
      let profit = 0;
      let betCount = 0;
      let streakType: 'GREEN' | 'RED' | 'WAITING' = 'WAITING';
      let streakCount = 0;

      for (let i = 2; i < total; i++) {
        const sub = sortedSpins.slice(0, i);
        const alert = calculateHorseCyclesAlert(sub, 1);
        if (alert.hasAlert && alert.wheelCoveredNumbers.length > 0) {
          const curNum = sortedSpins[i].numero;
          betCount++;
          if (alert.wheelCoveredNumbers.includes(curNum)) {
            wins++;
            profit += unit * (36 / Math.max(1, alert.wheelCoveredNumbers.length) - 1);
            if (streakType === 'GREEN') streakCount++;
            else { streakType = 'GREEN'; streakCount = 1; }
          } else {
            losses++;
            profit -= unit;
            if (streakType === 'RED') streakCount++;
            else { streakType = 'RED'; streakCount = 1; }
          }
        }
      }

      list.push({
        id: 'horse_cycles',
        name: 'Cavalos & Ímpares (Bastião)',
        category: 'bastião',
        badge: '🐎 Bastião Oficial',
        description: 'Ciclos de cavalos de terminação (1-4-7, 2-5-8, 3-6-9) e alternância de ímpares.',
        betCostPerSpin: unit,
        totalBetsCount: betCount,
        winCount: wins,
        lossCount: losses,
        winRatePct: betCount > 0 ? (wins / betCount) * 100 : 0,
        netProfit: profit,
        roiPct: betCount > 0 ? (profit / (betCount * unit)) * 100 : 0,
        currentStreak: { type: streakType, count: streakCount },
        status: horseAlert.hasAlert ? 'HOT' : profit > 0 ? 'PROFIT' : 'NEUTRAL',
        latestTargetSuggestion: horseAlert.hasAlert ? horseAlert.title : undefined
      });
    }

    // --- 4. NÚMEROS CAMUFLADOS (SOMA DE DÍGITOS) ---
    {
      let wins = 0;
      let losses = 0;
      let profit = 0;
      let betCount = 0;
      let streakType: 'GREEN' | 'RED' | 'WAITING' = 'WAITING';
      let streakCount = 0;

      for (let i = 2; i < total; i++) {
        const sub = sortedSpins.slice(0, i);
        const alert = calculateCamouflagedAlert(sub);
        if (alert && alert.betNumbers.length > 0) {
          const curNum = sortedSpins[i].numero;
          betCount++;
          if (alert.betNumbers.includes(curNum)) {
            wins++;
            profit += unit * (36 / Math.max(1, alert.betNumbers.length) - 1);
            if (streakType === 'GREEN') streakCount++;
            else { streakType = 'GREEN'; streakCount = 1; }
          } else {
            losses++;
            profit -= unit;
            if (streakType === 'RED') streakCount++;
            else { streakType = 'RED'; streakCount = 1; }
          }
        }
      }

      const curAlert = calculateCamouflagedAlert(sortedSpins);

      list.push({
        id: 'camouflaged',
        name: 'Números Camuflados (Soma D₁+D₂)',
        category: 'bastião',
        badge: '🎭 Camuflados',
        description: 'Decomposição em soma de dígitos (ex: 28 = 2+8 = 10 ➔ Terminais 1 e 0).',
        betCostPerSpin: unit,
        totalBetsCount: betCount,
        winCount: wins,
        lossCount: losses,
        winRatePct: betCount > 0 ? (wins / betCount) * 100 : 0,
        netProfit: profit,
        roiPct: betCount > 0 ? (profit / (betCount * unit)) * 100 : 0,
        currentStreak: { type: streakType, count: streakCount },
        status: curAlert && curAlert.hasAlert ? 'HOT' : profit > 0 ? 'PROFIT' : 'NEUTRAL',
        latestTargetSuggestion: curAlert ? `Puxada do ${curAlert.triggerSpinNumber}` : undefined
      });
    }

    // --- 5. SURFE DE COLUNAS (BASTIÃO) ---
    {
      let wins = 0;
      let losses = 0;
      let profit = 0;
      let betCount = 0;
      let streakType: 'GREEN' | 'RED' | 'WAITING' = 'WAITING';
      let streakCount = 0;

      for (let i = 2; i < total; i++) {
        const sub = sortedSpins.slice(0, i);
        const alert = calculateColumnSurfingAlert(sub);
        if (alert && alert.hasAlert && alert.betNumbers.length > 0) {
          const curNum = sortedSpins[i].numero;
          betCount++;
          if (alert.betNumbers.includes(curNum)) {
            wins++;
            profit += unit * 0.5; // Ganho em 2 colunas
            if (streakType === 'GREEN') streakCount++;
            else { streakType = 'GREEN'; streakCount = 1; }
          } else {
            losses++;
            profit -= unit;
            if (streakType === 'RED') streakCount++;
            else { streakType = 'RED'; streakCount = 1; }
          }
        }
      }

      const colAlert = calculateColumnSurfingAlert(sortedSpins);

      list.push({
        id: 'column_surfing',
        name: 'Surfe de Colunas (Repetição e Puxadas)',
        category: 'bastião',
        badge: '🌊 Surfe Bastião',
        description: 'Identifica sequências de repetição de coluna e quebra de alternância.',
        betCostPerSpin: unit,
        totalBetsCount: betCount,
        winCount: wins,
        lossCount: losses,
        winRatePct: betCount > 0 ? (wins / betCount) * 100 : 0,
        netProfit: profit,
        roiPct: betCount > 0 ? (profit / (betCount * unit)) * 100 : 0,
        currentStreak: { type: streakType, count: streakCount },
        status: colAlert && colAlert.hasAlert ? 'HOT' : profit > 0 ? 'PROFIT' : 'NEUTRAL',
        latestTargetSuggestion: colAlert && colAlert.hasAlert ? colAlert.reason : undefined
      });
    }

    // --- 5.5 CICLO DE FECHAMENTO (APOSTA EM AUSENTES) ---
    {
      let wins = 0;
      let losses = 0;
      let profit = 0;
      let betCount = 0;
      let streakType: 'GREEN' | 'RED' | 'WAITING' = 'WAITING';
      let streakCount = 0;
      const LOOKBACK = 25;

      for (let i = 15; i < total; i++) {
        const slice = sortedSpins.slice(Math.max(0, i - LOOKBACK), i);
        const seen = new Set(slice.map(s => s.numero));
        const absent: number[] = [];
        for (let n = 0; n <= 36; n++) {
          if (!seen.has(n)) absent.push(n);
        }

        if (absent.length > 0) {
          betCount++;
          const curNum = sortedSpins[i].numero;
          const totalCost = absent.length * unit;
          if (absent.includes(curNum)) {
            wins++;
            profit += (36 * unit) - totalCost;
            if (streakType === 'GREEN') streakCount++;
            else { streakType = 'GREEN'; streakCount = 1; }
          } else {
            losses++;
            profit -= totalCost;
            if (streakType === 'RED') streakCount++;
            else { streakType = 'RED'; streakCount = 1; }
          }
        }
      }

      const recentSlice = sortedSpins.slice(Math.max(0, total - LOOKBACK));
      const seenSet = new Set(recentSlice.map(s => s.numero));
      const curAbsent: number[] = [];
      for (let n = 0; n <= 36; n++) {
        if (!seenSet.has(n)) curAbsent.push(n);
      }

      list.push({
        id: 'cold_cycle',
        name: 'Ciclo de Fechamento (Aposta em Ausentes)',
        category: 'ciclos',
        badge: '🔄 25+ Giros Ausente',
        description: 'Mapeia os números que estão há mais de 25 rodadas sem sair e aposta diretamente neles.',
        betCostPerSpin: unit * Math.max(1, curAbsent.length),
        totalBetsCount: betCount,
        winCount: wins,
        lossCount: losses,
        winRatePct: betCount > 0 ? (wins / betCount) * 100 : 0,
        netProfit: profit,
        roiPct: betCount > 0 ? (profit / (betCount * unit * 10)) * 100 : 0,
        currentStreak: { type: streakType, count: streakCount },
        status: curAbsent.length > 0 ? 'HOT' : profit > 0 ? 'PROFIT' : 'NEUTRAL',
        latestTargetSuggestion: curAbsent.length > 0 ? `${curAbsent.length} ausentes: ${curAbsent.slice(0, 5).join(', ')}${curAbsent.length > 5 ? '...' : ''}` : undefined
      });
    }

    // --- 6. ESTRATÉGIA ROMANOSKY (86.4% COBERTURA) ---
    {
      let wins = 0;
      let losses = 0;
      let profit = 0;
      let streakType: 'GREEN' | 'RED' | 'WAITING' = 'WAITING';
      let streakCount = 0;

      for (let i = 0; i < total; i++) {
        const num = sortedSpins[i].numero;
        if (ROMANOSKY_SET.has(num)) {
          wins++;
          profit += unit * 0.125; // ganho líquido proporcional
          if (streakType === 'GREEN') streakCount++;
          else { streakType = 'GREEN'; streakCount = 1; }
        } else {
          losses++;
          profit -= unit;
          if (streakType === 'RED') streakCount++;
          else { streakType = 'RED'; streakCount = 1; }
        }
      }

      list.push({
        id: 'romanosky',
        name: 'Romanosky (Alta Cobertura 86.4%)',
        category: 'cobertura',
        badge: '🛡️ 86.4% Cobertura',
        description: '2 Dúzias + 2 Corners/Quadras cobrindo 32 de 37 números da roleta.',
        betCostPerSpin: unit,
        totalBetsCount: total,
        winCount: wins,
        lossCount: losses,
        winRatePct: total > 0 ? (wins / total) * 100 : 0,
        netProfit: profit,
        roiPct: total > 0 ? (profit / (total * unit)) * 100 : 0,
        currentStreak: { type: streakType, count: streakCount },
        status: profit > 0 ? 'PROFIT' : 'DRAWDOWN'
      });
    }

    // --- 7. VOISINS DU ZÉRO (17 NÚMEROS) ---
    {
      let wins = 0;
      let losses = 0;
      let profit = 0;
      let streakType: 'GREEN' | 'RED' | 'WAITING' = 'WAITING';
      let streakCount = 0;

      for (let i = 0; i < total; i++) {
        const num = sortedSpins[i].numero;
        if (VOISINS_SET.has(num)) {
          wins++;
          profit += unit * (36 / 17 - 1);
          if (streakType === 'GREEN') streakCount++;
          else { streakType = 'GREEN'; streakCount = 1; }
        } else {
          losses++;
          profit -= unit;
          if (streakType === 'RED') streakCount++;
          else { streakType = 'RED'; streakCount = 1; }
        }
      }

      list.push({
        id: 'voisins',
        name: 'Voisins du Zéro (Setor do Zero)',
        category: 'cobertura',
        badge: '💎 17 Números',
        description: 'Aposta em todo o grande setor em volta do zero no cilindro.',
        betCostPerSpin: unit,
        totalBetsCount: total,
        winCount: wins,
        lossCount: losses,
        winRatePct: total > 0 ? (wins / total) * 100 : 0,
        netProfit: profit,
        roiPct: total > 0 ? (profit / (total * unit)) * 100 : 0,
        currentStreak: { type: streakType, count: streakCount },
        status: profit > 0 ? 'PROFIT' : 'DRAWDOWN'
      });
    }

    // --- 8. DUAS DÚZIAS DOMINANTES (64.8% COBERTURA) ---
    {
      let wins = 0;
      let losses = 0;
      let profit = 0;
      let streakType: 'GREEN' | 'RED' | 'WAITING' = 'WAITING';
      let streakCount = 0;

      for (let i = 0; i < total; i++) {
        const num = sortedSpins[i].numero;
        if (num >= 1 && num <= 24) {
          wins++;
          profit += unit * 0.5; // paga 3:1 para 2 dúzias apostadas = lucro líquido de 1/2 unidade
          if (streakType === 'GREEN') streakCount++;
          else { streakType = 'GREEN'; streakCount = 1; }
        } else {
          losses++;
          profit -= unit;
          if (streakType === 'RED') streakCount++;
          else { streakType = 'RED'; streakCount = 1; }
        }
      }

      list.push({
        id: 'two_dozens',
        name: '2 Dúzias (1ª e 2ª Dúzia)',
        category: 'cobertura',
        badge: '📈 64.8% Cobertura',
        description: 'Cobertura de 24 números com taxa de retorno balanceada.',
        betCostPerSpin: unit,
        totalBetsCount: total,
        winCount: wins,
        lossCount: losses,
        winRatePct: total > 0 ? (wins / total) * 100 : 0,
        netProfit: profit,
        roiPct: total > 0 ? (profit / (total * unit)) * 100 : 0,
        currentStreak: { type: streakType, count: streakCount },
        status: profit > 0 ? 'PROFIT' : 'DRAWDOWN'
      });
    }

    // --- 9. D'ALEMBERT CHANCES SIMPLES (VERMELHO/PRETO) ---
    {
      let wins = 0;
      let losses = 0;
      let profit = 0;
      let curStake = unit;
      let streakType: 'GREEN' | 'RED' | 'WAITING' = 'WAITING';
      let streakCount = 0;

      for (let i = 0; i < total; i++) {
        const spin = sortedSpins[i];
        if (spin.color === 'red') {
          wins++;
          profit += curStake;
          curStake = Math.max(unit, curStake - unit * 0.2);
          if (streakType === 'GREEN') streakCount++;
          else { streakType = 'GREEN'; streakCount = 1; }
        } else {
          losses++;
          profit -= curStake;
          curStake += unit * 0.2;
          if (streakType === 'RED') streakCount++;
          else { streakType = 'RED'; streakCount = 1; }
        }
      }

      list.push({
        id: 'dalembert_red',
        name: "D'Alembert Progressivo (Cor Vermelha)",
        category: 'chances_simples',
        badge: '⚖️ Progressão Suave',
        description: 'Aumenta 1 unidade no red e diminui 1 no green mantendo controle de drawdown.',
        betCostPerSpin: unit,
        totalBetsCount: total,
        winCount: wins,
        lossCount: losses,
        winRatePct: total > 0 ? (wins / total) * 100 : 0,
        netProfit: profit,
        roiPct: total > 0 ? (profit / (total * unit)) * 100 : 0,
        currentStreak: { type: streakType, count: streakCount },
        status: profit > 0 ? 'PROFIT' : 'DRAWDOWN'
      });
    }

    // Ordenação
    return list.sort((a, b) => {
      if (sortBy === 'profit') return b.netProfit - a.netProfit;
      if (sortBy === 'winrate') return b.winRatePct - a.winRatePct;
      if (sortBy === 'wins') return b.winCount - a.winCount;
      return 0;
    });
  }, [sortedSpins, customUnit, sortBy]);

  // Filtragem
  const filteredMetrics = useMemo(() => {
    if (selectedCategory === 'all') return strategiesMetrics;
    return strategiesMetrics.filter((s) => s.category === selectedCategory);
  }, [strategiesMetrics, selectedCategory]);

  // Totais agregados
  const totals = useMemo(() => {
    const totalProf = strategiesMetrics.reduce((acc, s) => acc + s.netProfit, 0);
    const totalGreens = strategiesMetrics.reduce((acc, s) => acc + s.winCount, 0);
    const totalReds = strategiesMetrics.reduce((acc, s) => acc + s.lossCount, 0);
    const profitableCount = strategiesMetrics.filter((s) => s.netProfit > 0).length;
    return {
      totalProf,
      totalGreens,
      totalReds,
      profitableCount,
      totalStrategies: strategiesMetrics.length
    };
  }, [strategiesMetrics]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Banner de Cabeçalho com Resumo Geral */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/80 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> Placar em Tempo Real
              </span>
              <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold text-xs rounded-lg">
                {totals.profitableCount} de {totals.totalStrategies} Estratégias no Lucro
              </span>
              <span className="px-3 py-1 bg-indigo-950 text-indigo-300 border border-indigo-500/40 font-bold text-xs rounded-lg">
                Alimentado pelos Lançamentos dos Números Vizinhos
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Monitor Comparativo de Lucro & Red por Estratégia
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Cada número lançado na roleta é processado simultaneamente por todas as estratégias em segundo plano. Compare abaixo o rendimento líquido (R$), quantidade de acertos (Greens), erros (Reds), taxa de assertividade e sequência atual de cada método.
            </p>
          </div>

          {/* Simulador de Unidade Rápida */}
          <div className="flex items-center gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 shrink-0">
            <DollarSign className="w-6 h-6 text-amber-400" />
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Unidade de Cálculo:</div>
              <div className="flex items-center gap-1">
                {[1, 2.5, 5, 10, 25].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleSetCustomUnit(val)}
                    className={`px-2 py-1 rounded text-xs font-black transition-all ${
                      customUnit === val
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    R${val}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cards Resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Giros Processados</span>
            <div className="text-xl font-black text-white mt-0.5">{sortedSpins.length} giros</div>
          </div>
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-emerald-500/30">
            <span className="text-[10px] font-bold text-emerald-400 uppercase">Total Greens Somados</span>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{totals.totalGreens}</div>
          </div>
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-red-500/30">
            <span className="text-[10px] font-bold text-red-400 uppercase">Total Reds Somados</span>
            <div className="text-xl font-black text-red-400 mt-0.5">{totals.totalReds}</div>
          </div>
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-indigo-500/30">
            <span className="text-[10px] font-bold text-indigo-300 uppercase">Estratégias Ativas</span>
            <div className="text-xl font-black text-indigo-300 mt-0.5">{totals.totalStrategies} métodos</div>
          </div>
        </div>
      </div>

      {/* Controles de Filtros e Ordenação */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Todas ({strategiesMetrics.length})
          </button>
          <button
            onClick={() => setSelectedCategory('bastião')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              selectedCategory === 'bastião'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-400" />
            Métodos do Bastião
          </button>
          <button
            onClick={() => setSelectedCategory('cobertura')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              selectedCategory === 'cobertura'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Alta Cobertura
          </button>
          <button
            onClick={() => setSelectedCategory('chances_simples')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              selectedCategory === 'chances_simples'
                ? 'bg-purple-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Chances Simples
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Ordenação */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
            <Sliders className="w-3.5 h-3.5" />
            <span>Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-white px-2 py-1 rounded-lg text-xs font-bold"
            >
              <option value="profit">Maior Lucro (R$)</option>
              <option value="winrate">Maior % Assertividade</option>
              <option value="wins">Mais Greens</option>
            </select>
          </div>

          {/* Alternar Colunas vs Tabela */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('columns')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                viewMode === 'columns' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Colunas
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tabela
            </button>
          </div>
        </div>
      </div>

      {/* VISUALIZAÇÃO 1: COLUNAS INDIVIDUAIS (GRID) */}
      {viewMode === 'columns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMetrics.map((strat, rank) => {
            const isProfit = strat.netProfit >= 0;
            return (
              <div
                key={strat.id}
                className={`bg-slate-900 border-2 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all hover:scale-[1.01] relative overflow-hidden ${
                  strat.id === 'vizinhos_cilindro'
                    ? 'border-amber-500 shadow-amber-500/10'
                    : isProfit
                    ? 'border-emerald-500/40 hover:border-emerald-500'
                    : 'border-red-500/40 hover:border-red-500'
                }`}
              >
                {/* Ranking e Badge */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-black text-xs text-amber-400">
                        #{rank + 1}
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-black uppercase rounded-md">
                        {strat.badge}
                      </span>
                    </div>
                    {strat.status === 'HOT' && (
                      <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black uppercase rounded-md animate-pulse">
                        🔥 Gatilho Ativo
                      </span>
                    )}
                  </div>

                  {/* Nome e Descrição */}
                  <div>
                    <h3 className="text-base font-black text-white leading-snug">{strat.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {strat.description}
                    </p>
                  </div>

                  {/* Bloco de Lucro / Prejuízo em Destaque */}
                  <div
                    className={`p-4 rounded-2xl border flex items-center justify-between ${
                      isProfit
                        ? 'bg-emerald-950/40 border-emerald-500/50'
                        : 'bg-red-950/40 border-red-500/50'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Resultado Líquido</span>
                      <div
                        className={`text-2xl font-black font-mono leading-none mt-1 ${
                          isProfit ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isProfit ? '+' : ''}R$ {strat.netProfit.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Assertividade</span>
                      <div className="text-lg font-black text-white font-mono mt-1">
                        {strat.winRatePct.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* Métricas Detalhadas: Greens vs Reds e Sequência */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">Greens</span>
                      <div className="text-base font-black text-emerald-400 font-mono mt-0.5">
                        {strat.winCount}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-red-400 uppercase">Reds</span>
                      <div className="text-base font-black text-red-400 font-mono mt-0.5">
                        {strat.lossCount}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Seq. Atual</span>
                      <div className="text-xs font-black font-mono mt-1 flex items-center justify-center gap-1">
                        {strat.currentStreak.type === 'GREEN' ? (
                          <span className="text-emerald-400">🟢 {strat.currentStreak.count}W</span>
                        ) : strat.currentStreak.type === 'RED' ? (
                          <span className="text-red-400">🔴 {strat.currentStreak.count}L</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sugestão de Entrada Atual (se houver) */}
                  {strat.latestTargetSuggestion && (
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
                      <span className="text-slate-400 font-bold">Último Alvo:</span>
                      <span className="text-amber-300 font-bold truncate max-w-[180px]">
                        {strat.latestTargetSuggestion}
                      </span>
                    </div>
                  )}
                </div>

                {/* Botão de Ação para Abrir a Estratégia */}
                {onSelectStrategy && (
                  <button
                    onClick={() => onSelectStrategy(strat.id)}
                    className="w-full mt-4 py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Abrir Painel Dedicado</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VISUALIZAÇÃO 2: TABELA COMPARATIVA COMPLETA */}
      {viewMode === 'table' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-4">Posição / Estratégia</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4 text-center">Entradas</th>
                  <th className="p-4 text-center">Greens</th>
                  <th className="p-4 text-center">Reds</th>
                  <th className="p-4 text-center">Assertividade</th>
                  <th className="p-4 text-center">Seq. Atual</th>
                  <th className="p-4 text-right">Lucro Líquido (R$)</th>
                  <th className="p-4 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredMetrics.map((strat, rank) => {
                  const isProfit = strat.netProfit >= 0;
                  return (
                    <tr key={strat.id} className="hover:bg-slate-950/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-black text-amber-400 text-xs">#{rank + 1}</span>
                          <div>
                            <div className="font-black text-white text-sm">{strat.name}</div>
                            <div className="text-[10px] text-slate-400">{strat.badge}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-bold uppercase rounded">
                          {strat.category}
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono text-slate-200">{strat.totalBetsCount}</td>
                      <td className="p-4 text-center font-mono font-bold text-emerald-400">{strat.winCount}</td>
                      <td className="p-4 text-center font-mono font-bold text-red-400">{strat.lossCount}</td>
                      <td className="p-4 text-center font-mono font-bold text-white">
                        {strat.winRatePct.toFixed(1)}%
                      </td>
                      <td className="p-4 text-center">
                        {strat.currentStreak.type === 'GREEN' ? (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded">
                            🟢 {strat.currentStreak.count}W
                          </span>
                        ) : strat.currentStreak.type === 'RED' ? (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-[10px] font-bold rounded">
                            🔴 {strat.currentStreak.count}L
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className={`p-4 text-right font-black font-mono text-sm ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isProfit ? '+' : ''}R$ {strat.netProfit.toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        {onSelectStrategy && (
                          <button
                            onClick={() => onSelectStrategy(strat.id)}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg transition-all"
                          >
                            Abrir
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
