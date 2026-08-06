import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  ShieldAlert, 
  Percent, 
  Search, 
  Zap, 
  CheckCircle2, 
  HelpCircle, 
  Flame, 
  Globe, 
  Sparkles,
  Award,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Dices,
  RefreshCw,
  Download,
  FileText,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Ban,
  Filter
} from 'lucide-react';
import { SpinRecord, BankrollConfig } from '../types';
import { calculateNeighborsAlert, EUROPEAN_WHEEL_ORDER } from '../lib/roulette';
import { generateStrategyPDF } from '../utils/pdfStrategyGenerator';

interface StrategyBacktestPanelProps {
  spins: SpinRecord[];
  config: BankrollConfig;
  onApplyStrategy?: (strategyName: string) => void;
  disabledStrategies?: string[];
  onToggleStrategy?: (id: string) => void;
  onToggleAllStrategies?: (enable: boolean) => void;
}

export interface BacktestResult {
  id: string;
  name: string;
  category: 'Frequência / Ciclo' | 'Cobertura Alta' | 'Chances Simples' | 'Setor Físico (Roda)' | 'Terminais & Padrões';
  authorOrigin: string;
  description: string;
  coveragePct: number;
  riskLevel: 'Baixo' | 'Médio' | 'Alto';
  initialBalance: number;
  finalBalance: number;
  netProfit: number;
  roiPct: number;
  winCount: number;
  lossCount: number;
  winRatePct: number;
  // Métricas pós-100 giros (rodada 101+)
  post100WinCount: number;
  post100LossCount: number;
  post100Profit: number;
  post100EvaluatedSpins: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  maxDrawdown: number;
  historyChartData: { spinIndex: number; balance: number }[];
  howToApply: string[];
  currentSeqType: 'GREEN' | 'RED' | null;
  currentSeqCount: number;
}

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const VOISINS_NUMBERS = new Set([22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25]);

export const StrategyBacktestPanel: React.FC<StrategyBacktestPanelProps> = ({
  spins,
  config,
  onApplyStrategy,
  disabledStrategies = [],
  onToggleStrategy,
  onToggleAllStrategies,
}) => {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('romanosky');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [expandedHowTo, setExpandedHowTo] = useState<boolean>(true);

  const initialBankroll = config.initialBankroll || 100;
  const unitBet = config.defaultSpinCost || 10;

  // Run Backtests on current spins
  const backtestResults = useMemo<BacktestResult[]>(() => {
    if (spins.length === 0) return [];

    // Order spins chronologically by giro
    const sortedSpins = [...spins].sort((a, b) => a.giro - b.giro);

    // --- 1. STRATEGY: ROMANOSKY (86.4% Coverage) ---
    // Bets 3 units on 1st Dozen, 3 on 2nd Dozen, 1 on Corner (25-26-28-29), 1 on Corner (32-33-35-36) = 8 units total.
    // Wins 9 units if lands in 1-24 or corner numbers (25,26,28,29,32,33,35,36) -> Net +1 unit. Loss = -8 units.
    const runRomanosky = (): BacktestResult => {
      let balance = initialBankroll;
      let winCount = 0;
      let lossCount = 0;
      let currWins = 0, maxWins = 0;
      let currLoss = 0, maxLoss = 0;
      let peak = initialBankroll;
      let maxDD = 0;
      let post100WinCount = 0;
      let post100LossCount = 0;
      let post100Profit = 0;
      let post100EvaluatedSpins = 0;
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      const totalBetPerSpin = 8 * unitBet;
      const romanoskyNumbers = new Set([
        ...Array.from({ length: 24 }, (_, i) => i + 1), // 1..24
        25, 26, 28, 29, 32, 33, 35, 36
      ]);

      sortedSpins.forEach((spin, idx) => {
        const spinIndex = idx + 1;
        const win = romanoskyNumbers.has(spin.numero);
        if (win) {
          const profit = 9 * unitBet - totalBetPerSpin; // +1 unit
          balance += profit;
          winCount++;
          currWins++;
          currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
          if (spinIndex > 100) {
            post100WinCount++;
            post100Profit += profit;
            post100EvaluatedSpins++;
          }
        } else {
          balance -= totalBetPerSpin; // -8 units
          lossCount++;
          currLoss++;
          currWins = 0;
          if (currLoss > maxLoss) maxLoss = currLoss;
          if (spinIndex > 100) {
            post100LossCount++;
            post100Profit -= totalBetPerSpin;
            post100EvaluatedSpins++;
          }
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex, balance });
      });

      const netProfit = balance - initialBankroll;
      const totalWagered = sortedSpins.length * totalBetPerSpin;

      return {
        id: 'romanosky',
        name: 'Estratégia Romanosky (Cobertura 86.4%)',
        category: 'Cobertura Alta',
        authorOrigin: 'Comunidade Europeia de Apostadores Profissionais',
        description: 'Cobre 32 dos 37 números da roleta apostando simultaneamente em 2 Dúzias e 2 Quadrados (Corners). Garante vitórias constantes em 86.4% dos giros.',
        coveragePct: 86.4,
        riskLevel: 'Baixo',
        initialBalance: initialBankroll,
        finalBalance: balance,
        netProfit,
        roiPct: totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0,
        winCount,
        lossCount,
        winRatePct: sortedSpins.length > 0 ? (winCount / sortedSpins.length) * 100 : 0,
        post100WinCount,
        post100LossCount,
        post100Profit,
        post100EvaluatedSpins,
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
        currentSeqType: currWins > 0 ? 'GREEN' : currLoss > 0 ? 'RED' : null,
        currentSeqCount: currWins > 0 ? currWins : currLoss > 0 ? currLoss : 0,
        howToApply: [
          `Considerando seu Custo Padrão de ${config.currency} ${unitBet.toFixed(2)} por ficha/entrada:`,
          `Coloque ${config.currency} ${(unitBet * 0.375).toFixed(2)} (3 fichas) na 1ª Dúzia (1 ao 12).`,
          `Coloque ${config.currency} ${(unitBet * 0.375).toFixed(2)} (3 fichas) na 2ª Dúzia (13 ao 24).`,
          `Coloque ${config.currency} ${(unitBet * 0.125).toFixed(2)} (1 ficha) no Quadrado (25-26-28-29).`,
          `Coloque ${config.currency} ${(unitBet * 0.125).toFixed(2)} (1 ficha) no Quadrado (32-33-35-36).`,
          `Se a bola cair em qualquer um desses 32 números, você recebe ${config.currency} ${(unitBet * 1.125).toFixed(2)} com lucro líquido de +${config.currency} ${(unitBet * 0.125).toFixed(2)}!`
        ]
      };
    };

    // --- 2. STRATEGY: NÚMEROS AUSENTES / CICLO DA ROLETA ---
    // Bets 1 unit on numbers that HAVEN'T appeared in the last 25 spins (Cold/Unseen numbers).
    const runColdCycle = (): BacktestResult => {
      let balance = initialBankroll;
      let winCount = 0;
      let lossCount = 0;
      let currWins = 0, maxWins = 0;
      let currLoss = 0, maxLoss = 0;
      let peak = initialBankroll;
      let maxDD = 0;
      let totalWagered = 0;
      let post100WinCount = 0;
      let post100LossCount = 0;
      let post100Profit = 0;
      let post100EvaluatedSpins = 0;
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      const LOOKBACK = 25;

      sortedSpins.forEach((spin, idx) => {
        const spinIndex = idx + 1;
        if (idx < 15) {
          // Warmup phase
          history.push({ spinIndex, balance });
          return;
        }

        const recentSlice = sortedSpins.slice(Math.max(0, idx - LOOKBACK), idx);
        const seenNumbers = new Set(recentSlice.map(s => s.numero));
        const unseenNumbers: number[] = [];
        for (let n = 0; n <= 36; n++) {
          if (!seenNumbers.has(n)) unseenNumbers.push(n);
        }

        if (unseenNumbers.length === 0) {
          history.push({ spinIndex, balance });
          return;
        }

        const betPerNumber = unitBet;
        const totalBet = unseenNumbers.length * betPerNumber;
        totalWagered += totalBet;

        if (unseenNumbers.includes(spin.numero)) {
          const payout = 36 * betPerNumber;
          const profit = payout - totalBet;
          balance += profit;
          winCount++;
          currWins++;
          currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
          if (spinIndex > 100) {
            post100WinCount++;
            post100Profit += profit;
            post100EvaluatedSpins++;
          }
        } else {
          balance -= totalBet;
          lossCount++;
          currLoss++;
          currWins = 0;
          if (currLoss > maxLoss) maxLoss = currLoss;
          if (spinIndex > 100) {
            post100LossCount++;
            post100Profit -= totalBet;
            post100EvaluatedSpins++;
          }
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex, balance });
      });

      const netProfit = balance - initialBankroll;
      const evaluatedSpins = winCount + lossCount;

      return {
        id: 'cold_cycle',
        name: 'Ciclo de Fechamento (Aposta em Ausentes)',
        category: 'Frequência / Ciclo',
        authorOrigin: 'Estratégia de Estatística Matemática (Efeito de Rotação Uniforme)',
        description: 'Mapeia os números que estão há mais de 25 rodadas sem sair e aposta diretamente neles. Como a roleta tende ao equilíbrio a cada 37 giros, os números ausentes costumam sair em sequência.',
        coveragePct: 35.0,
        riskLevel: 'Baixo',
        initialBalance: initialBankroll,
        finalBalance: balance,
        netProfit,
        roiPct: totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0,
        winCount,
        lossCount,
        winRatePct: evaluatedSpins > 0 ? (winCount / evaluatedSpins) * 100 : 0,
        post100WinCount,
        post100LossCount,
        post100Profit,
        post100EvaluatedSpins,
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
        currentSeqType: currWins > 0 ? 'GREEN' : currLoss > 0 ? 'RED' : null,
        currentSeqCount: currWins > 0 ? currWins : currLoss > 0 ? currLoss : 0,
        howToApply: [
          `Identifique os números que estão há 25+ rodadas sem sair (os mais "frios").`,
          `Divida seu total por giro (${config.currency} ${unitBet.toFixed(2)}) igualmente entre cada um dos números ausentes. Exemplo: Se forem 10 números ausentes, coloque ${config.currency} ${(unitBet / 10).toFixed(2)} direto em cada número.`,
          `Quando qualquer um desses números ausentes for sorteado, o pagamento de 36x cobre todos os giros anteriores com lucro de até ${config.currency} ${(unitBet * 2.6).toFixed(2)} por acerto!`,
          'Mantenha o acompanhamento no robô a cada rodada.'
        ]
      };
    };

    // --- 3. STRATEGY: 2 DÚZIAS TENDENCIAIS (64.8% Coverage) ---
    // Bets 1 unit on the 2 Dozens that appeared most frequently in the last 20 spins.
    const runTwoDozens = (): BacktestResult => {
      let balance = initialBankroll;
      let winCount = 0;
      let lossCount = 0;
      let currWins = 0, maxWins = 0;
      let currLoss = 0, maxLoss = 0;
      let peak = initialBankroll;
      let maxDD = 0;
      let totalWagered = 0;
      let post100WinCount = 0;
      let post100LossCount = 0;
      let post100Profit = 0;
      let post100EvaluatedSpins = 0;
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      sortedSpins.forEach((spin, idx) => {
        const spinIndex = idx + 1;
        if (idx < 10) {
          history.push({ spinIndex, balance });
          return;
        }

        // Calculate dozen counts in recent 20 spins
        const recent = sortedSpins.slice(Math.max(0, idx - 20), idx);
        const dCounts = { D1: 0, D2: 0, D3: 0 };
        recent.forEach(s => {
          if (s.dozen === 'D1') dCounts.D1++;
          else if (s.dozen === 'D2') dCounts.D2++;
          else if (s.dozen === 'D3') dCounts.D3++;
        });

        // Pick top 2 dozens
        const sortedD = (Object.keys(dCounts) as Array<'D1'|'D2'|'D3'>).sort((a,b) => dCounts[b] - dCounts[a]);
        const betDozens = [sortedD[0], sortedD[1]];

        const totalBet = 2 * unitBet;
        totalWagered += totalBet;

        if (betDozens.includes(spin.dozen as any)) {
          const profit = 3 * unitBet - totalBet; // +1 unit
          balance += profit;
          winCount++;
          currWins++;
          currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
          if (spinIndex > 100) {
            post100WinCount++;
            post100Profit += profit;
            post100EvaluatedSpins++;
          }
        } else {
          balance -= totalBet; // -2 units
          lossCount++;
          currLoss++;
          currWins = 0;
          if (currLoss > maxLoss) maxLoss = currLoss;
          if (spinIndex > 100) {
            post100LossCount++;
            post100Profit -= totalBet;
            post100EvaluatedSpins++;
          }
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex, balance });
      });

      const netProfit = balance - initialBankroll;
      const evaluatedSpins = winCount + lossCount;

      return {
        id: 'two_dozens',
        name: 'Aposta em 2 Dúzias Dominantes',
        category: 'Cobertura Alta',
        authorOrigin: 'Estratégia de Tendência de Cassino Vivo',
        description: 'Aposta 1 ficha em 2 Dúzias ao mesmo tempo (as 2 que estão mais quentes na mesa). Cobre 24 números (64.8% da roleta) gerando renda recorrente.',
        coveragePct: 64.8,
        riskLevel: 'Baixo',
        initialBalance: initialBankroll,
        finalBalance: balance,
        netProfit,
        roiPct: totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0,
        winCount,
        lossCount,
        winRatePct: evaluatedSpins > 0 ? (winCount / evaluatedSpins) * 100 : 0,
        post100WinCount,
        post100LossCount,
        post100Profit,
        post100EvaluatedSpins,
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
        currentSeqType: currWins > 0 ? 'GREEN' : currLoss > 0 ? 'RED' : null,
        currentSeqCount: currWins > 0 ? currWins : currLoss > 0 ? currLoss : 0,
        howToApply: [
          'Observe no gráfico do robô quais são as 2 Dúzias mais quentes no momento.',
          `Com seu custo de ${config.currency} ${unitBet.toFixed(2)} por giro, aposte ${config.currency} ${(unitBet / 2).toFixed(2)} na 1ª Dúzia e ${config.currency} ${(unitBet / 2).toFixed(2)} na 2ª Dúzia.`,
          `Se cair em qualquer número entre 1 e 24, você recebe ${config.currency} ${(unitBet * 1.5).toFixed(2)} (Lucro limpo de +${config.currency} ${(unitBet * 0.5).toFixed(2)} no giro!).`,
          'Ajuste as dúzias sempre que as temperaturas mudarem.'
        ]
      };
    };

    // --- 4. STRATEGY: D'ALEMBERT (Simple Chances - Red/Black) ---
    // Increments bet +1 unit on loss, decrements -1 unit on win.
    const runDAlembert = (): BacktestResult => {
      let balance = initialBankroll;
      let betUnits = 1;
      let winCount = 0;
      let lossCount = 0;
      let currWins = 0, maxWins = 0;
      let currLoss = 0, maxLoss = 0;
      let peak = initialBankroll;
      let maxDD = 0;
      let totalWagered = 0;
      let post100WinCount = 0;
      let post100LossCount = 0;
      let post100Profit = 0;
      let post100EvaluatedSpins = 0;
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      sortedSpins.forEach((spin, idx) => {
        const spinIndex = idx + 1;
        const betAmount = betUnits * unitBet;
        totalWagered += betAmount;

        // Betting on Red
        const isRed = RED_NUMBERS.has(spin.numero);
        if (isRed) {
          balance += betAmount;
          winCount++;
          currWins++;
          currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
          betUnits = Math.max(1, betUnits - 1);
          if (spinIndex > 100) {
            post100WinCount++;
            post100Profit += betAmount;
            post100EvaluatedSpins++;
          }
        } else {
          balance -= betAmount;
          lossCount++;
          currLoss++;
          currWins = 0;
          if (currLoss > maxLoss) maxLoss = currLoss;
          betUnits += 1;
          if (spinIndex > 100) {
            post100LossCount++;
            post100Profit -= betAmount;
            post100EvaluatedSpins++;
          }
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex, balance });
      });

      const netProfit = balance - initialBankroll;

      return {
        id: 'dalembert',
        name: 'Método D\'Alembert (Chances Simples)',
        category: 'Chances Simples',
        authorOrigin: 'Jean le Rond d\'Alembert (Matemático Francês)',
        description: 'Progressão matemática piramidal extremamente segura. Aumenta +1 ficha após um erro e reduz -1 ficha após um acerto no Vermelho/Preto ou Par/Ímpar.',
        coveragePct: 48.6,
        riskLevel: 'Médio',
        initialBalance: initialBankroll,
        finalBalance: balance,
        netProfit,
        roiPct: totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0,
        winCount,
        lossCount,
        winRatePct: sortedSpins.length > 0 ? (winCount / sortedSpins.length) * 100 : 0,
        post100WinCount,
        post100LossCount,
        post100Profit,
        post100EvaluatedSpins,
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
        currentSeqType: currWins > 0 ? 'GREEN' : currLoss > 0 ? 'RED' : null,
        currentSeqCount: currWins > 0 ? currWins : currLoss > 0 ? currLoss : 0,
        howToApply: [
          `Comece com uma aposta inicial de ${config.currency} ${unitBet.toFixed(2)} no Vermelho (ou Preto/Par/Ímpar).`,
          `Se a rodada der ERRO: Aumente a próxima aposta em +${config.currency} ${unitBet.toFixed(2)} (ex: de ${config.currency} ${unitBet.toFixed(2)} para ${config.currency} ${(unitBet * 2).toFixed(2)}).`,
          `Se a rodada der ACERTO: Diminua a próxima aposta em -${config.currency} ${unitBet.toFixed(2)} (voltando até o valor mínimo de ${config.currency} ${unitBet.toFixed(2)}).`,
          'Esse método compensa perdas suavemente sem precisar dobrar perigosamente a banca como no Martingale.'
        ]
      };
    };

    // --- 5. STRATEGY: JAMES BOND 007 ---
    // Bet proportional to 20 units: 14 units on High (19-36), 5 units on Six Line (13-18), 1 unit on Zero (0).
    // Total bet: 20 units. Coverage: 25 numbers (67.5%).
    const runJamesBond = (): BacktestResult => {
      let balance = initialBankroll;
      let winCount = 0;
      let lossCount = 0;
      let currWins = 0, maxWins = 0;
      let currLoss = 0, maxLoss = 0;
      let peak = initialBankroll;
      let maxDD = 0;
      let totalWagered = 0;
      let post100WinCount = 0;
      let post100LossCount = 0;
      let post100Profit = 0;
      let post100EvaluatedSpins = 0;
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      const totalBet = 20 * unitBet;

      sortedSpins.forEach((spin, idx) => {
        const spinIndex = idx + 1;
        totalWagered += totalBet;
        const num = spin.numero;

        if (num >= 19 && num <= 36) {
          // High bet wins (14 units on High pays 1:1 -> 28 units total payout) -> Net +8 units
          const profit = 8 * unitBet;
          balance += profit;
          winCount++;
          currWins++;
          currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
          if (spinIndex > 100) {
            post100WinCount++;
            post100Profit += profit;
            post100EvaluatedSpins++;
          }
        } else if (num >= 13 && num <= 18) {
          // Six Line bet wins (5 units pays 5:1 -> 30 units total payout) -> Net +10 units
          const profit = 10 * unitBet;
          balance += profit;
          winCount++;
          currWins++;
          currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
          if (spinIndex > 100) {
            post100WinCount++;
            post100Profit += profit;
            post100EvaluatedSpins++;
          }
        } else if (num === 0) {
          // Zero bet wins (1 unit pays 35:1 -> 36 units total payout) -> Net +16 units
          const profit = 16 * unitBet;
          balance += profit;
          winCount++;
          currWins++;
          currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
          if (spinIndex > 100) {
            post100WinCount++;
            post100Profit += profit;
            post100EvaluatedSpins++;
          }
        } else {
          // Losses on 1..12 -> Lose 20 units
          balance -= totalBet;
          lossCount++;
          currLoss++;
          currWins = 0;
          if (currLoss > maxLoss) maxLoss = currLoss;
          if (spinIndex > 100) {
            post100LossCount++;
            post100Profit -= totalBet;
            post100EvaluatedSpins++;
          }
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex, balance });
      });

      const netProfit = balance - initialBankroll;

      return {
        id: 'james_bond',
        name: 'Estratégia James Bond (007)',
        category: 'Cobertura Alta',
        authorOrigin: 'Ian Fleming (Criador do Agente 007)',
        description: 'Estratégia clássica de cobertura fixa dividida em 3 posições estratégicas: Altas (19-36), Seisena (13-18) e Seguro no Zero (0). Cobre 67.5% da roleta.',
        coveragePct: 67.5,
        riskLevel: 'Médio',
        initialBalance: initialBankroll,
        finalBalance: balance,
        netProfit,
        roiPct: totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0,
        winCount,
        lossCount,
        winRatePct: sortedSpins.length > 0 ? (winCount / sortedSpins.length) * 100 : 0,
        post100WinCount,
        post100LossCount,
        post100Profit,
        post100EvaluatedSpins,
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
        currentSeqType: currWins > 0 ? 'GREEN' : currLoss > 0 ? 'RED' : null,
        currentSeqCount: currWins > 0 ? currWins : currLoss > 0 ? currLoss : 0,
        howToApply: [
          `Para um total de entrada de R$ 10,00 por giro:`,
          `Coloque ${config.currency} 7,00 na aposta externa de Números Altos (19 ao 36).`,
          `Coloque ${config.currency} 2,50 na Seisena dos números 13 ao 18.`,
          `Coloque ${config.currency} 0,50 de proteção no número Zero (0).`,
          `Se a bola cair em qualquer número entre 13 e 36 ou no Zero (25 números no total - 67.5% da roleta), você sai vitorioso!`
        ]
      };
    };

    // --- 6. STRATEGY: VOISINS DU ZÉRO (Vizinhos do Zero) ---
    // Bets on 17 numbers surrounding 0 on the European Wheel.
    // Cost: 9 chips.
    const runVoisins = (): BacktestResult => {
      let balance = initialBankroll;
      let winCount = 0;
      let lossCount = 0;
      let currWins = 0, maxWins = 0;
      let currLoss = 0, maxLoss = 0;
      let peak = initialBankroll;
      let maxDD = 0;
      let totalWagered = 0;
      let post100WinCount = 0;
      let post100LossCount = 0;
      let post100Profit = 0;
      let post100EvaluatedSpins = 0;
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      const totalBet = 9 * unitBet;

      sortedSpins.forEach((spin, idx) => {
        const spinIndex = idx + 1;
        totalWagered += totalBet;

        if (VOISINS_NUMBERS.has(spin.numero)) {
          // Average payout for Voisins du Zero win is ~18 units (Net +9 units)
          const profit = 9 * unitBet;
          balance += profit;
          winCount++;
          currWins++;
          currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
          if (spinIndex > 100) {
            post100WinCount++;
            post100Profit += profit;
            post100EvaluatedSpins++;
          }
        } else {
          balance -= totalBet;
          lossCount++;
          currLoss++;
          currWins = 0;
          if (currLoss > maxLoss) maxLoss = currLoss;
          if (spinIndex > 100) {
            post100LossCount++;
            post100Profit -= totalBet;
            post100EvaluatedSpins++;
          }
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex, balance });
      });

      const netProfit = balance - initialBankroll;

      return {
        id: 'voisins',
        name: 'Vizinhos do Zero (Voisins du Zéro)',
        category: 'Setor Físico (Roda)',
        authorOrigin: 'Cassinos Tradicionais de Monte Carlo',
        description: 'Aposta focada na física da roda europeia. Cobre o maior setor de 17 números ao redor do Zero (22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25).',
        coveragePct: 45.9,
        riskLevel: 'Médio',
        initialBalance: initialBankroll,
        finalBalance: balance,
        netProfit,
        roiPct: totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0,
        winCount,
        lossCount,
        winRatePct: sortedSpins.length > 0 ? (winCount / sortedSpins.length) * 100 : 0,
        post100WinCount,
        post100LossCount,
        post100Profit,
        post100EvaluatedSpins,
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
        currentSeqType: currWins > 0 ? 'GREEN' : currLoss > 0 ? 'RED' : null,
        currentSeqCount: currWins > 0 ? currWins : currLoss > 0 ? currLoss : 0,
        howToApply: [
          'No painel de apostas especiais (Racetrack/Pista) do cassino, selecione a opção "Voisins du Zéro" (Vizinhos do Zero).',
          `Com um orçamento de R$ 10,00 por giro, são distribuídas 9 fichas de ~R$ 1,10 cobrindo os 17 números ao redor do Zero.`,
          'Aposta ideal para quando a análise térmica indicar que o setor superior da roleta está quente.'
        ]
      };
    };

    // --- 7. STRATEGY: ALERTA DE VIZINHOS DO CILINDRO ---
    // Enters on wheel neighbors (default 2 neighbors = 5 numbers sector) when dynamic momentum alert triggers.
    const runNeighborsAlert = (): BacktestResult => {
      let balance = initialBankroll;
      let winCount = 0;
      let lossCount = 0;
      let currWins = 0, maxWins = 0;
      let currLoss = 0, maxLoss = 0;
      let peak = initialBankroll;
      let maxDD = 0;
      let totalWagered = 0;
      let post100WinCount = 0;
      let post100LossCount = 0;
      let post100Profit = 0;
      let post100EvaluatedSpins = 0;
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      const neighborRadius = 2; // 2 vizinhos = 5 casas cobertas
      const sectorSize = neighborRadius * 2 + 1; // 5
      const chipVal = Math.max(0.5, unitBet / sectorSize);

      sortedSpins.forEach((spin, idx) => {
        const spinIndex = idx + 1;
        if (idx < 2) {
          history.push({ spinIndex, balance });
          return;
        }

        const historyUpToCurrent = sortedSpins.slice(0, idx);
        const alertInfo = calculateNeighborsAlert(historyUpToCurrent, neighborRadius);

        if (alertInfo.hasAlert) {
          const cost = sectorSize * chipVal;
          totalWagered += cost;

          const isHit = alertInfo.neighborsList.includes(spin.numero);
          if (isHit) {
            const payout = 36 * chipVal;
            const profit = payout - cost;
            balance += profit;
            winCount++;
            currWins++;
            currLoss = 0;
            if (currWins > maxWins) maxWins = currWins;
            if (spinIndex > 100) {
              post100WinCount++;
              post100Profit += profit;
              post100EvaluatedSpins++;
            }
          } else {
            balance -= cost;
            lossCount++;
            currLoss++;
            currWins = 0;
            if (currLoss > maxLoss) maxLoss = currLoss;
            if (spinIndex > 100) {
              post100LossCount++;
              post100Profit -= cost;
              post100EvaluatedSpins++;
            }
          }
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex, balance });
      });

      const netProfit = balance - initialBankroll;
      const evaluatedSpins = winCount + lossCount;

      return {
        id: 'neighbors',
        name: 'Alerta de Vizinhos do Cilindro',
        category: 'Setor Físico (Roda)',
        authorOrigin: 'Algoritmo de Momentum Térmico no Cilindro (5 Números)',
        description: 'Dispara entradas dinâmicas nos 2 vizinhos mais quentes da pista quando detecta acúmulo de frequência e tendência ativa no setor do último número sorteado.',
        coveragePct: 13.5,
        riskLevel: 'Médio',
        initialBalance: initialBankroll,
        finalBalance: balance,
        netProfit,
        roiPct: totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0,
        winCount,
        lossCount,
        winRatePct: evaluatedSpins > 0 ? (winCount / evaluatedSpins) * 100 : 0,
        post100WinCount,
        post100LossCount,
        post100Profit,
        post100EvaluatedSpins,
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
        currentSeqType: currWins > 0 ? 'GREEN' : currLoss > 0 ? 'RED' : null,
        currentSeqCount: currWins > 0 ? currWins : currLoss > 0 ? currLoss : 0,
        howToApply: [
          'Acompanhe o indicador em tempo real no painel do Robô de Alertas.',
          `Quando o robô disparar ALERTA DE VIZINHOS, aposte ${config.currency} ${chipVal.toFixed(2)} em cada um dos 5 números indicados no setor da pista.`,
          'Caso a bola caia no setor aquecido, o pagamento direto de 36x gera lucro líquido expressivo por acerto!',
          'Se não houver alerta ativo, permaneça em observação sem fazer entradas.'
        ]
      };
    };

    // --- 8. STRATEGY: ANÁLISE DE TERMINAIS & SEQUÊNCIA (ESTRATÉGIA DO GRÁFICO) ---
    // Identifies terminal repetition, preceding/succeeding terminal pulls from historical chart, plus zero safety.
    const runTerminalSequenceChart = (): BacktestResult => {
      let balance = initialBankroll;
      let winCount = 0;
      let lossCount = 0;
      let currWins = 0, maxWins = 0;
      let currLoss = 0, maxLoss = 0;
      let peak = initialBankroll;
      let maxDD = 0;
      let totalWagered = 0;
      let post100WinCount = 0;
      let post100LossCount = 0;
      let post100Profit = 0;
      let post100EvaluatedSpins = 0;
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      sortedSpins.forEach((spin, idx) => {
        const spinIndex = idx + 1;
        if (idx < 3) {
          history.push({ spinIndex, balance });
          return;
        }

        const historySlice = sortedSpins.slice(Math.max(0, idx - 15), idx);
        const lastSpin = historySlice[historySlice.length - 1];
        const lastTerminal = lastSpin.numero % 10;

        const followerCount: Record<number, number> = {};
        for (let i = 0; i < historySlice.length - 1; i++) {
          if (historySlice[i].numero % 10 === lastTerminal) {
            const nextTerm = historySlice[i + 1].numero % 10;
            followerCount[nextTerm] = (followerCount[nextTerm] || 0) + 1;
          }
        }

        let topFollower = (lastTerminal + 1) % 10;
        let maxCount = 0;
        Object.entries(followerCount).forEach(([termStr, count]) => {
          if (count > maxCount) {
            maxCount = count;
            topFollower = Number(termStr);
          }
        });

        const targetTerminals = new Set([lastTerminal, topFollower]);
        const targetNumbers: number[] = [0];
        for (let n = 1; n <= 36; n++) {
          if (targetTerminals.has(n % 10)) {
            targetNumbers.push(n);
          }
        }

        const chipVal = Math.max(0.5, unitBet / targetNumbers.length);
        const cost = targetNumbers.length * chipVal;
        totalWagered += cost;

        const isHit = targetNumbers.includes(spin.numero);
        if (isHit) {
          const payout = 36 * chipVal;
          const profit = payout - cost;
          balance += profit;
          winCount++;
          currWins++;
          currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
          if (spinIndex > 100) {
            post100WinCount++;
            post100Profit += profit;
            post100EvaluatedSpins++;
          }
        } else {
          balance -= cost;
          lossCount++;
          currLoss++;
          currWins = 0;
          if (currLoss > maxLoss) maxLoss = currLoss;
          if (spinIndex > 100) {
            post100LossCount++;
            post100Profit -= cost;
            post100EvaluatedSpins++;
          }
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex, balance });
      });

      const netProfit = balance - initialBankroll;
      const evaluatedSpins = winCount + lossCount;

      return {
        id: 'terminal_sequence_chart',
        name: 'Análise de Terminais & Sequência (Estratégia do Gráfico)',
        category: 'Terminais & Padrões',
        authorOrigin: 'Estratégia do Gráfico (Análise de Padrões e Falhas de Sequência)',
        description: 'Mapeia a atração e repetição de terminais no histórico recente do gráfico, identificando terminais com alto índice de atração e cobrindo os números correspondentes mais o Zero de proteção.',
        coveragePct: 24.3,
        riskLevel: 'Médio',
        initialBalance: initialBankroll,
        finalBalance: balance,
        netProfit,
        roiPct: totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0,
        winCount,
        lossCount,
        winRatePct: evaluatedSpins > 0 ? (winCount / evaluatedSpins) * 100 : 0,
        post100WinCount,
        post100LossCount,
        post100Profit,
        post100EvaluatedSpins,
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
        currentSeqType: currWins > 0 ? 'GREEN' : currLoss > 0 ? 'RED' : null,
        currentSeqCount: currWins > 0 ? currWins : currLoss > 0 ? currLoss : 0,
        howToApply: [
          'Observe no histórico recente do gráfico quais terminais (ex: 7, 1, 6, 4, 3, 8) estão se atraindo em sequência.',
          `Identifique o último terminal sorteado e os 2 terminais correspondentes mais fortes na curva do gráfico.`,
          `Faça a cobertura dividida entre todos os números desses 2 terminais (ex: 4, 14, 24, 34 e 8, 18, 28) + 1 ficha de seguro no número Zero (0).`,
          'Capitalize quando a roleta mantiver o padrão de repetição de sequências de terminais observadas no gráfico.'
        ]
      };
    };

    // --- 9. STRATEGY: GUGA TV (LINHA DO TEMPO & TERMINAIS QUENTES) ---
    const runGugaTV = (): BacktestResult => {
      let balance = initialBankroll;
      let winCount = 0;
      let lossCount = 0;
      let currWins = 0, maxWins = 0;
      let currLoss = 0, maxLoss = 0;
      let peak = initialBankroll;
      let maxDD = 0;
      let totalWagered = 0;
      let post100WinCount = 0;
      let post100LossCount = 0;
      let post100Profit = 0;
      let post100EvaluatedSpins = 0;
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      sortedSpins.forEach((spin, idx) => {
        const spinIndex = idx + 1;
        if (idx < 2) {
          history.push({ spinIndex, balance });
          return;
        }

        const historySlice = sortedSpins.slice(Math.max(0, idx - 12), idx);
        const recentTerminals = historySlice.map(s => s.numero % 10);

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

        const chipVal = Math.max(0.5, unitBet / gugaTargetNumbers.length);
        const cost = gugaTargetNumbers.length * chipVal;
        totalWagered += cost;

        const isHit = gugaTargetNumbers.includes(spin.numero);
        if (isHit) {
          const payout = 36 * chipVal;
          const profit = payout - cost;
          balance += profit;
          winCount++;
          currWins++;
          currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
          if (spinIndex > 100) {
            post100WinCount++;
            post100Profit += profit;
            post100EvaluatedSpins++;
          }
        } else {
          balance -= cost;
          lossCount++;
          currLoss++;
          currWins = 0;
          if (currLoss > maxLoss) maxLoss = currLoss;
          if (spinIndex > 100) {
            post100LossCount++;
            post100Profit -= cost;
            post100EvaluatedSpins++;
          }
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex, balance });
      });

      const netProfit = balance - initialBankroll;
      const evaluatedSpins = winCount + lossCount;

      return {
        id: 'guga_tv',
        name: 'Estratégia Guga TV (Linha do Tempo & Terminais)',
        category: 'Terminais & Padrões',
        authorOrigin: 'Guga TV (Análise de Linha do Tempo e Sequências de Terminais)',
        description: 'Mapeia a linha do tempo dos terminais mais recorrentes (1, 4, 7, 0, 3, 8), cobrindo terminais em sequência recente com vizinhos no cilindro e proteção sistemática no Zero (0).',
        coveragePct: 27.0,
        riskLevel: 'Médio',
        initialBalance: initialBankroll,
        finalBalance: balance,
        netProfit,
        roiPct: totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0,
        winCount,
        lossCount,
        winRatePct: evaluatedSpins > 0 ? (winCount / evaluatedSpins) * 100 : 0,
        post100WinCount,
        post100LossCount,
        post100Profit,
        post100EvaluatedSpins,
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
        currentSeqType: currWins > 0 ? 'GREEN' : currLoss > 0 ? 'RED' : null,
        currentSeqCount: currWins > 0 ? currWins : currLoss > 0 ? currLoss : 0,
        howToApply: [
          'Analise a linha do tempo recente na mesa identificando repetições dos terminais quentes (ex: 1, 4, 7, 0, 3 e 8).',
          'Quando identificar sequências (ex: 4-0-1-7 ou cercado de zero 0-8-0), faça entradas nos terminais quentes ativas.',
          'Adicione obrigatoriamente 1 ficha de proteção direta no número Zero (0).',
          'Ajuste as fichas cobrindo os vizinhos laterais do último número se a mesa trouxer um terminal ausente.'
        ]
      };
    };

    // --- 10. STRATEGY: MARTINGALE DE PROFISSIONAL NA ROLETA ---
    const runMartingaleProfissional = (): BacktestResult => {
      let balance = initialBankroll;
      let winCount = 0;
      let lossCount = 0;
      let currWins = 0, maxWins = 0;
      let currLoss = 0, maxLoss = 0;
      let peak = initialBankroll;
      let maxDD = 0;
      let totalWagered = 0;
      let martingaleMultiplier = 1;
      let post100WinCount = 0;
      let post100LossCount = 0;
      let post100Profit = 0;
      let post100EvaluatedSpins = 0;
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      sortedSpins.forEach((spin, idx) => {
        const spinIndex = idx + 1;
        if (idx < 2) {
          history.push({ spinIndex, balance });
          return;
        }

        const historySlice = sortedSpins.slice(Math.max(0, idx - 10), idx);
        const recentNumbers = historySlice.map(s => s.numero);

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
        const baseChip = Math.max(0.5, unitBet / targets.length);
        const currentChip = baseChip * martingaleMultiplier;
        const cost = targets.length * currentChip;
        totalWagered += cost;

        const isHit = targets.includes(spin.numero);
        if (isHit) {
          const payout = 36 * currentChip;
          const profit = payout - cost;
          balance += profit;
          winCount++;
          currWins++;
          currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
          martingaleMultiplier = 1;
          if (spinIndex > 100) {
            post100WinCount++;
            post100Profit += profit;
            post100EvaluatedSpins++;
          }
        } else {
          balance -= cost;
          lossCount++;
          currLoss++;
          currWins = 0;
          if (currLoss > maxLoss) maxLoss = currLoss;
          martingaleMultiplier = martingaleMultiplier === 1 ? 2 : 1;
          if (spinIndex > 100) {
            post100LossCount++;
            post100Profit -= cost;
            post100EvaluatedSpins++;
          }
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex, balance });
      });

      const netProfit = balance - initialBankroll;
      const evaluatedSpins = winCount + lossCount;

      return {
        id: 'martingale_profissional',
        name: 'Estratégia Martingale De Profissional Na Roleta',
        category: 'Terminais & Padrões',
        authorOrigin: 'Martingale de Profissional (Dobra Inteligente em Zonas Quentes)',
        description: 'Mapeia zonas quentes do cilindro com vizinhos + terminais altos (7, 8, 9) e Zero. Aplica Martingale disciplinado de no máximo 1 nível após uma perda para rápida recuperação.',
        coveragePct: 35.1,
        riskLevel: 'Médio',
        initialBalance: initialBankroll,
        finalBalance: balance,
        netProfit,
        roiPct: totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0,
        winCount,
        lossCount,
        winRatePct: evaluatedSpins > 0 ? (winCount / evaluatedSpins) * 100 : 0,
        post100WinCount,
        post100LossCount,
        post100Profit,
        post100EvaluatedSpins,
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
        currentSeqType: currWins > 0 ? 'GREEN' : currLoss > 0 ? 'RED' : null,
        currentSeqCount: currWins > 0 ? currWins : currLoss > 0 ? currLoss : 0,
        howToApply: [
          'Mapeie os últimos números sorteados e cubra cada número com 1 vizinho no cilindro.',
          'Adicione cobertura individual nos terminais altos da mesa (7, 8 e 9) e no número Zero (0).',
          'Se a 1ª entrada falhar (Red), aplique a Dobra de Martingale (2x) na entrada imediatamente seguinte na mesma tendência.',
          'Meta disciplinada: busque de 3 a 4 Greens consecutivos e encerre a sessão para proteger o lucro.'
        ]
      };
    };

    // --- 11. STRATEGY: ESTRATÉGIA SIMPLES NA ROLETA ONLINE ---
    const runEstrategiaSimples = (): BacktestResult => {
      let balance = initialBankroll;
      let winCount = 0;
      let lossCount = 0;
      let currWins = 0, maxWins = 0;
      let currLoss = 0, maxLoss = 0;
      let peak = initialBankroll;
      let maxDD = 0;
      let totalWagered = 0;
      let post100WinCount = 0;
      let post100LossCount = 0;
      let post100Profit = 0;
      let post100EvaluatedSpins = 0;
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      sortedSpins.forEach((spin, idx) => {
        const spinIndex = idx + 1;
        if (idx < 2) {
          history.push({ spinIndex, balance });
          return;
        }

        const historySlice = sortedSpins.slice(Math.max(0, idx - 10), idx);
        const lastSpinNumber = historySlice[historySlice.length - 1].numero;
        const lastTerminal = lastSpinNumber % 10;
        
        const targetNumbersSet = new Set<number>([0]);
        const targetTerminal1 = lastTerminal;
        const targetTerminal2 = (lastTerminal + 7) % 10;

        for (let n = 1; n <= 36; n++) {
          const t = n % 10;
          if (t === targetTerminal1 || t === targetTerminal2) {
            targetNumbersSet.add(n);
          }
        }

        const wIdx = EUROPEAN_WHEEL_ORDER.indexOf(lastSpinNumber);
        if (wIdx !== -1) {
          const prevWheel = EUROPEAN_WHEEL_ORDER[(wIdx - 1 + 37) % 37];
          const nextWheel = EUROPEAN_WHEEL_ORDER[(wIdx + 1) % 37];
          targetNumbersSet.add(prevWheel);
          targetNumbersSet.add(nextWheel);
        }

        const simpleTargetNumbers = Array.from(targetNumbersSet);
        const chipVal = Math.max(0.5, unitBet / simpleTargetNumbers.length);
        const cost = simpleTargetNumbers.length * chipVal;
        totalWagered += cost;

        const isHit = simpleTargetNumbers.includes(spin.numero);
        if (isHit) {
          const payout = 36 * chipVal;
          const profit = payout - cost;
          balance += profit;
          winCount++;
          currWins++;
          currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
          if (spinIndex > 100) {
            post100WinCount++;
            post100Profit += profit;
            post100EvaluatedSpins++;
          }
        } else {
          balance -= cost;
          lossCount++;
          currLoss++;
          currWins = 0;
          if (currLoss > maxLoss) maxLoss = currLoss;
          if (spinIndex > 100) {
            post100LossCount++;
            post100Profit -= cost;
            post100EvaluatedSpins++;
          }
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex, balance });
      });

      const netProfit = balance - initialBankroll;
      const evaluatedSpins = winCount + lossCount;

      return {
        id: 'estrategia_simples',
        name: 'Estratégia Simples na Roleta Online',
        category: 'Terminais & Padrões',
        authorOrigin: 'Estratégia Simples na Roleta Online (Linha do Tempo & Vizinhos de Roda)',
        description: 'Análise cirúrgica da linha do tempo da roleta. Mapeia repetições de terminais e vizinhos camuflados no cilindro (ex: 33 pro 0, 1 pro 3) para jogadas de tiro rápido e acerto de primeira.',
        coveragePct: 24.3,
        riskLevel: 'Baixo',
        initialBalance: initialBankroll,
        finalBalance: balance,
        netProfit,
        roiPct: totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0,
        winCount,
        lossCount,
        winRatePct: evaluatedSpins > 0 ? (winCount / evaluatedSpins) * 100 : 0,
        post100WinCount,
        post100LossCount,
        post100Profit,
        post100EvaluatedSpins,
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
        currentSeqType: currWins > 0 ? 'GREEN' : currLoss > 0 ? 'RED' : null,
        currentSeqCount: currWins > 0 ? currWins : currLoss > 0 ? currLoss : 0,
        howToApply: [
          'Acompanhe a linha do tempo e identifique padrões de espelhamento ou vizinhos de roda camuflados (ex: 33 no lugar do 0, 1 no lugar do 3).',
          'Faça a jogada cirúrgica de tiro rápido cobrindo o terminal alvo (ex: 8) com 1 vizinho de cada lado no cilindro + terminal secundário (ex: 5).',
          'Adicione sempre 1 ficha de proteção obrigatória no número Zero (0).',
          'Objetivo: buscar acerto de primeira (Green de tiro limpo) e sair da mesa sem expor a banca.'
        ]
      };
    };

    // --- 12. STRATEGY: DIRTY DONE CHEAP ---
    const runDirtyDoneCheap = (): BacktestResult => {
      let balance = initialBankroll;
      let winCount = 0;
      let lossCount = 0;
      let currWins = 0, maxWins = 0;
      let currLoss = 0, maxLoss = 0;
      let peak = initialBankroll;
      let maxDD = 0;
      let totalWagered = 0;
      let post100WinCount = 0;
      let post100LossCount = 0;
      let post100Profit = 0;
      let post100EvaluatedSpins = 0;
      let ddcPhase = 1;
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      sortedSpins.forEach((spin, idx) => {
        const spinIndex = idx + 1;
        let bet1 = unitBet * 2;
        let bet2 = unitBet * 3;
        if (ddcPhase === 2) { bet1 = unitBet * 4; bet2 = unitBet * 5; }
        else if (ddcPhase === 3) { bet1 = unitBet * 6; bet2 = unitBet * 6; }
        else if (ddcPhase === 4) { bet1 = unitBet * 5; bet2 = unitBet * 10; }

        const cost = bet1 + bet2;
        totalWagered += cost;

        if (spin.dozen === '1a') {
          const payout = bet1 * 3;
          const profit = payout - cost;
          balance += profit;
          winCount++; currWins++; currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
          if (spinIndex > 100) { post100WinCount++; post100Profit += profit; post100EvaluatedSpins++; }
          if (ddcPhase === 1) ddcPhase = 1;
          else if (ddcPhase === 2) ddcPhase = 3;
          else if (ddcPhase === 3) ddcPhase = 1;
          else if (ddcPhase === 4) ddcPhase = 1;
        } else if (spin.dozen === '2a') {
          const payout = bet2 * 3;
          const profit = payout - cost;
          balance += profit;
          winCount++; currWins++; currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
          if (spinIndex > 100) { post100WinCount++; post100Profit += profit; post100EvaluatedSpins++; }
          if (ddcPhase === 1) ddcPhase = 2;
          else if (ddcPhase === 2) ddcPhase = 4;
          else if (ddcPhase === 3) ddcPhase = 1;
          else if (ddcPhase === 4) ddcPhase = 1;
        } else {
          balance -= cost;
          lossCount++; currLoss++; currWins = 0;
          if (currLoss > maxLoss) maxLoss = currLoss;
          if (spinIndex > 100) { post100LossCount++; post100Profit -= cost; post100EvaluatedSpins++; }
          ddcPhase = 1;
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex, balance });
      });

      const netProfit = balance - initialBankroll;
      const evaluatedSpins = winCount + lossCount;

      return {
        id: 'dirty_done_cheap',
        name: 'Estratégia Dirty Done Cheap',
        category: 'Cobertura Alta',
        authorOrigin: 'Dirty Done Cheap (Progressão por Fases em 2 Dúzias)',
        description: 'Sistema progressivo dividido em 4 fases cobrindo 2 dúzias com ajustes proporcionais e regras rígidas de avanço/recuo ao saldo base.',
        coveragePct: 64.8,
        riskLevel: 'Médio',
        initialBalance: initialBankroll,
        finalBalance: balance,
        netProfit,
        roiPct: totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0,
        winCount,
        lossCount,
        winRatePct: evaluatedSpins > 0 ? (winCount / evaluatedSpins) * 100 : 0,
        post100WinCount,
        post100LossCount,
        post100Profit,
        post100EvaluatedSpins,
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
        currentSeqType: currWins > 0 ? 'GREEN' : currLoss > 0 ? 'RED' : null,
        currentSeqCount: currWins > 0 ? currWins : currLoss > 0 ? currLoss : 0,
        howToApply: [
          'Fase 1: Aposta 10€ na 1ª Dúzia e 15€ na 2ª Dúzia.',
          'Se a 1ª dúzia vencer, mantenha a Fase 1. Se a 2ª dúzia vencer, avança para a Fase 2.',
          'Fase 2 (20€ / 25€): Se a 1ª dúzia vencer vai para Fase 3. Se a 2ª dúzia vencer vai direto para Fase 4.',
          'Fase 3 (30€ / 30€) e Fase 4 (25€ / 50€): Em caso de vitória, retorne à aposta inicial de Fase 1.'
        ]
      };
    };

    // --- 13. STRATEGY: HOPSCOTCH PRO MAX ---
    const runHopscotchProMax = (): BacktestResult => {
      let balance = initialBankroll;
      let winCount = 0;
      let lossCount = 0;
      let currWins = 0, maxWins = 0;
      let currLoss = 0, maxLoss = 0;
      let peak = initialBankroll;
      let maxDD = 0;
      let totalWagered = 0;
      let post100WinCount = 0;
      let post100LossCount = 0;
      let post100Profit = 0;
      let post100EvaluatedSpins = 0;
      let hsPhase = 1;
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      sortedSpins.forEach((spin, idx) => {
        const spinIndex = idx + 1;
        if (hsPhase === 1) {
          const cost = unitBet * 4;
          totalWagered += cost;
          if (spin.color === 'black') {
            const profit = cost;
            balance += profit;
            winCount++; currWins++; currLoss = 0;
            if (currWins > maxWins) maxWins = currWins;
            if (spinIndex > 100) { post100WinCount++; post100Profit += profit; post100EvaluatedSpins++; }
            hsPhase = 2;
          } else {
            balance -= cost;
            lossCount++; currLoss++; currWins = 0;
            if (currLoss > maxLoss) maxLoss = currLoss;
            if (spinIndex > 100) { post100LossCount++; post100Profit -= cost; post100EvaluatedSpins++; }
          }
        } else if (hsPhase === 2) {
          const cost = unitBet * 8;
          totalWagered += cost;
          if (spin.dozen === '1a' || spin.dozen === '2a') {
            const profit = (unitBet * 4 * 3) - cost;
            balance += profit;
            winCount++; currWins++; currLoss = 0;
            if (currWins > maxWins) maxWins = currWins;
            if (spinIndex > 100) { post100WinCount++; post100Profit += profit; post100EvaluatedSpins++; }
            hsPhase = 3;
          } else {
            balance -= cost;
            lossCount++; currLoss++; currWins = 0;
            if (currLoss > maxLoss) maxLoss = currLoss;
            if (spinIndex > 100) { post100LossCount++; post100Profit -= cost; post100EvaluatedSpins++; }
            hsPhase = 1;
          }
        } else {
          const cost = unitBet * 12;
          totalWagered += cost;
          if (spin.dozen === '1a' || spin.dozen === '2a') {
            const profit = (unitBet * 6 * 3) - cost;
            balance += profit;
            winCount++; currWins++; currLoss = 0;
            if (currWins > maxWins) maxWins = currWins;
            if (spinIndex > 100) { post100WinCount++; post100Profit += profit; post100EvaluatedSpins++; }
            hsPhase = 1;
          } else {
            balance -= cost;
            lossCount++; currLoss++; currWins = 0;
            if (currLoss > maxLoss) maxLoss = currLoss;
            if (spinIndex > 100) { post100LossCount++; post100Profit -= cost; post100EvaluatedSpins++; }
            hsPhase = 1;
          }
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex, balance });
      });

      const netProfit = balance - initialBankroll;
      const evaluatedSpins = winCount + lossCount;

      return {
        id: 'hopscotch_pro_max',
        name: 'Estratégia Hopscotch Pro Max',
        category: 'Chances Simples',
        authorOrigin: 'Hopscotch Pro Max (Transição 1:1 para Dúzias)',
        description: 'Começa em apostas externas de menor risco (1:1 no Preto/Vermelho) e ao vencer reinveste o lucro em 2 dúzias nas fases 2 e 3.',
        coveragePct: 64.8,
        riskLevel: 'Baixo',
        initialBalance: initialBankroll,
        finalBalance: balance,
        netProfit,
        roiPct: totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0,
        winCount,
        lossCount,
        winRatePct: evaluatedSpins > 0 ? (winCount / evaluatedSpins) * 100 : 0,
        post100WinCount,
        post100LossCount,
        post100Profit,
        post100EvaluatedSpins,
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
        currentSeqType: currWins > 0 ? 'GREEN' : currLoss > 0 ? 'RED' : null,
        currentSeqCount: currWins > 0 ? currWins : currLoss > 0 ? currLoss : 0,
        howToApply: [
          'Fase 1: Aposta 20€ no Preto (ou Vermelho/Par/Ímpar). Se vencer, passa para a Fase 2.',
          'Fase 2: Divide os 40€ de ganho em 20€ na 1ª Dúzia e 20€ na 2ª Dúzia.',
          'Fase 3: Se vencer a Fase 2, divide o lucro em 30€ na 1ª Dúzia e 30€ na 2ª Dúzia.',
          'Ao vencer a Fase 3 ou em caso de qualquer perda, retorne ao início (Fase 1).'
        ]
      };
    };

    // --- 14. STRATEGY: SPLIT ON THE CORNERS ---
    const runSplitOnCorners = (): BacktestResult => {
      let balance = initialBankroll;
      let winCount = 0;
      let lossCount = 0;
      let currWins = 0, maxWins = 0;
      let currLoss = 0, maxLoss = 0;
      let peak = initialBankroll;
      let maxDD = 0;
      let totalWagered = 0;
      let post100WinCount = 0;
      let post100LossCount = 0;
      let post100Profit = 0;
      let post100EvaluatedSpins = 0;

      const cornerNums = new Set([2,3,5,6, 8,9,11,12, 14,15,17,18, 20,21,23,24, 26,27,29,30]);
      const splitNums = new Set([1,4, 10,13, 31,34, 32,33, 35,36]);
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      sortedSpins.forEach((spin, idx) => {
        const spinIndex = idx + 1;
        const cornerStake = unitBet * 5;
        const splitStake = unitBet * 2;
        const cost = (cornerStake * 5) + (splitStake * 5);
        totalWagered += cost;

        let payout = 0;
        if (cornerNums.has(spin.numero)) {
          payout += cornerStake * 9;
        }
        if (splitNums.has(spin.numero)) {
          payout += splitStake * 18;
        }

        if (payout > 0) {
          const profit = payout - cost;
          balance += profit;
          winCount++; currWins++; currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
          if (spinIndex > 100) { post100WinCount++; post100Profit += profit; post100EvaluatedSpins++; }
        } else {
          balance -= cost;
          lossCount++; currLoss++; currWins = 0;
          if (currLoss > maxLoss) maxLoss = currLoss;
          if (spinIndex > 100) { post100LossCount++; post100Profit -= cost; post100EvaluatedSpins++; }
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex, balance });
      });

      const netProfit = balance - initialBankroll;
      const evaluatedSpins = winCount + lossCount;

      return {
        id: 'split_on_corners',
        name: 'Estratégia Split on the Corners',
        category: 'Cobertura Alta',
        authorOrigin: 'Split on the Corners (5 Cantos + 5 Splits)',
        description: 'Sistema não progressivo de altíssima cobertura (81.1% da mesa / 30 números) com 5 cantos e 5 splits sem alterar valores por rodada.',
        coveragePct: 81.1,
        riskLevel: 'Baixo',
        initialBalance: initialBankroll,
        finalBalance: balance,
        netProfit,
        roiPct: totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0,
        winCount,
        lossCount,
        winRatePct: evaluatedSpins > 0 ? (winCount / evaluatedSpins) * 100 : 0,
        post100WinCount,
        post100LossCount,
        post100Profit,
        post100EvaluatedSpins,
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
        currentSeqType: currWins > 0 ? 'GREEN' : currLoss > 0 ? 'RED' : null,
        currentSeqCount: currWins > 0 ? currWins : currLoss > 0 ? currLoss : 0,
        howToApply: [
          'Coloque 5 apostas em cantos (ex: 25€): 2-3-5-6, 8-9-11-12, 14-15-17-18, 20-21-23-24 e 26-27-29-30.',
          'Coloque 5 apostas em splits (ex: 10€): 1-4, 10-13, 31-34, 32-33 e 35-36.',
          'Cobre 30 números no total (81.1% da mesa). Vitória no canto paga +50€ e no split paga +5€.',
          'Mantenha o valor das apostas fixo sem progressão de perdas.'
        ]
      };
    };

    const results = [
      runEstrategiaSimples(),
      runDirtyDoneCheap(),
      runHopscotchProMax(),
      runSplitOnCorners(),
      runMartingaleProfissional(),
      runGugaTV(),
      runTerminalSequenceChart(),
      runRomanosky(),
      runTwoDozens(),
      runNeighborsAlert(),
      runColdCycle(),
      runJamesBond(),
      runVoisins(),
      runDAlembert()
    ];

    // Sort by netProfit descending to highlight the most lucrative
    return results.sort((a, b) => b.netProfit - a.netProfit);
  }, [spins, initialBankroll, unitBet]);

  // Selected Strategy object
  const selectedStrategy = useMemo(() => {
    return backtestResults.find(r => r.id === selectedStrategyId) || backtestResults[0];
  }, [backtestResults, selectedStrategyId]);

  // Filtered List
  const filteredResults = useMemo(() => {
    return backtestResults.filter(r => {
      const categoryMatch = filterCategory === 'all' || r.category === filterCategory;
      const isDisabled = disabledStrategies.includes(r.id);
      if (statusFilter === 'enabled' && isDisabled) return false;
      if (statusFilter === 'disabled' && !isDisabled) return false;
      return categoryMatch;
    });
  }, [backtestResults, filterCategory, statusFilter, disabledStrategies]);

  const enabledCount = useMemo(() => {
    return backtestResults.filter(r => !disabledStrategies.includes(r.id)).length;
  }, [backtestResults, disabledStrategies]);

  const disabledCount = useMemo(() => {
    return backtestResults.filter(r => disabledStrategies.includes(r.id)).length;
  }, [backtestResults, disabledStrategies]);

  const championStrategy = useMemo(() => {
    if (backtestResults.length === 0) return null;
    const enabledCandidates = backtestResults.filter(r => !disabledStrategies.includes(r.id));
    return enabledCandidates.length > 0 ? enabledCandidates[0] : backtestResults[0];
  }, [backtestResults, disabledStrategies]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner Top - Champion Strategy Announcement */}
      <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-emerald-500/20 border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-full flex items-center gap-1 shadow-md">
                <Trophy className="w-3.5 h-3.5" /> Campeã nos Seus {spins.length} Giros
              </span>
              <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg border border-slate-700">
                Backtest Realizado
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-300 text-xs font-bold rounded-lg border border-emerald-500/40">
                {enabledCount} Habilitadas | {disabledCount} Desativadas
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Estratégia Mais Lucrativa: <span className="bg-gradient-to-r from-amber-300 via-amber-100 to-emerald-400 bg-clip-text text-transparent">{championStrategy?.name}</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Analisamos as <strong>{spins.length} rodadas</strong> fornecidas simulando as estratégias ativas. A estratégia vencedora alcançou um lucro líquido de <strong className="text-emerald-400">{config.currency} {championStrategy?.netProfit.toFixed(2)}</strong> com taxa de acerto de <strong className="text-amber-400">{championStrategy?.winRatePct.toFixed(1)}%</strong>!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => generateStrategyPDF(config)}
              className="px-5 py-4 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/40 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 shrink-0 hover:scale-[1.02]"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Baixar PDF (Imprimir Guia)</span>
            </button>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center shrink-0 min-w-[140px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Lucro Simulado</span>
              <span className={`text-xl font-black ${championStrategy && championStrategy.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {championStrategy && championStrategy.netProfit >= 0 ? '+' : ''}{config.currency} {championStrategy?.netProfit.toFixed(2)}
              </span>
            </div>

            {onApplyStrategy && championStrategy && (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => onApplyStrategy('🤖 [AUTO] Seleção Automática (Maior Retorno Financeiro)')}
                  className="px-4 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 shrink-0 hover:scale-[1.02]"
                  title="Ativar Robô para escolher automaticamente a estratégia de maior retorno financeiro"
                >
                  <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Ativar Seleção Automática</span>
                </button>

                <button
                  onClick={() => onApplyStrategy(championStrategy.name)}
                  className="px-5 py-4 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 shrink-0 hover:scale-[1.02]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Fixar {championStrategy.name.split(' ')[0]}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Enable/Disable Quick Bar */}
      <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Status Filter Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>Status:</span>
            </span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                statusFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Todas ({backtestResults.length})
            </button>
            <button
              onClick={() => setStatusFilter('enabled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border flex items-center gap-1.5 ${
                statusFilter === 'enabled'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                  : 'bg-slate-900 text-emerald-400 border-slate-800 hover:bg-slate-850'
              }`}
            >
              <ToggleRight className="w-4 h-4" />
              <span>Habilitadas ({enabledCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('disabled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border flex items-center gap-1.5 ${
                statusFilter === 'disabled'
                  ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-md'
                  : 'bg-slate-900 text-rose-400 border-slate-800 hover:bg-slate-850'
              }`}
            >
              <ToggleLeft className="w-4 h-4" />
              <span>Desativadas ({disabledCount})</span>
            </button>
          </div>

          {/* Quick Bulk Action Buttons */}
          {onToggleAllStrategies && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleAllStrategies(true)}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Habilitar Todas</span>
              </button>
              <button
                onClick={() => onToggleAllStrategies(false)}
                className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm"
              >
                <Ban className="w-3.5 h-3.5 text-rose-400" />
                <span>Desabilitar Todas</span>
              </button>
            </div>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-800/80 pt-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-1">Categoria:</span>
            {[
              { id: 'all', label: 'Todas Categorias' },
              { id: 'Frequência / Ciclo', label: 'Frequência & Ciclo' },
              { id: 'Cobertura Alta', label: 'Alta Cobertura (60%+)' },
              { id: 'Chances Simples', label: 'Chances Simples' },
              { id: 'Setor Físico (Roda)', label: 'Setor do Cilindro' },
              { id: 'Terminais & Padrões', label: 'Terminais & Gráfico' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  filterCategory === cat.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-amber-400" />
            <span>Salvo no LocalStorage (Permanece travado após F5)</span>
          </div>
        </div>
      </div>

      {/* Grid of Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResults.map((strat, idx) => {
          const isSelected = strat.id === selectedStrategyId;
          const isChampion = strat.id === championStrategy?.id;
          const isDisabled = disabledStrategies.includes(strat.id);

          return (
            <div
              key={strat.id}
              onClick={() => setSelectedStrategyId(strat.id)}
              className={`cursor-pointer rounded-2xl p-5 border transition-all space-y-4 relative overflow-hidden ${
                isDisabled
                  ? 'bg-slate-950/80 border-slate-800/80 opacity-80 hover:opacity-100 hover:border-slate-700'
                  : isSelected
                  ? 'bg-slate-900 border-amber-500 ring-2 ring-amber-500/20 shadow-2xl scale-[1.01]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {/* Champion Badge */}
              {isChampion && !isDisabled && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 px-3 py-1 rounded-bl-xl font-black text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                  <Award className="w-3 h-3" /> #1 Mais Lucrativa
                </div>
              )}

              {/* Header Info & Enable/Disable Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 inline-block">
                      {strat.category}
                    </span>
                    {isDisabled ? (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/50">
                        ⛔ Desativada
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50">
                        ✓ Ativa
                      </span>
                    )}
                  </div>

                  {/* Toggle Selector Button (Locked in LocalStorage across F5) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleStrategy) onToggleStrategy(strat.id);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all flex items-center gap-1 shrink-0 ${
                      isDisabled
                        ? 'bg-rose-950/90 text-rose-300 border-rose-500/50 hover:bg-rose-900'
                        : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
                    }`}
                    title={isDisabled ? 'Estratégia DESATIVADA (Trava no F5). Clique para Habilitar.' : 'Estratégia HABILITADA (Trava no F5). Clique para Desativar.'}
                  >
                    {isDisabled ? (
                      <>
                        <ToggleLeft className="w-4 h-4 text-rose-400" />
                        <span>Habilitar</span>
                      </>
                    ) : (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                        <span>Desativar</span>
                      </>
                    )}
                  </button>
                </div>

                <h3 className={`text-base font-extrabold leading-snug ${isDisabled ? 'text-slate-400 line-through' : 'text-slate-100'}`}>
                  {strat.name}
                </h3>
              </div>

              {/* Metrics Box with Dual Balances and Green/Red Counts */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-2.5">
                {/* 1. Saldo Geral & Placar Geral */}
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Saldo Geral (Total)
                    </span>
                    <span className={`text-base font-black ${strat.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {strat.netProfit >= 0 ? '+' : ''}{config.currency} {strat.netProfit.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Placar Geral
                      </span>
                      {strat.currentSeqType && strat.currentSeqCount > 0 && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                          strat.currentSeqType === 'GREEN'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                            : 'bg-rose-950 text-rose-300 border-rose-500/50'
                        }`}>
                          Seq: {strat.currentSeqCount}x {strat.currentSeqType}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-black flex items-center gap-1.5 justify-end mt-0.5">
                      <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        {strat.winCount} Green
                      </span>
                      <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                        {strat.lossCount} Red
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Saldo Pós-100 Giros & Placar Pós-100 */}
                <div className="flex items-center justify-between pt-0.5">
                  <div>
                    <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block flex items-center gap-1">
                      <span>⚡ Saldo Pós-100 Giros</span>
                    </span>
                    {spins.length > 100 ? (
                      <span className={`text-sm font-black ${strat.post100Profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {strat.post100Profit >= 0 ? '+' : ''}{config.currency} {strat.post100Profit.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-500 italic">
                        {spins.length}/100 rodadas
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      Placar Pós-100
                    </span>
                    {spins.length > 100 ? (
                      <div className="text-xs font-black flex items-center gap-1.5 justify-end mt-0.5">
                        <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {strat.post100WinCount} Green
                        </span>
                        <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                          {strat.post100LossCount} Red
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">
                        Aguardando &gt;100 giros
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Secondary Stats */}
                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800/60 text-center">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Acerto</span>
                    <span className="text-xs font-black text-amber-400">{strat.winRatePct.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Cobertura</span>
                    <span className="text-xs font-bold text-slate-300">{strat.coveragePct}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Risco</span>
                    <span className={`text-xs font-bold ${
                      strat.riskLevel === 'Baixo' ? 'text-emerald-400' : strat.riskLevel === 'Médio' ? 'text-amber-400' : 'text-rose-400'
                    }`}>{strat.riskLevel}</span>
                  </div>
                </div>
              </div>

              {/* Description Snippet */}
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {strat.description}
              </p>

              {/* Action Link */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-extrabold">
                <span className={isSelected ? 'text-amber-400 flex items-center gap-1' : 'text-slate-400'}>
                  {isSelected ? '✓ Selecionada para Análise' : 'Clique para Detalhar'}
                </span>
                <ArrowRight className={`w-4 h-4 transition-transform ${isSelected ? 'translate-x-1 text-amber-400' : 'text-slate-500'}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Inspection Card for Selected Strategy */}
      {selectedStrategy && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <BarChart3 className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                    Análise Detalhada da Estratégia
                  </span>
                  <h3 className="text-xl font-black text-slate-100">
                    {selectedStrategy.name}
                  </h3>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Origem: <strong>{selectedStrategy.authorOrigin}</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">ROI Simulado</span>
                <span className={`text-base font-black ${selectedStrategy.roiPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedStrategy.roiPct >= 0 ? '+' : ''}{selectedStrategy.roiPct.toFixed(1)}%
                </span>
              </div>
              <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Maior Sequência Vitória</span>
                <span className="text-base font-black text-amber-400">
                  {selectedStrategy.maxConsecutiveWins} Giros
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Performance Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-1">
              <span className="text-xs font-bold text-slate-400 block uppercase">Placar Geral (Giro 1 ao {spins.length})</span>
              <div className="text-base font-black text-slate-100 flex items-center gap-1.5 pt-0.5">
                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{selectedStrategy.winCount} Green</span>
                <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">{selectedStrategy.lossCount} Red</span>
              </div>
              <span className={`text-xs font-extrabold block pt-1 ${selectedStrategy.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                Saldo Geral: {selectedStrategy.netProfit >= 0 ? '+' : ''}{config.currency} {selectedStrategy.netProfit.toFixed(2)}
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 space-y-1">
              <span className="text-xs font-bold text-amber-400 block uppercase">⚡ Placar Pós-100 Rodadas</span>
              {spins.length > 100 ? (
                <>
                  <div className="text-base font-black text-slate-100 flex items-center gap-1.5 pt-0.5">
                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{selectedStrategy.post100WinCount} Green</span>
                    <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">{selectedStrategy.post100LossCount} Red</span>
                  </div>
                  <span className={`text-xs font-extrabold block pt-1 ${selectedStrategy.post100Profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Saldo Pós-100: {selectedStrategy.post100Profit >= 0 ? '+' : ''}{config.currency} {selectedStrategy.post100Profit.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-xs font-bold text-slate-500 block pt-1 italic">
                  Requer mais de 100 giros ({spins.length}/100)
                </span>
              )}
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-xs font-bold text-slate-400 block uppercase">Maior Sequência Negativa</span>
              <span className="text-lg font-black text-rose-400 mt-1 block">
                {selectedStrategy.maxConsecutiveLosses} Derrotas
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-xs font-bold text-slate-400 block uppercase">Rebaixamento Máximo (Drawdown)</span>
              <span className="text-lg font-black text-amber-400 mt-1 block">
                {config.currency} {selectedStrategy.maxDrawdown.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Visual Performance Progression Bar */}
          <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">Progressão da Banca durante as {spins.length} Rodadas:</span>
              <span className="text-emerald-400 font-extrabold">
                {selectedStrategy.netProfit >= 0 ? '+' : ''}{config.currency} {selectedStrategy.netProfit.toFixed(2)}
              </span>
            </div>
            {/* Simple sparkline visualization */}
            <div className="h-16 flex items-end gap-1 pt-2">
              {selectedStrategy.historyChartData.slice(-60).map((pt, idx) => {
                const minB = Math.min(...selectedStrategy.historyChartData.map(h => h.balance));
                const maxB = Math.max(...selectedStrategy.historyChartData.map(h => h.balance));
                const range = maxB - minB || 1;
                const pct = Math.max(10, Math.min(100, ((pt.balance - minB) / range) * 100));
                const isUp = idx === 0 || pt.balance >= selectedStrategy.historyChartData[idx - 1]?.balance;

                return (
                  <div
                    key={idx}
                    style={{ height: `${pct}%` }}
                    className={`flex-1 rounded-t transition-all ${
                      isUp ? 'bg-emerald-500/80 hover:bg-emerald-400' : 'bg-rose-500/80 hover:bg-rose-400'
                    }`}
                    title={`Giro ${pt.spinIndex}: ${config.currency} ${pt.balance.toFixed(2)}`}
                  />
                );
              })}
            </div>
          </div>

          {/* How To Apply Step-by-Step Guide */}
          <div className="space-y-3 bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
            <button
              onClick={() => setExpandedHowTo(!expandedHowTo)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <Dices className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                  Como Aplicar a {selectedStrategy.name} Passo a Passo na Mesa
                </h4>
              </div>
              {expandedHowTo ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>

            {expandedHowTo && (
              <ol className="space-y-2 pt-2 border-t border-slate-800/80">
                {selectedStrategy.howToApply.map((step, sIdx) => (
                  <li key={sIdx} className="flex items-start gap-3 text-xs text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-[11px] shrink-0 mt-0.5">
                      {sIdx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
