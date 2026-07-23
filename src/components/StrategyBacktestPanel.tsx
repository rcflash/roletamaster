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
  FileText
} from 'lucide-react';
import { SpinRecord, BankrollConfig } from '../types';
import { generateStrategyPDF } from '../utils/pdfStrategyGenerator';

interface StrategyBacktestPanelProps {
  spins: SpinRecord[];
  config: BankrollConfig;
  onApplyStrategy?: (strategyName: string) => void;
}

export interface BacktestResult {
  id: string;
  name: string;
  category: 'Frequência / Ciclo' | 'Cobertura Alta' | 'Chances Simples' | 'Setor Físico (Roda)';
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
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  maxDrawdown: number;
  historyChartData: { spinIndex: number; balance: number }[];
  howToApply: string[];
}

const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const VOISINS_NUMBERS = new Set([22, 18, 29, 7, 28, 12, 35, 3, 26, 0, 32, 15, 19, 4, 21, 2, 25]);

export const StrategyBacktestPanel: React.FC<StrategyBacktestPanelProps> = ({
  spins,
  config,
  onApplyStrategy,
}) => {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('romanosky');
  const [filterCategory, setFilterCategory] = useState<string>('all');
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
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      const totalBetPerSpin = 8 * unitBet;
      const romanoskyNumbers = new Set([
        ...Array.from({ length: 24 }, (_, i) => i + 1), // 1..24
        25, 26, 28, 29, 32, 33, 35, 36
      ]);

      sortedSpins.forEach((spin, idx) => {
        const win = romanoskyNumbers.has(spin.numero);
        if (win) {
          const payout = 9 * unitBet;
          balance += (payout - totalBetPerSpin); // +1 unit
          winCount++;
          currWins++;
          currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
        } else {
          balance -= totalBetPerSpin; // -8 units
          lossCount++;
          currLoss++;
          currWins = 0;
          if (currLoss > maxLoss) maxLoss = currLoss;
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex: idx + 1, balance });
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
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
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
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      const LOOKBACK = 25;

      sortedSpins.forEach((spin, idx) => {
        if (idx < 15) {
          // Warmup phase
          history.push({ spinIndex: idx + 1, balance });
          return;
        }

        const recentSlice = sortedSpins.slice(Math.max(0, idx - LOOKBACK), idx);
        const seenNumbers = new Set(recentSlice.map(s => s.numero));
        const unseenNumbers: number[] = [];
        for (let n = 0; n <= 36; n++) {
          if (!seenNumbers.has(n)) unseenNumbers.push(n);
        }

        if (unseenNumbers.length === 0) {
          history.push({ spinIndex: idx + 1, balance });
          return;
        }

        const betPerNumber = unitBet;
        const totalBet = unseenNumbers.length * betPerNumber;
        totalWagered += totalBet;

        if (unseenNumbers.includes(spin.numero)) {
          const payout = 36 * betPerNumber;
          balance += (payout - totalBet);
          winCount++;
          currWins++;
          currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
        } else {
          balance -= totalBet;
          lossCount++;
          currLoss++;
          currWins = 0;
          if (currLoss > maxLoss) maxLoss = currLoss;
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex: idx + 1, balance });
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
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
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
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      sortedSpins.forEach((spin, idx) => {
        if (idx < 10) {
          history.push({ spinIndex: idx + 1, balance });
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
          balance += (3 * unitBet - totalBet); // +1 unit
          winCount++;
          currWins++;
          currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
        } else {
          balance -= totalBet; // -2 units
          lossCount++;
          currLoss++;
          currWins = 0;
          if (currLoss > maxLoss) maxLoss = currLoss;
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex: idx + 1, balance });
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
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
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
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      sortedSpins.forEach((spin, idx) => {
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
        } else {
          balance -= betAmount;
          lossCount++;
          currLoss++;
          currWins = 0;
          if (currLoss > maxLoss) maxLoss = currLoss;
          betUnits += 1;
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex: idx + 1, balance });
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
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
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
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      const totalBet = 20 * unitBet;

      sortedSpins.forEach((spin, idx) => {
        totalWagered += totalBet;
        const num = spin.numero;

        if (num >= 19 && num <= 36) {
          // High bet wins (14 units on High pays 1:1 -> 28 units total payout) -> Net +8 units
          balance += (8 * unitBet);
          winCount++;
          currWins++;
          currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
        } else if (num >= 13 && num <= 18) {
          // Six Line bet wins (5 units pays 5:1 -> 30 units total payout) -> Net +10 units
          balance += (10 * unitBet);
          winCount++;
          currWins++;
          currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
        } else if (num === 0) {
          // Zero bet wins (1 unit pays 35:1 -> 36 units total payout) -> Net +16 units
          balance += (16 * unitBet);
          winCount++;
          currWins++;
          currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
        } else {
          // Losses on 1..12 -> Lose 20 units
          balance -= totalBet;
          lossCount++;
          currLoss++;
          currWins = 0;
          if (currLoss > maxLoss) maxLoss = currLoss;
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex: idx + 1, balance });
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
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
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
      const history = [{ spinIndex: 0, balance: initialBankroll }];

      const totalBet = 9 * unitBet;

      sortedSpins.forEach((spin, idx) => {
        totalWagered += totalBet;

        if (VOISINS_NUMBERS.has(spin.numero)) {
          // Average payout for Voisins du Zero win is ~18 units (Net +9 units)
          balance += (9 * unitBet);
          winCount++;
          currWins++;
          currLoss = 0;
          if (currWins > maxWins) maxWins = currWins;
        } else {
          balance -= totalBet;
          lossCount++;
          currLoss++;
          currWins = 0;
          if (currLoss > maxLoss) maxLoss = currLoss;
        }

        if (balance > peak) peak = balance;
        const dd = peak - balance;
        if (dd > maxDD) maxDD = dd;

        history.push({ spinIndex: idx + 1, balance });
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
        maxConsecutiveWins: maxWins,
        maxConsecutiveLosses: maxLoss,
        maxDrawdown: maxDD,
        historyChartData: history,
        howToApply: [
          'No painel de apostas especiais (Racetrack/Pista) do cassino, selecione a opção "Voisins du Zéro" (Vizinhos do Zero).',
          `Com um orçamento de R$ 10,00 por giro, são distribuídas 9 fichas de ~R$ 1,10 cobrindo os 17 números ao redor do Zero.`,
          'Aposta ideal para quando a análise térmica indicar que o setor superior da roleta está quente.'
        ]
      };
    };

    const results = [
      runColdCycle(),
      runRomanosky(),
      runTwoDozens(),
      runDAlembert(),
      runJamesBond(),
      runVoisins()
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
    if (filterCategory === 'all') return backtestResults;
    return backtestResults.filter(r => r.category === filterCategory);
  }, [backtestResults, filterCategory]);

  const championStrategy = backtestResults[0];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner Top - Champion Strategy Announcement */}
      <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-emerald-500/20 border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-full flex items-center gap-1 shadow-md">
                <Trophy className="w-3.5 h-3.5" /> Campeã nos Seus {spins.length} Giros
              </span>
              <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg border border-slate-700">
                Backtest Realizado
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Estratégia Mais Lucrativa: <span className="bg-gradient-to-r from-amber-300 via-amber-100 to-emerald-400 bg-clip-text text-transparent">{championStrategy?.name}</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Analisamos as <strong>{spins.length} rodadas</strong> fornecidas simulando as principais estratégias de apostadores profissionais. A estratégia vencedora alcançou um lucro líquido de <strong className="text-emerald-400">{config.currency} {championStrategy?.netProfit.toFixed(2)}</strong> com taxa de acerto de <strong className="text-amber-400">{championStrategy?.winRatePct.toFixed(1)}%</strong>!
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
              <span className={`text-xl font-black ${championStrategy?.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {championStrategy?.netProfit >= 0 ? '+' : ''}{config.currency} {championStrategy?.netProfit.toFixed(2)}
              </span>
            </div>

            {onApplyStrategy && championStrategy && (
              <button
                onClick={() => onApplyStrategy(championStrategy.name)}
                className="px-5 py-4 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 shrink-0 hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Usar Esta Estratégia no Robô</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-1">Filtrar por Tipo:</span>
          {[
            { id: 'all', label: 'Todas as Estratégias' },
            { id: 'Frequência / Ciclo', label: 'Frequência & Ciclo' },
            { id: 'Cobertura Alta', label: 'Alta Cobertura (60%+)' },
            { id: 'Chances Simples', label: 'Chances Simples' },
            { id: 'Setor Físico (Roda)', label: 'Setor do Cilindro' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                filterCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-amber-400" />
          <span>Estratégias Mapeadas da Web e Cassinos Profissionais</span>
        </div>
      </div>

      {/* Grid of Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResults.map((strat, idx) => {
          const isSelected = strat.id === selectedStrategyId;
          const isChampion = strat.id === championStrategy?.id;

          return (
            <div
              key={strat.id}
              onClick={() => setSelectedStrategyId(strat.id)}
              className={`cursor-pointer rounded-2xl p-5 border transition-all space-y-4 relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-900 border-amber-500 ring-2 ring-amber-500/20 shadow-2xl scale-[1.01]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {/* Champion Badge */}
              {isChampion && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 px-3 py-1 rounded-bl-xl font-black text-[9px] uppercase tracking-wider flex items-center gap-1 shadow-md">
                  <Award className="w-3 h-3" /> #1 Mais Lucrativa
                </div>
              )}

              {/* Header Info */}
              <div className="space-y-1 pr-16">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700 inline-block">
                  {strat.category}
                </span>
                <h3 className="text-base font-extrabold text-slate-100 leading-snug">
                  {strat.name}
                </h3>
              </div>

              {/* Metrics Box */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Lucro Simulado</span>
                  <span className={`text-base font-black ${strat.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {strat.netProfit >= 0 ? '+' : ''}{config.currency} {strat.netProfit.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Taxa de Acerto</span>
                  <span className="text-base font-black text-amber-400">
                    {strat.winRatePct.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Cobertura</span>
                  <span className="text-xs font-bold text-slate-300">
                    {strat.coveragePct}% da Mesa
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Nível de Risco</span>
                  <span className={`text-xs font-bold ${
                    strat.riskLevel === 'Baixo' ? 'text-emerald-400' : strat.riskLevel === 'Médio' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {strat.riskLevel}
                  </span>
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
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-xs font-bold text-slate-400 block uppercase">Vitórias / Derrotas</span>
              <span className="text-lg font-black text-slate-100">
                <span className="text-emerald-400">{selectedStrategy.winCount}V</span> / <span className="text-rose-400">{selectedStrategy.lossCount}D</span>
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-xs font-bold text-slate-400 block uppercase">Maior Sequência Negativa</span>
              <span className="text-lg font-black text-rose-400">
                {selectedStrategy.maxConsecutiveLosses} Derrotas
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-xs font-bold text-slate-400 block uppercase">Rebaixamento Máximo (Drawdown)</span>
              <span className="text-lg font-black text-amber-400">
                {config.currency} {selectedStrategy.maxDrawdown.toFixed(2)}
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-xs font-bold text-slate-400 block uppercase">Saldo Final Estimado</span>
              <span className={`text-lg font-black ${selectedStrategy.finalBalance >= initialBankroll ? 'text-emerald-400' : 'text-rose-400'}`}>
                {config.currency} {selectedStrategy.finalBalance.toFixed(2)}
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
