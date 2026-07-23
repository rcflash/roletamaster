import React, { useState, useEffect } from 'react';
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  X,
  Check,
  ArrowUp,
  ArrowDown,
  GripVertical,
  ArrowDownToLine,
  ArrowUpToLine,
  LayoutList,
  SlidersHorizontal,
} from 'lucide-react';
import {
  BankrollConfig,
  StrategyConfig,
  SpinRecord,
} from './types';

export type DashboardBlockId =
  | 'kpis'
  | 'alerts'
  | 'quick_input'
  | 'temperatures'
  | 'strategy'
  | 'hot_cold'
  | 'history';

const DEFAULT_BLOCK_ORDER: DashboardBlockId[] = [
  'kpis',
  'alerts',
  'quick_input',
  'temperatures',
  'strategy',
  'hot_cold',
  'history',
];

const BOTTOM_PRESET_ORDER: DashboardBlockId[] = [
  'strategy',
  'temperatures',
  'hot_cold',
  'history',
  'quick_input',
  'kpis',
  'alerts',
];

const BLOCK_TITLES: Record<DashboardBlockId, string> = {
  kpis: 'Métricas Financeiras & Banca',
  alerts: 'Metas Diárias & Alerta de Stop Loss',
  quick_input: 'Lançamento Rápido & Coleta (100 Giros)',
  temperatures: 'Termômetro de Dúzias e Colunas',
  strategy: 'Estratégia & Assistente Bot AI',
  hot_cold: 'Top 5 Números Quentes & Frios',
  history: 'Tabela Completa do Histórico de Giros',
};
import {
  INITIAL_BANKROLL_CONFIG,
  INITIAL_STRATEGY_CONFIG,
  DEMO_SPINS,
} from './lib/initialData';
import {
  getNumberColor,
  getNumberDozen,
  getNumberColumn,
  getNumberParity,
  getNumberHalf,
  calculateTemperatures,
  calculateNumberStats,
  evaluateSpinPayout,
  generateBotSuggestion,
} from './lib/roulette';
import { soundEffects } from './lib/sound';

import { Header } from './components/Header';
import { BankrollCards } from './components/BankrollCards';
import { AlertsAndGoalCard } from './components/AlertsAndGoalCard';
import { QuickSpinInput } from './components/QuickSpinInput';
import { TemperaturesPanel } from './components/TemperaturesPanel';
import { HotColdNumbersCard } from './components/HotColdNumbersCard';
import { InteractiveRouletteBoard } from './components/InteractiveRouletteBoard';
import { ActiveStrategyPanel } from './components/ActiveStrategyPanel';
import { HistoryTable } from './components/HistoryTable';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { SettingsModal } from './components/SettingsModal';
import { StrategyGuideModal } from './components/StrategyGuideModal';

export default function App() {
  // LocalStorage Persistence Keys
  const [config, setConfig] = useState<BankrollConfig>(() => {
    const saved = localStorage.getItem('roleta_master_config');
    return saved ? JSON.parse(saved) : INITIAL_BANKROLL_CONFIG;
  });

  const [strategy, setStrategy] = useState<StrategyConfig>(() => {
    const saved = localStorage.getItem('roleta_master_strategy');
    return saved ? JSON.parse(saved) : INITIAL_STRATEGY_CONFIG;
  });

  const [spins, setSpins] = useState<SpinRecord[]>(() => {
    const saved = localStorage.getItem('roleta_master_spins');
    return saved ? JSON.parse(saved) : DEMO_SPINS;
  });

  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isStrategyPdfOpen, setIsStrategyPdfOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'board'>('dashboard');
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [showResetDemoConfirm, setShowResetDemoConfirm] = useState<boolean>(false);
  const [showLayoutControls, setShowLayoutControls] = useState<boolean>(false);

  const [blockOrder, setBlockOrder] = useState<DashboardBlockId[]>(() => {
    const saved = localStorage.getItem('roleta_master_block_order');
    return saved ? JSON.parse(saved) : DEFAULT_BLOCK_ORDER;
  });

  useEffect(() => {
    localStorage.setItem('roleta_master_block_order', JSON.stringify(blockOrder));
  }, [blockOrder]);

  const handleMoveBlock = (id: DashboardBlockId, direction: 'up' | 'down') => {
    setBlockOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[newIdx];
      next[newIdx] = temp;
      return next;
    });
  };

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('roleta_master_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('roleta_master_strategy', JSON.stringify(strategy));
  }, [strategy]);

  useEffect(() => {
    localStorage.setItem('roleta_master_spins', JSON.stringify(spins));
  }, [spins]);

  // Calculations
  const totalSpins = spins.length;
  const lastSpin = spins.length > 0 ? spins[spins.length - 1] : null;

  // Active/real betting spins are those after the 100-spin warmup phase (giro > 100)
  const realBettingSpins = spins.filter((s) => s.giro > 100);
  const totalBettingSpins = realBettingSpins.length;

  const currentBalance =
    spins.length > 0 ? spins[spins.length - 1].accumulatedBalance : config.initialBankroll;

  const netProfit = currentBalance - config.initialBankroll;
  const profitMarginPct = config.initialBankroll > 0 ? (netProfit / config.initialBankroll) * 100 : 0;

  const totalWagered = realBettingSpins.reduce((acc, s) => acc + s.lossAmount, 0);
  const totalWon = realBettingSpins.reduce((acc, s) => acc + s.winAmount, 0);
  const roiPct = totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0;

  const winningSpins = realBettingSpins.filter((s) => s.netResult > 0).length;
  const winRatePct = totalBettingSpins > 0 ? (winningSpins / totalBettingSpins) * 100 : 0;

  const peakBalance = spins.reduce(
    (max, s) => Math.max(max, s.accumulatedBalance),
    config.initialBankroll
  );

  const temperatures = calculateTemperatures(spins);
  const numberStats = calculateNumberStats(spins);

  // Add Spin Handler
  const handleAddSpin = (number: number, multiplier?: number) => {
    if (config.soundEnabled) {
      soundEffects.playSpinAdd();
    }

    const nextGiro = spins.length + 1;
    const isWarmupPhase = nextGiro <= 100;

    let winAmt = 0;
    let lossAmt = 0;
    let net = 0;

    if (!isWarmupPhase) {
      const payout = evaluateSpinPayout(number, strategy);
      winAmt = multiplier ? payout.winAmount * multiplier : payout.winAmount;
      lossAmt = payout.lossAmount;
      net = winAmt - lossAmt;
    }

    const newBal = currentBalance + net;
    const botInfo = generateBotSuggestion(spins);

    const newSpin: SpinRecord = {
      id: `spin-${Date.now()}`,
      giro: nextGiro,
      numero: number,
      multiplier,
      color: getNumberColor(number),
      dozen: getNumberDozen(number),
      column: getNumberColumn(number),
      parity: getNumberParity(number),
      half: getNumberHalf(number),
      winAmount: winAmt,
      lossAmount: lossAmt,
      netResult: net,
      accumulatedBalance: newBal,
      botLevel: botInfo.level,
      nextBetSuggestion: botInfo.suggestion,
      cycleStatus: isWarmupPhase ? 'NEUTRAL' : (net >= 0 ? 'WIN' : 'LOSS'),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    if (net > 0 && config.soundEnabled) {
      soundEffects.playWinFanfare();
    }

    setSpins((prev) => [...prev, newSpin]);
  };

  // Batch Add Spins Handler
  const handleBatchAddSpins = (numbers: number[], multiplier?: number) => {
    if (numbers.length === 0) return;
    if (config.soundEnabled) {
      soundEffects.playSpinAdd();
    }

    setSpins((prev) => {
      let runningBalance = prev.length > 0 ? prev[prev.length - 1].accumulatedBalance : config.initialBankroll;
      const runningSpins = [...prev];

      numbers.forEach((num, index) => {
        const nextGiro = runningSpins.length + 1;
        const isWarmupPhase = nextGiro <= 100;

        let winAmt = 0;
        let lossAmt = 0;
        let net = 0;

        if (!isWarmupPhase) {
          const payout = evaluateSpinPayout(num, strategy);
          winAmt = multiplier ? payout.winAmount * multiplier : payout.winAmount;
          lossAmt = payout.lossAmount;
          net = winAmt - lossAmt;
        }

        runningBalance += net;
        const botInfo = generateBotSuggestion(runningSpins);

        const newSpin: SpinRecord = {
          id: `spin-${Date.now()}-${index}`,
          giro: nextGiro,
          numero: num,
          multiplier,
          color: getNumberColor(num),
          dozen: getNumberDozen(num),
          column: getNumberColumn(num),
          parity: getNumberParity(num),
          half: getNumberHalf(num),
          winAmount: winAmt,
          lossAmount: lossAmt,
          netResult: net,
          accumulatedBalance: runningBalance,
          botLevel: botInfo.level,
          nextBetSuggestion: botInfo.suggestion,
          cycleStatus: isWarmupPhase ? 'NEUTRAL' : (net >= 0 ? 'WIN' : 'LOSS'),
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        };

        runningSpins.push(newSpin);
      });

      return runningSpins;
    });
  };

  // Clear All Spins Handler
  const handleClearAllSpins = () => {
    setShowClearConfirm(true);
  };

  const executeClearAllSpins = () => {
    if (config.soundEnabled) soundEffects.playChipClick();
    setSpins([]);
    setShowClearConfirm(false);
  };

  // Add Custom Spin
  const handleAddCustomSpin = (number: number, winAmount: number, lossAmount: number) => {
    if (config.soundEnabled) {
      soundEffects.playSpinAdd();
    }

    const nextGiro = spins.length + 1;
    const isWarmupPhase = nextGiro <= 100;

    const winAmt = isWarmupPhase ? 0 : winAmount;
    const lossAmt = isWarmupPhase ? 0 : lossAmount;
    const net = winAmt - lossAmt;
    const newBal = currentBalance + net;
    const botInfo = generateBotSuggestion(spins);

    const newSpin: SpinRecord = {
      id: `spin-${Date.now()}`,
      giro: nextGiro,
      numero: number,
      color: getNumberColor(number),
      dozen: getNumberDozen(number),
      column: getNumberColumn(number),
      parity: getNumberParity(number),
      half: getNumberHalf(number),
      winAmount: winAmt,
      lossAmount: lossAmt,
      netResult: net,
      accumulatedBalance: newBal,
      botLevel: botInfo.level,
      nextBetSuggestion: botInfo.suggestion,
      cycleStatus: isWarmupPhase ? 'NEUTRAL' : (net >= 0 ? 'WIN' : 'LOSS'),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setSpins((prev) => [...prev, newSpin]);
  };

  // Undo Last Spin
  const handleUndoLastSpin = () => {
    if (spins.length === 0) return;
    if (config.soundEnabled) soundEffects.playChipClick();
    setSpins((prev) => prev.slice(0, -1));
  };

  // Delete Specific Spin
  const handleDeleteSpin = (id: string) => {
    if (config.soundEnabled) soundEffects.playChipClick();
    const updated = spins.filter((s) => s.id !== id);
    // Recalculate accumulated balance across remaining
    let current = config.initialBankroll;
    const recalculated = updated.map((s, idx) => {
      const giro = idx + 1;
      const isWarmupPhase = giro <= 100;

      let winAmt = 0;
      let lossAmt = 0;
      let net = 0;

      if (!isWarmupPhase) {
        if (s.winAmount === 0 && s.lossAmount === 0) {
          const payout = evaluateSpinPayout(s.numero, strategy);
          winAmt = s.multiplier ? payout.winAmount * s.multiplier : payout.winAmount;
          lossAmt = payout.lossAmount;
        } else {
          winAmt = s.winAmount;
          lossAmt = s.lossAmount;
        }
        net = winAmt - lossAmt;
      }

      current += net;

      return {
        ...s,
        giro,
        winAmount: winAmt,
        lossAmount: lossAmt,
        netResult: net,
        accumulatedBalance: current,
        cycleStatus: isWarmupPhase ? 'NEUTRAL' : (net >= 0 ? 'WIN' : 'LOSS'),
      };
    });
    setSpins(recalculated);
  };

  // Reset to Demo Data
  const handleResetData = () => {
    setShowResetDemoConfirm(true);
  };

  const executeResetData = () => {
    if (config.soundEnabled) soundEffects.playChipClick();
    setSpins(DEMO_SPINS);
    setConfig(INITIAL_BANKROLL_CONFIG);
    setStrategy(INITIAL_STRATEGY_CONFIG);
    setShowResetDemoConfirm(false);
  };

  // Export CSV
  const handleExportCSV = () => {
    let csv = 'GIRO,NÚMERO,MULTIPLICADOR,COR,DÚZIA,COLUNA,PAR_IMPAR,GANHO,PERDA,RESULTADO,SALDO,BOT_NIVEL,SUGESTAO,STATUS\n';
    spins.forEach((s) => {
      csv += `${s.giro},${s.numero},${s.multiplier || 1},${s.color},${s.dozen},${s.column},${s.parity},${s.winAmount},${s.lossAmount},${s.netResult},${s.accumulatedBalance},${s.botLevel},"${s.nextBetSuggestion}",${s.cycleStatus}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Roleta_Master_Historico_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import CSV
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;

      const importedSpins: SpinRecord[] = [];
      let runningBal = config.initialBankroll;

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 10) {
          const giro = parseInt(parts[0]) || i;
          const numero = parseInt(parts[1]) || 0;
          const mult = parseFloat(parts[2]) || 1;
          const winAmount = parseFloat(parts[7]) || 0;
          const lossAmount = parseFloat(parts[8]) || 0;
          const netResult = parseFloat(parts[9]) || winAmount - lossAmount;
          runningBal += netResult;

          importedSpins.push({
            id: `import-${i}-${Date.now()}`,
            giro,
            numero,
            multiplier: mult > 1 ? mult : undefined,
            color: getNumberColor(numero),
            dozen: getNumberDozen(numero),
            column: getNumberColumn(numero),
            parity: getNumberParity(numero),
            half: getNumberHalf(numero),
            winAmount,
            lossAmount,
            netResult,
            accumulatedBalance: runningBal,
            botLevel: parts[11] || 'N1',
            nextBetSuggestion: parts[12]?.replace(/"/g, '') || '',
            cycleStatus: netResult >= 0 ? 'WIN' : 'LOSS',
            timestamp: new Date().toISOString(),
          });
        }
      }

      if (importedSpins.length > 0) {
        setSpins(importedSpins);
      }
    };
    reader.readAsText(file);
  };

  const renderBlockContent = (id: DashboardBlockId) => {
    switch (id) {
      case 'kpis':
        return (
          <BankrollCards
            config={config}
            currentBalance={currentBalance}
            netProfit={netProfit}
            profitMarginPct={profitMarginPct}
            totalSpins={totalSpins}
            winRatePct={winRatePct}
            roiPct={roiPct}
            peakBalance={peakBalance}
            lastNumber={lastSpin ? lastSpin.numero : null}
            lastColor={lastSpin ? lastSpin.color : ''}
            lastDozen={lastSpin ? lastSpin.dozen : ''}
            lastColumn={lastSpin ? lastSpin.column : ''}
          />
        );
      case 'alerts':
        return <AlertsAndGoalCard config={config} netProfit={netProfit} />;
      case 'quick_input':
        return (
          <QuickSpinInput
            onAddSpin={handleAddSpin}
            onBatchAddSpins={handleBatchAddSpins}
            onUndoLastSpin={handleUndoLastSpin}
            onClearAllSpins={handleClearAllSpins}
            totalSpins={totalSpins}
          />
        );
      case 'temperatures':
        return (
          <TemperaturesPanel
            dozenItems={temperatures.dozenItems}
            columnItems={temperatures.columnItems}
          />
        );
      case 'strategy':
        return (
          <ActiveStrategyPanel
            strategy={strategy}
            onUpdateStrategy={(upd) => setStrategy((prev) => ({ ...prev, ...upd }))}
            config={config}
            spins={spins}
            onOpenStrategyPdf={() => setIsStrategyPdfOpen(true)}
          />
        );
      case 'hot_cold':
        return <HotColdNumbersCard numberStats={numberStats} />;
      case 'history':
        return (
          <HistoryTable
            spins={spins}
            config={config}
            onDeleteSpin={handleDeleteSpin}
            onEditSpin={() => {}}
            onAddCustomSpin={handleAddCustomSpin}
            onClearAllSpins={handleClearAllSpins}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} font-sans antialiased selection:bg-amber-500 selection:text-slate-950 transition-colors`}>
      {/* Top Bar */}
      <Header
        config={config}
        onUpdateConfig={(upd) => setConfig((prev) => ({ ...prev, ...upd }))}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenStrategyPdf={() => setIsStrategyPdfOpen(true)}
        onExportCSV={handleExportCSV}
        onImportCSV={handleImportCSV}
        onResetData={handleResetData}
        onClearAllSpins={handleClearAllSpins}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        currentBalance={currentBalance}
        netProfit={netProfit}
        totalSpins={totalSpins}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Painel Principal
            </button>
            <button
              onClick={() => setActiveTab('board')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'board'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Mesa & Mapa de Calor
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === 'analytics'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Gráficos & Análise
            </button>
          </div>

          {activeTab === 'dashboard' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowLayoutControls(!showLayoutControls)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  showLayoutControls
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Mostrar/ocultar opções de reordenação e posicionamento do layout"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Reordenar Blocos</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Layout Presets Toolbar */}
            {showLayoutControls && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg animate-fadeIn">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider">
                      Modelos de Posicionamento do Layout
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Mova o teclado/coleta para o rodapé com 1 clique ou reordene usando as setas nos blocos.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setBlockOrder(BOTTOM_PRESET_ORDER)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                      JSON.stringify(blockOrder) === JSON.stringify(BOTTOM_PRESET_ORDER)
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                    title="Posiciona Lançamento e Métricas na parte inferior do layout"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" /> Lançamento no Rodapé
                  </button>

                  <button
                    onClick={() => setBlockOrder(DEFAULT_BLOCK_ORDER)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                      JSON.stringify(blockOrder) === JSON.stringify(DEFAULT_BLOCK_ORDER)
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                    title="Posiciona Lançamento e Métricas no topo do layout"
                  >
                    <ArrowUpToLine className="w-3.5 h-3.5" /> Lançamento no Topo
                  </button>
                </div>
              </div>
            )}

            {/* Render Blocks in Custom User Order */}
            {blockOrder.map((blockId, index) => {
              const isFirst = index === 0;
              const isLast = index === blockOrder.length - 1;

              return (
                <div key={blockId} className="relative group">
                  {/* Optional Block Move Controls Header (visible when showLayoutControls is enabled or on hover) */}
                  {showLayoutControls && (
                    <div className="flex items-center justify-between bg-slate-950/90 border border-slate-800 px-3.5 py-1.5 rounded-t-2xl text-[10px] font-bold text-slate-400 mb-2 shadow-inner">
                      <span className="flex items-center gap-1.5">
                        <GripVertical className="w-3.5 h-3.5 text-slate-500" />
                        <span className="uppercase tracking-widest font-extrabold text-amber-400">
                          {BLOCK_TITLES[blockId]}
                        </span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveBlock(blockId, 'up')}
                          disabled={isFirst}
                          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-200 transition-colors flex items-center gap-1 text-[10px] font-black border border-slate-700"
                          title="Mover este bloco para cima"
                        >
                          <ArrowUp className="w-3 h-3 text-amber-400" /> Subir
                        </button>
                        <button
                          onClick={() => handleMoveBlock(blockId, 'down')}
                          disabled={isLast}
                          className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-200 transition-colors flex items-center gap-1 text-[10px] font-black border border-slate-700"
                          title="Mover este bloco para baixo"
                        >
                          <ArrowDown className="w-3 h-3 text-amber-400" /> Descer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Render the actual block */}
                  <div>
                    {renderBlockContent(blockId)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Interactive Table Board */}
        {activeTab === 'board' && (
          <div className="space-y-6">
            <InteractiveRouletteBoard
              numberStats={numberStats}
              lastNumber={lastSpin ? lastSpin.numero : null}
              onSelectNumber={(num) => handleAddSpin(num)}
            />
            <QuickSpinInput
              onAddSpin={handleAddSpin}
              onBatchAddSpins={handleBatchAddSpins}
              onUndoLastSpin={handleUndoLastSpin}
              onClearAllSpins={handleClearAllSpins}
              totalSpins={totalSpins}
            />
          </div>
        )}

        {/* Tab 3: Analytics Charts */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <AnalyticsCharts spins={spins} config={config} />
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={(upd) => setConfig(upd)}
      />

      {/* Strategy Guide & PDF Export Modal */}
      <StrategyGuideModal
        isOpen={isStrategyPdfOpen}
        onClose={() => setIsStrategyPdfOpen(false)}
      />

      {/* Confirmation Modal for Clear All Base */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-100 uppercase tracking-wide">
                  Limpar Toda a Base da Mesa?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Você está prestes a apagar todos os <span className="text-rose-400 font-bold">{spins.length} giros</span> gravados.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              Esta ação irá zerar o histórico da mesa para que você possa colar a nova sequência de 100 rodadas da sua nova mesa de roleta.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={executeClearAllSpins}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Sim, Zerar Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Reset Demo */}
      {showResetDemoConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-100 uppercase tracking-wide">
                  Restaurar Dados Demonstrativos?
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Recarrega a amostra demonstrativa inicial de 100 giros da planilha.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowResetDemoConfirm(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={executeResetData}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" /> Restaurar Demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
