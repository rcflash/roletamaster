import { SpinRecord } from '../types';
import { EUROPEAN_WHEEL_ORDER, getWheelNeighbors } from './roulette';

export type HorseFamilyType = '1-4-7' | '2-5-8' | '0-3-6-9';

export interface HorseFamilyDef {
  id: HorseFamilyType;
  name: string;
  terminals: number[];
  numbers: number[];
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  description: string;
}

export const HORSE_FAMILIES: Record<HorseFamilyType, HorseFamilyDef> = {
  '1-4-7': {
    id: '1-4-7',
    name: 'Cavalo 1 - 4 - 7',
    terminals: [1, 4, 7],
    numbers: [1, 11, 21, 31, 4, 14, 24, 34, 7, 17, 27],
    color: '#38bdf8', // sky-400
    badgeBg: 'bg-sky-500/20',
    badgeBorder: 'border-sky-400/40',
    badgeText: 'text-sky-300',
    description: 'Terminais 1 (1, 11, 21, 31), Terminais 4 (4, 14, 24, 34), Terminais 7 (7, 17, 27). Total: 11 números.'
  },
  '2-5-8': {
    id: '2-5-8',
    name: 'Cavalo 2 - 5 - 8',
    terminals: [2, 5, 8],
    numbers: [2, 12, 22, 32, 5, 15, 25, 35, 8, 18, 28],
    color: '#a855f7', // purple-500
    badgeBg: 'bg-purple-500/20',
    badgeBorder: 'border-purple-400/40',
    badgeText: 'text-purple-300',
    description: 'Terminais 2 (2, 12, 22, 32), Terminais 5 (5, 15, 25, 35), Terminais 8 (8, 18, 28). Total: 11 números.'
  },
  '0-3-6-9': {
    id: '0-3-6-9',
    name: 'Cavalo 3 - 6 - 9 (+0)',
    terminals: [0, 3, 6, 9],
    numbers: [0, 10, 20, 30, 3, 13, 23, 33, 6, 16, 26, 36, 9, 19, 29],
    color: '#f59e0b', // amber-500
    badgeBg: 'bg-amber-500/20',
    badgeBorder: 'border-amber-400/40',
    badgeText: 'text-amber-300',
    description: 'Terminais 3 (3, 13, 23, 33), Terminais 6 (6, 16, 26, 36), Terminais 9 (9, 19, 29) + Terminais 0 (0, 10, 20, 30). Total: 15 números.'
  }
};

// Tabelas de Camuflagem por Soma dos Dígitos
export interface CamouflageSumDef {
  targetTerminal: number;
  directNumbers: number[];
  sumCamouflagedNumbers: { num: number; sumFormula: string }[];
}

export const ODD_PROGRESSION_SUMS: Record<number, CamouflageSumDef> = {
  1: {
    targetTerminal: 1,
    directNumbers: [1, 11, 21, 31],
    sumCamouflagedNumbers: [
      { num: 10, sumFormula: '1+0=1' }
    ]
  },
  3: {
    targetTerminal: 3,
    directNumbers: [3, 13, 23, 33],
    sumCamouflagedNumbers: [
      { num: 12, sumFormula: '1+2=3' },
      { num: 21, sumFormula: '2+1=3' },
      { num: 30, sumFormula: '3+0=3' }
    ]
  },
  5: {
    targetTerminal: 5,
    directNumbers: [5, 15, 25, 35],
    sumCamouflagedNumbers: [
      { num: 14, sumFormula: '1+4=5' },
      { num: 23, sumFormula: '2+3=5 (citado no vídeo!)' },
      { num: 32, sumFormula: '3+2=5' }
    ]
  },
  7: {
    targetTerminal: 7,
    directNumbers: [7, 17, 27],
    sumCamouflagedNumbers: [
      { num: 16, sumFormula: '1+6=7 (citado no vídeo!)' },
      { num: 25, sumFormula: '2+5=7' },
      { num: 34, sumFormula: '3+4=7 (citado no vídeo!)' }
    ]
  },
  9: {
    targetTerminal: 9,
    directNumbers: [9, 19, 29],
    sumCamouflagedNumbers: [
      { num: 18, sumFormula: '1+8=9 (citado no vídeo!)' },
      { num: 27, sumFormula: '2+7=9' },
      { num: 36, sumFormula: '3+6=9' }
    ]
  }
};

/**
 * Retorna o terminal direto (último dígito) do número
 */
export function getTerminal(num: number): number {
  return num % 10;
}

/**
 * Retorna a soma dos dígitos do número
 */
export function getSumOfDigits(num: number): number {
  if (num < 10) return num;
  const tens = Math.floor(num / 10);
  const units = num % 10;
  return tens + units;
}

/**
 * Identifica a qual família de cavalo o número pertence
 */
export function getHorseFamily(num: number): HorseFamilyType {
  const term = getTerminal(num);
  if ([1, 4, 7].includes(term)) return '1-4-7';
  if ([2, 5, 8].includes(term)) return '2-5-8';
  return '0-3-6-9';
}

/**
 * Momento de Vídeo da Aula do Bastião
 */
export interface VideoLessonMoment {
  id: number;
  timestamp: string;
  timeSeconds: number;
  title: string;
  badge: string;
  badgeColor: string;
  summary: string;
  transcriptionQuote: string;
  targetHorse: HorseFamilyType;
  targetTerminals: number[];
  suggestedNumbers: number[];
  neighborMode: 'none' | '1_neighbor' | '2_neighbors';
  sampleSpins: number[];
  lessonInsight: string;
}

export const BASTIAO_HORSE_LESSON_MOMENTS: VideoLessonMoment[] = [
  {
    id: 1,
    timestamp: '0:09',
    timeSeconds: 9,
    title: 'Análise Prévia dos Últimos 50 Giros (Cavalo 1-4-7)',
    badge: 'LEITURA PRÉVIA',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    summary: 'Antes de qualquer entrada, o Bastião baixa a tela para os últimos 50 giros para verificar se a roleta está respeitando o cavalo 1-4-7.',
    transcriptionQuote: '"Pessoal, antes de fazer qualquer jogada, vamos verificar um ponto importantíssimo aqui. Deixa eu baixar aqui para os últimos 50. Pela lógica aqui, 147, correto?"',
    targetHorse: '1-4-7',
    targetTerminals: [1, 4, 7],
    suggestedNumbers: [1, 11, 21, 31, 4, 14, 24, 34, 7, 17, 27],
    neighborMode: '1_neighbor',
    sampleSpins: [31, 14, 7, 27, 4, 21],
    lessonInsight: 'Nunca entre às cegas: confirme se a mesa já fechou ciclos ou intercalações do cavalo nos últimos 50 giros.'
  },
  {
    id: 2,
    timestamp: '1:16',
    timeSeconds: 76,
    title: 'Padrão Intercalado e Proximidade de Vizinho (14 vizinho do 31)',
    badge: 'VIZINHO NO CILINDRO',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
    summary: 'O Bastião explica que o 14 bateu do lado do 31 (terminal 1), mostrando que a proteção de vizinho no cilindro é fundamental.',
    transcriptionQuote: '"Aqui atrás vocês podem ver que respeitou também, só que intercalado: 1 e 7. E se olharem aqui, ó: 7, 4, 14... mas o 14 é justamente do lado do terminal 1 (31 no cilindro)!"',
    targetHorse: '1-4-7',
    targetTerminals: [1],
    suggestedNumbers: [1, 11, 21, 31, 14, 20, 9],
    neighborMode: '1_neighbor',
    sampleSpins: [7, 4, 14, 31],
    lessonInsight: 'O 14 e o 31 são vizinhos colados na roleta europeia. Apostar com ±1 vizinho salva o green se a bola cair na casa ao lado.'
  },
  {
    id: 3,
    timestamp: '2:03',
    timeSeconds: 123,
    title: 'Confirmação do Cavalo 2-5-8 após Pintar Terminal 8',
    badge: 'CONFIRMAÇÃO 2-5-8',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    summary: 'Pintou terminal 8 na mesa. O Bastião verifica se o cavalo 2-5-8 também está sendo aceito pelo histórico recente.',
    transcriptionQuote: '"Pintou o terminal 8 agora aqui. Será que respeitou 258? Se vocês olharem aqui comigo, vão ver que sim, também aceitou a entradinha para cavalo 258 recente."',
    targetHorse: '2-5-8',
    targetTerminals: [2, 5, 8],
    suggestedNumbers: [2, 12, 22, 32, 5, 15, 25, 35, 8, 18, 28],
    neighborMode: '1_neighbor',
    sampleSpins: [2, 25, 18, 8, 22],
    lessonInsight: 'Quando um terminal 8 entra, confira se terminais 2 e 5 já deram resposta recente.'
  },
  {
    id: 4,
    timestamp: '3:36',
    timeSeconds: 216,
    title: 'A Regra dos 2 Terminais para Buscar o 3º (Fechando o Ciclo)',
    badge: 'REGRA DO 3º ELEMENTO',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    summary: 'Quando surge uma sequência de 2 terminais do mesmo cavalo, entra-se no 3º para completar o ciclo com pelo menos 1 ou 2 vizinhos.',
    transcriptionQuote: '"Quando surgir de novo uma sequência de duas vezes o cavalo, a gente vai entrar na terceira para completar o ciclo do cavalo! Se tiver saído um 6, eu vou buscar o 3... com pelo menos dois vizinhos!"',
    targetHorse: '0-3-6-9',
    targetTerminals: [3, 9],
    suggestedNumbers: [3, 13, 23, 33, 9, 19, 29],
    neighborMode: '2_neighbors',
    sampleSpins: [6, 36, 16],
    lessonInsight: 'Se saíram 2 terminais do cavalo (ex: 6 e 9), entre no terminal faltante (3) com 2 vizinhos.'
  },
  {
    id: 5,
    timestamp: '5:24',
    timeSeconds: 324,
    title: 'Padrão Alternado Pula-1-Casa (7 -> pulou -> 4 -> Busca 1)',
    badge: 'PULA 1 CASA',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    summary: 'Saiu 7, pulou uma casa (número de outro cavalo), bateu 4. O Bastião busca o terminal 1 na próxima para completar o padrão alternado.',
    transcriptionQuote: '"Que que aconteceu? Sete, pulou uma casa, quatro bateu agora no seis. Eu vou fazer o quê? Vou buscar terminal 1 para mim tá intercalando os terminais! Pegar um 29 aqui, uma proteção do 10."',
    targetHorse: '1-4-7',
    targetTerminals: [1],
    suggestedNumbers: [1, 11, 21, 31, 29, 10],
    neighborMode: '1_neighbor',
    sampleSpins: [7, 28, 4, 6],
    lessonInsight: 'Cavalo intercalado: se os terminais estão pulando 1 rodada, o gatilho se arma após a casa de salto.'
  },
  {
    id: 6,
    timestamp: '6:12',
    timeSeconds: 372,
    title: 'Por Que Nunca Jogar Seco: A Explicação do 14 e do 31',
    badge: 'NUNCA SECO!',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    summary: 'Bastião rebate quem pede para apostar seco. No cilindro, a bola muitas vezes para no vizinho físico (14 do lado do 31, 20 do lado do 1).',
    transcriptionQuote: '"Muitos vão falar: Bastião, pega seco! Por que que eu não peguei seco? A explicação tá no 14, porque o 14 é vizinho do 31! Já pensou se eu tivesse pego seco? Ia dar ruim! Por isso pelo menos 1 ou 2 vizinhos."',
    targetHorse: '1-4-7',
    targetTerminals: [1, 4, 7],
    suggestedNumbers: [31, 14, 20, 1, 33, 16],
    neighborMode: '1_neighbor',
    sampleSpins: [7, 4, 14],
    lessonInsight: 'A física da roleta faz a bola pular nas casas adjacentes. Os vizinhos são a blindagem contra o "quase-green".'
  },
  {
    id: 7,
    timestamp: '8:13',
    timeSeconds: 493,
    title: 'Dois Cavalos Dominantes Combinados (3-6-9 + 1-4-7 + Zero)',
    badge: 'DOIS CAVALOS (SEGURANÇA)',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    summary: 'Para quem busca meta segura: se dois cavalos estão dominando e alternando, cercam-se ambos (3-6-9 e 1-4-7 com zero de proteção).',
    transcriptionQuote: '"Se você faz assim: 3 6 9 e 7 4 1. Vamos pegar o terminalzinho zero só como precaução. Ah, são muitas fichas? Sim, mas você busca um alvo com segurança de dois cavalos dominantes."',
    targetHorse: '0-3-6-9',
    targetTerminals: [0, 1, 3, 4, 6, 7, 9],
    suggestedNumbers: [0, 1, 3, 4, 6, 7, 9, 10, 11, 13, 14, 16, 17, 19, 21, 23, 24, 26, 27, 29, 31, 33, 34, 36],
    neighborMode: 'none',
    sampleSpins: [3, 7, 16, 1, 36, 14, 9],
    lessonInsight: 'Cobrir 2 cavalos inteiros garante cerca de 22 a 24 números cobertos na mesa para bater metas rápidas.'
  },
  {
    id: 8,
    timestamp: '9:59',
    timeSeconds: 599,
    title: 'Início da Crescente de Ímpar (30 -> 11 -> 33: 1 -> 3 -> ?)',
    badge: 'CRESCENTE ÍMPAR',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    summary: 'Entraram os números 30, 11, 33 (terminais 1 e 3). Bastião identifica a formação da crescente de ímpares e prepara entrada para terminal 5.',
    transcriptionQuote: '"Olha só: 30, 11, 33... 1, 3... Será que forma uma crescente de ímpar? Se formar uma crescente de ímpar, a gente vai tá pegando agora os terminar em 5, cercando ali 1, 3 e 5."',
    targetHorse: '2-5-8',
    targetTerminals: [5],
    suggestedNumbers: [5, 15, 25, 35, 14, 23, 32],
    neighborMode: '1_neighbor',
    sampleSpins: [30, 11, 33],
    lessonInsight: 'Quando surge progressão 1 -> 3, prepare-se para a puxada do terminal 5 (e seus números camuflados).'
  },
  {
    id: 9,
    timestamp: '11:35',
    timeSeconds: 695,
    title: 'O Número 23 como Terminal Camuflado 5 (2 + 3 = 5)',
    badge: 'CAMUFLAGEM 2+3=5',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    summary: 'O 23 caiu na roleta. Bastião mostra que 23 é o terminal camuflado 5 (2+3=5), mantendo viva a progressão 1 -> 3 -> 5 -> 7.',
    transcriptionQuote: '"Este número aqui, o 23, ele entrou como um terminal camuflado! A gente faz aquela crescente: 1, 3... 2+3=5! Então 1, 3, 5... 1+6=7... 1, 3, 5, 7! Olha a crescente de ímpar!"',
    targetHorse: '1-4-7',
    targetTerminals: [7],
    suggestedNumbers: [7, 17, 27, 16, 25, 34],
    neighborMode: '1_neighbor',
    sampleSpins: [11, 33, 23, 16],
    lessonInsight: 'Não olhe apenas o último dígito: 23 soma 5, 16 soma 7, 34 soma 7. A soma dos dígitos alimenta a tendência!'
  },
  {
    id: 10,
    timestamp: '12:46',
    timeSeconds: 766,
    title: 'Fechamento da Crescente com Green no 19 (Terminal 9)',
    badge: 'GREEN NO 19 (CICLO 9)',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    summary: 'A roleta bate no número 19 (terminal 9), consagrando o fechamento de todo o ciclo da crescente de ímpares 1 -> 3 -> 5 -> 7 -> 9.',
    transcriptionQuote: '"Olha só: foi no 19! Isso é para mostrar pra gente que realmente a crescente de ímpar surgiu na mesa: 1, 3, 5, 7, 9! Se você cercou com dois vizinhos, você pegou! É uma senhora aula!"',
    targetHorse: '0-3-6-9',
    targetTerminals: [9],
    suggestedNumbers: [9, 19, 29, 18, 27, 36],
    neighborMode: '2_neighbors',
    sampleSpins: [11, 33, 23, 16, 19],
    lessonInsight: 'A crescente de ímpar se confirmou perfeitamente: 11(1) -> 33(3) -> 23(5 camuflado) -> 16(7 camuflado) -> 19(9 direto).'
  }
];

export interface HorseCyclesAlert {
  hasAlert: boolean;
  alertType: 'cycle_close' | 'intercalated' | 'odd_progression' | 'dominant_horses' | 'none';
  title: string;
  message: string;
  reason: string;
  targetHorse: HorseFamilyType;
  targetTerminals: number[];
  targetDirectNumbers: number[];
  camouflagedNumbers: { num: number; formula: string }[];
  wheelCoveredNumbers: number[]; // números com os vizinhos aplicados
  neighborRadius: 0 | 1 | 2;
  confidencePct: number;
  statsSummary: {
    horse147Count: number;
    horse258Count: number;
    horse0369Count: number;
    horse147Pct: number;
    horse258Pct: number;
    horse0369Pct: number;
  };
}

/**
 * Calcula estatísticas das famílias de cavalos nos últimos N giros
 */
export function calculateHorseStats(spins: SpinRecord[], windowSize: number = 50) {
  const slice = spins.slice(-windowSize);
  const total = Math.max(1, slice.length);

  let count147 = 0;
  let count258 = 0;
  let count0369 = 0;

  slice.forEach((s) => {
    const fam = getHorseFamily(s.numero);
    if (fam === '1-4-7') count147++;
    else if (fam === '2-5-8') count258++;
    else count0369++;
  });

  return {
    total,
    count147,
    count258,
    count0369,
    pct147: (count147 / total) * 100,
    pct258: (count258 / total) * 100,
    pct0369: (count0369 / total) * 100,
  };
}

/**
 * Expande uma lista de números plenos com seus vizinhos no cilindro europeu
 */
export function expandWithWheelNeighbors(numbers: number[], neighborRadius: 0 | 1 | 2): number[] {
  if (neighborRadius === 0) return Array.from(new Set(numbers));

  const set = new Set<number>();
  numbers.forEach((num) => {
    const neighbors = getWheelNeighbors(num, neighborRadius);
    neighbors.forEach((n) => set.add(n));
  });

  return Array.from(set).sort((a, b) => a - b);
}

/**
 * Analisa os giros recentes e gera o Alerta de Cavalos & Crescente de Ímpares
 */
export function calculateHorseCyclesAlert(
  spins: SpinRecord[],
  neighborRadius: 0 | 1 | 2 = 1,
  windowSize: number = 50
): HorseCyclesAlert {
  const stats = calculateHorseStats(spins, windowSize);

  const defaultAlert: HorseCyclesAlert = {
    hasAlert: false,
    alertType: 'none',
    title: 'Aguardando Padrão de Cavalo ou Crescente',
    message: 'Monitore os giros. Quando surgirem 2 terminais do mesmo cavalo, intercalação ou progressão ímpar, o sinal será disparado.',
    reason: `Análise ativa dos últimos ${Math.min(windowSize, spins.length)} giros.`,
    targetHorse: '1-4-7',
    targetTerminals: [1, 4, 7],
    targetDirectNumbers: HORSE_FAMILIES['1-4-7'].numbers,
    camouflagedNumbers: [],
    wheelCoveredNumbers: expandWithWheelNeighbors(HORSE_FAMILIES['1-4-7'].numbers, neighborRadius),
    neighborRadius,
    confidencePct: 50,
    statsSummary: {
      horse147Count: stats.count147,
      horse258Count: stats.count258,
      horse0369Count: stats.count0369,
      horse147Pct: stats.pct147,
      horse258Pct: stats.pct258,
      horse0369Pct: stats.pct0369,
    }
  };

  if (spins.length < 3) return defaultAlert;

  const last3 = spins.slice(-3);
  const s0 = last3[last3.length - 1]; // mais recente
  const s1 = last3[last3.length - 2]; // anterior
  const s2 = last3.length >= 3 ? last3[last3.length - 3] : null;

  const t0 = getTerminal(s0.numero);
  const t1 = getTerminal(s1.numero);
  const t2 = s2 ? getTerminal(s2.numero) : null;

  const sum0 = getSumOfDigits(s0.numero);
  const sum1 = getSumOfDigits(s1.numero);

  const fam0 = getHorseFamily(s0.numero);
  const fam1 = getHorseFamily(s1.numero);
  const fam2 = s2 ? getHorseFamily(s2.numero) : null;

  // 1. DETECÇÃO DE CRESCENTE DE ÍMPARES (1 -> 3 -> 5 -> 7 -> 9)
  // Checa se os últimos giros indicam progressão ímpar por terminal direto ou soma
  const odd0 = [1, 3, 5, 7, 9].includes(t0) ? t0 : ([1, 3, 5, 7, 9].includes(sum0) ? sum0 : null);
  const odd1 = [1, 3, 5, 7, 9].includes(t1) ? t1 : ([1, 3, 5, 7, 9].includes(sum1) ? sum1 : null);

  if (odd1 !== null && odd0 !== null) {
    // Se houve progressão 1->3 ou 3->5 ou 5->7 ou 7->9
    if (odd0 === odd1 + 2 || (odd1 === 9 && odd0 === 1)) {
      const nextOdd = odd0 === 9 ? 1 : odd0 + 2;
      const oddDef = ODD_PROGRESSION_SUMS[nextOdd];
      const targetNums = oddDef.directNumbers;
      const camou = oddDef.sumCamouflagedNumbers;
      const combinedTargets = Array.from(new Set([...targetNums, ...camou.map(c => c.num)]));
      const wheelCovered = expandWithWheelNeighbors(combinedTargets, neighborRadius);

      return {
        hasAlert: true,
        alertType: 'odd_progression',
        title: `🔥 ALERTA: CRESCENTE DE ÍMPARES ATIVA (${odd1} ➔ ${odd0} ➔ BUSCAR ${nextOdd})`,
        message: `A roleta ativou a crescente de ímpares do Bastião! Últimos giros registraram ${s1.numero} (ímpar ${odd1}) e ${s0.numero} (ímpar ${odd0}). Próximo alvo: TERMINAL ${nextOdd}.`,
        reason: `Progressão ímpar confirmada. Busque os números do terminal ${nextOdd} e seus camuflados por soma (+ vizinhos no cilindro).`,
        targetHorse: getHorseFamily(nextOdd),
        targetTerminals: [nextOdd],
        targetDirectNumbers: targetNums,
        camouflagedNumbers: camou.map(c => ({ num: c.num, formula: c.sumFormula })),
        wheelCoveredNumbers: wheelCovered,
        neighborRadius,
        confidencePct: 82,
        statsSummary: {
          horse147Count: stats.count147,
          horse258Count: stats.count258,
          horse0369Count: stats.count0369,
          horse147Pct: stats.pct147,
          horse258Pct: stats.pct258,
          horse0369Pct: stats.pct0369,
        }
      };
    }
  }

  // 2. DETECÇÃO DE FECHAMENTO DE CICLO DO CAVALO (2 DE 3 SEGUIDOS)
  // Se os 2 últimos números são da mesma família de cavalo, mas com terminais distintos
  if (fam0 === fam1 && t0 !== t1) {
    const horseDef = HORSE_FAMILIES[fam0];
    const presentTerminals = [t0, t1];
    const missingTerminals = horseDef.terminals.filter((t) => !presentTerminals.includes(t));

    const targetDirect = horseDef.numbers.filter((n) => missingTerminals.includes(getTerminal(n)));
    const wheelCovered = expandWithWheelNeighbors(targetDirect, neighborRadius);

    return {
      hasAlert: true,
      alertType: 'cycle_close',
      title: `⚡ FECHAMENTO DE CICLO: ${horseDef.name} (BUSCAR TERMINAL ${missingTerminals.join(', ')})`,
      message: `Saíram em sequência ${s1.numero} (term. ${t1}) e ${s0.numero} (term. ${t0}) do ${horseDef.name}. O ciclo pede o 3º terminal faltante: [${missingTerminals.join(', ')}]!`,
      reason: `Regra de 2 elementos para fechar o ciclo do cavalo. Bastião recomenda jogar com ±${neighborRadius || 1} vizinho no cilindro.`,
      targetHorse: fam0,
      targetTerminals: missingTerminals,
      targetDirectNumbers: targetDirect,
      camouflagedNumbers: [],
      wheelCoveredNumbers: wheelCovered,
      neighborRadius,
      confidencePct: 78,
      statsSummary: {
        horse147Count: stats.count147,
        horse258Count: stats.count258,
        horse0369Count: stats.count0369,
        horse147Pct: stats.pct147,
        horse258Pct: stats.pct258,
        horse0369Pct: stats.pct0369,
      }
    };
  }

  // 3. DETECÇÃO DE CAVALO ALTERNADO (PULA 1 CASA)
  // Exemplo: s2 (term 7) -> s1 (outra família) -> s0 (term 4) -> entra no term 1
  if (s2 && fam0 === fam2 && fam0 !== fam1 && t0 !== t2) {
    const horseDef = HORSE_FAMILIES[fam0];
    const presentTerminals = [t0, t2];
    const missingTerminals = horseDef.terminals.filter((t) => !presentTerminals.includes(t));

    const targetDirect = horseDef.numbers.filter((n) => missingTerminals.includes(getTerminal(n)));
    const wheelCovered = expandWithWheelNeighbors(targetDirect, neighborRadius);

    return {
      hasAlert: true,
      alertType: 'intercalated',
      title: `🎯 CAVALO ALTERNADO (PULA 1 CASA): ${horseDef.name}`,
      message: `Padrão intercalado identificado: ${s2.numero} (term. ${t2}) ➔ pulou ${s1.numero} ➔ ${s0.numero} (term. ${t0}). Entrada no terminal faltante [${missingTerminals.join(', ')}] para completar o ciclo!`,
      reason: `Alternância clássica pós-1 casa descrita na aula do Bastião.`,
      targetHorse: fam0,
      targetTerminals: missingTerminals,
      targetDirectNumbers: targetDirect,
      camouflagedNumbers: [],
      wheelCoveredNumbers: wheelCovered,
      neighborRadius,
      confidencePct: 75,
      statsSummary: {
        horse147Count: stats.count147,
        horse258Count: stats.count258,
        horse0369Count: stats.count0369,
        horse147Pct: stats.pct147,
        horse258Pct: stats.pct258,
        horse0369Pct: stats.pct0369,
      }
    };
  }

  // 4. DETECÇÃO DE CAVALOS DOMINANTES
  // Se uma família tem mais de 45% nos últimos giros
  let dominantFam: HorseFamilyType = '1-4-7';
  let dominantPct = stats.pct147;

  if (stats.pct258 > dominantPct) {
    dominantFam = '2-5-8';
    dominantPct = stats.pct258;
  }
  if (stats.pct0369 > dominantPct) {
    dominantFam = '0-3-6-9';
    dominantPct = stats.pct0369;
  }

  if (dominantPct >= 42) {
    const horseDef = HORSE_FAMILIES[dominantFam];
    const wheelCovered = expandWithWheelNeighbors(horseDef.numbers, neighborRadius);

    return {
      hasAlert: true,
      alertType: 'dominant_horses',
      title: `👑 CAVALO DOMINANTE: ${horseDef.name} (${dominantPct.toFixed(1)}% de Presença)`,
      message: `O ${horseDef.name} está dominando a mesa nos últimos ${stats.total} giros (${stats[dominantFam === '1-4-7' ? 'count147' : dominantFam === '2-5-8' ? 'count258' : 'count0369']} acertos).`,
      reason: `Foco de tendência dominante. Cobertura dos terminais [${horseDef.terminals.join(', ')}].`,
      targetHorse: dominantFam,
      targetTerminals: horseDef.terminals,
      targetDirectNumbers: horseDef.numbers,
      camouflagedNumbers: [],
      wheelCoveredNumbers: wheelCovered,
      neighborRadius,
      confidencePct: Math.min(85, Math.round(dominantPct * 1.5)),
      statsSummary: {
        horse147Count: stats.count147,
        horse258Count: stats.count258,
        horse0369Count: stats.count0369,
        horse147Pct: stats.pct147,
        horse258Pct: stats.pct258,
        horse0369Pct: stats.pct0369,
      }
    };
  }

  return defaultAlert;
}

/**
 * Backtest completo da estratégia de Cavalos e Crescente de Ímpares
 */
export function runHorseCyclesBacktest(
  spins: SpinRecord[],
  initialBankroll: number = 300,
  chipValue: number = 2.50,
  neighborRadius: 0 | 1 | 2 = 1,
  betOnlyOnAlert: boolean = true
) {
  let bankroll = initialBankroll;
  let totalBets = 0;
  let wins = 0;
  let losses = 0;
  let maxBalance = initialBankroll;
  let minBalance = initialBankroll;
  let currentGreenStreak = 0;
  let maxGreenStreak = 0;
  let currentRedStreak = 0;
  let maxRedStreak = 0;

  const history: {
    giro: number;
    numero: number;
    betAmount: number;
    winAmount: number;
    netProfit: number;
    balance: number;
    isWin: boolean;
    reason: string;
    coveredCount: number;
  }[] = [];

  if (spins.length < 5) {
    return {
      initialBankroll,
      finalBankroll: initialBankroll,
      netProfit: 0,
      roiPct: 0,
      totalBets: 0,
      wins: 0,
      losses: 0,
      winRatePct: 0,
      maxBalance: initialBankroll,
      minBalance: initialBankroll,
      maxGreenStreak: 0,
      maxRedStreak: 0,
      history: []
    };
  }

  for (let idx = 4; idx < spins.length; idx++) {
    const currentSpin = spins[idx];
    const spinsBefore = spins.slice(0, idx);
    const alert = calculateHorseCyclesAlert(spinsBefore, neighborRadius, 50);

    if (betOnlyOnAlert && !alert.hasAlert) {
      continue;
    }

    const coveredNumbers = alert.wheelCoveredNumbers.length > 0
      ? alert.wheelCoveredNumbers
      : HORSE_FAMILIES[alert.targetHorse].numbers;

    const coveredCount = coveredNumbers.length;
    const betAmount = coveredCount * chipValue;

    const isHit = coveredNumbers.includes(currentSpin.numero);
    const winGross = isHit ? chipValue * 36 : 0;
    const net = winGross - betAmount;

    bankroll += net;
    totalBets++;

    if (isHit) {
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

    if (bankroll > maxBalance) maxBalance = bankroll;
    if (bankroll < minBalance) minBalance = bankroll;

    history.push({
      giro: currentSpin.giro || idx + 1,
      numero: currentSpin.numero,
      betAmount,
      winAmount: winGross,
      netProfit: net,
      balance: bankroll,
      isWin: isHit,
      reason: alert.title,
      coveredCount
    });
  }

  const netProfit = bankroll - initialBankroll;
  const roiPct = initialBankroll > 0 ? (netProfit / initialBankroll) * 100 : 0;
  const winRatePct = totalBets > 0 ? (wins / totalBets) * 100 : 0;

  return {
    initialBankroll,
    finalBankroll: bankroll,
    netProfit,
    roiPct,
    totalBets,
    wins,
    losses,
    winRatePct,
    maxBalance,
    minBalance,
    maxGreenStreak,
    maxRedStreak,
    history
  };
}
