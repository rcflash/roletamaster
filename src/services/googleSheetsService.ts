import { DailySessionRecord, BankrollConfig } from '../types';
import { clearGoogleSession } from './googleAuth';

export interface CreateSpreadsheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

/**
 * Helper to handle HTTP errors specifically for Google Sheets API.
 */
async function handleResponseError(resp: Response): Promise<never> {
  if (resp.status === 401) {
    clearGoogleSession();
    throw new Error('Sessão Google expirada. Por favor, conecte sua conta Google novamente no botão "Conectar Google".');
  }
  if (resp.status === 403) {
    throw new Error('Permissão negada para acessar ou editar esta planilha no Google Drive. Verifique se sua conta tem acesso.');
  }
  if (resp.status === 404) {
    throw new Error('Planilha não encontrada no Google Drive. Ela pode ter sido excluída ou movida para a lixeira.');
  }

  const errorData = await resp.json().catch(() => ({}));
  const msg = errorData.error?.message || `Erro na API do Google Sheets (${resp.status}): ${resp.statusText}`;
  throw new Error(msg);
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

  // 1. Create Spreadsheet resource with initial sheets
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
    await handleResponseError(createResp);
  }

  const createdData = await createResp.json();
  const spreadsheetId = createdData.spreadsheetId;
  const spreadsheetUrl = createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Populate sheets with all current data
  await syncAllSessionsToGoogleSheet(accessToken, spreadsheetId, sessions, config);

  return {
    spreadsheetId,
    spreadsheetUrl
  };
}

/**
 * Syncs the entire sessions history and configuration to the Google Spreadsheet,
 * ensuring formulas and all rows are clean, up-to-date and consistent.
 */
export async function syncAllSessionsToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  sessions: DailySessionRecord[],
  config?: BankrollConfig
) {
  // 1. Prepare Sheet 1: "Histórico & Diário"
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

  // We sort sessions by date chronological or reverse, usually chronological for spreadsheet
  const sortedSessions = [...sessions].reverse();

  const historyValues: any[][] = [historyHeaders];

  if (sortedSessions.length > 0) {
    sortedSessions.forEach((s, idx) => {
      const rowNum = idx + 2; // 1-based, header is row 1
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
    // Add default template row with current bankroll if empty
    historyValues.push([
      new Date().toLocaleDateString('pt-BR'),
      config?.initialBankroll || 1596.8,
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

  // Clear previous values first to avoid dangling rows if sessions were deleted
  const clearResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Histórico & Diário!A:L:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  // If tab name isn't found, fallback to Sheet1 or continue
  if (!clearResp.ok && clearResp.status === 401) {
    await handleResponseError(clearResp);
  }

  const updateResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Histórico & Diário!A1?valueInputOption=USER_ENTERED`,
    {
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
    }
  );

  if (!updateResp.ok) {
    await handleResponseError(updateResp);
  }

  // 2. Populate Sheet 2: "Resumo & Configurações" if config is provided
  if (config) {
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

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Resumo & Configurações!A1?valueInputOption=USER_ENTERED`,
      {
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
      }
    ).catch((e) => console.warn('Could not update summary sheet:', e));
  }

  return true;
}

/**
 * Appends a daily session into an existing Google Spreadsheet.
 */
export async function syncSessionToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  session: DailySessionRecord,
  allSessions?: DailySessionRecord[],
  config?: BankrollConfig
) {
  // If we have all sessions, perform full sync to guarantee consistency
  if (allSessions && allSessions.length > 0) {
    return await syncAllSessionsToGoogleSheet(accessToken, spreadsheetId, allSessions, config);
  }

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
    await handleResponseError(resp);
  }

  return await resp.json();
}
