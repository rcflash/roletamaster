import { SpinRecord } from '../types';

export interface JamesBondStep {
  spinIndex: number;
  numero: number;
  betHigh: number;      // 14 units on 19-36
  betSixLine: number;   // 5 units on 13-18
  betZero: number;      // 1 unit on 0
  totalBet: number;     // 20 units
  outcome: 'WIN' | 'LOSS';
  winningZone: 'HIGH' | 'SIX_LINE' | 'ZERO' | 'MISS_LOW';
  grossPayout: number;
  netResult: number;
  balance: number;
  drawdown: number;
}

export interface JamesBondAlert {
  id: string;
  triggerType: 'low_streak' | 'high_momentum' | 'zero_pressure' | 'sixline_compression';
  title: string;
  description: string;
  recommendedAction: string;
  confidencePct: number;
  badge: string;
  lowStreakCount?: number;
  hotHighCount?: number;
  suggestedUnit: number;
  distributionText: string;
}

export interface JamesBondSimulationResult {
  initialBalance: number;
  finalBalance: number;
  netProfit: number;
  winCount: number;
  lossCount: number;
  winRatePct: number;
  highWins: number;
  sixLineWins: number;
  zeroWins: number;
  missLowLosses: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  maxDrawdown: number;
  totalWagered: number;
  roiPct: number;
  steps: JamesBondStep[];
  chartData: { spinIndex: number; balance: number }[];
}

export const JAMES_BOND_HIGH_NUMBERS = [
  19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36
];

export const JAMES_BOND_SIXLINE_NUMBERS = [13, 14, 15, 16, 17, 18];

export const JAMES_BOND_UNCOVERED_LOW_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const JAMES_BOND_TOTAL_COVERAGE_COUNT = 25; // 18 + 6 + 1 (67.5% da roleta europeia)
export const JAMES_BOND_COVERAGE_PCT = 67.57;

export function isJamesBondWinner(num: number): boolean {
  return num === 0 || (num >= 13 && num <= 36);
}

export function getJamesBondZone(num: number): 'HIGH' | 'SIX_LINE' | 'ZERO' | 'MISS_LOW' {
  if (num === 0) return 'ZERO';
  if (num >= 19 && num <= 36) return 'HIGH';
  if (num >= 13 && num <= 18) return 'SIX_LINE';
  return 'MISS_LOW'; // 1 ao 12
}

/**
 * Detecta momentos de entrada de alta precisão para a James Bond:
 * 1. Sequência de números baixos não cobertos (1 a 12):
 *    - Quando a roleta bate 2, 3 ou 4 números entre 1 e 12 seguidos, a probabilidade de retorno para as zonas 13-36 ou 0 aumenta dramaticamente.
 * 2. Momentum de Altas (19-36):
 *    - Quando a mesa está em forte repetição de altas (mais de 60% das últimas 10 saídas).
 * 3. Atraso ou pressão do Zero (0):
 *    - James Bond possui seguro de 1 unidade no Zero pagando 35:1 (+16 unidades líquidas).
 */
export function detectJamesBondAlerts(
  spins: SpinRecord[],
  baseUnit: number = 0.50
): JamesBondAlert[] {
  if (spins.length < 2) return [];

  const alerts: JamesBondAlert[] = [];
  const total = spins.length;
  const unit = Math.max(0.10, baseUnit);

  // Analisar sequência recente de números baixos (1 a 12) que causam loss na James Bond
  let consecUncoveredLow = 0;
  for (let i = spins.length - 1; i >= 0; i--) {
    const n = spins[i].numero;
    if (n >= 1 && n <= 12) {
      consecUncoveredLow++;
    } else {
      break;
    }
  }

  // Janela dos últimos 12 giros
  const recent12 = spins.slice(-12);
  const highHits12 = recent12.filter((s) => s.numero >= 19 && s.numero <= 36).length;
  const sixLineHits12 = recent12.filter((s) => s.numero >= 13 && s.numero <= 18).length;
  const lowMissHits12 = recent12.filter((s) => s.numero >= 1 && s.numero <= 12).length;
  const zeroHits12 = recent12.filter((s) => s.numero === 0).length;

  const totalCost = 20 * unit;
  const distText = `14 fichas (${(14 * unit).toFixed(2)}) nas Altas (19-36) + 5 fichas (${(5 * unit).toFixed(2)}) na Seisena (13-18) + 1 ficha (${(1 * unit).toFixed(2)}) no Zero (0)`;

  // ALERTA 1: Compressão e Esgotamento da 1ª Dúzia (1-12)
  if (consecUncoveredLow >= 2) {
    const conf = Math.min(96, 68 + consecUncoveredLow * 9);
    alerts.push({
      id: `jb-low-break-${total}`,
      triggerType: 'low_streak',
      title: `⚡ Oportunidade James Bond 007 (${consecUncoveredLow}x Baixos 1-12 Seguidos)`,
      description: `A mesa registrou ${consecUncoveredLow} rodadas seguidas caindo nos números frios (1 ao 12). Como a estratégia James Bond cobre 25 dos 37 números (67.5%), o esgotamento da zona 1-12 abre ponto cirúrgico de entrada.`,
      recommendedAction: `Entrar agora com a proporção James Bond 007 cobrindo 25 números.`,
      confidencePct: conf,
      badge: '🎯 Descompressão da Zona 1-12',
      lowStreakCount: consecUncoveredLow,
      suggestedUnit: unit,
      distributionText: distText,
    });
  }

  // ALERTA 2: Surfe de Momentum de Altas (19-36 dominante)
  if (highHits12 >= 7) {
    const pct = Math.round((highHits12 / recent12.length) * 100);
    alerts.push({
      id: `jb-high-momentum-${total}`,
      triggerType: 'high_momentum',
      title: `🔥 Tendência Forte de Altas (${pct}% nos últimos 12 giros)`,
      description: `Os números 19 ao 36 dominaram ${highHits12} das últimas 12 rodadas. A posição de Altas da James Bond garante lucro de +8 unidades com 14 fichas investidas, além da proteção da seisena e zero.`,
      recommendedAction: `Aproveitar o fluxo de altas com a cobertura de proteção estendida da 007.`,
      confidencePct: Math.min(94, 75 + highHits12 * 2),
      badge: '🌊 Surfe de Tendência',
      hotHighCount: highHits12,
      suggestedUnit: unit,
      distributionText: distText,
    });
  }

  // ALERTA 3: Alerta Padrão de Cobertura Ampla quando mesa está equilibrada
  if (alerts.length === 0 && lowMissHits12 <= 3 && total >= 5) {
    alerts.push({
      id: `jb-balanced-${total}`,
      triggerType: 'sixline_compression',
      title: `🛡️ Padrão Favorável para James Bond 007 (Zona Coberta Ativa)`,
      description: `Nos últimos 12 giros, a zona coberta pela James Bond (13 ao 36 + 0) bateu ${12 - lowMissHits12} vezes (taxa de ${(
        ((12 - lowMissHits12) / 12) *
        100
      ).toFixed(0)}%). O campo de tiro está altamente favorável para a montagem de 20 fichas.`,
      recommendedAction: `Efetuar entrada com taxa teórica de 67.5% de acerto.`,
      confidencePct: 78,
      badge: '⚖️ Cobertura Blindada 67.5%',
      suggestedUnit: unit,
      distributionText: distText,
    });
  }

  return alerts;
}

/**
 * Simula a aplicação contínua da estratégia James Bond 007 no histórico de giros
 */
export function runJamesBondSimulation(
  spins: SpinRecord[],
  unitPerChip: number = 0.50,
  initialBankroll: number = 500
): JamesBondSimulationResult {
  const sorted = [...spins].sort((a, b) => a.giro - b.giro);
  let balance = initialBankroll;
  let winCount = 0;
  let lossCount = 0;
  let currWins = 0, maxWins = 0;
  let currLoss = 0, maxLoss = 0;
  let peak = initialBankroll;
  let maxDD = 0;
  let totalWagered = 0;

  let highWins = 0;
  let sixLineWins = 0;
  let zeroWins = 0;
  let missLowLosses = 0;

  const steps: JamesBondStep[] = [];
  const chartData = [{ spinIndex: 0, balance: initialBankroll }];

  const betHigh = 14 * unitPerChip;
  const betSixLine = 5 * unitPerChip;
  const betZero = 1 * unitPerChip;
  const totalBet = 20 * unitPerChip;

  sorted.forEach((s, idx) => {
    const spinIndex = idx + 1;
    totalWagered += totalBet;
    const num = s.numero;
    const zone = getJamesBondZone(num);

    let grossPayout = 0;
    let netResult = 0;
    let outcome: 'WIN' | 'LOSS' = 'LOSS';

    if (zone === 'HIGH') {
      // 14 fichas pagam 1:1 -> recebe 28 fichas (lucro líquido de +8 fichas)
      grossPayout = 28 * unitPerChip;
      netResult = grossPayout - totalBet; // +8 * unitPerChip
      balance += netResult;
      winCount++;
      highWins++;
      outcome = 'WIN';
      currWins++;
      currLoss = 0;
      if (currWins > maxWins) maxWins = currWins;
    } else if (zone === 'SIX_LINE') {
      // 5 fichas na Seisena pagam 5:1 -> recebe 30 fichas (lucro líquido de +10 fichas)
      grossPayout = 30 * unitPerChip;
      netResult = grossPayout - totalBet; // +10 * unitPerChip
      balance += netResult;
      winCount++;
      sixLineWins++;
      outcome = 'WIN';
      currWins++;
      currLoss = 0;
      if (currWins > maxWins) maxWins = currWins;
    } else if (zone === 'ZERO') {
      // 1 ficha no Zero paga 35:1 -> recebe 36 fichas (lucro líquido de +16 fichas)
      grossPayout = 36 * unitPerChip;
      netResult = grossPayout - totalBet; // +16 * unitPerChip
      balance += netResult;
      winCount++;
      zeroWins++;
      outcome = 'WIN';
      currWins++;
      currLoss = 0;
      if (currWins > maxWins) maxWins = currWins;
    } else {
      // Caiu nos números 1 ao 12 (Perda total de 20 fichas)
      grossPayout = 0;
      netResult = -totalBet;
      balance += netResult;
      lossCount++;
      missLowLosses++;
      outcome = 'LOSS';
      currLoss++;
      currWins = 0;
      if (currLoss > maxLoss) maxLoss = currLoss;
    }

    if (balance > peak) peak = balance;
    const dd = peak - balance;
    if (dd > maxDD) maxDD = dd;

    steps.push({
      spinIndex,
      numero: num,
      betHigh,
      betSixLine,
      betZero,
      totalBet,
      outcome,
      winningZone: zone,
      grossPayout,
      netResult,
      balance,
      drawdown: dd,
    });

    chartData.push({ spinIndex, balance });
  });

  const netProfit = balance - initialBankroll;
  const winRatePct = sorted.length > 0 ? (winCount / sorted.length) * 100 : 0;
  const roiPct = totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0;

  return {
    initialBalance: initialBankroll,
    finalBalance: balance,
    netProfit,
    winCount,
    lossCount,
    winRatePct,
    highWins,
    sixLineWins,
    zeroWins,
    missLowLosses,
    maxConsecutiveWins: maxWins,
    maxConsecutiveLosses: maxLoss,
    maxDrawdown: maxDD,
    totalWagered,
    roiPct,
    steps,
    chartData,
  };
}
