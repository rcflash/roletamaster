import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  Target,
  ShieldAlert,
  Calendar,
  PlusCircle,
  Trash2,
  Edit3,
  CheckCircle2,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  BookmarkPlus,
  Save,
  RotateCcw,
  Coins,
  Filter,
  AlertCircle,
  Plus,
  Minus,
  Sparkles,
  TrendingUp,
  History,
  Download,
  Upload,
  HardDrive,
  Zap,
  ShieldCheck,
  FileJson,
  Check,
  FileSpreadsheet,
  Copy,
  ExternalLink,
  Table,
  Loader2,
  Cloud,
  LogOut
} from 'lucide-react';
import { BankrollConfig, SpinRecord, DailySessionRecord, StrategyConfig } from '../types';
import { initAuth, googleSignIn, googleLogout, getAccessToken } from '../services/googleAuth';
import { createGoogleBankrollSheet, syncSessionToGoogleSheet } from '../services/googleSheetsService';
import type { User } from 'firebase/auth';

interface BankrollControlPanelProps {
  config: BankrollConfig;
  spins: SpinRecord[];
  strategy?: StrategyConfig;
  dailySessions?: DailySessionRecord[];
  onUpdateDailySessions?: (sessions: DailySessionRecord[]) => void;
  onUpdateConfig: (newConfig: BankrollConfig) => void;
  onDeleteSpin?: (id: string) => void;
  onClearAllSpins?: () => void;
  onUpdateStrategy?: (updated: Partial<StrategyConfig>) => void;
}

const STORAGE_KEY_SESSIONS = 'roleta_master_daily_sessions_v1';
const STORAGE_KEY_SNAPSHOTS = 'roleta_master_backup_snapshots_v1';

interface BackupSnapshot {
  id: string;
  timestamp: number;
  dateFormatted: string;
  bankroll: number;
  sessionsCount: number;
  dailySessions: DailySessionRecord[];
  config: BankrollConfig;
}

export const BankrollControlPanel: React.FC<BankrollControlPanelProps> = ({
  config,
  spins,
  strategy,
  dailySessions: propDailySessions,
  onUpdateDailySessions,
  onUpdateConfig,
  onDeleteSpin,
  onClearAllSpins,
}) => {
  // Local state for Daily Sessions
  const [localDailySessions, setLocalDailySessions] = useState<DailySessionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const dailySessions = propDailySessions ?? localDailySessions;

  const updateSessions = (updated: DailySessionRecord[]) => {
    if (onUpdateDailySessions) {
      onUpdateDailySessions(updated);
    } else {
      setLocalDailySessions(updated);
    }
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // State for Initial Bankroll configuration inline inputs
  const [editingBankroll, setEditingBankroll] = useState<string>(config.initialBankroll.toString());
  const [editingGoal, setEditingGoal] = useState<string>(config.dailyGoal.toString());
  const [editingStopLoss, setEditingStopLoss] = useState<string>(config.stopLossLimit.toString());
  const [editingSpinCost, setEditingSpinCost] = useState<string>((config.defaultSpinCost || 37.50).toString());
  const [bankrollSaveMsg, setBankrollSaveMsg] = useState<boolean>(false);

  // Default value per green and red based on active strategy
  const defaultValGreen = strategy?.customWinReturn || 90.0;
  const defaultValRed = config.defaultSpinCost || 37.50;

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [manualValGreen, setManualValGreen] = useState<string>(defaultValGreen.toString());
  const [manualValRed, setManualValRed] = useState<string>(defaultValRed.toString());
  const [manualInitialBankroll, setManualInitialBankroll] = useState<string>(config.initialBankroll.toString());

  // Sync config inputs if updated externally & default initial bankroll to latest final bankroll
  useEffect(() => {
    setEditingBankroll(config.initialBankroll.toString());
    setEditingGoal(config.dailyGoal.toString());
    setEditingStopLoss(config.stopLossLimit.toString());
    setEditingSpinCost((config.defaultSpinCost || 37.50).toString());
    if (!editingSessionId) {
      setManualValRed((config.defaultSpinCost || 37.50).toString());
      const latestBank = dailySessions.length > 0 ? dailySessions[0].finalBankroll : config.initialBankroll;
      setManualInitialBankroll(latestBank.toString());
    }
  }, [config.initialBankroll, config.dailyGoal, config.stopLossLimit, config.defaultSpinCost, editingSessionId, dailySessions]);

  useEffect(() => {
    if (!editingSessionId) {
      setManualValGreen((strategy?.customWinReturn || 90.0).toString());
    }
  }, [strategy?.customWinReturn, editingSessionId]);

  // State for NEW Manual Daily Entry by Greens and Reds (Default strictly to 0)
  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const [manualDate, setManualDate] = useState<string>(getTodayISO());
  const [manualGreenCount, setManualGreenCount] = useState<number>(0);
  const [manualRedCount, setManualRedCount] = useState<number>(0);
  const [manualNotes, setManualNotes] = useState<string>('');

  // Compound projections settings
  const [projectionDays, setProjectionDays] = useState<number>(14);
  const [projectionDailyGoalPct, setProjectionDailyGoalPct] = useState<number>(10);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<boolean>(false);

  // Filter for Plays Log
  const [playsFilter, setPlaysFilter] = useState<'ALL' | 'VALENDO' | 'WINS' | 'LOSSES'>('VALENDO');

  // Modal and notification state for bankroll reset
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetSpinsAlso, setResetSpinsAlso] = useState<boolean>(true);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<boolean>(false);

  // Backup & Quick Restoration State
  const [customRestoreInput, setCustomRestoreInput] = useState<string>('1596.80');
  const [quickRestoreMsg, setQuickRestoreMsg] = useState<string | null>(null);
  const [showBackupModal, setShowBackupModal] = useState<boolean>(false);
  const [showGoogleSheetsModal, setShowGoogleSheetsModal] = useState<boolean>(false);
  const [copiedSheetsMsg, setCopiedSheetsMsg] = useState<string | null>(null);
  const [importErrorMsg, setImportErrorMsg] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Workspace Integration State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [createdSheetUrl, setCreatedSheetUrl] = useState<string | null>(() => {
    return localStorage.getItem('google_sheet_url') || null;
  });
  const [createdSheetId, setCreatedSheetId] = useState<string | null>(() => {
    return localStorage.getItem('google_sheet_id') || null;
  });
  const [googleSyncMsg, setGoogleSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setGoogleSyncMsg(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        setGoogleSyncMsg(`✅ Conectado com sucesso como ${res.user.displayName || res.user.email}!`);
      }
    } catch (e: any) {
      console.error(e);
      setGoogleSyncMsg(`❌ Erro ao conectar Google: ${e.message || 'Permissão negada'}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    await googleLogout();
    setGoogleUser(null);
    setGoogleToken(null);
    setGoogleSyncMsg('Desconectado do Google.');
  };

  const handleCreateRealGoogleSheet = async () => {
    setIsGoogleLoading(true);
    setGoogleSyncMsg(null);
    try {
      let token = googleToken || (await getAccessToken());
      if (!token) {
        const loginRes = await googleSignIn();
        if (!loginRes) throw new Error('Não foi possível autenticar no Google');
        token = loginRes.accessToken;
        setGoogleUser(loginRes.user);
        setGoogleToken(token);
      }

      setGoogleSyncMsg('⏳ Criando planilha oficial no seu Google Drive com fórmulas...');
      const res = await createGoogleBankrollSheet(token, dailySessions, config);
      setCreatedSheetUrl(res.spreadsheetUrl);
      setCreatedSheetId(res.spreadsheetId);
      localStorage.setItem('google_sheet_url', res.spreadsheetUrl);
      localStorage.setItem('google_sheet_id', res.spreadsheetId);
      setGoogleSyncMsg('🎉 Planilha criada e sincronizada com sucesso no seu Google Drive!');
    } catch (e: any) {
      console.error(e);
      setGoogleSyncMsg(`❌ Falha ao criar planilha: ${e.message || 'Erro inesperado'}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSyncLatestSessionToSheet = async () => {
    if (!createdSheetId) {
      setGoogleSyncMsg('Crie a planilha primeiro para sincronizar.');
      return;
    }
    if (dailySessions.length === 0) {
      setGoogleSyncMsg('Nenhuma sessão registrada para sincronizar.');
      return;
    }
    setIsGoogleLoading(true);
    try {
      let token = googleToken || (await getAccessToken());
      if (!token) {
        const loginRes = await googleSignIn();
        if (!loginRes) throw new Error('Autenticação necessária');
        token = loginRes.accessToken;
        setGoogleUser(loginRes.user);
        setGoogleToken(token);
      }
      setGoogleSyncMsg('⏳ Sincronizando última sessão...');
      await syncSessionToGoogleSheet(token, createdSheetId, dailySessions[0]);
      setGoogleSyncMsg('✅ Última sessão adicionada à sua planilha no Google Sheets!');
    } catch (e: any) {
      console.error(e);
      setGoogleSyncMsg(`❌ Erro de sincronização: ${e.message}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Snapshots storage state
  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SNAPSHOTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Save snapshots to localStorage
  const saveSnapshots = (updated: BackupSnapshot[]) => {
    setSnapshots(updated);
    try {
      localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Auto-record snapshot periodically or upon meaningful state changes
  const createSnapshot = (customNote?: string) => {
    const currentBank = dailySessions.length > 0 ? dailySessions[0].finalBankroll : config.initialBankroll;
    const now = Date.now();
    const newSnapshot: BackupSnapshot = {
      id: `snapshot-${now}`,
      timestamp: now,
      dateFormatted: new Date().toLocaleString('pt-BR'),
      bankroll: currentBank,
      sessionsCount: dailySessions.length,
      dailySessions: JSON.parse(JSON.stringify(dailySessions)),
      config: JSON.parse(JSON.stringify(config)),
    };

    // Keep up to 20 most recent snapshots
    const filtered = snapshots.filter((s) => now - s.timestamp > 1000 * 60); // avoid exact duplicate within 1 min
    const updated = [newSnapshot, ...filtered].slice(0, 20);
    saveSnapshots(updated);
  };

  // Save sessions to localStorage on change & trigger snapshot check
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(dailySessions));
    } catch (e) {
      console.error(e);
    }
  }, [dailySessions]);

  // Quick 1-Click Restore for R$ 1.596,80
  const handleQuickRestore1596 = () => {
    handleApplyCustomBankroll(1596.80, '⚡ Recomposição oficial de saldo de banca: R$ 1.596,80.');
  };

  // Apply custom bankroll balance directly
  const handleApplyCustomBankroll = (targetBalance: number, note?: string) => {
    if (isNaN(targetBalance) || targetBalance <= 0) return;

    // Update bankroll config
    onUpdateConfig({
      ...config,
      initialBankroll: targetBalance,
    });
    setEditingBankroll(targetBalance.toString());
    setManualInitialBankroll(targetBalance.toString());

    // Create a benchmark session record for today if desired
    const todayBR = new Date().toLocaleDateString('pt-BR');
    const existingToday = dailySessions.find((s) => s.date === todayBR);

    let updatedSessions: DailySessionRecord[];
    if (existingToday) {
      updatedSessions = dailySessions.map((s) =>
        s.id === existingToday.id
          ? {
              ...s,
              initialBankroll: targetBalance,
              finalBankroll: targetBalance,
              netProfit: 0,
              roiPct: 0,
              notes: note || `Saldo ajustado/restaurado para R$ ${targetBalance.toFixed(2)}.`,
            }
          : s
      );
    } else {
      const recoverySession: DailySessionRecord = {
        id: `session-restore-${Date.now()}`,
        date: todayBR,
        initialBankroll: targetBalance,
        finalBankroll: targetBalance,
        netProfit: 0,
        roiPct: 0,
        totalSpins: 0,
        winCount: 0,
        lossCount: 0,
        greenCount: 0,
        redCount: 0,
        valuePerGreen: strategy?.customWinReturn || 90.0,
        valuePerRed: config.defaultSpinCost || 37.50,
        goalMet: false,
        stopLossHit: false,
        notes: note || `⚡ Saldo de banca restaurado para R$ ${targetBalance.toFixed(2)}.`,
      };
      updatedSessions = [recoverySession, ...dailySessions];
    }

    updateSessions(updatedSessions);

    // Save snapshot
    const now = Date.now();
    const snap: BackupSnapshot = {
      id: `snapshot-${now}`,
      timestamp: now,
      dateFormatted: new Date().toLocaleString('pt-BR'),
      bankroll: targetBalance,
      sessionsCount: updatedSessions.length,
      dailySessions: updatedSessions,
      config: { ...config, initialBankroll: targetBalance },
    };
    saveSnapshots([snap, ...snapshots].slice(0, 20));

    setQuickRestoreMsg(`✅ Saldo restaurado com sucesso para R$ ${targetBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}!`);
    setTimeout(() => setQuickRestoreMsg(null), 6000);
  };

  // Download Full JSON Backup
  const handleDownloadBackupJson = () => {
    const currentBank = dailySessions.length > 0 ? dailySessions[0].finalBankroll : config.initialBankroll;
    const backupData = {
      version: '1.0',
      type: 'ROLETA_MASTER_BANKROLL_BACKUP',
      exportDate: new Date().toISOString(),
      exportDateBR: new Date().toLocaleString('pt-BR'),
      currentBalance: currentBank,
      config,
      dailySessions,
      spinsCount: spins.length,
      spins,
      strategy,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_banca_roleta_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setImportSuccessMsg('📥 Arquivo de backup JSON baixado com sucesso!');
    setTimeout(() => setImportSuccessMsg(null), 4000);
  };

  // Import JSON Backup File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed.config) {
          onUpdateConfig(parsed.config);
        }

        if (parsed.dailySessions && Array.isArray(parsed.dailySessions)) {
          updateSessions(parsed.dailySessions);
        }

        // Take snapshot
        const now = Date.now();
        const snap: BackupSnapshot = {
          id: `snapshot-import-${now}`,
          timestamp: now,
          dateFormatted: new Date().toLocaleString('pt-BR'),
          bankroll: parsed.currentBalance || (parsed.config ? parsed.config.initialBankroll : 100),
          sessionsCount: parsed.dailySessions ? parsed.dailySessions.length : 0,
          dailySessions: parsed.dailySessions || [],
          config: parsed.config || config,
        };
        saveSnapshots([snap, ...snapshots].slice(0, 20));

        setImportSuccessMsg('✅ Backup importado e restaurado com sucesso!');
        setImportErrorMsg(null);
        setTimeout(() => {
          setImportSuccessMsg(null);
          setShowBackupModal(false);
        }, 3000);
      } catch (err: any) {
        setImportErrorMsg('❌ Erro ao ler o arquivo JSON de backup: Formato inválido.');
        console.error(err);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Restore specific snapshot
  const handleRestoreSnapshot = (snap: BackupSnapshot) => {
    if (snap.config) {
      onUpdateConfig(snap.config);
    }
    if (snap.dailySessions) {
      updateSessions(snap.dailySessions);
    }
    setImportSuccessMsg(`✅ Restaurado para o ponto de ${snap.dateFormatted} (Saldo: R$ ${snap.bankroll.toFixed(2)})!`);
    setTimeout(() => {
      setImportSuccessMsg(null);
      setShowBackupModal(false);
    }, 3000);
  };

  // Google Sheets / Excel: Export CSV with UTF-8 BOM
  const handleExportGoogleSheetsCsv = () => {
    const headers = [
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
      'Stop Loss Atingido',
      'Observações'
    ];

    const rows = dailySessions.map((s) => [
      `"${s.date}"`,
      s.initialBankroll.toFixed(2).replace('.', ','),
      s.greenCount || 0,
      s.redCount || 0,
      (s.valuePerGreen || 90).toFixed(2).replace('.', ','),
      (s.valuePerRed || 37.5).toFixed(2).replace('.', ','),
      s.netProfit.toFixed(2).replace('.', ','),
      s.finalBankroll.toFixed(2).replace('.', ','),
      s.roiPct.toFixed(2).replace('.', ',') + '%',
      s.goalMet ? 'SIM' : 'NÃO',
      s.stopLossHit ? 'SIM' : 'NÃO',
      `"${(s.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestao_banca_google_sheets_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setImportSuccessMsg('📊 Planilha CSV para Google Sheets / Excel gerada e baixada com sucesso!');
    setTimeout(() => setImportSuccessMsg(null), 4000);
  };

  // Google Sheets: Copy Tab-Delimited text to clipboard for instant Ctrl+V into Google Sheets
  const handleCopyForGoogleSheets = () => {
    const headers = [
      'Data',
      'Banca Inicial',
      'Greens',
      'Reds',
      'Valor Green',
      'Valor Red',
      'Lucro Líquido',
      'Banca Final',
      'ROI %',
      'Meta Batida',
      'Stop Loss',
      'Observações'
    ];

    const rows = dailySessions.map((s) => [
      s.date,
      s.initialBankroll.toFixed(2).replace('.', ','),
      s.greenCount || 0,
      s.redCount || 0,
      (s.valuePerGreen || 90).toFixed(2).replace('.', ','),
      (s.valuePerRed || 37.5).toFixed(2).replace('.', ','),
      s.netProfit.toFixed(2).replace('.', ','),
      s.finalBankroll.toFixed(2).replace('.', ','),
      s.roiPct.toFixed(2).replace('.', ',') + '%',
      s.goalMet ? 'SIM' : 'NÃO',
      s.stopLossHit ? 'SIM' : 'NÃO',
      s.notes || ''
    ]);

    const tsvContent = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopiedSheetsMsg('📋 Dados copiados com sucesso! Abra o Google Sheets e pressione Ctrl+V.');
      setTimeout(() => setCopiedSheetsMsg(null), 5000);
    }).catch(() => {
      setCopiedSheetsMsg('⚠️ Não foi possível copiar direto. Baixe o arquivo CSV.');
      setTimeout(() => setCopiedSheetsMsg(null), 4000);
    });
  };

  // Open sheets.new directly
  const handleOpenSheetsNew = () => {
    window.open('https://sheets.new', '_blank');
  };

  // Current session calculations from automatic spins
  const totalSpins = spins.length;
  const activeSpins = spins.filter((s) => s.giro > 100);
  const activeSpinsCount = activeSpins.length;

  // Calculate Net Profit & Current Balance
  const activeSpinsNetProfit = activeSpins.reduce((acc, s) => acc + s.netResult, 0);
  const baseBankroll = dailySessions.length > 0 ? dailySessions[0].finalBankroll : config.initialBankroll;
  const currentBalance = baseBankroll + activeSpinsNetProfit;
  const netProfit = currentBalance - config.initialBankroll;

  // Aggregate daily sessions profit by date for cumulative goal tracking
  const dateProfitMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    dailySessions.forEach((s) => {
      map[s.date] = (map[s.date] || 0) + s.netProfit;
    });
    return map;
  }, [dailySessions]);

  // Calculate Total Wagered Amount in active spins
  const totalWagered = spins.reduce(
    (acc, s) => acc + (s.winAmount > 0 || s.lossAmount > 0 ? s.winAmount - s.netResult : 0),
    0
  );

  // ROI calculations
  const bankrollGrowthPct =
    config.initialBankroll > 0 ? (netProfit / config.initialBankroll) * 100 : 0;

  const wageredRoiPct =
    totalWagered > 0
      ? (netProfit / totalWagered) * 100
      : activeSpinsCount > 0
      ? (netProfit / (activeSpinsCount * config.defaultSpinCost)) * 100
      : 0;

  const winsCount = spins.filter((s) => s.netResult > 0).length;

  // Daily Goal & Stop Loss status
  const goal = config.dailyGoal || 20;
  const stopLoss = config.stopLossLimit || 50;
  const isGoalReached = netProfit >= goal;
  const isStopLossHit = netProfit <= -stopLoss;

  const goalProgressPct = Math.max(0, Math.min(100, (netProfit / goal) * 100));
  const remainingToGoal = Math.max(0, goal - netProfit);
  const remainingToStopLoss = Math.max(0, stopLoss + netProfit);

  // Spin Risk % of Current Bankroll
  const spinRiskPct = currentBalance > 0 ? (config.defaultSpinCost / currentBalance) * 100 : 0;

  // Calculations for the current Green & Red entry form
  const parsedValGreen = parseFloat(manualValGreen.replace(',', '.')) || 0;
  const parsedValRed = parseFloat(manualValRed.replace(',', '.')) || 0;
  const parsedInitialBank = parseFloat(manualInitialBankroll.replace(',', '.')) || config.initialBankroll;

  const totalAmountWagered = (manualGreenCount + manualRedCount) * parsedValRed;
  const calculatedGrossGreenReturn = manualGreenCount * parsedValGreen;
  const calculatedNetGreenProfit = manualGreenCount * Math.max(0, parsedValGreen - parsedValRed);
  const calculatedRedLoss = manualRedCount * parsedValRed;

  // True Net Result = Gross Returns from Greens - Total Amount Wagered on all spins
  // (e.g., 2 Greens with R$ 90 return - 3 spins with R$ 37.50 stake = 180 - 112.50 = +R$ 67.50)
  const calculatedNetResult = calculatedGrossGreenReturn - totalAmountWagered;

  const calculatedFinalBank = parsedInitialBank + calculatedNetResult;
  const calculatedRoiPct = parsedInitialBank > 0 ? (calculatedNetResult / parsedInitialBank) * 100 : 0;
  const calculatedTotalEntries = manualGreenCount + manualRedCount;
  const calculatedWinRatePct = calculatedTotalEntries > 0 ? (manualGreenCount / calculatedTotalEntries) * 100 : 0;

  // Handle Save Initial Bankroll & Targets
  const handleSaveBankrollConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedBankroll = parseFloat(editingBankroll.replace(',', '.'));
    const parsedGoal = parseFloat(editingGoal.replace(',', '.'));
    const parsedStopLoss = parseFloat(editingStopLoss.replace(',', '.'));
    const parsedSpinCost = parseFloat(editingSpinCost.replace(',', '.'));

    if (!isNaN(parsedBankroll) && parsedBankroll > 0) {
      onUpdateConfig({
        ...config,
        initialBankroll: parsedBankroll,
        dailyGoal: !isNaN(parsedGoal) ? parsedGoal : config.dailyGoal,
        stopLossLimit: !isNaN(parsedStopLoss) ? parsedStopLoss : config.stopLossLimit,
        defaultSpinCost: !isNaN(parsedSpinCost) && parsedSpinCost > 0 ? parsedSpinCost : (config.defaultSpinCost || 37.50),
      });
      setBankrollSaveMsg(true);
      setTimeout(() => setBankrollSaveMsg(false), 3000);
    }
  };

  // Convert Date string (YYYY-MM-DD) to BR format (DD/MM/AAAA)
  const formatDateBR = (isoDateStr: string) => {
    if (!isoDateStr) return new Date().toLocaleDateString('pt-BR');
    if (isoDateStr.includes('/')) return isoDateStr;
    const parts = isoDateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDateStr;
  };

  // Handle Save Manual Entry by Greens/Reds
  const handleSaveManualSession = (e: React.FormEvent) => {
    e.preventDefault();

    const formattedDate = formatDateBR(manualDate);
    // Calculate total net profit for this date combining existing entries on same date + current entry
    const existingDateProfit = dailySessions
      .filter((s) => s.date === formattedDate && s.id !== editingSessionId)
      .reduce((acc, s) => acc + s.netProfit, 0);
    const dateTotalNetResult = existingDateProfit + calculatedNetResult;

    const goalMet = dateTotalNetResult >= config.dailyGoal;
    const stopLossHit = dateTotalNetResult <= -config.stopLossLimit;

    if (editingSessionId) {
      // Update existing record
      const updated = dailySessions.map((s) =>
        s.id === editingSessionId
          ? {
              ...s,
              date: formattedDate,
              initialBankroll: parsedInitialBank,
              finalBankroll: calculatedFinalBank,
              netProfit: calculatedNetResult,
              roiPct: calculatedRoiPct,
              totalSpins: calculatedTotalEntries,
              winCount: manualGreenCount,
              lossCount: manualRedCount,
              greenCount: manualGreenCount,
              redCount: manualRedCount,
              valuePerGreen: parsedValGreen,
              valuePerRed: parsedValRed,
              goalMet,
              stopLossHit,
              notes: manualNotes || s.notes || `Lançamento: ${manualGreenCount} Greens e ${manualRedCount} Reds.`,
            }
          : s
      );
      updateSessions(updated);
      setEditingSessionId(null);
    } else {
      // Add new record
      const newRecord: DailySessionRecord = {
        id: `session-${Date.now()}`,
        date: formattedDate,
        initialBankroll: parsedInitialBank,
        finalBankroll: calculatedFinalBank,
        netProfit: calculatedNetResult,
        roiPct: calculatedRoiPct,
        totalSpins: calculatedTotalEntries,
        winCount: manualGreenCount,
        lossCount: manualRedCount,
        greenCount: manualGreenCount,
        redCount: manualRedCount,
        valuePerGreen: parsedValGreen,
        valuePerRed: parsedValRed,
        goalMet,
        stopLossHit,
        notes: manualNotes || `Lançamento de ${manualGreenCount} Greens e ${manualRedCount} Reds.`,
      };

      updateSessions([newRecord, ...dailySessions]);
    }

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);

    // Reset notes and reset green/red counters to 0
    setManualNotes('');
    setManualGreenCount(0);
    setManualRedCount(0);
  };

  // Populate form for editing existing session
  const handleStartEditSession = (session: DailySessionRecord) => {
    setEditingSessionId(session.id);
    if (session.date.includes('/')) {
      const parts = session.date.split('/');
      if (parts.length === 3) {
        setManualDate(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
      } else {
        setManualDate(getTodayISO());
      }
    } else {
      setManualDate(session.date);
    }

    setManualGreenCount(session.greenCount !== undefined ? session.greenCount : session.winCount || 0);
    setManualRedCount(session.redCount !== undefined ? session.redCount : (session.lossCount || 0));
    if (session.valuePerGreen) setManualValGreen(session.valuePerGreen.toString());
    if (session.valuePerRed) setManualValRed(session.valuePerRed.toString());
    setManualInitialBankroll(session.initialBankroll.toString());
    setManualNotes(session.notes || '');
  };

  // Cancel edit mode
  const handleCancelEditSession = () => {
    setEditingSessionId(null);
    setManualNotes('');
    setManualDate(getTodayISO());
    setManualGreenCount(0);
    setManualRedCount(0);
    setManualValGreen((strategy?.customWinReturn || 90.0).toString());
    setManualValRed((config.defaultSpinCost || 37.50).toString());
    setManualInitialBankroll(config.initialBankroll.toString());
  };

  // Quick Save Current Auto Session
  const handleSaveCurrentSessionAuto = () => {
    const todayStr = new Date().toLocaleDateString('pt-BR');
    const existingIdx = dailySessions.findIndex((s) => s.date === todayStr);

    const newRecord: DailySessionRecord = {
      id: `session-${Date.now()}`,
      date: todayStr,
      initialBankroll: config.initialBankroll,
      finalBankroll: currentBalance,
      netProfit,
      roiPct: bankrollGrowthPct,
      totalSpins,
      winCount: winsCount,
      lossCount: spins.filter((s) => s.netResult < 0).length,
      greenCount: winsCount,
      redCount: spins.filter((s) => s.netResult < 0).length,
      goalMet: isGoalReached,
      stopLossHit: isStopLossHit,
      notes: manualNotes || 'Sessão gravada automaticamente pelos giros da roleta.',
    };

    if (existingIdx >= 0) {
      const updated = [...dailySessions];
      updated[existingIdx] = newRecord;
      updateSessions(updated);
    } else {
      updateSessions([newRecord, ...dailySessions]);
    }

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  const handleDeleteSession = (id: string) => {
    updateSessions(dailySessions.filter((s) => s.id !== id));
  };

  // Reset ALL bankroll sessions and optionally clear table spins
  const handleResetAllSessions = () => {
    updateSessions([]);
    setManualGreenCount(0);
    setManualRedCount(0);
    setManualNotes('');
    setEditingSessionId(null);

    if (resetSpinsAlso && onClearAllSpins) {
      onClearAllSpins();
    }

    setShowResetModal(false);
    setResetSuccessMsg(true);
    setTimeout(() => setResetSuccessMsg(false), 4000);
  };

  // Compound Growth Projections
  const compoundProjections = React.useMemo(() => {
    const list = [];
    let b = config.initialBankroll;
    const rate = projectionDailyGoalPct / 100;

    for (let day = 1; day <= projectionDays; day++) {
      const dailyProfit = b * rate;
      b += dailyProfit;
      list.push({
        day,
        balance: b,
        dailyProfit,
        totalGain: b - config.initialBankroll,
      });
    }
    return list;
  }, [config.initialBankroll, projectionDays, projectionDailyGoalPct]);

  // Summary Metrics from Daily Saved Sessions (aggregated by distinct operational date)
  const totalManualProfit = dailySessions.reduce((acc, s) => acc + s.netProfit, 0);
  const uniqueDates = Object.keys(dateProfitMap);
  const totalDaysCount = uniqueDates.length;
  const avgProfitPerDay = totalDaysCount > 0 ? totalManualProfit / totalDaysCount : 0;
  const greenDaysCount = uniqueDates.filter((d) => dateProfitMap[d] > 0).length;
  const redDaysCount = uniqueDates.filter((d) => dateProfitMap[d] < 0).length;

  // Filtered Plays for Automatic Plays Section
  const filteredSpins = React.useMemo(() => {
    const list = [...spins].reverse();
    if (playsFilter === 'VALENDO') return list.filter((s) => s.giro > 100 || s.winAmount > 0 || s.lossAmount > 0);
    if (playsFilter === 'WINS') return list.filter((s) => s.netResult > 0);
    if (playsFilter === 'LOSSES') return list.filter((s) => s.netResult < 0);
    return list;
  }, [spins, playsFilter]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 🛡️ CENTRAL DE RECUPERAÇÃO RÁPIDA & BACKUP DE BANCA */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Segurança & Continuidade</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30">
                  Auto-Backup Ativo
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-100 flex items-center gap-2">
                🛡️ Restauração Rápida & Backup da Banca
              </h3>
            </div>
          </div>

          {/* Ações Rápidas de Backup e Restauração */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowGoogleSheetsModal(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all"
              title="Abrir ferramentas e modelo para Google Sheets e Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>📊 Planilha Google Sheets</span>
            </button>

            <button
              onClick={handleDownloadBackupJson}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all shadow-sm"
              title="Baixar arquivo JSON completo com todas as sessões e configurações"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Baixar Backup (.json)</span>
            </button>

            <button
              onClick={() => setShowBackupModal(true)}
              className="px-3.5 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-indigo-500/40 transition-all shadow-sm"
              title="Carregar arquivo de backup ou ver histórico de pontos de restauração automática"
            >
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span>Restaurar / Snapshots ({snapshots.length})</span>
            </button>
          </div>
        </div>

        {/* Notificação de Sucesso */}
        {quickRestoreMsg && (
          <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{quickRestoreMsg}</span>
          </div>
        )}

        {importSuccessMsg && (
          <div className="p-3.5 bg-indigo-950/80 border border-indigo-500/50 rounded-2xl text-indigo-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-indigo-400" />
            <span>{importSuccessMsg}</span>
          </div>
        )}

        {/* Resgate Rápido: Botão 1-Clique R$ 1.596,80 e Input Personalizado */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          {/* Botão Rápido de Resgate */}
          <div className="md:col-span-6 bg-emerald-950/40 border border-emerald-500/40 p-3.5 rounded-2xl flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">Recuperação Imediata</span>
              <div className="text-sm font-black text-slate-100">Restaurar Saldo de R$ 1.596,80</div>
              <span className="text-[11px] text-slate-400">Recompõe seu saldo oficial de manhã com 1 clique</span>
            </div>

            <button
              type="button"
              onClick={handleQuickRestore1596}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 shrink-0 transform hover:scale-105"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Restaurar R$ 1.596,80</span>
            </button>
          </div>

          {/* Ajuste Livre de Saldo */}
          <div className="md:col-span-6 bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Definir Outro Saldo Atual</span>
              <div className="relative mt-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={customRestoreInput}
                  onChange={(e) => setCustomRestoreInput(e.target.value)}
                  placeholder="1596.80"
                  className="w-full pl-8 pr-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const val = parseFloat(customRestoreInput.replace(',', '.'));
                if (!isNaN(val) && val > 0) {
                  handleApplyCustomBankroll(val);
                }
              }}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-all shrink-0 mt-3"
            >
              Aplicar Saldo
            </button>
          </div>
        </div>
      </div>

      {/* LANÇAMENTO AUTOMÁTICO DIÁRIO APENAS INFORMANDO GREENS E REDS */}
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Lançamento Direto</span>
              <h3 className="text-xl font-black text-slate-100">
                {editingSessionId ? '✏️ Editar Lançamento do Dia' : '➕ Lançar Resultado do Dia por Greens e Reds'}
              </h3>
            </div>
          </div>

          {editingSessionId && (
            <button
              onClick={handleCancelEditSession}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Cancelar Edição
            </button>
          )}
        </div>

        <form onSubmit={handleSaveManualSession} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Coluna 1: Data e Saldo Base */}
            <div className="space-y-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider block border-b border-slate-800 pb-2">
                1. Configuração do Dia
              </span>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Data do Dia:</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Banca Inicial do Dia (R$):</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={manualInitialBankroll}
                    onChange={(e) => setManualInitialBankroll(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Observações:</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="Ex: Operou à tarde na mesa VIP"
                />
              </div>
            </div>

            {/* Coluna 2: Contadores de GREENS e REDS */}
            <div className="space-y-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider block border-b border-slate-800 pb-2">
                2. Informar Greens e Reds
              </span>

              {/* Quantidade de GREENS */}
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-emerald-400 flex items-center gap-1">
                    🟢 Quantidade de GREENS (Vitórias):
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setManualGreenCount(Math.max(0, manualGreenCount - 1))}
                    className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 font-black flex items-center justify-center shrink-0"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min="0"
                    value={manualGreenCount}
                    onChange={(e) => setManualGreenCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full py-1.5 bg-slate-900 border border-emerald-500/40 rounded-xl text-center text-lg font-mono font-black text-emerald-400 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setManualGreenCount(manualGreenCount + 1)}
                    className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 font-black flex items-center justify-center shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Retorno Bruto/Green (R$):</span>
                  <input
                    type="number"
                    step="any"
                    value={manualValGreen}
                    onChange={(e) => setManualValGreen(e.target.value)}
                    className="w-24 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-right font-mono text-emerald-300 font-bold"
                  />
                </div>
                <div className="text-[10px] text-slate-500 text-right">
                  Lucro líq: R$ {Math.max(0, parsedValGreen - parsedValRed).toFixed(2)} / vitória
                </div>
              </div>

              {/* Quantidade de REDS */}
              <div className="bg-rose-950/40 border border-rose-500/30 p-3.5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black uppercase text-rose-400 flex items-center gap-1">
                    🔴 Quantidade de REDS (Derrotas):
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setManualRedCount(Math.max(0, manualRedCount - 1))}
                    className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 border border-rose-500/30 font-black flex items-center justify-center shrink-0"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min="0"
                    value={manualRedCount}
                    onChange={(e) => setManualRedCount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full py-1.5 bg-slate-900 border border-rose-500/40 rounded-xl text-center text-lg font-mono font-black text-rose-400 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => setManualRedCount(manualRedCount + 1)}
                    className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 border border-rose-500/30 font-black flex items-center justify-center shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Aposta/Custo por Giro (R$):</span>
                  <input
                    type="number"
                    step="any"
                    value={manualValRed}
                    onChange={(e) => setManualValRed(e.target.value)}
                    className="w-24 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-right font-mono text-rose-300 font-bold"
                  />
                </div>
                <div className="text-[10px] text-slate-500 text-right">
                  Valor apostado em cada giro
                </div>
              </div>
            </div>

            {/* Coluna 3: Prévia Automática dos Cálculos */}
            <div className="space-y-3 bg-gradient-to-b from-slate-950 to-indigo-950/40 p-4 rounded-2xl border border-indigo-500/30 flex flex-col justify-between">
              <span className="text-xs font-black uppercase text-indigo-400 tracking-wider block border-b border-indigo-500/20 pb-2">
                3. Cálculos Automáticos do Dia
              </span>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center text-emerald-400">
                  <span>🟢 Retorno Greens ({manualGreenCount}x R$ {parsedValGreen.toFixed(2)}):</span>
                  <span className="font-bold">+R$ {calculatedGrossGreenReturn.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-rose-400">
                  <span>🔴 Aposta Total ({calculatedTotalEntries} giros x R$ {parsedValRed.toFixed(2)}):</span>
                  <span className="font-bold">-R$ {totalAmountWagered.toFixed(2)}</span>
                </div>

                <div className="border-t border-slate-800 my-1 pt-2 flex justify-between items-center">
                  <span className="text-slate-300 font-bold">Resultado Líquido:</span>
                  <span className={`text-base font-black ${calculatedNetResult >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {calculatedNetResult >= 0 ? '+' : ''}R$ {calculatedNetResult.toFixed(2)}
                  </span>
                </div>

                <div className="bg-slate-900/80 p-2 rounded-xl text-[10px] text-slate-400 space-y-1 font-sans border border-slate-800">
                  <div className="flex justify-between">
                    <span>Lucro Líq. Greens ({manualGreenCount}x R$ {(parsedValGreen - parsedValRed).toFixed(2)}):</span>
                    <span className="text-emerald-400 font-bold">+R$ {calculatedNetGreenProfit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prejuízo Reds ({manualRedCount}x R$ {parsedValRed.toFixed(2)}):</span>
                    <span className="text-rose-400 font-bold">-R$ {calculatedRedLoss.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>Taxa de Acerto:</span>
                  <span className="text-teal-400 font-bold">{calculatedWinRatePct.toFixed(1)}% ({manualGreenCount}/{calculatedTotalEntries})</span>
                </div>

                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>ROI do Dia:</span>
                  <span className={`font-bold ${calculatedRoiPct >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                    {calculatedRoiPct >= 0 ? '+' : ''}{calculatedRoiPct.toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800/80">
                  <span>Banca Final Projetada:</span>
                  <span className="text-sm font-black text-amber-400">R$ {calculatedFinalBank.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{editingSessionId ? 'Atualizar Resultado do Dia' : 'Salvar Lançamento do Dia'}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Resumo Automático dos Lançamentos */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Ganho Acumulado</span>
            <span className={`text-base font-black ${totalManualProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalManualProfit >= 0 ? '+' : ''}{config.currency} {totalManualProfit.toFixed(2)}
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Média Diária de Lucro</span>
            <span className={`text-base font-black ${avgProfitPerDay >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
              {avgProfitPerDay >= 0 ? '+' : ''}{config.currency} {avgProfitPerDay.toFixed(2)}/dia
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Dias no Green</span>
            <span className="text-base font-black text-emerald-400 flex items-center justify-center gap-1">
              <ArrowUpRight className="w-4 h-4" /> {greenDaysCount} dias
            </span>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Dias no Red</span>
            <span className="text-base font-black text-rose-400 flex items-center justify-center gap-1">
              <ArrowDownRight className="w-4 h-4" /> {redDaysCount} dias
            </span>
          </div>
        </div>
      </div>

      {/* HISTÓRICO DE SESSÕES SALVAS DIÁRIAS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Histórico de Registros</span>
              <h3 className="text-lg font-black text-slate-100">Relatório de Resultados Diários Lancados</h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-bold">{dailySessions.length} dias registrados</span>
            {dailySessions.length > 0 && (
              <button
                onClick={() => setShowResetModal(true)}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/30 transition-colors flex items-center gap-1.5"
                title="Limpar todos os relatórios da banca"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Zerar Relatórios</span>
              </button>
            )}
          </div>
        </div>

        {dailySessions.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs italic">
            Nenhum registro encontrado. Use o formulário acima para lançar os Greens e Reds do dia.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Banca Inicial</th>
                  <th className="py-3 px-4">Greens / Reds</th>
                  <th className="py-3 px-4">Lucro Líquido</th>
                  <th className="py-3 px-4">Banca Final</th>
                  <th className="py-3 px-4">ROI %</th>
                  <th className="py-3 px-4">Status Meta</th>
                  <th className="py-3 px-4">Notas</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {dailySessions.map((s) => {
                  const dayTotalProfit = dateProfitMap[s.date] ?? s.netProfit;
                  const isDayGoalMet = dayTotalProfit >= config.dailyGoal;
                  const isDayStopLossHit = dayTotalProfit <= -config.stopLossLimit;

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-200">{s.date}</td>
                      <td className="py-3 px-4 text-slate-300">
                        {config.currency} {s.initialBankroll.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-400 font-bold">{s.greenCount !== undefined ? s.greenCount : s.winCount} 🟢</span>
                        {' / '}
                        <span className="text-rose-400 font-bold">{s.redCount !== undefined ? s.redCount : (s.lossCount || 0)} 🔴</span>
                      </td>
                      <td className={`py-3 px-4 font-black ${s.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {s.netProfit >= 0 ? '+' : ''}{config.currency} {s.netProfit.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-100">
                        {config.currency} {s.finalBankroll.toFixed(2)}
                      </td>
                      <td className={`py-3 px-4 font-bold ${s.roiPct >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                        {s.roiPct >= 0 ? '+' : ''}{s.roiPct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        {isDayGoalMet ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                            Meta Batida 🎉
                          </span>
                        ) : isDayStopLossHit ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                            Stop Loss 🔴
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                            {s.netProfit >= 0 ? 'Positivo' : 'Negativo'}
                          </span>
                        )}
                      </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] max-w-[180px] truncate" title={s.notes}>
                      {s.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleStartEditSession(s)}
                          className="p-1.5 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors"
                          title="Editar este registro"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSession(s.id)}
                          className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                          title="Excluir este registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Card 1: Banca Inicial */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Banca Inicial</span>
          <span className="text-lg sm:text-xl font-black text-slate-100">
            {config.currency} {config.initialBankroll.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 block">Capital Base Configurado</span>
        </div>

        {/* Card 2: Saldo Atual */}
        <div className="bg-slate-900 border border-emerald-500/30 ring-1 ring-emerald-500/10 rounded-2xl p-4 space-y-1 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Saldo Atual</span>
          <span className="text-xl sm:text-2xl font-black text-emerald-400">
            {config.currency} {currentBalance.toFixed(2)}
          </span>
          <span className="text-[10px] text-emerald-400/80 font-bold block flex items-center gap-0.5">
            {netProfit >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3 text-rose-400" />}
            {bankrollGrowthPct >= 0 ? '+' : ''}{bankrollGrowthPct.toFixed(1)}% de Banca
          </span>
        </div>

        {/* Card 3: Lucro Líquido */}
        <div
          className={`bg-slate-900 border rounded-2xl p-4 space-y-1 shadow-lg ${
            netProfit >= 0 ? 'border-emerald-500/30' : 'border-rose-500/30'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lucro Líquido</span>
          <span className={`text-xl sm:text-2xl font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netProfit >= 0 ? '+' : ''}{config.currency} {netProfit.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 block">
            {totalSpins <= 100 ? 'Amostragem' : `${activeSpinsCount} giros valendo`}
          </span>
        </div>

        {/* Card 4: ROI Operacional */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ROI sobre Apostas</span>
          <span className={`text-xl sm:text-2xl font-black ${wageredRoiPct >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
            {wageredRoiPct >= 0 ? '+' : ''}{wageredRoiPct.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500 block">Retorno / Volume Apostado</span>
        </div>

        {/* Card 5: Risco por Giro */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg col-span-2 sm:col-span-4 lg:col-span-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Exposição / Giro</span>
          <span
            className={`text-lg sm:text-xl font-black ${
              spinRiskPct > 10 ? 'text-rose-400' : spinRiskPct > 5 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {spinRiskPct.toFixed(1)}% da Banca
          </span>
          <span className="text-[10px] text-slate-400 block truncate">
            {config.currency} {(config.defaultSpinCost || 37.50).toFixed(2)} por giro
          </span>
        </div>
      </div>

      {/* Meta Diária & Stop Loss Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Goal Progress Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Metas Diárias</span>
                <h3 className="text-lg font-black text-slate-100">Progresso da Meta de Lucro</h3>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isGoalReached
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 animate-pulse'
                  : 'bg-slate-800 text-amber-400 border border-slate-700'
              }`}
            >
              {isGoalReached ? '🎉 META ALCANÇADA!' : `${goalProgressPct.toFixed(1)}% Concluído`}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-baseline text-xs font-bold">
              <span className="text-slate-300">
                Lucro Atual: <strong className="text-emerald-400">{config.currency} {netProfit.toFixed(2)}</strong>
              </span>
              <span className="text-slate-400">
                Alvo Diário: <strong className="text-amber-400">{config.currency} {goal.toFixed(2)}</strong>
              </span>
            </div>

            {/* Gauge Bar */}
            <div className="w-full bg-slate-950 h-4 rounded-full overflow-hidden p-1 border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isGoalReached
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-300 to-amber-300'
                    : 'bg-gradient-to-r from-amber-500 to-emerald-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(4, goalProgressPct))}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
              <span>
                Falta para bater a meta: <strong className="text-amber-300">{config.currency} {remainingToGoal.toFixed(2)}</strong>
              </span>
              <span>
                Crescimento: <strong className="text-slate-200">+{((goal / config.initialBankroll) * 100).toFixed(0)}% da Banca</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Stop Loss & Risk Safeguard Box */}
        <div
          className={`border rounded-3xl p-6 shadow-2xl space-y-5 transition-all ${
            isStopLossHit
              ? 'bg-rose-950/20 border-rose-800/80 ring-2 ring-rose-500/20'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2.5 rounded-2xl border ${
                  isStopLossHit
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Proteção da Banca</span>
                <h3 className="text-lg font-black text-slate-100">Escudo de Limite de Perda (Stop Loss)</h3>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isStopLossHit
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isStopLossHit ? '🔴 STOP LOSS ATINGIDO' : '🟢 DENTRO DO SEGURO'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-baseline text-xs font-bold">
              <span className="text-slate-300">
                Limite Tolerável: <strong className="text-rose-400">-{config.currency} {stopLoss.toFixed(2)}</strong>
              </span>
              <span className="text-slate-400">
                Folga de Segurança: <strong className="text-emerald-400">{config.currency} {remainingToStopLoss.toFixed(2)}</strong>
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <p className="text-xs text-slate-300 leading-relaxed">
                {isStopLossHit
                  ? '⚠️ Seu limite de perda de segurança foi atingido nesta sessão. O protocolo profissional determina encerrar as apostas e retornar apenas amanhã.'
                  : `Seu limite de Stop Loss está fixado em ${config.currency} ${stopLoss.toFixed(2)}. Isso representa uma proteção de ${((stopLoss / config.initialBankroll) * 100).toFixed(0)}% do seu capital inicial.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO DE LANÇAMENTO E EXCLUSÃO DE JOGADAS AUTOMÁTICAS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                Lançamento Automático de Jogadas
              </span>
              <h3 className="text-lg font-black text-slate-100">
                Histórico de Apostas da Roleta (Excluir entradas que não participou)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filtrar:
            </span>
            {(['VALENDO', 'ALL', 'WINS', 'LOSSES'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPlaysFilter(mode)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  playsFilter === mode
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {mode === 'VALENDO'
                  ? 'Apenas Apostas Realizadas'
                  : mode === 'ALL'
                  ? 'Todos os Giros'
                  : mode === 'WINS'
                  ? 'Somente Greens'
                  : 'Somente Reds'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            <strong>Dica de Controle:</strong> Os giros são gravados automaticamente. Se você <strong>não entrou</strong> em alguma aposta gerada pelo robô, basta clicar no botão de <strong>Excluir Jogada 🗑️</strong> para removê-la do cálculo de banca!
          </span>
        </div>

        {filteredSpins.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs italic">
            Nenhuma jogada encontrada com o filtro selecionado. Adicione giros na mesa para ver os resultados aqui!
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
            <table className="w-full text-left text-xs relative">
              <thead className="bg-slate-950 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-800 z-10">
                <tr>
                  <th className="py-2.5 px-3">Giro</th>
                  <th className="py-2.5 px-3">Número</th>
                  <th className="py-2.5 px-3">Entrada Sugerida</th>
                  <th className="py-2.5 px-3">Aposta</th>
                  <th className="py-2.5 px-3">Retorno</th>
                  <th className="py-2.5 px-3">Resultado</th>
                  <th className="py-2.5 px-3">Saldo Banca</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredSpins.map((s) => {
                  const isWin = s.netResult > 0;
                  const isLoss = s.netResult < 0;
                  const totalBetOnSpin = s.winAmount > 0 || s.lossAmount > 0 ? s.winAmount - s.netResult : 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">#{s.giro}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black text-white ${
                            s.color === 'red'
                              ? 'bg-rose-600'
                              : s.color === 'black'
                              ? 'bg-slate-800 border border-slate-700'
                              : 'bg-emerald-600'
                          }`}
                        >
                          {s.numero}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 text-[11px]">
                        {s.nextBetSuggestion || 'Vizinhos do Cilindro'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {totalBetOnSpin > 0 ? `R$ ${totalBetOnSpin.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-indigo-300 font-bold">
                        {s.winAmount > 0 ? `R$ ${s.winAmount.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        {isWin ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] inline-flex items-center gap-1">
                            GREEN (+R$ {s.netResult.toFixed(2)})
                          </span>
                        ) : isLoss ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px] inline-flex items-center gap-1">
                            RED (R$ {s.netResult.toFixed(2)})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                            Amostragem / Neutro
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                        {config.currency} {s.accumulatedBalance.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {onDeleteSpin && (
                          <button
                            onClick={() => onDeleteSpin(s.id)}
                            className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-bold transition-all inline-flex items-center gap-1"
                            title="Excluir esta jogada (não entrei na aposta)"
                          >
                            <Trash2 className="w-3 h-3" /> Excluir Jogada
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SIMULADOR DE JUROS COMPOSTOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400 border border-amber-500/20">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Simulador Avançado</span>
              <h3 className="text-xl font-black text-slate-100">Projeção de Juros Compostos Diários</h3>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-bold">Dias:</span>
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setProjectionDays(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                    projectionDays === d ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d} dias
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-bold">Meta Diária:</span>
              {[5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setProjectionDailyGoalPct(pct)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                    projectionDailyGoalPct === pct ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Dia</th>
                <th className="py-3 px-4">Meta (%)</th>
                <th className="py-3 px-4">Lucro do Dia</th>
                <th className="py-3 px-4">Saldo Acumulado</th>
                <th className="py-3 px-4">Lucro Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {compoundProjections.map((p) => (
                <tr key={p.day} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-300">Dia {p.day}</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">+{projectionDailyGoalPct}%</td>
                  <td className="py-3 px-4 text-emerald-300 font-mono">
                    +{config.currency} {p.dailyProfit.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-100">
                    {config.currency} {p.balance.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-emerald-400 font-mono font-bold">
                    +{config.currency} {p.totalGain.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Header Banner & Informações Gerais */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-full flex items-center gap-1 shadow-md">
                <Wallet className="w-3.5 h-3.5" /> Gestão de Banca & Lançamentos
              </span>
              <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg border border-slate-700">
                Lançamento Rápido de Greens e Reds
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Painel de Gestão de Banca e Resultados
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Defina seu Saldo Inicial de banca, configure suas metas e lance seus resultados diários informando apenas a quantidade de <strong>Greens 🟢</strong> e <strong>Reds 🔴</strong> do dia!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSaveCurrentSessionAuto}
              className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl transition-all flex items-center gap-2 shrink-0 hover:scale-[1.02]"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>Gravar Giros Atuais do Robô</span>
            </button>

            <button
              onClick={() => setShowResetModal(true)}
              className="px-4 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold border border-rose-500/40 text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2 shrink-0 hover:scale-[1.02]"
              title="Zerar todos os lançamentos para começar do zero"
            >
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>Reset Geral de Banca</span>
            </button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>Resultado diário gravado com sucesso no relatório local!</span>
          </div>
        )}

        {resetSuccessMsg && (
          <div className="mt-4 p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>Todos os lançamentos de banca foram zerados com sucesso! Você está começando do zero.</span>
          </div>
        )}
      </div>

      {/* CONFIGURAÇÃO DO SALDO INICIAL DA BANCA */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Lançamento Base</span>
              <h3 className="text-base font-black text-slate-100">Configurar Saldo Inicial e Metas da Banca</h3>
            </div>
          </div>

          {bankrollSaveMsg && (
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-500/40 flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saldo Inicial atualizado com sucesso!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveBankrollConfig} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Saldo Inicial da Banca (R$):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
              <input
                type="number"
                step="any"
                min="0.01"
                value={editingBankroll}
                onChange={(e) => setEditingBankroll(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                placeholder="100.00"
              />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Capital inicial base para cálculo do ROI.</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Meta Diária de Lucro (R$):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
              <input
                type="number"
                step="any"
                min="0.01"
                value={editingGoal}
                onChange={(e) => setEditingGoal(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                placeholder="20.00"
              />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Alvo diário desejado de lucro.</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Limite de Stop Loss (R$):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
              <input
                type="number"
                step="any"
                min="0.01"
                value={editingStopLoss}
                onChange={(e) => setEditingStopLoss(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-rose-400 focus:outline-none focus:border-rose-500"
                placeholder="50.00"
              />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Perda máxima permitida por dia.</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Aposta Mínima / Custo por Red (R$):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">R$</span>
              <input
                type="number"
                step="any"
                min="0.01"
                value={editingSpinCost}
                onChange={(e) => setEditingSpinCost(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-indigo-400 focus:outline-none focus:border-indigo-500"
                placeholder="37.50"
              />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">Ex: R$ 37,50 (15 fichas x R$ 2,50 na Mesa BR).</span>
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Configuração de Banca</span>
            </button>
          </div>
        </form>
      </div>

      {/* BACKUP & RESTAURAÇÃO MODAL */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/30">
                  <HardDrive className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-100">Central de Backup & Restauração</h3>
                  <p className="text-xs text-indigo-400 font-bold">Importe arquivos ou restaure pontos automáticos</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBackupModal(false);
                  setImportErrorMsg(null);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            {importErrorMsg && (
              <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold">
                {importErrorMsg}
              </div>
            )}

            {importSuccessMsg && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold">
                {importSuccessMsg}
              </div>
            )}

            {/* SEÇÃO 1: IMPORTAR ARQUIVO JSON */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <FileJson className="w-4 h-4" /> Importar Arquivo de Backup (.json)
                </span>
                <span className="text-[10px] text-slate-500">Do computador ou celular</span>
              </div>
              <p className="text-xs text-slate-400">
                Selecione um arquivo de backup previamente exportado para recuperar todas as sessões e bancas.
              </p>

              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="backup-file-input"
                />
                <label
                  htmlFor="backup-file-input"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2 transition-all shadow-md"
                >
                  <Upload className="w-4 h-4" />
                  <span>Selecionar Arquivo JSON</span>
                </label>
                <button
                  type="button"
                  onClick={handleDownloadBackupJson}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-2 border border-slate-700 transition-all"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Baixar Backup Agora</span>
                </button>
              </div>
            </div>

            {/* SEÇÃO 2: SNAPSHOTS AUTOMÁTICOS */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4" /> Pontos de Restauração Automática ({snapshots.length})
                </span>
                <span className="text-[10px] text-emerald-400">Salvos no Navegador</span>
              </div>
              <p className="text-xs text-slate-400">
                O sistema salva snapshots automáticos das suas sessões. Clique em "Restaurar" para voltar ao estado de qualquer ponto salvo:
              </p>

              {snapshots.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  Nenhum snapshot automático registrado ainda. Eles são criados conforme você opera.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 hover:border-indigo-500/40 flex items-center justify-between gap-3 transition-all"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-200">{snap.dateFormatted}</div>
                        <div className="text-[11px] text-emerald-400 font-mono font-bold">
                          Banca: R$ {snap.bankroll.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({snap.sessionsCount} lançamentos)
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRestoreSnapshot(snap)}
                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-white rounded-lg text-xs font-bold border border-emerald-500/30 transition-all flex items-center gap-1 shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurar</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowBackupModal(false);
                  setImportErrorMsg(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE SHEETS MODAL */}
      {showGoogleSheetsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/30">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
                    Planilha Google Sheets da Gestão de Banca
                  </h3>
                  <p className="text-xs text-emerald-400 font-bold">
                    Tenha sua planilha oficial no Google para nunca perder seu histórico
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowGoogleSheetsModal(false);
                  setCopiedSheetsMsg(null);
                }}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700"
              >
                ✕
              </button>
            </div>

            {copiedSheetsMsg && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{copiedSheetsMsg}</span>
              </div>
            )}

            {googleSyncMsg && (
              <div className="p-3 bg-slate-950 border border-indigo-500/40 rounded-xl text-indigo-300 text-xs font-bold flex items-center gap-2">
                <Cloud className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{googleSyncMsg}</span>
              </div>
            )}

            {/* SEÇÃO 1: CRIAR DIRETAMENTE NO SEU GOOGLE DRIVE / GOOGLE SHEETS COM AUTOMAÇÃO */}
            <div className="p-4 bg-gradient-to-br from-emerald-950/40 to-slate-950 rounded-2xl border border-emerald-500/40 space-y-3.5 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg">
                    <Cloud className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-xs font-black uppercase text-emerald-300 tracking-wider">
                      Criação Automática no seu Google Drive
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Gera uma planilha oficial com abas, fórmulas automáticas e proteção
                    </p>
                  </div>
                </div>

                {googleUser ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
                      👤 {googleUser.displayName || googleUser.email}
                    </span>
                    <button
                      type="button"
                      onClick={handleGoogleLogout}
                      className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900 rounded-lg border border-slate-800"
                      title="Desconectar conta Google"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isGoogleLoading}
                    className="px-3 py-1.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow"
                  >
                    {isGoogleLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Conectar Google</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleCreateRealGoogleSheet}
                  disabled={isGoogleLoading}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  )}
                  <span>{createdSheetId ? 'Recriar / Atualizar Planilha no Google' : 'Criar Minha Planilha no Google Drive'}</span>
                </button>

                {createdSheetUrl && (
                  <a
                    href={createdSheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-md transition-all"
                  >
                    <ExternalLink className="w-4 h-4 text-indigo-200" />
                    <span>Abrir Minha Planilha no Google Sheets</span>
                  </a>
                )}

                {createdSheetId && dailySessions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSyncLatestSessionToSheet}
                    disabled={isGoogleLoading}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition-all disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sincronizar Última Sessão</span>
                  </button>
                )}
              </div>
            </div>

            {/* OPÇÃO 2: COPIAR E COLAR COM 1 CLIQUE */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <Copy className="w-4 h-4" /> Opção Manual Rápida (Copiar e Colar)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="w-5 h-5 bg-emerald-500/20 text-emerald-300 rounded-full flex items-center justify-center text-[11px] font-black">1</span>
                    Copiar Dados do Sistema
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Copia todas as {dailySessions.length} sessões formatadas em colunas perfeitamente alinhadas.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyForGoogleSheets}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Tabela (Ctrl+C)</span>
                  </button>
                </div>

                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="w-5 h-5 bg-indigo-500/20 text-indigo-300 rounded-full flex items-center justify-center text-[11px] font-black">2</span>
                    Abrir Google Sheets
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Abre uma nova planilha em branco no seu Google Drive. Basta clicar na célula A1 e apertar <strong>Ctrl + V</strong>!
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenSheetsNew}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Criar no Google Sheets</span>
                  </button>
                </div>
              </div>
            </div>

            {/* OPÇÃO 3: BAIXAR ARQUIVO .CSV PARA IMPORTAR */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <Download className="w-4 h-4" /> Baixar Planilha CSV (Google Sheets & Excel)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gera um arquivo <strong>.CSV com codificação UTF-8</strong>. Você pode fazer upload no Google Drive ou abrir no Excel com 2 cliques.
              </p>

              <button
                type="button"
                onClick={handleExportGoogleSheetsCsv}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white font-bold text-xs rounded-xl flex items-center gap-2 border border-slate-700 transition-all"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Baixar gestao_banca_google_sheets.csv</span>
              </button>
            </div>

            {/* ESTRUTURA E FÓRMULAS DA PLANILHA */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <Table className="w-4 h-4" /> Estrutura de Colunas & Fórmulas da Planilha
              </span>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1.5 text-slate-300">
                <div className="text-emerald-400 font-bold">Colunas Criadas:</div>
                <div>A: <strong>Data</strong> | B: <strong>Banca Inicial</strong> | C: <strong>Greens</strong> | D: <strong>Reds</strong></div>
                <div>E: <strong>Valor Green (R$ 90)</strong> | F: <strong>Valor Red (R$ 37,50)</strong></div>
                <div>G: <strong>Lucro Líquido</strong> <span className="text-indigo-400">= (C2 * E2) - (D2 * F2)</span></div>
                <div>H: <strong>Banca Final</strong> <span className="text-indigo-400">= B2 + G2</span></div>
                <div>I: <strong>ROI %</strong> <span className="text-indigo-400">= G2 / B2</span></div>
                <div>J: <strong>Meta Batida (SIM/NÃO)</strong> | K: <strong>Observações</strong></div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowGoogleSheetsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR RESET GERAL DE BANCA */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 relative">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-400 border border-rose-500/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-100">Reset Geral de Banca</h3>
                <p className="text-xs text-rose-400 font-bold">Ação irreversível de limpeza</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                Você está prestes a realizar um <strong>reset geral de todos os lançamentos</strong> de banca e relatórios salvos para começar do zero.
              </p>

              {onClearAllSpins && (
                <label className="flex items-start gap-2.5 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={resetSpinsAlso}
                    onChange={(e) => setResetSpinsAlso(e.target.checked)}
                    className="mt-0.5 rounded text-rose-500 focus:ring-rose-500"
                  />
                  <span className="text-slate-300 text-[11px] leading-tight">
                    Também zerar e limpar a tabela de giros recentes da roleta
                  </span>
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetAllSessions}
                className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Sim, Zerar Tudo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
