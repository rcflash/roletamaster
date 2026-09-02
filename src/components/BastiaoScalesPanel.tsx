import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Flame,
  Target,
  TrendingUp,
  Clock,
  Play,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Dices,
  RefreshCw,
  HelpCircle,
  BarChart3,
  ShieldCheck,
  Zap,
  ArrowRight,
  Eye,
  Info,
  Award,
  BookOpen,
  Calculator,
  Compass,
  FileSpreadsheet
} from 'lucide-react';
import { SpinRecord, BankrollConfig } from '../types';
import { getNumberColor } from '../lib/roulette';
import {
  BASTIAO_VIDEO_TIMELINE,
  CAMOUFLAGED_PROPERTIES_TABLE,
  detectBastiaoScalePatterns,
  runBastiaoScalesBacktest,
  getPureNumbersForTerminal,
  get1Neighbors,
  VideoTimelineMoment,
  DetectedScalePattern
} from '../lib/bastiaoScalesStrategy';

interface BastiaoScalesPanelProps {
  spins: SpinRecord[];
  config: BankrollConfig;
}

export const BastiaoScalesPanel: React.FC<BastiaoScalesPanelProps> = ({
  spins,
  config
}) => {
  const [activeTab, setActiveTab] = useState<'radar' | 'timeline' | 'calculator' | 'backtest' | 'manual'>('radar');
  const [selectedMomentId, setSelectedMomentId] = useState<string>('t-05');
  const [selectedCalcNumber, setSelectedCalcNumber] = useState<number>(28);
  const [chipValue, setChipValue] = useState<number>(2.5);

  const lastSpin = spins.length > 0 ? spins[spins.length - 1] : null;
  const recentSpins10 = useMemo(() => spins.slice(-10), [spins]);

  // Alertas detectados na sessão atual
  const detectedPatterns = useMemo(() => {
    return detectBastiaoScalePatterns(spins);
  }, [spins]);

  // Backtest
  const backtestStats = useMemo(() => {
    return runBastiaoScalesBacktest(spins, chipValue);
  }, [spins, chipValue]);

  // Momento selecionado do vídeo
  const activeMoment = useMemo(() => {
    return BASTIAO_VIDEO_TIMELINE.find((m) => m.id === selectedMomentId) || BASTIAO_VIDEO_TIMELINE[0];
  }, [selectedMomentId]);

  // Propriedades do número na calculadora
  const calcNumberProp = useMemo(() => {
    return CAMOUFLAGED_PROPERTIES_TABLE[selectedCalcNumber] || CAMOUFLAGED_PROPERTIES_TABLE[0];
  }, [selectedCalcNumber]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Banner de Destaque Superior */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Nova Estratégia do Bastião
              </span>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold text-xs rounded-lg">
                Soma & Subtração de Dígitos (|D₂ - D₁|)
              </span>
              <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold text-xs rounded-lg">
                Escala 4 ➔ 5 ➔ 28(6) ➔ 7 ➔ 8
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Escalas Alternadas & Camuflados por Subtração
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Transcrição completa e algoritmo em tempo real baseado no vídeo oficial do Bastião: leitura de escalas crescentes/decrescentes, alternância de ímpares e o revolucionário cálculo de <strong className="text-amber-300">números camuflados por subtração de dígitos</strong> (ex: <code className="text-emerald-400 font-bold">28 = 8 - 2 = 6</code>).
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-300 text-lg">
              28
            </div>
            <div className="text-xs">
              <div className="text-slate-400 font-medium">O Segredo do Vídeo:</div>
              <div className="text-white font-bold">8 - 2 = <span className="text-emerald-400 font-black">6 (Terminal 6)</span></div>
              <div className="text-[11px] text-indigo-300">Completa a escala 4, 5, 6, 7 ➔ Volta o 8!</div>
            </div>
          </div>
        </div>

        {/* Navegação por Sub-abas */}
        <div className="flex flex-wrap items-center gap-2 pt-6 mt-6 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'radar'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Radar em Tempo Real ({detectedPatterns.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'timeline'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Momento a Minuto do Vídeo</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'calculator'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Calculadora Visual (Soma vs Subtração)</span>
          </button>

          <button
            onClick={() => setActiveTab('backtest')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'backtest'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Backtest na Sessão ({backtestStats.winRatePct.toFixed(0)}% Win)</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'manual'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Manual & Regras de Ouro</span>
          </button>
        </div>
      </div>

      {/* ABA 1: RADAR EM TEMPO REAL */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          {/* Status dos Giros Recentes */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Últimos Giros na Mesa com Análise de Dígitos
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Total de giros: {spins.length}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {recentSpins10.map((spin, idx) => {
                const prop = CAMOUFLAGED_PROPERTIES_TABLE[spin.numero];
                const isLatest = idx === recentSpins10.length - 1;
                return (
                  <div
                    key={spin.id || idx}
                    className={`p-2.5 rounded-xl border flex flex-col items-center min-w-[76px] shrink-0 transition-all ${
                      isLatest
                        ? 'bg-amber-950/60 border-amber-500 shadow-md shadow-amber-500/20 scale-105'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 font-mono">#{spin.giro}</span>
                    <span
                      className={`text-base font-black px-2 py-0.5 rounded my-1 ${
                        spin.color === 'red'
                          ? 'bg-red-600 text-white'
                          : spin.color === 'black'
                          ? 'bg-slate-800 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {spin.numero}
                    </span>
                    <div className="text-[10px] font-bold text-center space-y-0.5 text-slate-400">
                      <div>T: <span className="text-slate-200">{spin.numero % 10}</span></div>
                      {prop && spin.numero >= 10 && (
                        <>
                          <div className="text-amber-400 font-mono">+{prop.sumValue}</div>
                          <div className="text-emerald-400 font-mono">-{prop.subtractionValue}</div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alertas Detectados */}
          {detectedPatterns.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase text-amber-400 tracking-wider flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>Padrões de Escala Ativos Identificados pelo Algoritmo</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detectedPatterns.map((pat) => (
                  <div
                    key={pat.id}
                    className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black uppercase rounded">
                          Confiança: {pat.confidencePct}%
                        </span>
                        <h4 className="text-base font-black text-white mt-1.5">{pat.title}</h4>
                      </div>
                      <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/40 text-amber-400">
                        <Target className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Sequência Encontrada */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Leitura da Sequência:</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {pat.sequenceFound.map((item, i) => (
                          <React.Fragment key={i}>
                            <div className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <span className="text-amber-400">{item.num}</span>
                              <span className="text-[10px] text-slate-400">➔</span>
                              <span className="text-emerald-400 font-mono font-black">{item.effectiveDigit}</span>
                            </div>
                            {i < pat.sequenceFound.length - 1 && (
                              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-300 italic pt-1">{pat.reason}</p>
                    </div>

                    {/* Números Alvos e Cobertura */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase">Aposta Recomendada:</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {pat.targetNumbers.map((num) => (
                          <span
                            key={num}
                            className="px-3 py-1 bg-emerald-950 border border-emerald-500 text-emerald-300 font-black text-sm rounded-lg shadow-sm"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                      {pat.protectionNumbers.length > 0 && (
                        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                          <span className="font-bold text-slate-300">Proteções:</span>
                          {pat.protectionNumbers.map((p) => (
                            <span key={p} className="px-2 py-0.5 bg-slate-950 border border-slate-700 rounded text-slate-300 font-mono">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 font-bold">
                      💡 {pat.suggestedAction}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <Compass className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">Aguardando Formação de Nova Escala</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                O radar analisa os giros da mesa a cada nova rodada. Assim que surgir uma progressão (ex: <code className="text-emerald-400">1 ➔ 3</code>, <code className="text-emerald-400">3 ➔ 2</code>, ou <code className="text-emerald-400">4 ➔ 5 ➔ 28</code>), o alerta disparará aqui automaticamente.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ABA 2: MOMENTO A MINUTO DO VÍDEO (PLAYER INTERATIVO) */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <Play className="w-4 h-4 text-indigo-400" />
                  <span>Sincronização Minuto a Minuto do Vídeo do Bastião</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Clique em qualquer momento para estudar a fala exata, a leitura de mesa e a jogada correspondente.
                </p>
              </div>
              <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950 px-2.5 py-1 rounded-lg border border-indigo-800 shrink-0">
                Momento: {activeMoment.timeLabel}
              </span>
            </div>

            {/* Linha do tempo clicável */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {BASTIAO_VIDEO_TIMELINE.map((moment) => {
                const isSelected = moment.id === selectedMomentId;
                return (
                  <button
                    key={moment.id}
                    onClick={() => setSelectedMomentId(moment.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 scale-102'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-[10px] font-mono font-black">{moment.timeLabel}</span>
                      {moment.resultStatus === 'GREEN' || moment.resultStatus === 'WIN' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold line-clamp-2 leading-tight">
                      {moment.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Cartão de Detalhes do Momento Ativo */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-black uppercase rounded-md">
                    Timestamp: {activeMoment.timeLabel}
                  </span>
                  <h4 className="text-lg font-black text-white mt-1.5">{activeMoment.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 text-xs font-black rounded-lg ${
                      activeMoment.resultStatus === 'GREEN' || activeMoment.resultStatus === 'WIN'
                        ? 'bg-emerald-500 text-slate-950'
                        : activeMoment.resultStatus === 'ALERT'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-indigo-500 text-white'
                    }`}
                  >
                    {activeMoment.resultStatus === 'GREEN'
                      ? '🎯 GREEN CRAVADO!'
                      : activeMoment.resultStatus === 'ALERT'
                      ? '⚡ ENTRADA ATIVA'
                      : '📖 CONCEITO CHAVE'}
                  </span>
                </div>
              </div>

              {/* Fala Exata Transcrita */}
              <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <div className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Transcrição da Fala do Bastião:
                </div>
                <p className="text-xs text-slate-200 italic leading-relaxed">
                  {activeMoment.speakerQuote}
                </p>
              </div>

              {/* Análise Pedagógica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Leitura Oculta da Mesa:</div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeMoment.pedagogicalAnalysis}
                  </p>
                </div>

                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Jogada Recomendada:</div>
                  {activeMoment.targetNumbers.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-slate-400 font-bold">Alvos:</span>
                        {activeMoment.targetNumbers.map((num) => (
                          <span key={num} className="px-2 py-0.5 bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-black rounded">
                            {num}
                          </span>
                        ))}
                      </div>
                      {activeMoment.protectionNumbers.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-slate-400 font-bold">Proteções:</span>
                          {activeMoment.protectionNumbers.map((p) => (
                            <span key={p} className="px-2 py-0.5 bg-slate-950 border border-slate-700 text-slate-300 text-xs font-mono rounded">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">Momento de pausa pedagógica / gestão de lucro.</p>
                  )}
                </div>
              </div>

              {/* Regra de Ouro */}
              <div className="p-3.5 bg-indigo-950/70 border border-indigo-500/40 rounded-xl flex items-center gap-3">
                <Award className="w-5 h-5 text-indigo-400 shrink-0" />
                <div className="text-xs text-indigo-200">
                  <strong className="text-white">Regra de Ouro deste Momento:</strong> {activeMoment.keyTakeaway}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: CALCULADORA VISUAL (SOMA VS SUBTRAÇÃO) */}
      {activeTab === 'calculator' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>Calculadora Interativa de Camuflados (Soma vs Subtração)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Selecione qualquer número da roleta para ver sua decomposição completa de dígitos, somas, subtrações e puxadas.
              </p>
            </div>

            {/* Grid dos números de 0 a 36 */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 p-3 bg-slate-950 rounded-2xl border border-slate-800">
              {Array.from({ length: 37 }, (_, i) => i).map((num) => {
                const color = getNumberColor(num);
                const isSelected = num === selectedCalcNumber;
                return (
                  <button
                    key={num}
                    onClick={() => setSelectedCalcNumber(num)}
                    className={`py-2 rounded-lg font-black text-xs transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'ring-2 ring-emerald-400 scale-105 shadow-lg shadow-emerald-500/30'
                        : 'opacity-80 hover:opacity-100'
                    } ${
                      color === 'red'
                        ? 'bg-red-600 text-white'
                        : color === 'black'
                        ? 'bg-slate-800 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    <span>{num}</span>
                  </button>
                );
              })}
            </div>

            {/* Detalhes do Número Selecionado */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg ${
                    getNumberColor(calcNumberProp.num) === 'red'
                      ? 'bg-red-600 text-white'
                      : getNumberColor(calcNumberProp.num) === 'black'
                      ? 'bg-slate-800 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {calcNumberProp.num}
                </div>
                <div>
                  <h4 className="text-lg font-black text-white">
                    Análise do Número {calcNumberProp.num}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Terminal Puro: <strong className="text-slate-200">Terminal {calcNumberProp.num % 10}</strong>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Camuflado por Soma */}
                <div className="bg-slate-900 p-4 rounded-xl border border-amber-500/30 space-y-2">
                  <div className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> 1. Camuflado por SOMA (D₁ + D₂)
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {calcNumberProp.digits[0]} + {calcNumberProp.digits[1]} ={' '}
                    <span className="text-amber-400">{calcNumberProp.sumValue}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Representa os terminais: <strong>{calcNumberProp.sumTerminals.join(', ')}</strong>
                  </p>
                </div>

                {/* 2. Camuflado por Subtração */}
                <div className="bg-slate-900 p-4 rounded-xl border border-emerald-500/30 space-y-2">
                  <div className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> 2. Camuflado por SUBTRAÇÃO (|D₂ - D₁|)
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {calcNumberProp.digits[1]} - {calcNumberProp.digits[0]} ={' '}
                    <span className="text-emerald-400">{calcNumberProp.subtractionValue}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Atua como terminal: <strong>Terminal {calcNumberProp.subtractionTerminal}</strong>
                  </p>
                </div>

                {/* 3. Puxadas e Vizinhos */}
                <div className="bg-slate-900 p-4 rounded-xl border border-indigo-500/30 space-y-2">
                  <div className="text-xs font-black uppercase text-indigo-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> 3. Puxadas & Vizinhos no Cilindro
                  </div>
                  <div className="text-xs text-slate-300">
                    <div>Puxadas diretas: <strong className="text-indigo-300">{calcNumberProp.directPulls.join(', ')}</strong></div>
                    <div>1 Vizinho no cilindro: <strong className="text-slate-200">{calcNumberProp.cylinderNeighbors1.join(' - ')}</strong></div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-300">
                <strong className="text-amber-300">Explicação Oficial:</strong> {calcNumberProp.explanation}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: BACKTEST */}
      {activeTab === 'backtest' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
              <div className="text-xs text-slate-400 font-bold uppercase">Entradas Identificadas</div>
              <div className="text-2xl font-black text-white mt-1">{backtestStats.totalEntries}</div>
            </div>

            <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-2xl">
              <div className="text-xs text-emerald-400 font-bold uppercase">Greens Obtidos</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{backtestStats.wins}</div>
            </div>

            <div className="bg-slate-900 border border-red-500/30 p-4 rounded-2xl">
              <div className="text-xs text-red-400 font-bold uppercase">Reds</div>
              <div className="text-2xl font-black text-red-400 mt-1">{backtestStats.losses}</div>
            </div>

            <div className="bg-slate-900 border border-indigo-500/30 p-4 rounded-2xl">
              <div className="text-xs text-indigo-300 font-bold uppercase">Taxa de Acerto (ROI)</div>
              <div className="text-2xl font-black text-indigo-300 mt-1">
                {backtestStats.winRatePct.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Histórico de Entradas no Histórico Atual</span>
            </h3>

            {backtestStats.history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Giro</th>
                      <th className="p-3">Número Sorteado</th>
                      <th className="p-3">Terminal Previsto</th>
                      <th className="p-3">Padrão Detectado</th>
                      <th className="p-3">Resultado</th>
                      <th className="p-3 text-right">Resultado (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {backtestStats.history.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-950/40">
                        <td className="p-3 font-mono text-slate-400">#{h.spinIdx}</td>
                        <td className="p-3 font-bold text-white">
                          <span className={`px-2 py-0.5 rounded ${
                            getNumberColor(h.spinNum) === 'red'
                              ? 'bg-red-600 text-white'
                              : getNumberColor(h.spinNum) === 'black'
                              ? 'bg-slate-800 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}>
                            {h.spinNum}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-amber-300">Terminal {h.predictedTerminal}</td>
                        <td className="p-3 text-slate-300">{h.reason}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              h.isWin
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-red-500/20 text-red-300 border border-red-500/40'
                            }`}
                          >
                            {h.isWin ? 'GREEN' : 'RED'}
                          </span>
                        </td>
                        <td className={`p-3 text-right font-black ${h.profitThisSpin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {h.profitThisSpin >= 0 ? `+R$ ${h.profitThisSpin.toFixed(2)}` : `-R$ ${Math.abs(h.profitThisSpin).toFixed(2)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">
                Nenhum padrão completo foi detectado ainda nos giros registrados. Registre mais giros para processar o backtest.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ABA 5: MANUAL COMPLETO & REGRAS DE OURO */}
      {activeTab === 'manual' && (
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <span>Manual Completo da Estratégia de Escalas & Subtração</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Guia definitivo sintetizado a partir dos ensinamentos de Bastião no vídeo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-black uppercase text-amber-400">1. A Regra dos Camuflados por Subtração</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Além da soma tradicional (<code className="text-amber-300">28 = 2+8 = 10 ➔ 1</code>), a mesa também paga na diferença dos dígitos (<code className="text-emerald-400">28 = 8 - 2 = 6</code>). O número 28 pode funcionar como terminal 6 para completar uma escala!
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-black uppercase text-indigo-400">2. Escala 4 ➔ 5 ➔ 28 ➔ 7 ➔ 8</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Na sequência do vídeo: <strong className="text-white">4</strong> ➔ <strong className="text-white">5</strong> ➔ <strong className="text-emerald-400">28 (8-2=6)</strong> ➔ <strong className="text-white">7</strong>. O próximo passo obrigatório é o <strong className="text-amber-300">Terminal 8 (8, 18, 28)</strong>.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-black uppercase text-emerald-400">3. Quebra de Ímpar para Decrescente</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Se a mesa vinha em 1 ➔ 3 (esperando 5), mas cai um 2 (formando 3 ➔ 2), a escala virou decrescente! A mesa passa a dever <strong className="text-emerald-300">Terminal 1 (1, 11, 21, 31)</strong>.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-black uppercase text-purple-400">4. Espelhos 23 & 32 puxam Terminal 8</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Os números espelhos 23 e 32 possuem altíssima correlação de puxada com os números do Terminal 8 (8, 18, 28).
              </p>
            </div>
          </div>

          <div className="p-4 bg-purple-950/60 border border-purple-500/40 rounded-xl space-y-2">
            <h4 className="text-xs font-black uppercase text-purple-300">5. Gestão Comportamental: "Quem não é visto não é lembrado"</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Deu uma cacetada na mesa e bateu sua meta? <strong>Aguarde de 2 a 3 rodadas sem apostar</strong> para reavaliar o fluxo e não devolver o lucro à mesa. Aposta não é investimento, é gestão de risco e oportunidade!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
