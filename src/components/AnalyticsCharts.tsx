import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import { SpinRecord, BankrollConfig } from '../types';

interface AnalyticsChartsProps {
  spins: SpinRecord[];
  config: BankrollConfig;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ spins, config }) => {
  if (spins.length === 0) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 text-center text-slate-500 italic">
        Adicione giros para visualizar os gráficos de análise avançada.
      </div>
    );
  }

  // 1. Line Chart Data: Balance Progression
  const lineData = spins.map((s) => ({
    giro: `#${s.giro}`,
    saldo: s.accumulatedBalance,
    lucro: s.netResult,
  }));

  // 2. Bar Chart Data: Dozens
  const dozenCounts = { '1ª Dúzia': 0, '2ª Dúzia': 0, '3ª Dúzia': 0, Zero: 0 };
  spins.forEach((s) => {
    if (s.dozen === '1a') dozenCounts['1ª Dúzia']++;
    else if (s.dozen === '2a') dozenCounts['2ª Dúzia']++;
    else if (s.dozen === '3a') dozenCounts['3ª Dúzia']++;
    else dozenCounts['Zero']++;
  });

  const dozenData = Object.entries(dozenCounts).map(([name, count]) => ({ name, count }));

  // 3. Donut Data: Colors
  let redCount = 0;
  let blackCount = 0;
  let greenCount = 0;

  spins.forEach((s) => {
    if (s.color === 'red') redCount++;
    else if (s.color === 'black') blackCount++;
    else greenCount++;
  });

  const pieData = [
    { name: 'Vermelho', value: redCount, color: '#e11d48' },
    { name: 'Preto', value: blackCount, color: '#1e293b' },
    { name: 'Verde (Zero)', value: greenCount, color: '#059669' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 📈 Bankroll Progression Line Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
            EVOLUÇÃO DO SALDO ({config.currency})
          </h3>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="giro" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.5rem',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="saldo"
                name="Saldo Acumulado"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#34d399', r: 4 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 📊 Dozen Distribution Bar Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
            DISTRIBUIÇÃO POR DÚZIA
          </h3>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dozenData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.5rem',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" name="Sorteios" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🎯 Color Distribution Donut Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl lg:col-span-2">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
          <PieIcon className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
            DISTRIBUIÇÃO DE CORES (VERMELHO VS PRETO VS VERDE)
          </h3>
        </div>

        <div className="h-56 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.5rem',
                  color: '#f8fafc',
                  fontSize: '12px',
                }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
