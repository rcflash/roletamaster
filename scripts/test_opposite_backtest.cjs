const fs = require('fs');

const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

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

function getWheelOpposite(targetNum, neighborCount = 2) {
  const idx = WHEEL.indexOf(targetNum);
  const oppIdx = (idx + 18) % WHEEL.length;
  const oppCenter = WHEEL[oppIdx];
  const oppNeighbors = [];
  for (let i = -neighborCount; i <= neighborCount; i++) {
    const pos = (oppIdx + i + WHEEL.length * 10) % WHEEL.length;
    oppNeighbors.push(WHEEL[pos]);
  }
  return { oppCenter, oppNeighbors };
}

// Exactly simulate post 100 spins (spins 101 to 124) with unitBet = 37.50:
const unitBet = 37.50;
const radius = 2; // 5 números
const sectorSize = 5;
const chipVal = unitBet / sectorSize; // 7.50 por pleno

let post100Profit = 0;
let post100Wins = 0;
let post100Losses = 0;
let balance = 100;
const rounds = [];

for (let idx = 100; idx < spinNumbers.length; idx++) {
  const prevNum = spinNumbers[idx - 1];
  const currNum = spinNumbers[idx];
  const { oppCenter, oppNeighbors } = getWheelOpposite(prevNum, radius);

  const isHit = oppNeighbors.includes(currNum);
  const cost = unitBet;
  const payout = 36 * chipVal;
  const profit = isHit ? (payout - cost) : -cost;
  balance += profit;

  if (isHit) {
    post100Wins++;
  } else {
    post100Losses++;
  }
  post100Profit += profit;

  rounds.push({
    giro: idx + 1,
    anterior: prevNum,
    centroOposto: oppCenter,
    coberturaOposta: oppNeighbors.join(', '),
    saiu: currNum,
    resultado: isHit ? 'GREEN (WIN)' : 'RED (LOSS)',
    ganhoPerda: (profit > 0 ? '+' : '') + profit.toFixed(2),
    saldo: balance.toFixed(2)
  });
}

console.log(`=== PERFORMANCE EXATA DO SETOR OPOSTO 180° (GIROS 101 A 124) ===`);
console.log(`Entradas: 24 | Wins: ${post100Wins} | Losses: ${post100Losses}`);
console.log(`Taxa de Acerto: ${((post100Wins / 24) * 100).toFixed(1)}%`);
console.log(`Lucro Líquido nos 24 giros: R$ ${post100Profit.toFixed(2)}`);
console.log(`Saldo: R$ 100,00 ➔ R$ ${balance.toFixed(2)}`);
console.log('\n--- TABELA RODADA A RODADA ---');
console.table(rounds);
