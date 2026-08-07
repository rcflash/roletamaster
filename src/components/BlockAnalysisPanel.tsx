import React, { useState, useMemo } from 'react';
import {
  Layers,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Target,
  Zap,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  Info,
  ShieldCheck,
  Award,
  Clock,
  Activity,
  Trophy,
  History
} from 'lucide-react';
import { SpinRecord, BankrollConfig, StrategyConfig } from '../types';
import { getNumberColor, getNumberDozen } from '../lib/roulette';
import { WheelNeighborsAlertCard } from './WheelNeighborsAlertCard';

interface BlockAnalysisPanelProps {
  spins: SpinRecord[];
  config: BankrollConfig;
  strategy?: StrategyConfig;
  onUpdateStrategy?: (updated: Partial<StrategyConfig>) => void;
}

const VOISINS_SET = new Set([22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25]);
const ROMANOSKY_SET = new Set([
  ...Array.from({ length: 24 }, (_, i) => i + 1),
  25, 26, 28, 29, 32, 33, 35, 36
]);
const TIER_SET = new Set([5, 8, 10, 11, 13, 16, 23, 24, 27, 30, 33, 36]);
const ORPHELINS_SET = new Set([1, 6, 9, 14, 17, 20, 31, 34]);

const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

function getWheelNeighbors(num: number, countPerSide = 2): Set<number> {
  const idx = WHEEL_ORDER.indexOf(num);
  if (idx === -1) return new Set();
  const set = new Set<number>();
  const len = WHEEL_ORDER.length;
  for (let i = -countPerSide; i <= countPerSide; i++) {
    const wrappedIdx = (idx + i + len) % len;
    set.add(WHEEL_ORDER[wrappedIdx]);
  }
  return set;
}

export interface StrategyBlockOutcome {
  profit: number;
  peak: number;
  wins: number;
  losses: number;
  isGreen: boolean;
  hitTarget: boolean;
}

export interface BlockData {
  blockNumber: number;
  startIndex: number;
  endIndex: number;
  spins: SpinRecord[];
  isComplete: boolean;
  // Strategy outcomes for this block (in units & $)
  twoDozens: StrategyBlockOutcome;
  twoColumns: StrategyBlockOutcome;
  romanosky: StrategyBlockOutcome;
  voisins: StrategyBlockOutcome;
  wheelNeighbors: StrategyBlockOutcome;
  tier: StrategyBlockOutcome;
  orphelins: StrategyBlockOutcome;
  // Dominant stats
  d1Count: number;
  d2Count: number;
  d3Count: number;
  zeroCount: number;
  redCount: number;
  blackCount: number;
  repeatsInBlock: number;
}

export const BlockAnalysisPanel: React.FC<BlockAnalysisPanelProps> = ({
  spins,
  config,
  strategy,
  onUpdateStrategy,
}) => {
  const [blockSize, setBlockSize] = useState<number>(10);
  const [selectedStrategy, setSelectedStrategy] = useState<'twoDozens' | 'romanosky' | 'voisins' | 'wheelNeighbors' | 'twoColumns' | 'tier' | 'orphelins'>('wheelNeighbors');
  const [vizinhosCount, setVizinhosCount] = useState<number>(7); // Default 7 vizinhos (15 numbers)
  const [blockSortOrder, setBlockSortOrder] = useState<'desc' | 'asc'>('desc'); // Default 'desc': newest blocks first (#52 -> #1)
  const [expandedBlockId, setExpandedBlockId] = useState<number | null>(null); // Expand latest block by default
  const [targetGainUnits, setTargetGainUnits] = useState<number>(2.0);

  const unitBet = config.defaultSpinCost || 10;
  const currency = config.currency || 'R$';

  // Chronologically sorted spins
  const sortedSpins = useMemo(() => {
    return [...spins].sort((a, b) => a.giro - b.giro);
  }, [spins]);

  // Partition spins into blocks of size `blockSize`
  const blocks = useMemo<BlockData[]>(() => {
    if (sortedSpins.length === 0) return [];

    const result: BlockData[] = [];
    const total = sortedSpins.length;
    const numBlocks = Math.ceil(total / blockSize);

    for (let b = 0; b < numBlocks; b++) {
      const startIdx = b * blockSize;
      const endIdx = Math.min((b + 1) * blockSize, total);
      const blockSpins = sortedSpins.slice(startIdx, endIdx);
      const isComplete = blockSpins.length === blockSize;

      // 1. 2 Dozens (1..24)
      let p2d = 0, peak2d = 0, w2d = 0, l2d = 0, hitT2d = false;
      // 2. 2 Columns (Col 1 & Col 2)
      let p2c = 0, peak2c = 0, w2c = 0, l2c = 0, hitT2c = false;
      // 3. Romanosky
      let pRom = 0, peakRom = 0, wRom = 0, lRom = 0, hitTRom = false;
      // 4. Voisins du Zero
      let pVoi = 0, peakVoi = 0, wVoi = 0, lVoi = 0, hitTVoi = false;
      // 5. Wheel Neighbors (5 números no Cilindro em torno do número anterior)
      let pWNei = 0, peakWNei = 0, wWNei = 0, lWNei = 0, hitTWNei = false;
      // 6. Tier du Cylindre
      let pTie = 0, peakTie = 0, wTie = 0, lTie = 0, hitTTie = false;
      // 7. Orphelins
      let pOrp = 0, peakOrp = 0, wOrp = 0, lOrp = 0, hitTOrp = false;

      let d1 = 0, d2 = 0, d3 = 0, zero = 0, red = 0, black = 0;
      const seenNums = new Set<number>();
      let repeats = 0;

      blockSpins.forEach((spin, sIdx) => {
        const num = spin.numero;
        if (num === 0) zero++;
        else if (num <= 12) d1++;
        else if (num <= 24) d2++;
        else d3++;

        const color = getNumberColor(num);
        if (color === 'red') red++;
        else if (color === 'black') black++;

        if (seenNums.has(num)) repeats++;
        else seenNums.add(num);

        // 2 Dozens (1..24): Win +0.5u, Loss -1u
        if (num >= 1 && num <= 24) {
          p2d += 0.5;
          w2d++;
        } else {
          p2d -= 1.0;
          l2d++;
        }
        if (p2d > peak2d) peak2d = p2d;
        if (p2d >= targetGainUnits) hitT2d = true;

        // 2 Columns (Col 1 & Col 2: numbers % 3 === 1 or 2)
        if (num > 0 && (num % 3 === 1 || num % 3 === 2)) {
          p2c += 0.5;
          w2c++;
        } else {
          p2c -= 1.0;
          l2c++;
        }
        if (p2c > peak2c) peak2c = p2c;
        if (p2c >= targetGainUnits) hitT2c = true;

        // Romanosky (Cobertura 86.4%): Win +1u, Loss -8u
        if (ROMANOSKY_SET.has(num)) {
          pRom += 1.0;
          wRom++;
        } else {
          pRom -= 8.0;
          lRom++;
        }
        if (pRom > peakRom) peakRom = pRom;
        if (pRom >= targetGainUnits) hitTRom = true;

        // Voisins (17 números): Win +1.11u, Loss -1u
        if (VOISINS_SET.has(num)) {
          pVoi += 1.11;
          wVoi++;
        } else {
          pVoi -= 1.0;
          lVoi++;
        }
        if (pVoi > peakVoi) peakVoi = pVoi;
        if (pVoi >= targetGainUnits) hitTVoi = true;

        // Wheel Neighbors (N vizinhos no Cilindro em torno do número anterior)
        const globalSpinIdx = startIdx + sIdx;
        const prevSpinNum = globalSpinIdx > 0 ? sortedSpins[globalSpinIdx - 1]?.numero : null;
        if (prevSpinNum !== null && prevSpinNum !== undefined) {
          const totalNeighborNums = 2 * vizinhosCount + 1;
          const winPayout = Number(((36 - totalNeighborNums) / totalNeighborNums).toFixed(2));
          const neighbors = getWheelNeighbors(prevSpinNum, vizinhosCount);
          if (neighbors.has(num)) {
            pWNei += winPayout;
            wWNei++;
          } else {
            pWNei -= 1.0;
            lWNei++;
          }
        }
        if (pWNei > peakWNei) peakWNei = pWNei;
        if (pWNei >= targetGainUnits) hitTWNei = true;

        // Tier (12 números): Win +2.0u, Loss -1.0u
        if (TIER_SET.has(num)) {
          pTie += 2.0;
          wTie++;
        } else {
          pTie -= 1.0;
          lTie++;
        }
        if (pTie > peakTie) peakTie = pTie;
        if (pTie >= targetGainUnits) hitTTie = true;

        // Orphelins (8 números): Win +3.5u, Loss -1.0u
        if (ORPHELINS_SET.has(num)) {
          pOrp += 3.5;
          wOrp++;
        } else {
          pOrp -= 1.0;
          lOrp++;
        }
        if (pOrp > peakOrp) peakOrp = pOrp;
        if (pOrp >= targetGainUnits) hitTOrp = true;
      });

      result.push({
        blockNumber: b + 1,
        startIndex: startIdx + 1,
        endIndex: endIdx,
        spins: blockSpins,
        isComplete,
        twoDozens: {
          profit: p2d,
          peak: peak2d,
          wins: w2d,
          losses: l2d,
          isGreen: p2d > 0,
          hitTarget: hitT2d,
        },
        twoColumns: {
          profit: p2c,
          peak: peak2c,
          wins: w2c,
          losses: l2c,
          isGreen: p2c > 0,
          hitTarget: hitT2c,
        },
        romanosky: {
          profit: pRom,
          peak: peakRom,
          wins: wRom,
          losses: lRom,
          isGreen: pRom > 0,
          hitTarget: hitTRom,
        },
        voisins: {
          profit: pVoi,
          peak: peakVoi,
          wins: wVoi,
          losses: lVoi,
          isGreen: pVoi > 0,
          hitTarget: hitTVoi,
        },
        wheelNeighbors: {
          profit: pWNei,
          peak: peakWNei,
          wins: wWNei,
          losses: lWNei,
          isGreen: pWNei > 0,
          hitTarget: hitTWNei,
        },
        tier: {
          profit: pTie,
          peak: peakTie,
          wins: wTie,
          losses: lTie,
          isGreen: pTie > 0,
          hitTarget: hitTTie,
        },
        orphelins: {
          profit: pOrp,
          peak: peakOrp,
          wins: wOrp,
          losses: lOrp,
          isGreen: pOrp > 0,
          hitTarget: hitTOrp,
        },
        d1Count: d1,
        d2Count: d2,
        d3Count: d3,
        zeroCount: zero,
        redCount: red,
        blackCount: black,
        repeatsInBlock: repeats,
      });
    }

    return result;
  }, [sortedSpins, blockSize, targetGainUnits, vizinhosCount]);

  // Sorted blocks according to user preference (descending: newest first, or ascending: oldest first)
  const displayBlocks = useMemo(() => {
    return blockSortOrder === 'desc' ? [...blocks].reverse() : blocks;
  }, [blocks, blockSortOrder]);

  // Aggregate stats across complete blocks
  const completeBlocks = useMemo(() => blocks.filter((b) => b.isComplete), [blocks]);
  const activeBlock = useMemo(() => blocks.find((b) => !b.isComplete) || null, [blocks]);

  const aggregateStats = useMemo(() => {
    if (completeBlocks.length === 0) {
      return {
        totalBlocks: 0,
        greenBlocks: 0,
        redBlocks: 0,
        hitTargetBlocks: 0,
        greenPct: 0,
        hitTargetPct: 0,
        avgProfitUnits: 0,
        maxGreenStreak: 0,
        maxRedStreak: 0,
      };
    }

    let green = 0;
    let red = 0;
    let hitTarget = 0;
    let totalProfUnits = 0;

    let currGreenSeq = 0, maxGreenSeq = 0;
    let currRedSeq = 0, maxRedSeq = 0;

    completeBlocks.forEach((b) => {
      const data = b[selectedStrategy];
      totalProfUnits += data.profit;

      if (data.isGreen) {
        green++;
        currGreenSeq++;
        currRedSeq = 0;
        if (currGreenSeq > maxGreenSeq) maxGreenSeq = currGreenSeq;
      } else {
        red++;
        currRedSeq++;
        currGreenSeq = 0;
        if (currRedSeq > maxRedSeq) maxRedSeq = currRedSeq;
      }

      if (data.hitTarget) {
        hitTarget++;
      }
    });

    const totalB = completeBlocks.length;
    return {
      totalBlocks: totalB,
      greenBlocks: green,
      redBlocks: red,
      hitTargetBlocks: hitTarget,
      greenPct: ((green / totalB) * 100),
      hitTargetPct: ((hitTarget / totalB) * 100),
      avgProfitUnits: totalProfUnits / totalB,
      maxGreenStreak: maxGreenSeq,
      maxRedStreak: maxRedSeq,
    };
  }, [completeBlocks, selectedStrategy]);

  // Active block (in progress) or latest block if all completed
  const currentBlock = useMemo(() => {
    if (blocks.length === 0) return null;
    return blocks.find((b) => !b.isComplete) || blocks[blocks.length - 1];
  }, [blocks]);

  // Outcome (Green/Red) per round/spin for the selected strategy ONLY for the CURRENT block
  const currentBlockOutcomes = useMemo(() => {
    if (!currentBlock) return [];
    const startGlobalIdx = (currentBlock.blockNumber - 1) * blockSize;
    return currentBlock.spins.map((spin, sIdx) => {
      const num = spin.numero;
      const globalIdx = startGlobalIdx + sIdx;
      let isWin = false;

      if (selectedStrategy === 'twoDozens') {
        isWin = num >= 1 && num <= 24;
      } else if (selectedStrategy === 'twoColumns') {
        isWin = num > 0 && num % 3 !== 0;
      } else if (selectedStrategy === 'romanosky') {
        isWin = ROMANOSKY_SET.has(num);
      } else if (selectedStrategy === 'voisins') {
        isWin = VOISINS_SET.has(num);
      } else if (selectedStrategy === 'wheelNeighbors') {
        if (globalIdx > 0) {
          const prevNum = sortedSpins[globalIdx - 1]?.numero;
          if (prevNum !== null && prevNum !== undefined) {
            const neighbors = getWheelNeighbors(prevNum, vizinhosCount);
            isWin = neighbors.has(num);
          }
        }
      } else if (selectedStrategy === 'tier') {
        isWin = TIER_SET.has(num);
      } else if (selectedStrategy === 'orphelins') {
        isWin = ORPHELINS_SET.has(num);
      }

      return {
        giro: spin.giro,
        numero: num,
        color: spin.color,
        isWin,
      };
    });
  }, [currentBlock, selectedStrategy, blockSize, sortedSpins, vizinhosCount]);

  // Streak & sequence statistics for current block
  const currentBlockStreakStats = useMemo(() => {
    if (!currentBlock || currentBlockOutcomes.length === 0) {
      return {
        totalWins: 0,
        totalLosses: 0,
        winRatePct: 0,
        currentType: null as 'GREEN' | 'RED' | null,
        currentCount: 0,
        lastStreakType: null as 'GREEN' | 'RED' | null,
        lastStreakCount: 0,
        maxGreenStreak: 0,
        maxRedStreak: 0,
      };
    }

    const stratData = currentBlock[selectedStrategy];
    const totalWins = stratData.wins;
    const totalLosses = stratData.losses;
    const totalSpins = currentBlockOutcomes.length;
    const winRatePct = totalSpins > 0 ? (totalWins / totalSpins) * 100 : 0;

    let maxGreen = 0;
    let maxRed = 0;

    const completedStreaks: { type: 'GREEN' | 'RED'; count: number }[] = [];
    let curType: 'GREEN' | 'RED' | null = null;
    let curCount = 0;

    currentBlockOutcomes.forEach((spin) => {
      const type: 'GREEN' | 'RED' = spin.isWin ? 'GREEN' : 'RED';

      if (curType === type) {
        curCount++;
      } else {
        if (curType !== null) {
          completedStreaks.push({ type: curType, count: curCount });
        }
        curType = type;
        curCount = 1;
      }

      if (type === 'GREEN' && curCount > maxGreen) maxGreen = curCount;
      if (type === 'RED' && curCount > maxRed) maxRed = curCount;
    });

    const lastCompleted = completedStreaks.length > 0 ? completedStreaks[completedStreaks.length - 1] : null;

    return {
      totalWins,
      totalLosses,
      winRatePct,
      currentType: curType,
      currentCount: curCount,
      lastStreakType: lastCompleted?.type || null,
      lastStreakCount: lastCompleted?.count || 0,
      maxGreenStreak: maxGreen,
      maxRedStreak: maxRed,
    };
  }, [currentBlock, currentBlockOutcomes, selectedStrategy]);

  const totalNeighborNums = 2 * vizinhosCount + 1;
  const coveragePct = ((totalNeighborNums / 37) * 100).toFixed(1);

  const strategyTitles = {
    wheelNeighbors: `Vizinhos do Cilindro (${vizinhosCount} Vizinhos de cada lado - ${totalNeighborNums} Números / Cobertura ${coveragePct}%)`,
    voisins: 'Vizinhos do Zéro (17 Números no Cilindro - Cobertura 45.9%)',
    twoDozens: '2 Dúzias (1 ao 24 - Cobertura 64.8%)',
    twoColumns: '2 Colunas Dominantes (Colunas 1 e 2 - Cobertura 64.8%)',
    romanosky: 'Romanosky (Cobertura 86.4%)',
    tier: 'Tiers du Cylindre (12 Números - Cobertura 32.4%)',
    orphelins: 'Orphelins / Órfãos (8 Números - Cobertura 21.6%)',
  };

  const handleStrategyChange = (val: string) => {
    if (val.startsWith('wheelNeighbors_')) {
      const cnt = parseInt(val.split('_')[1], 10);
      setVizinhosCount(cnt);
      setSelectedStrategy('wheelNeighbors');
    } else {
      setSelectedStrategy(val as any);
    }
  };

  const currentSelectValue = selectedStrategy === 'wheelNeighbors' ? `wheelNeighbors_${vizinhosCount}` : selectedStrategy;

  return (
    <div className="space-y-2">
      {/* Aggregate Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
        {/* Total Blocks */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 sm:p-2.5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">Total Blocos</span>
            <Layers className="w-3 h-3 text-amber-400 shrink-0" />
          </div>
          <div className="mt-1">
            <div className="text-base sm:text-lg font-black text-slate-100 font-mono leading-none">
              {aggregateStats.totalBlocks} <span className="text-[10px] text-slate-500 font-normal">compl.</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-1 truncate">
              {spins.length} giros totais
            </div>
          </div>
        </div>

        {/* % Green Blocks */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 sm:p-2.5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">Blocos no Verde</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
          </div>
          <div className="mt-1">
            <div className="text-base sm:text-lg font-black text-emerald-400 font-mono leading-none">
              {aggregateStats.greenPct.toFixed(1)}%
            </div>
            <div className="text-[9px] text-slate-400 mt-1 truncate">
              {aggregateStats.greenBlocks}/{aggregateStats.totalBlocks} lucrativos
            </div>
          </div>
        </div>

        {/* % Reached Target Gain (Stop Gain Peak) */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-lg p-2 sm:p-2.5 shadow-sm bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 truncate">Pico Stop Gain (+2u)</span>
            <Target className="w-3 h-3 text-amber-400 shrink-0" />
          </div>
          <div className="mt-1">
            <div className="text-base sm:text-lg font-black text-amber-300 font-mono leading-none">
              {aggregateStats.hitTargetPct.toFixed(1)}%
            </div>
            <div className="text-[9px] text-amber-400/80 mt-1 truncate">
              {aggregateStats.hitTargetBlocks} bateram a meta ({blockSize}g)
            </div>
          </div>
        </div>

        {/* Max Green Streak */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 sm:p-2.5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">Seq. Máx. Verde</span>
            <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
          </div>
          <div className="mt-1">
            <div className="text-base sm:text-lg font-black text-emerald-400 font-mono leading-none">
              {aggregateStats.maxGreenStreak} <span className="text-[10px] text-slate-400 font-normal">blocos</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-1 truncate">
              Maior acerto contínuo
            </div>
          </div>
        </div>

        {/* Avg Profit per Block */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 sm:p-2.5 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 truncate">Média / Bloco</span>
            <TrendingUp className="w-3 h-3 text-blue-400 shrink-0" />
          </div>
          <div className="mt-1">
            <div className={`text-base sm:text-lg font-black font-mono leading-none ${aggregateStats.avgProfitUnits >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {aggregateStats.avgProfitUnits >= 0 ? '+' : ''}
              {aggregateStats.avgProfitUnits.toFixed(2)}u
            </div>
            <div className="text-[9px] text-slate-400 mt-1 font-mono truncate">
              ~ {currency} {(aggregateStats.avgProfitUnits * unitBet).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Active Block Banner (In-Progress) */}
      {activeBlock && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-lg py-2 px-3 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 animate-pulse">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider">
                    Bloco #{activeBlock.blockNumber} Em Andamento
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-amber-500/30 border border-amber-400/50 text-amber-300 text-sm sm:text-lg font-black tracking-wide shadow-md font-mono">
                    Giro {activeBlock.spins.length} / {blockSize}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">
                  Faltam <strong>{blockSize - activeBlock.spins.length} giros</strong> para concluir o ciclo e dar reset.
                </p>
              </div>
            </div>

            {/* Active Block Partial Results */}
            <div className="flex items-center gap-2.5 bg-slate-950/90 py-1.5 px-3 rounded-lg border border-slate-800/80 shrink-0 flex-wrap">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Giros</span>
                <div className="flex items-center gap-0.5 mt-0.5 max-w-[220px] sm:max-w-none overflow-x-auto pb-0.5">
                  {[...activeBlock.spins].reverse().map((s, idx) => {
                    const c = (s.color || '').toLowerCase();
                    const colorClass = c === 'red' ? 'bg-rose-600 border-rose-500' : c === 'black' ? 'bg-slate-900 border-slate-700' : 'bg-emerald-600 border-emerald-500';
                    return (
                      <span
                        key={idx}
                        className={`w-5 h-5 rounded border ${colorClass} text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-xs shrink-0`}
                        title={`Giro ${s.giro}: Número ${s.numero}`}
                      >
                        {s.numero}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="h-7 w-px bg-slate-800/80 hidden sm:block" />

              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Greens / Reds</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-400 border border-emerald-500/40 text-[11px] font-black font-mono flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {activeBlock[selectedStrategy].wins} Greens
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-950/90 text-rose-400 border border-rose-500/40 text-[11px] font-black font-mono flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    {activeBlock[selectedStrategy].losses} Reds
                  </span>
                </div>
              </div>

              <div className="h-7 w-px bg-slate-800/80 hidden sm:block" />

              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Saldo Parcial ({selectedStrategy.toUpperCase()})</span>
                <div className={`text-xs sm:text-sm font-black font-mono leading-tight mt-0.5 ${activeBlock[selectedStrategy].profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {activeBlock[selectedStrategy].profit >= 0 ? '+' : ''}
                  {activeBlock[selectedStrategy].profit.toFixed(1)}u ({currency} {(activeBlock[selectedStrategy].profit * unitBet).toFixed(2)})
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Block Timeline Grid (Visual Map of all blocks) */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 sm:p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 flex-wrap gap-1.5">
          <div className="flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
            <h3 className="text-xs font-black uppercase text-slate-200 tracking-wider">
              Mapa Sequencial dos Blocos ({strategyTitles[selectedStrategy]})
            </h3>
            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 text-[9px] font-bold border border-amber-500/20">
              {blockSortOrder === 'desc' ? 'Recentes Primeiro ⬇' : 'Antigos Primeiro ⬆'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            Clique no bloco para expandir os detalhes dos {blockSize} giros
          </span>
        </div>

        {/* Detailed Green / Red Sequence & Streaks Summary for CURRENT BLOCK ONLY */}
        <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-3 space-y-2.5 shadow-inner">
          {/* Row 1: Streaks Summary Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* Sequência Atual */}
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sequência Atual</span>
              <div className="mt-1 flex items-center gap-1.5 font-mono font-black">
                {currentBlockStreakStats.currentType ? (
                  <span className={`px-2 py-0.5 rounded-md border text-xs font-bold uppercase flex items-center gap-1 ${
                    currentBlockStreakStats.currentType === 'GREEN'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                      : 'bg-rose-950 text-rose-300 border-rose-500/50'
                  }`}>
                    <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                    {currentBlockStreakStats.currentCount}x {currentBlockStreakStats.currentType === 'GREEN' ? '🟩 GREEN' : '🟥 RED'}
                  </span>
                ) : (
                  <span className="text-slate-500 font-normal text-xs">-</span>
                )}
              </div>
            </div>

            {/* Última Sequência Concluída */}
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Última Sequência Ant.</span>
              <div className="mt-1 font-mono font-black">
                {currentBlockStreakStats.lastStreakType ? (
                  <span className={`px-2 py-0.5 rounded-md border text-xs font-bold uppercase flex items-center gap-1 ${
                    currentBlockStreakStats.lastStreakType === 'GREEN'
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-950/80 text-rose-400 border-rose-500/30'
                  }`}>
                    <History className="w-3 h-3 text-slate-400 shrink-0" />
                    {currentBlockStreakStats.lastStreakCount}x {currentBlockStreakStats.lastStreakType === 'GREEN' ? '🟩 GREEN' : '🟥 RED'}
                  </span>
                ) : (
                  <span className="text-slate-500 font-normal text-xs">-</span>
                )}
              </div>
            </div>

            {/* Maior Sequência no Bloco */}
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Maior Sequência no Bloco</span>
              <div className="mt-1 flex items-center gap-1.5 font-mono font-black text-xs">
                <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  🟩 Max {currentBlockStreakStats.maxGreenStreak}x
                </span>
                <span className="text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                  🟥 Max {currentBlockStreakStats.maxRedStreak}x
                </span>
              </div>
            </div>

            {/* Placar do Bloco Atual */}
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Placar do Bloco #{currentBlock?.blockNumber || 1} ({currentBlockOutcomes.length}/{blockSize} Giros)
              </span>
              <div className="mt-1 flex items-center gap-1.5 font-mono font-black text-xs">
                <span className="text-emerald-400 font-bold">
                  {currentBlockStreakStats.totalWins} {currentBlockStreakStats.totalWins === 1 ? 'Green' : 'Greens'}
                </span>
                <span className="text-slate-600">/</span>
                <span className="text-rose-400 font-bold">
                  {currentBlockStreakStats.totalLosses} {currentBlockStreakStats.totalLosses === 1 ? 'Red' : 'Reds'}
                </span>
                {currentBlockOutcomes.length > 0 && (
                  <span className="text-amber-400 font-black ml-auto">
                    ({currentBlockStreakStats.winRatePct.toFixed(0)}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Sequence of GREEN / RED for CURRENT BLOCK ONLY */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400 mb-1.5 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Activity className="w-3.5 h-3.5" />
                  Sequência do Bloco Atual #{currentBlock?.blockNumber || 1} ({currentBlockOutcomes.length} de {blockSize} rodadas):
                </span>
                {/* Numeric summary badge: e.g. "3 Greens / 1 Red" */}
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-xs font-black font-mono flex items-center gap-1.5 shadow-xs">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {currentBlockStreakStats.totalWins} {currentBlockStreakStats.totalWins === 1 ? 'Green' : 'Greens'}
                  </span>
                  <span className="text-slate-600 font-normal">/</span>
                  <span className="text-rose-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    {currentBlockStreakStats.totalLosses} {currentBlockStreakStats.totalLosses === 1 ? 'Red' : 'Reds'}
                  </span>
                </span>
              </div>

              <span className="text-slate-500 font-mono text-[9px]">
                {blockSortOrder === 'desc' ? 'Recentes ➔ Antigos' : 'Antigos ➔ Recentes'}
              </span>
            </div>

            {currentBlockOutcomes.length > 0 ? (
              <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full scrollbar-thin scrollbar-thumb-slate-800">
                {(blockSortOrder === 'desc' ? [...currentBlockOutcomes].reverse() : currentBlockOutcomes).map((spin) => (
                  <div
                    key={spin.giro}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono shrink-0 flex items-center gap-1 border shadow-2xs ${
                      spin.isWin
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                        : 'bg-rose-950 text-rose-300 border-rose-500/50'
                    }`}
                    title={`Giro #${spin.giro}: Número ${spin.numero} (${spin.color}) - ${spin.isWin ? 'GREEN (Vitória)' : 'RED (Derrota)'}`}
                  >
                    <span className="opacity-60 text-[9px]">#{spin.giro}</span>
                    <span className="font-extrabold">{spin.numero}</span>
                    <span>{spin.isWin ? '🟩' : '🟥'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic py-1">
                Nenhum giro efetuado neste bloco ainda.
              </div>
            )}
          </div>
        </div>

        {/* Grid of Block Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-1.5">
          {displayBlocks.map((block) => {
            const data = block[selectedStrategy];
            const isExpanded = expandedBlockId === block.blockNumber;

            let bgColor = 'bg-slate-950 border-slate-800 text-slate-400';
            let badgeText = '⚪ NEUTRO';
            let badgeBg = 'bg-slate-800 text-slate-300';

            if (!block.isComplete) {
              bgColor = 'bg-amber-950/30 border-amber-500/40 text-amber-300 animate-pulse';
              badgeText = '⏳ ATIVO';
              badgeBg = 'bg-amber-500/20 text-amber-300';
            } else if (data.isGreen) {
              bgColor = 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/30';
              badgeText = '🟩 VERDE';
              badgeBg = 'bg-emerald-500/20 text-emerald-300';
            } else {
              bgColor = 'bg-rose-950/30 border-rose-500/40 text-rose-300 hover:bg-rose-900/30';
              badgeText = '🟥 RED';
              badgeBg = 'bg-rose-500/20 text-rose-300';
            }

            return (
              <button
                key={block.blockNumber}
                onClick={() => setExpandedBlockId(isExpanded ? null : block.blockNumber)}
                className={`p-1.5 rounded-lg border transition-all text-left flex flex-col justify-between ${bgColor} ${
                  isExpanded ? 'ring-2 ring-amber-400 scale-[1.02]' : 'hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[9px] font-black uppercase tracking-wider opacity-80">
                    B#{block.blockNumber}
                  </span>
                  <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${badgeBg}`}>
                    {data.isGreen ? `+${data.profit.toFixed(1)}u` : `${data.profit.toFixed(1)}u`}
                  </span>
                </div>

                <div className="mt-1 font-mono text-[10px] font-bold">
                  G{block.startIndex}-{block.endIndex}
                </div>

                {/* Target Hit indicator */}
                {data.hitTarget && (
                  <div className="mt-0.5 flex items-center gap-0.5 text-[8px] font-bold text-amber-400">
                    <Target className="w-2 h-2 shrink-0" />
                    <span>Meta +2u</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Wheel Neighbors Alert Card */}
      <WheelNeighborsAlertCard
        spins={spins}
        strategy={strategy}
        onUpdateStrategy={onUpdateStrategy}
      />

      {/* Header Banner & Selector Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Title & Subtitle */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-slate-100 tracking-tight">
                Análise Sequencial por Blocos ({blockSize} Giros)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                Modo Reset a Cada {blockSize} Giros
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              Divide todo o histórico de lançamentos da mesa em ciclos independentes de <strong>{blockSize} giros</strong>.
              Permite observar onde a banca atinge seu pico de lucro (Stop Gain) antes que a probabilidade matemática converja para zero.
            </p>
          </div>
        </div>

        {/* Control Toolbar */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          {/* Main Controls Group */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Block Size Options */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold uppercase text-slate-400 px-1">Tamanho:</span>
              {[10, 12, 20, 30, 50].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setBlockSize(sz)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                    blockSize === sz
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {sz}g
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            {/* Strategy Selection */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 px-1">Estratégia:</span>
              <select
                value={currentSelectValue}
                onChange={(e) => handleStrategyChange(e.target.value)}
                className="bg-slate-900 text-amber-400 font-bold text-xs border border-slate-800 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <optgroup label="Estratégias de Vizinhos do Cilindro">
                  <option value="wheelNeighbors_7">Vizinhos do Cilindro (7 Vizinhos - 15n / 40.5%)</option>
                  <option value="wheelNeighbors_6">Vizinhos do Cilindro (6 Vizinhos - 13n / 35.1%)</option>
                  <option value="wheelNeighbors_5">Vizinhos do Cilindro (5 Vizinhos - 11n / 29.7%)</option>
                  <option value="wheelNeighbors_4">Vizinhos do Cilindro (4 Vizinhos - 9n / 24.3%)</option>
                  <option value="wheelNeighbors_3">Vizinhos do Cilindro (3 Vizinhos - 7n / 18.9%)</option>
                  <option value="wheelNeighbors_2">Vizinhos do Cilindro (2 Vizinhos - 5n / 13.5%)</option>
                  <option value="voisins">Vizinhos do Zéro (17n - 45.9%)</option>
                  <option value="tier">Tiers du Cylindre (12n - 32.4%)</option>
                  <option value="orphelins">Orphelins (8n - 21.6%)</option>
                </optgroup>
                <optgroup label="Dúzias, Colunas & Quadrados">
                  <option value="twoDozens">2 Dúzias (24n - 64.8%)</option>
                  <option value="twoColumns">2 Colunas (24n - 64.8%)</option>
                  <option value="romanosky">Romanosky (32n - 86.4%)</option>
                </optgroup>
              </select>
            </div>

            {/* Quick Vizinhos buttons if Wheel Neighbors is active */}
            {selectedStrategy === 'wheelNeighbors' && (
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
                <span className="text-[10px] font-bold text-amber-400 uppercase px-1">Vizinhos:</span>
                {[2, 3, 4, 5, 6, 7].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setVizinhosCount(cnt)}
                    className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${
                      vizinhosCount === cnt
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cnt} VIZ
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Block Sort Order Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase px-1">Ordem:</span>
            <button
              type="button"
              onClick={() => setBlockSortOrder('desc')}
              className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                blockSortOrder === 'desc'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
              title="Mostrar blocos mais recentes primeiro"
            >
              <ArrowDown className="w-3 h-3" />
              Recentes (#{blocks.length}→#1)
            </button>
            <button
              type="button"
              onClick={() => setBlockSortOrder('asc')}
              className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                blockSortOrder === 'asc'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
              title="Mostrar blocos mais antigos primeiro"
            >
              <ArrowUp className="w-3 h-3" />
              Antigos (#1→#{blocks.length})
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Accordion List of Blocks */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black uppercase text-slate-200 tracking-wider">
              Histórico Detalhado Bloco a Bloco ({blocks.length} Blocos)
            </h3>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 text-[10px] font-bold border border-slate-700">
              {blockSortOrder === 'desc' ? 'Mais Recente Primeiro ⬇' : 'Mais Antigo Primeiro ⬆'}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {blockSortOrder === 'desc' ? 'Ordem decrescente (#52 → #1)' : 'Ordem crescente (#1 → #52)'}
          </span>
        </div>

        <div className="space-y-2">
          {displayBlocks.map((block) => {
            const activeDefault = expandedBlockId === null ? block.blockNumber === blocks.length : expandedBlockId === block.blockNumber;
            const isExpanded = activeDefault;
            const data = block[selectedStrategy];

            return (
              <div
                key={block.blockNumber}
                className={`border rounded-xl transition-all overflow-hidden ${
                  data.isGreen
                    ? 'border-emerald-500/30 bg-slate-950/80'
                    : 'border-rose-500/30 bg-slate-950/80'
                }`}
              >
                {/* Block Header Row */}
                <div
                  onClick={() => setExpandedBlockId(isExpanded ? null : block.blockNumber)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-900/80 transition-colors gap-2 flex-wrap"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs font-black text-amber-400 flex items-center justify-center shrink-0">
                      #{block.blockNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-100">
                          Bloco {block.blockNumber} (Giros {block.startIndex} ao {block.endIndex})
                        </span>
                        {block.isComplete ? (
                          data.isGreen ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> VERDE (+{data.profit.toFixed(1)}u)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> RED ({data.profit.toFixed(1)}u)
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                            ⏳ Em Andamento ({block.spins.length}/{blockSize}g)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {data.wins} Vitórias ({((data.wins / block.spins.length) * 100).toFixed(0)}%) / {data.losses} Derrotas
                      </p>
                    </div>
                  </div>

                  {/* Summary Indicators */}
                  <div className="flex items-center gap-3">
                    {/* Peak Target Indicator */}
                    {data.hitTarget && (
                      <span className="px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1">
                        <Target className="w-3 h-3 text-amber-400" /> Pico +{data.peak.toFixed(1)}u
                      </span>
                    )}

                    {/* Net Result */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Resultado Líquido</span>
                      <span className={`text-sm font-black font-mono ${data.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {data.profit >= 0 ? '+' : ''}
                        {data.profit.toFixed(1)}u ({currency} {(data.profit * unitBet).toFixed(2)})
                      </span>
                    </div>

                    <button className="p-1 text-slate-400 hover:text-slate-200">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-3 border-t border-slate-800/80 bg-slate-900/50 space-y-3">
                    {/* Spin Sequence Badge Pills */}
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                        Sequência de Números do Bloco #{block.blockNumber}:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {block.spins.map((spin, idx) => {
                          const c = (spin.color || '').toLowerCase();
                          const colorClass =
                            c === 'red'
                              ? 'bg-rose-600 text-white border border-rose-500'
                              : c === 'black'
                              ? 'bg-slate-900 text-slate-100 border border-slate-700'
                              : 'bg-emerald-600 text-white border border-emerald-400';

                          return (
                            <div
                              key={idx}
                              className={`px-2.5 py-1 rounded-lg ${colorClass} font-mono text-xs font-bold shadow-sm flex items-center gap-1`}
                            >
                              <span className="text-[10px] opacity-70">#{spin.giro}:</span>
                              <span className="text-sm font-black">{spin.numero}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Performance matrix for all strategies in this block */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">2 Dúzias (1-24)</span>
                        <div className={`text-xs font-black font-mono mt-1 ${block.twoDozens.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {block.twoDozens.profit >= 0 ? '+' : ''}{block.twoDozens.profit.toFixed(1)}u ({currency} {(block.twoDozens.profit * unitBet).toFixed(2)})
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {block.twoDozens.wins}W / {block.twoDozens.losses}L (Pico: +{block.twoDozens.peak.toFixed(1)}u)
                        </span>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Romanosky (86.4%)</span>
                        <div className={`text-xs font-black font-mono mt-1 ${block.romanosky.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {block.romanosky.profit >= 0 ? '+' : ''}{block.romanosky.profit.toFixed(1)}u ({currency} {(block.romanosky.profit * unitBet).toFixed(2)})
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {block.romanosky.wins}W / {block.romanosky.losses}L (Pico: +{block.romanosky.peak.toFixed(1)}u)
                        </span>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Vizinhos Zéro (45.9%)</span>
                        <div className={`text-xs font-black font-mono mt-1 ${block.voisins.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {block.voisins.profit >= 0 ? '+' : ''}{block.voisins.profit.toFixed(1)}u ({currency} {(block.voisins.profit * unitBet).toFixed(2)})
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {block.voisins.wins}W / {block.voisins.losses}L (Pico: +{block.voisins.peak.toFixed(1)}u)
                        </span>
                      </div>
                    </div>

                    {/* Block Distribution Metadata */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 flex-wrap gap-2">
                      <span>
                        <strong>Dúzias:</strong> 1ªD ({block.d1Count}) | 2ªD ({block.d2Count}) | 3ªD ({block.d3Count})
                      </span>
                      <span>
                        <strong>Cores:</strong> Vermelho ({block.redCount}) | Preto ({block.blackCount}) | Zeros ({block.zeroCount})
                      </span>
                      <span>
                        <strong>Repetições no bloco:</strong> {block.repeatsInBlock} número(s)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
