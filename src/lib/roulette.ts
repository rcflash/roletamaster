import { NumberColor, DozenType, ColumnType, ParityType, HalfType, SpinRecord, TempItem, NumberStats, StrategyConfig } from '../types';

export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
export const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

export const EUROPEAN_WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

export function getWheelNeighbors(targetNum: number, neighborCount: number = 2): number[] {
  const idx = EUROPEAN_WHEEL_ORDER.indexOf(targetNum);
  if (idx === -1) return [targetNum];

  const result: number[] = [];
  const total = EUROPEAN_WHEEL_ORDER.length;

  for (let i = -neighborCount; i <= neighborCount; i++) {
    const pos = (idx + i + total * 10) % total;
    result.push(EUROPEAN_WHEEL_ORDER[pos]);
  }
  return result;
}

export interface NeighborsAlertInfo {
  hasAlert: boolean;
  targetNum: number;
  neighborCount: number;
  neighborsList: number[];
  alertMessage: string;
  recommendedBetText: string;
  repeatCountInSector: number;
}

export function calculateNeighborsAlert(
  spins: SpinRecord[],
  neighborRadius: number = 2
): NeighborsAlertInfo | null {
  if (spins.length < 2) return null;

  const lastSpin = spins[spins.length - 1];
  const lastNum = lastSpin.numero;

  const neighbors = getWheelNeighbors(lastNum, neighborRadius);
  const totalSector = neighbors.length; // 5, 7, 9, 11, 13, 15

  // Smart Hot Sector Algorithm:
  // Analyze last 10 spins density + recent 3 spins momentum
  const recent10 = spins.slice(-10);
  const hitsInSector10 = recent10.filter((s) => neighbors.includes(s.numero)).length;

  const recent3 = spins.slice(-3);
  const hitsInSector3 = recent3.filter((s) => neighbors.includes(s.numero)).length;

  // Thresholds based on neighborRadius
  let minHits10 = 2;
  if (neighborRadius >= 3) minHits10 = 3;
  if (neighborRadius >= 5) minHits10 = 4;

  // Trigger alert if sector density is high in last 10 AND active momentum in last 3 spins
  const hasAlert = hitsInSector10 >= minHits10 && hitsInSector3 >= 1;

  if (hasAlert) {
    return {
      hasAlert: true,
      targetNum: lastNum,
      neighborCount: neighborRadius,
      neighborsList: neighbors,
      alertMessage: `🔥 SETOR AQUECIDO COM MOMENTUM! O setor do nº ${lastNum} (${neighborRadius} vizinhos) registrou ${hitsInSector10} acertos nos últimos 10 giros e tendência ativa!`,
      recommendedBetText: `R$ 2,50 nas ${totalSector} casas: [${neighbors.join(', ')}] (Custo Total: R$ ${(totalSector * 2.5).toFixed(2)})`,
      repeatCountInSector: hitsInSector10,
    };
  }

  return {
    hasAlert: false,
    targetNum: lastNum,
    neighborCount: neighborRadius,
    neighborsList: neighbors,
    alertMessage: `Último número foi ${lastNum}. Fora do ponto de entrada otimizado (${hitsInSector10}/${minHits10} acertos no setor nos últimos 10 giros).`,
    recommendedBetText: `Aguardando confirmação de tendência no setor do nº ${lastNum} [${neighbors.join(', ')}]`,
    repeatCountInSector: hitsInSector10,
  };
}

export function getNumberColor(num: number): NumberColor {
  if (num === 0) return 'green';
  return RED_NUMBERS.includes(num) ? 'red' : 'black';
}

export function getNumberDozen(num: number): DozenType {
  if (num === 0) return 'zero';
  if (num >= 1 && num <= 12) return '1a';
  if (num >= 13 && num <= 24) return '2a';
  return '3a';
}

export function getNumberColumn(num: number): ColumnType {
  if (num === 0) return 'zero';
  if (num % 3 === 1) return 'col1';
  if (num % 3 === 2) return 'col2';
  return 'col3';
}

export function getNumberParity(num: number): ParityType {
  if (num === 0) return 'zero';
  return num % 2 === 0 ? 'par' : 'impar';
}

export function getNumberHalf(num: number): HalfType {
  if (num === 0) return 'zero';
  return num <= 18 ? 'low' : 'high';
}

export function getDozenLabel(dozen: DozenType): string {
  switch (dozen) {
    case '1a': return '1ª Dúzia (1-12)';
    case '2a': return '2ª Dúzia (13-24)';
    case '3a': return '3ª Dúzia (25-36)';
    case 'zero': return 'Zero (0)';
  }
}

export function getColumnLabel(col: ColumnType): string {
  switch (col) {
    case 'col1': return 'Coluna 1';
    case 'col2': return 'Coluna 2';
    case 'col3': return 'Coluna 3';
    case 'zero': return 'Zero (0)';
  }
}

export function getParityLabel(par: ParityType): string {
  switch (par) {
    case 'par': return 'Par';
    case 'impar': return 'Ímpar';
    case 'zero': return 'Zero';
  }
}

export function getColorLabel(color: NumberColor): string {
  switch (color) {
    case 'red': return 'Vermelho';
    case 'black': return 'Preto';
    case 'green': return 'Verde';
  }
}

export function getTopAbsenceStreaks(
  spins: SpinRecord[],
  matchFn: (s: SpinRecord) => boolean,
  topCount = 3
): number[] {
  if (spins.length === 0) return [0, 0, 0];

  const gaps: number[] = [];
  let currentGap = 0;

  for (let i = 0; i < spins.length; i++) {
    if (matchFn(spins[i])) {
      gaps.push(currentGap);
      currentGap = 0;
    } else {
      currentGap++;
    }
  }

  // Include current ongoing gap as candidate
  gaps.push(currentGap);

  // Sort descending
  gaps.sort((a, b) => b - a);

  const result = gaps.slice(0, topCount);
  while (result.length < topCount) {
    result.push(0);
  }
  return result;
}

export function calculateTemperatures(spins: SpinRecord[]) {
  const totalSpins = spins.length || 1;

  // Dozen Stats
  const dozenCounts = { '1a': 0, '2a': 0, '3a': 0, 'zero': 0 };
  const dozenWithoutHit = { '1a': 0, '2a': 0, '3a': 0, 'zero': 0 };

  // Calculate spins without hit for dozen
  const dozenFound = { '1a': false, '2a': false, '3a': false, 'zero': false };
  for (let i = spins.length - 1; i >= 0; i--) {
    const d = spins[i].dozen;
    dozenCounts[d]++;
    
    // Count delay
    Object.keys(dozenFound).forEach((key) => {
      const dk = key as DozenType;
      if (!dozenFound[dk]) {
        if (d === dk) {
          dozenFound[dk] = true;
        } else {
          dozenWithoutHit[dk]++;
        }
      }
    });
  }

  const dozenItems: TempItem[] = [
    {
      name: '1ª Dúzia',
      code: '1a',
      count: dozenCounts['1a'],
      frequencyPct: Number(((dozenCounts['1a'] / totalSpins) * 100).toFixed(1)),
      spinsWithoutHit: dozenWithoutHit['1a'],
      top3AbsenceStreaks: getTopAbsenceStreaks(spins, (s) => s.dozen === '1a'),
      status: dozenWithoutHit['1a'] >= 8 ? 'ALERT' : dozenCounts['1a'] / totalSpins >= 0.4 ? 'HOT' : 'NORMAL',
      statusLabel: dozenWithoutHit['1a'] >= 8 ? '🔴 ALERTA' : dozenCounts['1a'] / totalSpins >= 0.4 ? '🔥 QUENTE' : '🟢 NORMAL'
    },
    {
      name: '2ª Dúzia',
      code: '2a',
      count: dozenCounts['2a'],
      frequencyPct: Number(((dozenCounts['2a'] / totalSpins) * 100).toFixed(1)),
      spinsWithoutHit: dozenWithoutHit['2a'],
      top3AbsenceStreaks: getTopAbsenceStreaks(spins, (s) => s.dozen === '2a'),
      status: dozenWithoutHit['2a'] >= 8 ? 'ALERT' : dozenCounts['2a'] / totalSpins >= 0.4 ? 'HOT' : 'NORMAL',
      statusLabel: dozenWithoutHit['2a'] >= 8 ? '🔴 ALERTA' : dozenCounts['2a'] / totalSpins >= 0.4 ? '🔥 QUENTE' : '🟢 NORMAL'
    },
    {
      name: '3ª Dúzia',
      code: '3a',
      count: dozenCounts['3a'],
      frequencyPct: Number(((dozenCounts['3a'] / totalSpins) * 100).toFixed(1)),
      spinsWithoutHit: dozenWithoutHit['3a'],
      top3AbsenceStreaks: getTopAbsenceStreaks(spins, (s) => s.dozen === '3a'),
      status: dozenWithoutHit['3a'] >= 8 ? 'ALERT' : dozenCounts['3a'] / totalSpins >= 0.4 ? 'HOT' : 'NORMAL',
      statusLabel: dozenWithoutHit['3a'] >= 8 ? '🔴 ALERTA' : dozenCounts['3a'] / totalSpins >= 0.4 ? '🔥 QUENTE' : '🟢 NORMAL'
    },
    {
      name: 'Zero',
      code: 'zero',
      count: dozenCounts['zero'],
      frequencyPct: Number(((dozenCounts['zero'] / totalSpins) * 100).toFixed(1)),
      spinsWithoutHit: dozenWithoutHit['zero'],
      top3AbsenceStreaks: getTopAbsenceStreaks(spins, (s) => s.dozen === 'zero' || s.numero === 0),
      status: dozenWithoutHit['zero'] >= 15 ? 'ALERT' : dozenCounts['zero'] / totalSpins >= 0.1 ? 'HOT' : 'NORMAL',
      statusLabel: dozenWithoutHit['zero'] >= 15 ? '🔴 ALERTA' : dozenCounts['zero'] / totalSpins >= 0.1 ? '🔥 QUENTE' : '🟢 NORMAL'
    }
  ];

  // Column Stats
  const colCounts = { 'col1': 0, 'col2': 0, 'col3': 0, 'zero': 0 };
  const colWithoutHit = { 'col1': 0, 'col2': 0, 'col3': 0, 'zero': 0 };
  const colFound = { 'col1': false, 'col2': false, 'col3': false, 'zero': false };

  for (let i = spins.length - 1; i >= 0; i--) {
    const c = spins[i].column;
    colCounts[c]++;
    Object.keys(colFound).forEach((key) => {
      const ck = key as ColumnType;
      if (!colFound[ck]) {
        if (c === ck) {
          colFound[ck] = true;
        } else {
          colWithoutHit[ck]++;
        }
      }
    });
  }

  const columnItems: TempItem[] = [
    {
      name: 'Coluna 1',
      code: 'col1',
      count: colCounts['col1'],
      frequencyPct: Number(((colCounts['col1'] / totalSpins) * 100).toFixed(1)),
      spinsWithoutHit: colWithoutHit['col1'],
      top3AbsenceStreaks: getTopAbsenceStreaks(spins, (s) => s.column === 'col1'),
      status: colCounts['col1'] / totalSpins <= 0.2 ? 'COLD' : colCounts['col1'] / totalSpins >= 0.45 ? 'HOT' : 'NORMAL',
      statusLabel: colCounts['col1'] / totalSpins <= 0.2 ? '❄️ FRIA' : colCounts['col1'] / totalSpins >= 0.45 ? '🔥 QUENTE' : '🟢 NORMAL'
    },
    {
      name: 'Coluna 2',
      code: 'col2',
      count: colCounts['col2'],
      frequencyPct: Number(((colCounts['col2'] / totalSpins) * 100).toFixed(1)),
      spinsWithoutHit: colWithoutHit['col2'],
      top3AbsenceStreaks: getTopAbsenceStreaks(spins, (s) => s.column === 'col2'),
      status: colCounts['col2'] / totalSpins <= 0.2 ? 'COLD' : colCounts['col2'] / totalSpins >= 0.45 ? 'HOT' : 'NORMAL',
      statusLabel: colCounts['col2'] / totalSpins <= 0.2 ? '❄️ FRIA' : colCounts['col2'] / totalSpins >= 0.45 ? '🔥 QUENTE' : '🟢 NORMAL'
    },
    {
      name: 'Coluna 3',
      code: 'col3',
      count: colCounts['col3'],
      frequencyPct: Number(((colCounts['col3'] / totalSpins) * 100).toFixed(1)),
      spinsWithoutHit: colWithoutHit['col3'],
      top3AbsenceStreaks: getTopAbsenceStreaks(spins, (s) => s.column === 'col3'),
      status: colCounts['col3'] / totalSpins <= 0.2 ? 'COLD' : colCounts['col3'] / totalSpins >= 0.45 ? 'HOT' : 'NORMAL',
      statusLabel: colCounts['col3'] / totalSpins <= 0.2 ? '❄️ FRIA' : colCounts['col3'] / totalSpins >= 0.45 ? '🔥 QUENTE' : '🟢 NORMAL'
    }
  ];

  // Color & Zero Stats
  const colorCounts: Record<NumberColor, number> = { red: 0, black: 0, green: 0 };
  const colorWithoutHit: Record<NumberColor, number> = { red: 0, black: 0, green: 0 };
  const colorFound: Record<NumberColor, boolean> = { red: false, black: false, green: false };

  for (let i = spins.length - 1; i >= 0; i--) {
    const c = spins[i].color;
    if (colorCounts[c] !== undefined) {
      colorCounts[c]++;
    }
    (Object.keys(colorFound) as NumberColor[]).forEach((ck) => {
      if (!colorFound[ck]) {
        if (c === ck) {
          colorFound[ck] = true;
        } else {
          colorWithoutHit[ck]++;
        }
      }
    });
  }

  const colorItems: TempItem[] = [
    {
      name: 'Vermelho',
      code: 'red',
      count: colorCounts['red'],
      frequencyPct: Number(((colorCounts['red'] / totalSpins) * 100).toFixed(1)),
      spinsWithoutHit: colorWithoutHit['red'],
      top3AbsenceStreaks: getTopAbsenceStreaks(spins, (s) => s.color === 'red'),
      status: colorWithoutHit['red'] >= 6 ? 'ALERT' : colorCounts['red'] / totalSpins >= 0.52 ? 'HOT' : 'NORMAL',
      statusLabel: colorWithoutHit['red'] >= 6 ? '🔴 ALERTA' : colorCounts['red'] / totalSpins >= 0.52 ? '🔥 QUENTE' : '🟢 NORMAL'
    },
    {
      name: 'Preto',
      code: 'black',
      count: colorCounts['black'],
      frequencyPct: Number(((colorCounts['black'] / totalSpins) * 100).toFixed(1)),
      spinsWithoutHit: colorWithoutHit['black'],
      top3AbsenceStreaks: getTopAbsenceStreaks(spins, (s) => s.color === 'black'),
      status: colorWithoutHit['black'] >= 6 ? 'ALERT' : colorCounts['black'] / totalSpins >= 0.52 ? 'HOT' : 'NORMAL',
      statusLabel: colorWithoutHit['black'] >= 6 ? '🔴 ALERTA' : colorCounts['black'] / totalSpins >= 0.52 ? '🔥 QUENTE' : '🟢 NORMAL'
    },
    {
      name: 'Zero (0)',
      code: 'green',
      count: colorCounts['green'],
      frequencyPct: Number(((colorCounts['green'] / totalSpins) * 100).toFixed(1)),
      spinsWithoutHit: colorWithoutHit['green'],
      top3AbsenceStreaks: getTopAbsenceStreaks(spins, (s) => s.color === 'green' || s.numero === 0),
      status: colorWithoutHit['green'] >= 15 ? 'ALERT' : colorCounts['green'] / totalSpins >= 0.08 ? 'HOT' : 'NORMAL',
      statusLabel: colorWithoutHit['green'] >= 15 ? '🔴 ALERTA' : colorCounts['green'] / totalSpins >= 0.08 ? '🔥 QUENTE' : '🟢 NORMAL'
    }
  ];

  return { dozenItems, columnItems, colorItems };
}

export function calculateNumberStats(spins: SpinRecord[]): NumberStats[] {
  const stats: { [num: number]: NumberStats } = {};
  const totalSpins = spins.length || 1;

  for (let i = 0; i <= 36; i++) {
    stats[i] = {
      num: i,
      color: getNumberColor(i),
      count: 0,
      frequencyPct: 0,
      spinsWithoutHit: 0
    };
  }

  // Count occurrences
  spins.forEach(s => {
    if (stats[s.numero]) {
      stats[s.numero].count++;
    }
  });

  // Calculate delays
  for (let i = 0; i <= 36; i++) {
    stats[i].frequencyPct = Number(((stats[i].count / totalSpins) * 100).toFixed(1));
    let delay = 0;
    for (let s = spins.length - 1; s >= 0; s--) {
      if (spins[s].numero === i) {
        break;
      }
      delay++;
    }
    stats[i].spinsWithoutHit = spins.length === 0 ? 0 : delay;
  }

  return Object.values(stats);
}

export function evaluateNeighborsPayout(
  num: number,
  spinsUpToPrev: SpinRecord[] | number | null | undefined,
  neighborRadius: number = 2,
  chipValue: number = 2.50,
  multiplier?: number,
  tablePayoutMultiplier: number = 36
): { winAmount: number; lossAmount: number; netResult: number; betPlaced: boolean } {
  // Support passing array of previous spins or direct prevNum
  let spinsHistory: SpinRecord[] = [];
  let prevNum: number | null = null;

  if (Array.isArray(spinsUpToPrev)) {
    spinsHistory = spinsUpToPrev;
    if (spinsHistory.length > 0) {
      prevNum = spinsHistory[spinsHistory.length - 1].numero;
    }
  } else if (typeof spinsUpToPrev === 'number') {
    prevNum = spinsUpToPrev;
  }

  if (prevNum === null || prevNum === undefined) {
    return { winAmount: 0, lossAmount: 0, netResult: 0, betPlaced: false };
  }

  // Check if an alert was triggered on the previous spins!
  const alertInfo = spinsHistory.length >= 2 ? calculateNeighborsAlert(spinsHistory, neighborRadius) : null;
  const hasAlert = alertInfo ? alertInfo.hasAlert : true; // Default to true if insufficient history

  // SÓ ENTRA NA OPERAÇÃO E DEBITA/CREDITA SE HOUVER ALERTA ATIVO!
  if (!hasAlert) {
    return { winAmount: 0, lossAmount: 0, netResult: 0, betPlaced: false };
  }

  const mult = multiplier && multiplier > 0 ? multiplier : 1;
  const unitChip = (chipValue || 2.50) * mult;
  const neighbors = getWheelNeighbors(prevNum, neighborRadius);

  const lossAmount = neighbors.length * unitChip;
  let winAmount = 0;

  if (neighbors.includes(num)) {
    // Multiplicador da mesa configurável (padrão 36x para 35:1, 30x para Lightning, 2x para 1:1, etc)
    const tableMult = tablePayoutMultiplier > 0 ? tablePayoutMultiplier : 36;
    winAmount = unitChip * tableMult;
  }

  const netResult = winAmount - lossAmount;
  return { winAmount, lossAmount, netResult, betPlaced: true };
}

export function evaluateSpinPayout(
  num: number,
  strategy: StrategyConfig,
  spinsUpToPrev?: SpinRecord[] | number | null,
  multiplier?: number
): { winAmount: number; lossAmount: number; netResult: number; betPlaced: boolean } {
  const radius = strategy.neighborRadius || 2;
  const chipVal = strategy.neighborChipValue || 2.50;
  const tableMult = strategy.tablePayoutMultiplier || 36;

  if (spinsUpToPrev !== undefined && spinsUpToPrev !== null) {
    return evaluateNeighborsPayout(num, spinsUpToPrev, radius, chipVal, multiplier, tableMult);
  }

  return { winAmount: 0, lossAmount: 0, netResult: 0, betPlaced: false };
}

export function evaluateBotTipOutcome(
  num: number,
  suggestion: string,
  spinsUpToPrev?: SpinRecord[] | number | null,
  strategyRadius: number = 2,
  multiplier?: number,
  tablePayoutMultiplier: number = 36
): { winAmount: number; lossAmount: number; netResult: number; betPlaced: boolean } {
  if (spinsUpToPrev !== undefined && spinsUpToPrev !== null) {
    return evaluateNeighborsPayout(num, spinsUpToPrev, strategyRadius, 2.50, multiplier, tablePayoutMultiplier);
  }
  return { winAmount: 0, lossAmount: 0, netResult: 0, betPlaced: false };
}

export interface StrategyPerformanceRank {
  id: string;
  name: string;
  winRatePct: number;
  netProfit: number;
  evaluatedSpins: number;
  wins: number;
  losses: number;
  description: string;
  neighborRadius?: number;
}

export function getStrategyIdFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('romanosky')) return 'romanosky';
  if (lower.includes('ausentes') || lower.includes('ciclo')) return 'cold_cycle';
  if (lower.includes('2 dúzias') || lower.includes('duzias dominantes')) return 'two_dozens';
  if (lower.includes('dalembert') || lower.includes("d'alembert")) return 'dalembert';
  if (lower.includes('james bond') || lower.includes('007')) return 'james_bond';
  if (lower.includes('voisins') || lower.includes('vizinhos do zero')) return 'voisins';
  if (lower.includes('vizinhos do cilindro') || lower.includes('alerta de vizinhos')) return 'neighbors';
  if (lower.includes('gráfico') || lower.includes('grafico') || lower.includes('sequência') || lower.includes('terminal_sequence')) return 'terminal_sequence_chart';
  if (lower.includes('guga')) return 'guga_tv';
  if (lower.includes('martingale')) return 'martingale_profissional';
  if (lower.includes('simples')) return 'estrategia_simples';
  if (lower.includes('dirty')) return 'dirty_done_cheap';
  if (lower.includes('hopscotch')) return 'hopscotch_pro_max';
  if (lower.includes('split on') || lower.includes('corners')) return 'split_on_corners';
  return '';
}

export function evaluateAllStrategies(
  spins: SpinRecord[],
  neighborRadius: number = 2,
  disabledStrategyIds: string[] = []
): StrategyPerformanceRank[] {
  const sorted = [...spins].sort((a, b) => a.giro - b.giro);
  const sample = sorted.length > 60 ? sorted.slice(-60) : sorted;

  const candidates: StrategyPerformanceRank[] = [];

  // 1. Romanosky
  const romanoskyNums = new Set([
    ...Array.from({ length: 24 }, (_, i) => i + 1),
    25, 26, 28, 29, 32, 33, 35, 36
  ]);
  let rWins = 0, rLosses = 0, rProfit = 0;
  sample.forEach(s => {
    if (romanoskyNums.has(s.numero)) {
      rWins++;
      rProfit += 1;
    } else {
      rLosses++;
      rProfit -= 8;
    }
  });
  const rEval = sample.length;
  candidates.push({
    id: 'romanosky',
    name: 'Estratégia Romanosky (Cobertura 86.4%)',
    winRatePct: rEval > 0 ? Math.round((rWins / rEval) * 1000) / 10 : 86.4,
    netProfit: rProfit * 2.50,
    evaluatedSpins: rEval,
    wins: rWins,
    losses: rLosses,
    description: '32 números cobertos por rodada com alta consistência',
  });

  // 2. Two Dozens
  let tdWins = 0, tdLosses = 0, tdProfit = 0, tdEval = 0;
  sample.forEach((s, idx) => {
    if (idx >= 5) {
      const recent = sample.slice(Math.max(0, idx - 15), idx);
      const dCounts = { D1: 0, D2: 0, D3: 0 };
      recent.forEach(sp => {
        if (sp.dozen === '1a') dCounts.D1++;
        else if (sp.dozen === '2a') dCounts.D2++;
        else if (sp.dozen === '3a') dCounts.D3++;
      });
      const sortedD = (Object.keys(dCounts) as Array<'D1' | 'D2' | 'D3'>).sort((a, b) => dCounts[b] - dCounts[a]);
      const top2DozenSet = new Set<string>();
      if (sortedD[0] === 'D1' || sortedD[1] === 'D1') [1,2,3,4,5,6,7,8,9,10,11,12].forEach(n => top2DozenSet.add(n.toString()));
      if (sortedD[0] === 'D2' || sortedD[1] === 'D2') [13,14,15,16,17,18,19,20,21,22,23,24].forEach(n => top2DozenSet.add(n.toString()));
      if (sortedD[0] === 'D3' || sortedD[1] === 'D3') [25,26,27,28,29,30,31,32,33,34,35,36].forEach(n => top2DozenSet.add(n.toString()));

      tdEval++;
      if (top2DozenSet.has(s.numero.toString())) {
        tdWins++;
        tdProfit += 1;
      } else {
        tdLosses++;
        tdProfit -= 2;
      }
    }
  });
  candidates.push({
    id: 'two_dozens',
    name: 'Aposta em 2 Dúzias Dominantes',
    winRatePct: tdEval > 0 ? Math.round((tdWins / tdEval) * 1000) / 10 : 64.8,
    netProfit: tdProfit * 5.0,
    evaluatedSpins: tdEval,
    wins: tdWins,
    losses: tdLosses,
    description: 'Aposta nas 2 dúzias mais frequentes da mesa',
  });

  // 3. Vizinhos do Cilindro (Avaliando variações: 2, 3, 4 e 5 vizinhos)
  const radiiToTest = [2, 3, 4, 5];
  radiiToTest.forEach((r) => {
    let vWins = 0, vLosses = 0, vProfit = 0, vEval = 0;
    sample.forEach((s, idx) => {
      if (idx >= 2) {
        const historyUpToCurrent = sample.slice(0, idx);
        const alertInfo = calculateNeighborsAlert(historyUpToCurrent, r);
        if (alertInfo.hasAlert) {
          vEval++;
          const isHit = alertInfo.neighborsList.includes(s.numero);
          const cost = alertInfo.neighborsList.length * 2.50;
          if (isHit) {
            vWins++;
            vProfit += (36 * 2.50 - cost);
          } else {
            vLosses++;
            vProfit -= cost;
          }
        }
      }
    });
    const secSize = r * 2 + 1;
    const vizExpected = Math.round(((secSize / 37) * 100) * 10) / 10;
    candidates.push({
      id: `neighbors_${r}`,
      name: `Alerta de Vizinhos (${r} Vizinhos / ${secSize} Casas)`,
      winRatePct: vEval > 0 ? Math.round((vWins / vEval) * 1000) / 10 : vizExpected,
      netProfit: vProfit,
      evaluatedSpins: vEval,
      wins: vWins,
      losses: vLosses,
      description: `Entrada nos ${r} vizinhos do último número (${secSize} casas) em momento de tendência`,
      neighborRadius: r,
    });
  });

  // 4. Ciclo de Ausentes
  let aWins = 0, aLosses = 0, aProfit = 0, aEval = 0;
  sample.forEach((s, idx) => {
    if (idx >= 15) {
      const recentSlice = sample.slice(Math.max(0, idx - 25), idx);
      const seen = new Set(recentSlice.map(item => item.numero));
      const unseen: number[] = [];
      for (let n = 0; n <= 36; n++) {
        if (!seen.has(n)) unseen.push(n);
      }
      if (unseen.length > 0 && unseen.length <= 15) {
        aEval++;
        if (unseen.includes(s.numero)) {
          aWins++;
          aProfit += (36 * 2.50 - unseen.length * 2.50);
        } else {
          aLosses++;
          aProfit -= (unseen.length * 2.50);
        }
      }
    }
  });
  candidates.push({
    id: 'ausentes',
    name: 'Ciclo de Fechamento (Aposta em Ausentes)',
    winRatePct: aEval > 0 ? Math.round((aWins / aEval) * 1000) / 10 : 45.0,
    netProfit: aProfit,
    evaluatedSpins: aEval,
    wins: aWins,
    losses: aLosses,
    description: 'Aposta direta nas pedras frias das últimas 25 rodadas',
  });

  // 5. Voisins du Zero
  const voisinsSet = new Set([22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25]);
  let vzWins = 0, vzLosses = 0, vzProfit = 0;
  sample.forEach(s => {
    if (voisinsSet.has(s.numero)) {
      vzWins++;
      vzProfit += 10;
    } else {
      vzLosses++;
      vzProfit -= 9;
    }
  });
  const vzEval = sample.length;
  candidates.push({
    id: 'voisins',
    name: 'Vizinhos do Zero (Voisins du Zéro)',
    winRatePct: vzEval > 0 ? Math.round((vzWins / vzEval) * 1000) / 10 : 45.9,
    netProfit: vzProfit * 2.50,
    evaluatedSpins: vzEval,
    wins: vzWins,
    losses: vzLosses,
    description: '17 números no setor central da roleta',
  });

  // 7. Análise de Terminais & Sequência (Estratégia do Gráfico)
  let tWins = 0, tLosses = 0, tProfit = 0, tEval = 0;
  sample.forEach((s, idx) => {
    if (idx >= 3) {
      const historySlice = sample.slice(Math.max(0, idx - 15), idx);
      const lastSpin = historySlice[historySlice.length - 1];
      const lastTerminal = lastSpin.numero % 10;
      
      // Contar qual terminal mais seguiu o último terminal no histórico recente
      const followerTerminalsCount: Record<number, number> = {};
      for (let i = 0; i < historySlice.length - 1; i++) {
        if (historySlice[i].numero % 10 === lastTerminal) {
          const nextTerm = historySlice[i + 1].numero % 10;
          followerTerminalsCount[nextTerm] = (followerTerminalsCount[nextTerm] || 0) + 1;
        }
      }
      
      let topFollower = (lastTerminal + 1) % 10;
      let maxCount = 0;
      Object.entries(followerTerminalsCount).forEach(([termStr, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topFollower = Number(termStr);
        }
      });

      // Alvo: Números dos terminais dominante + terminal atual + seguro no 0
      const targetTerminals = new Set([lastTerminal, topFollower]);
      const targetNumbers: number[] = [0];
      for (let n = 1; n <= 36; n++) {
        if (targetTerminals.has(n % 10)) {
          targetNumbers.push(n);
        }
      }

      tEval++;
      const cost = targetNumbers.length * 2.50;
      if (targetNumbers.includes(s.numero)) {
        tWins++;
        tProfit += (36 * 2.50 - cost);
      } else {
        tLosses++;
        tProfit -= cost;
      }
    }
  });

  candidates.push({
    id: 'terminal_sequence_chart',
    name: 'Análise de Terminais & Sequência (Estratégia do Gráfico)',
    winRatePct: tEval > 0 ? Math.round((tWins / tEval) * 1000) / 10 : 32.4,
    netProfit: tProfit,
    evaluatedSpins: tEval,
    wins: tWins,
    losses: tLosses,
    description: 'Leitura gráfica de repetição e atração de terminais históricos no gráfico com proteção no Zero',
  });

  // 8. Estratégia Guga TV (Linha do Tempo & Terminais)
  let gWins = 0, gLosses = 0, gProfit = 0, gEval = 0;
  sample.forEach((s, idx) => {
    if (idx >= 2) {
      const historySlice = sample.slice(Math.max(0, idx - 12), idx);
      const recentTerminals = historySlice.map(spin => spin.numero % 10);
      
      // Guga TV targets key hot line terminals (1, 4, 7, 0, 3) + Zero protection
      const hotTerminals = new Set([1, 4, 7, 0, 3]);
      const activeTerminals = new Set<number>();
      
      recentTerminals.slice(-5).forEach(term => {
        if (hotTerminals.has(term)) {
          activeTerminals.add(term);
        }
      });
      if (activeTerminals.size < 2) {
        activeTerminals.add(1);
        activeTerminals.add(7);
      }

      const gugaTargetNumbers: number[] = [0];
      for (let n = 1; n <= 36; n++) {
        if (activeTerminals.has(n % 10)) {
          gugaTargetNumbers.push(n);
        }
      }

      gEval++;
      const cost = gugaTargetNumbers.length * 2.50;
      if (gugaTargetNumbers.includes(s.numero)) {
        gWins++;
        gProfit += (36 * 2.50 - cost);
      } else {
        gLosses++;
        gProfit -= cost;
      }
    }
  });

  candidates.push({
    id: 'guga_tv',
    name: 'Estratégia Guga TV (Linha do Tempo & Terminais)',
    winRatePct: gEval > 0 ? Math.round((gWins / gEval) * 1000) / 10 : 35.1,
    netProfit: gProfit,
    evaluatedSpins: gEval,
    wins: gWins,
    losses: gLosses,
    description: 'Análise de linha do tempo de terminais quentes (1, 4, 7, 0, 3) com vizinhos e proteção no Zero',
  });

  // 9. Estratégia Martingale De Profissional Na Roleta
  let mWins = 0, mLosses = 0, mProfit = 0, mEval = 0;
  sample.forEach((s, idx) => {
    if (idx >= 3) {
      const historySlice = sample.slice(Math.max(0, idx - 10), idx);
      const recentNumbers = historySlice.map(spin => spin.numero);
      
      const targetSet = new Set<number>([0, 7, 8, 9]);
      recentNumbers.slice(-3).forEach(num => {
        targetSet.add(num);
        const wIdx = EUROPEAN_WHEEL_ORDER.indexOf(num);
        if (wIdx !== -1) {
          const prev = EUROPEAN_WHEEL_ORDER[(wIdx - 1 + 37) % 37];
          const next = EUROPEAN_WHEEL_ORDER[(wIdx + 1) % 37];
          targetSet.add(prev);
          targetSet.add(next);
        }
      });

      const targets = Array.from(targetSet);
      mEval++;
      
      const prevSpin = sample[idx - 1];
      const wasPrevHit = targets.includes(prevSpin.numero);
      const betMultiplier = wasPrevHit ? 1 : 2;
      
      const chipValue = 2.50 * betMultiplier;
      const totalCost = targets.length * chipValue;
      
      if (targets.includes(s.numero)) {
        mWins++;
        mProfit += (36 * chipValue - totalCost);
      } else {
        mLosses++;
        mProfit -= totalCost;
      }
    }
  });

  candidates.push({
    id: 'martingale_profissional',
    name: 'Estratégia Martingale De Profissional Na Roleta',
    winRatePct: mEval > 0 ? Math.round((mWins / mEval) * 1000) / 10 : 38.5,
    netProfit: mProfit,
    evaluatedSpins: mEval,
    wins: mWins,
    losses: mLosses,
    description: 'Martingale profissional de 1 etapa focado em zonas quentes do cilindro (números quentes com 1 vizinho) + terminais altos (7, 8, 9) + Zero (0)',
  });

  // 10. Estratégia Simples na Roleta Online
  let sWins = 0, sLosses = 0, sProfit = 0, sEval = 0;
  sample.forEach((s, idx) => {
    if (idx >= 2) {
      const historySlice = sample.slice(Math.max(0, idx - 10), idx);
      const lastNum = historySlice[historySlice.length - 1].numero;
      const lastTerm = lastNum % 10;
      const targetTerm2 = (lastTerm + 7) % 10;

      const targetSet = new Set<number>([0]);
      for (let n = 1; n <= 36; n++) {
        const t = n % 10;
        if (t === lastTerm || t === targetTerm2) {
          targetSet.add(n);
        }
      }
      const wIdx = EUROPEAN_WHEEL_ORDER.indexOf(lastNum);
      if (wIdx !== -1) {
        targetSet.add(EUROPEAN_WHEEL_ORDER[(wIdx - 1 + 37) % 37]);
        targetSet.add(EUROPEAN_WHEEL_ORDER[(wIdx + 1) % 37]);
      }

      const targets = Array.from(targetSet);
      sEval++;
      const cost = targets.length * 2.50;
      if (targets.includes(s.numero)) {
        sWins++;
        sProfit += (36 * 2.50 - cost);
      } else {
        sLosses++;
        sProfit -= cost;
      }
    }
  });

  candidates.push({
    id: 'estrategia_simples',
    name: 'Estratégia Simples na Roleta Online',
    winRatePct: sEval > 0 ? Math.round((sWins / sEval) * 1000) / 10 : 36.8,
    netProfit: sProfit,
    evaluatedSpins: sEval,
    wins: sWins,
    losses: sLosses,
    description: 'Análise de linha do tempo e vizinhos camuflados do cilindro para acertos de primeira tiro rápido',
  });

  // 11. Dirty Done Cheap (Progressão em Dúzias)
  let ddcPhase = 1;
  let ddcWins = 0, ddcLosses = 0, ddcProfit = 0;
  sample.forEach(s => {
    let bet1 = 10, bet2 = 15;
    if (ddcPhase === 2) { bet1 = 20; bet2 = 25; }
    else if (ddcPhase === 3) { bet1 = 30; bet2 = 30; }
    else if (ddcPhase === 4) { bet1 = 25; bet2 = 50; }

    const cost = bet1 + bet2;
    if (s.dozen === '1a') {
      ddcWins++;
      const payout = bet1 * 3;
      ddcProfit += (payout - cost);
      if (ddcPhase === 1) ddcPhase = 1;
      else if (ddcPhase === 2) ddcPhase = 3;
      else if (ddcPhase === 3) ddcPhase = 1;
      else if (ddcPhase === 4) ddcPhase = 1;
    } else if (s.dozen === '2a') {
      ddcWins++;
      const payout = bet2 * 3;
      ddcProfit += (payout - cost);
      if (ddcPhase === 1) ddcPhase = 2;
      else if (ddcPhase === 2) ddcPhase = 4;
      else if (ddcPhase === 3) ddcPhase = 1;
      else if (ddcPhase === 4) ddcPhase = 1;
    } else {
      ddcLosses++;
      ddcProfit -= cost;
      ddcPhase = 1;
    }
  });
  const ddcEval = sample.length;
  candidates.push({
    id: 'dirty_done_cheap',
    name: 'Estratégia Dirty Done Cheap (Progressão em Dúzias)',
    winRatePct: ddcEval > 0 ? Math.round((ddcWins / ddcEval) * 1000) / 10 : 64.8,
    netProfit: ddcProfit,
    evaluatedSpins: ddcEval,
    wins: ddcWins,
    losses: ddcLosses,
    description: 'Progressão estratégica em 4 fases cobrindo 2 dúzias com regras dinâmicas de avanço',
  });

  // 12. Hopscotch Pro Max (Transição 1:1 para Dúzias)
  let hsPhase = 1;
  let hsWins = 0, hsLosses = 0, hsProfit = 0;
  sample.forEach(s => {
    if (hsPhase === 1) {
      const cost = 20;
      if (s.color === 'black') {
        hsWins++;
        hsProfit += 20;
        hsPhase = 2;
      } else {
        hsLosses++;
        hsProfit -= 20;
      }
    } else if (hsPhase === 2) {
      const cost = 40;
      if (s.dozen === '1a' || s.dozen === '2a') {
        hsWins++;
        hsProfit += 20; // 20*3 - 40
        hsPhase = 3;
      } else {
        hsLosses++;
        hsProfit -= cost;
        hsPhase = 1;
      }
    } else { // hsPhase 3
      const cost = 60;
      if (s.dozen === '1a' || s.dozen === '2a') {
        hsWins++;
        hsProfit += 30; // 30*3 - 60
        hsPhase = 1;
      } else {
        hsLosses++;
        hsProfit -= cost;
        hsPhase = 1;
      }
    }
  });
  const hsEval = sample.length;
  candidates.push({
    id: 'hopscotch_pro_max',
    name: 'Estratégia Hopscotch Pro Max (Transição 1:1)',
    winRatePct: hsEval > 0 ? Math.round((hsWins / hsEval) * 1000) / 10 : 54.1,
    netProfit: hsProfit,
    evaluatedSpins: hsEval,
    wins: hsWins,
    losses: hsLosses,
    description: 'Sistema de baixo risco de transição gradual das chances simples (1:1) para dúzias',
  });

  // 13. Split on the Corners (Cantos + Splits Fixos)
  const cornerNums = new Set([2,3,5,6, 8,9,11,12, 14,15,17,18, 20,21,23,24, 26,27,29,30]);
  const splitNums = new Set([1,4, 10,13, 31,34, 32,33, 35,36]);
  let socWins = 0, socLosses = 0, socProfit = 0;
  sample.forEach(s => {
    const cost = 175; // 5 x 25 corners + 5 x 10 splits
    let payout = 0;
    if (cornerNums.has(s.numero)) {
      payout += 25 * 9; // 225
    }
    if (splitNums.has(s.numero)) {
      payout += 10 * 18; // 180
    }
    if (payout > 0) {
      socWins++;
      socProfit += (payout - cost);
    } else {
      socLosses++;
      socProfit -= cost;
    }
  });
  const socEval = sample.length;
  candidates.push({
    id: 'split_on_corners',
    name: 'Estratégia Split on the Corners (Cantos & Splits)',
    winRatePct: socEval > 0 ? Math.round((socWins / socEval) * 1000) / 10 : 81.1,
    netProfit: socProfit,
    evaluatedSpins: socEval,
    wins: socWins,
    losses: socLosses,
    description: 'Alta cobertura de 81.1% da mesa combinando 5 cantos e 5 splits com valores fixos sem progressão',
  });

  // 6. James Bond 007
  const bondSet = new Set([
    13, 14, 15, 16, 17, 18,
    19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
    0
  ]);
  let jbWins = 0, jbLosses = 0, jbProfit = 0;
  sample.forEach(s => {
    if (bondSet.has(s.numero)) {
      jbWins++;
      jbProfit += 2;
    } else {
      jbLosses++;
      jbProfit -= 20;
    }
  });
  const jbEval = sample.length;
  candidates.push({
    id: 'james_bond',
    name: 'Estratégia James Bond (007)',
    winRatePct: jbEval > 0 ? Math.round((jbWins / jbEval) * 1000) / 10 : 67.5,
    netProfit: jbProfit * 2.50,
    evaluatedSpins: jbEval,
    wins: jbWins,
    losses: jbLosses,
    description: '25 números cobertos (Altas + Seisena + Seguro no 0)',
  });

  // Filter out disabled strategies if any
  const disabledSet = new Set(disabledStrategyIds);
  let availableCandidates = candidates.filter((c) => {
    if (disabledSet.has(c.id)) return false;
    if (c.id.startsWith('neighbors') && disabledSet.has('neighbors')) return false;
    if (c.id === 'ausentes' && disabledSet.has('cold_cycle')) return false;
    return true;
  });

  if (availableCandidates.length === 0) {
    availableCandidates = candidates;
  }

  // Sort candidates by netProfit DESC, then by winRatePct DESC (highest financial return)
  availableCandidates.sort((a, b) => {
    if (b.netProfit !== a.netProfit) {
      return b.netProfit - a.netProfit;
    }
    return b.winRatePct - a.winRatePct;
  });

  return availableCandidates;
}

export function generateBotSuggestion(
  spins: SpinRecord[],
  strategyConfig?: StrategyConfig | number
): { level: string; suggestion: string; strategyName: string; hasAlert: boolean } {
  const strategyRadius = typeof strategyConfig === 'number'
    ? strategyConfig
    : strategyConfig?.neighborRadius || 2;

  const activeStrategy = typeof strategyConfig === 'object' && strategyConfig?.activeStrategy
    ? strategyConfig.activeStrategy
    : '🤖 [AUTO] Seleção Automática (Maior Retorno Financeiro)';

  // If AUTO selection mode is active, pick the strategy with highest financial return (netProfit) automatically!
  if (
    activeStrategy.toLowerCase().includes('auto') ||
    activeStrategy.toLowerCase().includes('automática') ||
    activeStrategy.toLowerCase().includes('automatica')
  ) {
    const ranked = evaluateAllStrategies(spins, strategyRadius);
    const best = ranked.length > 0 ? ranked[0] : null;
    const bestName = best ? best.name : 'Estratégia Romanosky (Cobertura 86.4%)';
    const bestProfit = best ? best.netProfit : 0;
    const bestWinRate = best ? best.winRatePct : 86.4;
    const profitFormatted = `${bestProfit >= 0 ? '+' : ''}R$ ${bestProfit.toFixed(2)}`;

    const validRadius: 2 | 3 | 4 | 5 | 6 | 7 = (strategyRadius >= 2 && strategyRadius <= 7)
      ? (strategyRadius as 2 | 3 | 4 | 5 | 6 | 7)
      : 2;

    const chosenRadius = (best?.neighborRadius as 2 | 3 | 4 | 5 | 6 | 7) || validRadius;

    const fullConfig: StrategyConfig = typeof strategyConfig === 'object' && strategyConfig !== null
      ? {
          activePreset: 'custom',
          dozen1Bet: 0,
          dozen2Bet: 0,
          dozen3Bet: 0,
          column1Bet: 0,
          column2Bet: 0,
          column3Bet: 0,
          straightNumberBets: {},
          colorRedBet: 0,
          colorBlackBet: 0,
          ...strategyConfig,
          activeStrategy: bestName,
          neighborRadius: chosenRadius,
        }
      : {
          activePreset: 'custom',
          dozen1Bet: 0,
          dozen2Bet: 0,
          dozen3Bet: 0,
          column1Bet: 0,
          column2Bet: 0,
          column3Bet: 0,
          straightNumberBets: {},
          colorRedBet: 0,
          colorBlackBet: 0,
          activeStrategy: bestName,
          neighborRadius: chosenRadius,
        };

    const subResult = generateBotSuggestion(spins, fullConfig);

    return {
      level: subResult.level,
      suggestion: `🤖 [AUTO MAIOR RETORNO (${profitFormatted} | ${bestWinRate.toFixed(1)}% WIN)]: ${subResult.suggestion}`,
      strategyName: `🤖 [AUTO] ${bestName} (${profitFormatted})`,
      hasAlert: subResult.hasAlert,
    };
  }

  const lastSpin = spins.length > 0 ? spins[spins.length - 1] : null;

  // Level determination (N1 -> N2 -> N3 on loss cycle)
  let level = 'N1';
  if (lastSpin && lastSpin.cycleStatus === 'LOSS') {
    if (lastSpin.botLevel === 'N1') level = 'N2';
    else if (lastSpin.botLevel === 'N2') level = 'N3';
    else level = 'N1';
  }

  // Handle TERMINAL SEQUENCE CHART (ESTRATÉGIA DO GRÁFICO)
  if (
    activeStrategy.toLowerCase().includes('gráfico') ||
    activeStrategy.toLowerCase().includes('grafico') ||
    activeStrategy.toLowerCase().includes('sequência') ||
    activeStrategy.toLowerCase().includes('sequencia') ||
    activeStrategy.toLowerCase().includes('terminal_sequence')
  ) {
    const sName = 'Análise de Terminais & Sequência (Estratégia do Gráfico)';
    if (spins.length === 0) {
      return {
        level: 'N1',
        suggestion: '📈 ESTRATÉGIA DO GRÁFICO: Insira giros para mapear a atração de terminais históricos no gráfico.',
        strategyName: sName,
        hasAlert: false,
      };
    }
    const lastNum = spins[spins.length - 1].numero;
    const lastTerm = lastNum % 10;
    return {
      level,
      suggestion: `📈 ESTRATÉGIA DO GRÁFICO ATIVA! Foco na atração do terminal [${lastTerm}] + Terminais quentes no histórico + Proteção no Zero (0).`,
      strategyName: sName,
      hasAlert: true,
    };
  }

  // Handle ESTRATÉGIA SIMPLES NA ROLETA ONLINE
  if (
    activeStrategy.toLowerCase().includes('simples') ||
    activeStrategy.toLowerCase().includes('estrategia simples') ||
    activeStrategy.toLowerCase().includes('estratégia simples')
  ) {
    const sName = 'Estratégia Simples na Roleta Online';
    if (spins.length === 0) {
      return {
        level: 'N1',
        suggestion: '⚡ ESTRATÉGIA SIMPLES: Insira giros para analisar a linha do tempo e vizinhos camuflados do cilindro.',
        strategyName: sName,
        hasAlert: false,
      };
    }
    const lastNum = spins[spins.length - 1].numero;
    const lastTerm = lastNum % 10;
    return {
      level,
      suggestion: `⚡ ESTRATÉGIA SIMPLES ATIVA! Leitura de linha do tempo do terminal [${lastTerm}] + Vizinhos de roda camuflados + Seguro no Zero (0). Tiro de primeira!`,
      strategyName: sName,
      hasAlert: true,
    };
  }

  // Handle DIRTY DONE CHEAP
  if (
    activeStrategy.toLowerCase().includes('dirty') ||
    activeStrategy.toLowerCase().includes('cheap')
  ) {
    const sName = 'Estratégia Dirty Done Cheap (Progressão em Dúzias)';
    return {
      level,
      suggestion: '💰 DIRTY DONE CHEAP ATIVA! Progressão por 4 fases em 2 dúzias. Siga a tabela de elevação de fichas (10€/15€ -> 20€/25€ -> 30€/30€ -> 25€/50€).',
      strategyName: sName,
      hasAlert: true,
    };
  }

  // Handle HOPSCOTCH PRO MAX
  if (
    activeStrategy.toLowerCase().includes('hopscotch') ||
    activeStrategy.toLowerCase().includes('pro max')
  ) {
    const sName = 'Estratégia Hopscotch Pro Max (Transição 1:1)';
    return {
      level,
      suggestion: '🎲 HOPSCOTCH PRO MAX ATIVA! Fase 1 em Chance Simples (Preto/Vermelho 20€). Ao vencer, transicione para 2 Dúzias (20€/20€ -> 30€/30€).',
      strategyName: sName,
      hasAlert: true,
    };
  }

  // Handle SPLIT ON THE CORNERS
  if (
    activeStrategy.toLowerCase().includes('split on') ||
    activeStrategy.toLowerCase().includes('corners')
  ) {
    const sName = 'Estratégia Split on the Corners (Cantos & Splits)';
    return {
      level,
      suggestion: '🎯 SPLIT ON THE CORNERS ATIVA! Cobertura estática sem progressão de 81.1% da mesa: 5 Cantos (25€ cada) + 5 Splits (10€ cada).',
      strategyName: sName,
      hasAlert: true,
    };
  }

  // Handle GUGA TV
  if (activeStrategy.toLowerCase().includes('guga') || activeStrategy.toLowerCase().includes('guga tv')) {
    const sName = 'Estratégia Guga TV (Linha do Tempo & Terminais)';
    if (spins.length === 0) {
      return {
        level: 'N1',
        suggestion: '📺 GUGA TV: Insira giros para analisar a linha do tempo de terminais quentes (1, 4, 7, 0, 3, 8).',
        strategyName: sName,
        hasAlert: false,
      };
    }
    return {
      level,
      suggestion: '📺 ESTRATÉGIA GUGA TV ATIVA! Entradas nos terminais quentes da linha do tempo (1, 4, 7, 0, 3) + Vizinhos + Seguro no Zero (0).',
      strategyName: sName,
      hasAlert: true,
    };
  }

  // Handle MARTINGALE DE PROFISSIONAL
  if (
    activeStrategy.toLowerCase().includes('martingale') ||
    activeStrategy.toLowerCase().includes('profissional') ||
    activeStrategy.toLowerCase().includes('martingale_profissional')
  ) {
    const sName = 'Estratégia Martingale De Profissional Na Roleta';
    if (spins.length === 0) {
      return {
        level: 'N1',
        suggestion: '🎲 MARTINGALE PROFISSIONAL: Insira giros para mapear as zonas quentes do cilindro com vizinhos + terminais altos (7,8,9) e Zero.',
        strategyName: sName,
        hasAlert: false,
      };
    }
    const lastNum = spins[spins.length - 1].numero;
    return {
      level,
      suggestion: `🎲 MARTINGALE PROFISSIONAL ATIVO! Entrada nas Zonas Quentes do cilindro (últimos números com 1 vizinho cada lado) + Terminais Altos (7,8,9) + Zero (0). Se a 1ª entrada falhar, aplique a Dobra Inteligente (Martingale de 1 etapa).`,
      strategyName: sName,
      hasAlert: true,
    };
  }

  // Handle ROMANOSKY
  if (activeStrategy.toLowerCase().includes('romanosky')) {
    const sName = 'Estratégia Romanosky (Cobertura 86.4%)';
    if (spins.length === 0) {
      return {
        level: 'N1',
        suggestion: '🎯 ROMANOSKY: Aguardando 1º giro. Entrada pronta nas 2 Dúzias + 2 Quadrados.',
        strategyName: sName,
        hasAlert: true,
      };
    }
    return {
      level,
      suggestion: '🎯 ROMANOSKY ATIVA! Apostar: 1ª Dúzia (1-12) + 2ª Dúzia (13-24) + Quadrado (25-26-28-29) + Quadrado (32-33-35-36) [32 números / 86.4% Cobertura].',
      strategyName: sName,
      hasAlert: true,
    };
  }

  // Handle CICLO DE FECHAMENTO (AUSENTES)
  if (activeStrategy.toLowerCase().includes('ausentes') || activeStrategy.toLowerCase().includes('ciclo')) {
    const sName = 'Ciclo de Fechamento (Aposta em Ausentes)';
    if (spins.length === 0) {
      return {
        level: 'N1',
        suggestion: '❄️ CICLO DE AUSENTES: Insira números para mapear pedras frias das últimas 25 rodadas.',
        strategyName: sName,
        hasAlert: false,
      };
    }
    const LOOKBACK = 25;
    const recentSlice = spins.slice(Math.max(0, spins.length - LOOKBACK));
    const seenNumbers = new Set(recentSlice.map(s => s.numero));
    const unseenNumbers: number[] = [];
    for (let n = 0; n <= 36; n++) {
      if (!seenNumbers.has(n)) unseenNumbers.push(n);
    }

    if (unseenNumbers.length > 0) {
      return {
        level,
        suggestion: `❄️ CICLO DE AUSENTES ATIVO! Apostar nos ${unseenNumbers.length} números ausentes: [${unseenNumbers.slice(0, 10).join(', ')}${unseenNumbers.length > 10 ? '...' : ''}]`,
        strategyName: `${sName} (${unseenNumbers.length} números)`,
        hasAlert: true,
      };
    } else {
      return {
        level,
        suggestion: '❄️ CICLO DE AUSENTES: Todos os 37 números saíram no ciclo recente.',
        strategyName: sName,
        hasAlert: false,
      };
    }
  }

  // Handle 2 DÚZIAS DOMINANTES
  if (activeStrategy.toLowerCase().includes('2 dúzias') || activeStrategy.toLowerCase().includes('duzias dominantes')) {
    const sName = 'Aposta em 2 Dúzias Dominantes (64.8% Cobertura)';
    if (spins.length < 5) {
      return {
        level: 'N1',
        suggestion: '🔥 2 DÚZIAS DOMINANTES: Aguardando ao menos 5 giros para identificar as dúzias mais quentes.',
        strategyName: sName,
        hasAlert: false,
      };
    }
    const recent = spins.slice(Math.max(0, spins.length - 20));
    const dCounts = { D1: 0, D2: 0, D3: 0 };
    recent.forEach(s => {
      if (s.dozen === '1a') dCounts.D1++;
      else if (s.dozen === '2a') dCounts.D2++;
      else if (s.dozen === '3a') dCounts.D3++;
    });
    const sortedD = (Object.keys(dCounts) as Array<'D1' | 'D2' | 'D3'>).sort((a, b) => dCounts[b] - dCounts[a]);
    const dozLabels = { D1: '1ª Dúzia (1-12)', D2: '2ª Dúzia (13-24)', D3: '3ª Dúzia (25-36)' };

    return {
      level,
      suggestion: `🔥 2 DÚZIAS DOMINANTES ATIVAS! Apostar em: ${dozLabels[sortedD[0]]} + ${dozLabels[sortedD[1]]} (24 números / 64.8% Cobertura).`,
      strategyName: sName,
      hasAlert: true,
    };
  }

  // Handle D'ALEMBERT
  if (activeStrategy.toLowerCase().includes('dalembert') || activeStrategy.toLowerCase().includes("d'alembert")) {
    const sName = "Método D'Alembert (Chances Simples)";
    return {
      level,
      suggestion: `⚖️ D'ALEMBERT ATIVO! Apostar no Vermelho/Preto (Chances Simples) com progressão de 1 ficha (+1 em erro, -1 em acerto).`,
      strategyName: sName,
      hasAlert: true,
    };
  }

  // Handle JAMES BOND 007
  if (activeStrategy.toLowerCase().includes('james bond') || activeStrategy.toLowerCase().includes('007')) {
    const sName = 'Estratégia James Bond (007)';
    return {
      level,
      suggestion: '🕶️ JAMES BOND ATIVA! Apostar: Altas (19-36) + Seisena (13-18) + Seguro no Zero (0) [25 números / 67.5% Cobertura].',
      strategyName: sName,
      hasAlert: true,
    };
  }

  // Handle VOISINS DU ZERO
  if (activeStrategy.toLowerCase().includes('voisins') || activeStrategy.toLowerCase().includes('vizinhos do zero')) {
    const sName = 'Vizinhos do Zero (Voisins du Zéro)';
    return {
      level,
      suggestion: '🎰 VIZINHOS DO ZERO ATIVO! Apostar no setor Voisins (17 números ao redor do 0): [22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25].',
      strategyName: sName,
      hasAlert: true,
    };
  }

  // DEFAULT / VIZINHOS DO CILINDRO
  if (spins.length === 0) {
    return {
      level: 'N1',
      suggestion: `⏳ AGUARDANDO GIROS (Insira números para monitorar vizinhos do cilindro - ${strategyRadius} VIZ)`,
      strategyName: `Alerta de Vizinhos do Cilindro (${strategyRadius} VIZ)`,
      hasAlert: false,
    };
  }

  const targetNum = lastSpin!.numero;
  const alertInfo = calculateNeighborsAlert(spins, strategyRadius);
  const neighbors = alertInfo?.neighborsList || getWheelNeighbors(targetNum, strategyRadius);
  const chipVal = typeof strategyConfig === 'object' ? (strategyConfig.neighborChipValue || 2.50) : 2.50;
  const cost = neighbors.length * chipVal;

  if (alertInfo?.hasAlert) {
    return {
      level,
      suggestion: `🚨 ALERTA ATIVO! Entrada nos ${strategyRadius} Vizinhos do nº ${targetNum} [${neighbors.join(', ')}] (R$ ${cost.toFixed(2)})`,
      strategyName: `Alerta de Vizinhos (${neighbors.length} casas - ${strategyRadius} VIZ)`,
      hasAlert: true,
    };
  }

  return {
    level,
    suggestion: `⏳ SEM ALERTA ATIVO (Fora de Operação) — Monitorando setor do nº ${targetNum} [${neighbors.join(', ')}] (${strategyRadius} VIZ)`,
    strategyName: `Alerta de Vizinhos (${strategyRadius} VIZ)`,
    hasAlert: false,
  };
}

export interface TableAnalysisResult {
  totalGiros: number;
  isComplete100: boolean;
  alertCount: number;
  wins: number;
  losses: number;
  hitRatePct: number;
  dozenSwitchPct: number;
  stabilityStatus: 'STRONG_PATTERN' | 'MODERATE_PATTERN' | 'HIGH_VARIANCE';
  statusTitle: string;
  statusDescription: string;
  badgeClass: string;
  recommendation: string;
  topDozenText: string;
  topSectorText: string;
  maxConsecutiveLosses: number;
  maxConsecutiveWins: number;
  currentConsecutiveLosses: number;
  currentConsecutiveWins: number;
}

export function analyzeWarmupTable(
  spins: SpinRecord[],
  neighborRadius: number = 2
): TableAnalysisResult {
  const sample = spins.length > 100 ? spins.slice(-100) : spins;
  const totalGiros = sample.length;
  const isComplete100 = totalGiros >= 100;

  let alertCount = 0;
  let wins = 0;
  let losses = 0;
  let dozenSwitches = 0;
  let prevDozen: DozenType | null = null;

  let currentConsecWins = 0;
  let maxConsecWins = 0;
  let currentConsecLosses = 0;
  let maxConsecLosses = 0;

  const dozenCounts = { '1a': 0, '2a': 0, '3a': 0, zero: 0 };

  sample.forEach((spin, idx) => {
    dozenCounts[spin.dozen]++;

    if (prevDozen !== null && spin.dozen !== 'zero' && prevDozen !== 'zero') {
      if (spin.dozen !== prevDozen) {
        dozenSwitches++;
      }
    }
    prevDozen = spin.dozen;

    if (idx >= 2) {
      const historyUpToCurrent = sample.slice(0, idx);
      const alertInfo = calculateNeighborsAlert(historyUpToCurrent, neighborRadius);
      if (alertInfo.hasAlert) {
        alertCount++;
        const isHit = alertInfo.neighborsList.includes(spin.numero);
        if (isHit) {
          wins++;
          currentConsecWins++;
          if (currentConsecWins > maxConsecWins) maxConsecWins = currentConsecWins;
          currentConsecLosses = 0;
        } else {
          losses++;
          currentConsecLosses++;
          if (currentConsecLosses > maxConsecLosses) maxConsecLosses = currentConsecLosses;
          currentConsecWins = 0;
        }
      }
    }
  });

  const hitRatePct = alertCount > 0 ? Math.round((wins / alertCount) * 1000) / 10 : 0;
  const dozenSwitchPct = totalGiros > 1 ? Math.round((dozenSwitches / (totalGiros - 1)) * 1000) / 10 : 0;

  const dozMap: Record<string, string> = { '1a': '1ª Dúzia (1-12)', '2a': '2ª Dúzia (13-24)', '3a': '3ª Dúzia (25-36)' };
  let maxDoz = '1a';
  if (dozenCounts['2a'] > dozenCounts[maxDoz as keyof typeof dozenCounts]) maxDoz = '2a';
  if (dozenCounts['3a'] > dozenCounts[maxDoz as keyof typeof dozenCounts]) maxDoz = '3a';
  const topDozPct = totalGiros > 0 ? Math.round((dozenCounts[maxDoz as keyof typeof dozenCounts] / totalGiros) * 100) : 0;
  const topDozenText = `${dozMap[maxDoz] || maxDoz} (${topDozPct}%)`;

  const totalSector = neighborRadius * 2 + 1;
  const expRate = Math.round(((totalSector / 37) * 100) * 10) / 10;

  let stabilityStatus: 'STRONG_PATTERN' | 'MODERATE_PATTERN' | 'HIGH_VARIANCE' = 'MODERATE_PATTERN';
  let statusTitle = '';
  let statusDescription = '';
  let badgeClass = '';
  let recommendation = '';

  // Realistic consecutive loss threshold based on sector size (for 100 spins)
  const maxAllowedConsecLosses = neighborRadius <= 2 ? 8 : neighborRadius <= 4 ? 7 : 6;

  if (alertCount === 0) {
    stabilityStatus = 'MODERATE_PATTERN';
    statusTitle = '🟡 MESA EM AQUECIMENTO (POUCOS ALERTAS)';
    statusDescription = `A amostra possui ${totalGiros} giros, mas ainda não gerou alertas suficientes para consolidar a tendência de vizinhos.`;
    badgeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    recommendation = 'Insira mais giros até completar a amostra de 100 números para obter o diagnóstico completo.';
  } else if (hitRatePct >= expRate + 3 && dozenSwitchPct <= 68 && maxConsecLosses <= maxAllowedConsecLosses) {
    stabilityStatus = 'STRONG_PATTERN';
    statusTitle = '🟢 MESA COM PADRÃO DEFINIDO (MESA TENDENCIOSA)';
    statusDescription = `A mesa apresentou excelente tendência de repetição de setores nos ${totalGiros} giros! O Bot alcançou ${hitRatePct}% de assertividade (${wins} WINs vs ${losses} REDs em ${alertCount} entradas otimizadas). A alternância de dúzias foi de ${dozenSwitchPct}%.`;
    badgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    recommendation = 'Excelente momento para operar! A mesa está respeitando a repetição de setores com alta taxa de acerto.';
  } else if (hitRatePct < expRate || maxConsecLosses > maxAllowedConsecLosses + 2 || dozenSwitchPct > 75) {
    stabilityStatus = 'HIGH_VARIANCE';
    statusTitle = '🔴 MESA INSTÁVEL (ALTA VARIAÇÃO DE PADRÃO)';
    statusDescription = `A mesa variou muito o padrão nos ${totalGiros} giros de amostragem. Houve dispersão espacial e o Bot alcançou ${hitRatePct}% de acerto (${wins} WINs vs ${losses} REDs em ${alertCount} alertas, com pico de ${maxConsecLosses} REDs seguidos).`;
    badgeClass = 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    recommendation = 'Atenção! A mesa está alternando setores sem fixação de tendência. Recomenda-se operar no nível N1 ou alternar para o Bot Automático.';
  } else {
    stabilityStatus = 'MODERATE_PATTERN';
    statusTitle = '🟡 MESA COM PADRÃO MODERADO / OSCILANTE';
    statusDescription = `A mesa alternou ciclos quentes e neutros durante os ${totalGiros} giros. A taxa de acerto do Bot nos Vizinhos foi de ${hitRatePct}% (${wins} WINs vs ${losses} REDs). A alternância de dúzias foi de ${dozenSwitchPct}%.`;
    badgeClass = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    recommendation = 'Mesa com padrão mediano. Opere com cautela mantendo apostas no nível N1 ou utilize o Robô Automático.';
  }

  return {
    totalGiros,
    isComplete100,
    alertCount,
    wins,
    losses,
    hitRatePct,
    dozenSwitchPct,
    stabilityStatus,
    statusTitle,
    statusDescription,
    badgeClass,
    recommendation,
    topDozenText,
    topSectorText: `${neighborRadius * 2 + 1} Casas (${neighborRadius} Vizinhos)`,
    maxConsecutiveLosses: maxConsecLosses,
    maxConsecutiveWins: maxConsecWins,
    currentConsecutiveLosses: currentConsecLosses,
    currentConsecutiveWins: currentConsecWins,
  };
}

export interface ZeroHitHistoryItem {
  id: string;
  source: 'session' | 'manual';
  giro?: number;
  interval: number;
  label: string;
  details: string;
}

export interface ZeroStatsResult {
  spinsSinceZero: number;
  initialZeroDelay: number;
  totalZeros: number;
  lastZeroGiro: number | null;
  isOverdue: boolean;
  isHighAlert: boolean;
  compositionText: string;
  lastTwoZeroHits: ZeroHitHistoryItem[];
}

export function calculateZeroStats(
  spins: SpinRecord[],
  initialZeroDelay: number = 0,
  manualZeroHistory: number[] = []
): ZeroStatsResult {
  const sorted = [...spins].sort((a, b) => a.giro - b.giro);
  const totalSpins = sorted.length;
  const initialOffset = Math.max(0, Number(initialZeroDelay) || 0);

  interface SessionZeroHit {
    giro: number;
    intervalBeforeHit: number;
  }
  const sessionZeroHits: SessionZeroHit[] = [];
  let prevZeroGiro = 0;

  for (let i = 0; i < totalSpins; i++) {
    const s = sorted[i];
    if (s.numero === 0) {
      let interval = 0;
      if (sessionZeroHits.length === 0) {
        interval = initialOffset + s.giro;
      } else {
        interval = s.giro - prevZeroGiro;
      }
      sessionZeroHits.push({
        giro: s.giro,
        intervalBeforeHit: interval,
      });
      prevZeroGiro = s.giro;
    }
  }

  let spinsSinceZero = 0;
  let lastZeroGiro: number | null = null;
  let compositionText = '';

  if (sessionZeroHits.length === 0) {
    spinsSinceZero = initialOffset + totalSpins;
    if (initialOffset > 0 && totalSpins > 0) {
      compositionText = `${initialOffset} inicial + ${totalSpins} lançados`;
    } else if (initialOffset > 0) {
      compositionText = `${initialOffset} inicial da mesa`;
    } else {
      compositionText = `${totalSpins} giros na sessão`;
    }
  } else {
    const latestHit = sessionZeroHits[sessionZeroHits.length - 1];
    lastZeroGiro = latestHit.giro;
    spinsSinceZero = totalSpins - latestHit.giro;
    if (spinsSinceZero === 0) {
      compositionText = `Acabou de sair no Giro #${latestHit.giro}!`;
    } else {
      compositionText = `${spinsSinceZero} giros desde o Giro #${latestHit.giro}`;
    }
  }

  const lastTwoZeroHits: ZeroHitHistoryItem[] = [];

  for (let i = sessionZeroHits.length - 1; i >= 0 && lastTwoZeroHits.length < 2; i--) {
    const hit = sessionZeroHits[i];
    const isLatest = lastTwoZeroHits.length === 0;
    lastTwoZeroHits.push({
      id: `session-zero-${hit.giro}`,
      source: 'session',
      giro: hit.giro,
      interval: hit.intervalBeforeHit,
      label: isLatest ? `1ª Última (G#${hit.giro})` : `2ª Penúltima (G#${hit.giro})`,
      details: `Ficou ${hit.intervalBeforeHit} giros sem 0`,
    });
  }

  const validManual = (manualZeroHistory || [])
    .map(Number)
    .filter((n) => !isNaN(n) && n > 0);
  let manualIdx = 0;
  while (lastTwoZeroHits.length < 2 && manualIdx < validManual.length) {
    const intervalVal = validManual[manualIdx];
    const isLatest = lastTwoZeroHits.length === 0;
    lastTwoZeroHits.push({
      id: `manual-zero-${manualIdx}`,
      source: 'manual',
      interval: intervalVal,
      label: isLatest ? '1ª Última (Mesa Real)' : '2ª Penúltima (Mesa Real)',
      details: `Ficou ${intervalVal} giros sem 0`,
    });
    manualIdx++;
  }

  return {
    spinsSinceZero,
    initialZeroDelay: initialOffset,
    totalZeros: sessionZeroHits.length,
    lastZeroGiro,
    isOverdue: spinsSinceZero >= 37,
    isHighAlert: spinsSinceZero >= 50,
    compositionText,
    lastTwoZeroHits,
  };
}

