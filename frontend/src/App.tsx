import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import { usePerformance } from './contexts/PerformanceContext';

// Lazy load heavy components for better performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LiteDashboard = lazy(() => import('./pages/LiteDashboard'));
const IncomeEngines = lazy(() => import('./pages/IncomeEngines'));
const Assets = lazy(() => import('./pages/Assets'));
const Liabilities = lazy(() => import('./pages/Liabilities'));
const Simulator = lazy(() => import('./pages/Simulator'));
const Accelerator = lazy(() => import('./pages/Accelerator'));
const Settings = lazy(() => import('./pages/Settings'));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-4xl mb-3">⚡</div>
        <div className="text-gray-600">Loading...</div>
      </div>
    </div>
  );
}

function Navigation() {
  const location = useLocation();
  const { isLiteMode } = usePerformance();

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white';
  };

  // Hide navigation in lite mode for cleaner UI
  if (isLiteMode) {
    return (
      <nav className="bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-14">
            <Link to="/" className="text-white text-lg font-bold">
              ⚡ Freedom Lite
            </Link>
            <div className="flex space-x-3">
              <Link
                to="/accelerator"
                className="text-gray-300 hover:text-white text-sm"
              >
                🚀 Accelerator
              </Link>
              <Link
                to="/settings"
                className="text-gray-300 hover:text-white text-sm"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

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
              to="/accelerator"
              className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/accelerator')}`}
            >
              Accelerator
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

function DashboardRouter() {
  const { isLiteMode } = usePerformance();

  // Use Lite Dashboard in lite mode
  if (isLiteMode) {
    return <LiteDashboard />;
  }

  // Use full Dashboard in normal mode
  return <Dashboard />;
}

function App() {
  const { isLiteMode } = usePerformance();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <OfflineIndicator />
        <Navigation />
        <main className={isLiteMode ? '' : 'max-w-7xl mx-auto px-4 py-8'}>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<DashboardRouter />} />
              <Route path="/income-engines" element={<IncomeEngines />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/liabilities" element={<Liabilities />} />
              <Route path="/simulator" element={<Simulator />} />
              <Route path="/accelerator" element={<Accelerator />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </main>
        {!isLiteMode && <PWAInstallPrompt />}
      </div>
    </Router>
  );
}

export default App;
