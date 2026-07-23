import { jsPDF } from 'jspdf';

export function generateStrategyPDF(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin - 10) {
      doc.addPage();
      y = margin + 10;
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
      doc.text('ROLETA MASTER AI — MANUAL ESTRATÉGICO OFICIAL', margin, 10);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, 12, pageWidth - margin, 12);

      // Footer
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('Documento gerado para gestão profissional de banca. Proibido distribuição comercial.', margin, pageHeight - 7);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 15, pageHeight - 7);
    }
  };

  // --- CAPA / HEADER PRINCIPAL ---
  // Background Header Box
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 32, 'F');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11); // Amber accent
  doc.text('ROLETA MASTER AI', margin + 8, y + 12);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Manual Operacional Detalhado de Estratégia de Dúzias e Colunas', margin + 8, y + 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Guia definitivo de Gestão de Banca, Amostragem de 100 Giros e Cobertura Estatística', margin + 8, y + 26);

  y += 38;

  // --- SEÇÃO 1: CONCEITO CHAVE DA AMOSTRAGEM ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. O Princípio dos 100 Giros de Coleta (Amostra Inicial)', margin, y);
  y += 6;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const sec1Text = [
    'A roleta europeia possui 37 números (0 a 36). Em curto prazo (menos de 30 giros), ocorrem anomalias causadas por vibrações do prato e tendências temporárias da mesa.',
    'Para anular essas distorções e apostar com vantagem estatística, o primeiro passo indispensável é coletar de 80 a 100 giros reais do cassino antes de realizar a primeira aposta.',
    '• Como fazer: Copie os últimos 100 números históricos da mesa do seu site de apostas, utilize o botão "Lançar Lote (100+)" no Roleta Master e cole tudo de uma vez.',
    '• Objetivo: O software calculará instantaneamente a temperatura exata de cada Dúzia (1ª, 2ª, 3ª) e Coluna (1ª, 2ª, 3ª), revelando quais setores estão dominando a mesa no momento.',
  ];

  sec1Text.forEach((p) => {
    const lines = doc.splitTextToSize(p, contentWidth);
    checkPageBreak(lines.length * 5 + 2);
    doc.text(lines, margin, y);
    y += lines.length * 4.8 + 2;
  });

  y += 4;

  // --- SEÇÃO 2: A ESTRATÉGIA DE COBERTURA DUPLA ---
  checkPageBreak(30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. Estratégia Principal: Cobertura Dupla de 24 Números (64,86% de Chance)', margin, y);
  y += 6;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const sec2Text = [
    'Em vez de apostar em números individuais (risco altíssimo de 2,7%), cobrimos 24 dos 37 números do tabuleiro cobrindo exatamente 2 Dúzias ou 2 Colunas de alta frequência.',
    '• Probabilidade de Acerto por Giro: 24 / 37 = 64,86%.',
    '• Retorno Financeiro (Payout): As Dúzias e Colunas pagam 2:1 (3x a aposta no setor).',
    '• Exemplo Prático: Se você apostar R$ 5,00 na 1ª Dúzia e R$ 5,00 na 2ª Dúzia (Total investido: R$ 10,00):',
    '   - Se bater na 1ª Dúzia: Você recebe R$ 15,00 (Lucro Líquido: +R$ 5,00).',
    '   - Se bater na 2ª Dúzia: Você recebe R$ 15,00 (Lucro Líquido: +R$ 5,00).',
    '   - Se bater na 3ª Dúzia ou Zero: Perda do giro (-R$ 10,00).',
  ];

  sec2Text.forEach((p) => {
    const lines = doc.splitTextToSize(p, contentWidth);
    checkPageBreak(lines.length * 5 + 2);
    doc.text(lines, margin, y);
    y += lines.length * 4.8 + 2;
  });

  y += 4;

  // --- CAIXA DE Destaque: PROTEÇÃO NO ZERO ---
  checkPageBreak(25);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'FD');

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Dica Pro: Proteção de Zero (Ficha de Cobertura)', margin + 4, y + 6);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const zeroText = 'Ao fazer entradas de R$ 10,00 (R$ 5 em cada dúzia), coloque R$ 0,50 ou R$ 1,00 diretamente no número ZERO. Como o Zero paga 35:1 (36x o valor), se o Zero sair, você recebe R$ 36,00, cobrindo totalmente a perda das dúzias e gerando um lucro limpo de R$ 26,00!';
  const zeroLines = doc.splitTextToSize(zeroText, contentWidth - 8);
  doc.text(zeroLines, margin + 4, y + 12);

  y += 28;

  // --- SEÇÃO 3: GESTÃO RIGOROSA DE BANCA & STOP LOSS ---
  checkPageBreak(30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. Gestão de Banca e Limites Emocionais (Stop Loss / Stop Gain)', margin, y);
  y += 6;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const sec3Text = [
    'O maior inimigo do jogador não é a roleta, é a ganância e a falta de disciplina.',
    '• Unidade de Entrada (Stake): Cada aposta total deve ser de no máximo 2% a 5% da sua banca total.',
    '  - Exemplo para Banca de R$ 100,00: Unidade máxima de R$ 5,00 a R$ 10,00 por entrada.',
    '• Meta de Lucro Diária (Stop Gain): Defina uma meta realista de 15% a 20% do capital (ex: R$ 20,00 para banca de R$ 100,00). Assim que atingir a meta, FECHE O NAVEGADOR E DORMIR. Não continue jogando.',
    '• Limite de Perda Diário (Stop Loss): Defina o valor máximo tolerável de perda no dia (ex: R$ 50,00 para banca de R$ 100,00). Se perder 2 ou 3 rodadas seguidas e bater no limite, PARE IMEDIATAMENTE.',
  ];

  sec3Text.forEach((p) => {
    const lines = doc.splitTextToSize(p, contentWidth);
    checkPageBreak(lines.length * 5 + 2);
    doc.text(lines, margin, y);
    y += lines.length * 4.8 + 2;
  });

  y += 4;

  // --- SEÇÃO 4: APLICAÇÃO PASSO A PASSO NA PRÁTICA ---
  checkPageBreak(30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('4. Roteiro Prático de Operação no Sistema Roleta Master', margin, y);
  y += 6;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const sec4Text = [
    'Passo 1: Abra a mesa de roleta no seu site de apostas favorito e acesse o histórico de últimos números.',
    'Passo 2: No Roleta Master, clique no botão vermelho "Limpar Mesa" para garantir que a base esteja zerada.',
    'Passo 3: Clique no botão "Lançar Lote (100+)", cole os números copiados do cassino e confirme.',
    'Passo 4: Observe o painel "Estratégia & Assistente Bot AI" e o "Termômetro de Dúzias/Colunas".',
    'Passo 5: Quando o Bot acender o sinal VERDE com recomendação nas 2 Dúzias Quentes, faça a entrada no cassino exatamente no valor da sua Stake configurada.',
    'Passo 6: Insira o número sorteado no Roleta Master após a rodada. O sistema atualizará automaticamente seu Saldo, Lucro e Gráfico de Desempenho.',
    'Passo 7: Ao atingir a Meta Diária de Lucro ou Stop Loss, encerre a operação e feche a sessão com disciplina.',
  ];

  sec4Text.forEach((p) => {
    const lines = doc.splitTextToSize(p, contentWidth);
    checkPageBreak(lines.length * 5 + 2);
    doc.text(lines, margin, y);
    y += lines.length * 4.8 + 2;
  });

  // Add Headers & Footers across all created pages
  addPageHeaderFooter();

  // Trigger Download
  doc.save('Estrategia_Oficial_Roleta_Master_AI.pdf');
}
