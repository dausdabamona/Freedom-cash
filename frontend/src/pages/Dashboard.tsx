import { useEffect, useState } from 'react';
import { formatCurrency } from '../utils/currency';

interface FreedomSummary {
  monthlyLivingCost: number;
  passiveIncome: number;
  activeIncome: number;
  coverageRatio: number;
  coveragePercent: number;
  freedomProgress: number;
  status: 'free' | 'approaching' | 'building';
  color: 'green' | 'yellow' | 'red';
  projectedFreedomDate: {
    optimistic: string | null;
    realistic: string | null;
    conservative: string | null;
  };
  monthsToFreedom: {
    optimistic: number | null;
    realistic: number | null;
    conservative: number | null;
  };
  yearsToFreedom: {
    optimistic: number | null;
    realistic: number | null;
    conservative: number | null;
  };
  scenarios: {
    optimistic: {
      freedomDate: string | null;
      monthsToFreedom: number | null;
      yearsToFreedom: number | null;
      finalPassiveIncome: number;
      finalLivingCost: number;
    };
    realistic: {
      freedomDate: string | null;
      monthsToFreedom: number | null;
      yearsToFreedom: number | null;
      finalPassiveIncome: number;
      finalLivingCost: number;
    };
    conservative: {
      freedomDate: string | null;
      monthsToFreedom: number | null;
      yearsToFreedom: number | null;
      finalPassiveIncome: number;
      finalLivingCost: number;
    };
  };
  liquidAssets: number;
  runway: number;
  freedomScore: number;
}

type ScenarioType = 'optimistic' | 'realistic' | 'conservative';

function Dashboard() {
  const [data, setData] = useState<FreedomSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('realistic');

  useEffect(() => {
    fetchFreedomSummary();
  }, []);

  const fetchFreedomSummary = async () => {
    try {
      const response = await fetch('/api/freedom/summary?user_id=demo-user');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch freedom summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 text-xl">Loading Freedom Dashboard...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 text-xl">Failed to load dashboard data</div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Tidak Tercapai';
    const [year, month] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
  };

  const formatMonthsToYears = (months: number | null) => {
    if (!months) return 'N/A';
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) return `${months} bulan`;
    if (remainingMonths === 0) return `${years} tahun`;
    return `${years} tahun ${remainingMonths} bulan`;
  };

  // Get selected scenario data
  const scenario = data.scenarios[selectedScenario];

  // Determine color classes based on coverage ratio
  const getCoverageColor = () => {
    if (data.coverageRatio >= 1.0) return 'bg-green-500';
    if (data.coverageRatio >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCoverageTextColor = () => {
    if (data.coverageRatio >= 1.0) return 'text-green-600';
    if (data.coverageRatio >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCoverageBgColor = () => {
    if (data.coverageRatio >= 1.0) return 'bg-green-50 border-green-500';
    if (data.coverageRatio >= 0.5) return 'bg-yellow-50 border-yellow-500';
    return 'bg-red-50 border-red-500';
  };

  const getStatusMessage = () => {
    if (data.coverageRatio >= 1.0) return '🎉 Kebebasan Finansial Tercapai!';
    if (data.coverageRatio >= 0.75) return '🚀 Hampir Bebas - Final Push!';
    if (data.coverageRatio >= 0.5) return '💪 Menuju Kebebasan';
    if (data.coverageRatio >= 0.25) return '📈 Membangun Momentum';
    return '🌱 Membangun Fondasi';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="card bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <h1 className="text-4xl font-bold mb-2">Freedom Dashboard</h1>
        <p className="text-blue-100 text-lg">Navigator Kebebasan Finansial Anda</p>
      </div>

      {/* Status Banner */}
      <div className={`card border-l-4 ${getCoverageBgColor()}`}>
        <div className="flex justify-between items-center">
          <div>
            <p className={`text-3xl font-bold ${getCoverageTextColor()} mb-2`}>
              {getStatusMessage()}
            </p>
            <p className="text-gray-600 text-lg">
              {data.coveragePercent >= 100
                ? 'Passive income Anda sudah melampaui biaya hidup!'
                : `Anda sudah ${data.coveragePercent}% menuju kebebasan finansial`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Core Metrics - Big Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly Living Cost */}
        <div className="card bg-blue-50 border-l-4 border-blue-500">
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Biaya Hidup Bulanan</h3>
          <p className="text-4xl font-bold text-blue-600 mb-2">
            {formatCurrency(data.monthlyLivingCost)}
          </p>
          <p className="text-sm text-gray-500">Target yang harus dicapai</p>
        </div>

        {/* Passive Income */}
        <div className={`card border-l-4 ${getCoverageBgColor()}`}>
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Passive Income</h3>
          <p className={`text-4xl font-bold ${getCoverageTextColor()} mb-2`}>
            {formatCurrency(data.passiveIncome)}
          </p>
          <p className="text-sm text-gray-500">Income yang sudah otomatis</p>
        </div>

        {/* Active Income */}
        <div className="card bg-purple-50 border-l-4 border-purple-500">
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Active Income</h3>
          <p className="text-4xl font-bold text-purple-600 mb-2">
            {formatCurrency(data.activeIncome)}
          </p>
          <p className="text-sm text-gray-500">Masih perlu bekerja untuk ini</p>
        </div>
      </div>

      {/* Coverage Ratio & Progress Bar */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-1">Coverage Ratio</h3>
            <p className={`text-6xl font-bold ${getCoverageTextColor()}`}>
              {data.coveragePercent}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Target: 100%</p>
            <p className="text-2xl font-bold text-gray-700">
              Gap: {formatCurrency(Math.max(0, data.monthlyLivingCost - data.passiveIncome))}
            </p>
            <p className="text-sm text-gray-500">Passive income yang masih kurang</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-8 mb-2">
          <div
            className={`h-8 rounded-full ${getCoverageColor()} flex items-center justify-center text-white font-bold transition-all duration-500`}
            style={{ width: `${Math.min(100, data.freedomProgress)}%` }}
          >
            {data.freedomProgress >= 15 && `${data.coveragePercent}%`}
          </div>
        </div>

        <div className="flex justify-between text-xs text-gray-500">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100% = BEBAS!</span>
        </div>
      </div>

      {/* Scenario Switcher */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Proyeksi Tanggal Kebebasan</h2>

        {/* Scenario Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSelectedScenario('optimistic')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              selectedScenario === 'optimistic'
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Optimis
          </button>
          <button
            onClick={() => setSelectedScenario('realistic')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              selectedScenario === 'realistic'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Realistis
          </button>
          <button
            onClick={() => setSelectedScenario('conservative')}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
              selectedScenario === 'conservative'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            Konservatif
          </button>
        </div>

        {/* Scenario Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Tanggal Kebebasan</h3>
            <p className="text-5xl font-bold text-gray-900 mb-2">
              {scenario.freedomDate ? formatDate(scenario.freedomDate) : 'Tidak Tercapai'}
            </p>
            <p className="text-sm text-gray-500">
              {scenario.freedomDate
                ? `Dalam skenario ${selectedScenario === 'optimistic' ? 'optimis' : selectedScenario === 'realistic' ? 'realistis' : 'konservatif'}`
                : 'Perlu strategi yang lebih agresif'
              }
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Waktu yang Dibutuhkan</h3>
            <p className="text-5xl font-bold text-gray-900 mb-2">
              {scenario.monthsToFreedom ? formatMonthsToYears(scenario.monthsToFreedom) : 'N/A'}
            </p>
            <p className="text-sm text-gray-500">
              {scenario.monthsToFreedom
                ? `= ${scenario.monthsToFreedom} bulan`
                : 'Growth rate terlalu rendah'
              }
            </p>
          </div>
        </div>

        {/* Scenario Comparison Table */}
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-3">Perbandingan Semua Skenario</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Skenario</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Tanggal Kebebasan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Waktu</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Passive Income Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-green-600">Optimis</td>
                  <td className="px-4 py-3">
                    {data.scenarios.optimistic.freedomDate ? formatDate(data.scenarios.optimistic.freedomDate) : 'Tidak Tercapai'}
                  </td>
                  <td className="px-4 py-3">
                    {data.scenarios.optimistic.yearsToFreedom ? `${data.scenarios.optimistic.yearsToFreedom} tahun` : 'N/A'}
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {formatCurrency(data.scenarios.optimistic.finalPassiveIncome)}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 bg-blue-50">
                  <td className="px-4 py-3 font-medium text-blue-600">Realistis</td>
                  <td className="px-4 py-3">
                    {data.scenarios.realistic.freedomDate ? formatDate(data.scenarios.realistic.freedomDate) : 'Tidak Tercapai'}
                  </td>
                  <td className="px-4 py-3">
                    {data.scenarios.realistic.yearsToFreedom ? `${data.scenarios.realistic.yearsToFreedom} tahun` : 'N/A'}
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {formatCurrency(data.scenarios.realistic.finalPassiveIncome)}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-orange-600">Konservatif</td>
                  <td className="px-4 py-3">
                    {data.scenarios.conservative.freedomDate ? formatDate(data.scenarios.conservative.freedomDate) : 'Tidak Tercapai'}
                  </td>
                  <td className="px-4 py-3">
                    {data.scenarios.conservative.yearsToFreedom ? `${data.scenarios.conservative.yearsToFreedom} tahun` : 'N/A'}
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {formatCurrency(data.scenarios.conservative.finalPassiveIncome)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-1">Liquid Assets</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.liquidAssets)}</p>
          <p className="text-sm text-gray-500 mt-1">Aset yang bisa dicairkan</p>
        </div>

        <div className="card bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-1">Runway</h3>
          <p className="text-2xl font-bold text-gray-900">
            {data.runway > 0 ? `${Math.round(data.runway)} bulan` : 'N/A'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Emergency fund coverage</p>
        </div>

        <div className="card bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-1">Freedom Score</h3>
          <p className="text-2xl font-bold text-gray-900">{data.freedomScore.toFixed(1)}/100</p>
          <p className="text-sm text-gray-500 mt-1">Skor kebebasan finansial</p>
        </div>
      </div>

      {/* Action Tips */}
      <div className="card bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500">
        <h3 className="text-xl font-bold mb-3">💡 Tips Akselerasi</h3>
        <ul className="space-y-2 text-gray-700">
          {data.coverageRatio < 1.0 && (
            <>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>Tambah Passive Income:</strong> Fokus tingkatkan income dari {formatCurrency(data.passiveIncome)}
                  {' '}ke {formatCurrency(data.monthlyLivingCost)}
                </span>
              </li>
              {data.activeIncome > 0 && (
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>
                    <strong>Konversi Active ke Passive:</strong> Gunakan {formatCurrency(data.activeIncome)} active income
                    untuk build passive income engines
                  </span>
                </li>
              )}
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  <strong>Kurangi Biaya Hidup:</strong> Setiap Rp1jt pengurangan biaya = Rp1jt passive income yang dibutuhkan
                </span>
              </li>
            </>
          )}
          {data.coverageRatio >= 1.0 && (
            <li className="flex items-start">
              <span className="mr-2">🎉</span>
              <span>
                <strong>Selamat!</strong> Anda sudah mencapai kebebasan finansial. Fokus maintain dan tingkatkan kualitas hidup!
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;
