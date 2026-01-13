import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency as formatIDR } from '../utils/currency';

interface DashboardData {
  monthlyLivingCost: number;
  activeIncome: number;
  passiveIncome: number;
  semiPassiveIncome: number;
  totalIncome: number;
  coverageRatio: number;
  runway: number | null;
  netWorth: number;
  freedomScore: number;
  freedomProgress: number;
  totalAssets: number;
  totalLiabilities: number;
  emergencyFund: number;
  activeIncomeEngines: number;
  debtRatio: number;
  projectedFreedomDate: string | null;
  scoreBreakdown: {
    coverageRatioScore: number;
    emergencyFundScore: number;
    debtScore: number;
    incomeDiversityScore: number;
    netWorthGrowthScore: number;
  };
}

function MetricCard({ title, value, subtitle, color = 'blue' }: { title: string; value: string; subtitle?: string; color?: string }) {
  const colorClasses = {
    blue: 'border-blue-500 bg-blue-50',
    green: 'border-green-500 bg-green-50',
    red: 'border-red-500 bg-red-50',
    yellow: 'border-yellow-500 bg-yellow-50',
    purple: 'border-purple-500 bg-purple-50',
  };

  return (
    <div className={`card border-l-4 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard?user_id=demo-user');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">Failed to load dashboard data</div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return formatIDR(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  // Income breakdown data for pie chart
  const incomeData = [
    { name: 'Active Income', value: data.activeIncome, color: '#3B82F6' },
    { name: 'Semi-Passive', value: data.semiPassiveIncome, color: '#8B5CF6' },
    { name: 'Passive Income', value: data.passiveIncome, color: '#10B981' },
  ].filter(item => item.value > 0);

  // Freedom Score breakdown
  const scoreData = [
    { name: 'Coverage Ratio', value: data.scoreBreakdown.coverageRatioScore, weight: '35%' },
    { name: 'Emergency Fund', value: data.scoreBreakdown.emergencyFundScore, weight: '20%' },
    { name: 'Debt Score', value: data.scoreBreakdown.debtScore, weight: '20%' },
    { name: 'Income Diversity', value: data.scoreBreakdown.incomeDiversityScore, weight: '15%' },
    { name: 'Net Worth Growth', value: data.scoreBreakdown.netWorthGrowthScore, weight: '10%' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <h1 className="text-3xl font-bold mb-2">Financial Freedom Dashboard</h1>
        <p className="text-blue-100">Track your 36-month journey to financial independence</p>
      </div>

      {/* Freedom Score */}
      <div className="card bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold mb-1">Freedom Score</h2>
            <p className="text-5xl font-bold">{data.freedomScore.toFixed(1)}/100</p>
            <p className="text-green-100 mt-2">{data.freedomProgress.toFixed(1)}% to financial freedom</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-green-100 mb-1">Projected Freedom Date</p>
            <p className="text-2xl font-bold">{formatDate(data.projectedFreedomDate)}</p>
            <p className="text-sm text-green-100 mt-2">
              Coverage Ratio: {(data.coverageRatio * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Monthly Living Cost"
          value={formatCurrency(data.monthlyLivingCost)}
          subtitle="Your baseline expenses"
          color="blue"
        />
        <MetricCard
          title="Passive Income"
          value={formatCurrency(data.passiveIncome)}
          subtitle={`${(data.coverageRatio * 100).toFixed(0)}% of living cost`}
          color="green"
        />
        <MetricCard
          title="Net Worth"
          value={formatCurrency(data.netWorth)}
          subtitle={`Assets - Liabilities`}
          color="purple"
        />
        <MetricCard
          title="Runway"
          value={data.runway ? `${Math.round(data.runway)} months` : '∞'}
          subtitle={data.runway ? 'Until funds deplete' : 'Sustainable!'}
          color={data.runway && data.runway < 12 ? 'red' : 'green'}
        />
      </div>

      {/* Income Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Income Breakdown</h2>
          {incomeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {incomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No income data yet. Add income engines to get started.</p>
          )}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Income</span>
              <span className="font-bold">{formatCurrency(data.totalIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Income Engines</span>
              <span className="font-bold">{data.activeIncomeEngines}</span>
            </div>
          </div>
        </div>

        {/* Freedom Score Breakdown */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Freedom Score Breakdown</h2>
          <div className="space-y-3">
            {scoreData.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600">
                    {item.name} ({item.weight})
                  </span>
                  <span className="text-sm font-bold">{item.value.toFixed(1)}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      item.value >= 70 ? 'bg-green-500' :
                      item.value >= 40 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${item.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Assets</h3>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(data.totalAssets)}</p>
          <p className="text-sm text-gray-500 mt-1">Emergency Fund: {formatCurrency(data.emergencyFund)}</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Liabilities</h3>
          <p className="text-3xl font-bold text-red-600">{formatCurrency(data.totalLiabilities)}</p>
          <p className="text-sm text-gray-500 mt-1">Debt Ratio: {data.debtRatio.toFixed(1)}%</p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Net Worth</h3>
          <p className="text-3xl font-bold text-purple-600">{formatCurrency(data.netWorth)}</p>
          <p className="text-sm text-gray-500 mt-1">Assets - Liabilities</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
