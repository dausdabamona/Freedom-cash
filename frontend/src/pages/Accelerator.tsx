import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/currency';
import { DEMO_USER_ID } from '../constants';

interface AcceleratorResult {
  baseline: {
    freedomDate: string | null;
    monthsToFreedom: number | null;
    coverageRatio: number;
  };
  accelerated: {
    freedomDate: string | null;
    monthsToFreedom: number | null;
    coverageRatio: number;
  };
  impact: {
    monthsAccelerated: number;
    newCoverageRatio: number;
  };
  recommendation: string;
}

function Accelerator() {
  const [addPassive, setAddPassive] = useState(0);
  const [reduceCost, setReduceCost] = useState(0);
  const [investCapital, setInvestCapital] = useState(0);
  const [investROI, setInvestROI] = useState(8);
  const [result, setResult] = useState<AcceleratorResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-calculate on input change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (addPassive > 0 || reduceCost > 0 || investCapital > 0) {
        calculateAcceleration();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [addPassive, reduceCost, investCapital, investROI]);

  // Initial load
  useEffect(() => {
    calculateAcceleration();
  }, []);

  const calculateAcceleration = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/freedom/accelerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: DEMO_USER_ID,
          addPassive,
          reduceCost,
          investCapital,
          investROI,
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Failed to calculate acceleration:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Tidak Tercapai';
    const [year, month] = dateString.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  const monthlyIncomeFromInvestment = investCapital * (investROI / 100) / 12;
  const totalMonthlyImpact = addPassive + monthlyIncomeFromInvestment - reduceCost;

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-8">
      {/* Header */}
      <div className="max-w-md mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🚀 Percepat Kebebasan Finansial</h1>
        <p className="text-gray-600">Lihat seberapa cepat kamu bisa bebas dari uang dengan tindakan yang tepat</p>
      </div>

      {/* User Inputs */}
      <div className="max-w-md mx-auto space-y-6 mb-6">
        {/* Slider: Add Passive Income */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ➕ Tambah Uang Masuk Otomatis
          </label>
          <div className="text-3xl font-bold text-green-600 mb-3">
            {formatCurrency(addPassive)}
            <span className="text-sm text-gray-500 ml-2">/bulan</span>
          </div>
          <input
            type="range"
            min="0"
            max="10000000"
            step="100000"
            value={addPassive}
            onChange={(e) => setAddPassive(parseInt(e.target.value))}
            className="w-full h-3 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Rp0</span>
            <span>Rp10jt</span>
          </div>
        </div>

        {/* Slider: Reduce Living Cost */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ✂️ Kurangi Biaya Hidup
          </label>
          <div className="text-3xl font-bold text-blue-600 mb-3">
            {formatCurrency(reduceCost)}
            <span className="text-sm text-gray-500 ml-2">/bulan</span>
          </div>
          <input
            type="range"
            min="0"
            max="5000000"
            step="50000"
            value={reduceCost}
            onChange={(e) => setReduceCost(parseInt(e.target.value))}
            className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Rp0</span>
            <span>Rp5jt</span>
          </div>
        </div>

        {/* Input: Invest Capital */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            💰 Uang yang Mau Ditanam
          </label>
          <input
            type="number"
            min="0"
            step="1000000"
            value={investCapital}
            onChange={(e) => setInvestCapital(parseInt(e.target.value) || 0)}
            placeholder="0"
            className="w-full text-3xl font-bold text-purple-600 bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:border-purple-500 focus:outline-none"
          />
          {investCapital > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              = {formatCurrency(monthlyIncomeFromInvestment)}/bulan dengan hasil {investROI}%
            </p>
          )}
        </div>

        {/* Input: Expected ROI */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📈 Untung yang Diharapkan (% per tahun)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={investROI}
            onChange={(e) => setInvestROI(parseFloat(e.target.value) || 8)}
            className="w-full text-3xl font-bold text-orange-600 bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:border-orange-500 focus:outline-none"
          />
        </div>

        {/* Total Impact Preview */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-6 shadow-md text-white">
          <div className="text-sm font-semibold mb-1">TOTAL PENGARUH</div>
          <div className="text-4xl font-bold">
            {totalMonthlyImpact >= 0 ? '+' : ''}
            {formatCurrency(totalMonthlyImpact)}
          </div>
          <div className="text-sm opacity-90 mt-1">/bulan ditambah ke uang masuk otomatis</div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="max-w-md mx-auto text-center py-8">
          <div className="text-4xl mb-3">⚡</div>
          <div className="text-gray-600">Lagi hitung...</div>
        </div>
      ) : result ? (
        <div className="max-w-md mx-auto space-y-6">
          {/* Months Accelerated - BIG GREEN */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-8 shadow-lg text-white text-center">
            <div className="text-sm font-semibold mb-2 opacity-90">PERCEPATAN</div>
            <div className="text-7xl font-bold mb-2">
              {result.impact.monthsAccelerated > 0 ? result.impact.monthsAccelerated : 0}
            </div>
            <div className="text-2xl font-semibold">bulan lebih cepat</div>
          </div>

          {/* Freedom Date: Before vs After */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-sm font-semibold text-gray-700 mb-4">TANGGAL BEBAS</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Sebelum</div>
                <div className="text-2xl font-bold text-gray-400">
                  {formatDate(result.baseline.freedomDate)}
                </div>
              </div>
              <div>
                <div className="text-xs text-green-600 font-semibold mb-1">Setelah ✨</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatDate(result.accelerated.freedomDate)}
                </div>
              </div>
            </div>
          </div>

          {/* Coverage Ratio: Before vs After */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-sm font-semibold text-gray-700 mb-4">KEBUTUHAN TERCUKUPI BERAPA PERSEN</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Sebelum</div>
                <div className="text-2xl font-bold text-gray-400">
                  {Math.round(result.baseline.coverageRatio * 100)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-green-600 font-semibold mb-1">Setelah ✨</div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(result.accelerated.coverageRatio * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Best Action Recommendation */}
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg p-6 shadow-md">
            <div className="text-sm font-semibold text-gray-800 mb-2">
              💡 APA YANG HARUS KAMU LAKUKAN SEKARANG:
            </div>
            <div className="text-lg font-bold text-gray-900 leading-snug">
              {result.recommendation}
            </div>
          </div>

          {/* Calculate Button */}
          <button
            onClick={calculateAcceleration}
            className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg active:bg-blue-700 shadow-md"
          >
            🔄 Hitung Ulang
          </button>
        </div>
      ) : null}

      {/* Footer */}
      <div className="text-center mt-8 text-sm text-gray-500 max-w-md mx-auto">
        <p>Geser slider untuk lihat kapan kamu bisa bebas dari uang</p>
      </div>
    </div>
  );
}

export default Accelerator;
