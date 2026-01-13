import { useEffect, useState } from 'react';

interface SettingsData {
  monthly_living_cost: number;
  target_emergency_months: number;
  target_debt_ratio: number;
  target_income_engines: number;
  currency: string;
}

function Settings() {
  const [settings, setSettings] = useState<SettingsData>({
    monthly_living_cost: 0,
    target_emergency_months: 12,
    target_debt_ratio: 20,
    target_income_engines: 2,
    currency: 'USD',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings?user_id=demo-user');
      const result = await response.json();
      setSettings(result);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, user_id: 'demo-user' }),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your financial freedom targets and preferences</p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Living Expenses</h2>
          <div>
            <label className="label">Monthly Living Cost ($)</label>
            <input
              type="number"
              className="input"
              value={settings.monthly_living_cost}
              onChange={(e) =>
                setSettings({ ...settings, monthly_living_cost: parseFloat(e.target.value) || 0 })
              }
              required
              min="0"
              step="0.01"
            />
            <p className="text-sm text-gray-500 mt-1">
              Your baseline monthly expenses including rent, food, utilities, insurance, etc.
            </p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-bold mb-4">Freedom Targets</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Target Emergency Fund (months)</label>
              <input
                type="number"
                className="input"
                value={settings.target_emergency_months}
                onChange={(e) =>
                  setSettings({ ...settings, target_emergency_months: parseInt(e.target.value) || 12 })
                }
                min="1"
                max="24"
              />
              <p className="text-sm text-gray-500 mt-1">
                How many months of living expenses should your emergency fund cover? (Default: 12 months)
              </p>
            </div>

            <div>
              <label className="label">Target Debt Ratio (%)</label>
              <input
                type="number"
                className="input"
                value={settings.target_debt_ratio}
                onChange={(e) =>
                  setSettings({ ...settings, target_debt_ratio: parseFloat(e.target.value) || 20 })
                }
                min="0"
                max="100"
                step="0.1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Maximum acceptable debt-to-asset ratio. (Default: 20%, Healthy: below 30%)
              </p>
            </div>

            <div>
              <label className="label">Target Number of Income Engines</label>
              <input
                type="number"
                className="input"
                value={settings.target_income_engines}
                onChange={(e) =>
                  setSettings({ ...settings, target_income_engines: parseInt(e.target.value) || 2 })
                }
                min="1"
                max="10"
              />
              <p className="text-sm text-gray-500 mt-1">
                How many independent income sources do you want? Diversification reduces risk. (Default: 2)
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-bold mb-4">Preferences</h2>
          <div>
            <label className="label">Currency</label>
            <select
              className="input"
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="AUD">AUD (A$)</option>
              <option value="CAD">CAD (C$)</option>
            </select>
          </div>
        </div>

        <div className="border-t pt-6">
          <button type="submit" className="btn btn-primary w-full" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          {saveSuccess && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center">
              Settings saved successfully!
            </div>
          )}
        </div>
      </form>

      {/* Information Card */}
      <div className="card bg-blue-50 border-l-4 border-blue-500">
        <h3 className="font-bold text-blue-900 mb-2">Understanding Freedom Metrics</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            <strong>Monthly Living Cost:</strong> The foundation for calculating your Freedom Score.
            This should include all essential expenses.
          </li>
          <li>
            <strong>Emergency Fund:</strong> Financial cushion for unexpected events. 12 months is
            recommended for financial independence.
          </li>
          <li>
            <strong>Debt Ratio:</strong> Liabilities divided by assets. Below 20% is excellent, above
            50% needs attention.
          </li>
          <li>
            <strong>Income Engines:</strong> Multiple income sources reduce risk. Aim for at least 2,
            with at least one being passive.
          </li>
        </ul>
      </div>

      {/* Freedom Score Formula */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4">Freedom Score Formula</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>Your Freedom Score (0-100) is calculated using these weighted components:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>
              <strong>Coverage Ratio (35%):</strong> Passive income / Living cost
            </li>
            <li>
              <strong>Emergency Fund (20%):</strong> Emergency fund / (Living cost × Target months)
            </li>
            <li>
              <strong>Debt Score (20%):</strong> Based on debt-to-asset ratio
            </li>
            <li>
              <strong>Income Diversity (15%):</strong> Number of income engines / Target
            </li>
            <li>
              <strong>Net Worth Growth (10%):</strong> Based on 3-month trend
            </li>
          </ul>
          <p className="mt-4 text-gray-600">
            <strong>Financial Freedom is achieved when:</strong>
            <br />
            • Passive income ≥ Monthly living cost (Coverage Ratio ≥ 100%)
            <br />
            • Emergency fund ≥ 12 months living cost
            <br />
            • Debt ratio &lt; 20%
            <br />• At least 2 independent income engines
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
