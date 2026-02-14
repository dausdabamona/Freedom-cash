import { useEffect, useState } from 'react';
import { DEMO_USER_ID } from '../constants';

interface Liability {
  id: string;
  name: string;
  type: string;
  total_amount: number;
  remaining_amount: number;
  interest_rate: number;
  monthly_payment: number;
  start_date: string | null;
  end_date: string | null;
  description: string;
  is_active: boolean;
}

function Liabilities() {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'credit_card',
    total_amount: 0,
    remaining_amount: 0,
    interest_rate: 0,
    monthly_payment: 0,
    start_date: '',
    end_date: '',
    description: '',
  });

  useEffect(() => {
    fetchLiabilities();
  }, []);

  const fetchLiabilities = async () => {
    try {
      const response = await fetch(`/api/liabilities?user_id=${DEMO_USER_ID}`);
      const result = await response.json();
      setLiabilities(result);
    } catch (error) {
      console.error('Failed to fetch liabilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId ? `/api/liabilities/${editingId}` : '/api/liabilities';
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
        type: 'credit_card',
        total_amount: 0,
        remaining_amount: 0,
        interest_rate: 0,
        monthly_payment: 0,
        start_date: '',
        end_date: '',
        description: '',
      });
      fetchLiabilities();
    } catch (error) {
      console.error('Failed to save liability:', error);
    }
  };

  const handleEdit = (liability: Liability) => {
    setFormData({
      name: liability.name,
      type: liability.type,
      total_amount: parseFloat(liability.total_amount.toString()),
      remaining_amount: parseFloat(liability.remaining_amount.toString()),
      interest_rate: parseFloat(liability.interest_rate.toString()),
      monthly_payment: parseFloat(liability.monthly_payment.toString()),
      start_date: liability.start_date || '',
      end_date: liability.end_date || '',
      description: liability.description,
    });
    setEditingId(liability.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this liability?')) return;

    try {
      await fetch(`/api/liabilities/${id}`, { method: 'DELETE' });
      fetchLiabilities();
    } catch (error) {
      console.error('Failed to delete liability:', error);
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
    const colors: { [key: string]: string } = {
      mortgage: 'bg-blue-100 text-blue-800',
      car_loan: 'bg-green-100 text-green-800',
      student_loan: 'bg-purple-100 text-purple-800',
      credit_card: 'bg-red-100 text-red-800',
      personal_loan: 'bg-yellow-100 text-yellow-800',
      business_loan: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || colors.other;
  };

  const getTypeName = (type: string) => {
    const names: { [key: string]: string } = {
      mortgage: 'Mortgage',
      car_loan: 'Car Loan',
      student_loan: 'Student Loan',
      credit_card: 'Credit Card',
      personal_loan: 'Personal Loan',
      business_loan: 'Business Loan',
      other: 'Other',
    };
    return names[type] || type;
  };

  const totalRemaining = liabilities.reduce((sum, l) => sum + parseFloat(l.remaining_amount.toString()), 0);
  const totalMonthlyPayment = liabilities.reduce((sum, l) => sum + parseFloat(l.monthly_payment.toString()), 0);
  const avgInterestRate = liabilities.length > 0
    ? liabilities.reduce((sum, l) => sum + parseFloat(l.interest_rate.toString()), 0) / liabilities.length
    : 0;

  if (loading) {
    return <div className="text-center py-8">Loading liabilities...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Liabilities</h1>
          <p className="text-gray-600 mt-1">Manage and track your debts</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          + Add Liability
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card border-l-4 border-red-500">
          <h3 className="text-sm font-medium text-gray-600">Total Debt</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRemaining)}</p>
        </div>
        <div className="card border-l-4 border-orange-500">
          <h3 className="text-sm font-medium text-gray-600">Monthly Payment</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMonthlyPayment)}</p>
        </div>
        <div className="card border-l-4 border-yellow-500">
          <h3 className="text-sm font-medium text-gray-600">Avg Interest Rate</h3>
          <p className="text-2xl font-bold text-gray-900">{avgInterestRate.toFixed(2)}%</p>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingId ? 'Edit Liability' : 'Add New Liability'}
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
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="personal_loan">Personal Loan</option>
                  <option value="student_loan">Student Loan</option>
                  <option value="car_loan">Car Loan</option>
                  <option value="mortgage">Mortgage</option>
                  <option value="business_loan">Business Loan</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Original Amount ($)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="label">Remaining Amount ($)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.remaining_amount}
                  onChange={(e) => setFormData({ ...formData, remaining_amount: parseFloat(e.target.value) })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="label">Interest Rate (%)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="label">Monthly Payment ($)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.monthly_payment}
                  onChange={(e) => setFormData({ ...formData, monthly_payment: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date (optional)</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">End Date (optional)</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
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

      {/* Liabilities List */}
      <div className="grid grid-cols-1 gap-4">
        {liabilities.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">No liabilities yet. Great! Or add them to track your debts.</p>
          </div>
        ) : (
          liabilities.map((liability) => {
            const paidPercentage = ((parseFloat(liability.total_amount.toString()) - parseFloat(liability.remaining_amount.toString())) / parseFloat(liability.total_amount.toString())) * 100;

            return (
              <div key={liability.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold">{liability.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(liability.type)}`}>
                        {getTypeName(liability.type)}
                      </span>
                    </div>
                    {liability.description && (
                      <p className="text-gray-600 mb-3">{liability.description}</p>
                    )}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Paid Off: {paidPercentage.toFixed(1)}%</span>
                        <span className="text-gray-600">
                          {formatCurrency(parseFloat(liability.total_amount.toString()) - parseFloat(liability.remaining_amount.toString()))} / {formatCurrency(parseFloat(liability.total_amount.toString()))}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${paidPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Remaining</span>
                        <p className="font-bold text-lg">{formatCurrency(parseFloat(liability.remaining_amount.toString()))}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Monthly Payment</span>
                        <p className="font-bold text-lg">{formatCurrency(parseFloat(liability.monthly_payment.toString()))}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Interest Rate</span>
                        <p className="font-bold text-lg">{liability.interest_rate}%</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Annual Cost</span>
                        <p className="font-bold text-lg">
                          {formatCurrency(parseFloat(liability.monthly_payment.toString()) * 12)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => handleEdit(liability)} className="btn btn-secondary text-sm">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(liability.id)} className="btn btn-danger text-sm">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Liabilities;
