import React, { useState, useMemo } from 'react';
import {
  Shield,
  TrendingUp,
  Award,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart3,
  Layers,
  ArrowRight,
  Flame,
  Clock,
  Sparkles,
  Sliders,
  DollarSign,
  Compass,
  Play,
  Crosshair,
  Percent
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
  detectJamesBondAlerts,
  runJamesBondSimulation,
  JAMES_BOND_HIGH_NUMBERS,
  JAMES_BOND_SIXLINE_NUMBERS,
  JAMES_BOND_UNCOVERED_LOW_NUMBERS,
  JAMES_BOND_TOTAL_COVERAGE_COUNT,
  JAMES_BOND_COVERAGE_PCT,
  getJamesBondZone,
} from '../lib/jamesBondStrategy';
import { getNumberColor } from '../lib/roulette';

interface JamesBondPanelProps {
  spins: SpinRecord[];
  config: BankrollConfig;
}

export const JamesBondPanel: React.FC<JamesBondPanelProps> = ({
  spins,
  config,
}) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'simulator' | 'guide' | 'matrix'>('radar');
  const [chipValue, setChipValue] = useState<number>(() => {
    return config.defaultSpinCost ? Math.max(0.25, Number((config.defaultSpinCost / 20).toFixed(2))) : 0.50;
  });

  const totalBetPerSpin = 20 * chipValue;

  // Alertas
  const alerts = useMemo(() => {
    return detectJamesBondAlerts(spins, chipValue);
  }, [spins, chipValue]);

  // Simulação completa
  const simResult = useMemo(() => {
    return runJamesBondSimulation(spins, chipValue, config.initialBankroll);
  }, [spins, chipValue, config.initialBankroll]);

  // Estatísticas de Zonas James Bond nos últimos 50 giros
  const stats50 = useMemo(() => {
    const windowSpins = spins.slice(-50);
    const total = windowSpins.length;
    let high = 0, six = 0, zero = 0, miss = 0;

    windowSpins.forEach((s) => {
      const zone = getJamesBondZone(s.numero);
      if (zone === 'HIGH') high++;
      else if (zone === 'SIX_LINE') six++;
      else if (zone === 'ZERO') zero++;
      else miss++;
    });

    const coveredWins = high + six + zero;
    const coveredWinRate = total > 0 ? ((coveredWins / total) * 100).toFixed(1) : '0';

    return {
      total,
      high,
      six,
      zero,
      miss,
      coveredWins,
      coveredWinRate,
    };
  }, [spins]);

  // Últimos giros detalhados com indicação se foi vitória da James Bond
  const recentSteps = useMemo(() => {
    return simResult.steps.slice(-15).reverse();
  }, [simResult.steps]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner com Identidade Visual James Bond */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs uppercase rounded-lg shadow-md tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Estratégia James Bond 007
              </span>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase rounded">
                Alta Cobertura 67.5% (25 Números)
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase rounded">
                Sem Dobras / Fichas Fixas
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
              <span>Guia & Radar James Bond (007)</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Criada por Ian Fleming, esta consagrada estratégia divide exatamente <strong>20 fichas</strong> em 3 frentes de aposta:{' '}
              <strong className="text-amber-300">14 fichas nas Altas (19-36)</strong>,{' '}
              <strong className="text-sky-300">5 fichas na Seisena (13-18)</strong> e{' '}
              <strong className="text-emerald-300">1 ficha de seguro no Zero (0)</strong>. Você cobre 25 dos 37 números da roleta com lucros calibrados por zona.
            </p>
          </div>

          {/* Card de Configuração Rápida de Ficha */}
          <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 min-w-[260px] space-y-3 shrink-0 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" /> Valor por Ficha:
              </span>
              <span className="text-xs font-black text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                {config.currency} {chipValue.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[0.25, 0.50, 1.00, 2.50].map((val) => (
                <button
                  key={val}
                  onClick={() => setChipValue(val)}
                  className={`py-1 text-[11px] font-black rounded-lg transition-all ${
                    chipValue === val
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {val.toFixed(2)}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Aposta Total (20 fichas):</span>
              <span className="text-white font-extrabold text-xs">
                {config.currency} {totalBetPerSpin.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Abas Internas da Estratégia */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 mt-6 border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'radar'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Radar & Alertas</span>
            {alerts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Simulador & Curva ({spins.length} Giros)</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Guia Oficial 007 & Regras</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Matriz de Pagamentos</span>
          </button>
        </div>
      </div>

      {/* ABA 1: RADAR & ALERTAS */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          {/* Cards de Alertas Ativos */}
          {alerts.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase text-amber-400 tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Alertas de Entrada Detectados ({alerts.length})</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Baseado no histórico real de {spins.length} giros
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.map((alt) => (
                  <div
                    key={alt.id}
                    className="bg-slate-900 border-2 border-amber-500/70 rounded-3xl p-5 shadow-xl space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase rounded">
                        {alt.badge}
                      </span>
                      <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 text-xs font-black uppercase rounded">
                        Confiança {alt.confidencePct}%
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-white">{alt.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {alt.description}
                      </p>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                      <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                        {alt.recommendedAction}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {alt.distributionText}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-center space-y-2">
              <Compass className="w-8 h-8 text-slate-600 mx-auto animate-spin" />
              <h4 className="text-sm font-black text-slate-300 uppercase tracking-wider">
                Radar James Bond Ativo
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                O radar monitora repetições de números baixos não cobertos (1-12) e momento de altas (19-36). Insira mais giros para receber notificações de entrada.
              </p>
            </div>
          )}

          {/* Distribuição das Zonas nos Últimos 50 Giros */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-black uppercase text-slate-200 tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>Termômetro das 4 Zonas nos Últimos {stats50.total} Giros</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Taxa de Sucesso Coberta:</span>
                <span className={`text-xs font-black px-2 py-0.5 rounded ${
                  Number(stats50.coveredWinRate) >= 65
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {stats50.coveredWinRate}% ({stats50.coveredWins}/{stats50.total})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Zona 1: Altas (19-36) */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-300">Altas (19-36)</span>
                  <span className="text-[10px] font-bold text-slate-400">14 Fichas</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {stats50.high}{' '}
                  <span className="text-xs text-slate-400 font-normal">
                    ({stats50.total > 0 ? ((stats50.high / stats50.total) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="text-[11px] text-emerald-400 font-bold">
                  Retorno: +8 Fichas (+{config.currency} {(8 * chipValue).toFixed(2)})
                </div>
                <div className="text-[10px] text-slate-500">18 números cobertos (48.6%)</div>
              </div>

              {/* Zona 2: Seisena (13-18) */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-sky-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-sky-300">Seisena (13-18)</span>
                  <span className="text-[10px] font-bold text-slate-400">5 Fichas</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {stats50.six}{' '}
                  <span className="text-xs text-slate-400 font-normal">
                    ({stats50.total > 0 ? ((stats50.six / stats50.total) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="text-[11px] text-emerald-400 font-bold">
                  Retorno: +10 Fichas (+{config.currency} {(10 * chipValue).toFixed(2)})
                </div>
                <div className="text-[10px] text-slate-500">6 números cobertos (16.2%)</div>
              </div>

              {/* Zona 3: Zero (0) */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-emerald-300">Seguro no Zero (0)</span>
                  <span className="text-[10px] font-bold text-slate-400">1 Ficha</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {stats50.zero}{' '}
                  <span className="text-xs text-slate-400 font-normal">
                    ({stats50.total > 0 ? ((stats50.zero / stats50.total) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="text-[11px] text-emerald-400 font-bold">
                  Retorno: +16 Fichas (+{config.currency} {(16 * chipValue).toFixed(2)})
                </div>
                <div className="text-[10px] text-slate-500">1 número (2.7%) paga 35:1</div>
              </div>

              {/* Zona 4: Descoberta (1-12) */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-rose-300">Baixas (1-12)</span>
                  <span className="text-[10px] font-bold text-rose-400">Descoberta</span>
                </div>
                <div className="text-2xl font-black text-rose-400">
                  {stats50.miss}{' '}
                  <span className="text-xs text-slate-400 font-normal">
                    ({stats50.total > 0 ? ((stats50.miss / stats50.total) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="text-[11px] text-rose-400 font-bold">
                  Perda: -20 Fichas (-{config.currency} {(20 * chipValue).toFixed(2)})
                </div>
                <div className="text-[10px] text-slate-500">12 números sem aposta (32.4%)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: SIMULADOR & CURVA */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          {/* Métricas Principais do Backtest */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Lucro Líquido</span>
              <div className={`text-lg font-black ${simResult.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {simResult.netProfit >= 0 ? '+' : ''}{config.currency} {simResult.netProfit.toFixed(2)}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Assertividade</span>
              <div className="text-lg font-black text-white">
                {simResult.winRatePct.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500">
                {simResult.winCount}W / {simResult.lossCount}L
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Saldo Final</span>
              <div className="text-lg font-black text-amber-400">
                {config.currency} {simResult.finalBalance.toFixed(2)}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Max Win Streak</span>
              <div className="text-lg font-black text-emerald-400">
                {simResult.maxConsecutiveWins}x
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Max Red Streak</span>
              <div className="text-lg font-black text-rose-400">
                {simResult.maxConsecutiveLosses}x
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Max Drawdown</span>
              <div className="text-lg font-black text-rose-400">
                {config.currency} {simResult.maxDrawdown.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Gráfico de Evolução de Saldo */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-black uppercase text-slate-200 tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Curva de Evolução da Banca com James Bond 007</span>
              </h3>
              <span className="text-xs text-slate-400">
                {spins.length} giros avaliados
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simResult.chartData}>
                  <defs>
                    <linearGradient id="bondGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="spinIndex" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                    formatter={(val: any) => [`${config.currency} ${Number(val).toFixed(2)}`, 'Saldo']}
                    labelFormatter={(l) => `Giro #${l}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#bondGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabela dos Últimos 15 Giros com Detalhamento de Ganhos */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-black uppercase text-slate-200 tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Últimos Giros e Pagamentos por Zona</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-black">
                    <th className="py-2 px-3">Giro</th>
                    <th className="py-2 px-3">Número</th>
                    <th className="py-2 px-3">Zona Sorteada</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Resultado Líquido</th>
                    <th className="py-2 px-3">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentSteps.map((step) => {
                    const color = getNumberColor(step.numero);
                    return (
                      <tr key={step.spinIndex} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 font-mono text-slate-400">#{step.spinIndex}</td>
                        <td className="py-2 px-3">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ${
                            color === 'green'
                              ? 'bg-emerald-500 text-slate-950'
                              : color === 'red'
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-950 text-white border border-slate-700'
                          }`}>
                            {step.numero}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold">
                          {step.winningZone === 'HIGH' && (
                            <span className="text-amber-300">Altas (19-36)</span>
                          )}
                          {step.winningZone === 'SIX_LINE' && (
                            <span className="text-sky-300">Seisena (13-18)</span>
                          )}
                          {step.winningZone === 'ZERO' && (
                            <span className="text-emerald-300">Seguro no Zero (0)</span>
                          )}
                          {step.winningZone === 'MISS_LOW' && (
                            <span className="text-rose-400">Baixas (1-12) Não Coberto</span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-black">
                          {step.outcome === 'WIN' ? (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded text-[10px]">
                              GREEN
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded text-[10px]">
                              RED
                            </span>
                          )}
                        </td>
                        <td className={`py-2 px-3 font-black ${
                          step.netResult > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {step.netResult > 0 ? '+' : ''}{config.currency} {step.netResult.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-200">
                          {config.currency} {step.balance.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: GUIA OFICIAL */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black uppercase text-amber-400 tracking-wide flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Princípios e Filosofia da Estratégia James Bond</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center border border-amber-500/30">
                  1
                </span>
                <h4 className="text-sm font-black text-white">Cobertura Ampla de 25 Números</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Cobre 67.57% do cilindro europeu. Apenas 12 números (1 ao 12) representam perda. Em 2 de cada 3 rodadas na média teórica, a aposta gera retorno positivo.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="w-7 h-7 rounded-xl bg-sky-500/20 text-sky-400 font-black text-xs flex items-center justify-center border border-sky-500/30">
                  2
                </span>
                <h4 className="text-sm font-black text-white">Três Frentes Simultâneas</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Combina aposta externa de menor volatilidade (Altas 19-36), aposta interna de seisena intermediária (13-18) e aposta cheia com proteção máxima no Zero (0).
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/30">
                  3
                </span>
                <h4 className="text-sm font-black text-white">Controle de Banca Fixo</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Não requer dobrar agressivamente como o Martingale. Você aposta 20 fichas por entrada e recolhe os lucros conforme as zonas são sorteadas.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black uppercase text-slate-200 tracking-wide flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Regras de Ouro e Dicas de Operação</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold">Momento de Entrada (Timing do Radar):</strong>
                  <p className="text-slate-400 mt-0.5">
                    O ponto de maior eficácia é entrar após 2 ou 3 números baixos consecutivos (1 a 12). A probabilidade condicional de a bola continuar presa nas 12 primeiras casas diminui, favorecendo as zonas 13-36 e 0.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold">Meta Diária (Take Profit Rápido):</strong>
                  <p className="text-slate-400 mt-0.5">
                    Como a estratégia ganha com frequência, o objetivo ideal é acumular entre 20 a 50 fichas de lucro líquido e pausar a sessão, evitando a reversão à média natural da vantagem da casa.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-bold">Stop Loss Rigoroso:</strong>
                  <p className="text-slate-400 mt-0.5">
                    Cada red consome 20 fichas. Se ocorrerem 2 ou 3 reds seguidos (sequência na 1ª dúzia), pare imediatamente e espere o radar identificar nova descompressão.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: MATRIZ DE PAGAMENTOS */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black uppercase text-slate-200 tracking-wide flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <span>Matriz Detalhada das Apostas e Pagamentos (Base 20 Fichas)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-black">
                    <th className="py-3 px-3">Setor Apostado</th>
                    <th className="py-3 px-3">Números Cobertos</th>
                    <th className="py-3 px-3">Fichas Investidas</th>
                    <th className="py-3 px-3">Pagamento Bruto</th>
                    <th className="py-3 px-3">Lucro Líquido</th>
                    <th className="py-3 px-3">Probabilidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-bold text-amber-300">Números Altos (19 ao 36)</td>
                    <td className="py-3 px-3 font-mono text-slate-300">19, 20, 21, ..., 36 (18 números)</td>
                    <td className="py-3 px-3 font-bold text-white">14 fichas ({config.currency} {(14 * chipValue).toFixed(2)})</td>
                    <td className="py-3 px-3 font-bold text-white">28 fichas ({config.currency} {(28 * chipValue).toFixed(2)})</td>
                    <td className="py-3 px-3 font-black text-emerald-400">+8 fichas (+{config.currency} {(8 * chipValue).toFixed(2)})</td>
                    <td className="py-3 px-3 font-mono text-slate-400">48.65%</td>
                  </tr>

                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-bold text-sky-300">Seisena (Linha 13 ao 18)</td>
                    <td className="py-3 px-3 font-mono text-slate-300">13, 14, 15, 16, 17, 18 (6 números)</td>
                    <td className="py-3 px-3 font-bold text-white">5 fichas ({config.currency} {(5 * chipValue).toFixed(2)})</td>
                    <td className="py-3 px-3 font-bold text-white">30 fichas ({config.currency} {(30 * chipValue).toFixed(2)})</td>
                    <td className="py-3 px-3 font-black text-emerald-400">+10 fichas (+{config.currency} {(10 * chipValue).toFixed(2)})</td>
                    <td className="py-3 px-3 font-mono text-slate-400">16.22%</td>
                  </tr>

                  <tr className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-bold text-emerald-300">Pleno no Zero (0)</td>
                    <td className="py-3 px-3 font-mono text-slate-300">0 (1 número)</td>
                    <td className="py-3 px-3 font-bold text-white">1 ficha ({config.currency} {(1 * chipValue).toFixed(2)})</td>
                    <td className="py-3 px-3 font-bold text-white">36 fichas ({config.currency} {(36 * chipValue).toFixed(2)})</td>
                    <td className="py-3 px-3 font-black text-emerald-400">+16 fichas (+{config.currency} {(16 * chipValue).toFixed(2)})</td>
                    <td className="py-3 px-3 font-mono text-slate-400">2.70%</td>
                  </tr>

                  <tr className="hover:bg-slate-800/30 bg-rose-950/20">
                    <td className="py-3 px-3 font-bold text-rose-400">Números Baixos (1 ao 12) - RED</td>
                    <td className="py-3 px-3 font-mono text-slate-400">1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 (12 números)</td>
                    <td className="py-3 px-3 font-bold text-slate-400">0 fichas (Descoberto)</td>
                    <td className="py-3 px-3 font-bold text-rose-400">0</td>
                    <td className="py-3 px-3 font-black text-rose-400">-20 fichas (-{config.currency} {(20 * chipValue).toFixed(2)})</td>
                    <td className="py-3 px-3 font-mono text-slate-400">32.43%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-slate-200">
                  Total Coberto: 25 Números (67.57% de Probabilidade de Acerto)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="text-xs font-bold text-slate-400">
                  Total Descoberto: 12 Números (32.43% de Probabilidade de Perda)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
