import { useEffect, useState, memo } from 'react';
import { formatCurrency } from '../utils/currency';

interface LiteDashboardData {
  freedomDate: string | null;
  monthsToFreedom: number | null;
  coverageRatio: number;
  passiveIncome: number;
  livingCost: number;
  fastestAction: string;
  status: 'free' | 'approaching' | 'building';
}

// Memoized to prevent unnecessary re-renders
const LiteDashboard = memo(function LiteDashboard() {
  const [data, setData] = useState<LiteDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/freedom/lite?user_id=demo-user');
      const result = await response.json();
      setData(result);
      setLastUpdate(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error('Failed to fetch lite dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⚡</div>
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-xl text-gray-600">Failed to load data</div>
          <button
            onClick={fetchData}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Tidak Tercapai';
    const [year, month] = dateString.split('-');
    return `${month}/${year}`;
  };

  const getStatusColor = () => {
    if (data.status === 'free') return 'bg-green-600';
    if (data.status === 'approaching') return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (data.status === 'free') return '🎉 BEBAS!';
    if (data.status === 'approaching') return '🚀 HAMPIR!';
    return '🌱 PROSES';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-8">
      {/* Status Badge */}
      <div className="flex justify-between items-center mb-4">
        <div className={`${getStatusColor()} text-white px-4 py-2 rounded-full font-bold text-sm`}>
          {getStatusText()}
        </div>
        <div className="text-xs text-gray-500">
          Update: {lastUpdate}
        </div>
      </div>

      {/* Main Content - Vertical Stack, Big Numbers */}
      <div className="space-y-4 max-w-md mx-auto">
        {/* Freedom Date - BIGGEST */}
        <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-blue-600">
          <div className="text-sm text-gray-600 mb-1">TANGGAL BEBAS</div>
          <div className="text-5xl font-bold text-gray-900 mb-2">
            {formatDate(data.freedomDate)}
          </div>
          {data.monthsToFreedom !== null && (
            <div className="text-lg text-gray-600">
              {data.monthsToFreedom} bulan lagi
            </div>
          )}
        </div>

        {/* Coverage Ratio */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">COVERAGE RATIO</div>
          <div className="text-5xl font-bold text-blue-600 mb-2">
            {Math.round(data.coverageRatio * 100)}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${getStatusColor()}`}
              style={{ width: `${Math.min(100, data.coverageRatio * 100)}%` }}
            />
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Target: 100%
          </div>
        </div>

        {/* Passive Income */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">PASSIVE INCOME</div>
          <div className="text-4xl font-bold text-green-600">
            {formatCurrency(data.passiveIncome)}
          </div>
          <div className="text-sm text-gray-500 mt-1">/bulan</div>
        </div>

        {/* Living Cost */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">BIAYA HIDUP</div>
          <div className="text-4xl font-bold text-gray-700">
            {formatCurrency(data.livingCost)}
          </div>
          <div className="text-sm text-gray-500 mt-1">/bulan</div>
        </div>

        {/* Gap */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">GAP TERSISA</div>
          <div className="text-4xl font-bold text-red-600">
            {formatCurrency(Math.max(0, data.livingCost - data.passiveIncome))}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {data.coverageRatio >= 1.0 ? 'Sudah bebas! 🎉' : 'Masih kurang'}
          </div>
        </div>

        {/* Fastest Action - Most Important */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg p-6 shadow-md">
          <div className="text-sm font-semibold text-gray-800 mb-2">
            💡 AKSI TERCEPAT SEKARANG:
          </div>
          <div className="text-lg font-bold text-gray-900 leading-snug">
            {data.fastestAction}
          </div>
        </div>

        {/* Quick Refresh Button */}
        <button
          onClick={fetchData}
          className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg active:bg-blue-700"
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Footer Hint */}
      <div className="text-center mt-6 text-sm text-gray-500">
        <p>Mode Lite - Ultra cepat & hemat data</p>
        <p className="mt-1">Ubah ke Normal Mode di Settings untuk fitur lengkap</p>
      </div>
    </div>
  );
});

export default LiteDashboard;
