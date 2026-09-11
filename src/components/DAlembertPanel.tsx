import React, { useState, useMemo } from 'react';
import {
  Scale,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Zap,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart3,
  Award,
  Layers,
  ArrowRight,
  Flame,
  Clock,
  Sparkles,
  Sliders,
  DollarSign,
  Compass,
  Play
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { SpinRecord, BankrollConfig } from '../types';
import {
  SimpleChanceType,
  detectDAlembertAlerts,
  runDAlembertSimulation,
  isRed,
  isBlack,
  isEven,
  isOdd,
  isHigh,
  isLow,
} from '../lib/dalembertStrategy';
import { getNumberColor } from '../lib/roulette';

interface DAlembertPanelProps {
  spins: SpinRecord[];
  config: BankrollConfig;
}

export const DAlembertPanel: React.FC<DAlembertPanelProps> = ({
  spins,
  config,
}) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'simulator' | 'guide' | 'matrix'>('radar');
  const [selectedChance, setSelectedChance] = useState<SimpleChanceType>('red');
  const [unitBet, setUnitBet] = useState<number>(() => {
    return config.defaultSpinCost ? Math.max(1, Math.round(config.defaultSpinCost / 5)) : 5.0;
  });

  // Cálculo de sequências recentes
  const lastSpin = spins.length > 0 ? spins[spins.length - 1] : null;
  const recentSpins = useMemo(() => spins.slice(-20), [spins]);

  // Alertas de Entrada
  const alerts = useMemo(() => {
    return detectDAlembertAlerts(spins, unitBet);
  }, [spins, unitBet]);

  // Simulação completa nos giros da mesa
  const simResult = useMemo(() => {
    return runDAlembertSimulation(spins, selectedChance, unitBet, config.initialBankroll);
  }, [spins, selectedChance, unitBet, config.initialBankroll]);

  // Estatísticas de Chances Simples nos últimos 50 giros
  const stats50 = useMemo(() => {
    const windowSpins = spins.slice(-50);
    const total = windowSpins.length;
    let r = 0, b = 0, z = 0;
    let ev = 0, od = 0;
    let hi = 0, lo = 0;

    windowSpins.forEach((s) => {
      if (s.numero === 0) z++;
      else {
        if (isRed(s.numero)) r++;
        if (isBlack(s.numero)) b++;
        if (isEven(s.numero)) ev++;
        if (isOdd(s.numero)) od++;
        if (isHigh(s.numero)) hi++;
        if (isLow(s.numero)) lo++;
      }
    });

    return {
      total,
      red: r,
      black: b,
      zero: z,
      even: ev,
      odd: od,
      high: hi,
      low: lo,
      redPct: total > 0 ? ((r / total) * 100).toFixed(1) : '0',
      blackPct: total > 0 ? ((b / total) * 100).toFixed(1) : '0',
      evenPct: total > 0 ? ((ev / total) * 100).toFixed(1) : '0',
      oddPct: total > 0 ? ((od / total) * 100).toFixed(1) : '0',
      highPct: total > 0 ? ((hi / total) * 100).toFixed(1) : '0',
      lowPct: total > 0 ? ((lo / total) * 100).toFixed(1) : '0',
    };
  }, [spins]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border-2 border-sky-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-sky-500 text-slate-950 font-black text-xs uppercase rounded-xl shadow-md flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" /> Guia & Radar Exclusivo
              </span>
              <span className="px-3 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-bold rounded-xl">
                Jean le Rond d'Alembert (Século XVIII)
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-xl">
                🛡️ Progressão Aritmética Segura (+1 / -1)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Método D'Alembert — Progressão Piramidal</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              O sistema matemático que substitui a perigosa Martingale: <strong>nunca dobra as fichas</strong>. Ao perder, soma apenas <strong>+1 ficha</strong>. Ao ganhar, diminui <strong>-1 ficha</strong>. O radar identifica automaticamente os pontos de entrada ideais após sequências de descompressão.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center shrink-0 min-w-[130px] flex-1 sm:flex-initial">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Lucro no Histórico</span>
              <span className={`text-xl font-black ${simResult.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {simResult.netProfit >= 0 ? '+' : ''}{config.currency} {simResult.netProfit.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {simResult.winCount}G / {simResult.lossCount}R ({simResult.winRatePct.toFixed(1)}%)
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center shrink-0 min-w-[130px] flex-1 sm:flex-initial">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Máxima Ficha Atingida</span>
              <span className="text-xl font-black text-amber-400">
                {simResult.maxUnitReached}x ({config.currency} {(simResult.maxUnitReached * unitBet).toFixed(2)})
              </span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">
                Sem risco explosivo
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 mt-6 pt-5 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'radar'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/30'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Radar de Entradas & Alertas ({alerts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/30'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Simulador & Gráfico de Saldo</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/30'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Termômetro de Chances Simples</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/30'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Guia Passo a Passo & Comparativo</span>
          </button>
        </div>
      </div>

      {/* TAB 1: RADAR DE ENTRADAS & ALERTAS ATIVOS */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          {/* Card de Alerta Principal */}
          {alerts.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <span>Alertas de Entrada Detectados na Mesa ({alerts.length})</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Baseado nas sequências e tendências atuais da roleta
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.map((al) => (
                  <div
                    key={al.id}
                    className="bg-slate-900 border-2 border-sky-500/60 rounded-3xl p-5 shadow-xl space-y-4 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping"></span>
                        <span className="text-xs font-black text-sky-400 uppercase tracking-wider">
                          {al.badge}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-sky-500 text-slate-950 text-[10px] font-black uppercase rounded-full">
                        {al.confidencePct}% Assertividade Teórica
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-lg font-black text-white">{al.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{al.description}</p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">Entrada Recomendada:</span>
                        <span className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          {al.recommendedBet}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs">
                        <span className="text-slate-400">Valor da 1ª Ficha:</span>
                        <span className="font-black text-white">
                          {config.currency} {unitBet.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
                        <span>Se RED: Próxima será</span>
                        <span className="font-bold text-rose-400">
                          {config.currency} {(unitBet * 2).toFixed(2)} (+1 ficha)
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
                        <span>Se GREEN: Próxima será</span>
                        <span className="font-bold text-emerald-400">
                          {config.currency} {unitBet.toFixed(2)} (volta à base)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-white">
                Mesa em Equilíbrio Térmico (Aguardando Ponto de Entrada)
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Nenhuma sequência longa de 3 ou mais rodadas opostas consecutivas foi registrada no momento. Continue lançando giros para o radar identificar o gatilho perfeito de entrada.
              </p>
            </div>
          )}

          {/* Fita de Últimos Giros e Status de Chances Simples */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Últimos Giros Registrados & Cores
              </span>
              <span className="text-[11px] text-slate-500">
                (Último número: <strong className="text-white">{lastSpin ? lastSpin.numero : '-'}</strong>)
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
              {recentSpins.map((s) => {
                const color = getNumberColor(s.numero);
                return (
                  <div
                    key={s.id}
                    className={`shrink-0 w-9 h-9 rounded-xl font-mono font-black text-xs flex flex-col items-center justify-center shadow-md border ${
                      color === 'red'
                        ? 'bg-rose-600 text-white border-rose-400'
                        : color === 'black'
                        ? 'bg-slate-900 text-slate-100 border-slate-700'
                        : 'bg-emerald-600 text-white border-emerald-400'
                    }`}
                  >
                    <span>{s.numero}</span>
                    <span className="text-[8px] opacity-70">
                      {s.numero === 0 ? 'Z' : isEven(s.numero) ? 'P' : 'I'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SIMULADOR & BACKTEST AO VIVO */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          {/* Controles de Configuração do Simulador */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-sky-400" />
                  <span>Configurar Alvo do D'Alembert</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Escolha qual chance simples deseja simular giro a giro na mesa atual
                </p>
              </div>

              {/* Valor da Ficha Base */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Ficha Base (1 Unidade):</span>
                <div className="flex items-center gap-1">
                  {[2.5, 5, 10, 20].map((val) => (
                    <button
                      key={val}
                      onClick={() => setUnitBet(val)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                        unitBet === val
                          ? 'bg-sky-500 text-slate-950 font-extrabold shadow'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {config.currency} {val.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Seletor de Chance */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 border-t border-slate-800">
              {[
                { id: 'red', label: '🔴 Vermelho (Red)' },
                { id: 'black', label: '⚫ Preto (Black)' },
                { id: 'even', label: '🔢 Par (Even)' },
                { id: 'odd', label: '🔣 Ímpar (Odd)' },
                { id: 'high', label: '📈 Altas (19-36)' },
                { id: 'low', label: '📉 Baixas (1-18)' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedChance(opt.id as SimpleChanceType)}
                  className={`p-3 rounded-2xl text-xs font-black transition-all border text-center ${
                    selectedChance === opt.id
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-lg shadow-sky-500/20'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gráfico de Evolução de Saldo */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Curva de Patrimônio do D'Alembert ({simResult.steps.length} Rodadas)</span>
                </h4>
                <span className="text-xs text-slate-400">
                  Saldo Inicial: {config.currency} {config.initialBankroll.toFixed(2)} ➔ Saldo Final: {config.currency} {simResult.finalBalance.toFixed(2)}
                </span>
              </div>
              <span className={`text-base font-black ${simResult.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {simResult.netProfit >= 0 ? '+' : ''}{config.currency} {simResult.netProfit.toFixed(2)}
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simResult.chartData}>
                  <defs>
                    <linearGradient id="colorDalembert" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="spinIndex" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    formatter={(value: any) => [`${config.currency} ${Number(value).toFixed(2)}`, 'Saldo']}
                    labelFormatter={(label) => `Giro #${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#38bdf8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorDalembert)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabela dos Últimos 10 Giros da Simulação */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider">
              Últimas 10 Rodadas do D'Alembert (Execução Giro a Giro)
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-slate-400">
                    <th className="py-2 px-3">Giro</th>
                    <th className="py-2 px-3">Número</th>
                    <th className="py-2 px-3">Aposta</th>
                    <th className="py-2 px-3">Fichas</th>
                    <th className="py-2 px-3">Valor Apostado</th>
                    <th className="py-2 px-3">Resultado</th>
                    <th className="py-2 px-3 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {simResult.steps.slice(-10).map((st) => (
                    <tr key={st.spinIndex} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-slate-300">#{st.spinIndex}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-black text-xs ${
                          getNumberColor(st.numero) === 'red'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : getNumberColor(st.numero) === 'black'
                            ? 'bg-slate-800 text-slate-200 border border-slate-700'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {st.numero}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans font-bold text-slate-300">{st.betPlacedOn}</td>
                      <td className="py-2.5 px-3 font-black text-amber-400">{st.unitMultiplier}x</td>
                      <td className="py-2.5 px-3 text-slate-200">
                        {config.currency} {st.betAmount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                          st.outcome === 'GREEN'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                            : 'bg-rose-950 text-rose-300 border border-rose-500/50'
                        }`}>
                          {st.outcome === 'GREEN' ? `+${config.currency} ${st.netResult.toFixed(2)} (Diminui -1)` : `-${config.currency} ${Math.abs(st.netResult).toFixed(2)} (Sobe +1)`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-white">
                        {config.currency} {st.balance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TERMÔMETRO DE CHANCES SIMPLES */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Vermelho vs Preto */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-xs font-black uppercase text-slate-300">Cores (Vermelho x Preto)</h4>
                <span className="text-[10px] text-slate-400">Últimos {stats50.total} giros</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-rose-400">🔴 Vermelho ({stats50.red})</span>
                    <span className="font-black text-rose-400">{stats50.redPct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${stats50.redPct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-300">⚫ Preto ({stats50.black})</span>
                    <span className="font-black text-slate-300">{stats50.blackPct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-slate-600 h-full rounded-full" style={{ width: `${stats50.blackPct}%` }}></div>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
                  Zero registrado: <strong className="text-emerald-400">{stats50.zero}x</strong>
                </div>
              </div>
            </div>

            {/* Par vs Ímpar */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-xs font-black uppercase text-slate-300">Paridade (Par x Ímpar)</h4>
                <span className="text-[10px] text-slate-400">Últimos {stats50.total} giros</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-sky-400">🔢 Par ({stats50.even})</span>
                    <span className="font-black text-sky-400">{stats50.evenPct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-sky-500 h-full rounded-full" style={{ width: `${stats50.evenPct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-indigo-400">🔣 Ímpar ({stats50.odd})</span>
                    <span className="font-black text-indigo-400">{stats50.oddPct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${stats50.oddPct}%` }}></div>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
                  Diferença: <strong className="text-white">{Math.abs(stats50.even - stats50.odd)} rodadas</strong>
                </div>
              </div>
            </div>

            {/* Altas vs Baixas */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-xs font-black uppercase text-slate-300">Metades (Altas x Baixas)</h4>
                <span className="text-[10px] text-slate-400">Últimos {stats50.total} giros</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-amber-400">📈 Altas 19-36 ({stats50.high})</span>
                    <span className="font-black text-amber-400">{stats50.highPct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${stats50.highPct}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-emerald-400">📉 Baixas 1-18 ({stats50.low})</span>
                    <span className="font-black text-emerald-400">{stats50.lowPct}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats50.lowPct}%` }}></div>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
                  Tendência: <strong className="text-amber-300">{stats50.high >= stats50.low ? 'Altas Dominantes' : 'Baixas Dominantes'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GUIA PASSO A PASSO & COMPARATIVO COM MARTINGALE */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-sky-400" />
              <span>Como Funciona o Sistema D'Alembert na Prática</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-black text-xs border border-sky-500/40">
                  1
                </span>
                <h4 className="text-sm font-black text-white">Comece com 1 Unidade</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Defina o valor base da ficha (ex: R$ 5,00) e aposte em uma chance simples (Vermelho, Preto, Par, Ímpar, Altas ou Baixas).
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-xs border border-rose-500/40">
                  2
                </span>
                <h4 className="text-sm font-black text-white">Se der RED: Some +1 Ficha</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Diferente do Martingale (que dobra), você soma apenas +1 ficha base: 1 ➔ 2 ➔ 3 ➔ 4 ➔ 5. A banca é preservada.
                </p>
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs border border-emerald-500/40">
                  3
                </span>
                <h4 className="text-sm font-black text-white">Se der GREEN: Reduza -1 Ficha</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ao acertar, diminua a aposta em 1 ficha: de 4 ➔ 3, de 3 ➔ 2, até retornar à aposta base de 1 ficha com lucro no bolso.
                </p>
              </div>
            </div>

            {/* Comparativo Prático D'Alembert vs Martingale */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h4 className="text-sm font-black uppercase text-amber-400 tracking-wider">
                Comparativo em uma Sequência de 10 Reds Consecutivos
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-slate-400">
                      <th className="py-2.5 px-3">Sistema</th>
                      <th className="py-2.5 px-3">Progressão das Fichas</th>
                      <th className="py-2.5 px-3">Aposta no 10º Giro</th>
                      <th className="py-2.5 px-3">Prejuízo Total Acumulado</th>
                      <th className="py-2.5 px-3">Risco de Quebra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    <tr className="bg-rose-950/20">
                      <td className="py-3 px-3 font-sans font-black text-rose-400">Martingale</td>
                      <td className="py-3 px-3 text-slate-300">1, 2, 4, 8, 16, 32, 64, 128, 256, 512</td>
                      <td className="py-3 px-3 font-black text-rose-400">512 fichas</td>
                      <td className="py-3 px-3 font-black text-rose-400">-1.023 fichas 💥</td>
                      <td className="py-3 px-3 font-sans font-bold text-rose-400">Crítico / Quebra de Banca</td>
                    </tr>
                    <tr className="bg-emerald-950/20">
                      <td className="py-3 px-3 font-sans font-black text-emerald-400">D'Alembert</td>
                      <td className="py-3 px-3 text-slate-300">1, 2, 3, 4, 5, 6, 7, 8, 9, 10</td>
                      <td className="py-3 px-3 font-black text-emerald-400">10 fichas</td>
                      <td className="py-3 px-3 font-black text-emerald-400">-55 fichas 🛡️</td>
                      <td className="py-3 px-3 font-sans font-bold text-emerald-400">Controlado e Seguro</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
