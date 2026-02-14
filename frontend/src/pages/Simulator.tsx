import { useState } from 'react';
import { DEMO_USER_ID } from '../constants';

interface SimulationResult {
  current: {
    freedomScore: number;
    passiveIncome: number;
    netWorth: number;
    coverageRatio: number;
    freedomDate: string | null;
  };
  projected: {
    freedomScore: number;
    passiveIncome: number;
    netWorth: number;
    coverageRatio: number;
    freedomDate: string | null;
  };
  changes: {
    freedomScoreDelta: number;
    passiveIncomeDelta: number;
    netWorthDelta: number;
    coverageRatioDelta: number;
    monthsAccelerated: number;
  };
}

function Simulator() {
  const [formData, setFormData] = useState({
    additional_income: 0,
    additional_investment: 0,
    investment_roi: 0,
    debt_payoff_amount: 0,
    living_cost_change: 0,
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/simulator/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_id: DEMO_USER_ID }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Simulation failed:', error);
      alert('Failed to run simulation');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not projected';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const resetForm = () => {
    setFormData({
      additional_income: 0,
      additional_investment: 0,
      investment_roi: 0,
      debt_payoff_amount: 0,
      living_cost_change: 0,
    });
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Decision Impact Simulator</h1>
        <p className="text-gray-600 mt-1">
          Model financial decisions and see how they accelerate your path to freedom
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Simulate a Decision</h2>
          <form onSubmit={handleSimulate} className="space-y-4">
            <div>
              <label className="label">Additional Monthly Passive Income ($)</label>
              <input
                type="number"
                className="input"
                value={formData.additional_income}
                onChange={(e) =>
                  setFormData({ ...formData, additional_income: parseFloat(e.target.value) || 0 })
                }
                step="100"
              />
              <p className="text-xs text-gray-500 mt-1">
                e.g., Starting a new side business or rental income
              </p>
            </div>

            <div>
              <label className="label">One-Time Investment ($)</label>
              <input
                type="number"
                className="input"
                value={formData.additional_investment}
                onChange={(e) =>
                  setFormData({ ...formData, additional_investment: parseFloat(e.target.value) || 0 })
                }
                step="1000"
              />
              <p className="text-xs text-gray-500 mt-1">
                e.g., Investing in stocks, real estate, or business
              </p>
            </div>

            <div>
              <label className="label">Expected Annual ROI (%)</label>
              <input
                type="number"
                className="input"
                value={formData.investment_roi}
                onChange={(e) =>
                  setFormData({ ...formData, investment_roi: parseFloat(e.target.value) || 0 })
                }
                step="0.1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Expected return on the investment above
              </p>
            </div>

            <div>
              <label className="label">Debt Payoff Amount ($)</label>
              <input
                type="number"
                className="input"
                value={formData.debt_payoff_amount}
                onChange={(e) =>
                  setFormData({ ...formData, debt_payoff_amount: parseFloat(e.target.value) || 0 })
                }
                step="1000"
              />
              <p className="text-xs text-gray-500 mt-1">
                e.g., Paying off credit cards or loans
              </p>
            </div>

            <div>
              <label className="label">Change in Monthly Living Cost ($)</label>
              <input
                type="number"
                className="input"
                value={formData.living_cost_change}
                onChange={(e) =>
                  setFormData({ ...formData, living_cost_change: parseFloat(e.target.value) || 0 })
                }
                step="100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Positive = increase, Negative = decrease (e.g., moving to lower cost area)
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
                {loading ? 'Simulating...' : 'Run Simulation'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Simulation Results</h2>
          {!result ? (
            <div className="text-center py-12 text-gray-500">
              <p>Enter values and run simulation to see results</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Key Impact Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Freedom Date Acceleration</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {result.changes.monthsAccelerated > 0
                      ? `${result.changes.monthsAccelerated} months`
                      : 'No change'}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Freedom Score Change</p>
                  <p className="text-3xl font-bold text-green-600">
                    {result.changes.freedomScoreDelta > 0 ? '+' : ''}
                    {result.changes.freedomScoreDelta.toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Metric</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">Current</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">Projected</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-600">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 font-medium">Freedom Score</td>
                      <td className="px-4 py-3 text-right">{result.current.freedomScore.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right">{result.projected.freedomScore.toFixed(1)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${
                        result.changes.freedomScoreDelta > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.changes.freedomScoreDelta > 0 ? '+' : ''}
                        {result.changes.freedomScoreDelta.toFixed(1)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Passive Income</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(result.current.passiveIncome)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(result.projected.passiveIncome)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${
                        result.changes.passiveIncomeDelta > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.changes.passiveIncomeDelta > 0 ? '+' : ''}
                        {formatCurrency(result.changes.passiveIncomeDelta)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Net Worth</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(result.current.netWorth)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(result.projected.netWorth)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${
                        result.changes.netWorthDelta > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.changes.netWorthDelta > 0 ? '+' : ''}
                        {formatCurrency(result.changes.netWorthDelta)}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Coverage Ratio</td>
                      <td className="px-4 py-3 text-right">{(result.current.coverageRatio * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right">{(result.projected.coverageRatio * 100).toFixed(1)}%</td>
                      <td className={`px-4 py-3 text-right font-bold ${
                        result.changes.coverageRatioDelta > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.changes.coverageRatioDelta > 0 ? '+' : ''}
                        {(result.changes.coverageRatioDelta * 100).toFixed(1)}%
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Freedom Date</td>
                      <td className="px-4 py-3 text-right">{formatDate(result.current.freedomDate)}</td>
                      <td className="px-4 py-3 text-right">{formatDate(result.projected.freedomDate)}</td>
                      <td className={`px-4 py-3 text-right font-bold ${
                        result.changes.monthsAccelerated > 0 ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {result.changes.monthsAccelerated > 0
                          ? `${result.changes.monthsAccelerated} months faster`
                          : 'No change'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Insights */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <h3 className="font-bold text-blue-900 mb-2">Impact Analysis</h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  {result.changes.monthsAccelerated > 0 && (
                    <li>
                      This decision accelerates your freedom date by{' '}
                      <strong>{result.changes.monthsAccelerated} months</strong>
                    </li>
                  )}
                  {result.changes.freedomScoreDelta > 5 && (
                    <li>
                      Your freedom score improves significantly by{' '}
                      <strong>{result.changes.freedomScoreDelta.toFixed(1)} points</strong>
                    </li>
                  )}
                  {result.changes.coverageRatioDelta > 0.1 && (
                    <li>
                      Your coverage ratio improves by{' '}
                      <strong>{(result.changes.coverageRatioDelta * 100).toFixed(1)}%</strong>
                    </li>
                  )}
                  {result.changes.passiveIncomeDelta > 0 && (
                    <li>
                      You gain <strong>{formatCurrency(result.changes.passiveIncomeDelta)}</strong> in
                      monthly passive income
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Common Scenarios */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Quick Scenarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => {
              setFormData({
                additional_income: 500,
                additional_investment: 0,
                investment_roi: 0,
                debt_payoff_amount: 0,
                living_cost_change: 0,
              });
            }}
            className="btn btn-secondary text-left"
          >
            <div>
              <p className="font-bold">Start a Side Business</p>
              <p className="text-sm text-gray-600">+$500/month passive income</p>
            </div>
          </button>
          <button
            onClick={() => {
              setFormData({
                additional_income: 0,
                additional_investment: 10000,
                investment_roi: 8,
                debt_payoff_amount: 0,
                living_cost_change: 0,
              });
            }}
            className="btn btn-secondary text-left"
          >
            <div>
              <p className="font-bold">Invest $10K</p>
              <p className="text-sm text-gray-600">8% annual return</p>
            </div>
          </button>
          <button
            onClick={() => {
              setFormData({
                additional_income: 0,
                additional_investment: 0,
                investment_roi: 0,
                debt_payoff_amount: 5000,
                living_cost_change: 0,
              });
            }}
            className="btn btn-secondary text-left"
          >
            <div>
              <p className="font-bold">Pay Off $5K Debt</p>
              <p className="text-sm text-gray-600">Reduce liabilities</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Simulator;
