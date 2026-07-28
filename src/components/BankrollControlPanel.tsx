import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  Target,
  ShieldAlert,
  Calendar,
  PlusCircle,
  Trash2,
  Award,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Percent,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  BookmarkPlus,
  HelpCircle,
  PiggyBank,
  PieChart
} from 'lucide-react';
import { BankrollConfig, SpinRecord, DailySessionRecord } from '../types';

interface BankrollControlPanelProps {
  config: BankrollConfig;
  spins: SpinRecord[];
  onUpdateConfig: (newConfig: BankrollConfig) => void;
}

const STORAGE_KEY_SESSIONS = 'roleta_master_daily_sessions_v1';

export const BankrollControlPanel: React.FC<BankrollControlPanelProps> = ({
  config,
  spins,
  onUpdateConfig,
}) => {
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
        notes: 'Sessão com estratégia Romanosky e Dúzias.',
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
        notes: 'Aproveitou alta temperatura da 2ª Dúzia.',
      },
    ];
  });

  const [projectionDays, setProjectionDays] = useState<number>(14);
  const [projectionDailyGoalPct, setProjectionDailyGoalPct] = useState<number>(10);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<boolean>(false);

  // Save sessions to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(dailySessions));
    } catch (e) {
      console.error(e);
    }
  }, [dailySessions]);

  // Current session calculations
  const totalSpins = spins.length;
  const activeSpins = spins.filter((s) => s.giro > 100);
  const activeSpinsCount = activeSpins.length;

  // Calculate Net Profit & Current Balance from active spins
  const netProfit = spins.reduce((acc, s) => acc + s.netResult, 0);
  const currentBalance = config.initialBankroll + netProfit;

  // Calculate Total Wagered Amount in active spins
  const totalWagered = spins.reduce((acc, s) => acc + (s.winAmount > 0 || s.lossAmount > 0 ? (s.winAmount - s.netResult) : 0), 0);
  
  // ROI calculations
  const bankrollGrowthPct = config.initialBankroll > 0 
    ? (netProfit / config.initialBankroll) * 100 
    : 0;

  const wageredRoiPct = totalWagered > 0 
    ? (netProfit / totalWagered) * 100 
    : (activeSpinsCount > 0 ? (netProfit / (activeSpinsCount * config.defaultSpinCost)) * 100 : 0);

  const winsCount = spins.filter((s) => s.netResult > 0).length;
  const winRatePct = totalSpins > 0 ? (winsCount / totalSpins) * 100 : 0;

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

  // Save Today's Session
  const handleSaveCurrentSession = () => {
    const todayStr = new Date().toLocaleDateString('pt-BR');
    const existingIdx = dailySessions.findIndex((s) => s.date === todayStr);

    const newRecord: DailySessionRecord = {
      id: Date.now().toString(),
      date: todayStr,
      initialBankroll: config.initialBankroll,
      finalBankroll: currentBalance,
      netProfit,
      roiPct: bankrollGrowthPct,
      totalSpins,
      winCount: winsCount,
      goalMet: isGoalReached,
      stopLossHit: isStopLossHit,
      notes: sessionNotes || 'Sessão registrada pelo robô.',
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
                Gestão Financeira Diária
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Painel de Gestão e Projeção de Capital
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Monitore sua meta diária, limite de segurança (Stop Loss), retorno sobre o investimento (ROI), e mantenha um histórico de desempenho diário para crescer com disciplina.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSaveCurrentSession}
              className="px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center gap-2 shrink-0 hover:scale-[1.02]"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>Salvar Sessão de Hoje</span>
            </button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sessão diária salva com sucesso no histórico local!</span>
          </div>
        )}
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
        <div className={`bg-slate-900 border rounded-2xl p-4 space-y-1 shadow-lg ${
          netProfit >= 0 ? 'border-emerald-500/30' : 'border-rose-500/30'
        }`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lucro Líquido</span>
          <span className={`text-xl sm:text-2xl font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netProfit >= 0 ? '+' : ''}{config.currency} {netProfit.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 block">
            {totalSpins <= 100 ? 'Amostragem (1 a 100)' : `${activeSpinsCount} giros valendo`}
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
          <span className={`text-lg sm:text-xl font-black ${spinRiskPct > 10 ? 'text-rose-400' : spinRiskPct > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {spinRiskPct.toFixed(1)}% da Banca
          </span>
          <span className="text-[10px] text-slate-400 block truncate">
            {config.currency} {config.defaultSpinCost.toFixed(2)} por ficha
          </span>
        </div>
      </div>

      {/* Main Section: Daily Goal & Stop Loss Tracker */}
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

            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              isGoalReached 
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 animate-pulse'
                : 'bg-slate-800 text-amber-400 border border-slate-700'
            }`}>
              {isGoalReached ? '🎉 META ALCANÇADA!' : `${goalProgressPct.toFixed(1)}% Concluído`}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-baseline text-xs font-bold">
              <span className="text-slate-300">Lucro Atual: <strong className="text-emerald-400">{config.currency} {netProfit.toFixed(2)}</strong></span>
              <span className="text-slate-400">Alvo Diário: <strong className="text-amber-400">{config.currency} {goal.toFixed(2)}</strong></span>
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
              <span>Falta para bater a meta: <strong className="text-amber-300">{config.currency} {remainingToGoal.toFixed(2)}</strong></span>
              <span>Crescimento: <strong className="text-slate-200">+{((goal / config.initialBankroll) * 100).toFixed(0)}% da Banca</strong></span>
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Observações da Sessão de Hoje (Opcional):
            </label>
            <input
              type="text"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Ex: Operei na 2ª Dúzia e mantive foco no Stop Loss..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Stop Loss & Risk Safeguard Box */}
        <div className={`border rounded-3xl p-6 shadow-2xl space-y-5 transition-all ${
          isStopLossHit
            ? 'bg-rose-950/20 border-rose-800/80 ring-2 ring-rose-500/20'
            : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className={`p-2.5 rounded-2xl border ${
                isStopLossHit ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Proteção da Banca</span>
                <h3 className="text-lg font-black text-slate-100">Escudo de Limite de Perda (Stop Loss)</h3>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              isStopLossHit 
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 animate-pulse' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
            }`}>
              {isStopLossHit ? '🔴 STOP LOSS ATINGIDO' : '🟢 DENTRO DO SEGURO'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-baseline text-xs font-bold">
              <span className="text-slate-300">Limite Toleravel: <strong className="text-rose-400">-{config.currency} {stopLoss.toFixed(2)}</strong></span>
              <span className="text-slate-400">Folga de Segurança: <strong className="text-emerald-400">{config.currency} {remainingToStopLoss.toFixed(2)}</strong></span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <p className="text-xs text-slate-300 leading-relaxed">
                {isStopLossHit
                  ? '⚠️ Seu limite de perda de segurança foi atingido nesta sessão. O protocolo profissional determina encerrar as apostas e retornar apenas amanhã.'
                  : `Seu limite de Stop Loss está fixado em ${config.currency} ${stopLoss.toFixed(2)}. Isso representa uma proteção de ${((stopLoss / config.initialBankroll) * 100).toFixed(0)}% do seu capital inicial.`}
              </p>
            </div>

            {/* Quick Rules Checklist */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Regra da Gestão</span>
                <span className="text-xs font-bold text-slate-200">Máx 2% a 5% por Giro</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Stop Gain Sugerido</span>
                <span className="text-xs font-bold text-emerald-400">10% a 20% ao Dia</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compound Interest Multi-Day Calculator */}
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
              Resultado estimado ao final de {projectionDays} dias mantendo {projectionDailyGoalPct}% ao dia: <strong className="text-emerald-400 text-sm font-black">{config.currency} {compoundProjections[compoundProjections.length - 1]?.balance.toFixed(2)}</strong> (+{((compoundProjections[compoundProjections.length - 1]?.totalGain / config.initialBankroll) * 100).toFixed(0)}% de Lucro Acumulado!).
            </span>
          </div>
        </div>
      </div>

      {/* Saved Daily Sessions Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Histórico Guardado</span>
              <h3 className="text-lg font-black text-slate-100">Registro de Sessões Diárias Salvaguardadas</h3>
            </div>
          </div>

          <span className="text-xs text-slate-400 font-bold">
            {dailySessions.length} sessões gravadas
          </span>
        </div>

        {dailySessions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs italic">
            Nenhuma sessão registrada. Clique no botão "Salvar Sessão de Hoje" para gravar seus resultados diários.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Banca Inicial</th>
                  <th className="py-3 px-4">Banca Final</th>
                  <th className="py-3 px-4">Lucro Líquido</th>
                  <th className="py-3 px-4">ROI %</th>
                  <th className="py-3 px-4">Giros</th>
                  <th className="py-3 px-4">Meta Batida?</th>
                  <th className="py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {dailySessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-200">{s.date}</td>
                    <td className="py-3 px-4 text-slate-300">{config.currency} {s.initialBankroll.toFixed(2)}</td>
                    <td className="py-3 px-4 font-bold text-slate-100">{config.currency} {s.finalBankroll.toFixed(2)}</td>
                    <td className={`py-3 px-4 font-black ${s.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.netProfit >= 0 ? '+' : ''}{config.currency} {s.netProfit.toFixed(2)}
                    </td>
                    <td className={`py-3 px-4 font-bold ${s.roiPct >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                      {s.roiPct >= 0 ? '+' : ''}{s.roiPct.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-slate-300">{s.totalSpins} giros</td>
                    <td className="py-3 px-4">
                      {s.goalMet ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          Sim 🎉
                        </span>
                      ) : s.stopLossHit ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                          Stop Loss 🔴
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                          Em Andamento
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                        title="Excluir Registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
