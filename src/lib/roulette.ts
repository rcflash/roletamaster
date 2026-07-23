import { NumberColor, DozenType, ColumnType, ParityType, HalfType, SpinRecord, TempItem, NumberStats, StrategyConfig } from '../types';

export const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
export const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

export const EUROPEAN_WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

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

  return { dozenItems, columnItems };
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

export function evaluateSpinPayout(
  num: number,
  strategy: StrategyConfig
): { winAmount: number; lossAmount: number; netResult: number } {
  let winAmount = 0;
  let lossAmount = 0;

  const color = getNumberColor(num);
  const dozen = getNumberDozen(num);
  const column = getNumberColumn(num);

  // Dozens (Pays 2 to 1 -> 3x returned)
  if (strategy.dozen1Bet > 0) {
    lossAmount += strategy.dozen1Bet;
    if (dozen === '1a') winAmount += strategy.dozen1Bet * 3;
  }
  if (strategy.dozen2Bet > 0) {
    lossAmount += strategy.dozen2Bet;
    if (dozen === '2a') winAmount += strategy.dozen2Bet * 3;
  }
  if (strategy.dozen3Bet > 0) {
    lossAmount += strategy.dozen3Bet;
    if (dozen === '3a') winAmount += strategy.dozen3Bet * 3;
  }

  // Columns (Pays 2 to 1 -> 3x returned)
  if (strategy.column1Bet > 0) {
    lossAmount += strategy.column1Bet;
    if (column === 'col1') winAmount += strategy.column1Bet * 3;
  }
  if (strategy.column2Bet > 0) {
    lossAmount += strategy.column2Bet;
    if (column === 'col2') winAmount += strategy.column2Bet * 3;
  }
  if (strategy.column3Bet > 0) {
    lossAmount += strategy.column3Bet;
    if (column === 'col3') winAmount += strategy.column3Bet * 3;
  }

  // Colors (Pays 1 to 1 -> 2x returned)
  if (strategy.colorRedBet > 0) {
    lossAmount += strategy.colorRedBet;
    if (color === 'red') winAmount += strategy.colorRedBet * 2;
  }
  if (strategy.colorBlackBet > 0) {
    lossAmount += strategy.colorBlackBet;
    if (color === 'black') winAmount += strategy.colorBlackBet * 2;
  }

  // Straight numbers (Pays 35 to 1 -> 36x returned)
  if (strategy.straightNumberBets) {
    Object.entries(strategy.straightNumberBets).forEach(([nStr, bet]) => {
      const n = Number(nStr);
      if (bet > 0) {
        lossAmount += bet;
        if (num === n) winAmount += bet * 36;
      }
    });
  }

  // Fallback default cost if no specific bets configured
  if (lossAmount === 0) {
    lossAmount = 15; // default spin wager
  }

  const netResult = winAmount - lossAmount;
  return { winAmount, lossAmount, netResult };
}

export function generateBotSuggestion(spins: SpinRecord[]): { level: string; suggestion: string } {
  if (spins.length === 0) {
    return { level: 'N1', suggestion: 'R$ 10 no VERMELHO' };
  }

  const lastSpin = spins[spins.length - 1];
  const temps = calculateTemperatures(spins);
  
  // Find coldest dozen or column
  const alertDozen = temps.dozenItems.find(d => d.status === 'ALERT');
  const alertCol = temps.columnItems.find(c => c.status === 'ALERT');

  // Cycle level simulation based on last win/loss
  let level = 'N1';
  if (lastSpin.cycleStatus === 'LOSS') {
    if (lastSpin.botLevel === 'N1') level = 'N2';
    else if (lastSpin.botLevel === 'N2') level = 'N3';
    else level = 'N1';
  } else {
    level = 'N1';
  }

  if (alertDozen && alertDozen.code !== 'zero') {
    const val = level === 'N1' ? 10 : level === 'N2' ? 15 : 25;
    return { level, suggestion: `R$ ${val} na ${alertDozen.name}` };
  }

  if (alertCol) {
    const val = level === 'N1' ? 10 : level === 'N2' ? 15 : 25;
    return { level, suggestion: `R$ ${val} na ${alertCol.name}` };
  }

  // Hot numbers suggestion
  const numberStats = calculateNumberStats(spins);
  const hotNumbers = [...numberStats].sort((a, b) => b.count - a.count).slice(0, 4).map(n => n.num);

  if (level === 'N1') return { level, suggestion: 'R$ 10 no VERMELHO' };
  if (level === 'N2') return { level, suggestion: 'R$ 10 Col 1 / R$ 10 Col 3' };
  return { level, suggestion: `R$ 15 Dúz 1 / R$ 15 Dúz 3 + Top (${hotNumbers.join(', ')})` };
}
