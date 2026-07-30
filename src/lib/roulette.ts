import { NumberColor, DozenType, ColumnType, ParityType, HalfType, SpinRecord, TempItem, NumberStats, StrategyConfig } from '../types';

export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
export const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

export const EUROPEAN_WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

export function getWheelNeighbors(targetNum: number, neighborCount: 2 | 3 | 4 = 2): number[] {
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
  neighborCount: 2 | 3 | 4;
  neighborsList: number[];
  alertMessage: string;
  recommendedBetText: string;
  repeatCountInSector: number;
}

export function calculateNeighborsAlert(
  spins: SpinRecord[],
  neighborRadius: 2 | 3 | 4 = 2
): NeighborsAlertInfo | null {
  if (spins.length < 2) return null;

  const lastSpin = spins[spins.length - 1];
  const lastNum = lastSpin.numero;

  const neighbors = getWheelNeighbors(lastNum, neighborRadius);
  const totalSector = neighbors.length; // 5, 7, or 9

  const recent6 = spins.slice(-6);
  const hitsInSector = recent6.filter((s) => neighbors.includes(s.numero)).length;

  const threshold = neighborRadius === 2 ? 3 : neighborRadius === 3 ? 3 : 4;
  const hasAlert = hitsInSector >= threshold;

  if (hasAlert) {
    return {
      hasAlert: true,
      targetNum: lastNum,
      neighborCount: neighborRadius,
      neighborsList: neighbors,
      alertMessage: `🔥 SETOR AQUECIDO! O setor do nº ${lastNum} (${neighborRadius} vizinhos) recebeu ${hitsInSector} acertos nos últimos 6 giros!`,
      recommendedBetText: `R$ 2,50 nas ${totalSector} casas: [${neighbors.join(', ')}] (Custo Total: R$ ${(totalSector * 2.5).toFixed(2)})`,
      repeatCountInSector: hitsInSector,
    };
  }

  return {
    hasAlert: false,
    targetNum: lastNum,
    neighborCount: neighborRadius,
    neighborsList: neighbors,
    alertMessage: `Último número foi ${lastNum}. Sem alerta ativo no momento (${hitsInSector}/${threshold} acertos no setor nos últimos 6 giros).`,
    recommendedBetText: `Aguardando alerta no setor do nº ${lastNum} [${neighbors.join(', ')}]`,
    repeatCountInSector: hitsInSector,
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
      status: dozenWithoutHit['1a'] >= 8 ? 'ALERT' : dozenCounts['1a'] / totalSpins >= 0.4 ? 'HOT' : 'NORMAL',
      statusLabel: dozenWithoutHit['1a'] >= 8 ? '🔴 ALERTA' : dozenCounts['1a'] / totalSpins >= 0.4 ? '🔥 QUENTE' : '🟢 NORMAL'
    },
    {
      name: '2ª Dúzia',
      code: '2a',
      count: dozenCounts['2a'],
      frequencyPct: Number(((dozenCounts['2a'] / totalSpins) * 100).toFixed(1)),
      spinsWithoutHit: dozenWithoutHit['2a'],
      status: dozenWithoutHit['2a'] >= 8 ? 'ALERT' : dozenCounts['2a'] / totalSpins >= 0.4 ? 'HOT' : 'NORMAL',
      statusLabel: dozenWithoutHit['2a'] >= 8 ? '🔴 ALERTA' : dozenCounts['2a'] / totalSpins >= 0.4 ? '🔥 QUENTE' : '🟢 NORMAL'
    },
    {
      name: '3ª Dúzia',
      code: '3a',
      count: dozenCounts['3a'],
      frequencyPct: Number(((dozenCounts['3a'] / totalSpins) * 100).toFixed(1)),
      spinsWithoutHit: dozenWithoutHit['3a'],
      status: dozenWithoutHit['3a'] >= 8 ? 'ALERT' : dozenCounts['3a'] / totalSpins >= 0.4 ? 'HOT' : 'NORMAL',
      statusLabel: dozenWithoutHit['3a'] >= 8 ? '🔴 ALERTA' : dozenCounts['3a'] / totalSpins >= 0.4 ? '🔥 QUENTE' : '🟢 NORMAL'
    },
    {
      name: 'Zero',
      code: 'zero',
      count: dozenCounts['zero'],
      frequencyPct: Number(((dozenCounts['zero'] / totalSpins) * 100).toFixed(1)),
      spinsWithoutHit: dozenWithoutHit['zero'],
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
      status: colCounts['col1'] / totalSpins <= 0.2 ? 'COLD' : colCounts['col1'] / totalSpins >= 0.45 ? 'HOT' : 'NORMAL',
      statusLabel: colCounts['col1'] / totalSpins <= 0.2 ? '❄️ FRIA' : colCounts['col1'] / totalSpins >= 0.45 ? '🔥 QUENTE' : '🟢 NORMAL'
    },
    {
      name: 'Coluna 2',
      code: 'col2',
      count: colCounts['col2'],
      frequencyPct: Number(((colCounts['col2'] / totalSpins) * 100).toFixed(1)),
      spinsWithoutHit: colWithoutHit['col2'],
      status: colCounts['col2'] / totalSpins <= 0.2 ? 'COLD' : colCounts['col2'] / totalSpins >= 0.45 ? 'HOT' : 'NORMAL',
      statusLabel: colCounts['col2'] / totalSpins <= 0.2 ? '❄️ FRIA' : colCounts['col2'] / totalSpins >= 0.45 ? '🔥 QUENTE' : '🟢 NORMAL'
    },
    {
      name: 'Coluna 3',
      code: 'col3',
      count: colCounts['col3'],
      frequencyPct: Number(((colCounts['col3'] / totalSpins) * 100).toFixed(1)),
      spinsWithoutHit: colWithoutHit['col3'],
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
      status: colorWithoutHit['red'] >= 6 ? 'ALERT' : colorCounts['red'] / totalSpins >= 0.52 ? 'HOT' : 'NORMAL',
      statusLabel: colorWithoutHit['red'] >= 6 ? '🔴 ALERTA' : colorCounts['red'] / totalSpins >= 0.52 ? '🔥 QUENTE' : '🟢 NORMAL'
    },
    {
      name: 'Preto',
      code: 'black',
      count: colorCounts['black'],
      frequencyPct: Number(((colorCounts['black'] / totalSpins) * 100).toFixed(1)),
      spinsWithoutHit: colorWithoutHit['black'],
      status: colorWithoutHit['black'] >= 6 ? 'ALERT' : colorCounts['black'] / totalSpins >= 0.52 ? 'HOT' : 'NORMAL',
      statusLabel: colorWithoutHit['black'] >= 6 ? '🔴 ALERTA' : colorCounts['black'] / totalSpins >= 0.52 ? '🔥 QUENTE' : '🟢 NORMAL'
    },
    {
      name: 'Zero (0)',
      code: 'green',
      count: colorCounts['green'],
      frequencyPct: Number(((colorCounts['green'] / totalSpins) * 100).toFixed(1)),
      spinsWithoutHit: colorWithoutHit['green'],
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
  neighborRadius: 2 | 3 | 4 = 2,
  chipValue: number = 2.50,
  multiplier?: number
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
    // Aposta plena paga 35 para 1 (retorna 36x o valor da ficha)
    winAmount = unitChip * 36;
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

  if (spinsUpToPrev !== undefined && spinsUpToPrev !== null) {
    return evaluateNeighborsPayout(num, spinsUpToPrev, radius, chipVal, multiplier);
  }

  return { winAmount: 0, lossAmount: 0, netResult: 0, betPlaced: false };
}

export function evaluateBotTipOutcome(
  num: number,
  suggestion: string,
  spinsUpToPrev?: SpinRecord[] | number | null,
  strategyRadius: 2 | 3 | 4 = 2,
  multiplier?: number
): { winAmount: number; lossAmount: number; netResult: number; betPlaced: boolean } {
  if (spinsUpToPrev !== undefined && spinsUpToPrev !== null) {
    return evaluateNeighborsPayout(num, spinsUpToPrev, strategyRadius, 2.50, multiplier);
  }
  return { winAmount: 0, lossAmount: 0, netResult: 0, betPlaced: false };
}

export function generateBotSuggestion(
  spins: SpinRecord[],
  strategyRadius: 2 | 3 | 4 = 2
): { level: string; suggestion: string; strategyName: string; hasAlert: boolean } {
  if (spins.length === 0) {
    const defaultNeighbors = getWheelNeighbors(0, strategyRadius);
    return {
      level: 'N1',
      suggestion: `⏳ AGUARDANDO GIROS (Insira números para monitorar vizinhos do cilindro)`,
      strategyName: `Alerta de Vizinhos do Cilindro (${strategyRadius} VIZ)`,
      hasAlert: false,
    };
  }

  const lastSpin = spins[spins.length - 1];
  const targetNum = lastSpin.numero;
  const alertInfo = calculateNeighborsAlert(spins, strategyRadius);
  const neighbors = alertInfo?.neighborsList || getWheelNeighbors(targetNum, strategyRadius);
  const cost = neighbors.length * 2.50;

  let level = 'N1';
  if (lastSpin.cycleStatus === 'LOSS') {
    if (lastSpin.botLevel === 'N1') level = 'N2';
    else if (lastSpin.botLevel === 'N2') level = 'N3';
    else level = 'N1';
  } else {
    level = 'N1';
  }

  if (alertInfo?.hasAlert) {
    return {
      level,
      suggestion: `🚨 ALERTA ATIVO! Entrada nos ${strategyRadius} Vizinhos do nº ${targetNum} [${neighbors.join(', ')}] (R$ ${cost.toFixed(2)})`,
      strategyName: `Alerta de Vizinhos (${neighbors.length} casas)`,
      hasAlert: true,
    };
  }

  return {
    level,
    suggestion: `⏳ SEM ALERTA ATIVO (Fora de Operação) — Monitorando setor do nº ${targetNum} [${neighbors.join(', ')}]`,
    strategyName: `Monitorando Vizinhos (${neighbors.length} casas)`,
    hasAlert: false,
  };
}
