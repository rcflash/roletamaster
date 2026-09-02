import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Target,
  Trophy,
  Flame,
  Snowflake,
  TrendingUp,
  Percent,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Compass,
  Sliders,
  BarChart3
} from 'lucide-react';
import { SpinRecord, BankrollConfig } from '../types';
import { EUROPEAN_WHEEL_ORDER, getNumberColor } from '../lib/roulette';

interface ClosedCyclePanelProps {
  spins: SpinRecord[];
  config: BankrollConfig;
}

export const ClosedCyclePanel: React.FC<ClosedCyclePanelProps> = ({
  spins,
  config
}) => {
  // Configurações do Ciclo
  const [lookbackThreshold, setLookbackThreshold] = useState<number>(25); // Padrão 25 rodadas
  const [stakePerNumber, setStakePerNumber] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('ciclo_ausentes_stake');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch {
      // ignore
    }
    return 2.5;
  });
  const [filterView, setFilterView] = useState<'all' | 'absent' | 'recent'>('all');

  const handleSetStake = (val: number) => {
    setStakePerNumber(val);
    try {
      localStorage.setItem('ciclo_ausentes_stake', val.toString());
    } catch {
      // ignore
    }
  };

  const sortedSpins = useMemo(() => {
    return [...spins].sort((a, b) => a.giro - b.giro);
  }, [spins]);

  const totalSpins = sortedSpins.length;

  // Análise de Atraso e Ausência de cada número (0 a 36)
  const numbersAnalysis = useMemo(() => {
    const lastSeenIndex: Record<number, number> = {};
    const totalHits: Record<number, number> = {};

    for (let i = 0; i <= 36; i++) {
      lastSeenIndex[i] = -1;
      totalHits[i] = 0;
    }

    sortedSpins.forEach((s, idx) => {
      lastSeenIndex[s.numero] = idx;
      totalHits[s.numero] = (totalHits[s.numero] || 0) + 1;
    });

    const result = [];
    for (let i = 0; i <= 36; i++) {
      const lastIdx = lastSeenIndex[i];
      const spinsSinceLastSeen = lastIdx === -1 ? totalSpins : (totalSpins - 1) - lastIdx;
      const isAbsent = spinsSinceLastSeen >= lookbackThreshold;

      result.push({
        number: i,
        color: getNumberColor(i),
        lastSeenIndex: lastIdx,
        spinsSinceLastSeen,
        totalHits: totalHits[i] || 0,
        isAbsent
      });
    }

    return result;
  }, [sortedSpins, totalSpins, lookbackThreshold]);

  // Lista dos números ausentes atuais
  const absentNumbers = useMemo(() => {
    return numbersAnalysis
      .filter((n) => n.isAbsent)
      .sort((a, b) => b.spinsSinceLastSeen - a.spinsSinceLastSeen);
  }, [numbersAnalysis]);

  const absentNumberValues = useMemo(() => {
    return absentNumbers.map((n) => n.number);
  }, [absentNumbers]);

  // Cobertura e Cálculos Financeiros
  const coverageCount = absentNumbers.length;
  const coveragePct = (coverageCount / 37) * 100;
  const totalCost = coverageCount * stakePerNumber;
  const grossWin = 36 * stakePerNumber;
  const netWinPerHit = grossWin - totalCost;

  // Backtest / Histórico de Desempenho do Ciclo de Ausentes nos giros
  const backtest = useMemo(() => {
    let balance = config.initialBankroll || 100;
    let wins = 0;
    let losses = 0;
    let totalEntries = 0;
    let totalInvested = 0;
    let currentStreakType: 'GREEN' | 'RED' | 'WAITING' = 'WAITING';
    let currentStreakCount = 0;
    let maxWinsSeq = 0;
    let maxLossSeq = 0;
    let cWins = 0;
    let cLoss = 0;
    const historyChart: { spinIndex: number; giro: number; balance: number; outcome?: 'GREEN' | 'RED'; net?: number }[] = [
      { spinIndex: 0, giro: 0, balance }
    ];

    const entriesLog: {
      spinIndex: number;
      giro: number;
      drawnNumber: number;
      absentList: number[];
      isWin: boolean;
      profit: number;
      cost: number;
    }[] = [];

    // Rodar simulação giro a giro
    sortedSpins.forEach((spin, idx) => {
      const spinIndex = idx + 1;

      // Precisa de pelo menos 15 giros de aquecimento
      if (idx < 15) {
        historyChart.push({ spinIndex, giro: spin.giro, balance });
        return;
      }

      // Olha a fatia anterior de lookbackThreshold
      const historySlice = sortedSpins.slice(Math.max(0, idx - lookbackThreshold), idx);
      const seenSet = new Set(historySlice.map((s) => s.numero));
      const currentAbsents: number[] = [];
      for (let n = 0; n <= 36; n++) {
        if (!seenSet.has(n)) {
          currentAbsents.push(n);
        }
      }

      // Se houver números ausentes dentro da janela, realiza a entrada
      if (currentAbsents.length > 0) {
        totalEntries++;
        const cost = currentAbsents.length * stakePerNumber;
        totalInvested += cost;

        const isWin = currentAbsents.includes(spin.numero);
        if (isWin) {
          const payout = 36 * stakePerNumber;
          const net = payout - cost;
          balance += net;
          wins++;
          cWins++;
          cLoss = 0;
          if (cWins > maxWinsSeq) maxWinsSeq = cWins;

          if (currentStreakType === 'GREEN') currentStreakCount++;
          else { currentStreakType = 'GREEN'; currentStreakCount = 1; }

          entriesLog.push({
            spinIndex,
            giro: spin.giro,
            drawnNumber: spin.numero,
            absentList: currentAbsents,
            isWin: true,
            profit: net,
            cost
          });

          historyChart.push({ spinIndex, giro: spin.giro, balance, outcome: 'GREEN', net });
        } else {
          const net = -cost;
          balance += net;
          losses++;
          cLoss++;
          cWins = 0;
          if (cLoss > maxLossSeq) maxLossSeq = cLoss;

          if (currentStreakType === 'RED') currentStreakCount++;
          else { currentStreakType = 'RED'; currentStreakCount = 1; }

          entriesLog.push({
            spinIndex,
            giro: spin.giro,
            drawnNumber: spin.numero,
            absentList: currentAbsents,
            isWin: false,
            profit: net,
            cost
          });

          historyChart.push({ spinIndex, giro: spin.giro, balance, outcome: 'RED', net });
        }
      } else {
        historyChart.push({ spinIndex, giro: spin.giro, balance });
      }
    });

    const netProfit = balance - (config.initialBankroll || 100);
    const winRate = totalEntries > 0 ? (wins / totalEntries) * 100 : 0;
    const roi = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;

    return {
      balance,
      netProfit,
      wins,
      losses,
      totalEntries,
      totalInvested,
      winRate,
      roi,
      currentStreakType,
      currentStreakCount,
      maxWinsSeq,
      maxLossSeq,
      historyChart,
      entriesLog: entriesLog.reverse()
    };
  }, [sortedSpins, lookbackThreshold, stakePerNumber, config.initialBankroll]);

  // Progresso do Ciclo de 37 giros
  const cycleProgress = useMemo(() => {
    const recent37 = sortedSpins.slice(-37);
    const uniqueSeen = new Set(recent37.map((s) => s.numero)).size;
    const missingIn37 = 37 - uniqueSeen;
    return {
      spinsInSample: recent37.length,
      uniqueSeen,
      missingIn37,
      pctComplete: (uniqueSeen / 37) * 100
    };
  }, [sortedSpins]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Banner Principal com Identidade da Estratégia */}
      <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-yellow-500/10 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-full flex items-center gap-1 shadow-md">
                <Trophy className="w-3.5 h-3.5" /> #1 Mais Lucrativa em Ciclos
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-300 text-xs font-black rounded-lg border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Estratégia Ativa
              </span>
              <span className="px-2.5 py-0.5 bg-slate-800 text-amber-300 text-xs font-bold rounded-lg border border-slate-700">
                Frequência / Ciclo de Ausentes
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <RotateCcw className="w-7 h-7 text-amber-400" />
              <span>Ciclo de Fechamento <span className="text-amber-400">(Aposta em Ausentes)</span></span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Mapeia os números que estão há <strong>mais de {lookbackThreshold} rodadas sem sair</strong> e aposta diretamente neles em pleno (36x). Como a roleta tende ao equilíbrio estatístico a cada ciclo de 37 giros, os números ausentes têm altíssima pressão matemática para serem sorteados.
            </p>
          </div>

          {/* Placar Rápido do Topo */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 text-center shrink-0 min-w-[140px] shadow-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Geral (Total)</span>
              <span className={`text-xl sm:text-2xl font-black ${backtest.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {backtest.netProfit >= 0 ? '+' : ''}{config.currency} {backtest.netProfit.toFixed(2)}
              </span>
            </div>

            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 text-center shrink-0 min-w-[130px] shadow-lg">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Placar Geral</span>
              <div className="flex items-center justify-center gap-2 mt-0.5">
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-xs font-black rounded-lg">
                  {backtest.wins} Green
                </span>
                <span className="px-2 py-0.5 bg-rose-950 text-rose-400 border border-rose-500/30 text-xs font-black rounded-lg">
                  {backtest.losses} Red
                </span>
              </div>
              {backtest.currentStreakCount > 0 && (
                <div className="mt-1">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    backtest.currentStreakType === 'GREEN'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    Seq: {backtest.currentStreakCount}x {backtest.currentStreakType}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Controles Rápidos: Janela de Atraso e Valor da Aposta */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        {/* Janela de Atraso */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Gatilho de Ausência (Sem Sair):</span>
          </span>
          <div className="flex items-center gap-1.5">
            {[20, 25, 30, 35].map((val) => (
              <button
                key={val}
                onClick={() => setLookbackThreshold(val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  lookbackThreshold === val
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 ring-1 ring-amber-300'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {val}+ Rodadas {val === 25 ? '(Oficial)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Valor da Ficha por Número */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Valor por Número:</span>
          </span>
          <div className="flex items-center gap-1.5">
            {[0.5, 1, 2.5, 5, 10].map((val) => (
              <button
                key={val}
                onClick={() => handleSetStake(val)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  stakePerNumber === val
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {config.currency} {val.toFixed(2)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cartões de Métricas e Sugestão Imediata */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cartão 1: Números Ausentes Atuais */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span className="flex items-center gap-1.5">
              <Snowflake className="w-4 h-4 text-cyan-400" />
              <span>Ausentes no Momento</span>
            </span>
            <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 text-[10px] font-black rounded border border-cyan-500/30">
              {coverageCount} de 37
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{coverageCount}</span>
            <span className="text-xs text-slate-400 font-bold">números da mesa</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Cobertura da mesa: <strong className="text-amber-400">{coveragePct.toFixed(1)}%</strong>
          </div>
        </div>

        {/* Cartão 2: Custo & Pagamento do Giro */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Custo da Entrada</span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold">{coverageCount} fichas</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400">{config.currency} {totalCost.toFixed(2)}</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-bold">
            Lucro por Acerto: +{config.currency} {netWinPerHit.toFixed(2)} (36x)
          </div>
        </div>

        {/* Cartão 3: Taxa de Acerto Histórica */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span className="flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-emerald-400" />
              <span>Taxa de Acerto</span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold">{backtest.totalEntries} entradas</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{backtest.winRate.toFixed(1)}%</span>
            <span className="text-xs text-slate-400 font-bold">Green Rate</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Retorno ROI: <strong className={backtest.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{backtest.roi.toFixed(1)}%</strong>
          </div>
        </div>

        {/* Cartão 4: Fechamento de Ciclo (37 Giros) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Ciclo de 37 Giros</span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold">{cycleProgress.spinsInSample}/37</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-300">{cycleProgress.uniqueSeen}/37</span>
            <span className="text-xs text-slate-400 font-bold">números saídos</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-500"
              style={{ width: `${cycleProgress.pctComplete}%` }}
            />
          </div>
        </div>
      </div>

      {/* Alerta de Aposta Imediata Recomendada */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider">
                Recomendação de Entrada para a Próxima Rodada
              </h3>
              <p className="text-xs text-slate-400">
                Aposte <strong>pleno direto</strong> nos seguintes números ausentes há 25+ rodadas:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs uppercase rounded-xl shadow-md">
              {coverageCount > 0 ? `${coverageCount} Números Selecionados` : 'Nenhum Ausente (Aguardando)'}
            </span>
          </div>
        </div>

        {coverageCount > 0 ? (
          <div className="space-y-4">
            {/* Números em Destaque Visual */}
            <div className="flex flex-wrap items-center gap-2.5">
              {absentNumbers.map((item) => (
                <div
                  key={item.number}
                  className={`px-3.5 py-2.5 rounded-2xl flex items-center gap-2.5 border shadow-lg transition-transform hover:scale-105 ${
                    item.color === 'red'
                      ? 'bg-rose-950/80 border-rose-500/40 text-rose-100 shadow-rose-950/40'
                      : item.color === 'black'
                      ? 'bg-slate-900/90 border-slate-700 text-slate-100'
                      : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-100 shadow-emerald-950/40'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm text-white shadow-inner ${
                    item.color === 'red' ? 'bg-red-600' : item.color === 'black' ? 'bg-slate-800 border border-slate-600' : 'bg-emerald-600'
                  }`}>
                    {item.number}
                  </span>
                  <div className="space-y-0.5 text-left">
                    <div className="text-[10px] font-bold text-amber-300 uppercase leading-none">
                      {item.spinsSinceLastSeen} giros sem sair
                    </div>
                    <div className="text-[11px] font-black text-slate-200">
                      {config.currency} {stakePerNumber.toFixed(2)} em pleno
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo da Operação */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-slate-300">
                💰 Custo Total: <strong className="text-amber-400">{config.currency} {totalCost.toFixed(2)}</strong> | 🎯 Se acertar qualquer um: <strong className="text-emerald-400">+{config.currency} {netWinPerHit.toFixed(2)} de Lucro Líquido</strong>
              </div>
              <div className="text-slate-400 text-[11px]">
                Probabilidade Matemática por Giro: <strong>{coveragePct.toFixed(1)}%</strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 text-sm bg-slate-950/50 rounded-2xl border border-slate-800">
            Todos os 37 números saíram recentemente dentro da janela de {lookbackThreshold} rodadas. Aguarde o ciclo amadurecer.
          </div>
        )}
      </div>

      {/* Grade Geral de Todos os 37 Números com Status de Ausência */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <span>Mapa Geral de Atraso dos 37 Números (0 ao 36)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Veja a contagem de giros desde a última aparição de cada casa da roleta.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterView('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filterView === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Todos (37)
            </button>
            <button
              onClick={() => setFilterView('absent')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filterView === 'absent'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-cyan-400 hover:text-cyan-300 border border-slate-800'
              }`}
            >
              Só Ausentes ({absentNumbers.length})
            </button>
            <button
              onClick={() => setFilterView('recent')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filterView === 'recent'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-emerald-400 hover:text-emerald-300 border border-slate-800'
              }`}
            >
              Saíram Recente ({37 - absentNumbers.length})
            </button>
          </div>
        </div>

        {/* Grade de Números */}
        <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-9 lg:grid-cols-12 gap-2.5">
          {numbersAnalysis
            .filter((n) => {
              if (filterView === 'absent') return n.isAbsent;
              if (filterView === 'recent') return !n.isAbsent;
              return true;
            })
            .map((item) => (
              <div
                key={item.number}
                className={`p-2.5 rounded-2xl border text-center transition-all ${
                  item.isAbsent
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-400/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 opacity-80'
                }`}
              >
                <div className="flex items-center justify-center mb-1.5">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs text-white shadow-md ${
                    item.color === 'red' ? 'bg-red-600' : item.color === 'black' ? 'bg-slate-800 border border-slate-700' : 'bg-emerald-600'
                  }`}>
                    {item.number}
                  </span>
                </div>
                <div className="text-[10px] font-bold">
                  {item.isAbsent ? (
                    <span className="text-cyan-300 font-extrabold flex items-center justify-center gap-0.5">
                      <Snowflake className="w-2.5 h-2.5" /> {item.spinsSinceLastSeen}g
                    </span>
                  ) : (
                    <span className="text-slate-500">{item.spinsSinceLastSeen}g atrás</span>
                  )}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  {item.totalHits}x sorteado
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Histórico Recente de Entradas do Ciclo de Ausentes */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Histórico de Entradas e Resultados do Ciclo de Ausentes</span>
            </h3>
            <p className="text-xs text-slate-400">
              Acompanhe as rodadas onde ocorreram acertos nos números ausentes e fechamento de ciclo.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {backtest.entriesLog.length} rodadas avaliadas
          </span>
        </div>

        {backtest.entriesLog.length > 0 ? (
          <div className="overflow-x-auto max-h-80 custom-scrollbar border border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="p-3">Giro</th>
                  <th className="p-3">Sorteado</th>
                  <th className="p-3">Resultado</th>
                  <th className="p-3">Custo</th>
                  <th className="p-3">Lucro Líquido</th>
                  <th className="p-3">Ausentes Cobertos na Rodada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {backtest.entriesLog.slice(0, 30).map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-300">#{log.giro}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-lg font-black text-xs text-white ${
                        getNumberColor(log.drawnNumber) === 'red'
                          ? 'bg-red-600'
                          : getNumberColor(log.drawnNumber) === 'black'
                          ? 'bg-slate-800 border border-slate-700'
                          : 'bg-emerald-600'
                      }`}>
                        {log.drawnNumber}
                      </span>
                    </td>
                    <td className="p-3">
                      {log.isWin ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[11px] font-black flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> GREEN (Acerto Pleno)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-300 border border-rose-500/30 text-[11px] font-black flex items-center gap-1 w-max">
                          <XCircle className="w-3.5 h-3.5 text-rose-400" /> RED (Aguardando)
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400">
                      {config.currency} {log.cost.toFixed(2)}
                    </td>
                    <td className={`p-3 font-bold ${log.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {log.profit >= 0 ? '+' : ''}{config.currency} {log.profit.toFixed(2)}
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {log.absentList.join(', ')} ({log.absentList.length} números)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-slate-400 text-sm bg-slate-950/40 rounded-2xl">
            Nenhuma entrada realizada ainda. Adicione mais giros para iniciar o histórico.
          </div>
        )}
      </div>

      {/* Guia Explicativo da Estratégia */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 text-xs text-slate-300 leading-relaxed">
        <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>Fundamento Matemático da Estratégia de Ausentes</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <strong className="text-amber-400 block font-bold">1. A Lei do Terço da Roleta</strong>
            <p className="text-[11px] text-slate-400">
              Estatisticamente, em 37 giros, cerca de 24 números diferentes saem e cerca de 13 números não saem. Ao mapear ausentes de 25+ giros, pegamos a reta final de fechamento.
            </p>
          </div>
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <strong className="text-emerald-400 block font-bold">2. Alavancagem de 36x</strong>
            <p className="text-[11px] text-slate-400">
              Apostando em pleno, cada acerto paga 36 vezes o valor da ficha, permitindo cobrir confortavelmente de 8 a 15 números ausentes com lucro líquido substancial.
            </p>
          </div>
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 space-y-1">
            <strong className="text-indigo-400 block font-bold">3. Gestão e Stop Win</strong>
            <p className="text-[11px] text-slate-400">
              Recomenda-se buscar de 2 a 4 Greens de tiro limpo na sessão e proteger o lucro acumulado, evitando insistir quando a mesa entrar em padrão repetitivo de poucos números.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
