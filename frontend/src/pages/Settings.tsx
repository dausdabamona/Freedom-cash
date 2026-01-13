import { useEffect, useState } from 'react';
import { usePerformance, PerformanceMode } from '../contexts/PerformanceContext';

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
    currency: 'IDR',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { mode, setMode } = usePerformance();

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
    return <div className="text-center py-8">Memuat pengaturan...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-gray-600 mt-1">Atur target kebebasan finansial dan pilihanmu</p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Pengeluaran Hidup</h2>
          <div>
            <label className="label">Biaya Hidup per Bulan (Rp)</label>
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
              Total uang yang kamu keluarkan tiap bulan untuk makan, kost, listrik, internet, dll.
            </p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-bold mb-4">Target Kebebasan</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Dana Darurat (bulan)</label>
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
                Dana darurat untuk berapa bulan? Ini tabungan untuk jaga-jaga kalau ada masalah mendadak. (Standar: 12 bulan)
              </p>
            </div>

            <div>
              <label className="label">Batas Hutang (%)</label>
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
                Maksimal hutang dibanding harta. Semakin kecil semakin bagus. (Standar: 20%, Sehat: di bawah 30%)
              </p>
            </div>

            <div>
              <label className="label">Jumlah Sumber Uang</label>
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
                Berapa sumber uang yang kamu mau punya? Makin banyak makin aman. (Standar: 2)
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-bold mb-4">Pilihan Lainnya</h2>

          <div className="space-y-4">
            <div>
              <label className="label">Mata Uang</label>
              <select
                className="input"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              >
                <option value="IDR">IDR (Rp) - Rupiah Indonesia</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="CAD">CAD (C$)</option>
              </select>
            </div>

            <div>
              <label className="label">⚡ Mode Tampilan</label>
              <div className="space-y-3">
                <div
                  onClick={() => setMode('normal')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    mode === 'normal'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="performance-mode"
                      checked={mode === 'normal'}
                      onChange={() => setMode('normal')}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">Mode Normal</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Tampilan lengkap dengan animasi, grafik, dan semua fitur.
                        Cocok untuk koneksi internet stabil dan HP bagus.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setMode('lite')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    mode === 'lite'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="performance-mode"
                      checked={mode === 'lite'}
                      onChange={() => setMode('lite')}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 flex items-center">
                        🚀 Mode Ringan
                        <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                          SUPER CEPAT
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Tampilan sederhana hanya 6 angka penting saja. Tanpa animasi, tanpa grafik.
                        Muat &lt; 1.5 detik. Cocok untuk HP jadul atau internet lambat.
                      </p>
                      <p className="text-xs text-green-700 font-semibold mt-2">
                        ✓ Hemat kuota · ✓ Hemat baterai · ✓ Super cepat · ✓ Gampang dipake satu tangan
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                💡 Tips: Pakai Mode Ringan untuk cek cepat tiap hari, Mode Normal untuk lihat detail
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <button type="submit" className="btn btn-primary w-full" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>

          {saveSuccess && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center">
              Pengaturan berhasil disimpan!
            </div>
          )}
        </div>
      </form>

      {/* Information Card */}
      <div className="card bg-blue-50 border-l-4 border-blue-500">
        <h3 className="font-bold text-blue-900 mb-2">Penjelasan Angka-angka Penting</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            <strong>Biaya Hidup per Bulan:</strong> Total uang yang kamu butuhkan tiap bulan.
            Hitung semua kebutuhan penting seperti makan, tempat tinggal, transportasi.
          </li>
          <li>
            <strong>Dana Darurat:</strong> Tabungan khusus untuk jaga-jaga kalau ada masalah mendadak.
            Disarankan 12 bulan biar aman.
          </li>
          <li>
            <strong>Batas Hutang:</strong> Perbandingan hutang dengan harta. Di bawah 20% bagus banget,
            di atas 50% harus hati-hati.
          </li>
          <li>
            <strong>Sumber Uang:</strong> Makin banyak sumber uang, makin aman. Minimal 2 sumber,
            salah satunya harus uang yang masuk otomatis.
          </li>
        </ul>
      </div>

      {/* Freedom Score Formula */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4">Cara Hitung Skor Kebebasan</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>Skor Kebebasanmu (0-100) dihitung dari 5 hal ini:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>
              <strong>Kebutuhan Tercukupi (35%):</strong> Uang masuk otomatis ÷ Biaya hidup
            </li>
            <li>
              <strong>Dana Darurat (20%):</strong> Dana darurat ÷ (Biaya hidup × Target bulan)
            </li>
            <li>
              <strong>Skor Hutang (20%):</strong> Dihitung dari perbandingan hutang dan harta
            </li>
            <li>
              <strong>Keberagaman Sumber Uang (15%):</strong> Jumlah sumber uang ÷ Target
            </li>
            <li>
              <strong>Pertumbuhan Harta (10%):</strong> Berdasarkan tren 3 bulan terakhir
            </li>
          </ul>
          <p className="mt-4 text-gray-600">
            <strong>Kamu bebas secara finansial kalau:</strong>
            <br />
            • Uang masuk otomatis ≥ Biaya hidup per bulan (Kebutuhan tercukupi ≥ 100%)
            <br />
            • Dana darurat ≥ 12 bulan biaya hidup
            <br />
            • Hutang &lt; 20% dari harta
            <br />• Punya minimal 2 sumber uang yang berbeda
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
