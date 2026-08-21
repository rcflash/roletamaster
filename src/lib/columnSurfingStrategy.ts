import { SpinRecord } from '../types';
import { getNumberColumn, getNumberColor } from './roulette';

export interface ColumnStats {
  col1Count: number;
  col2Count: number;
  col3Count: number;
  zeroCount: number;
  col1Pct: number;
  col2Pct: number;
  col3Pct: number;
  zeroPct: number;
  weakestCol: 'col1' | 'col2' | 'col3';
  dominantCols: ['col1' | 'col2' | 'col3', 'col1' | 'col2' | 'col3'];
  consecutiveWeakRepeats: number;
  maxWeakRepeatRecent: number;
}

export interface ColumnSurfingAlert {
  hasAlert: boolean;
  alertType: 'SURF_ACTIVE' | 'BREAKOUT_TRIGGER' | 'COOLING_OFF' | 'SEARCHING';
  dominantCols: ['col1' | 'col2' | 'col3', 'col1' | 'col2' | 'col3'];
  weakCol: 'col1' | 'col2' | 'col3';
  betColumns: ('col1' | 'col2' | 'col3')[];
  betNumbers: number[];
  recommendedTerminals: number[];
  hotRepeatNumbers: number[];
  confidencePct: number;
  reason: string;
  currentSurfStreak: number;
  isQuireraMode: boolean; // Após 4+ vitórias consecutivas no surfe, entrar com quirera
  lastSpin?: SpinRecord;
}

export interface VideoMoment {
  timestamp: string;
  seconds: number;
  title: string;
  speaker: string;
  description: string;
  actionTaken: string;
  spinsMentioned: number[];
  columnFocus: string;
  outcomeType: 'ANALYSIS' | 'TRIGGER' | 'GREEN' | 'RED' | 'QUIRERA' | 'LESSON';
  quote: string;
}

// Números de cada coluna na Roleta Europeia
export const COLUMN_NUMBERS: Record<'col1' | 'col2' | 'col3', number[]> = {
  col1: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  col2: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  col3: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36]
};

export const COLUMN_LABELS: Record<'col1' | 'col2' | 'col3' | 'zero', string> = {
  col1: '1ª Coluna (1..34)',
  col2: '2ª Coluna (2..35 - Meio)',
  col3: '3ª Coluna (3..36)',
  zero: 'Zero (0)'
};

// Histórico de giros extraído do momento real do vídeo
export const VIDEO_SPINS_SEQUENCE: { num: number; note: string; col: 'col1' | 'col2' | 'col3' | 'zero' }[] = [
  { num: 17, note: '2ª Coluna (Repetiu isolado)', col: 'col2' },
  { num: 32, note: '2ª Coluna (Linha de baixo)', col: 'col2' },
  { num: 5,  note: '2ª Coluna', col: 'col2' },
  { num: 17, note: '2ª Coluna (Quente na mesa)', col: 'col2' },
  { num: 35, note: '2ª Coluna (Quebra iminente)', col: 'col2' },
  { num: 31, note: '1ª Coluna -> Quebrou a 2ª Coluna! Gatilho de Surfe Ativado!', col: 'col1' },
  { num: 33, note: '3ª Coluna (Terminais 1 e 3)', col: 'col3' },
  { num: 1,  note: '1ª Coluna -> 1º GREEN de Surfe (Terminal 1)', col: 'col1' },
  { num: 19, note: '1ª Coluna -> Continuidade do Surfe', col: 'col1' },
  { num: 22, note: '1ª Coluna -> Continuidade do Surfe', col: 'col1' },
  { num: 31, note: '1ª Coluna -> Continuidade do Surfe', col: 'col1' },
  { num: 12, note: '3ª Coluna -> 2º GREEN de Surfe (Terminal 1/3)', col: 'col3' },
  { num: 24, note: '3ª Coluna -> 3º GREEN de Surfe com Quirera', col: 'col3' },
  { num: 27, note: '3ª Coluna -> 4º GREEN de Surfe com Quirera', col: 'col3' },
  { num: 13, note: '1ª Coluna -> 5º GREEN de Surfe com Quirera', col: 'col1' },
  { num: 17, note: '2ª Coluna -> Quebra do Surfe / RED absorvido pela Quirera', col: 'col2' },
  { num: 17, note: '2ª Coluna -> Retorno do número repetidor 17', col: 'col2' },
  { num: 34, note: '1ª Coluna -> Retomada de Coluna', col: 'col1' }
];

// Linha do tempo sincronizada com a transcrição do vídeo
export const VIDEO_MOMENTS: VideoMoment[] = [
  {
    timestamp: '0:00 - 0:42',
    seconds: 0,
    title: 'O Conceito Simples do Surfe de Colunas',
    speaker: 'Bastião',
    description: 'Apresentação da estratégia: buscar o simples, focando em surfar na tendência das colunas sem inventar complexidades desnecessárias.',
    actionTaken: 'Observar o histórico recente sem pressa de apostar.',
    spinsMentioned: [17, 35, 32, 5],
    columnFocus: 'Visão Geral das 3 Colunas',
    outcomeType: 'ANALYSIS',
    quote: 'No vídeo de hoje vou tentar trazer o simples para vocês... a gente tentar surfar. Como assim tentar surfar? Apenas surfar na onda.'
  },
  {
    timestamp: '0:48 - 1:37',
    seconds: 48,
    title: 'Análise das 2 Últimas Linhas da Mesa',
    speaker: 'Bastião',
    description: 'O autor não olha o gráfico geral/avançado acumulado, mas sim as duas últimas linhas do histórico recente (10 a 20 giros). Identifica que a 2ª Coluna (coluna do meio) está muito fraca e sem repetições contínuas, enquanto a 1ª e 3ª Colunas estão dominantes.',
    actionTaken: 'Identificar a coluna mais fraca (2ª Coluna) e as duas dominantes (1ª e 3ª).',
    spinsMentioned: [17, 35, 32, 17, 5],
    columnFocus: '1ª Coluna e 3ª Coluna Dominantes vs 2ª Fraca',
    outcomeType: 'ANALYSIS',
    quote: 'Eu sempre reforço a questão de 50 últimos sorteios... Primeira e terceira coluna estão dominantes na mesa. Não está saindo a segunda coluna. O ponto mais forte está sendo repetição de 1ª e 3ª coluna.'
  },
  {
    timestamp: '1:44 - 2:31',
    seconds: 104,
    title: 'Gatilho da Quebra & Confirmação de Entrada',
    speaker: 'Bastião',
    description: 'Saiu o 35 (2ª coluna) e imediatamente quebrou para o 31 (1ª coluna). Como a 2ª coluna não repete, a confirmação do surfe é acionada: apostar na 1ª e 3ª colunas juntas.',
    actionTaken: 'Preparar entrada dupla: 1ª Coluna + 3ª Coluna.',
    spinsMentioned: [35, 31, 33],
    columnFocus: 'Entrada na 1ª Coluna + 3ª Coluna (Cobertura de 24 números / 64.8%)',
    outcomeType: 'TRIGGER',
    quote: 'Ó, já quebrou pra primeira! Eu vou buscar novamente a repetição de primeira e terceira... quebrou 35 que era a segunda coluna, e aí a gente fez as buscas pra 1ª e 3ª.'
  },
  {
    timestamp: '2:39 - 3:36',
    seconds: 159,
    title: '1ª Entrada + Terminais Quentes (1 e 3)',
    speaker: 'Bastião',
    description: 'Entrada confirmada nas colunas 1 e 3, reforçando terminais 1 (1, 21, 31) e 3 (3, 13, 23, 33). Resultado: Saiu número 1 (1ª Coluna) -> GREEN!',
    actionTaken: 'Aposta em Coluna 1 + Coluna 3 + Terminais 1 e 3.',
    spinsMentioned: [1, 21, 31, 3, 13, 33],
    columnFocus: '1ª Coluna (Número 1 sorteado)',
    outcomeType: 'GREEN',
    quote: 'Que número que deu? Um! Eu busquei aqui os terminais 1 e terminais 3 da 1ª e 3ª coluna... GREEN!'
  },
  {
    timestamp: '3:51 - 4:46',
    seconds: 231,
    title: '2ª Entrada & Continuidade da Onda',
    speaker: 'Bastião',
    description: 'Mesmo padrão mantido: sequência forte das colunas 1 e 3 sem retorno da coluna do meio. Resultado: Saiu número 12 (3ª Coluna) -> Mais um GREEN!',
    actionTaken: 'Manter aposta nas colunas dominantes 1 e 3.',
    spinsMentioned: [19, 22, 31, 12],
    columnFocus: '3ª Coluna (Número 12 sorteado)',
    outcomeType: 'GREEN',
    quote: 'Primeira coluna, terceira coluna... 12, pessoal! 12! Porque o terminalzinho 1 e 3 estão fortes aqui pra gente estar entrando. O simples faz a diferença.'
  },
  {
    timestamp: '4:55 - 5:40',
    seconds: 295,
    title: 'Ativação do Modo "Quirera" (Proteção de Lucro)',
    speaker: 'Bastião',
    description: 'Após várias vitórias na sequência (5 a 6 rodadas), o autor reduz o valor das fichas para a "Quirera" (fichas leves). Jogando a favor da onda sem expor os lucros já acumulados. Resultado: Saiu número 24 (3ª Coluna) -> GREEN com Quirera!',
    actionTaken: 'Reduzir para aposta mínima / quirera nas colunas 1 e 3.',
    spinsMentioned: [24],
    columnFocus: '3ª Coluna (Número 24 sorteado com Quirera)',
    outcomeType: 'QUIRERA',
    quote: 'Tô jogando a favor dela, mas entrando com a Quirera! 24! A gente ainda continua ali surfando mais um pouquinho.'
  },
  {
    timestamp: '5:47 - 7:08',
    seconds: 347,
    title: 'Gestão Emocional, Stop Loss & Limites',
    speaker: 'Bastião',
    description: 'O autor relembra a importância da disciplina, gestão de risco e de aceitar o Stop Loss quando a mesa vira contra, sem perseguir perdas.',
    actionTaken: 'Manter serenidade e gestão rigorosa da banca.',
    spinsMentioned: [12, 35],
    columnFocus: 'Gestão de Risco & Stop Loss',
    outcomeType: 'LESSON',
    quote: 'Respeitando seus momentos, respeitando seus limites. Não ponha dinheiro de compromisso... O que vale é o respeito e a responsabilidade.'
  },
  {
    timestamp: '7:16 - 8:33',
    seconds: 436,
    title: 'Surfe Estendido & Cobertura do Zero',
    speaker: 'Bastião',
    description: 'Continuação das apostas com quirera nas duas colunas dominantes e proteção leve no zero.',
    actionTaken: 'Entrada Colunas 1 e 3 com quirera + ficha de proteção no Zero.',
    spinsMentioned: [27, 13, 0],
    columnFocus: 'Colunas 1 e 3 + Zero',
    outcomeType: 'QUIRERA',
    quote: 'Fui pela porcentagem? Não, fui pelo histórico recente... apenas a quirera. Aí de repente pega um zerinho aí pra gente.'
  },
  {
    timestamp: '8:40 - 9:31',
    seconds: 520,
    title: 'Ocorrência do Red & Por que a Quirera Salvou',
    speaker: 'Bastião',
    description: 'A 2ª coluna finalmente retorna com o número 17. O Red acontece, mas como o autor estava apostando apenas a Quirera, o lucro das rodadas anteriores ficou 100% protegido.',
    actionTaken: 'Encerrar o ciclo de surfe com lucros protegidos.',
    spinsMentioned: [17],
    columnFocus: '2ª Coluna (Número 17) -> Quebra da Onda',
    outcomeType: 'RED',
    quote: 'Olha aí o red, certo? E se eu dou aquela fortalecida lá? Não, pessoal, não façam isso! Atingiu a meta, utilizem a quirera. Parem de sofrer!'
  },
  {
    timestamp: '9:31 - 11:32',
    seconds: 571,
    title: 'Análise Final dos Números Repetidores (17) & Fechamento',
    speaker: 'Bastião',
    description: 'Explicação final sobre como o 17 era um número quente repetidor e encerramento com orientações de ouro.',
    actionTaken: 'Finalizar sessão com lucro no bolso e metas batidas.',
    spinsMentioned: [17, 34],
    columnFocus: 'Resumo da Estratégia de Colunas',
    outcomeType: 'LESSON',
    quote: 'O 17 estava quente mesmo, saiu muito na mesa... Trouxe pra vocês uma forma simples de utilizar estratégias de colunas: surfar na onda!'
  }
];

/**
 * Calcula as estatísticas e frequências das 3 colunas em uma janela de giros
 */
export function calculateColumnStats(spins: SpinRecord[], windowSize: number = 24): ColumnStats {
  const windowSpins = spins.slice(-windowSize);
  let col1 = 0;
  let col2 = 0;
  let col3 = 0;
  let zero = 0;

  windowSpins.forEach((s) => {
    const col = getNumberColumn(s.numero);
    if (col === 'col1') col1++;
    else if (col === 'col2') col2++;
    else if (col === 'col3') col3++;
    else if (col === 'zero') zero++;
  });

  const total = windowSpins.length || 1;
  const col1Pct = (col1 / total) * 100;
  const col2Pct = (col2 / total) * 100;
  const col3Pct = (col3 / total) * 100;
  const zeroPct = (zero / total) * 100;

  // Determinar a coluna mais fraca (menos frequente)
  const cols = [
    { id: 'col1' as const, count: col1 },
    { id: 'col2' as const, count: col2 },
    { id: 'col3' as const, count: col3 }
  ];
  cols.sort((a, b) => a.count - b.count);

  const weakestCol = cols[0].id;
  const dominantCols: ['col1' | 'col2' | 'col3', 'col1' | 'col2' | 'col3'] = [cols[2].id, cols[1].id];

  // Calcular repetições consecutivas da coluna fraca no histórico recente
  let currentRepeat = 0;
  let maxRepeat = 0;
  let tempRepeat = 0;

  for (let i = spins.length - 1; i >= 0; i--) {
    const c = getNumberColumn(spins[i].numero);
    if (c === weakestCol) {
      if (i === spins.length - 1 - currentRepeat) {
        currentRepeat++;
      }
      tempRepeat++;
      if (tempRepeat > maxRepeat) maxRepeat = tempRepeat;
    } else {
      tempRepeat = 0;
    }
  }

  return {
    col1Count: col1,
    col2Count: col2,
    col3Count: col3,
    zeroCount: zero,
    col1Pct,
    col2Pct,
    col3Pct,
    zeroPct,
    weakestCol,
    dominantCols,
    consecutiveWeakRepeats: currentRepeat,
    maxWeakRepeatRecent: maxRepeat
  };
}

/**
 * Motor de alerta da estratégia de Surfe de Colunas
 */
export function calculateColumnSurfingAlert(
  spins: SpinRecord[],
  windowSize: number = 24, // 24 giros = exatamente 2 últimas linhas da mesa de roleta (12 números por linha)
  minDominancePct: number = 65, // % somada das 2 colunas dominantes no histórico recente
  customDominantCols?: ['col1' | 'col2' | 'col3', 'col1' | 'col2' | 'col3']
): ColumnSurfingAlert {
  if (spins.length < 5) {
    return {
      hasAlert: false,
      alertType: 'SEARCHING',
      dominantCols: ['col1', 'col3'],
      weakCol: 'col2',
      betColumns: ['col1', 'col3'],
      betNumbers: [...COLUMN_NUMBERS.col1, ...COLUMN_NUMBERS.col3],
      recommendedTerminals: [1, 3],
      hotRepeatNumbers: [],
      confidencePct: 50,
      reason: 'Aguardando pelo menos 5 giros para analisar a tendência das colunas.',
      currentSurfStreak: 0,
      isQuireraMode: false
    };
  }

  const stats = calculateColumnStats(spins, windowSize);
  const dominantCols = customDominantCols || stats.dominantCols;
  const weakCol: 'col1' | 'col2' | 'col3' =
    dominantCols.includes('col1') && dominantCols.includes('col2')
      ? 'col3'
      : dominantCols.includes('col1') && dominantCols.includes('col3')
      ? 'col2'
      : 'col1';

  const lastSpin = spins[spins.length - 1];
  const lastCol = getNumberColumn(lastSpin.numero);
  const prevSpin = spins.length > 1 ? spins[spins.length - 2] : null;
  const prevCol = prevSpin ? getNumberColumn(prevSpin.numero) : null;

  // Números apostados (as duas colunas dominantes juntas)
  const betNumbers = [
    ...COLUMN_NUMBERS[dominantCols[0]],
    ...COLUMN_NUMBERS[dominantCols[1]]
  ];

  // Contar sequência ativa de vitórias no surfe
  let currentSurfStreak = 0;
  for (let i = spins.length - 1; i >= 0; i--) {
    const c = getNumberColumn(spins[i].numero);
    if (dominantCols.includes(c as any)) {
      currentSurfStreak++;
    } else {
      break;
    }
  }

  // Detectar números repetidores quentes nos últimos 20 giros
  const recent20 = spins.slice(-20);
  const numCounts: Record<number, number> = {};
  recent20.forEach((s) => {
    numCounts[s.numero] = (numCounts[s.numero] || 0) + 1;
  });
  const hotRepeatNumbers = Object.entries(numCounts)
    .filter(([_, count]) => count >= 2)
    .map(([num]) => parseInt(num))
    .slice(0, 4);

  // Terminais mais quentes nas 2 colunas dominantes
  const terminalCounts: Record<number, number> = {};
  recent20.forEach((s) => {
    const term = s.numero % 10;
    terminalCounts[term] = (terminalCounts[term] || 0) + 1;
  });
  const recommendedTerminals = Object.entries(terminalCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t]) => parseInt(t));

  // Cálculo da dominância recente
  const recent10 = spins.slice(-10);
  let dominantIn10 = 0;
  recent10.forEach((s) => {
    const c = getNumberColumn(s.numero);
    if (dominantCols.includes(c as any)) dominantIn10++;
  });
  const recentDominancePct = (dominantIn10 / (recent10.length || 1)) * 100;

  // Modo Quirera: ativado se já estiver com 4 ou mais vitórias seguidas no surfe
  const isQuireraMode = currentSurfStreak >= 4;

  // GATILHO 1: Quebra da coluna fraca (acabou de sair a coluna fraca e quebrou para uma dominante)
  const isBreakoutTrigger = prevCol === weakCol && dominantCols.includes(lastCol as any);

  // GATILHO 2: Onda ativa (último giro foi dominante e dominância recente >= minDominancePct)
  const isSurfActive = dominantCols.includes(lastCol as any) && recentDominancePct >= minDominancePct;

  let hasAlert = false;
  let alertType: ColumnSurfingAlert['alertType'] = 'SEARCHING';
  let reason = '';
  let confidencePct = Math.round(recentDominancePct);

  if (isBreakoutTrigger) {
    hasAlert = true;
    alertType = 'BREAKOUT_TRIGGER';
    confidencePct = Math.min(95, Math.round(recentDominancePct + 15));
    reason = `Gatilho de Quebra Ativado! A ${COLUMN_LABELS[weakCol]} acabou de quebrar para a ${COLUMN_LABELS[lastCol as any]}. Entrada ideal para surfar na ${COLUMN_LABELS[dominantCols[0]]} e ${COLUMN_LABELS[dominantCols[1]]}!`;
  } else if (isSurfActive) {
    hasAlert = true;
    alertType = 'SURF_ACTIVE';
    reason = `Onda de Surfe Ativa! As colunas ${COLUMN_LABELS[dominantCols[0]]} e ${COLUMN_LABELS[dominantCols[1]]} representam ${recentDominancePct.toFixed(0)}% dos últimos giros. Sequência ativa: ${currentSurfStreak}x GREENs.`;
  } else if (lastCol === weakCol) {
    hasAlert = false;
    alertType = 'COOLING_OFF';
    confidencePct = 40;
    reason = `Coluna Fraca (${COLUMN_LABELS[weakCol]}) sorteada no último giro. Aguarde a quebra para uma das colunas dominantes para iniciar o surfe com segurança.`;
  } else {
    hasAlert = false;
    alertType = 'SEARCHING';
    confidencePct = Math.round(recentDominancePct);
    reason = `Mesa em equilíbrio. Dominância das colunas em ${recentDominancePct.toFixed(0)}%. Aguarde a definição das colunas mais fortes.`;
  }

  return {
    hasAlert,
    alertType,
    dominantCols,
    weakCol,
    betColumns: dominantCols,
    betNumbers,
    recommendedTerminals: recommendedTerminals.length > 0 ? recommendedTerminals : [1, 3],
    hotRepeatNumbers,
    confidencePct,
    reason,
    currentSurfStreak,
    isQuireraMode,
    lastSpin
  };
}

/**
 * Payout da aposta em 2 Colunas + Proteção de Zero Opcional
 */
export function evaluateColumnSurfingPayout(
  drawnNumber: number,
  betColumns: ('col1' | 'col2' | 'col3')[],
  unitBetPerColumn: number = 5.00,
  zeroCoverBet: number = 0,
  tablePayoutMultiplier: number = 3 // Colunas pagam 2 to 1 (retorna 3x o valor da coluna)
) {
  const drawnCol = getNumberColumn(drawnNumber);
  const isZero = drawnNumber === 0;

  const totalCost = unitBetPerColumn * betColumns.length + zeroCoverBet;
  let returnAmount = 0;
  let isWin = false;

  if (isZero && zeroCoverBet > 0) {
    returnAmount = zeroCoverBet * 36;
    isWin = true;
  } else if (betColumns.includes(drawnCol as any)) {
    // Ganhou na coluna apostada: 1 coluna paga (retorno = unitBet * 3)
    returnAmount = unitBetPerColumn * tablePayoutMultiplier;
    isWin = true;
  }

  const netResult = returnAmount - totalCost;

  return {
    isWin,
    totalCost,
    returnAmount,
    netResult,
    drawnCol
  };
}

/**
 * Executa Backtest Completo do Surfe de Colunas nos Giros
 */
export function runColumnSurfingBacktest(
  spins: SpinRecord[],
  initialBankroll: number = 300,
  normalBet: number = 15.00, // R$ 15,00 por coluna (Total R$ 30,00 por giro)
  quireraBet: number = 5.00,  // R$ 5,00 por coluna na Quirera (Total R$ 10,00 por giro)
  useQuireraAfterWins: number = 3,
  coverZero: boolean = true,
  zeroBet: number = 2.50
) {
  let bankroll = initialBankroll;
  let totalBets = 0;
  let wins = 0;
  let losses = 0;
  let maxGreenStreak = 0;
  let maxRedStreak = 0;
  let currentGreenStreak = 0;
  let currentRedStreak = 0;
  let highestBalance = initialBankroll;
  let lowestBalance = initialBankroll;

  const timelineData: {
    giro: number;
    numero: number;
    coluna: string;
    isWin: boolean;
    hadAlert: boolean;
    betAmount: number;
    netResult: number;
    balance: number;
    isQuirera: boolean;
  }[] = [];

  spins.forEach((spin, idx) => {
    if (idx < 5) return; // Aquecimento

    const historyBefore = spins.slice(0, idx);
    const alert = calculateColumnSurfingAlert(historyBefore, 24);

    const isQuirera = currentGreenStreak >= useQuireraAfterWins;
    const currentBetUnit = isQuirera ? quireraBet : normalBet;
    const currentZeroBet = coverZero ? (isQuirera ? zeroBet / 2 : zeroBet) : 0;

    const payout = evaluateColumnSurfingPayout(
      spin.numero,
      alert.betColumns,
      currentBetUnit,
      currentZeroBet
    );

    totalBets++;
    bankroll += payout.netResult;

    if (bankroll > highestBalance) highestBalance = bankroll;
    if (bankroll < lowestBalance) lowestBalance = bankroll;

    if (payout.isWin) {
      wins++;
      currentGreenStreak++;
      currentRedStreak = 0;
      if (currentGreenStreak > maxGreenStreak) maxGreenStreak = currentGreenStreak;
    } else {
      losses++;
      currentRedStreak++;
      currentGreenStreak = 0;
      if (currentRedStreak > maxRedStreak) maxRedStreak = currentRedStreak;
    }

    timelineData.push({
      giro: spin.giro || idx + 1,
      numero: spin.numero,
      coluna: COLUMN_LABELS[getNumberColumn(spin.numero)],
      isWin: payout.isWin,
      hadAlert: alert.hasAlert,
      betAmount: payout.totalCost,
      netResult: payout.netResult,
      balance: parseFloat(bankroll.toFixed(2)),
      isQuirera
    });
  });

  const winRatePct = totalBets > 0 ? (wins / totalBets) * 100 : 0;
  const netProfit = bankroll - initialBankroll;
  const roiPct = initialBankroll > 0 ? (netProfit / initialBankroll) * 100 : 0;

  return {
    initialBankroll,
    finalBankroll: parseFloat(bankroll.toFixed(2)),
    netProfit: parseFloat(netProfit.toFixed(2)),
    roiPct: parseFloat(roiPct.toFixed(1)),
    totalBets,
    wins,
    losses,
    winRatePct: parseFloat(winRatePct.toFixed(1)),
    maxGreenStreak,
    maxRedStreak,
    highestBalance: parseFloat(highestBalance.toFixed(2)),
    lowestBalance: parseFloat(lowestBalance.toFixed(2)),
    timelineData
  };
}
