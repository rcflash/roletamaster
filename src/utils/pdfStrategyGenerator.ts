import { jsPDF } from 'jspdf';
import { BankrollConfig } from '../types';

export function generateStrategyPDF(config?: BankrollConfig): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currency = config?.currency || 'R$';
  const unit = config?.defaultSpinCost || 10;
  const initialBank = config?.initialBankroll || 100;
  const stopLoss = config?.stopLossLimit || 50;
  const targetProfit = config?.dailyGoal || 20;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 12) {
      doc.addPage();
      y = margin + 12;
      addPageHeaderFooter();
    }
  };

  const addPageHeaderFooter = () => {
    const totalPages = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Header
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('ROLETA MASTER AI — MANUAL COMPLETO DE ESTRATÉGIAS E APOSTAS', margin, 10);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, 12, pageWidth - margin, 12);

      // Footer
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('Documento gerado para impressão e consulta prática em mesa de apostas.', margin, pageHeight - 7);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 18, pageHeight - 7);
    }
  };

  // --- CAPA / HEADER PRINCIPAL ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 34, 'F');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11); // Amber
  doc.text('ROLETA MASTER AI — GUIA OFICIAL DE APOSTAS', margin + 8, y + 11);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(`Manual Passo a Passo das Principais Estratégias (Entrada Padrão: ${currency} ${unit.toFixed(2)})`, margin + 8, y + 19);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(`Banca Base: ${currency} ${initialBank.toFixed(2)} | Meta Diária: ${currency} ${targetProfit.toFixed(2)} | Stop Loss: ${currency} ${stopLoss.toFixed(2)}`, margin + 8, y + 27);

  y += 40;

  // --- APRESENTAÇÃO ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. RESUMO EXECUTIVO & REGRAS DE OURO DA MESA', margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const introText = [
    `Este manual foi formulado para ser impresso e mantido ao lado da sua tela de apostas. Ele detalha exatamente onde colocar cada ficha considerando a entrada recomendada de ${currency} ${unit.toFixed(2)} por giro.`,
    '• Regra 1 (Amostragem Mínima): Antes de apostar dinheiro real, insira ou cole 50 a 100 giros da mesa para recalibrar a probabilidade das Dúzias e Colunas.',
    `• Regra 2 (Gestão de Riscos): Nunca exceda ${currency} ${unit.toFixed(2)} por giro. Atingindo a meta de ${currency} ${targetProfit.toFixed(2)} ou o limite de perda de ${currency} ${stopLoss.toFixed(2)}, feche a sessão imediatamente.`,
  ];

  introText.forEach((p) => {
    const lines = doc.splitTextToSize(p, contentWidth);
    checkPageBreak(lines.length * 4.5 + 2);
    doc.text(lines, margin, y);
    y += lines.length * 4.3 + 2;
  });

  y += 4;

  // --- DETALHAMENTO DAS 6 ESTRATÉGIAS ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. GUIA PASSO A PASSO DAS 6 ESTRATÉGIAS PROFISSIONAIS', margin, y);
  y += 8;

  const strategiesList = [
    {
      num: '2.1',
      title: 'ESTRATÉGIA ROMANOSKY (Cobertura Próxima a 86,4%)',
      category: 'Alta Cobertura | Risco Baixo',
      desc: 'Cobre 32 dos 37 números da roleta apostando simultaneamente em 2 Dúzias e 2 Quadrados (Corners). É uma das estratégias de menor volatilidade no mundo.',
      steps: [
        `Com orçamento de ${currency} ${unit.toFixed(2)} por giro:`,
        `1. Coloque ${currency} ${(unit * 0.375).toFixed(2)} (3 fichas) na 1ª Dúzia (números 1 ao 12).`,
        `2. Coloque ${currency} ${(unit * 0.375).toFixed(2)} (3 fichas) na 2ª Dúzia (números 13 ao 24).`,
        `3. Coloque ${currency} ${(unit * 0.125).toFixed(2)} (1 ficha) no Quadrado/Corner (25-26-28-29).`,
        `4. Coloque ${currency} ${(unit * 0.125).toFixed(2)} (1 ficha) no Quadrado/Corner (32-33-35-36).`,
        `• Payout: Se a bola cair em qualquer um dos 32 números cobertos, você recebe ${currency} ${(unit * 1.125).toFixed(2)} (Lucro limpo de +${currency} ${(unit * 0.125).toFixed(2)} no giro!).`
      ]
    },
    {
      num: '2.2',
      title: 'CICLO DE FECHAMENTO (Aposta em Números Ausentes)',
      category: 'Frequência & Ciclo | Risco Baixo-Médio',
      desc: 'Aposta nos números que estão há mais de 25 rodadas sem sair (os mais "frios"). Como a roleta tende ao equilíbrio matemático a cada 37 giros, os ausentes saem em bloco.',
      steps: [
        '1. Verifique no robô a lista de números ausentes há 25+ giros.',
        `2. Divida sua entrada total de ${currency} ${unit.toFixed(2)} igualmente entre esses números ausentes (ex: para 10 números, coloque ${currency} ${(unit / 10).toFixed(2)} direto em cada número).`,
        `3. Como cada número paga 36:1 (36x), quando um ausente é sorteado, ele recompensa o ciclo inteiro com lucro líquido de até +${currency} ${(unit * 2.6).toFixed(2)}!`,
        '4. Atualize a lista após cada acerto.'
      ]
    },
    {
      num: '2.3',
      title: '2 DÚZIAS DOMINANTES (Cobertura de 64,8%)',
      category: 'Cobertura Alta | Risco Baixo',
      desc: 'Aposta simultânea nas 2 Dúzias que estão apresentando maior temperatura e frequência nas últimas 20 rodadas.',
      steps: [
        '1. Consulte o Termômetro de Dúzias do aplicativo e selecione as 2 Dúzias mais quentes (ex: 1ª e 2ª Dúzia).',
        `2. Aposte ${currency} ${(unit / 2).toFixed(2)} na 1ª Dúzia e ${currency} ${(unit / 2).toFixed(2)} na 2ª Dúzia (Total: ${currency} ${unit.toFixed(2)}).`,
        `3. Se sair qualquer número de 1 a 24, você recebe ${currency} ${(unit * 1.5).toFixed(2)} (Lucro limpo: +${currency} ${(unit / 2).toFixed(2)} por giro!).`,
        '4. Ajuste as Dúzias se houver mudança de tendência no robô.'
      ]
    },
    {
      num: '2.4',
      title: 'MÉTODO D\'ALEMBERT (Chances Simples: Vermelho / Preto / Par)',
      category: 'Chances Simples | Risco Médio',
      desc: 'Progressão matemática piramidal. Aumenta +1 unidade após cada erro e reduz -1 unidade após cada acerto. Suaviza perdas sem dobrar a banca.',
      steps: [
        `1. Entrada Inicial: Aposte ${currency} ${unit.toFixed(2)} no Vermelho (ou Preto / Par / Ímpar).`,
        `2. Se você PERDER: Aumente a próxima aposta em +${currency} ${unit.toFixed(2)} (ex: de ${currency} ${unit.toFixed(2)} para ${currency} ${(unit * 2).toFixed(2)}).`,
        `3. Se você GANHAR: Diminua a próxima aposta em -${currency} ${unit.toFixed(2)} (voltando até o limite mínimo de ${currency} ${unit.toFixed(2)}).`,
        '4. Proporciona equilíbrio sem a agressividade do Martingale tradicional.'
      ]
    },
    {
      num: '2.5',
      title: 'ESTRATÉGIA JAMES BOND 007 (Cobertura de 67,5%)',
      category: 'Cobertura Alta | Risco Médio',
      desc: 'Famosa estratégia criada pelo escritor Ian Fleming. Divide a aposta fixando cobertura nos números Altos (19-36), Seisena (13-18) e Seguro no Zero.',
      steps: [
        `Para um valor total de ${currency} ${unit.toFixed(2)} por giro:`,
        `1. Coloque ${currency} ${(unit * 0.70).toFixed(2)} na aposta externa de Números Altos (19 ao 36).`,
        `2. Coloque ${currency} ${(unit * 0.25).toFixed(2)} na Seisena dos números 13 ao 18.`,
        `3. Coloque ${currency} ${(unit * 0.05).toFixed(2)} de seguro direto no número Zero (0).`,
        `4. Se cair em qualquer número entre 13 e 36 ou no Zero (25 números no total), você obtém lucro imediato!`
      ]
    },
    {
      num: '2.6',
      title: 'ESTRATÉGIA MARTINGALE DE PROFISSIONAL NA ROLETA',
      category: 'Terminais & Padrões | Risco Médio',
      desc: 'Mapeia zonas quentes do cilindro com 1 vizinho cada lado + terminais altos (7, 8, 9) e Zero. Aplica Martingale de 1 etapa em caso de perda para rápida recuperação.',
      steps: [
        '1. Mapeie os últimos números sorteados e cubra cada número com 1 vizinho no cilindro.',
        '2. Adicione cobertura individual nos terminais altos da mesa (7, 8 e 9) e no número Zero (0).',
        '3. Se a 1ª entrada falhar, aplique a Dobra de Martingale (2x) na jogada seguinte.',
        '4. Busque de 3 a 4 Greens consecutivos e encerre a sessão.'
      ]
    },
    {
      num: '2.7',
      title: 'ESTRATÉGIA GUGA TV (Linha do Tempo & Terminais Quentes)',
      category: 'Terminais & Padrões | Risco Médio',
      desc: 'Mapeia a linha do tempo dos terminais mais recorrentes na roleta (1, 4, 7, 0, 3 e 8). Cobre sequências de atração em linha do tempo com proteção no Zero.',
      steps: [
        '1. Acompanhe a linha do tempo no aplicativo identificando repetições dos terminais quentes.',
        '2. Ao surgir padrão de atração (ex: 4-0-1-7 ou cercado de zero 0-8-0), faça a cobertura dividida nos terminais quentes da rodada.',
        `3. Adicione obrigatoriamente 1 ficha de proteção no número Zero (0).`,
        '4. Payout de 36:1 garante alto retorno quando o terminal atrai sua repetição.'
      ]
    },
    {
      num: '2.8',
      title: 'ANÁLISE DE TERMINAIS & SEQUÊNCIA (Estratégia do Gráfico)',
      category: 'Terminais & Padrões | Risco Médio',
      desc: 'Analisa o gráfico de frequência acumulada identificando padrões de atração do último terminal e falhas de sequência.',
      steps: [
        '1. Observe o último terminal sorteado no gráfico do sistema.',
        '2. Identifique os 2 terminais correlacionados com maior taxa de atração histórica.',
        `3. Cubra todos os números correspondentes aos 2 terminais mais 1 ficha de seguro no Zero (0).`
      ]
    },
    {
      num: '2.9',
      title: 'ESTRATÉGIA SIMPLES NA ROLETA ONLINE',
      category: 'Terminais & Padrões | Risco Baixo',
      desc: 'Análise cirúrgica na linha do tempo da roleta para acertar jogadas de primeira (tiro limpo). Identifica padrões espelhados e vizinhos camuflados do cilindro (ex: 33 no lugar do 0, 1 no lugar do 3).',
      steps: [
        '1. Acompanhe a linha do tempo e mapeie sequências com vizinhos de roda camuflados.',
        '2. Coloque 1 ficha de cobertura no terminal alvo com 1 vizinho de cada lado no cilindro.',
        '3. Adicione fichas no terminal secundário de atração (ex: terminal 5 e 8).',
        '4. Adicione obrigatoriamente 1 ficha de seguro direto no número Zero (0).'
      ]
    },
    {
      num: '2.10',
      title: 'DIRTY DONE CHEAP (Progressão em Dúzias por Fases)',
      category: 'Progressão em Dúzias | Risco Médio',
      desc: 'Sistema progressivo estruturado em 4 fases cobrindo 2 dúzias com progressão calibrada para alavancagem com regras estritas de retorno ao saldo base.',
      steps: [
        '1. Fase 1: Aposta 10€ na 1ª dúzia e 15€ na 2ª dúzia. Vitória na 1ª mantém Fase 1; vitória na 2ª avança para Fase 2.',
        '2. Fase 2: Aposta 20€ na 1ª dúzia e 25€ na 2ª dúzia. Vitória na 1ª vai para Fase 3; vitória na 2ª vai para Fase 4.',
        '3. Fase 3: Aposta 30€ na 1ª e 30€ na 2ª dúzia. Em caso de vitória, retorne à Fase 1.',
        '4. Fase 4: Aposta 25€ na 1ª e 50€ na 2ª dúzia. Ao concluir, retorne ao início (Fase 1).'
      ]
    },
    {
      num: '2.11',
      title: 'HOPSCOTCH PRO MAX (Transição de Risco 1:1 para Dúzias)',
      category: 'Chances Simples & Dúzias | Risco Baixo',
      desc: 'Estratégia híbrida que inicia com apostas de baixo risco de chance simples (1:1) no Preto/Vermelho e reinveste o lucro em 2 dúzias nas fases seguintes.',
      steps: [
        '1. Fase 1: Aposta 20€ no Preto (1:1). Em caso de vitória, avança para a 2ª Fase.',
        '2. Fase 2: Divide os 40€ de retorno em 20€ na 1ª Dúzia e 20€ na 2ª Dúzia.',
        '3. Fase 3: Ao vencer, divide o lucro em 30€ na 1ª Dúzia e 30€ na 2ª Dúzia.',
        '4. Vitória na Fase 3 ou qualquer derrota reinicia o ciclo na Fase 1.'
      ]
    },
    {
      num: '2.12',
      title: 'SPLIT ON THE CORNERS (Cobertura 81.1% sem Progressão)',
      category: 'Cantos & Splits | Risco Baixo',
      desc: 'Cobertura estática maciça de 30 números (81.1% da roleta) combinando 5 apostas em cantos de 4 números + 5 apostas em splits sem aumentar o valor apostado.',
      steps: [
        '1. Faça 5 apostas em cantos (2-3-5-6, 8-9-11-12, 14-15-17-18, 20-21-23-24, 26-27-29-30) com 25€ cada.',
        '2. Faça 5 apostas em splits (1-4, 10-13, 31-34, 32-33, 35-36) com 10€ cada.',
        '3. Cobre 30 números no total (81.1% da mesa). Vitória no canto rende +50€ e no split rende +5€.',
        '4. Não altere os valores apostados independentemente do resultado.'
      ]
    }
  ];

  strategiesList.forEach((st) => {
    checkPageBreak(38);

    // Title box
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'FD');

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${st.num} ${st.title}`, margin + 3, y + 5);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9); // Amber
    doc.text(st.category, pageWidth - margin - 50, y + 5);

    y += 10;

    // Desc
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const descLines = doc.splitTextToSize(st.desc, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 4 + 2;

    // Steps
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Passo a Passo de Aposta:', margin, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);

    st.steps.forEach((step) => {
      const stepLines = doc.splitTextToSize(step, contentWidth - 4);
      checkPageBreak(stepLines.length * 4 + 1);
      doc.text(stepLines, margin + 2, y);
      y += stepLines.length * 3.8 + 1;
    });

    y += 4;
  });

  // --- TABELA RESUMO / CHECKLIST DE CAMPO ---
  checkPageBreak(40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. TABELA GUIA DE DISTRIBUIÇÃO DAS APOSTAS', margin, y);
  y += 6;

  // Table header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Estratégia', margin + 3, y + 5);
  doc.text('Cobertura', margin + 65, y + 5);
  doc.text(`Valor Entrada (${currency})`, margin + 100, y + 5);
  doc.text('Objetivo / Retorno', margin + 140, y + 5);
  y += 7;

  const tableRows = [
    { name: 'Estratégia Simples Online', cov: '9 Núm (24.3%)', val: `${currency} ${unit.toFixed(2)}`, ret: `Tiro Rápido (36x)` },
    { name: 'Dirty Done Cheap', cov: '24 Núm (64.8%)', val: `Fases 25€-75€`, ret: `Alavancagem em 2 Dúzias` },
    { name: 'Hopscotch Pro Max', cov: '18-24 Núm (64.8%)', val: `Fases 20€-60€`, ret: `Transição Risco 1:1` },
    { name: 'Split on the Corners', cov: '30 Núm (81.1%)', val: `Fixo 175€`, ret: `81.1% Cobertura Fixa` },
    { name: 'Martingale Profissional', cov: '13 Núm (35.1%)', val: `${currency} ${unit.toFixed(2)} (Dobra 2x)`, ret: `Recuperação em 1 etapa` },
    { name: 'Guga TV (Linha do Tempo)', cov: '10 Núm (27.0%)', val: `${currency} ${unit.toFixed(2)}`, ret: `Alta Multiplicidade 36x` },
    { name: 'Estratégia do Gráfico', cov: '9 Núm (24.3%)', val: `${currency} ${unit.toFixed(2)}`, ret: `Padrão de Atração 36x` },
    { name: 'Romanosky', cov: '32 Núm (86.4%)', val: `${currency} ${unit.toFixed(2)}`, ret: `+${currency} ${(unit * 0.125).toFixed(2)} Lucro/Giro` },
    { name: '2 Dúzias Dominantes', cov: '24 Núm (64.8%)', val: `${currency} ${unit.toFixed(2)}`, ret: `+${currency} ${(unit * 0.5).toFixed(2)} Lucro/Giro` },
    { name: 'James Bond 007', cov: '25 Núm (67.5%)', val: `${currency} ${unit.toFixed(2)}`, ret: `+${currency} ${(unit * 0.4).toFixed(2)} Lucro/Giro` },
    { name: 'Ciclo de Ausentes', cov: '10-15 Números', val: `${currency} ${unit.toFixed(2)}`, ret: `Até 36x Payout` },
    { name: 'Método D\'Alembert', cov: '18 Núm (48.6%)', val: `Var. (+${currency} ${unit.toFixed(2)})`, ret: `Recuperação Suave` },
    { name: 'Vizinhos do Zero', cov: '17 Núm (45.9%)', val: `${currency} ${unit.toFixed(2)}`, ret: `Setor do Zero` },
  ];

  tableRows.forEach((r, rIdx) => {
    checkPageBreak(7);
    if (rIdx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, 6, 'F');
    }
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);

    doc.text(r.name, margin + 3, y + 4.5);
    doc.text(r.cov, margin + 65, y + 4.5);
    doc.text(r.val, margin + 100, y + 4.5);
    doc.text(r.ret, margin + 140, y + 4.5);
    y += 6;
  });

  // Footer & Headers across all pages
  addPageHeaderFooter();

  // Save PDF
  doc.save('Guia_Oficial_Apostas_Roleta_Master_AI.pdf');
}
