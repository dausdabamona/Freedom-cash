import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import IncomeEngines from './pages/IncomeEngines';
import Assets from './pages/Assets';
import Liabilities from './pages/Liabilities';
import Simulator from './pages/Simulator';
import Settings from './pages/Settings';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';

function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white';
  };

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-white text-xl font-bold">
              🎯 Financial Freedom Navigator
            </Link>
          </div>
          <div className="flex space-x-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/')}`}
            >
              Dashboard
            </Link>
            <Link
              to="/income-engines"
              className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/income-engines')}`}
            >
              Income Engines
            </Link>
            <Link
              to="/assets"
              className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/assets')}`}
            >
              Assets
            </Link>
            <Link
              to="/liabilities"
              className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/liabilities')}`}
            >
              Liabilities
            </Link>
            <Link
              to="/simulator"
              className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/simulator')}`}
            >
              Simulator
            </Link>
            <Link
              to="/settings"
              className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/settings')}`}
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <OfflineIndicator />
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/income-engines" element={<IncomeEngines />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/liabilities" element={<Liabilities />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <PWAInstallPrompt />
      </div>
    </Router>
  );
}

export default App;
