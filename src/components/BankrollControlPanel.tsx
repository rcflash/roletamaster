import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  Target,
  ShieldAlert,
  Calendar,
  PlusCircle,
  Trash2,
  Edit3,
  CheckCircle2,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  BookmarkPlus,
  PiggyBank,
  History,
  Save,
  RotateCcw,
  Coins,
  Filter,
  AlertCircle
} from 'lucide-react';
import { BankrollConfig, SpinRecord, DailySessionRecord, StrategyConfig } from '../types';

interface BankrollControlPanelProps {
  config: BankrollConfig;
  spins: SpinRecord[];
  strategy?: StrategyConfig;
  onUpdateConfig: (newConfig: BankrollConfig) => void;
  onDeleteSpin?: (id: string) => void;
  onUpdateStrategy?: (updated: Partial<StrategyConfig>) => void;
}

const STORAGE_KEY_SESSIONS = 'roleta_master_daily_sessions_v1';

export const BankrollControlPanel: React.FC<BankrollControlPanelProps> = ({
  config,
  spins,
  strategy,
  onUpdateConfig,
  onDeleteSpin,
}) => {
  // Local state for Daily Sessions
  const [dailySessions, setDailySessions] = useState<DailySessionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: '1',
        date: new Date(Date.now() - 86400000 * 2).toLocaleDateString('pt-BR'),
        initialBankroll: 100,
        finalBankroll: 120,
        netProfit: 20,
        roiPct: 20.0,
        totalSpins: 45,
        winCount: 28,
        goalMet: true,
        stopLossHit: false,
        notes: 'Sessão com estratégia de Vizinhos no Cilindro.',
      },
      {
        id: '2',
        date: new Date(Date.now() - 86400000).toLocaleDateString('pt-BR'),
        initialBankroll: 120,
        finalBankroll: 145,
        netProfit: 25,
        roiPct: 20.8,
        totalSpins: 52,
        winCount: 34,
        goalMet: true,
        stopLossHit: false,
        notes: 'Aproveitou alta taxa de acertos no setor zero.',
      },
    ];
  });

  // State for Initial Bankroll configuration inline inputs
  const [editingBankroll, setEditingBankroll] = useState<string>(config.initialBankroll.toString());
  const [editingGoal, setEditingGoal] = useState<string>(config.dailyGoal.toString());
  const [editingStopLoss, setEditingStopLoss] = useState<string>(config.stopLossLimit.toString());
  const [bankrollSaveMsg, setBankrollSaveMsg] = useState<boolean>(false);

  // Sync config inputs if updated externally
  useEffect(() => {
    setEditingBankroll(config.initialBankroll.toString());
    setEditingGoal(config.dailyGoal.toString());
    setEditingStopLoss(config.stopLossLimit.toString());
  }, [config.initialBankroll, config.dailyGoal, config.stopLossLimit]);

  // State for Manual Daily Entry / Edit Form
  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const [manualDate, setManualDate] = useState<string>(getTodayISO());
  const [manualEarnedAmount, setManualEarnedAmount] = useState<string>('0.00');
  const [manualInitialBankroll, setManualInitialBankroll] = useState<string>(config.initialBankroll.toString());
  const [manualNotes, setManualNotes] = useState<string>('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  // Compound projections settings
  const [projectionDays, setProjectionDays] = useState<number>(14);
  const [projectionDailyGoalPct, setProjectionDailyGoalPct] = useState<number>(10);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<boolean>(false);

  // Filter for Plays Log
  const [playsFilter, setPlaysFilter] = useState<'ALL' | 'VALENDO' | 'WINS' | 'LOSSES'>('VALENDO');

  // Save sessions to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(dailySessions));
    } catch (e) {
      console.error(e);
    }
  }, [dailySessions]);

  // Current session calculations from automatic spins
  const totalSpins = spins.length;
  const activeSpins = spins.filter((s) => s.giro > 100);
  const activeSpinsCount = activeSpins.length;

  // Calculate Net Profit & Current Balance from active spins
  const netProfit = spins.reduce((acc, s) => acc + s.netResult, 0);
  const currentBalance = config.initialBankroll + netProfit;

  // Calculate Total Wagered Amount in active spins
  const totalWagered = spins.reduce(
    (acc, s) => acc + (s.winAmount > 0 || s.lossAmount > 0 ? s.winAmount - s.netResult : 0),
    0
  );

  // ROI calculations
  const bankrollGrowthPct =
    config.initialBankroll > 0 ? (netProfit / config.initialBankroll) * 100 : 0;

  const wageredRoiPct =
    totalWagered > 0
      ? (netProfit / totalWagered) * 100
      : activeSpinsCount > 0
      ? (netProfit / (activeSpinsCount * config.defaultSpinCost)) * 100
      : 0;

  const winsCount = spins.filter((s) => s.netResult > 0).length;

  // Daily Goal & Stop Loss status
  const goal = config.dailyGoal || 20;
  const stopLoss = config.stopLossLimit || 50;
  const isGoalReached = netProfit >= goal;
  const isStopLossHit = netProfit <= -stopLoss;

  const goalProgressPct = Math.max(0, Math.min(100, (netProfit / goal) * 100));
  const remainingToGoal = Math.max(0, goal - netProfit);
  const remainingToStopLoss = Math.max(0, stopLoss + netProfit);

  // Spin Risk % of Current Bankroll
  const spinRiskPct = currentBalance > 0 ? (config.defaultSpinCost / currentBalance) * 100 : 0;

  // Handle Save Initial Bankroll & Targets
  const handleSaveBankrollConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBankroll = parseFloat(editingBankroll.replace(',', '.'));
    const parsedGoal = parseFloat(editingGoal.replace(',', '.'));
    const parsedStopLoss = parseFloat(editingStopLoss.replace(',', '.'));

    if (!isNaN(parsedBankroll) && parsedBankroll > 0) {
      onUpdateConfig({
        ...config,
        initialBankroll: parsedBankroll,
        dailyGoal: !isNaN(parsedGoal) ? parsedGoal : config.dailyGoal,
        stopLossLimit: !isNaN(parsedStopLoss) ? parsedStopLoss : config.stopLossLimit,
      });
      setBankrollSaveMsg(true);
      setTimeout(() => setBankrollSaveMsg(false), 3000);
    }
  };

  // Convert Date string (YYYY-MM-DD) to BR format (DD/MM/AAAA)
  const formatDateBR = (isoDateStr: string) => {
    if (!isoDateStr) return new Date().toLocaleDateString('pt-BR');
    if (isoDateStr.includes('/')) return isoDateStr;
    const parts = isoDateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDateStr;
  };

  // Handle Manual Entry or Edit of Daily Session
  const handleSaveManualSession = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedEarned = parseFloat(manualEarnedAmount.replace(',', '.'));
    const parsedInitial = parseFloat(manualInitialBankroll.replace(',', '.')) || config.initialBankroll;

    if (isNaN(parsedEarned)) return;

    const formattedDate = formatDateBR(manualDate);
    const finalBank = parsedInitial + parsedEarned;
    const roi = parsedInitial > 0 ? (parsedEarned / parsedInitial) * 100 : 0;
    const goalMet = parsedEarned >= config.dailyGoal;
    const stopLossHit = parsedEarned <= -config.stopLossLimit;

    if (editingSessionId) {
      // Update existing record
      setDailySessions((prev) =>
        prev.map((s) =>
          s.id === editingSessionId
            ? {
                ...s,
                date: formattedDate,
                initialBankroll: parsedInitial,
                finalBankroll: finalBank,
                netProfit: parsedEarned,
                roiPct: roi,
                goalMet,
                stopLossHit,
                notes: manualNotes || s.notes || 'Sessão editada manualmente.',
              }
            : s
        )
      );
      setEditingSessionId(null);
    } else {
      // Add new record
      const newRecord: DailySessionRecord = {
        id: `session-${Date.now()}`,
        date: formattedDate,
        initialBankroll: parsedInitial,
        finalBankroll: finalBank,
        netProfit: parsedEarned,
        roiPct: roi,
        totalSpins: totalSpins,
        winCount: winsCount,
        goalMet,
        stopLossHit,
        notes: manualNotes || 'Lançamento manual registrado.',
      };

      setDailySessions((prev) => [newRecord, ...prev]);
    }

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);

    // Reset form
    setManualEarnedAmount('0.00');
    setManualNotes('');
  };

  // Populate form for editing existing session
  const handleStartEditSession = (session: DailySessionRecord) => {
    setEditingSessionId(session.id);
    // Convert DD/MM/AAAA back to YYYY-MM-DD for date input if possible
    if (session.date.includes('/')) {
      const parts = session.date.split('/');
      if (parts.length === 3) {
        setManualDate(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
      } else {
        setManualDate(getTodayISO());
      }
    } else {
      setManualDate(session.date);
    }
    setManualEarnedAmount(session.netProfit.toString());
    setManualInitialBankroll(session.initialBankroll.toString());
    setManualNotes(session.notes || '');
  };

  // Cancel edit mode
  const handleCancelEditSession = () => {
    setEditingSessionId(null);
    setManualEarnedAmount('0.00');
    setManualNotes('');
    setManualDate(getTodayISO());
  };

  // Quick Save Current Auto Session
  const handleSaveCurrentSessionAuto = () => {
    const todayStr = new Date().toLocaleDateString('pt-BR');
    const existingIdx = dailySessions.findIndex((s) => s.date === todayStr);

    const newRecord: DailySessionRecord = {
      id: `session-${Date.now()}`,
      date: todayStr,
      initialBankroll: config.initialBankroll,
      finalBankroll: currentBalance,
      netProfit,
      roiPct: bankrollGrowthPct,
      totalSpins,
      winCount: winsCount,
      goalMet: isGoalReached,
      stopLossHit: isStopLossHit,
      notes: manualNotes || 'Sessão gravada automaticamente pelos giros da roleta.',
    };

    if (existingIdx >= 0) {
      const updated = [...dailySessions];
      updated[existingIdx] = newRecord;
      setDailySessions(updated);
    } else {
      setDailySessions([newRecord, ...dailySessions]);
    }

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const handleDeleteSession = (id: string) => {
    setDailySessions(dailySessions.filter((s) => s.id !== id));
  };

  // Compound Growth Projections
  const compoundProjections = React.useMemo(() => {
    const list = [];
    let b = config.initialBankroll;
    const rate = projectionDailyGoalPct / 100;

    for (let day = 1; day <= projectionDays; day++) {
      const dailyProfit = b * rate;
      b += dailyProfit;
      list.push({
        day,
        balance: b,
        dailyProfit,
        totalGain: b - config.initialBankroll,
      });
    }
    return list;
  }, [config.initialBankroll, projectionDays, projectionDailyGoalPct]);

  // Summary Metrics from Daily Saved Sessions
  const totalManualProfit = dailySessions.reduce((acc, s) => acc + s.netProfit, 0);
  const avgProfitPerDay = dailySessions.length > 0 ? totalManualProfit / dailySessions.length : 0;
  const greenDaysCount = dailySessions.filter((s) => s.netProfit > 0).length;
  const redDaysCount = dailySessions.filter((s) => s.netProfit < 0).length;

  // Filtered Plays for Automatic Plays Section
  const filteredSpins = React.useMemo(() => {
    const list = [...spins].reverse(); // newest first
    if (playsFilter === 'VALENDO') return list.filter((s) => s.giro > 100 || s.winAmount > 0 || s.lossAmount > 0);
    if (playsFilter === 'WINS') return list.filter((s) => s.netResult > 0);
    if (playsFilter === 'LOSSES') return list.filter((s) => s.netResult < 0);
    return list; // ALL
  }, [spins, playsFilter]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-full flex items-center gap-1 shadow-md">
                <Wallet className="w-3.5 h-3.5" /> Controle de Banca & ROI
              </span>
              <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg border border-slate-700">
                Gestão Financeira & Lançamento Manual/Auto
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Painel de Gestão de Banca e Resultados
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Configure seu Saldo Inicial de banca, lance manualmente o ganho diário ou deixe o sistema registrar os giros automáticos. Exclua facilmente jogadas em que você não entrou!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSaveCurrentSessionAuto}
              className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center gap-2 shrink-0 hover:scale-[1.02]"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>Gravar Sessão Atual dos Giros</span>
            </button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sessão diária gravada/atualizada com sucesso no relatório local!</span>
          </div>
        )}
      </div>

      {/* CONFIGURAÇÃO DO SALDO INICIAL DA BANCA */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Lançamento Base</span>
              <h3 className="text-base font-black text-slate-100">Configurar Saldo Inicial e Metas da Banca</h3>
            </div>
          </div>

          {bankrollSaveMsg && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-500/40 flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saldo Inicial atualizado com sucesso!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveBankrollConfig} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Saldo Inicial da Banca (R$):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
              <input
                type="number"
                step="1.00"
                min="1"
                value={editingBankroll}
                onChange={(e) => setEditingBankroll(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                placeholder="100.00"
              />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Capital inicial para cálculo de lucros e ROI.</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Meta Diária de Lucro (R$):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
              <input
                type="number"
                step="1.00"
                min="1"
                value={editingGoal}
                onChange={(e) => setEditingGoal(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                placeholder="20.00"
              />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Alvo diário desejado de lucro.</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Limite de Stop Loss (R$):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
              <input
                type="number"
                step="1.00"
                min="1"
                value={editingStopLoss}
                onChange={(e) => setEditingStopLoss(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                placeholder="50.00"
              />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Perda máxima permitida por dia.</span>
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Configuração de Banca</span>
            </button>
          </div>
        </form>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Card 1: Banca Inicial */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Banca Inicial</span>
          <span className="text-lg sm:text-xl font-black text-slate-100">
            {config.currency} {config.initialBankroll.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 block">Capital Base Configurado</span>
        </div>

        {/* Card 2: Saldo Atual */}
        <div className="bg-slate-900 border border-emerald-500/30 ring-1 ring-emerald-500/10 rounded-2xl p-4 space-y-1 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Saldo Atual</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400">
            {config.currency} {currentBalance.toFixed(2)}
          </span>
          <span className="text-[10px] text-emerald-400/80 font-bold block flex items-center gap-0.5">
            {netProfit >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3 text-rose-400" />}
            {bankrollGrowthPct >= 0 ? '+' : ''}{bankrollGrowthPct.toFixed(1)}% de Banca
          </span>
        </div>

        {/* Card 3: Lucro Líquido */}
        <div
          className={`bg-slate-900 border rounded-2xl p-4 space-y-1 shadow-lg ${
            netProfit >= 0 ? 'border-emerald-500/30' : 'border-rose-500/30'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lucro Líquido</span>
          <span className={`text-xl sm:text-2xl font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netProfit >= 0 ? '+' : ''}{config.currency} {netProfit.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 block">
            {totalSpins <= 100 ? 'Amostragem' : `${activeSpinsCount} giros valendo`}
          </span>
        </div>

        {/* Card 4: ROI Operacional */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ROI sobre Apostas</span>
          <span className={`text-xl sm:text-2xl font-black ${wageredRoiPct >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
            {wageredRoiPct >= 0 ? '+' : ''}{wageredRoiPct.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500 block">Retorno / Volume Apostado</span>
        </div>

        {/* Card 5: Risco por Giro */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg col-span-2 sm:col-span-4 lg:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Exposição / Giro</span>
          <span
            className={`text-lg sm:text-xl font-black ${
              spinRiskPct > 10 ? 'text-rose-400' : spinRiskPct > 5 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {spinRiskPct.toFixed(1)}% da Banca
          </span>
          <span className="text-[10px] text-slate-400 block truncate">
            {config.currency} {config.defaultSpinCost.toFixed(2)} por ficha
          </span>
        </div>
      </div>

      {/* Meta Diária & Stop Loss Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Goal Progress Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Metas Diárias</span>
                <h3 className="text-lg font-black text-slate-100">Progresso da Meta de Lucro</h3>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isGoalReached
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 animate-pulse'
                  : 'bg-slate-800 text-amber-400 border border-slate-700'
              }`}
            >
              {isGoalReached ? '🎉 META ALCANÇADA!' : `${goalProgressPct.toFixed(1)}% Concluído`}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-baseline text-xs font-bold">
              <span className="text-slate-300">
                Lucro Atual: <strong className="text-emerald-400">{config.currency} {netProfit.toFixed(2)}</strong>
              </span>
              <span className="text-slate-400">
                Alvo Diário: <strong className="text-amber-400">{config.currency} {goal.toFixed(2)}</strong>
              </span>
            </div>

            {/* Gauge Bar */}
            <div className="w-full bg-slate-950 h-4 rounded-full overflow-hidden p-1 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isGoalReached
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-300 to-amber-300'
                    : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(4, goalProgressPct))}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
              <span>
                Falta para bater a meta: <strong className="text-amber-300">{config.currency} {remainingToGoal.toFixed(2)}</strong>
              </span>
              <span>
                Crescimento: <strong className="text-slate-200">+{((goal / config.initialBankroll) * 100).toFixed(0)}% da Banca</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Stop Loss & Risk Safeguard Box */}
        <div
          className={`border rounded-3xl p-6 shadow-2xl space-y-5 transition-all ${
            isStopLossHit
              ? 'bg-rose-950/20 border-rose-800/80 ring-2 ring-rose-500/20'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2.5 rounded-2xl border ${
                  isStopLossHit
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Proteção da Banca</span>
                <h3 className="text-lg font-black text-slate-100">Escudo de Limite de Perda (Stop Loss)</h3>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isStopLossHit
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isStopLossHit ? '🔴 STOP LOSS ATINGIDO' : '🟢 DENTRO DO SEGURO'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-baseline text-xs font-bold">
              <span className="text-slate-300">
                Limite Tolerável: <strong className="text-rose-400">-{config.currency} {stopLoss.toFixed(2)}</strong>
              </span>
              <span className="text-slate-400">
                Folga de Segurança: <strong className="text-emerald-400">{config.currency} {remainingToStopLoss.toFixed(2)}</strong>
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <p className="text-xs text-slate-300 leading-relaxed">
                {isStopLossHit
                  ? '⚠️ Seu limite de perda de segurança foi atingido nesta sessão. O protocolo profissional determina encerrar as apostas e retornar apenas amanhã.'
                  : `Seu limite de Stop Loss está fixado em ${config.currency} ${stopLoss.toFixed(2)}. Isso representa uma proteção de ${((stopLoss / config.initialBankroll) * 100).toFixed(0)}% do seu capital inicial.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* LANÇAMENTO MANUAL / EDIÇÃO DE RESULTADOS DIÁRIOS (VALOR GANHO DO DIA E DATA) */}
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Lançamento Direto</span>
              <h3 className="text-lg font-black text-slate-100">
                {editingSessionId ? '✏️ Editar Resultado Diário' : '➕ Lançar Valor Ganho do Dia e Data'}
              </h3>
            </div>
          </div>

          {editingSessionId && (
            <button
              onClick={handleCancelEditSession}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1 self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Cancelar Edição
            </button>
          )}
        </div>

        {/* Form Lançamento de Lucro e Data */}
        <form onSubmit={handleSaveManualSession} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Data */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Data do Dia:
            </label>
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Valor Ganho no Dia (R$) */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Valor Ganho / Lucro no Dia (R$):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
              <input
                type="number"
                step="0.50"
                value={manualEarnedAmount}
                onChange={(e) => setManualEarnedAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                placeholder="90.00"
                required
              />
            </div>
            <span className="text-[9px] text-slate-500 block mt-1">Use valor positivo para Lucro e negativo (-) para Perda.</span>
          </div>

          {/* Banca Inicial do Dia */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Banca Inicial do Dia (R$):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
              <input
                type="number"
                step="1.00"
                min="1"
                value={manualInitialBankroll}
                onChange={(e) => setManualInitialBankroll(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-indigo-500"
                placeholder="100.00"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Observações / Notas:
            </label>
            <input
              type="text"
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="Ex: Mesa com retorno de 90.00 por win"
            />
          </div>

          <div className="sm:col-span-2 md:col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{editingSessionId ? 'Atualizar Resultado do Dia' : 'Salvar Lançamento do Dia'}</span>
            </button>
          </div>
        </form>

        {/* Resumo Automático dos Lançamentos */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Ganho Acumulado</span>
            <span className={`text-base font-black ${totalManualProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalManualProfit >= 0 ? '+' : ''}{config.currency} {totalManualProfit.toFixed(2)}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Média Diária de Lucro</span>
            <span className={`text-base font-black ${avgProfitPerDay >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
              {avgProfitPerDay >= 0 ? '+' : ''}{config.currency} {avgProfitPerDay.toFixed(2)}/dia
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Dias no Green</span>
            <span className="text-base font-black text-emerald-400 flex items-center justify-center gap-1">
              <ArrowUpRight className="w-4 h-4" /> {greenDaysCount} dias
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Dias no Red</span>
            <span className="text-base font-black text-rose-400 flex items-center justify-center gap-1">
              <ArrowDownRight className="w-4 h-4" /> {redDaysCount} dias
            </span>
          </div>
        </div>
      </div>

      {/* HISTÓRICO DE SESSÕES SALVAS DIÁRIAS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Histórico de Registros</span>
              <h3 className="text-lg font-black text-slate-100">Relatório de Sessões Diárias Salvaguardadas</h3>
            </div>
          </div>

          <span className="text-xs text-slate-400 font-bold">{dailySessions.length} dias registrados</span>
        </div>

        {dailySessions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs italic">
            Nenhum registro encontrado. Use o formulário acima para lançar a data e o valor ganho do dia.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Banca Inicial</th>
                  <th className="py-3 px-4">Banca Final</th>
                  <th className="py-3 px-4">Valor Ganho no Dia</th>
                  <th className="py-3 px-4">ROI %</th>
                  <th className="py-3 px-4">Status Meta</th>
                  <th className="py-3 px-4">Notas</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {dailySessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-200">{s.date}</td>
                    <td className="py-3 px-4 text-slate-300">
                      {config.currency} {s.initialBankroll.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-100">
                      {config.currency} {s.finalBankroll.toFixed(2)}
                    </td>
                    <td className={`py-3 px-4 font-black ${s.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.netProfit >= 0 ? '+' : ''}{config.currency} {s.netProfit.toFixed(2)}
                    </td>
                    <td className={`py-3 px-4 font-bold ${s.roiPct >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                      {s.roiPct >= 0 ? '+' : ''}{s.roiPct.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4">
                      {s.goalMet ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          Meta Bati 🎉
                        </span>
                      ) : s.stopLossHit ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                          Stop Loss 🔴
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                          {s.netProfit >= 0 ? 'Positivo' : 'Negativo'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] max-w-[200px] truncate" title={s.notes}>
                      {s.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleStartEditSession(s)}
                          className="p-1.5 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors"
                          title="Editar este registro"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSession(s.id)}
                          className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                          title="Excluir este registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SEÇÃO DE LANÇAMENTO E EXCLUSÃO DE JOGADAS AUTOMÁTICAS (Apostei vs Não Entrei) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                Lançamento Automático de Jogadas
              </span>
              <h3 className="text-lg font-black text-slate-100">
                Histórico de Apostas da Roleta (Excluir entradas que não participou)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filtrar:
            </span>
            {(['VALENDO', 'ALL', 'WINS', 'LOSSES'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPlaysFilter(mode)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  playsFilter === mode
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {mode === 'VALENDO'
                  ? 'Apenas Apostas Realizadas'
                  : mode === 'ALL'
                  ? 'Todos os Giros'
                  : mode === 'WINS'
                  ? 'Somente Greens'
                  : 'Somente Reds'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Dica de Controle:</strong> Os giros são gravados automaticamente. Se você <strong>não entrou</strong> em alguma aposta gerada pelo robô, basta clicar no botão de <strong>Excluir Jogada 🗑️</strong> para removê-la do cálculo de banca!
          </span>
        </div>

        {filteredSpins.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs italic">
            Nenhuma jogada encontrada com o filtro selecionado. Adicione giros na mesa para ver os resultados aqui!
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-xs relative">
              <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-800 z-10">
                <tr>
                  <th className="py-2.5 px-3">Giro</th>
                  <th className="py-2.5 px-3">Número</th>
                  <th className="py-2.5 px-3">Entrada Sugerida</th>
                  <th className="py-2.5 px-3">Aposta</th>
                  <th className="py-2.5 px-3">Retorno</th>
                  <th className="py-2.5 px-3">Resultado</th>
                  <th className="py-2.5 px-3">Saldo Banca</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredSpins.map((s) => {
                  const isWin = s.netResult > 0;
                  const isLoss = s.netResult < 0;
                  const totalBetOnSpin = s.winAmount > 0 || s.lossAmount > 0 ? s.winAmount - s.netResult : 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">#{s.giro}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black text-white ${
                            s.color === 'red'
                              ? 'bg-rose-600'
                              : s.color === 'black'
                              ? 'bg-slate-800 border border-slate-700'
                              : 'bg-emerald-600'
                          }`}
                        >
                          {s.numero}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                        {s.nextBetSuggestion || 'Vizinhos do Cilindro'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {totalBetOnSpin > 0 ? `R$ ${totalBetOnSpin.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-indigo-300 font-bold">
                        {s.winAmount > 0 ? `R$ ${s.winAmount.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        {isWin ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] inline-flex items-center gap-1">
                            GREEN (+R$ {s.netResult.toFixed(2)})
                          </span>
                        ) : isLoss ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px] inline-flex items-center gap-1">
                            RED (R$ {s.netResult.toFixed(2)})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                            Amostragem / Neutro
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                        {config.currency} {s.accumulatedBalance.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {onDeleteSpin && (
                          <button
                            onClick={() => onDeleteSpin(s.id)}
                            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-bold transition-all inline-flex items-center gap-1"
                            title="Excluir esta jogada (não entrei na aposta)"
                          >
                            <Trash2 className="w-3 h-3" /> Excluir Jogada
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SIMULADOR DE JUROS COMPOSTOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Simulador Avançado</span>
              <h3 className="text-xl font-black text-slate-100">Projeção de Juros Compostos Diários</h3>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-bold">Dias:</span>
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setProjectionDays(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                    projectionDays === d ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d} dias
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-bold">Meta Diária:</span>
              {[5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setProjectionDailyGoalPct(pct)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                    projectionDailyGoalPct === pct ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Projection Grid Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {compoundProjections.slice(0, 6).map((proj) => (
            <div key={proj.day} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-400 block">Dia {proj.day}</span>
              <span className="text-base font-black text-slate-100 block">
                {config.currency} {proj.balance.toFixed(2)}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold block">
                +{config.currency} {proj.dailyProfit.toFixed(2)}/dia
              </span>
            </div>
          ))}
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <PiggyBank className="w-5 h-5 shrink-0" />
            <span>
              Resultado estimado ao final de {projectionDays} dias mantendo {projectionDailyGoalPct}% ao dia:{' '}
              <strong className="text-emerald-400 text-sm font-black">
                {config.currency} {compoundProjections[compoundProjections.length - 1]?.balance.toFixed(2)}
              </strong>{' '}
              (+{((compoundProjections[compoundProjections.length - 1]?.totalGain / config.initialBankroll) * 100).toFixed(0)}% de Lucro Acumulado!).
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
