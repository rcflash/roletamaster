import { DailySessionRecord, BankrollConfig } from '../types';

export interface CreateSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

/**
 * Creates a brand new Google Spreadsheet in the user's Google Drive with styled headers,
 * mathematical formulas for net profit, ROI, final bankroll, and summary KPI cards.
 */
export async function createGoogleBankrollSheet(
  accessToken: string,
  sessions: DailySessionRecord[],
  config: BankrollConfig
): Promise<CreateSpreadsheetResult> {
  const title = `Gestão de Banca - Roleta Pro (${new Date().toLocaleDateString('pt-BR')})`;

  // 1. Create Spreadsheet resource with initial sheet
  const createResp = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title: title,
        locale: 'pt_BR'
      },
      sheets: [
        {
          properties: {
            title: 'Histórico & Diário',
            gridProperties: {
              frozenRowCount: 1
            }
          }
        },
        {
          properties: {
            title: 'Resumo & Configurações'
          }
        }
      ]
    })
  });

  if (!createResp.ok) {
    const errorData = await createResp.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erro ao criar planilha: ${createResp.statusText}`);
  }

  const createdData = await createResp.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Populate Sheet 1: "Histórico & Diário"
  const historyHeaders = [
    'Data',
    'Banca Inicial (R$)',
    'Greens',
    'Reds',
    'Valor Green (R$)',
    'Valor Red (R$)',
    'Lucro Líquido (R$)',
    'Banca Final (R$)',
    'ROI (%)',
    'Meta Batida',
    'Stop Loss',
    'Observações'
  ];

  const historyValues: any[][] = [historyHeaders];

  if (sessions.length > 0) {
    sessions.forEach((s, idx) => {
      const rowNum = idx + 2; // 1-based, header is 1
      historyValues.push([
        s.date,
        s.initialBankroll,
        s.greenCount || 0,
        s.redCount || 0,
        s.valuePerGreen || 90,
        s.valuePerRed || 37.5,
        `=(C${rowNum}*E${rowNum})-(D${rowNum}*F${rowNum})`, // Formula for Net Profit
        `=B${rowNum}+G${rowNum}`, // Formula for Final Bankroll
        `=IF(B${rowNum}>0, G${rowNum}/B${rowNum}, 0)`, // Formula for ROI %
        s.goalMet ? 'SIM' : 'NÃO',
        s.stopLossHit ? 'SIM' : 'NÃO',
        s.notes || ''
      ]);
    });
  } else {
    // Add default template row with current bankroll
    historyValues.push([
      new Date().toLocaleDateString('pt-BR'),
      config.initialBankroll || 1596.8,
      0,
      0,
      90,
      37.5,
      '=(C2*E2)-(D2*F2)',
      '=B2+G2',
      '=IF(B2>0, G2/B2, 0)',
      'NÃO',
      'NÃO',
      'Sessão inicial'
    ]);
  }

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Histórico & Diário!A1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: 'Histórico & Diário!A1',
      majorDimension: 'ROWS',
      values: historyValues
    })
  });

  // 3. Populate Sheet 2: "Resumo & Configurações"
  const summaryValues = [
    ['CONFIGURAÇÃO & METAS DO SISTEMA', 'VALOR'],
    ['Banca Inicial Cadastrada (R$)', config.initialBankroll || 1596.8],
    ['Meta Diária (R$)', config.dailyGoal || 150],
    ['Stop Loss Diário (R$)', config.stopLossLimit || 300],
    ['Valor Padrão por Green (R$)', 90],
    ['Valor Padrão por Red (R$)', 37.5],
    ['', ''],
    ['RESUMO DE PERFORMANCE', 'TOTAL'],
    ['Total de Sessões Registradas', sessions.length],
    ['Lucro Total Acumulado (R$)', '=SUM(\'Histórico & Diário\'!G2:G1000)'],
    ['Total de Greens Acumulados', '=SUM(\'Histórico & Diário\'!C2:C1000)'],
    ['Total de Reds Acumulados', '=SUM(\'Histórico & Diário\'!D2:D1000)'],
    ['Taxa de Acerto (Greens / Total)', '=IF((B11+B12)>0, B11/(B11+B12), 0)']
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Resumo & Configurações!A1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: 'Resumo & Configurações!A1',
      majorDimension: 'ROWS',
      values: summaryValues
    })
  });

  return {
    spreadsheetId,
    spreadsheetUrl
  };
}

/**
 * Appends or updates a daily session into an existing Google Spreadsheet.
 */
export async function syncSessionToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  session: DailySessionRecord
) {
  const row = [
    session.date,
    session.initialBankroll,
    session.greenCount || 0,
    session.redCount || 0,
    session.valuePerGreen || 90,
    session.valuePerRed || 37.5,
    session.netProfit,
    session.finalBankroll,
    session.roiPct / 100,
    session.goalMet ? 'SIM' : 'NÃO',
    session.stopLossHit ? 'SIM' : 'NÃO',
    session.notes || ''
  ];

  const resp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Histórico & Diário!A:L:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: 'Histórico & Diário!A:L',
        majorDimension: 'ROWS',
        values: [row]
      })
    }
  );

  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Erro ao sincronizar sessão na planilha: ${resp.statusText}`);
  }

  return await resp.json();
}
