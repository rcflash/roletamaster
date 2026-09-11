import { SpinRecord } from '../types';

export type SimpleChanceType = 'red' | 'black' | 'even' | 'odd' | 'high' | 'low';

export interface DAlembertPatternAlert {
  id: string;
  chanceType: SimpleChanceType;
  chanceLabel: string;
  oppositeLabel: string;
  consecutiveOppositeCount: number;
  triggerType: 'streak_break' | 'momentum_surfe' | 'compression_alert';
  title: string;
  description: string;
  recommendedBet: string;
  confidencePct: number;
  badge: string;
  suggestedUnitBet: number;
}

export interface DAlembertStep {
  spinIndex: number;
  numero: number;
  betPlacedOn: string;
  unitMultiplier: number;
  betAmount: number;
  outcome: 'GREEN' | 'RED';
  netResult: number;
  balance: number;
  drawdown: number;
}

export interface DAlembertBacktestSummary {
  initialBalance: number;
  finalBalance: number;
  netProfit: number;
  winCount: number;
  lossCount: number;
  winRatePct: number;
  maxUnitReached: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  maxDrawdown: number;
  steps: DAlembertStep[];
  chartData: { spinIndex: number; balance: number }[];
}

export const RED_NUMBERS_SET = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
]);

export const BLACK_NUMBERS_SET = new Set([
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35
]);

export function isRed(num: number): boolean {
  return RED_NUMBERS_SET.has(num);
}

export function isBlack(num: number): boolean {
  return BLACK_NUMBERS_SET.has(num);
}

export function isEven(num: number): boolean {
  return num !== 0 && num % 2 === 0;
}

export function isOdd(num: number): boolean {
  return num !== 0 && num % 2 !== 0;
}

export function isHigh(num: number): boolean {
  return num >= 19 && num <= 36;
}

export function isLow(num: number): boolean {
  return num >= 1 && num <= 18;
}

/**
 * Detecta alertas de entrada para o Método D'Alembert
 * 1. Sequência Longa Oposta (Ex: 4 ou 5 Pretos seguidos -> Ponto ótimo de entrada para D'Alembert no Vermelho)
 * 2. Surfe de Tendência / Momentum (Ex: Vermelho quente pagando com repetição)
 * 3. Falha do Zero recente gerando descompressão
 */
export function detectDAlembertAlerts(spins: SpinRecord[], baseUnit: number = 5.0): DAlembertPatternAlert[] {
  if (spins.length < 3) return [];

  const alerts: DAlembertPatternAlert[] = [];
  const recentSpins = spins.slice(-15);
  const total = spins.length;

  // Analisar sequências consecutivas atuais da mesa
  let consecBlack = 0;
  let consecRed = 0;
  let consecEven = 0;
  let consecOdd = 0;
  let consecHigh = 0;
  let consecLow = 0;

  for (let i = spins.length - 1; i >= 0; i--) {
    const n = spins[i].numero;
    if (n === 0) break; // Zero quebra a sequência direta
    if (isBlack(n) && consecRed === 0) consecBlack++;
    else if (isRed(n) && consecBlack === 0) consecRed++;
    else break;
  }

  for (let i = spins.length - 1; i >= 0; i--) {
    const n = spins[i].numero;
    if (n === 0) break;
    if (isEven(n) && consecOdd === 0) consecEven++;
    else if (isOdd(n) && consecEven === 0) consecOdd++;
    else break;
  }

  for (let i = spins.length - 1; i >= 0; i--) {
    const n = spins[i].numero;
    if (n === 0) break;
    if (isHigh(n) && consecLow === 0) consecHigh++;
    else if (isLow(n) && consecHigh === 0) consecLow++;
    else break;
  }

  // Regra 1: Sequência de 3 ou mais Pretos seguidos -> Alerta de D'Alembert no Vermelho
  if (consecBlack >= 3) {
    const confidence = Math.min(94, 65 + consecBlack * 7);
    alerts.push({
      id: `dalembert-red-${total}`,
      chanceType: 'red',
      chanceLabel: 'Vermelho (Red)',
      oppositeLabel: 'Preto (Black)',
      consecutiveOppositeCount: consecBlack,
      triggerType: 'compression_alert',
      title: `⚡ Oportunidade D'Alembert no VERMELHO (${consecBlack}x Pretos Seguidos)`,
      description: `A mesa registrou uma série de ${consecBlack} rodadas consecutivas no Preto. Pelo método D'Alembert piramidal, inicie com 1 unidade no Vermelho. Em caso de red, suba apenas +1 unidade suavemente sem risco de quebra.`,
      recommendedBet: 'Apostar 1 Unidade no Vermelho',
      confidencePct: confidence,
      badge: '🎯 Ponto de Entrada Piramidal',
      suggestedUnitBet: baseUnit,
    });
  }

  // Regra 2: Sequência de 3 ou mais Vermelhos seguidos -> Alerta de D'Alembert no Preto
  if (consecRed >= 3) {
    const confidence = Math.min(94, 65 + consecRed * 7);
    alerts.push({
      id: `dalembert-black-${total}`,
      chanceType: 'black',
      chanceLabel: 'Preto (Black)',
      oppositeLabel: 'Vermelho (Red)',
      consecutiveOppositeCount: consecRed,
      triggerType: 'compression_alert',
      title: `⚡ Oportunidade D'Alembert no PRETO (${consecRed}x Vermelhos Seguidos)`,
      description: `A mesa registrou uma série de ${consecRed} rodadas consecutivas no Vermelho. Momento ideal para abrir ciclo D'Alembert no Preto com controle estrito de unidades.`,
      recommendedBet: 'Apostar 1 Unidade no Preto',
      confidencePct: confidence,
      badge: '🎯 Ponto de Entrada Piramidal',
      suggestedUnitBet: baseUnit,
    });
  }

  // Regra 3: Par / Ímpar com 3 ou mais consecutivos
  if (consecEven >= 3) {
    alerts.push({
      id: `dalembert-odd-${total}`,
      chanceType: 'odd',
      chanceLabel: 'Ímpar (Odd)',
      oppositeLabel: 'Par (Even)',
      consecutiveOppositeCount: consecEven,
      triggerType: 'compression_alert',
      title: `⚖️ Ciclo D'Alembert no ÍMPAR (${consecEven}x Pares Seguidos)`,
      description: `${consecEven} números pares consecutivos. Inicie a progressão de 1 unidade no Ímpar. A cada erro soma +1 ficha, a cada acerto diminui -1.`,
      recommendedBet: 'Apostar 1 Unidade no Ímpar',
      confidencePct: Math.min(92, 60 + consecEven * 8),
      badge: '⚖️ Chances Simples',
      suggestedUnitBet: baseUnit,
    });
  } else if (consecOdd >= 3) {
    alerts.push({
      id: `dalembert-even-${total}`,
      chanceType: 'even',
      chanceLabel: 'Par (Even)',
      oppositeLabel: 'Ímpar (Odd)',
      consecutiveOppositeCount: consecOdd,
      triggerType: 'compression_alert',
      title: `⚖️ Ciclo D'Alembert no PAR (${consecOdd}x Ímpares Seguidos)`,
      description: `${consecOdd} números ímpares consecutivos. Abra ciclo de segurança no Par.`,
      recommendedBet: 'Apostar 1 Unidade no Par',
      confidencePct: Math.min(92, 60 + consecOdd * 8),
      badge: '⚖️ Chances Simples',
      suggestedUnitBet: baseUnit,
    });
  }

  // Regra 4: Altas / Baixas (19-36 vs 1-18)
  if (consecHigh >= 3) {
    alerts.push({
      id: `dalembert-low-${total}`,
      chanceType: 'low',
      chanceLabel: 'Baixas (1-18)',
      oppositeLabel: 'Altas (19-36)',
      consecutiveOppositeCount: consecHigh,
      triggerType: 'compression_alert',
      title: `📉 Ciclo D'Alembert nas BAIXAS (1-18) [${consecHigh}x Altas Seguidas]`,
      description: `Mesa concentrada nas altas (${consecHigh} rodadas). Inicie progressão de 1 ficha nas Baixas (1-18).`,
      recommendedBet: 'Apostar 1 Unidade em Baixas (1-18)',
      confidencePct: Math.min(90, 60 + consecHigh * 7),
      badge: '🛡️ Gestão Aritmética',
      suggestedUnitBet: baseUnit,
    });
  } else if (consecLow >= 3) {
    alerts.push({
      id: `dalembert-high-${total}`,
      chanceType: 'high',
      chanceLabel: 'Altas (19-36)',
      oppositeLabel: 'Baixas (1-18)',
      consecutiveOppositeCount: consecLow,
      triggerType: 'compression_alert',
      title: `📈 Ciclo D'Alembert nas ALTAS (19-36) [${consecLow}x Baixas Seguidas]`,
      description: `Mesa concentrada nas baixas (${consecLow} rodadas). Inicie progressão de 1 ficha nas Altas (19-36).`,
      recommendedBet: 'Apostar 1 Unidade em Altas (19-36)',
      confidencePct: Math.min(90, 60 + consecLow * 7),
      badge: '🛡️ Gestão Aritmética',
      suggestedUnitBet: baseUnit,
    });
  }

  // Se não houver sequências longas extremas, calcular tendência dominante recente (Surfe)
  if (alerts.length === 0 && recentSpins.length >= 6) {
    let redCount = 0;
    let blackCount = 0;
    recentSpins.forEach((s) => {
      if (isRed(s.numero)) redCount++;
      else if (isBlack(s.numero)) blackCount++;
    });

    if (redCount >= 5) {
      alerts.push({
        id: `dalembert-trend-red-${total}`,
        chanceType: 'red',
        chanceLabel: 'Vermelho (Surfe de Tendência)',
        oppositeLabel: 'Preto',
        consecutiveOppositeCount: 0,
        triggerType: 'momentum_surfe',
        title: `🔥 Surfe D'Alembert a Favor do VERMELHO (${redCount}/10 recentes)`,
        description: `O Vermelho está quente e dominante na janela recente. Pode-se aplicar o D'Alembert a favor do fluxo: 1 unidade no Vermelho, recuando -1 nos acertos e subindo suavemente se oscilar.`,
        recommendedBet: 'Apostar 1 Unidade a Favor do Vermelho',
        confidencePct: 75,
        badge: '🌊 Surfe de Tendência',
        suggestedUnitBet: baseUnit,
      });
    } else if (blackCount >= 5) {
      alerts.push({
        id: `dalembert-trend-black-${total}`,
        chanceType: 'black',
        chanceLabel: 'Preto (Surfe de Tendência)',
        oppositeLabel: 'Vermelho',
        consecutiveOppositeCount: 0,
        triggerType: 'momentum_surfe',
        title: `🔥 Surfe D'Alembert a Favor do PRETO (${blackCount}/10 recentes)`,
        description: `O Preto está quente e dominante na janela recente. Pode-se aplicar o D'Alembert a favor do fluxo com proteção de banca.`,
        recommendedBet: 'Apostar 1 Unidade a Favor do Preto',
        confidencePct: 75,
        badge: '🌊 Surfe de Tendência',
        suggestedUnitBet: baseUnit,
      });
    }
  }

  return alerts;
}

/**
 * Executa simulação real da estratégia D'Alembert sobre o histórico de giros
 */
export function runDAlembertSimulation(
  spins: SpinRecord[],
  chanceType: SimpleChanceType = 'red',
  unitBet: number = 5.0,
  initialBankroll: number = 1000.0
): DAlembertBacktestSummary {
  let balance = initialBankroll;
  let units = 1;
  let maxUnits = 1;
  let winCount = 0;
  let lossCount = 0;
  let currWins = 0, maxWins = 0;
  let currLoss = 0, maxLoss = 0;
  let peak = initialBankroll;
  let maxDD = 0;
  const steps: DAlembertStep[] = [];
  const chartData = [{ spinIndex: 0, balance: initialBankroll }];

  spins.forEach((spin, idx) => {
    const spinIndex = idx + 1;
    const betAmount = units * unitBet;
    const num = spin.numero;

    let isWin = false;
    if (chanceType === 'red') isWin = isRed(num);
    else if (chanceType === 'black') isWin = isBlack(num);
    else if (chanceType === 'even') isWin = isEven(num);
    else if (chanceType === 'odd') isWin = isOdd(num);
    else if (chanceType === 'high') isWin = isHigh(num);
    else if (chanceType === 'low') isWin = isLow(num);

    let net = 0;
    if (isWin) {
      net = betAmount;
      balance += net;
      winCount++;
      currWins++;
      currLoss = 0;
      if (currWins > maxWins) maxWins = currWins;
      // Regra D'Alembert: Diminui -1 unidade no Green (mínimo 1 unidade)
      units = Math.max(1, units - 1);
    } else {
      net = -betAmount;
      balance += net;
      lossCount++;
      currLoss++;
      currWins = 0;
      if (currLoss > maxLoss) maxLoss = currLoss;
      // Regra D'Alembert: Soma +1 unidade no Red (+1, +1, +1...)
      units += 1;
    }

    if (units > maxUnits) maxUnits = units;
    if (balance > peak) peak = balance;
    const dd = peak - balance;
    if (dd > maxDD) maxDD = dd;

    steps.push({
      spinIndex,
      numero: num,
      betPlacedOn: chanceType.toUpperCase(),
      unitMultiplier: units,
      betAmount,
      outcome: isWin ? 'GREEN' : 'RED',
      netResult: net,
      balance,
      drawdown: dd,
    });

    chartData.push({ spinIndex, balance });
  });

  const netProfit = balance - initialBankroll;
  const total = winCount + lossCount;
  const winRatePct = total > 0 ? (winCount / total) * 100 : 0;

  return {
    initialBalance: initialBankroll,
    finalBalance: balance,
    netProfit,
    winCount,
    lossCount,
    winRatePct,
    maxUnitReached: maxUnits,
    maxConsecutiveWins: maxWins,
    maxConsecutiveLosses: maxLoss,
    maxDrawdown: maxDD,
    steps,
    chartData,
  };
}
