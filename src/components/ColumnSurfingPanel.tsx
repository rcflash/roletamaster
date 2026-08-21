import React, { useState, useMemo } from 'react';
import {
  Waves,
  TrendingUp,
  Flame,
  ShieldCheck,
  Zap,
  PlayCircle,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  BarChart3,
  Dices,
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight,
  Target,
  FileText,
  Volume2
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { SpinRecord, BankrollConfig, StrategyConfig } from '../types';
import { getNumberColor, getNumberColumn } from '../lib/roulette';
import {
  COLUMN_NUMBERS,
  COLUMN_LABELS,
  VIDEO_MOMENTS,
  VIDEO_SPINS_SEQUENCE,
  calculateColumnStats,
  calculateColumnSurfingAlert,
  runColumnSurfingBacktest,
  VideoMoment
} from '../lib/columnSurfingStrategy';

interface ColumnSurfingPanelProps {
  spins: SpinRecord[];
  config: BankrollConfig;
  strategy?: StrategyConfig;
  onUpdateStrategy?: (updated: Partial<StrategyConfig>) => void;
  onLoadVideoSpins?: (videoSpins: { num: number; note: string }[]) => void;
}

export const ColumnSurfingPanel: React.FC<ColumnSurfingPanelProps> = ({
  spins,
  config,
  strategy,
  onUpdateStrategy,
  onLoadVideoSpins
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'radar' | 'yield_calc' | 'video_sync' | 'board' | 'backtest' | 'guide'>('radar');
  const [selectedVideoMoment, setSelectedVideoMoment] = useState<number>(1); // Index 1: Análise das 2 últimas linhas
  const [normalBetPerCol, setNormalBetPerCol] = useState<number>(15.00); // R$ 15,00 por coluna (Total R$ 30,00)
  const [quireraBetPerCol, setQuireraBetPerCol] = useState<number>(5.00); // R$ 5,00 por coluna (Total R$ 10,00)
  const [useQuireraAfterWins, setUseQuireraAfterWins] = useState<number>(3);
  const [coverZero, setCoverZero] = useState<boolean>(true);
  const [zeroBetAmount, setZeroBetAmount] = useState<number>(2.50);
  const [manualDominantCols, setManualDominantCols] = useState<['col1' | 'col2' | 'col3', 'col1' | 'col2' | 'col3'] | null>(null);

  // Análise das 2 Últimas Linhas da Mesa (24 giros = 2x12 números)
  const stats24 = useMemo(() => calculateColumnStats(spins, 24), [spins]);
  const stats50 = useMemo(() => calculateColumnStats(spins, 50), [spins]);

  // Alerta em Tempo Real baseado nos últimos 24 giros (2 últimas linhas)
  const alert = useMemo(() => {
    return calculateColumnSurfingAlert(spins, 24, 65, manualDominantCols || undefined);
  }, [spins, manualDominantCols]);

  // Backtest com aposta de R$ 30,00 (R$ 15,00 por coluna)
  const backtest = useMemo(() => {
    return runColumnSurfingBacktest(
      spins,
      config.initialBankroll || 300,
      normalBetPerCol,
      quireraBetPerCol,
      useQuireraAfterWins,
      coverZero,
      coverZero ? zeroBetAmount : 0
    );
  }, [spins, config.initialBankroll, normalBetPerCol, quireraBetPerCol, useQuireraAfterWins, coverZero, zeroBetAmount]);

  // Separação das 2 Últimas Linhas da Mesa (exatamente 24 números em 2 blocos de 12)
  const recent24Spins = useMemo(() => spins.slice(-24).reverse(), [spins]);
  const linha1Spins = useMemo(() => recent24Spins.slice(0, 12), [recent24Spins]); // Mais recentes (1 a 12)
  const linha2Spins = useMemo(() => recent24Spins.slice(12, 24), [recent24Spins]); // Anteriores (13 a 24)

  // Cálculos Financeiros de Rendimento (Base: R$ 30,00 = 2x R$ 15,00)
  const totalNormalBet = normalBetPerCol * 2 + (coverZero ? zeroBetAmount : 0);
  const grossReturnGreen = normalBetPerCol * 3; // 3:1 na coluna vencedora
  const netProfitGreen = grossReturnGreen - totalNormalBet;
  const yieldPctGreen = totalNormalBet > 0 ? (netProfitGreen / totalNormalBet) * 100 : 50;

  // Rendimento na Quirera
  const totalQuireraBet = quireraBetPerCol * 2 + (coverZero ? Math.max(0.50, zeroBetAmount / 2) : 0);
  const grossReturnQuirera = quireraBetPerCol * 3;
  const netProfitQuirera = grossReturnQuirera - totalQuireraBet;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-xl p-4 sm:p-5 shadow-lg shadow-indigo-950/40 relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-md ring-2 ring-indigo-400/40 shrink-0">
              <Waves className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-tight">
                  SURFE DE COLUNAS DOMINANTES
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[10px] font-black uppercase tracking-wider">
                  Método Bastião (JJ)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase tracking-wider">
                  2 Linhas = 24 Números (64.8%)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider">
                  Aposta R$ 30 (2x R$ 15)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Surfe na tendência das 2 colunas dominantes nas <strong>2 últimas linhas da mesa (últimos 24 números)</strong> + Gestão de Lucro & Rendimento.
              </p>
            </div>
          </div>

          {onLoadVideoSpins && (
            <button
              onClick={() => onLoadVideoSpins(VIDEO_SPINS_SEQUENCE)}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/50 shrink-0"
              title="Carregar a sequência exata de números mostrada no vídeo para simulação instantânea"
            >
              <PlayCircle className="w-4 h-4 text-cyan-300" />
              <span>Carregar Giros do Vídeo</span>
            </button>
          )}
        </div>

        {/* Sub-Tabs sem barra de rolagem (flex-wrap com espaçamento fluido) */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-4 pt-3 border-t border-slate-800/80">
          <button
            onClick={() => setActiveSubTab('radar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeSubTab === 'radar'
                ? 'bg-indigo-500 text-slate-950 shadow-md shadow-indigo-500/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Radar & Alerta ao Vivo</span>
          </button>
          <button
            onClick={() => setActiveSubTab('yield_calc')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeSubTab === 'yield_calc'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
            <span>Cálculo de Rendimento (R$ 30)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('video_sync')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeSubTab === 'video_sync'
                ? 'bg-indigo-500 text-slate-950 shadow-md shadow-indigo-500/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-300" />
            <span>Sincronizador do Vídeo ({VIDEO_MOMENTS.length} Momentos)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('board')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeSubTab === 'board'
                ? 'bg-indigo-500 text-slate-950 shadow-md shadow-indigo-500/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            <Dices className="w-3.5 h-3.5 text-amber-300" />
            <span>Visualizador de Cobertura</span>
          </button>
          <button
            onClick={() => setActiveSubTab('backtest')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeSubTab === 'backtest'
                ? 'bg-indigo-500 text-slate-950 shadow-md shadow-indigo-500/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-300" />
            <span>Backtest & Quirera</span>
          </button>
          <button
            onClick={() => setActiveSubTab('guide')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              activeSubTab === 'guide'
                ? 'bg-indigo-500 text-slate-950 shadow-md shadow-indigo-500/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-rose-300" />
            <span>Guia Passo a Passo</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: RADAR & ALERTA AO VIVO */}
      {activeSubTab === 'radar' && (
        <div className="space-y-4">
          {/* Card Principal de Status do Alerta */}
          <div
            className={`rounded-xl border p-4 sm:p-5 shadow-lg transition-all ${
              alert.hasAlert
                ? alert.alertType === 'BREAKOUT_TRIGGER'
                  ? 'bg-gradient-to-br from-amber-950/70 via-slate-900 to-indigo-950/70 border-amber-500/50 ring-2 ring-amber-500/30'
                  : 'bg-gradient-to-br from-cyan-950/70 via-slate-900 to-indigo-950/70 border-cyan-500/50 ring-2 ring-cyan-500/30'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {alert.hasAlert ? (
                    <span className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md animate-pulse">
                      <Flame className="w-4 h-4" />
                      {alert.alertType === 'BREAKOUT_TRIGGER' ? 'GATILHO DE QUEBRA CONFIRMADO' : 'ONDA DE SURFE ATIVA'}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-slate-700">
                      <Clock className="w-4 h-4" />
                      {alert.alertType === 'COOLING_OFF' ? 'COLUNA FRACA NA VEZ (AGUARDAR)' : 'ANALISANDO COLUNAS'}
                    </span>
                  )}

                  {alert.isQuireraMode && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Modo Quirera Ativado ({alert.currentSurfStreak}x Greens Seguidos)
                    </span>
                  )}
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-100">
                  {alert.reason}
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
                  <span>Colunas para Entrada:</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-cyan-300 border border-cyan-400/40 font-black">
                    {COLUMN_LABELS[alert.dominantCols[0]]}
                  </span>
                  <span>+</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-cyan-300 border border-cyan-400/40 font-black">
                    {COLUMN_LABELS[alert.dominantCols[1]]}
                  </span>
                  <span className="text-slate-500">|</span>
                  <span>Coluna Fraca (Evitada):</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/40 font-bold">
                    {COLUMN_LABELS[alert.weakCol]}
                  </span>
                </div>
              </div>

              {/* Termômetro de Confiança */}
              <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 text-center min-w-[140px] shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Dominância Recente
                </span>
                <span className="text-2xl font-black text-cyan-400 font-mono block mt-0.5">
                  {alert.confidencePct}%
                </span>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className={`h-full transition-all duration-500 ${
                      alert.confidencePct >= 70 ? 'bg-emerald-400' : alert.confidencePct >= 50 ? 'bg-cyan-400' : 'bg-amber-400'
                    }`}
                    style={{ width: `${Math.min(100, alert.confidencePct)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Destaque para Terminais e Números Quentes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-slate-800/80">
              <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-300 font-medium">Terminais Quentes Recomendados:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {alert.recommendedTerminals.map((term) => (
                    <span
                      key={term}
                      className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black font-mono"
                    >
                      Term. {term}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-300 font-medium">Números Repetidores da Mesa:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {alert.hotRepeatNumbers.length > 0 ? (
                    alert.hotRepeatNumbers.map((num) => (
                      <span
                        key={num}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white ${
                          getNumberColor(num) === 'red' ? 'bg-rose-600' : 'bg-slate-950 border border-slate-600'
                        }`}
                      >
                        {num}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">Nenhum no momento</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CARD DE RENDIMENTO FINANCEIRO DA ENTRADA (R$ 30,00 - R$ 15 EM CADA COLUNA) */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-xl p-4 sm:p-4.5 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-tight flex items-center gap-2">
                    Cálculo de Rendimento da Aposta
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black">
                      R$ {(normalBetPerCol * 2).toFixed(2)} / Giro
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Aposta calculada em <strong>2 colunas</strong> (R$ {normalBetPerCol.toFixed(2)} cada) com cobertura de 24 números (64.8% da roleta).
                  </p>
                </div>
              </div>

              {/* Botões Rápidos de Aposta */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Aposta Total:</span>
                {[
                  { total: 10, perCol: 5 },
                  { total: 20, perCol: 10 },
                  { total: 30, perCol: 15 },
                  { total: 50, perCol: 25 },
                  { total: 100, perCol: 50 }
                ].map((item) => (
                  <button
                    key={item.total}
                    onClick={() => setNormalBetPerCol(item.perCol)}
                    className={`px-2 py-1 rounded text-[10px] font-black font-mono transition-all ${
                      normalBetPerCol === item.perCol
                        ? 'bg-emerald-500 text-slate-950 shadow-sm ring-1 ring-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    R$ {item.total} {item.total === 30 ? '(Padrão)' : ''}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-950/70 rounded-lg p-2.5 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Aposta por Coluna</span>
                <span className="text-base sm:text-lg font-black font-mono text-cyan-300 mt-0.5 block">
                  R$ {normalBetPerCol.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">Em cada uma das 2</span>
              </div>

              <div className="bg-slate-950/70 rounded-lg p-2.5 border border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Retorno Bruto (3:1)</span>
                <span className="text-base sm:text-lg font-black font-mono text-slate-100 mt-0.5 block">
                  R$ {grossReturnGreen.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">3x a coluna premiada</span>
              </div>

              <div className="bg-slate-950/70 rounded-lg p-2.5 border border-emerald-500/30 text-center bg-emerald-950/20">
                <span className="text-[10px] font-bold text-emerald-300 uppercase block">Lucro Líquido / Green</span>
                <span className="text-base sm:text-lg font-black font-mono text-emerald-400 mt-0.5 block">
                  +R$ {netProfitGreen.toFixed(2)}
                </span>
                <span className="text-[9px] text-emerald-300/80 font-bold font-mono">
                  +{yieldPctGreen.toFixed(1)}% Rendimento
                </span>
              </div>

              <div className="bg-slate-950/70 rounded-lg p-2.5 border border-rose-900/40 text-center">
                <span className="text-[10px] font-bold text-rose-400 uppercase block">Perda no Red</span>
                <span className="text-base sm:text-lg font-black font-mono text-rose-400 mt-0.5 block">
                  -R$ {totalNormalBet.toFixed(2)}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">1 Red = 2 Greens</span>
              </div>
            </div>
          </div>

          {/* PAINEL DAS 2 ÚLTIMAS LINHAS DA MESA (24 NÚMEROS = 2x12 NÚMEROS) */}
          <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  As 2 Últimas Linhas da Mesa (24 Giros Recentes)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  O algoritmo analisa exatamente as <strong>2 últimas linhas de 12 pedras</strong> da tela do cassino ({Math.min(24, spins.length)} giros carregados).
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                  1ª Col: {stats24.col1Count} ({stats24.col1Pct.toFixed(0)}%)
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                  2ª Col: {stats24.col2Count} ({stats24.col2Pct.toFixed(0)}%)
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                  3ª Col: {stats24.col3Count} ({stats24.col3Pct.toFixed(0)}%)
                </span>
              </div>
            </div>

            {/* LINHA 1: Os 12 giros mais recentes (Linha superior do terminal) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-cyan-400 flex items-center gap-1">
                  <span>▲ Linha 1 (Mais Recente — 12 últimos giros)</span>
                </span>
                <span className="text-[10px] text-slate-400">Esquerda = Mais recente</span>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                {Array.from({ length: 12 }).map((_, idx) => {
                  const spin = linha1Spins[idx];
                  if (!spin) {
                    return (
                      <div key={idx} className="h-14 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-center justify-center text-[10px] text-slate-600 font-mono">
                        --
                      </div>
                    );
                  }
                  const col = getNumberColumn(spin.numero);
                  const isDominant = alert.dominantCols.includes(col as any);
                  const isWeak = col === alert.weakCol;
                  const isZero = spin.numero === 0;

                  return (
                    <div
                      key={spin.id || idx}
                      className={`p-1.5 rounded-lg border flex flex-col items-center justify-between transition-all ${
                        isDominant
                          ? 'bg-indigo-950/50 border-indigo-500/60 shadow-sm ring-1 ring-indigo-500/30'
                          : isWeak
                          ? 'bg-rose-950/40 border-rose-500/50'
                          : 'bg-emerald-950/40 border-emerald-500/50'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-sm ${
                          isZero
                            ? 'bg-emerald-600'
                            : getNumberColor(spin.numero) === 'red'
                            ? 'bg-rose-600'
                            : 'bg-slate-950 border border-slate-700'
                        }`}
                      >
                        {spin.numero}
                      </span>
                      <span
                        className={`text-[8px] font-black uppercase mt-1 leading-none ${
                          isDominant
                            ? 'text-cyan-300'
                            : isWeak
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {col === 'col1' ? '1ª Col' : col === 'col2' ? '2ª Col' : col === 'col3' ? '3ª Col' : 'Zero'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LINHA 2: Os 12 giros anteriores (Linha inferior do terminal) */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-indigo-300 flex items-center gap-1">
                  <span>▼ Linha 2 (Anterior — Giros 13 a 24)</span>
                </span>
                <span className="text-[10px] text-slate-400">Totalizando as 2 linhas</span>
              </div>

              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                {Array.from({ length: 12 }).map((_, idx) => {
                  const spin = linha2Spins[idx];
                  if (!spin) {
                    return (
                      <div key={idx} className="h-14 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-center justify-center text-[10px] text-slate-600 font-mono">
                        --
                      </div>
                    );
                  }
                  const col = getNumberColumn(spin.numero);
                  const isDominant = alert.dominantCols.includes(col as any);
                  const isWeak = col === alert.weakCol;
                  const isZero = spin.numero === 0;

                  return (
                    <div
                      key={spin.id || idx}
                      className={`p-1.5 rounded-lg border flex flex-col items-center justify-between transition-all opacity-85 ${
                        isDominant
                          ? 'bg-indigo-950/30 border-indigo-500/40'
                          : isWeak
                          ? 'bg-rose-950/30 border-rose-500/40'
                          : 'bg-emerald-950/30 border-emerald-500/40'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-sm ${
                          isZero
                            ? 'bg-emerald-600'
                            : getNumberColor(spin.numero) === 'red'
                            ? 'bg-rose-600'
                            : 'bg-slate-950 border border-slate-700'
                        }`}
                      >
                        {spin.numero}
                      </span>
                      <span
                        className={`text-[8px] font-black uppercase mt-1 leading-none ${
                          isDominant
                            ? 'text-cyan-400'
                            : isWeak
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {col === 'col1' ? '1ª Col' : col === 'col2' ? '2ª Col' : col === 'col3' ? '3ª Col' : 'Zero'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Comparativo das 3 Colunas (As 2 Últimas Linhas da Mesa) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['col1', 'col2', 'col3'] as const).map((colKey) => {
              const count = stats24[`${colKey}Count` as keyof typeof stats24] as number;
              const pct = stats24[`${colKey}Pct` as keyof typeof stats24] as number;
              const isWeak = alert.weakCol === colKey;
              const isDominant = alert.dominantCols.includes(colKey);

              return (
                <div
                  key={colKey}
                  className={`rounded-xl border p-3.5 transition-all relative overflow-hidden ${
                    isDominant
                      ? 'bg-gradient-to-b from-indigo-950/50 to-slate-900 border-indigo-500/40 ring-1 ring-indigo-500/30'
                      : isWeak
                      ? 'bg-slate-900/60 border-rose-900/40 opacity-75'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-200">
                      {COLUMN_LABELS[colKey]}
                    </span>
                    {isDominant && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black uppercase">
                        DOMINANTE
                      </span>
                    )}
                    {isWeak && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-black uppercase">
                        COLUNA FRACA
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black font-mono text-slate-100">
                      {pct.toFixed(1)}%
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {count} saídas (em 24g)
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full ${
                        isDominant ? 'bg-gradient-to-r from-indigo-500 to-cyan-400' : 'bg-slate-700'
                      }`}
                      style={{ width: `${Math.min(100, pct * 2)}%` }}
                    />
                  </div>

                  {/* Números que compõem a coluna */}
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                    {COLUMN_NUMBERS[colKey].map((n) => {
                      const isHot = alert.hotRepeatNumbers.includes(n);
                      const isTerm = alert.recommendedTerminals.includes(n % 10);
                      return (
                        <span
                          key={n}
                          className={`w-5 h-5 rounded text-[10px] font-black flex items-center justify-center ${
                            isHot
                              ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300'
                              : isTerm
                              ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/40'
                              : getNumberColor(n) === 'red'
                              ? 'bg-rose-950/60 text-rose-400 border border-rose-900/40'
                              : 'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}
                          title={`Número ${n} (${isHot ? 'Quente Repetidor' : isTerm ? 'Terminal Quente' : ''})`}
                        >
                          {n}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB: CÁLCULO DE RENDIMENTO & METAS FINANCEIRAS */}
      {activeSubTab === 'yield_calc' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Calculadora de Rendimento & Projeção de Metas (R$ 30,00)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Entendendo a matemática dos lucros: apostando R$ 15,00 em cada uma das 2 colunas dominantes (Total R$ 30,00 por entrada).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-black">
                  +50.0% Lucro Líquido / Green
                </span>
              </div>
            </div>

            {/* Comparativo de Estrutura de Apostas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Entrada Padrão */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-indigo-500/40 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-black uppercase text-cyan-300">
                    1. Entrada Padrão (Surfe Normal)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-cyan-300 text-[10px] font-black">
                    24 Números
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Aposta na Coluna Dominante A:</span>
                    <strong className="font-mono text-slate-100">R$ {normalBetPerCol.toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Aposta na Coluna Dominante B:</span>
                    <strong className="font-mono text-slate-100">R$ {normalBetPerCol.toFixed(2)}</strong>
                  </div>
                  {coverZero && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Proteção no Zero (Opcional):</span>
                      <strong className="font-mono text-slate-100">R$ {zeroBetAmount.toFixed(2)}</strong>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-slate-200">
                    <span>Custo Total do Giro:</span>
                    <strong className="font-mono text-amber-300 text-sm">R$ {totalNormalBet.toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>Retorno no Green (3:1):</span>
                    <strong className="font-mono text-emerald-300 text-sm">R$ {grossReturnGreen.toFixed(2)} (+R$ {netProfitGreen.toFixed(2)} líquido)</strong>
                  </div>
                </div>
              </div>

              {/* Entrada com Quirera */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-black uppercase text-amber-300">
                    2. Entrada com Modo Quirera (Após {useQuireraAfterWins} Greens)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black">
                    Blindagem de Lucro
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Aposta Quirera Coluna A:</span>
                    <strong className="font-mono text-slate-100">R$ {quireraBetPerCol.toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Aposta Quirera Coluna B:</span>
                    <strong className="font-mono text-slate-100">R$ {quireraBetPerCol.toFixed(2)}</strong>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold text-slate-200">
                    <span>Custo Total com Quirera:</span>
                    <strong className="font-mono text-amber-300 text-sm">R$ {totalQuireraBet.toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>Retorno no Green com Quirera:</span>
                    <strong className="font-mono text-emerald-300 text-sm">R$ {grossReturnQuirera.toFixed(2)} (+R$ {netProfitQuirera.toFixed(2)} líquido)</strong>
                  </div>
                  <p className="text-[11px] text-amber-300/80 italic mt-1">
                    * Se o Red vier na quebra da onda, você perde apenas R$ {totalQuireraBet.toFixed(2)} em vez de R$ {totalNormalBet.toFixed(2)}, segurando todo o lucro anterior no bolso!
                  </p>
                </div>
              </div>
            </div>

            {/* Tabela de Projeção de Metas Financeiras */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-black uppercase text-slate-200 block">
                Tabela de Projeção de Metas de Lucro com R$ {(normalBetPerCol * 2).toFixed(2)} / Giro:
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { greens: 1, label: '1º Green', profit: netProfitGreen * 1 },
                  { greens: 2, label: '2 Greens (Meta Curta)', profit: netProfitGreen * 2 },
                  { greens: 3, label: '3 Greens (Início Quirera)', profit: netProfitGreen * 3 },
                  { greens: 5, label: '5 Greens (Excelente)', profit: netProfitGreen * 5 },
                  { greens: 8, label: '8 Greens (Meta Diária)', profit: netProfitGreen * 8 },
                  { greens: 10, label: '10 Greens (Dobrou Banca)', profit: netProfitGreen * 10 }
                ].map((tier) => (
                  <div key={tier.greens} className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 text-center">
                    <span className="text-[10px] font-bold text-slate-400 block">{tier.label}</span>
                    <span className="text-base font-black font-mono text-emerald-400 mt-1 block">
                      +R$ {tier.profit.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      +{(tier.greens * yieldPctGreen).toFixed(0)}% s/ aposta
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SINCRONIZADOR COM O MOMENTO DO VÍDEO */}
      {activeSubTab === 'video_sync' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-cyan-400" />
                  Linha do Tempo Sincronizada com o Vídeo
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Clique em qualquer momento abaixo para visualizar o raciocínio exato de cada jogada, aposta realizada e fala do Bastião.
                </p>
              </div>

              {onLoadVideoSpins && (
                <button
                  onClick={() => onLoadVideoSpins(VIDEO_SPINS_SEQUENCE)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reiniciar Giros do Vídeo</span>
                </button>
              )}
            </div>

            {/* Timeline Horizontal de Timestamps */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {VIDEO_MOMENTS.map((moment, idx) => {
                const isSelected = selectedVideoMoment === idx;
                const isGreen = moment.outcomeType === 'GREEN';
                const isRed = moment.outcomeType === 'RED';
                const isQuirera = moment.outcomeType === 'QUIRERA';
                const isTrigger = moment.outcomeType === 'TRIGGER';

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedVideoMoment(idx)}
                    className={`px-3 py-2 rounded-xl border text-left min-w-[170px] shrink-0 transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 ring-2 ring-indigo-300'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-black font-mono text-cyan-300">
                        {moment.timestamp}
                      </span>
                      {isGreen && <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950">GREEN</span>}
                      {isRed && <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-500 text-white">RED</span>}
                      {isQuirera && <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">QUIRERA</span>}
                      {isTrigger && <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-cyan-400 text-slate-950">GATILHO</span>}
                    </div>
                    <span className="text-xs font-black block truncate">
                      {moment.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Detalhe do Momento Selecionado */}
            {VIDEO_MOMENTS[selectedVideoMoment] && (
              <div className="bg-slate-950/80 rounded-xl border border-slate-800/80 p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-black font-mono">
                      ⏱ {VIDEO_MOMENTS[selectedVideoMoment].timestamp}
                    </span>
                    <h4 className="text-sm sm:text-base font-black text-slate-100">
                      {VIDEO_MOMENTS[selectedVideoMoment].title}
                    </h4>
                  </div>

                  <span className="text-xs text-slate-400">
                    Foco: <strong className="text-slate-200">{VIDEO_MOMENTS[selectedVideoMoment].columnFocus}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-2.5">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        O que o autor fez / Raciocínio Matemático:
                      </span>
                      <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
                        {VIDEO_MOMENTS[selectedVideoMoment].description}
                      </p>
                    </div>

                    <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 italic text-xs text-amber-200/90">
                      <div className="flex items-center gap-1.5 text-amber-400 not-italic font-black text-[10px] uppercase mb-1">
                        <Volume2 className="w-3.5 h-3.5" />
                        Fala Transcrita do Bastião:
                      </div>
                      "{VIDEO_MOMENTS[selectedVideoMoment].quote}"
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Ação / Entrada Executada:
                      </span>
                      <span className="text-xs font-black text-emerald-400 block mt-1">
                        {VIDEO_MOMENTS[selectedVideoMoment].actionTaken}
                      </span>
                    </div>

                    {VIDEO_MOMENTS[selectedVideoMoment].spinsMentioned.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Números Citados no Giro:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {VIDEO_MOMENTS[selectedVideoMoment].spinsMentioned.map((n) => (
                            <span
                              key={n}
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white shadow-sm ${
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
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: VISUALIZADOR DE COBERTURA DA MESA */}
      {activeSubTab === 'board' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-100 flex items-center gap-2">
                <Dices className="w-4 h-4 text-cyan-400" />
                Visualizador de Tabuleiro & Distribuição das 3 Colunas
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Iluminação das 2 colunas cobertas simultaneamente (24 números = 64.8% da mesa) + Proteção Zero.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-cyan-300 font-bold">
                <span className="w-3 h-3 rounded bg-indigo-600 border border-cyan-400"></span> Coberto
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-3 h-3 rounded bg-slate-950 border border-slate-700"></span> Aberto (Coluna Fraca)
              </span>
            </div>
          </div>

          {/* Tabuleiro da Roleta Formatado por Colunas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['col1', 'col2', 'col3'] as const).map((colKey) => {
              const isDominant = alert.dominantCols.includes(colKey);
              const isWeak = colKey === alert.weakCol;

              return (
                <div
                  key={colKey}
                  className={`rounded-xl border p-3.5 ${
                    isDominant
                      ? 'bg-indigo-950/30 border-cyan-500/50 ring-1 ring-cyan-500/30'
                      : 'bg-slate-950/60 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                    <span className="text-xs font-black text-slate-200">
                      {COLUMN_LABELS[colKey]}
                    </span>
                    {isDominant ? (
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase">
                        Aposta Ativa (12 Nºs)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase">
                        Coluna Evitada
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {COLUMN_NUMBERS[colKey].map((num) => {
                      const color = getNumberColor(num);
                      const isHot = alert.hotRepeatNumbers.includes(num);
                      const isTerminal = alert.recommendedTerminals.includes(num % 10);

                      return (
                        <div
                          key={num}
                          className={`rounded-lg p-2 flex flex-col items-center justify-center border text-center transition-all ${
                            isDominant
                              ? isHot
                                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm ring-1 ring-amber-400/50'
                                : isTerminal
                                ? 'bg-indigo-600/40 border-cyan-400 text-cyan-200'
                                : color === 'red'
                                ? 'bg-rose-950/50 border-rose-700/50 text-rose-300'
                                : 'bg-slate-900 border-slate-700 text-slate-300'
                              : 'bg-slate-950 border-slate-800 text-slate-600'
                          }`}
                        >
                          <span className="text-sm font-black font-mono">{num}</span>
                          <span className="text-[8px] uppercase tracking-tighter text-slate-400">
                            {isHot ? '🔥 Quente' : isTerminal ? `T.${num % 10}` : color === 'red' ? 'Vermelho' : 'Preto'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: BACKTEST & LUCRO COM QUIRERA */}
      {activeSubTab === 'backtest' && (
        <div className="space-y-4">
          {/* Controles de Simulação */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Parâmetros do Backtest com Gestão de Quirera
              </span>
              <span className="text-[11px] text-slate-400">
                Baseado em <strong>{spins.length} giros</strong> carregados na mesa
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Aposta Padrão por Coluna (R$)
                </label>
                <input
                  type="number"
                  step="0.50"
                  value={normalBetPerCol}
                  onChange={(e) => setNormalBetPerCol(Math.max(0.50, parseFloat(e.target.value) || 0.50))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Aposta Quirera por Coluna (R$)
                </label>
                <input
                  type="number"
                  step="0.50"
                  value={quireraBetPerCol}
                  onChange={(e) => setQuireraBetPerCol(Math.max(0.20, parseFloat(e.target.value) || 0.20))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Ativar Quirera Após:
                </label>
                <select
                  value={useQuireraAfterWins}
                  onChange={(e) => setUseQuireraAfterWins(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-bold"
                >
                  <option value={2}>2 Greens Seguidos</option>
                  <option value={3}>3 Greens Seguidos</option>
                  <option value={4}>4 Greens Seguidos</option>
                  <option value={5}>5 Greens Seguidos</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Proteção no Zero (0):
                </label>
                <button
                  onClick={() => setCoverZero(!coverZero)}
                  className={`w-full py-1.5 rounded-lg text-xs font-black transition-all border ${
                    coverZero
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                      : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  {coverZero ? '✓ Zero Coberto' : '✗ Sem Zero'}
                </button>
              </div>
            </div>
          </div>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Lucro Líquido</span>
              <span className={`text-xl font-black font-mono block mt-0.5 ${backtest.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {backtest.netProfit >= 0 ? '+' : ''}R$ {backtest.netProfit.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">ROI: {backtest.roiPct}%</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Assertividade</span>
              <span className="text-xl font-black font-mono text-cyan-400 block mt-0.5">
                {backtest.winRatePct}%
              </span>
              <span className="text-[10px] text-slate-500">{backtest.wins} Greens / {backtest.losses} Reds</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Maior Seq. Greens</span>
              <span className="text-xl font-black font-mono text-emerald-400 block mt-0.5">
                {backtest.maxGreenStreak}x
              </span>
              <span className="text-[10px] text-slate-500">Vitórias Consecutivas</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Saldo Final</span>
              <span className="text-xl font-black font-mono text-slate-100 block mt-0.5">
                R$ {backtest.finalBankroll.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500">Pico: R$ {backtest.highestBalance}</span>
            </div>
          </div>

          {/* Gráfico de Evolução de Saldo */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
            <span className="text-xs font-black uppercase text-slate-300 block">
              Curva de Evolução da Banca no Surfe de Colunas
            </span>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={backtest.timelineData}>
                  <defs>
                    <linearGradient id="colorBal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="giro" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="balance" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorBal)" name="Saldo (R$)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: GUIA PASSO A PASSO & REGRAS DE OURO */}
      {activeSubTab === 'guide' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              As 4 Etapas do Método de Surfe de Colunas (Bastião)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Manual resumido com a filosofia do operador para lucrar com consistência e sem ganância.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-black text-xs flex items-center justify-center border border-cyan-400/40">
                  1
                </span>
                <h4 className="text-xs font-black text-slate-200 uppercase">
                  Análise das 2 Últimas Linhas da Mesa
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Não se perca em gráficos de 500 giros. Olhe os <strong>últimos 10 a 20 giros</strong> (as 2 últimas linhas do histórico). Procure por uma coluna que está sumida/fraca e que quando sai, não repete (como a 2ª Coluna no vídeo).
              </p>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-black text-xs flex items-center justify-center border border-cyan-400/40">
                  2
                </span>
                <h4 className="text-xs font-black text-slate-200 uppercase">
                  Gatilho da Quebra & Confirmação
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Quando a coluna fraca sai (ex: número 35) e no giro seguinte quebra para uma das dominantes (ex: número 31), o gatilho está armado. É a confirmação perfeita para entrar surfando nas <strong>duas colunas dominantes</strong> juntas.
              </p>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center border border-amber-400/40">
                  3
                </span>
                <h4 className="text-xs font-black text-slate-200 uppercase">
                  Reforço com Terminais Quentes (1 e 3)
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Além das colunas, observe os <strong>terminais que mais estão pontuando</strong> naquelas colunas (ex: terminais 1 e 3: 1, 21, 31, 3, 13, 23, 33). Eles ampliam o retorno quando o número exato é sorteado.
              </p>
            </div>

            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center justify-center border border-emerald-400/40">
                  4
                </span>
                <h4 className="text-xs font-black text-slate-200 uppercase">
                  A Regra da Quirera (Blindagem do Lucro)
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Após 3 a 5 vitórias seguidas no surfe, a probabilidade de quebra aumenta. <strong>Reduza para a Quirera</strong> (fichas mínimas). Se o Red vier na quebra da onda, seu lucro anterior estará 100% preservado no bolso!
              </p>
            </div>
          </div>

          <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 uppercase block font-black">Aviso de Gestão & Responsabilidade:</strong>
              "O Ministério da Fazenda adverte: aposta não é investimento. Jogue respeitando seus limites, aceite o Stop Loss e nunca coloque dinheiro de compromisso." — <em>Bastião</em>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
