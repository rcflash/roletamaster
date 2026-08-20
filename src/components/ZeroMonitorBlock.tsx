import React, { useState, useEffect } from 'react';
import {
  Clock,
  RotateCcw,
  Plus,
  Minus,
  Sparkles,
  AlertTriangle,
  History,
  TrendingUp,
  Sliders,
  Check
} from 'lucide-react';
import { SpinRecord, StrategyConfig } from '../types';
import { calculateZeroStats, ZeroHitHistoryItem } from '../lib/roulette';

interface ZeroMonitorBlockProps {
  spins: SpinRecord[];
  strategy?: StrategyConfig;
  onUpdateStrategy?: (strategyUpdate: Partial<StrategyConfig>) => void;
  className?: string;
  isCompact?: boolean;
}

export const ZeroMonitorBlock: React.FC<ZeroMonitorBlockProps> = ({
  spins,
  strategy,
  onUpdateStrategy,
  className = '',
  isCompact = false,
}) => {
  const initialDelay = strategy?.initialZeroDelay ?? 0;
  const manualHist = strategy?.manualZeroHistory ?? [];

  const [inputDelay, setInputDelay] = useState<number>(initialDelay);
  const [hist1, setHist1] = useState<string | number>(manualHist[0] ?? '');
  const [hist2, setHist2] = useState<string | number>(manualHist[1] ?? '');
  const [isEditingHistory, setIsEditingHistory] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<boolean>(false);

  // Sync state when props change
  useEffect(() => {
    setInputDelay(strategy?.initialZeroDelay ?? 0);
  }, [strategy?.initialZeroDelay]);

  useEffect(() => {
    setHist1(strategy?.manualZeroHistory?.[0] ?? '');
    setHist2(strategy?.manualZeroHistory?.[1] ?? '');
  }, [strategy?.manualZeroHistory]);

  const zeroStats = React.useMemo(() => {
    return calculateZeroStats(spins, initialDelay, manualHist);
  }, [spins, initialDelay, manualHist]);

  const handleUpdateDelay = (newDelay: number) => {
    const val = Math.max(0, Math.min(999, newDelay));
    setInputDelay(val);
    if (onUpdateStrategy) {
      onUpdateStrategy({ initialZeroDelay: val });
    }
  };

  const handleSaveManualHistory = () => {
    const newHist: number[] = [];
    if (hist1 !== '' && !isNaN(Number(hist1))) {
      newHist.push(Math.max(0, Number(hist1)));
    }
    if (hist2 !== '' && !isNaN(Number(hist2))) {
      newHist.push(Math.max(0, Number(hist2)));
    }
    if (onUpdateStrategy) {
      onUpdateStrategy({ manualZeroHistory: newHist });
    }
    setIsEditingHistory(false);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  const handleResetZero = () => {
    setInputDelay(0);
    if (onUpdateStrategy) {
      onUpdateStrategy({ initialZeroDelay: 0 });
    }
  };

  // Progress towards 1 cycle (37 spins)
  const cycleProgress = Math.min(100, Math.round((zeroStats.spinsSinceZero / 37) * 100));

  return (
    <div
      className={`bg-slate-900 border rounded-2xl p-3.5 sm:p-5 shadow-lg transition-all ${
        zeroStats.isOverdue
          ? 'border-emerald-500/70 shadow-emerald-500/10 ring-1 ring-emerald-500/30'
          : 'border-slate-800 hover:border-slate-700'
      } ${className}`}
    >
      {/* Header with Title & Quick Badges */}
      <div className="flex items-center justify-between border-b border-slate-800/90 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-emerald-950 border border-emerald-400/30 shrink-0">
            0
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black uppercase text-slate-100 tracking-wider">
                Monitoramento Exclusivo do Zero (0)
              </h3>
              {zeroStats.isOverdue && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-500/60 animate-pulse flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  🔥 Atrasado (+37g)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Contagem de atraso acumulada, ajuste de mesa inicial e histórico das 2 últimas saídas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveFeedback && (
            <span className="px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-xs font-bold flex items-center gap-1 animate-in fade-in">
              <Check className="w-3 h-3" /> Salvo!
            </span>
          )}
          <button
            onClick={handleResetZero}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs font-bold transition-all border border-slate-700 hover:border-rose-500/50 flex items-center gap-1.5"
            title="Zerar atraso inicial informado"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Zerar Offset</span>
          </button>
        </div>
      </div>

      {/* Main Grid Section - Tailored for Split Screens */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 mt-3.5">
        {/* HERO CARD: Big Counter for Zero Delay (Takes 5 cols on desktop, full width on split screen) */}
        <div className={`md:col-span-5 rounded-xl p-4 flex flex-col justify-between border transition-all ${
          zeroStats.isOverdue
            ? 'bg-emerald-950/40 border-emerald-500/60 shadow-inner'
            : 'bg-slate-950 border-slate-800'
        }`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Sem Sair o Zero (0)
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/20">
                1 em cada 37 giros
              </span>
            </div>

            {/* Giant Number Display */}
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tight leading-none ${
                zeroStats.isOverdue
                  ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.3)] animate-pulse'
                  : zeroStats.spinsSinceZero >= 20
                  ? 'text-amber-300'
                  : 'text-white'
              }`}>
                {zeroStats.spinsSinceZero}
              </span>
              <span className="text-sm sm:text-base text-slate-300 font-black uppercase tracking-wide">
                {zeroStats.spinsSinceZero === 1 ? 'Giro sem o Zero' : 'Giros sem o Zero'}
              </span>
            </div>

            {/* Breakdown Formula */}
            <div className="mt-2 p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 text-[11px] font-mono text-slate-300 flex items-center justify-between">
              <span className="text-slate-400">Composição do Atraso:</span>
              <span className="font-bold text-amber-300">
                {zeroStats.initialZeroDelay > 0
                  ? `${zeroStats.initialZeroDelay} (mesa inicial) + ${spins.length - (zeroStats.lastZeroGiro ?? 0)} (lançados)`
                  : `${zeroStats.spinsSinceZero} rodadas lançadas`}
              </span>
            </div>
          </div>

          {/* Thermometer / Cycle Progress */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
              <span className="text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-amber-400" />
                Ciclo da Roleta (37 Giros)
              </span>
              <span className={zeroStats.isOverdue ? 'text-rose-400 font-extrabold' : 'text-emerald-400'}>
                {cycleProgress}% ({zeroStats.spinsSinceZero}/37g)
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  zeroStats.isOverdue
                    ? 'bg-rose-500 shadow-sm shadow-rose-500'
                    : zeroStats.spinsSinceZero >= 20
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (zeroStats.spinsSinceZero / 37) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* CONTROLS CARD: Quick Adjust for Initial Mesa Offset (Takes 4 cols on desktop) */}
        <div className="md:col-span-4 bg-slate-950 rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                Atraso Inicial da Mesa
              </span>
              <span className="text-[10px] text-slate-500">
                Giro(s) antes de abrir
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-snug mb-3">
              Abriu a mesa e o zero já estava sem sair há <strong>X rodadas</strong>? Ajuste abaixo:
            </p>

            {/* Interactive Number Stepper & Direct Input */}
            <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleUpdateDelay(inputDelay - 5)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 font-black text-xs border border-slate-700 transition-all"
                  title="Diminuir 5 giros"
                >
                  -5
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateDelay(inputDelay - 1)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 font-black text-xs border border-slate-700 transition-all"
                  title="Diminuir 1 giro"
                >
                  -1
                </button>

                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={inputDelay}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      handleUpdateDelay(val);
                    }}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg py-1 px-2 text-center font-mono font-black text-amber-300 text-lg focus:outline-hidden"
                    placeholder="0"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleUpdateDelay(inputDelay + 1)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 font-black text-xs border border-slate-700 transition-all"
                  title="Aumentar 1 giro"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateDelay(inputDelay + 5)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 font-black text-xs border border-slate-700 transition-all"
                  title="Aumentar 5 giros"
                >
                  +5
                </button>
              </div>

              {/* Fast Presets */}
              <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800 text-[10px] text-slate-400 font-semibold">
                <span>Atalhos:</span>
                <div className="flex items-center gap-1">
                  {[0, 10, 15, 20, 25, 30].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleUpdateDelay(preset)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
                        inputDelay === preset
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2.5 text-[10px] text-slate-500 italic">
            * O sistema incrementa automaticamente a cada novo giro adicionado na tela.
          </div>
        </div>

        {/* HISTORY CARD: Last 2 Zero Hits (Takes 3 cols on desktop) */}
        <div className="md:col-span-3 bg-slate-950 rounded-xl p-3.5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-emerald-400" />
                Últimas 2 Saídas
              </span>
              <button
                type="button"
                onClick={() => setIsEditingHistory(!isEditingHistory)}
                className="text-[10px] text-amber-400 hover:text-amber-300 font-bold hover:underline"
              >
                {isEditingHistory ? 'Fechar' : 'Editar Manual'}
              </button>
            </div>

            {/* Display Mode */}
            {!isEditingHistory ? (
              <div className="space-y-2">
                {zeroStats.lastTwoZeroHits.length > 0 ? (
                  zeroStats.lastTwoZeroHits.slice(0, 2).map((hit, idx) => (
                    <div
                      key={hit.id}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block">
                          {idx === 0 ? '1ª Última Saída' : '2ª Penúltima Saída'}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">
                          {hit.source === 'session' ? `No Giro #${hit.giro}` : 'Histórico da Mesa'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black font-mono text-emerald-400 block leading-tight">
                          {hit.interval}g
                        </span>
                        <span className="text-[9px] text-slate-500">sem o zero</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-center text-slate-500 text-[11px] space-y-1">
                    <AlertTriangle className="w-4 h-4 mx-auto text-amber-400/80" />
                    <span>Nenhum zero registrado ainda.</span>
                    <button
                      onClick={() => setIsEditingHistory(true)}
                      className="text-amber-400 font-bold hover:underline block mx-auto text-[10px] mt-1"
                    >
                      Preencher histórico da mesa
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Inline Edit Mode for Previous 2 Zero Occurrences */
              <div className="space-y-2 bg-slate-900 p-2.5 rounded-lg border border-slate-700 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-300 block mb-0.5">
                    1ª Última (giros sem zero):
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 18"
                    value={hist1}
                    onChange={(e) => setHist1(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono font-bold text-emerald-300 text-center text-xs focus:border-emerald-400 focus:outline-hidden"
                  />
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-300 block mb-0.5">
                    2ª Penúltima (giros sem zero):
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 34"
                    value={hist2}
                    onChange={(e) => setHist2(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 font-mono font-bold text-emerald-300 text-center text-xs focus:border-emerald-400 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingHistory(false)}
                    className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-[10px] font-bold hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveManualHistory}
                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black flex items-center gap-1 shadow-xs"
                  >
                    <Check className="w-3 h-3" /> Salvar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Session Zeros Summary */}
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Zeros na Sessão:</span>
            <span className="font-bold text-emerald-400">
              {zeroStats.totalZeros}x ({spins.length > 0 ? ((zeroStats.totalZeros / spins.length) * 100).toFixed(1) : '0.0'}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
