const fs = require('fs');

// Spin numbers 1 to 124 from user CSV
const spinNumbers = [
  2, 8, 16, 8, 1, 25, 18, 12, 6, 29,
  6, 9, 17, 7, 29, 32, 35, 33, 5, 21,
  35, 35, 8, 11, 0, 27, 18, 13, 13, 26,
  10, 29, 10, 31, 6, 33, 12, 24, 32, 36,
  20, 12, 29, 31, 12, 29, 32, 24, 26, 32,
  18, 15, 1, 22, 33, 6, 12, 8, 0, 9,
  0, 25, 28, 26, 2, 20, 35, 10, 13, 15,
  16, 7, 36, 21, 14, 16, 0, 5, 10, 33,
  36, 1, 34, 19, 27, 29, 20, 0, 33, 0,
  24, 28, 0, 20, 5, 20, 3, 13, 34, 18,
  // 101 to 124:
  8, 25, 35, 18, 19, 36, 32, 0, 11, 7,
  22, 18, 27, 33, 30, 19, 4, 20, 16, 33,
  7, 29, 34, 20
];

const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

// 1. Terminais / Gráfico ORIGINAL (spins 101-124)
// Target terminals = last terminal + top follower
let profitOriginal = 0;
let winOrig = 0;
let lossOrig = 0;

for (let idx = 100; idx < spinNumbers.length; idx++) {
  const historySlice = spinNumbers.slice(Math.max(0, idx - 15), idx);
  const lastSpin = historySlice[historySlice.length - 1];
  const lastTerminal = lastSpin % 10;

  const followerCount = {};
  for (let i = 0; i < historySlice.length - 1; i++) {
    if (historySlice[i] % 10 === lastTerminal) {
      const nextTerm = historySlice[i + 1] % 10;
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
  const targetNumbers = [0];
  for (let n = 1; n <= 36; n++) {
    if (targetTerminals.has(n % 10)) {
      targetNumbers.push(n);
    }
  }

  const isHit = targetNumbers.includes(spinNumbers[idx]);
  if (isHit) {
    profitOriginal += 52.50;
    winOrig++;
  } else {
    profitOriginal -= 37.50;
    lossOrig++;
  }
}

console.log('--- ORIGINAL (Terminais/Gráfico nos giros 101-124) ---');
console.log(`Wins: ${winOrig} | Losses: ${lossOrig} | Win Rate: ${((winOrig/(winOrig+lossOrig))*100).toFixed(1)}% | Lucro: R$ ${profitOriginal.toFixed(2)}`);

// 2. INVERSÃO TOTAL (Apostar em TODOS OS OUTROS NÚMEROS que NÃO são os terminais)
// Se a original cobria 9 números (2 terminais + zero), o inverso cobre os outros 28 números!
// Custo: R$ 28 (1 ficha de R$ 1 em cada número). Payout se acertar: R$ 36 (lucro +R$ 8). Perda: -R$ 28.
let profitInversoTotal = 0;
let winInvT = 0;
let lossInvT = 0;
let invTMatches = [];

for (let idx = 100; idx < spinNumbers.length; idx++) {
  const historySlice = spinNumbers.slice(Math.max(0, idx - 15), idx);
  const lastSpin = historySlice[historySlice.length - 1];
  const lastTerminal = lastSpin % 10;

  const followerCount = {};
  for (let i = 0; i < historySlice.length - 1; i++) {
    if (historySlice[i] % 10 === lastTerminal) {
      const nextTerm = historySlice[i + 1] % 10;
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
  const originalTargets = [0];
  for (let n = 1; n <= 36; n++) {
    if (targetTerminals.has(n % 10)) {
      originalTargets.push(n);
    }
  }

  // Números INVERSOS: todos os 37 números menos os originais!
  const invertedTargets = [];
  for (let n = 0; n <= 36; n++) {
    if (!originalTargets.includes(n)) {
      invertedTargets.push(n);
    }
  }

  const isHit = invertedTargets.includes(spinNumbers[idx]);
  // Normalizando aposta com R$ 37.50 de banca por giro:
  // 28 números com R$ 1.34 cada = R$ 37.50. Payout pleno 36x = 36 * 1.34 = R$ 48.24 -> Lucro +R$ 10.74.
  // Se perder: -R$ 37.50.
  const chip = 37.50 / invertedTargets.length;
  const net = isHit ? (36 * chip - 37.50) : -37.50;
  profitInversoTotal += net;
  if (isHit) winInvT++; else lossInvT++;
  invTMatches.push({
    giro: idx + 1,
    saiu: spinNumbers[idx],
    origHit: originalTargets.includes(spinNumbers[idx]),
    invHit: isHit,
    net: net.toFixed(2),
    lucroAcum: profitInversoTotal.toFixed(2)
  });
}

console.log('\n--- INVERSÃO COMPLEMENTAR (Cobrir os 28 números opostos aos terminais) ---');
console.log(`Wins: ${winInvT} (${((winInvT/24)*100).toFixed(1)}%) | Losses: ${lossInvT} (${((lossInvT/24)*100).toFixed(1)}%)`);
console.log(`Lucro Líquido: R$ ${profitInversoTotal.toFixed(2)}`);

// 3. ESTRATÉGIA "ANTI-DISPERSÃO / VIZINHOS INVERSOS (SETOR OPOSTO 180°)" COM FILTRO DE MOMENTUM
// Quando os vizinhos estão dando red, apostamos na oposição com 2 vizinhos (5 números) ou 3 vizinhos (7 números)
// Vamos testar:
console.log('\n--- SETORES OPOSTOS (180°) COM DIFERENTES COBERTURAS ---');
[2, 3, 4, 6].forEach(viz => {
  let p = 0, w = 0, l = 0;
  const count = 2 * viz + 1;
  const chip = 37.50 / count;
  for (let idx = 100; idx < spinNumbers.length; idx++) {
    const prev = spinNumbers[idx - 1];
    const oppIdx = (WHEEL.indexOf(prev) + 18) % 37;
    const oppNum = WHEEL[oppIdx];
    const sec = [];
    for (let i = -viz; i <= viz; i++) {
      sec.push(WHEEL[(oppIdx + i + 370) % 37]);
    }
    const isHit = sec.includes(spinNumbers[idx]);
    const net = isHit ? (36 * chip - 37.50) : -37.50;
    p += net;
    if (isHit) w++; else l++;
  }
  console.log(`Vizinhos ±${viz} (${count} números): Wins: ${w}/24 (${((w/24)*100).toFixed(1)}%) | Lucro: R$ ${p.toFixed(2)}`);
});

// 4. E se usarmos a melhor estratégia pré-100 giros (SPLIT ON THE CORNERS ou DIRTY DONE CHEAP)?
// No relatório do usuário, SPLIT ON THE CORNERS estava com 91.8% WIN até o giro 76!
// Vamos testar SPLIT ON THE CORNERS nos giros 101 a 124:
console.log('\n--- E SE CONTINUASSE COM AS ESTRATÉGIAS DE ALTA COBERTURA (SPLIT ON THE CORNERS / 2 DÚZIAS)? ---');
// SPLIT ON THE CORNERS: 5 corners + 5 splits = 30 numbers (81.1% da mesa).
// Wins nos giros 101-124 com 81.1% coverage:
