import { useEffect, useState } from 'react';
import { DEMO_USER_ID } from '../constants';

interface IncomeEngine {
  id: string;
  name: string;
  type: 'active' | 'semi_passive' | 'passive';
  monthly_amount: number;
  growth_rate: number;
  stability_score: number;
  description: string;
  is_active: boolean;
}

function IncomeEngines() {
  const [engines, setEngines] = useState<IncomeEngine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'active' as 'active' | 'semi_passive' | 'passive',
    monthly_amount: 0,
    growth_rate: 0,
    stability_score: 5,
    description: '',
  });

  useEffect(() => {
    fetchEngines();
  }, []);

  const fetchEngines = async () => {
    try {
      const response = await fetch(`/api/income-engines?user_id=${DEMO_USER_ID}`);
      const result = await response.json();
      setEngines(result);
    } catch (error) {
      console.error('Failed to fetch income engines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `/api/income-engines/${editingId}`
        : '/api/income-engines';

      const method = editingId ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_id: DEMO_USER_ID }),
      });

      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: '',
        type: 'active',
        monthly_amount: 0,
        growth_rate: 0,
        stability_score: 5,
        description: '',
      });
      fetchEngines();
    } catch (error) {
      console.error('Failed to save income engine:', error);
    }
  };

  const handleEdit = (engine: IncomeEngine) => {
    setFormData({
      name: engine.name,
      type: engine.type,
      monthly_amount: parseFloat(engine.monthly_amount.toString()),
      growth_rate: parseFloat(engine.growth_rate.toString()),
      stability_score: engine.stability_score,
      description: engine.description,
    });
    setEditingId(engine.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income engine?')) return;

    try {
      await fetch(`/api/income-engines/${id}`, { method: 'DELETE' });
      fetchEngines();
    } catch (error) {
      console.error('Failed to delete income engine:', error);
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'semi_passive': return 'bg-purple-100 text-purple-800';
      case 'passive': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'active': return 'Active';
      case 'semi_passive': return 'Semi-Passive';
      case 'passive': return 'Passive';
      default: return type;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading income engines...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Income Engines</h1>
          <p className="text-gray-600 mt-1">Track and manage your income sources</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          + Add Income Engine
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-600">Active Income</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(
              engines
                .filter(e => e.type === 'active' && e.is_active)
                .reduce((sum, e) => sum + parseFloat(e.monthly_amount.toString()), 0)
            )}
          </p>
        </div>
        <div className="card border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-600">Semi-Passive Income</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(
              engines
                .filter(e => e.type === 'semi_passive' && e.is_active)
                .reduce((sum, e) => sum + parseFloat(e.monthly_amount.toString()), 0)
            )}
          </p>
        </div>
        <div className="card border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-600">Passive Income</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(
              engines
                .filter(e => e.type === 'passive' && e.is_active)
                .reduce((sum, e) => sum + parseFloat(e.monthly_amount.toString()), 0)
            )}
          </p>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingId ? 'Edit Income Engine' : 'Add New Income Engine'}
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
                <label className="label">Type</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                >
                  <option value="active">Active (requires your time)</option>
                  <option value="semi_passive">Semi-Passive (minimal involvement)</option>
                  <option value="passive">Passive (fully automated)</option>
                </select>
              </div>
              <div>
                <label className="label">Monthly Amount ($)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.monthly_amount}
                  onChange={(e) => setFormData({ ...formData, monthly_amount: parseFloat(e.target.value) })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="label">Annual Growth Rate (%)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.growth_rate}
                  onChange={(e) => setFormData({ ...formData, growth_rate: parseFloat(e.target.value) })}
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="label">Stability Score (1-10)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.stability_score}
                  onChange={(e) => setFormData({ ...formData, stability_score: parseInt(e.target.value) })}
                  min="1"
                  max="10"
                />
                <p className="text-xs text-gray-500 mt-1">10 = Very stable, 1 = Highly volatile</p>
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

      {/* Engines List */}
      <div className="grid grid-cols-1 gap-4">
        {engines.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">No income engines yet. Add your first one to get started!</p>
          </div>
        ) : (
          engines.map((engine) => (
            <div key={engine.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">{engine.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(engine.type)}`}>
                      {getTypeName(engine.type)}
                    </span>
                  </div>
                  {engine.description && (
                    <p className="text-gray-600 mb-3">{engine.description}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Monthly Amount</span>
                      <p className="font-bold text-lg">{formatCurrency(parseFloat(engine.monthly_amount.toString()))}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Growth Rate</span>
                      <p className="font-bold text-lg">{engine.growth_rate}%/year</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Stability</span>
                      <p className="font-bold text-lg">{engine.stability_score}/10</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Annual Income</span>
                      <p className="font-bold text-lg">
                        {formatCurrency(parseFloat(engine.monthly_amount.toString()) * 12)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(engine)}
                    className="btn btn-secondary text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(engine.id)}
                    className="btn btn-danger text-sm"
                  >
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

export default IncomeEngines;
