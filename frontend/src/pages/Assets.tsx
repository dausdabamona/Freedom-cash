import { useEffect, useState } from 'react';

interface Asset {
  id: string;
  name: string;
  category: string;
  current_value: number;
  monthly_yield: number;
  annual_roi: number;
  automation_level: number;
  description: string;
  purchase_date: string | null;
  is_active: boolean;
}

function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'savings',
    current_value: 0,
    monthly_yield: 0,
    annual_roi: 0,
    automation_level: 5,
    description: '',
    purchase_date: '',
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets?user_id=demo-user');
      const result = await response.json();
      setAssets(result);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId ? `/api/assets/${editingId}` : '/api/assets';
      const method = editingId ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_id: 'demo-user' }),
      });

      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '',
        category: 'savings',
        current_value: 0,
        monthly_yield: 0,
        annual_roi: 0,
        automation_level: 5,
        description: '',
        purchase_date: '',
      });
      fetchAssets();
    } catch (error) {
      console.error('Failed to save asset:', error);
    }
  };

  const handleEdit = (asset: Asset) => {
    setFormData({
      name: asset.name,
      category: asset.category,
      current_value: parseFloat(asset.current_value.toString()),
      monthly_yield: parseFloat(asset.monthly_yield.toString()),
      annual_roi: parseFloat(asset.annual_roi.toString()),
      automation_level: asset.automation_level,
      description: asset.description,
      purchase_date: asset.purchase_date || '',
    });
    setEditingId(asset.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      await fetch(`/api/assets/${id}`, { method: 'DELETE' });
      fetchAssets();
    } catch (error) {
      console.error('Failed to delete asset:', error);
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

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      real_estate: 'bg-orange-100 text-orange-800',
      stocks: 'bg-blue-100 text-blue-800',
      bonds: 'bg-green-100 text-green-800',
      crypto: 'bg-purple-100 text-purple-800',
      business: 'bg-red-100 text-red-800',
      savings: 'bg-teal-100 text-teal-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.other;
  };

  const getCategoryName = (category: string) => {
    const names: { [key: string]: string } = {
      real_estate: 'Real Estate',
      stocks: 'Stocks',
      bonds: 'Bonds',
      crypto: 'Cryptocurrency',
      business: 'Business',
      savings: 'Savings',
      other: 'Other',
    };
    return names[category] || category;
  };

  const totalValue = assets.reduce((sum, a) => sum + parseFloat(a.current_value.toString()), 0);
  const totalYield = assets.reduce((sum, a) => sum + parseFloat(a.monthly_yield.toString()), 0);
  const avgROI = assets.length > 0
    ? assets.reduce((sum, a) => sum + parseFloat(a.annual_roi.toString()), 0) / assets.length
    : 0;

  if (loading) {
    return <div className="text-center py-8">Loading assets...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Productivity</h1>
          <p className="text-gray-600 mt-1">Track value, yield, and automation of your assets</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          + Add Asset
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-600">Total Asset Value</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
        </div>
        <div className="card border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-600">Monthly Yield</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalYield)}</p>
        </div>
        <div className="card border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-600">Average ROI</h3>
          <p className="text-2xl font-bold text-gray-900">{avgROI.toFixed(2)}%</p>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingId ? 'Edit Asset' : 'Add New Asset'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="savings">Savings</option>
                  <option value="stocks">Stocks</option>
                  <option value="bonds">Bonds</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="business">Business</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Current Value ($)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.current_value}
                  onChange={(e) => setFormData({ ...formData, current_value: parseFloat(e.target.value) })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="label">Monthly Yield ($)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.monthly_yield}
                  onChange={(e) => setFormData({ ...formData, monthly_yield: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="label">Annual ROI (%)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.annual_roi}
                  onChange={(e) => setFormData({ ...formData, annual_roi: parseFloat(e.target.value) })}
                  step="0.01"
                />
              </div>
              <div>
                <label className="label">Automation Level (1-10)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.automation_level}
                  onChange={(e) => setFormData({ ...formData, automation_level: parseInt(e.target.value) })}
                  min="1"
                  max="10"
                />
                <p className="text-xs text-gray-500 mt-1">10 = Fully automated, 1 = Requires constant management</p>
              </div>
              <div>
                <label className="label">Purchase Date (optional)</label>
                <input
                  type="date"
                  className="input"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assets List */}
      <div className="grid grid-cols-1 gap-4">
        {assets.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">No assets yet. Add your first one to get started!</p>
          </div>
        ) : (
          assets.map((asset) => (
            <div key={asset.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">{asset.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(asset.category)}`}>
                      {getCategoryName(asset.category)}
                    </span>
                  </div>
                  {asset.description && (
                    <p className="text-gray-600 mb-3">{asset.description}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Current Value</span>
                      <p className="font-bold text-lg">{formatCurrency(parseFloat(asset.current_value.toString()))}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Monthly Yield</span>
                      <p className="font-bold text-lg">{formatCurrency(parseFloat(asset.monthly_yield.toString()))}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Annual ROI</span>
                      <p className="font-bold text-lg">{asset.annual_roi}%</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Automation</span>
                      <p className="font-bold text-lg">{asset.automation_level}/10</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Annual Yield</span>
                      <p className="font-bold text-lg">
                        {formatCurrency(parseFloat(asset.monthly_yield.toString()) * 12)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => handleEdit(asset)} className="btn btn-secondary text-sm">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(asset.id)} className="btn btn-danger text-sm">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Assets;
