import { SpinRecord, BankrollConfig } from '../types';
import { getNumberColor } from './roulette';

export interface VideoTimelineMoment {
  id: string;
  timeLabel: string;
  seconds: number;
  title: string;
  speakerQuote: string;
  pedagogicalAnalysis: string;
  numbersTriggered: number[];
  targetTerminals: number[];
  targetNumbers: number[];
  protectionNumbers: number[];
  resultStatus: 'GREEN' | 'ALERT' | 'CONCEPT' | 'WIN';
  keyTakeaway: string;
}

export interface SubtractionCamouflagedRule {
  num: number;
  digits: [number, number];
  sumValue: number;
  sumTerminals: number[];
  subtractionValue: number;
  subtractionTerminal: number;
  directPulls: number[];
  cylinderNeighbors1: number[];
  explanation: string;
}

export interface DetectedScalePattern {
  id: string;
  type: 'crescente_direta' | 'crescente_subtracao' | 'decrescente_direta' | 'impar_alternada' | 'par_alternada' | 'familia_3em3' | 'espelho_puxada';
  title: string;
  sequenceFound: {
    num: number;
    effectiveDigit: number;
    method: 'puro' | 'soma' | 'subtracao' | 'espelho';
    explanation: string;
  }[];
  missingTerminal: number;
  targetNumbers: number[];
  protectionNumbers: number[];
  confidencePct: number;
  reason: string;
  suggestedAction: string;
}

// Vizinhos de 1 casa na Roleta Europeia
export const EUROPEAN_WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

export function get1Neighbors(num: number): number[] {
  const idx = EUROPEAN_WHEEL_ORDER.indexOf(num);
  if (idx === -1) return [num];
  const len = EUROPEAN_WHEEL_ORDER.length;
  const left = EUROPEAN_WHEEL_ORDER[(idx - 1 + len) % len];
  const right = EUROPEAN_WHEEL_ORDER[(idx + 1) % len];
  return [left, num, right];
}

// Tabela completa de propriedades de soma e subtração de dígitos para 0 a 36
export const CAMOUFLAGED_PROPERTIES_TABLE: Record<number, SubtractionCamouflagedRule> = {
  0: {
    num: 0,
    digits: [0, 0],
    sumValue: 0,
    sumTerminals: [0],
    subtractionValue: 0,
    subtractionTerminal: 0,
    directPulls: [26, 32],
    cylinderNeighbors1: [26, 0, 32],
    explanation: 'Zero é o elemento neutro e coringa dos camuflados.'
  },
  1: {
    num: 1,
    digits: [0, 1],
    sumValue: 1,
    sumTerminals: [1],
    subtractionValue: 1,
    subtractionTerminal: 1,
    directPulls: [10, 19, 28],
    cylinderNeighbors1: [33, 1, 20],
    explanation: 'Terminal 1 puro. Puxa ímpares e camuflados 10, 19, 28.'
  },
  2: {
    num: 2,
    digits: [0, 2],
    sumValue: 2,
    sumTerminals: [2],
    subtractionValue: 2,
    subtractionTerminal: 2,
    directPulls: [11, 20, 29],
    cylinderNeighbors1: [21, 2, 25],
    explanation: 'Terminal 2 puro. Puxa família 2-5-8.'
  },
  3: {
    num: 3,
    digits: [0, 3],
    sumValue: 3,
    sumTerminals: [3],
    subtractionValue: 3,
    subtractionTerminal: 3,
    directPulls: [12, 21, 30],
    cylinderNeighbors1: [35, 3, 26],
    explanation: 'Terminal 3 puro. Base da família 0-3-6-9.'
  },
  4: {
    num: 4,
    digits: [0, 4],
    sumValue: 4,
    sumTerminals: [4],
    subtractionValue: 4,
    subtractionTerminal: 4,
    directPulls: [24, 13, 31],
    cylinderNeighbors1: [19, 4, 21],
    explanation: 'Terminal 4 puro. O 4 tem forte tendência a puxar o 24 no cilindro.'
  },
  5: {
    num: 5,
    digits: [0, 5],
    sumValue: 5,
    sumTerminals: [5],
    subtractionValue: 5,
    subtractionTerminal: 5,
    directPulls: [14, 23, 32],
    cylinderNeighbors1: [10, 5, 24],
    explanation: 'Terminal 5 puro. Centro da família 2-5-8 e terminação de ímpares.'
  },
  6: {
    num: 6,
    digits: [0, 6],
    sumValue: 6,
    sumTerminals: [6],
    subtractionValue: 6,
    subtractionTerminal: 6,
    directPulls: [15, 24, 33],
    cylinderNeighbors1: [34, 6, 27],
    explanation: 'Terminal 6 puro. Puxa família 0-3-6-9.'
  },
  7: {
    num: 7,
    digits: [0, 7],
    sumValue: 7,
    sumTerminals: [7],
    subtractionValue: 7,
    subtractionTerminal: 7,
    directPulls: [16, 25, 34, 28],
    cylinderNeighbors1: [29, 7, 28],
    explanation: 'Terminal 7 puro. Inicia quebras decrescentes (7 -> 4 -> 1).'
  },
  8: {
    num: 8,
    digits: [0, 8],
    sumValue: 8,
    sumTerminals: [8],
    subtractionValue: 8,
    subtractionTerminal: 8,
    directPulls: [17, 26, 35, 28],
    cylinderNeighbors1: [30, 8, 23],
    explanation: 'Terminal 8 puro. Alvo de puxadas de espelhos (23 e 32).'
  },
  9: {
    num: 9,
    digits: [0, 9],
    sumValue: 9,
    sumTerminals: [9],
    subtractionValue: 9,
    subtractionTerminal: 9,
    directPulls: [18, 27, 36],
    cylinderNeighbors1: [31, 9, 22],
    explanation: 'Terminal 9 puro. Puxa família 0-3-6-9.'
  },
  10: {
    num: 10,
    digits: [1, 0],
    sumValue: 1,
    sumTerminals: [1, 0],
    subtractionValue: 1,
    subtractionTerminal: 1,
    directPulls: [1, 19, 28],
    cylinderNeighbors1: [23, 10, 5],
    explanation: '1+0 = 1 (Soma ➔ Terminal 1). 1-0 = 1 (Subtração ➔ Terminal 1).'
  },
  11: {
    num: 11,
    digits: [1, 1],
    sumValue: 2,
    sumTerminals: [2],
    subtractionValue: 0,
    subtractionTerminal: 0,
    directPulls: [2, 20, 29],
    cylinderNeighbors1: [36, 11, 30],
    explanation: '1+1 = 2 (Soma ➔ Terminal 2). 1-1 = 0 (Subtração ➔ Terminal 0).'
  },
  12: {
    num: 12,
    digits: [1, 2],
    sumValue: 3,
    sumTerminals: [3],
    subtractionValue: 1,
    subtractionTerminal: 1,
    directPulls: [3, 21, 30],
    cylinderNeighbors1: [28, 12, 35],
    explanation: '1+2 = 3 (Soma ➔ Terminal 3). 2-1 = 1 (Subtração ➔ Terminal 1).'
  },
  13: {
    num: 13,
    digits: [1, 3],
    sumValue: 4,
    sumTerminals: [4],
    subtractionValue: 2,
    subtractionTerminal: 2,
    directPulls: [4, 22, 31],
    cylinderNeighbors1: [27, 13, 36],
    explanation: '1+3 = 4 (Soma ➔ Terminal 4). 3-1 = 2 (Subtração ➔ Terminal 2).'
  },
  14: {
    num: 14,
    digits: [1, 4],
    sumValue: 5,
    sumTerminals: [5],
    subtractionValue: 3,
    subtractionTerminal: 3,
    directPulls: [5, 23, 32],
    cylinderNeighbors1: [20, 14, 31],
    explanation: '1+4 = 5 (Soma ➔ Terminal 5). 4-1 = 3 (Subtração ➔ Terminal 3).'
  },
  15: {
    num: 15,
    digits: [1, 5],
    sumValue: 6,
    sumTerminals: [6],
    subtractionValue: 4,
    subtractionTerminal: 4,
    directPulls: [6, 24, 33],
    cylinderNeighbors1: [32, 15, 19],
    explanation: '1+5 = 6 (Soma ➔ Terminal 6). 5-1 = 4 (Subtração ➔ Terminal 4).'
  },
  16: {
    num: 16,
    digits: [1, 6],
    sumValue: 7,
    sumTerminals: [7],
    subtractionValue: 5,
    subtractionTerminal: 5,
    directPulls: [7, 25, 34],
    cylinderNeighbors1: [24, 16, 33],
    explanation: '1+6 = 7 (Soma ➔ Terminal 7). 6-1 = 5 (Subtração ➔ Terminal 5).'
  },
  17: {
    num: 17,
    digits: [1, 7],
    sumValue: 8,
    sumTerminals: [8],
    subtractionValue: 6,
    subtractionTerminal: 6,
    directPulls: [8, 26, 35],
    cylinderNeighbors1: [25, 17, 34],
    explanation: '1+7 = 8 (Soma ➔ Terminal 8). 7-1 = 6 (Subtração ➔ Terminal 6).'
  },
  18: {
    num: 18,
    digits: [1, 8],
    sumValue: 9,
    sumTerminals: [9],
    subtractionValue: 7,
    subtractionTerminal: 7,
    directPulls: [9, 27, 36],
    cylinderNeighbors1: [22, 18, 29],
    explanation: '1+8 = 9 (Soma ➔ Terminal 9). 8-1 = 7 (Subtração ➔ Terminal 7).'
  },
  19: {
    num: 19,
    digits: [1, 9],
    sumValue: 10,
    sumTerminals: [1, 0],
    subtractionValue: 8,
    subtractionTerminal: 8,
    directPulls: [1, 10, 28],
    cylinderNeighbors1: [15, 19, 4],
    explanation: '1+9 = 10 ➔ 1+0=1 (Soma ➔ Terminal 1). 9-1 = 8 (Subtração ➔ Terminal 8).'
  },
  20: {
    num: 20,
    digits: [2, 0],
    sumValue: 2,
    sumTerminals: [2],
    subtractionValue: 2,
    subtractionTerminal: 2,
    directPulls: [2, 11, 29],
    cylinderNeighbors1: [1, 20, 14],
    explanation: '2+0 = 2 (Soma ➔ Terminal 2). 2-0 = 2 (Subtração ➔ Terminal 2).'
  },
  21: {
    num: 21,
    digits: [2, 1],
    sumValue: 3,
    sumTerminals: [3],
    subtractionValue: 1,
    subtractionTerminal: 1,
    directPulls: [3, 12, 30],
    cylinderNeighbors1: [4, 21, 2],
    explanation: '2+1 = 3 (Soma ➔ Terminal 3). 2-1 = 1 (Subtração ➔ Terminal 1).'
  },
  22: {
    num: 22,
    digits: [2, 2],
    sumValue: 4,
    sumTerminals: [4],
    subtractionValue: 0,
    subtractionTerminal: 0,
    directPulls: [4, 13, 31],
    cylinderNeighbors1: [9, 22, 18],
    explanation: '2+2 = 4 (Soma ➔ Terminal 4). 2-2 = 0 (Subtração ➔ Terminal 0).'
  },
  23: {
    num: 23,
    digits: [2, 3],
    sumValue: 5,
    sumTerminals: [5],
    subtractionValue: 1,
    subtractionTerminal: 1,
    directPulls: [8, 32, 28],
    cylinderNeighbors1: [8, 23, 10],
    explanation: '2+3 = 5 (Soma ➔ Terminal 5). 3-2 = 1 (Subtração ➔ Terminal 1). Puxa espelho 32 e Terminal 8!'
  },
  24: {
    num: 24,
    digits: [2, 4],
    sumValue: 6,
    sumTerminals: [6],
    subtractionValue: 2,
    subtractionTerminal: 2,
    directPulls: [4, 6, 15, 33],
    cylinderNeighbors1: [5, 24, 16],
    explanation: '2+4 = 6 (Soma ➔ Terminal 6). 4-2 = 2 (Subtração ➔ Terminal 2). Puxado pelo 4.'
  },
  25: {
    num: 25,
    digits: [2, 5],
    sumValue: 7,
    sumTerminals: [7],
    subtractionValue: 3,
    subtractionTerminal: 3,
    directPulls: [7, 16, 34],
    cylinderNeighbors1: [2, 25, 17],
    explanation: '2+5 = 7 (Soma ➔ Terminal 7). 5-2 = 3 (Subtração ➔ Terminal 3).'
  },
  26: {
    num: 26,
    digits: [2, 6],
    sumValue: 8,
    sumTerminals: [8],
    subtractionValue: 4,
    subtractionTerminal: 4,
    directPulls: [8, 17, 35],
    cylinderNeighbors1: [3, 26, 0],
    explanation: '2+6 = 8 (Soma ➔ Terminal 8). 6-2 = 4 (Subtração ➔ Terminal 4).'
  },
  27: {
    num: 27,
    digits: [2, 7],
    sumValue: 9,
    sumTerminals: [9],
    subtractionValue: 5,
    subtractionTerminal: 5,
    directPulls: [9, 18, 36],
    cylinderNeighbors1: [6, 27, 13],
    explanation: '2+7 = 9 (Soma ➔ Terminal 9). 7-2 = 5 (Subtração ➔ Terminal 5).'
  },
  28: {
    num: 28,
    digits: [2, 8],
    sumValue: 10,
    sumTerminals: [1, 0],
    subtractionValue: 6,
    subtractionTerminal: 6,
    directPulls: [8, 18, 28, 6],
    cylinderNeighbors1: [7, 28, 12],
    explanation: 'O CLÁSSICO DO VÍDEO! 8 - 2 = 6 (Subtração ➔ Terminal 6). Encaixa na escala 4-5-6(28)-7 e puxa a volta do 8!'
  },
  29: {
    num: 29,
    digits: [2, 9],
    sumValue: 11,
    sumTerminals: [2, 1],
    subtractionValue: 7,
    subtractionTerminal: 7,
    directPulls: [7, 2, 11],
    cylinderNeighbors1: [18, 29, 7],
    explanation: '2+9 = 11 ➔ 1+1 = 2 (Soma ➔ Terminal 2). 9-2 = 7 (Subtração ➔ Terminal 7).'
  },
  30: {
    num: 30,
    digits: [3, 0],
    sumValue: 3,
    sumTerminals: [3],
    subtractionValue: 3,
    subtractionTerminal: 3,
    directPulls: [3, 12, 21],
    cylinderNeighbors1: [11, 30, 8],
    explanation: '3+0 = 3 (Soma ➔ Terminal 3). 3-0 = 3 (Subtração ➔ Terminal 3).'
  },
  31: {
    num: 31,
    digits: [3, 1],
    sumValue: 4,
    sumTerminals: [4],
    subtractionValue: 2,
    subtractionTerminal: 2,
    directPulls: [4, 13, 22],
    cylinderNeighbors1: [14, 31, 9],
    explanation: '3+1 = 4 (Soma ➔ Terminal 4). 3-1 = 2 (Subtração ➔ Terminal 2).'
  },
  32: {
    num: 32,
    digits: [3, 2],
    sumValue: 5,
    sumTerminals: [5],
    subtractionValue: 1,
    subtractionTerminal: 1,
    directPulls: [8, 23, 28],
    cylinderNeighbors1: [0, 32, 15],
    explanation: '3+2 = 5 (Soma ➔ Terminal 5). 3-2 = 1 (Subtração ➔ Terminal 1). Espelho do 23, ambos puxam Terminal 8!'
  },
  33: {
    num: 33,
    digits: [3, 3],
    sumValue: 6,
    sumTerminals: [6],
    subtractionValue: 0,
    subtractionTerminal: 0,
    directPulls: [6, 15, 24],
    cylinderNeighbors1: [16, 33, 1],
    explanation: '3+3 = 6 (Soma ➔ Terminal 6). 3-3 = 0 (Subtração ➔ Terminal 0).'
  },
  34: {
    num: 34,
    digits: [3, 4],
    sumValue: 7,
    sumTerminals: [7],
    subtractionValue: 1,
    subtractionTerminal: 1,
    directPulls: [7, 16, 25],
    cylinderNeighbors1: [17, 34, 6],
    explanation: '3+4 = 7 (Soma ➔ Terminal 7). 4-3 = 1 (Subtração ➔ Terminal 1).'
  },
  35: {
    num: 35,
    digits: [3, 5],
    sumValue: 8,
    sumTerminals: [8],
    subtractionValue: 2,
    subtractionTerminal: 2,
    directPulls: [8, 17, 26],
    cylinderNeighbors1: [12, 35, 3],
    explanation: '3+5 = 8 (Soma ➔ Terminal 8). 5-3 = 2 (Subtração ➔ Terminal 2).'
  },
  36: {
    num: 36,
    digits: [3, 6],
    sumValue: 9,
    sumTerminals: [9],
    subtractionValue: 3,
    subtractionTerminal: 3,
    directPulls: [9, 18, 27],
    cylinderNeighbors1: [13, 36, 11],
    explanation: '3+6 = 9 (Soma ➔ Terminal 9). 6-3 = 3 (Subtração ➔ Terminal 3).'
  }
};

// Obter todos os números de um terminal puro (ex: terminal 8 -> 8, 18, 28)
export function getPureNumbersForTerminal(t: number): number[] {
  const list: number[] = [];
  for (let i = 0; i <= 36; i++) {
    if (i % 10 === t) list.push(i);
  }
  return list;
}

// Linha do tempo com transcrição exata e sincronização do vídeo do Bastião
export const BASTIAO_VIDEO_TIMELINE: VideoTimelineMoment[] = [
  {
    id: 't-01',
    timeLabel: '0:01 - 0:27',
    seconds: 1,
    title: 'Entrada Inicial em Terminais 5 com 1 Vizinho',
    speakerQuote: '"Fiz uma busca para terminal 5... Aqui, ó: foi no 2. O 2 é um dos alvos que eu peguei nos terminais 5 com um vizinho. Por que fiz essa busca?"',
    pedagogicalAnalysis: 'Bastião identifica que a mesa vinha em leitura de progressão ímpar (1 -> 3), indicando cobrança iminente de Terminal 5 (5, 15, 25, 35) cobertos com 1 vizinho no cilindro.',
    numbersTriggered: [1, 3],
    targetTerminals: [5],
    targetNumbers: [5, 15, 25, 35],
    protectionNumbers: [2, 24, 10],
    resultStatus: 'CONCEPT',
    keyTakeaway: 'Ao identificar sequência ímpar (1 -> 3), o alvo natural é o próximo ímpar (Terminal 5) com 1 vizinho.'
  },
  {
    id: 't-02',
    timeLabel: '0:49 - 1:12',
    seconds: 49,
    title: 'Quebra de Ímpar para Decrescente (Cobrança de Terminal 1)',
    speakerQuote: '"Busquei uma crescente de ímpar alternada 1, 3... aqui deveria ser terminal 5, certo? E agora, por que estou buscando terminal 1? Porque pintou um 3 e 2! Então estou buscando leituras alternadas!"',
    pedagogicalAnalysis: 'A mesa não pagou o 5 e quebrou com a sequência 3 -> 2. Uma sequência 3 -> 2 é uma transição decrescente imediata (3, 2 -> 1). A mesa passa a DEVER TERMINAIS 1!',
    numbersTriggered: [3, 2],
    targetTerminals: [1],
    targetNumbers: [1, 11, 21, 31],
    protectionNumbers: [10, 12, 16, 24],
    resultStatus: 'ALERT',
    keyTakeaway: 'Quando uma crescente de ímpares falha e engata 3 -> 2, a regra decrescente assume e cobra Terminal 1.'
  },
  {
    id: 't-03',
    timeLabel: '1:24 - 2:08',
    seconds: 84,
    title: 'Montagem de Jogo: Terminais 1 + Proteções de Puxadas',
    speakerQuote: '"Vou repetir a mesma jogadinha: 1, 31... pegar um 12 aqui, proteção no 16 e 24 para não deixar buraco, porque o 4 tem tendência a puxar 24. E fiz proteção também no 10."',
    pedagogicalAnalysis: 'Estratégia de cobertura completa: joga nos Terminais 1 (1, 11, 21, 31), cobre a puxada clássica 4 -> 24, fecha os vizinhos 12 e 16, e protege o 10 (que é camuflado do terminal 1).',
    numbersTriggered: [4, 1],
    targetTerminals: [1],
    targetNumbers: [1, 11, 21, 31],
    protectionNumbers: [24, 12, 16, 10],
    resultStatus: 'ALERT',
    keyTakeaway: 'Cobrir sempre o alvo principal (Terminal 1) e fechar as puxadas e camuflados associados (10, 24, 12, 16).'
  },
  {
    id: 't-04',
    timeLabel: '3:01 - 3:45',
    seconds: 181,
    title: 'Cobrança do 7-4-1 e Puxadas Simétricas (23 e 32)',
    speakerQuote: '"Tá devendo terminal 1 por causa de um 7-4-1... Aí o 32 puxou terminal 8, o 23 puxou o mesmo terminal 8. Coincidência, né pessoal? Que número caiu aí? 7!"',
    pedagogicalAnalysis: 'Confirmação da família decrescente 7 -> 4 -> 1 (passos de 3 em 3). Além disso, Bastião destaca a regra dos espelhos: tanto o 32 quanto o 23 puxam terminais 8 com altíssima frequência.',
    numbersTriggered: [7, 4, 32, 23],
    targetTerminals: [1, 8],
    targetNumbers: [1, 11, 21, 31, 8, 18, 28],
    protectionNumbers: [23, 32, 7],
    resultStatus: 'ALERT',
    keyTakeaway: 'Espelhos 23 e 32 são gatilhos diretos para puxada do Terminal 8 (8, 18, 28).'
  },
  {
    id: 't-05',
    timeLabel: '4:14 - 4:48',
    seconds: 254,
    title: 'A Grande Leitura: "Volta 28! Volta Terminal 8!"',
    speakerQuote: '"Volta 28! Volta terminalzinho 8! Voltou o terminal 8! Voltou o 28! [risadas] Olha que loucura pessoal! Se vocês não captarem isso daí..."',
    pedagogicalAnalysis: 'Após o 7 sair na mesa, Bastião enxerga a escala oculta formada pelos giros anteriores e joga na volta do 28 / terminal 8. A roleta obedece e crava GREEN no 28!',
    numbersTriggered: [4, 5, 28, 7],
    targetTerminals: [8],
    targetNumbers: [8, 18, 28],
    protectionNumbers: [7, 12, 29],
    resultStatus: 'GREEN',
    keyTakeaway: 'GREEN cravado no 28 antecipando o fechamento perfeito da progressão 4-5-6-7-8.'
  },
  {
    id: 't-06',
    timeLabel: '4:57 - 6:01',
    seconds: 297,
    title: 'A Nova Regra Revelada: Camuflados por Subtração',
    speakerQuote: '"Eu sempre falei: utilizem os camuflados como SOMA (28 = 2+8 = 10 ➔ 1). Só que ultimamente eu verifico a forma que a mesa está pagando: se ela está SOMANDO ou SUBTRAINDO!"',
    pedagogicalAnalysis: 'A grande atualização pedagógica: números camuflados não são apenas soma de dígitos (D1 + D2), mas também a SUBTRAÇÃO do maior pelo menor dígito (|D2 - D1|).',
    numbersTriggered: [28],
    targetTerminals: [6, 1],
    targetNumbers: [28, 6, 16, 26, 36],
    protectionNumbers: [10, 1],
    resultStatus: 'CONCEPT',
    keyTakeaway: 'Dígitos subtraídos: 28 = 8 - 2 = 6! O número 28 atua perfeitamente como Terminal 6 na mesa.'
  },
  {
    id: 't-07',
    timeLabel: '6:09 - 7:09',
    seconds: 369,
    title: 'A Escala Perfeita: 4 ➔ 5 ➔ 28 (6) ➔ 7 ➔ 8!',
    speakerQuote: '"Iniciamos no 4, depois 5. Por que 6 se é o 28? 8 - 2 = 6! 4, 5, 6, 7... por que falei volta 28? Porque eu queria o terminal 8! Ele usou o 28 como 6 e depois pagou o 8!"',
    pedagogicalAnalysis: 'Demonstração matemática passo a passo: a mesa montou a escala crescente contínua: 4 -> 5 -> [28 = 8-2 = 6] -> 7. O próximo passo obrigatório da escala era o 8 (que pagou na volta do 28).',
    numbersTriggered: [4, 5, 28, 7, 28],
    targetTerminals: [8],
    targetNumbers: [8, 18, 28],
    protectionNumbers: [6, 26, 17],
    resultStatus: 'WIN',
    keyTakeaway: 'A sequência 4 -> 5 -> 28 -> 7 é a escala 4 -> 5 -> 6 -> 7 que puxa com 100% de clareza o Terminal 8.'
  },
  {
    id: 't-08',
    timeLabel: '7:21 - 7:38',
    seconds: 441,
    title: 'Gestão de Ouro: "Quem Não É Visto Não É Lembrado"',
    speakerQuote: '"Quando você dá uma cacetada na mesa, espera um pouquinho, espera umas 2 a 3 rodadas. Quem não é visto não é lembrado. Foca nisso: aposta não é investimento."',
    pedagogicalAnalysis: 'Regra comportamental inegociável de Bastião: após obter um lucro expressivo em uma entrada de alta confiança, pausar por 2 a 3 rodadas para reavaliar o fluxo e não devolver o lucro à mesa.',
    numbersTriggered: [],
    targetTerminals: [],
    targetNumbers: [],
    protectionNumbers: [],
    resultStatus: 'CONCEPT',
    keyTakeaway: 'Bateu a meta ou deu uma cacetada na mesa? Pause 2 a 3 giros. Proteja seu lucro.'
  }
];

/**
 * Analisa os últimos giros e detecta se há padrões de escalas ou camuflados por soma/subtração ativos
 */
export function detectBastiaoScalePatterns(spins: SpinRecord[]): DetectedScalePattern[] {
  if (spins.length < 2) return [];

  const patterns: DetectedScalePattern[] = [];
  const numbers = spins.map((s) => s.numero);
  const lastN = numbers.slice(-6); // Últimos 6 giros

  // 1. Verificar Escala com Subtração de Dígitos (ex: 4 -> 5 -> 28 -> 7 -> busca 8)
  if (lastN.length >= 3) {
    const n3 = lastN[lastN.length - 3];
    const n2 = lastN[lastN.length - 2];
    const n1 = lastN[lastN.length - 1];

    const prop3 = CAMOUFLAGED_PROPERTIES_TABLE[n3];
    const prop2 = CAMOUFLAGED_PROPERTIES_TABLE[n2];
    const prop1 = CAMOUFLAGED_PROPERTIES_TABLE[n1];

    if (prop3 && prop2 && prop1) {
      // Testar combinações de dígitos (puro, soma, subtração)
      const digits3 = [n3 % 10, prop3.sumValue, prop3.subtractionValue];
      const digits2 = [n2 % 10, prop2.sumValue, prop2.subtractionValue];
      const digits1 = [n1 % 10, prop1.sumValue, prop1.subtractionValue];

      // Busca por crescente contínua: d3 + 1 == d2 e d2 + 1 == d1
      for (const d3 of Array.from(new Set(digits3))) {
        for (const d2 of Array.from(new Set(digits2))) {
          if (d2 === d3 + 1) {
            for (const d1 of Array.from(new Set(digits1))) {
              if (d1 === d2 + 1) {
                const nextT = (d1 + 1) % 10;
                const targets = getPureNumbersForTerminal(nextT);
                const subMeth2 = d2 === prop2.subtractionValue && d2 !== n2 % 10 ? 'subtracao' : (d2 === prop2.sumValue && d2 !== n2 % 10 ? 'soma' : 'puro');
                
                patterns.push({
                  id: `scale-cresc-${d3}-${d2}-${d1}`,
                  type: subMeth2 === 'subtracao' ? 'crescente_subtracao' : 'crescente_direta',
                  title: `Escala Crescente Ativa: ${d3} ➔ ${d2} ➔ ${d1} (Alvo: Terminal ${nextT})`,
                  sequenceFound: [
                    { num: n3, effectiveDigit: d3, method: d3 === n3 % 10 ? 'puro' : (d3 === prop3.sumValue ? 'soma' : 'subtracao'), explanation: `Número ${n3} representando ${d3}` },
                    { num: n2, effectiveDigit: d2, method: subMeth2, explanation: `Número ${n2} representando ${d2} ${subMeth2 === 'subtracao' ? `(Subtração: ${prop2.digits[1]}-${prop2.digits[0]}=${d2})` : ''}` },
                    { num: n1, effectiveDigit: d1, method: d1 === n1 % 10 ? 'puro' : (d1 === prop1.sumValue ? 'soma' : 'subtracao'), explanation: `Número ${n1} representando ${d1}` }
                  ],
                  missingTerminal: nextT,
                  targetNumbers: targets,
                  protectionNumbers: [prop1.directPulls[0] || 0, prop2.directPulls[0] || 0].filter(Boolean),
                  confidencePct: 92,
                  reason: `A mesa montou a sequência crescente ${d3} ➔ ${d2} ➔ ${d1}. O próximo dígito natural obrigatório da escala é o Terminal ${nextT}.`,
                  suggestedAction: `Entrar nos números do Terminal ${nextT} (${targets.join(', ')}) com 1 vizinho no cilindro.`
                });
              }
            }
          }
        }
      }

      // Busca por decrescente contínua: d3 - 1 == d2 e d2 - 1 == d1
      for (const d3 of Array.from(new Set(digits3))) {
        for (const d2 of Array.from(new Set(digits2))) {
          if (d2 === d3 - 1) {
            for (const d1 of Array.from(new Set(digits1))) {
              if (d1 === d2 - 1) {
                const nextT = (d1 - 1 + 10) % 10;
                const targets = getPureNumbersForTerminal(nextT);
                patterns.push({
                  id: `scale-decresc-${d3}-${d2}-${d1}`,
                  type: 'decrescente_direta',
                  title: `Escala Decrescente Ativa: ${d3} ➔ ${d2} ➔ ${d1} (Alvo: Terminal ${nextT})`,
                  sequenceFound: [
                    { num: n3, effectiveDigit: d3, method: 'puro', explanation: `Número ${n3} representando ${d3}` },
                    { num: n2, effectiveDigit: d2, method: 'puro', explanation: `Número ${n2} representando ${d2}` },
                    { num: n1, effectiveDigit: d1, method: 'puro', explanation: `Número ${n1} representando ${d1}` }
                  ],
                  missingTerminal: nextT,
                  targetNumbers: targets,
                  protectionNumbers: [prop1.directPulls[0] || 0].filter(Boolean),
                  confidencePct: 88,
                  reason: `A mesa está caindo em passos decrescentes ${d3} ➔ ${d2} ➔ ${d1}, devendo o Terminal ${nextT}.`,
                  suggestedAction: `Entrar nos números do Terminal ${nextT} (${targets.join(', ')}) com cobertura de vizinhos.`
                });
              }
            }
          }
        }
      }
    }
  }

  // 2. Verificar Ímpares Alternados (ex: 1 -> 3 -> busca 5) ou quebra (3 -> 2 -> busca 1)
  if (lastN.length >= 2) {
    const n2 = lastN[lastN.length - 2];
    const n1 = lastN[lastN.length - 1];
    const t2 = n2 % 10;
    const t1 = n1 % 10;

    // 1 -> 3 ou 3 -> 5 ou 5 -> 7 ou 7 -> 9
    if (t2 % 2 !== 0 && t1 % 2 !== 0 && t1 === (t2 + 2) % 10) {
      const nextT = (t1 + 2) % 10;
      const targets = getPureNumbersForTerminal(nextT);
      patterns.push({
        id: `impar-alt-${t2}-${t1}`,
        type: 'impar_alternada',
        title: `Progressão Ímpar Alternada: ${t2} ➔ ${t1} (Alvo: Terminal ${nextT})`,
        sequenceFound: [
          { num: n2, effectiveDigit: t2, method: 'puro', explanation: `Giro com terminal ímpar ${t2}` },
          { num: n1, effectiveDigit: t1, method: 'puro', explanation: `Giro com terminal ímpar consecutivo ${t1}` }
        ],
        missingTerminal: nextT,
        targetNumbers: targets,
        protectionNumbers: [10, 24],
        confidencePct: 85,
        reason: `Mesa em fluxo crescente de ímpares alternados (${t2} ➔ ${t1}). O próximo ímpar natural é o Terminal ${nextT}.`,
        suggestedAction: `Buscar Terminal ${nextT} (${targets.join(', ')}) com 1 vizinho no cilindro.`
      });
    }

    // Quebra decrescente: 3 -> 2 (deve terminal 1)
    if (t2 === 3 && t1 === 2) {
      const targets = getPureNumbersForTerminal(1);
      patterns.push({
        id: `quebra-3-2-deve-1`,
        type: 'decrescente_direta',
        title: `Quebra 3 ➔ 2 Detectada (Cobrança Forte: Terminal 1)`,
        sequenceFound: [
          { num: n2, effectiveDigit: 3, method: 'puro', explanation: 'Giro número 3' },
          { num: n1, effectiveDigit: 2, method: 'puro', explanation: 'Giro número 2 (quebra para decrescente)' }
        ],
        missingTerminal: 1,
        targetNumbers: targets,
        protectionNumbers: [10, 12, 16, 24],
        confidencePct: 90,
        reason: 'Conforme demonstrado no vídeo pelo Bastião: quando pinta 3 ➔ 2, a mesa engata decrescente e deve obrigatoriamente o Terminal 1.',
        suggestedAction: `Jogar nos Terminais 1 (1, 11, 21, 31) com proteções no 10, 24, 12 e 16.`
      });
    }

    // Gatilho de Espelhos: 23 ou 32 puxando Terminal 8
    if (n1 === 23 || n1 === 32 || n2 === 23 || n2 === 32) {
      const targets = getPureNumbersForTerminal(8);
      patterns.push({
        id: `espelho-puxada-8`,
        type: 'espelho_puxada',
        title: `Puxada de Espelho: ${n1 === 23 || n1 === 32 ? n1 : n2} ➔ Puxa Terminal 8`,
        sequenceFound: [
          { num: n1 === 23 || n1 === 32 ? n1 : n2, effectiveDigit: 8, method: 'espelho', explanation: `Número espelho ${n1 === 23 || n1 === 32 ? n1 : n2} tem forte tração para Terminal 8` }
        ],
        missingTerminal: 8,
        targetNumbers: targets,
        protectionNumbers: [23, 32, 28],
        confidencePct: 86,
        reason: 'O 23 e o 32 são números espelhos complementares que possuem forte correlação de puxada para o Terminal 8 (8, 18, 28).',
        suggestedAction: `Cobrir Terminal 8 (8, 18, 28) com 1 vizinho no cilindro.`
      });
    }
  }

  return patterns;
}

/**
 * Executa simulação de backtest da estratégia nos giros passados
 */
export function runBastiaoScalesBacktest(spins: SpinRecord[], chipValue: number = 2.5) {
  if (spins.length < 4) {
    return {
      totalEntries: 0,
      wins: 0,
      losses: 0,
      winRatePct: 0,
      netProfit: 0,
      history: []
    };
  }

  let wins = 0;
  let losses = 0;
  let netProfit = 0;
  const history: {
    spinIdx: number;
    spinNum: number;
    predictedTerminal: number;
    targets: number[];
    isWin: boolean;
    profitThisSpin: number;
    reason: string;
  }[] = [];

  for (let i = 3; i < spins.length; i++) {
    const pastSpins = spins.slice(0, i);
    const patterns = detectBastiaoScalePatterns(pastSpins);

    if (patterns.length > 0) {
      const pat = patterns[0];
      const actualNum = spins[i].numero;
      const allTargetsWithNeighbors = new Set<number>();

      pat.targetNumbers.forEach((t) => {
        get1Neighbors(t).forEach((n) => allTargetsWithNeighbors.add(n));
      });
      pat.protectionNumbers.forEach((p) => allTargetsWithNeighbors.add(p));

      const isWin = allTargetsWithNeighbors.has(actualNum);
      const totalChips = allTargetsWithNeighbors.size;
      const betCost = totalChips * chipValue;
      const payout = isWin ? 36 * chipValue : 0;
      const spinProfit = payout - betCost;

      if (isWin) {
        wins++;
      } else {
        losses++;
      }
      netProfit += spinProfit;

      history.push({
        spinIdx: spins[i].giro,
        spinNum: actualNum,
        predictedTerminal: pat.missingTerminal,
        targets: Array.from(allTargetsWithNeighbors),
        isWin,
        profitThisSpin: spinProfit,
        reason: pat.title
      });
    }
  }

  const totalEntries = wins + losses;
  const winRatePct = totalEntries > 0 ? (wins / totalEntries) * 100 : 0;

  return {
    totalEntries,
    wins,
    losses,
    winRatePct,
    netProfit,
    history: history.reverse()
  };
}
