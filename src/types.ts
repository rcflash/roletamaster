export type NumberColor = 'red' | 'black' | 'green';
export type DozenType = '1a' | '2a' | '3a' | 'zero';
export type ColumnType = 'col1' | 'col2' | 'col3' | 'zero';
export type ParityType = 'par' | 'impar' | 'zero';
export type HalfType = 'low' | 'high' | 'zero';

export interface SpinRecord {
  id: string;
  giro: number;
  numero: number;
  multiplier?: number;
  color: NumberColor;
  dozen: DozenType;
  column: ColumnType;
  parity: ParityType;
  half: HalfType;
  winAmount: number;
  lossAmount: number;
  netResult: number;
  accumulatedBalance: number;
  botLevel: string;
  nextBetSuggestion: string;
  cycleStatus: 'WIN' | 'LOSS' | 'NEUTRAL';
  timestamp: string;
}

export interface DailySessionRecord {
  id: string;
  date: string;
  initialBankroll: number;
  finalBankroll: number;
  netProfit: number;
  roiPct: number;
  totalSpins: number;
  winCount: number;
  lossCount?: number;
  greenCount?: number;
  redCount?: number;
  valuePerGreen?: number;
  valuePerRed?: number;
  goalMet: boolean;
  stopLossHit: boolean;
  notes?: string;
}

export interface SavedRouletteSession {
  id: string;
  title: string;
  date: string;
  timestamp: number;
  tableName?: string;
  strategyName?: string;
  initialBankroll: number;
  finalBankroll: number;
  netProfit: number;
  totalSpins: number;
  winCount: number;
  lossCount: number;
  winRatePct: number;
  spins: SpinRecord[];
  notes?: string;
}

export interface BankrollConfig {
  initialBankroll: number;
  dailyGoal: number;
  stopLossLimit: number;
  defaultSpinCost: number;
  currency: string;
  soundEnabled: boolean;
  enableWarmupPhase?: boolean;
}

export interface StrategyConfig {
  useBotRecommendation?: boolean;
  activePreset: 'custom' | 'top5_hot' | 'cold_dozen' | 'cold_column' | 'red_black' | 'double_dozen';
  activeStrategy?: string;
  neighborRadius?: 2 | 3 | 4 | 5 | 6 | 7;
  neighborChipValue?: number;
  tablePayoutMultiplier?: number;
  customWinReturn?: number;
  tablePayoutMode?: '36x' | '30x' | '1:1' | 'custom';
  dozen1Bet: number;
  dozen2Bet: number;
  dozen3Bet: number;
  column1Bet: number;
  column2Bet: number;
  column3Bet: number;
  straightNumberBets: { [num: number]: number };
  colorRedBet: number;
  colorBlackBet: number;
  initialZeroDelay?: number;
  manualZeroHistory?: number[];
  disabledStrategies?: string[];
}

export interface TempItem {
  name: string;
  code: string;
  frequencyPct: number;
  count: number;
  spinsWithoutHit: number;
  status: 'NORMAL' | 'HOT' | 'ALERT' | 'COLD';
  statusLabel: string;
  top3AbsenceStreaks: number[];
}

export interface NumberStats {
  num: number;
  color: NumberColor;
  count: number;
  frequencyPct: number;
  spinsWithoutHit: number;
}
