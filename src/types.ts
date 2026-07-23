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

export interface BankrollConfig {
  initialBankroll: number;
  dailyGoal: number;
  stopLossLimit: number;
  defaultSpinCost: number;
  currency: string;
  soundEnabled: boolean;
}

export interface StrategyConfig {
  activePreset: 'custom' | 'top5_hot' | 'cold_dozen' | 'cold_column' | 'red_black' | 'double_dozen';
  dozen1Bet: number;
  dozen2Bet: number;
  dozen3Bet: number;
  column1Bet: number;
  column2Bet: number;
  column3Bet: number;
  straightNumberBets: { [num: number]: number };
  colorRedBet: number;
  colorBlackBet: number;
}

export interface TempItem {
  name: string;
  code: string;
  frequencyPct: number;
  count: number;
  spinsWithoutHit: number;
  status: 'NORMAL' | 'HOT' | 'ALERT' | 'COLD';
  statusLabel: string;
}

export interface NumberStats {
  num: number;
  color: NumberColor;
  count: number;
  frequencyPct: number;
  spinsWithoutHit: number;
}
