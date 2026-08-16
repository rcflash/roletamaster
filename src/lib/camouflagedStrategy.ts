import { SpinRecord, BankrollConfig, StrategyConfig } from '../types';

export interface TerminalDefinition {
  terminal: number; // 0 to 9
  pureNumbers: number[];
  camouflagedNumbers: number[];
  allNumbers: number[];
  sumExplanation: string[];
  horseFamily: '1-4-7' | '2-5-8' | '0-3-6-9';
  classicExample: string;
  advancedExample: string;
}

export interface HorseFamilyDefinition {
  id: '1-4-7' | '2-5-8' | '0-3-6-9';
  name: string;
  terminals: number[];
  pureNumbers: number[];
  camouflagedNumbers: number[];
  allNumbers: number[];
  description: string;
  examples: string[];
}

// Tabela oficial conforme imagem do guia Bastiao Oficial - Números Camuflados
export const TERMINALS_DATA: Record<number, TerminalDefinition> = {
  1: {
    terminal: 1,
    pureNumbers: [1, 11, 21, 31],
    camouflagedNumbers: [10, 19, 28, 29],
    allNumbers: [1, 10, 11, 19, 21, 28, 29, 31],
    sumExplanation: ['10 (1+0 = 1)', '19 (1+9 = 10 ➔ 1)', '28 (2+8 = 10 ➔ 1)', '29 (2+9 = 11 ➔ 1+1=2 / leitura de transição)'],
    horseFamily: '1-4-7',
    classicExample: '29 - 4 - 27 (1 4 7)',
    advancedExample: '10 - 22 - 25 (1 4 7)',
  },
  2: {
    terminal: 2,
    pureNumbers: [2, 12, 22, 32],
    camouflagedNumbers: [11, 20, 29],
    allNumbers: [2, 11, 12, 20, 22, 29, 32],
    sumExplanation: ['11 (1+1 = 2)', '20 (2+0 = 2)', '29 (2+9 = 11 ➔ 1+1 = 2)'],
    horseFamily: '2-5-8',
    classicExample: '11 - 15 - 8 (2 5 8)',
    advancedExample: '20 - 14 - 26 (2 5 8)',
  },
  3: {
    terminal: 3,
    pureNumbers: [3, 13, 23, 33],
    camouflagedNumbers: [12, 21, 30],
    allNumbers: [3, 12, 13, 21, 23, 30, 33],
    sumExplanation: ['12 (1+2 = 3)', '21 (2+1 = 3)', '30 (3+0 = 3)'],
    horseFamily: '0-3-6-9',
    classicExample: '30 - 6 - 9 (3 6 9)',
    advancedExample: '21 - 33 - 27 (3 6 9)',
  },
  4: {
    terminal: 4,
    pureNumbers: [4, 14, 24, 34],
    camouflagedNumbers: [13, 22, 31],
    allNumbers: [4, 13, 14, 22, 24, 31, 34],
    sumExplanation: ['13 (1+3 = 4)', '22 (2+2 = 4)', '31 (3+1 = 4)'],
    horseFamily: '1-4-7',
    classicExample: '1 - 13 - 7 (1 4 7)',
    advancedExample: '10 - 22 - 25 (1 4 7)',
  },
  5: {
    terminal: 5,
    pureNumbers: [5, 15, 25, 35],
    camouflagedNumbers: [14, 23, 32],
    allNumbers: [5, 14, 15, 23, 25, 32, 35],
    sumExplanation: ['14 (1+4 = 5)', '23 (2+3 = 5)', '32 (3+2 = 5)'],
    horseFamily: '2-5-8',
    classicExample: '2 - 32 - 28 (2 5 8)',
    advancedExample: '20 - 14 - 26 (2 5 8)',
  },
  6: {
    terminal: 6,
    pureNumbers: [6, 16, 26, 36],
    camouflagedNumbers: [15, 24, 33],
    allNumbers: [6, 15, 16, 24, 26, 33, 36],
    sumExplanation: ['15 (1+5 = 6)', '24 (2+4 = 6)', '33 (3+3 = 6)'],
    horseFamily: '0-3-6-9',
    classicExample: '3 - 24 - 29 (3 6 9)',
    advancedExample: '21 - 33 - 27 (3 6 9)',
  },
  7: {
    terminal: 7,
    pureNumbers: [7, 17, 27],
    camouflagedNumbers: [16, 25, 34],
    allNumbers: [7, 16, 17, 25, 27, 34],
    sumExplanation: ['16 (1+6 = 7)', '25 (2+5 = 7)', '34 (3+4 = 7)'],
    horseFamily: '1-4-7',
    classicExample: '1 - 34 - 34 (1 4 7)',
    advancedExample: '10 - 22 - 25 (1 4 7)',
  },
  8: {
    terminal: 8,
    pureNumbers: [8, 18, 28],
    camouflagedNumbers: [17, 26, 35],
    allNumbers: [8, 17, 18, 26, 28, 35],
    sumExplanation: ['17 (1+7 = 8)', '26 (2+6 = 8)', '35 (3+5 = 8)'],
    horseFamily: '2-5-8',
    classicExample: '12 - 35 - 8 (2 5 8)',
    advancedExample: '20 - 14 - 26 (2 5 8)',
  },
  9: {
    terminal: 9,
    pureNumbers: [9, 19, 29],
    camouflagedNumbers: [18, 27, 36],
    allNumbers: [9, 18, 19, 27, 29, 36],
    sumExplanation: ['18 (1+8 = 9)', '27 (2+7 = 9)', '36 (3+6 = 9)'],
    horseFamily: '0-3-6-9',
    classicExample: '13 - 26 - 36 (3 6 9)',
    advancedExample: '21 - 33 - 27 (3 6 9)',
  },
  0: {
    terminal: 0,
    pureNumbers: [0, 10, 20, 30],
    camouflagedNumbers: [19, 28],
    allNumbers: [0, 10, 19, 20, 28, 30],
    sumExplanation: ['19 (1+9 = 10 ➔ 0)', '28 (2+8 = 10 ➔ 0)'],
    horseFamily: '0-3-6-9',
    classicExample: '19 - 3 - 6 (0 3 6)',
    advancedExample: '19 - 30 - 9 (0 3 6 9)',
  },
};

// As 3 Famílias de Cavalos
export const HORSE_FAMILIES_DATA: Record<'1-4-7' | '2-5-8' | '0-3-6-9', HorseFamilyDefinition> = {
  '1-4-7': {
    id: '1-4-7',
    name: 'Família Cavalo 1 - 4 - 7',
    terminals: [1, 4, 7],
    pureNumbers: [1, 11, 21, 31, 4, 14, 24, 34, 7, 17, 27],
    camouflagedNumbers: [10, 19, 28, 29, 13, 22, 31, 16, 25, 34],
    allNumbers: Array.from(new Set([1, 11, 21, 31, 4, 14, 24, 34, 7, 17, 27, 10, 19, 28, 29, 13, 22, 16, 25])).sort((a, b) => a - b),
    description: 'Terminais 1, 4 e 7 com camuflagens de soma. Padrão clássico de leitura que busca fechar o ciclo de puxadas entre 1, 4 e 7.',
    examples: ['29 - 4 - 27 (1 4 7)', '1 - 13 - 7 (1 4 7)', '1 - 34 - 34 (1 4 7)', '10 - 22 - 25 (1 4 7)'],
  },
  '2-5-8': {
    id: '2-5-8',
    name: 'Família Cavalo 2 - 5 - 8',
    terminals: [2, 5, 8],
    pureNumbers: [2, 12, 22, 32, 5, 15, 25, 35, 8, 18, 28],
    camouflagedNumbers: [11, 20, 29, 14, 23, 32, 17, 26, 35],
    allNumbers: Array.from(new Set([2, 12, 22, 32, 5, 15, 25, 35, 8, 18, 28, 11, 20, 29, 14, 23, 17, 26])).sort((a, b) => a - b),
    description: 'Terminais 2, 5 e 8 com camuflagens de soma. Muito frequente em mesas quentes de meia coluna central e lateral.',
    examples: ['11 - 15 - 8 (2 5 8)', '2 - 32 - 28 (2 5 8)', '12 - 35 - 8 (2 5 8)', '20 - 14 - 26 (2 5 8)'],
  },
  '0-3-6-9': {
    id: '0-3-6-9',
    name: 'Família Cavalo 0 - 3 - 6 - 9',
    terminals: [0, 3, 6, 9],
    pureNumbers: [0, 10, 20, 30, 3, 13, 23, 33, 6, 16, 26, 36, 9, 19, 29],
    camouflagedNumbers: [19, 28, 12, 21, 30, 15, 24, 33, 18, 27, 36],
    allNumbers: Array.from(new Set([0, 10, 20, 30, 3, 13, 23, 33, 6, 16, 26, 36, 9, 19, 29, 28, 12, 21, 15, 24, 18, 27])).sort((a, b) => a - b),
    description: 'Terminais 0, 3, 6 e 9 (Múltiplos de 3 + Zero). Maior volume de cobertura e alta frequência de repetição camuflada.',
    examples: ['30 - 6 - 9 (3 6 9)', '3 - 24 - 29 (3 6 9)', '13 - 26 - 36 (3 6 9)', '19 - 3 - 6 (0 3 6)', '21 - 33 - 27 (3 6 9)'],
  },
};

/**
 * Retorna o terminal puro de um número (0 a 9).
 */
export function getTerminalOfNumber(num: number): number {
  if (num === 0) return 0;
  return num % 10;
}

/**
 * Retorna a soma dos dígitos (ex: 11 -> 2, 29 -> 11 -> 2, 19 -> 10 -> 1)
 */
export function getSumOfDigits(num: number): number {
  if (num < 10) return num;
  const s = num.toString().split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
  if (s >= 10) {
    return s.toString().split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
  }
  return s;
}

/**
 * Retorna quais terminais um número representa (tanto pelo seu final quanto pela camuflagem)
 */
export function getRepresentedTerminals(num: number): number[] {
  const list: number[] = [getTerminalOfNumber(num)];
  const digitSum = getSumOfDigits(num);
  if (!list.includes(digitSum)) {
    list.push(digitSum);
  }
  // Casos especiais da tabela oficial:
  if (num === 29 && !list.includes(1)) list.push(1); // 29 camufla 1 e 2
  if (num === 19 && !list.includes(0) && !list.includes(1)) { list.push(0); list.push(1); }
  if (num === 28 && !list.includes(0) && !list.includes(1)) { list.push(0); list.push(1); }
  return list;
}

/**
 * Descobre a família de cavalos predominante de um número
 */
export function getHorseFamilyOfNumber(num: number): '1-4-7' | '2-5-8' | '0-3-6-9' {
  const t = getTerminalOfNumber(num);
  if ([1, 4, 7].includes(t)) return '1-4-7';
  if ([2, 5, 8].includes(t)) return '2-5-8';
  return '0-3-6-9';
}

export interface CamouflagedAlertInfo {
  hasAlert: boolean;
  alertType: 'HORSE_MOMENTUM' | 'TERMINAL_CAMOUFLAGE' | 'CYCLE_COMPLETION';
  activeFamily: '1-4-7' | '2-5-8' | '0-3-6-9';
  targetTerminal: number;
  triggerSpinNumber: number;
  betNumbers: number[];
  betNumbersCount: number;
  recommendedBetText: string;
  reason: string;
  explanationList: string[];
  recentPatternText: string;
  confidencePct: number;
  chipsRequired: number;
  estimatedCost: number;
  expectedGrossReturn: number;
  expectedNetProfit: number;
}

/**
 * Analisa os últimos giros e detecta padrões de Cavalos e Números Camuflados
 */
export function calculateCamouflagedAlert(
  spins: SpinRecord[],
  mode: 'smart' | 'family' | 'terminal' = 'smart',
  chipVal: number = 2.50
): CamouflagedAlertInfo | null {
  if (spins.length < 2) return null;

  const lastSpin = spins[spins.length - 1];
  const lastNum = lastSpin.numero;
  const lastTerminal = getTerminalOfNumber(lastNum);
  const lastFamily = getHorseFamilyOfNumber(lastNum);

  const recent5 = spins.slice(-5);
  const recent3 = spins.slice(-3);

  // Contagem de famílias nos últimos 5 giros
  const familyHits: Record<'1-4-7' | '2-5-8' | '0-3-6-9', number> = {
    '1-4-7': 0,
    '2-5-8': 0,
    '0-3-6-9': 0,
  };

  recent5.forEach((s) => {
    const represented = getRepresentedTerminals(s.numero);
    if (represented.some((t) => [1, 4, 7].includes(t))) familyHits['1-4-7']++;
    if (represented.some((t) => [2, 5, 8].includes(t))) familyHits['2-5-8']++;
    if (represented.some((t) => [0, 3, 6, 9].includes(t))) familyHits['0-3-6-9']++;
  });

  // Determina família com maior momentum recente
  let dominantFamily: '1-4-7' | '2-5-8' | '0-3-6-9' = lastFamily;
  let maxHits = familyHits[lastFamily];

  (Object.keys(familyHits) as Array<'1-4-7' | '2-5-8' | '0-3-6-9'>).forEach((fam) => {
    if (familyHits[fam] > maxHits) {
      maxHits = familyHits[fam];
      dominantFamily = fam;
    }
  });

  // Identifica se os últimos 2 giros já confirmaram a família
  const last2Represented = recent3.map((s) => ({
    num: s.numero,
    terminals: getRepresentedTerminals(s.numero),
  }));

  const sameFamilyCount = last2Represented.filter((item) =>
    item.terminals.some((t) => HORSE_FAMILIES_DATA[dominantFamily].terminals.includes(t))
  ).length;

  const hasMomentum = sameFamilyCount >= 2 || maxHits >= 3;

  // Montagem da lista de apostas recomendadas
  let betNumbers: number[] = [];
  let reason = '';
  let alertType: 'HORSE_MOMENTUM' | 'TERMINAL_CAMOUFLAGE' | 'CYCLE_COMPLETION' = 'HORSE_MOMENTUM';
  let targetTerminal = lastTerminal;

  if (mode === 'terminal') {
    // Modo Aposta no Terminal do Último + seus Camuflados
    const termDef = TERMINALS_DATA[lastTerminal];
    betNumbers = termDef ? termDef.allNumbers : [lastNum];
    reason = `Entrada direta no Terminal ${lastTerminal} (${termDef.pureNumbers.join(', ')}) + Camuflados de soma [${termDef.camouflagedNumbers.join(', ')}].`;
    alertType = 'TERMINAL_CAMOUFLAGE';
  } else if (mode === 'family') {
    // Modo Aposta na Família de Cavalo Ativa Completa
    const famDef = HORSE_FAMILIES_DATA[dominantFamily];
    betNumbers = famDef.allNumbers;
    reason = `Entrada na ${famDef.name} (Terminais ${famDef.terminals.join(', ')} e suas camuflagens de soma).`;
    alertType = 'HORSE_MOMENTUM';
  } else {
    // Modo Smart: Se houver momentum de família, aposta nos terminais complementares da família + camuflados
    const famDef = HORSE_FAMILIES_DATA[dominantFamily];
    
    // Identificar quais terminais da família já saíram recentemente para buscar o terminal puxado
    const recentTerminalsInFam = last2Represented
      .flatMap((i) => i.terminals)
      .filter((t) => famDef.terminals.includes(t));
    
    const missingTerminals = famDef.terminals.filter((t) => !recentTerminalsInFam.includes(t));
    
    if (missingTerminals.length > 0) {
      targetTerminal = missingTerminals[0];
      alertType = 'CYCLE_COMPLETION';
    }

    // Se o momentum está forte, cobrir todos os números da família ativa
    betNumbers = famDef.allNumbers;
    reason = hasMomentum
      ? `🔥 MOMENTUM DE CAVALO DETECTADO! A ${famDef.name} registrou ${maxHits} presenças nos últimos 5 giros. Padrão ativo após o nº ${lastNum}.`
      : `⏳ MONITORANDO PADRÃO DE CAVALO: Último saiu nº ${lastNum} (Terminal ${lastTerminal} / ${famDef.name}).`;
  }

  const chipsCount = betNumbers.length;
  const cost = chipsCount * chipVal;
  const grossReturn = chipVal * 36;
  const netProfit = grossReturn - cost;

  const recentSeqStr = recent3.map((s) => `#${s.numero}`).join(' ➔ ');

  return {
    hasAlert: hasMomentum,
    alertType,
    activeFamily: dominantFamily,
    targetTerminal,
    triggerSpinNumber: lastNum,
    betNumbers,
    betNumbersCount: chipsCount,
    recommendedBetText: `R$ ${chipVal.toFixed(2)} em ${chipsCount} casas da ${HORSE_FAMILIES_DATA[dominantFamily].name} [${betNumbers.join(', ')}]`,
    reason,
    explanationList: [
      `Último número sorteado: #${lastNum} (Terminal Puro ${lastTerminal})`,
      `Camuflagens diretas do número: [${getRepresentedTerminals(lastNum).join(', ')}]`,
      `Família de Cavalos correspondente: ${HORSE_FAMILIES_DATA[dominantFamily].name}`,
      `Frequência da família nos últimos 5 giros: ${maxHits}/5 (${Math.round((maxHits / 5) * 100)}%)`,
      `Sequência recente analisada: ${recentSeqStr}`,
    ],
    recentPatternText: `${recentSeqStr} (${dominantFamily})`,
    confidencePct: hasMomentum ? Math.min(88, 60 + maxHits * 7) : 45,
    chipsRequired: chipsCount,
    estimatedCost: cost,
    expectedGrossReturn: grossReturn,
    expectedNetProfit: netProfit,
  };
}

/**
 * Avalia o resultado de um giro na estratégia de camuflados
 */
export function evaluateCamouflagedPayout(
  num: number,
  betNumbers: number[],
  chipVal: number = 2.50,
  tablePayoutMultiplier: number = 36
): { isWin: boolean; winAmount: number; lossAmount: number; netResult: number } {
  const isWin = betNumbers.includes(num);
  const cost = betNumbers.length * chipVal;
  const winAmount = isWin ? chipVal * tablePayoutMultiplier : 0;
  const lossAmount = cost;
  const netResult = isWin ? winAmount - cost : -cost;

  return {
    isWin,
    winAmount,
    lossAmount,
    netResult,
  };
}

export interface CamouflagedBacktestStats {
  totalEvaluated: number;
  winCount: number;
  lossCount: number;
  winRatePct: number;
  initialBankroll: number;
  finalBankroll: number;
  netProfit: number;
  roiPct: number;
  maxConsecWins: number;
  maxConsecLosses: number;
  maxDrawdown: number;
  chartHistory: { spinIndex: number; balance: number; outcome: 'WIN' | 'LOSS' | 'SKIP' }[];
  familyDistribution: Record<'1-4-7' | '2-5-8' | '0-3-6-9', number>;
}

/**
 * Executa simulação / backtest completo da estratégia de Números Camuflados
 */
export function runCamouflagedBacktest(
  spins: SpinRecord[],
  initialBankroll: number = 100,
  chipVal: number = 2.50,
  mode: 'smart' | 'family' | 'terminal' = 'smart',
  onlyAlertSpins: boolean = true
): CamouflagedBacktestStats {
  let balance = initialBankroll;
  let peak = initialBankroll;
  let maxDD = 0;
  let winCount = 0;
  let lossCount = 0;
  let currWins = 0;
  let maxConsecWins = 0;
  let currLoss = 0;
  let maxConsecLosses = 0;
  let totalWagered = 0;

  const familyDistribution: Record<'1-4-7' | '2-5-8' | '0-3-6-9', number> = {
    '1-4-7': 0,
    '2-5-8': 0,
    '0-3-6-9': 0,
  };

  const chartHistory: { spinIndex: number; balance: number; outcome: 'WIN' | 'LOSS' | 'SKIP' }[] = [
    { spinIndex: 0, balance: initialBankroll, outcome: 'SKIP' },
  ];

  spins.forEach((s) => {
    const fam = getHorseFamilyOfNumber(s.numero);
    familyDistribution[fam]++;
  });

  spins.forEach((spin, idx) => {
    const spinIndex = idx + 1;
    if (idx < 2) {
      chartHistory.push({ spinIndex, balance, outcome: 'SKIP' });
      return;
    }

    const historySlice = spins.slice(0, idx);
    const alertInfo = calculateCamouflagedAlert(historySlice, mode, chipVal);

    if (!alertInfo || (!alertInfo.hasAlert && onlyAlertSpins)) {
      chartHistory.push({ spinIndex, balance, outcome: 'SKIP' });
      return;
    }

    const { isWin, winAmount, lossAmount, netResult } = evaluateCamouflagedPayout(
      spin.numero,
      alertInfo.betNumbers,
      chipVal,
      36
    );

    totalWagered += lossAmount;
    balance += netResult;

    if (balance > peak) peak = balance;
    const dd = peak - balance;
    if (dd > maxDD) maxDD = dd;

    if (isWin) {
      winCount++;
      currWins++;
      if (currWins > maxConsecWins) maxConsecWins = currWins;
      currLoss = 0;
      chartHistory.push({ spinIndex, balance, outcome: 'WIN' });
    } else {
      lossCount++;
      currLoss++;
      if (currLoss > maxConsecLosses) maxConsecLosses = currLoss;
      currWins = 0;
      chartHistory.push({ spinIndex, balance, outcome: 'LOSS' });
    }
  });

  const totalEvaluated = winCount + lossCount;
  const winRatePct = totalEvaluated > 0 ? (winCount / totalEvaluated) * 100 : 0;
  const netProfit = balance - initialBankroll;
  const roiPct = totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0;

  return {
    totalEvaluated,
    winCount,
    lossCount,
    winRatePct,
    initialBankroll,
    finalBankroll: balance,
    netProfit,
    roiPct,
    maxConsecWins,
    maxConsecLosses,
    maxDrawdown: maxDD,
    chartHistory,
    familyDistribution,
  };
}
