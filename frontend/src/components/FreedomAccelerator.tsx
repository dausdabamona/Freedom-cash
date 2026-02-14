import { useState } from 'react';
import { formatCurrency } from '../utils/currency';
import { DEMO_USER_ID } from '../constants';

interface AcceleratorInputs {
  addPassive: number;
  reduceCost: number;
  investCapital: number;
  investROI: number;
}

interface AccelerateResult {
  baseline: {
    passiveIncome: number;
    livingCost: number;
    coverageRatio: number;
    freedomDate: string | null;
    monthsToFreedom: number | null;
    yearsToFreedom: number | null;
  };
  accelerated: {
    passiveIncome: number;
    livingCost: number;
    coverageRatio: number;
    freedomDate: string | null;
    monthsToFreedom: number | null;
    yearsToFreedom: number | null;
  };
  impact: {
    monthsAccelerated: number;
    yearsAccelerated: number;
    coverageImprovement: number;
    incomeIncrease: number;
    expenseDecrease: number;
  };
  actions: Array<{
    action: string;
    amount: number;
    monthsSaved: number;
    efficiency: number;
    description: string;
    priority: number;
  }>;
  recommendation: string;
}

function FreedomAccelerator() {
  const [inputs, setInputs] = useState<AcceleratorInputs>({
    addPassive: 0,
    reduceCost: 0,
    investCapital: 0,
    investROI: 8,
  });

  const [result, setResult] = useState<AccelerateResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/freedom/accelerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: DEMO_USER_ID,
          addPassive: inputs.addPassive,
          reduceCost: inputs.reduceCost,
          investCapital: inputs.investCapital,
          investROI: inputs.investROI,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate');
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Accelerator calculation error:', error);
      alert('Gagal menghitung simulasi. Pastikan backend sudah running dan database terkoneksi.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setInputs({
      addPassive: 0,
      reduceCost: 0,
      investCapital: 0,
      investROI: 8,
    });
    setResult(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Tidak Tercapai';
    const [year, month] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
  };

  const formatMonths = (months: number | null) => {
    if (!months) return 'N/A';
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) return `${months} bulan`;
    if (remainingMonths === 0) return `${years} tahun`;
    return `${years}th ${remainingMonths}bln`;
  };

  const monthlyIncomeFromInvestment = (inputs.investCapital * (inputs.investROI / 100)) / 12;
  const totalIncomeIncrease = inputs.addPassive + monthlyIncomeFromInvestment;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">⚡ Freedom Accelerator</h2>
          <p className="text-gray-600 mt-1">Simulasi dampak perubahan finansial terhadap tanggal kebebasan Anda</p>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">🎯 Input Perubahan</h3>

          {/* Additional Income */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              💰 Tambah Passive Income (per bulan)
            </label>
            <input
              type="number"
              value={inputs.addPassive || ''}
              onChange={(e) => setInputs({ ...inputs, addPassive: Number(e.target.value) || 0 })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">Contoh: +Rp1.000.000 dari sewa kos atau dividen</p>
          </div>

          {/* Expense Reduction */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📉 Kurangi Biaya Hidup (per bulan)
            </label>
            <input
              type="number"
              value={inputs.reduceCost || ''}
              onChange={(e) => setInputs({ ...inputs, reduceCost: Number(e.target.value) || 0 })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">Contoh: -Rp500.000 dengan hemat lifestyle</p>
          </div>

          {/* Investment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              💎 Investasi Modal (one-time)
            </label>
            <input
              type="number"
              value={inputs.investCapital || ''}
              onChange={(e) => setInputs({ ...inputs, investCapital: Number(e.target.value) || 0 })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">Contoh: Rp50.000.000 untuk beli aset produktif</p>
          </div>

          {/* ROI */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📊 ROI Investasi (% per tahun)
            </label>
            <input
              type="number"
              value={inputs.investROI}
              onChange={(e) => setInputs({ ...inputs, investROI: Number(e.target.value) || 8 })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="8"
              step="0.1"
            />
            <p className="text-xs text-gray-500 mt-1">Default: 8% (ROI standar untuk property/saham dividen)</p>
          </div>
        </div>

        {/* Preview Stats */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">📈 Preview Perubahan</h3>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-5">
            <p className="text-sm text-gray-700 font-semibold mb-1">Total Tambahan Passive Income</p>
            <p className="text-4xl font-bold text-green-700">
              {formatCurrency(totalIncomeIncrease)}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              {inputs.addPassive > 0 && `Direct: ${formatCurrency(inputs.addPassive)}`}
              {inputs.addPassive > 0 && inputs.investCapital > 0 && ' + '}
              {inputs.investCapital > 0 && `Investment: ${formatCurrency(monthlyIncomeFromInvestment)}`}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-5">
            <p className="text-sm text-gray-700 font-semibold mb-1">Total Pengurangan Biaya</p>
            <p className="text-4xl font-bold text-blue-700">
              {formatCurrency(inputs.reduceCost)}
            </p>
            <p className="text-xs text-gray-600 mt-2">per bulan</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-5">
            <p className="text-sm text-gray-700 font-semibold mb-1">Net Improvement</p>
            <p className="text-4xl font-bold text-purple-700">
              {formatCurrency(totalIncomeIncrease + inputs.reduceCost)}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Dampak total terhadap gap kebebasan finansial
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCalculate}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? '⏳ Menghitung...' : '🚀 Hitung Dampak'}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Results Section - Before vs After */}
      {result && (
        <div className="border-t-2 border-gray-200 pt-6 space-y-6">
          <h3 className="text-2xl font-bold text-gray-900">📊 Hasil Simulasi</h3>

          {/* Big Impact Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg p-6 shadow-lg">
              <p className="text-sm opacity-90 mb-1">⚡ Akselerasi Waktu</p>
              <p className="text-5xl font-bold">
                {result.impact.monthsAccelerated > 0 ? result.impact.monthsAccelerated : 0}
              </p>
              <p className="text-2xl font-semibold mt-1">bulan</p>
              <p className="text-sm opacity-90 mt-2">
                = {result.impact.yearsAccelerated > 0 ? result.impact.yearsAccelerated.toFixed(1) : 0} tahun lebih cepat!
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg p-6 shadow-lg">
              <p className="text-sm opacity-90 mb-1">📈 Coverage Ratio</p>
              <p className="text-5xl font-bold">
                +{(result.impact.coverageImprovement * 100).toFixed(1)}%
              </p>
              <p className="text-sm opacity-90 mt-3">
                {(result.baseline.coverageRatio * 100).toFixed(0)}% → {(result.accelerated.coverageRatio * 100).toFixed(0)}%
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-lg p-6 shadow-lg">
              <p className="text-sm opacity-90 mb-1">💰 Gap Tersisa</p>
              <p className="text-4xl font-bold">
                {formatCurrency(Math.max(0, result.accelerated.livingCost - result.accelerated.passiveIncome))}
              </p>
              <p className="text-sm opacity-90 mt-3">
                {result.accelerated.coverageRatio >= 1.0 ? '🎉 Bebas!' : 'Passive income yang masih kurang'}
              </p>
            </div>
          </div>

          {/* Priority Recommendations */}
          {result.actions && result.actions.length > 0 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-3">🏆 Priority Ranking</h4>
              <p className="text-sm text-gray-700 mb-4">{result.recommendation}</p>

              <div className="space-y-3">
                {result.actions.map((action, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      index === 0
                        ? 'bg-yellow-100 border-yellow-500'
                        : index === 1
                        ? 'bg-gray-100 border-gray-400'
                        : 'bg-orange-100 border-orange-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-gray-800">#{action.priority}</span>
                        <span className="text-lg font-bold text-gray-800 ml-3">{action.action}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-700">Hemat:</p>
                        <p className="text-2xl font-bold text-gray-900">{action.monthsSaved} bulan</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{action.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Before vs After Comparison */}
          <div>
            <h4 className="text-xl font-bold text-gray-900 mb-4">⚖️ Before vs After</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* BEFORE */}
              <div className="bg-gray-100 rounded-lg p-6 border-2 border-gray-400">
                <h5 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
                  <span className="mr-2">📍</span> Current (Baseline)
                </h5>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Passive Income</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(result.baseline.passiveIncome)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-1">Biaya Hidup</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(result.baseline.livingCost)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-1">Coverage Ratio</p>
                    <p className="text-4xl font-bold text-gray-900">
                      {(result.baseline.coverageRatio * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className="pt-3 border-t-2 border-gray-300">
                    <p className="text-xs text-gray-600 mb-1">Freedom Date</p>
                    <p className="text-xl font-bold text-gray-700">
                      {formatDate(result.baseline.freedomDate)}
                    </p>
                    {result.baseline.monthsToFreedom && (
                      <p className="text-sm text-gray-600 mt-1">
                        {formatMonths(result.baseline.monthsToFreedom)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* AFTER */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-500 shadow-lg">
                <h5 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                  <span className="mr-2">🎯</span> Accelerated (Projected)
                </h5>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-green-700 font-semibold mb-1">Passive Income</p>
                    <p className="text-3xl font-bold text-green-900">
                      {formatCurrency(result.accelerated.passiveIncome)}
                    </p>
                    {result.impact.incomeIncrease > 0 && (
                      <p className="text-sm text-green-600 font-semibold">
                        +{formatCurrency(result.impact.incomeIncrease)}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-green-700 font-semibold mb-1">Biaya Hidup</p>
                    <p className="text-3xl font-bold text-green-900">
                      {formatCurrency(result.accelerated.livingCost)}
                    </p>
                    {result.impact.expenseDecrease > 0 && (
                      <p className="text-sm text-green-600 font-semibold">
                        -{formatCurrency(result.impact.expenseDecrease)}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-green-700 font-semibold mb-1">Coverage Ratio</p>
                    <p className="text-4xl font-bold text-green-900">
                      {(result.accelerated.coverageRatio * 100).toFixed(1)}%
                    </p>
                    {result.impact.coverageImprovement > 0 && (
                      <p className="text-sm text-green-600 font-semibold">
                        +{(result.impact.coverageImprovement * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t-2 border-green-400">
                    <p className="text-xs text-green-700 font-semibold mb-1">Freedom Date</p>
                    <p className="text-xl font-bold text-green-800">
                      {formatDate(result.accelerated.freedomDate)}
                    </p>
                    {result.accelerated.monthsToFreedom && (
                      <p className="text-sm text-green-700 mt-1 font-semibold">
                        {formatMonths(result.accelerated.monthsToFreedom)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Message */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-l-4 border-purple-500 rounded-lg p-5">
            <p className="text-gray-800 text-lg">
              {result.impact.monthsAccelerated > 0 ? (
                <>
                  <strong>🎉 Hebat!</strong> Dengan perubahan ini, Anda bisa mencapai kebebasan finansial{' '}
                  <strong className="text-purple-600 text-xl">{result.impact.yearsAccelerated.toFixed(1)} tahun lebih cepat</strong>!
                  {' '}Mulai eksekusi sekarang!
                </>
              ) : result.accelerated.coverageRatio >= 1.0 ? (
                <>
                  <strong>🎊 Luar Biasa!</strong> Dengan perubahan ini, Anda sudah mencapai{' '}
                  <strong className="text-green-600 text-xl">kebebasan finansial!</strong>
                  {' '}Coverage ratio Anda: {(result.accelerated.coverageRatio * 100).toFixed(0)}%
                </>
              ) : (
                <>
                  <strong>💪 Terus Semangat!</strong> Coverage ratio naik {(result.impact.coverageImprovement * 100).toFixed(1)}%.
                  {' '}Pertahankan momentum ini dan terus optimalkan!
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default FreedomAccelerator;
