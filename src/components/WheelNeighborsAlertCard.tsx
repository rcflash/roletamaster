import React, { useMemo, useState } from 'react';
import {
  Compass,
  Flame,
  AlertCircle,
  Sparkles,
  Crosshair,
  Snowflake,
  RefreshCw,
  ShieldAlert,
  Eye,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  HelpCircle,
  Coins
} from 'lucide-react';
import { SpinRecord, StrategyConfig, NumberStats } from '../types';
import {
  getWheelNeighbors,
  getWheelOpposite,
  calculateNeighborsAlert,
  calculateOppositeNeighborsAlert,
  calculateWheelDispersionIndex,
  getNumberColor,
  calculateNumberStats
} from '../lib/roulette';
import rouletteBetImage from '../assets/images/roulette_chip_bet_1789352886372.jpg';

interface WheelNeighborsAlertCardProps {
  spins: SpinRecord[];
  strategy?: StrategyConfig;
  onUpdateStrategy?: (updated: Partial<StrategyConfig>) => void;
  numberStats?: NumberStats[];
}

export const WheelNeighborsAlertCard: React.FC<WheelNeighborsAlertCardProps> = ({
  spins,
  strategy,
  onUpdateStrategy,
  numberStats: passedNumberStats,
}) => {
  const neighborRadius = strategy?.neighborRadius || 2;
  const [isOppositeMode, setIsOppositeMode] = useState<boolean>(() => {
    return localStorage.getItem('roleta_opposite_mode') === 'true';
  });
  const [showVisualGuide, setShowVisualGuide] = useState<boolean>(false);

  const toggleOppositeMode = () => {
    setIsOppositeMode((prev) => {
      const next = !prev;
      localStorage.setItem('roleta_opposite_mode', String(next));
      return next;
    });
  };

  const lastSpin = spins.length > 0 ? spins[spins.length - 1] : null;
  const targetNum = lastSpin ? lastSpin.numero : 0;

  // Opposite sector calculation
  const oppositeInfo = useMemo(() => {
    return getWheelOpposite(targetNum, neighborRadius);
  }, [targetNum, neighborRadius]);

  const currentNeighbors = useMemo(() => {
    return isOppositeMode ? oppositeInfo.oppositeNeighbors : getWheelNeighbors(targetNum, neighborRadius);
  }, [isOppositeMode, targetNum, neighborRadius, oppositeInfo]);

  const activeCenter = isOppositeMode ? oppositeInfo.oppositeCenter : targetNum;

  // Dispersion index (checks if direct neighbors are giving reds / <30% hit rate)
  const dispersionState = useMemo(() => {
    return calculateWheelDispersionIndex(spins, neighborRadius, 20);
  }, [spins, neighborRadius]);

  const alertData = useMemo(() => {
    return isOppositeMode
      ? calculateOppositeNeighborsAlert(spins, neighborRadius)
      : calculateNeighborsAlert(spins, neighborRadius);
  }, [isOppositeMode, spins, neighborRadius]);

  // Top 5 Quentes e Top 5 Frios da sessão local
  const { hotNumbers, coldNumbers, hotStatsMap, coldStatsMap } = useMemo(() => {
    const stats: NumberStats[] = passedNumberStats || (spins.length > 0 ? calculateNumberStats(spins) : []);
    const hMap = new Map<number, NumberStats>();
    const cMap = new Map<number, NumberStats>();
    stats.forEach((s) => {
      hMap.set(s.num, s);
      cMap.set(s.num, s);
    });

    if (spins.length === 0 || !stats || stats.length === 0) {
      return {
        hotNumbers: [] as number[],
        coldNumbers: [] as number[],
        hotStatsMap: hMap,
        coldStatsMap: cMap,
      };
    }

    // Top 5 Quentes do Total Geral (mais saíram; desempate por menor atraso)
    const hotSorted = [...stats]
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count || a.spinsWithoutHit - b.spinsWithoutHit || a.num - b.num)
      .slice(0, 5);

    // Top 5 Frios do Total Geral (mais rodadas sem sair; desempate por menor count)
    const coldSorted = [...stats]
      .sort((a, b) => b.spinsWithoutHit - a.spinsWithoutHit || a.count - b.count || a.num - b.num)
      .slice(0, 5);

    return {
      hotNumbers: hotSorted.map((s) => s.num),
      coldNumbers: coldSorted.map((s) => s.num),
      hotStatsMap: hMap,
      coldStatsMap: cMap,
    };
  }, [spins, passedNumberStats]);

  // Números quentes e frios presentes especificamente no setor dos vizinhos
  const hotNeighborsInSector = useMemo(() => {
    return currentNeighbors.filter((num) => hotNumbers.includes(num));
  }, [currentNeighbors, hotNumbers]);

  const coldNeighborsInSector = useMemo(() => {
    return currentNeighbors.filter((num) => coldNumbers.includes(num));
  }, [currentNeighbors, coldNumbers]);

  const spinsSinceZero = useMemo(() => {
    if (spins.length === 0) return 0;
    let count = 0;
    for (let i = spins.length - 1; i >= 0; i--) {
      if (spins[i].numero === 0) {
        return count;
      }
      count++;
    }
    return count;
  }, [spins]);

  const chipValue = strategy?.neighborChipValue || 2.5;
  const tableMult = strategy?.tablePayoutMultiplier || 36;
  const totalBet = currentNeighbors.length * chipValue;
  const grossReturn = chipValue * tableMult;
  const netProfit = grossReturn - totalBet;

  const handleSelectRadius = (count: 2 | 3 | 4 | 5 | 6 | 7) => {
    if (onUpdateStrategy) {
      onUpdateStrategy({ neighborRadius: count });
    }
  };

  return (
    <div
      className={`rounded-xl p-3 shadow-md flex flex-col justify-between h-full transition-all duration-300 ${
        alertData?.hasAlert
          ? 'bg-slate-900/95 border-2 border-amber-500/70 shadow-amber-500/10 shadow-lg ring-1 ring-amber-400/40'
          : 'bg-slate-900/90 border border-slate-800'
      }`}
    >
      <div>
        <div
          className={`flex items-center justify-between mb-2 pb-1.5 flex-wrap gap-1.5 border-b transition-colors ${
            alertData?.hasAlert ? 'border-amber-500/40' : 'border-indigo-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            <Compass
              className={`w-5 h-5 transition-transform ${
                alertData?.hasAlert
                  ? 'text-amber-400 animate-pulse scale-110 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                  : 'text-amber-400'
              }`}
            />
            <h3
              className={`text-sm tracking-wide uppercase transition-all ${
                alertData?.hasAlert
                  ? 'text-amber-300 font-black animate-pulse drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] flex items-center gap-1.5'
                  : 'text-slate-100 font-extrabold'
              }`}
            >
              <span>{isOppositeMode ? 'SETOR OPOSTO 180° (ANTI-DISPERSÃO)' : 'ALERTA DE VIZINHOS DO CILINDRO'}</span>
              {alertData?.hasAlert && (
                <span className="text-[9px] font-black uppercase bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded shadow-sm">
                  ENTRADA
                </span>
              )}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Modo Normal vs Modo Oposto 180° */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => { if (isOppositeMode) toggleOppositeMode(); }}
                className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${
                  !isOppositeMode ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Apostar nos vizinhos diretos do último número sorteado"
              >
                🎯 Direto
              </button>
              <button
                onClick={() => { if (!isOppositeMode) toggleOppositeMode(); }}
                className={`px-2 py-0.5 rounded text-[10px] font-black transition-all flex items-center gap-1 ${
                  isOppositeMode ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-cyan-300'
                }`}
                title="Apostar no setor diametralmente oposto a 180° (ideal quando a roleta espalha e não respeita vizinhos)"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Oposto 180°</span>
                {dispersionState.isDispersionHigh && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
            </div>

            {/* Vizinhos selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 px-1">Vizinhos:</span>
              {([2, 3, 4, 5, 6, 7] as const).map((count) => (
                <button
                  key={count}
                  onClick={() => handleSelectRadius(count)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black transition-all ${
                    neighborRadius === count
                      ? isOppositeMode ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {count} VIZ
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Banner de Dispersão / Pêndulo (quando a roleta está com poucos acertos diretos) */}
        {dispersionState.isDispersionHigh && (
          <div className="mb-2 p-2 bg-gradient-to-r from-amber-950/80 via-slate-900 to-cyan-950/70 border border-amber-500/50 rounded-lg flex items-center justify-between gap-2 flex-wrap shadow-sm">
            <div className="flex items-center gap-2 text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <div>
                <span className="font-extrabold text-amber-300">
                  ALERTA DE DISPERSÃO / PÊNDULO:
                </span>{' '}
                <span className="text-slate-200 text-[11px]">
                  A roleta está espalhando (apenas <strong>{dispersionState.directHitRatePct}%</strong> de acerto em vizinhos diretos). O Setor Oposto a 180° está com <strong>{dispersionState.oppositeHitRatePct}%</strong> de assertividade!
                </span>
              </div>
            </div>
            {!isOppositeMode && (
              <button
                onClick={toggleOppositeMode}
                className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-black rounded uppercase shadow-sm transition-all flex items-center gap-1 shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                Ativar Oposto 180° Agora
              </button>
            )}
          </div>
        )}

        {/* Target & Neighbor Wheel Map */}
        <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/80 mb-3">
          <div className="flex items-center justify-between text-xs text-slate-300 font-bold mb-2 flex-wrap gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                Último Número: <span className="text-amber-400 font-extrabold text-sm">#{targetNum}</span>
              </span>
              {isOppositeMode && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/80">
                  <RefreshCw className="w-3 h-3 text-cyan-400" />
                  Alvo Diametral (180°): <strong className="text-cyan-200 font-mono text-xs">#{activeCenter}</strong>
                </span>
              )}
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${
                spinsSinceZero >= 37
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 animate-pulse'
                  : 'bg-slate-900 text-emerald-400 border-slate-700/80'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Zero (0): <strong className="font-mono">{spinsSinceZero} {spinsSinceZero === 1 ? 'giro' : 'giros'}</strong> sem sair
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">
              {currentNeighbors.length} números ({neighborRadius} p/ cada lado de #{activeCenter})
            </span>
          </div>

          {/* Visual Sequence of Neighbors */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap py-0.5">
            {currentNeighbors.map((num, index) => {
              const isCenter = num === activeCenter;
              const isHot = hotNumbers.includes(num);
              const isCold = coldNumbers.includes(num);
              const colorType = getNumberColor(num);
              const hotStat = hotStatsMap.get(num);
              const coldStat = coldStatsMap.get(num);

              let colorStyle = 'bg-slate-950 border-slate-700/80 text-white';
              if (colorType === 'red') {
                colorStyle = 'bg-rose-600/90 border-rose-500/90 text-white shadow-xs';
              } else if (colorType === 'green') {
                colorStyle = 'bg-emerald-600 border-emerald-400 text-white shadow-xs';
              } else {
                colorStyle = 'bg-slate-950 border-slate-700/80 text-white shadow-xs';
              }

              // When entry alert is active, flash hot in red and cold in blue!
              let specialClass = '';
              let labelText = isCenter ? (isOppositeMode ? '180° ALVO' : 'CENTRO') : 'VIZINHO';
              let labelStyle = isCenter ? (isOppositeMode ? 'text-cyan-300 font-bold' : 'text-amber-300 font-bold') : 'text-slate-300';

              if (alertData?.hasAlert) {
                if (isHot) {
                  specialClass = 'animate-blink-hot-red ring-2 ring-rose-300 border-rose-300 font-black shadow-lg scale-105 z-20';
                  labelText = isCenter ? (isOppositeMode ? '🔥 180° HOT' : '🔥 CENTRO HOT') : '🔥 HOT';
                  labelStyle = 'text-rose-100 font-black';
                } else if (isCold) {
                  specialClass = 'animate-blink-cold-blue ring-2 ring-sky-300 border-sky-300 font-black shadow-lg scale-105 z-20';
                  labelText = isCenter ? (isOppositeMode ? '❄ 180° FRIO' : '❄ CENTRO FRIO') : '❄ FRIO';
                  labelStyle = 'text-sky-100 font-black';
                } else if (isCenter) {
                  specialClass = isOppositeMode
                    ? 'ring-2 ring-cyan-400 border-cyan-400 font-black shadow-md scale-105 z-10'
                    : 'ring-2 ring-amber-400 border-amber-400 font-black shadow-md scale-105 z-10';
                  labelText = isOppositeMode ? '180° ALVO' : 'CENTRO';
                  labelStyle = isOppositeMode ? 'text-cyan-300 font-bold' : 'text-amber-300 font-bold';
                }
              } else {
                if (isCenter) {
                  specialClass = isOppositeMode
                    ? 'ring-2 ring-cyan-400 border-cyan-400 font-black shadow-md scale-105 z-10'
                    : 'ring-2 ring-amber-400 border-amber-400 font-black shadow-md scale-105 z-10';
                  labelStyle = isOppositeMode ? 'text-cyan-300 font-bold' : 'text-amber-300 font-bold';
                } else if (isHot) {
                  specialClass = 'ring-1 ring-rose-500/70 border-rose-400/80';
                  labelText = '🔥 HOT';
                  labelStyle = 'text-rose-300 font-extrabold';
                } else if (isCold) {
                  specialClass = 'ring-1 ring-sky-500/70 border-sky-400/80';
                  labelText = '❄ FRIO';
                  labelStyle = 'text-sky-300 font-extrabold';
                }
              }

              const tooltipTitle = isHot
                ? `Número ${num}: 5 QUENTES (Total: ${hotStat?.count}x saídas em ${spins.length} rodadas - ${hotStat?.frequencyPct}%)`
                : isCold
                ? `Número ${num}: 5 FRIOS (Total: ${coldStat?.spinsWithoutHit} rodadas sem sair)`
                : `Número ${num} (${isCenter ? (isOppositeMode ? 'Centro Oposto 180°' : 'Centro') : 'Vizinho'})`;

              return (
                <div
                  key={`neighbor-${num}-${index}`}
                  title={tooltipTitle}
                  className={`flex flex-col items-center justify-center rounded-lg px-2 sm:px-2.5 py-1 transition-all border ${colorStyle} ${specialClass} ${
                    !specialClass ? 'font-bold' : ''
                  }`}
                >
                  <span className={`text-xs ${isCenter && !isHot && !isCold ? (isOppositeMode ? 'text-cyan-300 font-black' : 'text-amber-300 font-black') : 'text-slate-100 font-extrabold'}`}>
                    {num}
                  </span>
                  <span className={`text-[8px] font-medium leading-none mt-0.5 tracking-tight ${labelStyle}`}>
                    {labelText}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Diagnóstico Térmico do Setor em Alerta de Entrada (Piscando Quentes e Frios) */}
          {alertData?.hasAlert && (
            <div className="mt-2 pt-2 border-t border-amber-500/30 flex items-center justify-between gap-2 text-[10px] font-mono flex-wrap bg-slate-950/70 p-2 rounded-lg">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Termômetro dos Vizinhos:
                </span>

                {/* 5 Quentes encontrados no setor - Piscando em Vermelho */}
                {hotNeighborsInSector.length > 0 ? (
                  <div className="animate-blink-hot-red px-2 py-0.5 rounded text-white font-black flex items-center gap-1.5 shadow-md">
                    <Flame className="w-3 h-3 text-white fill-white animate-pulse" />
                    <span>{hotNeighborsInSector.length} Quente{hotNeighborsInSector.length > 1 ? 's' : ''} no Setor:</span>
                    <div className="flex items-center gap-1">
                      {hotNeighborsInSector.map((n) => {
                        const s = hotStatsMap.get(n);
                        return (
                          <span
                            key={`alert-hot-${n}`}
                            className="bg-black/40 px-1 rounded text-[9.5px] border border-white/40"
                            title={`Número ${n}: ${s?.count}x saídas (${s?.frequencyPct}%)`}
                          >
                            #{n} ({s?.count}x)
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <span className="text-[9.5px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    Sem quentes no setor
                  </span>
                )}

                {/* Frios encontrados no setor - Piscando em Azul */}
                {coldNeighborsInSector.length > 0 ? (
                  <div className="animate-blink-cold-blue px-2 py-0.5 rounded text-white font-black flex items-center gap-1.5 shadow-md">
                    <Snowflake className="w-3 h-3 text-white animate-pulse" />
                    <span>{coldNeighborsInSector.length} Frio{coldNeighborsInSector.length > 1 ? 's' : ''} no Setor:</span>
                    <div className="flex items-center gap-1">
                      {coldNeighborsInSector.map((n) => {
                        const s = coldStatsMap.get(n);
                        const delay = s?.spinsWithoutHit || 0;
                        return (
                          <span
                            key={`alert-cold-${n}`}
                            className="bg-black/40 px-1 rounded text-[9.5px] border border-white/40"
                            title={`Número ${n}: ${delay} rodadas consecutivas sem sair`}
                          >
                            #{n} ({delay} sem sair)
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <span className="text-[9.5px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    Sem frios no setor
                  </span>
                )}
              </div>

              <span className="text-[9px] text-slate-400 ml-auto">
                Base: Total da Mesa ({spins.length} giros)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Alert Banner or Footer */}
      {alertData?.hasAlert ? (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-rose-950/30 p-2.5 rounded-xl border border-amber-500/40 flex items-start gap-2 shadow-md mt-2">
          <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1.5 text-xs flex-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-extrabold text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {isOppositeMode ? 'ALERTA DE OPOSTO 180° DETECTADO!' : 'ALERTA DE REPETIÇÃO DETECTADO!'}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {hotNeighborsInSector.length > 0 && (
                  <span className="animate-blink-hot-red px-1.5 py-0.5 rounded text-[9.5px] font-black text-white flex items-center gap-1">
                    <Flame className="w-2.5 h-2.5 fill-white" />
                    {hotNeighborsInSector.length} HOT
                  </span>
                )}
                {coldNeighborsInSector.length > 0 && (
                  <span className="animate-blink-cold-blue px-1.5 py-0.5 rounded text-[9.5px] font-black text-white flex items-center gap-1">
                    <Snowflake className="w-2.5 h-2.5" />
                    {coldNeighborsInSector.length} FRIO
                  </span>
                )}
              </div>
            </div>
            <p className="text-slate-200 leading-tight font-medium text-[11px]">
              {alertData.alertMessage}
            </p>
            <div className="text-[10px] font-bold text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 inline-block">
              💰 Aposta Sugerida: R$ {chipValue.toFixed(2)} por casa (Aposta R$ {totalBet.toFixed(2)} ➔ Retorno R$ {grossReturn.toFixed(2)})
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 font-medium text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {isOppositeMode
              ? `Monitore o setor oposto 180° do #${targetNum} (polo #${activeCenter}). Se houver repetição na oposição, o alerta surgirá!`
              : `Monitore a frequência no setor do #${targetNum}. Se repetir, alerta surgirá!`}
          </span>
          <span className="text-[10px] font-black text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0">
            Aposta {currentNeighbors.length} casas: R$ {totalBet.toFixed(2)} | Retorno: R$ {grossReturn.toFixed(2)}
          </span>
        </div>
      )}

      {/* Botão e Painel de Guia Visual "Como Fazer a Jogada na Mesa" */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/70">
        <button
          onClick={() => setShowVisualGuide((prev) => !prev)}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-lg text-xs font-bold text-amber-300 transition-all shadow-sm group"
        >
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>📸 Como Fazer a Jogada na Mesa com as Fichas? (Passo a Passo Visual)</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>{showVisualGuide ? 'Ocultar Guia' : 'Ver Exemplo com Fichas'}</span>
            {showVisualGuide ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
          </div>
        </button>

        {showVisualGuide && (
          <div className="mt-2 p-3 bg-slate-950/90 rounded-xl border border-slate-800 space-y-3 animate-fadeIn">
            {/* Foto ilustrativa da Roleta com as fichas posicionadas */}
            <div className="rounded-lg overflow-hidden border border-slate-800 relative bg-slate-900">
              <img
                src={rouletteBetImage}
                alt="Exemplo visual de fichas colocadas nos números da roleta e na pista"
                className="w-full h-48 sm:h-56 object-cover object-center"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2.5 text-white">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Visualização Real: 5 Fichas Plenas colocadas na Pista e no Pano
                </span>
                <p className="text-[10px] text-slate-300">
                  Exemplo clássico do setor [17, 34, 6, 27, 13] com 1 ficha em cada número pleno.
                </p>
              </div>
            </div>

            {/* As duas formas de apostar no cassino */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {/* Opção 1: Na Pista (Recomendada / 1 clique) */}
              <div className="p-2.5 bg-slate-900/90 rounded-lg border border-cyan-500/40 space-y-1.5">
                <div className="flex items-center gap-1.5 font-extrabold text-cyan-300">
                  <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[10px] font-black">1</span>
                  <span>Forma Rápida (Pista / Racetrack)</span>
                  <span className="text-[9px] bg-cyan-950 text-cyan-200 px-1.5 py-0.2 rounded border border-cyan-700">1 CLIQUE</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Nas roletas ao vivo (Evolution, Pragmatic Play, Playtech):
                </p>
                <ol className="list-decimal list-inside text-[11px] text-slate-300 space-y-1 pl-1">
                  <li>Abra a pista oval (ícone de circuito/pista ao lado da mesa).</li>
                  <li>Defina o seletor de vizinhos para <strong>{neighborRadius}</strong>.</li>
                  <li>
                    Dê <strong>1 clique</strong> no centro indicado: <strong className="text-amber-400">#{activeCenter}</strong>.
                  </li>
                </ol>
                <div className="text-[10px] font-medium text-cyan-200 bg-cyan-950/60 p-1.5 rounded border border-cyan-800/60">
                  ⚡ A própria mesa coloca as 5 fichas automaticamente nos números <strong>[{currentNeighbors.join(', ')}]</strong>.
                </div>
              </div>

              {/* Opção 2: No Pano / Grid de Números */}
              <div className="p-2.5 bg-slate-900/90 rounded-lg border border-amber-500/40 space-y-1.5">
                <div className="flex items-center gap-1.5 font-extrabold text-amber-300">
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">2</span>
                  <span>Forma Manual (Pano dos Números 0 a 36)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Se você preferir colocar manualmente no pano principal:
                </p>
                <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1 pl-1">
                  <li>Pegue a ficha de valor desejado (ex: R$ 2,50).</li>
                  <li>
                    Coloque <strong>1 ficha em cima</strong> (pleno / straight-up) de cada um dos {currentNeighbors.length} números:
                  </li>
                </ul>
                <div className="flex items-center gap-1 flex-wrap pt-0.5">
                  {currentNeighbors.map((n) => (
                    <span
                      key={`guide-chip-${n}`}
                      className="px-2 py-0.5 bg-slate-950 text-amber-300 font-mono font-bold rounded border border-amber-500/60 text-[10px]"
                    >
                      #{n}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Cálculo de retorno matemático */}
            <div className="p-2 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 rounded-lg border border-emerald-500/40 flex items-center justify-between text-[11px] flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Custo total:</strong> {currentNeighbors.length} fichas × R$ {chipValue.toFixed(2)} = <strong>R$ {totalBet.toFixed(2)}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-300">
                  <strong>Se qualquer um bater:</strong> Ganha 36 × R$ {chipValue.toFixed(2)} = <strong className="text-emerald-300">R$ {grossReturn.toFixed(2)}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[10px] uppercase shadow-sm">
                  +R$ {(grossReturn - totalBet).toFixed(2)} de Lucro Líquido
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
