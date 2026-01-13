import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type PerformanceMode = 'normal' | 'lite';

interface PerformanceContextType {
  mode: PerformanceMode;
  setMode: (mode: PerformanceMode) => void;
  isLiteMode: boolean;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

const STORAGE_KEY = 'freedom-performance-mode';

export function PerformanceProvider({ children }: { children: ReactNode }) {
  // Load from localStorage or default to 'normal'
  const [mode, setModeState] = useState<PerformanceMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as PerformanceMode) || 'normal';
  });

  const setMode = (newMode: PerformanceMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
    console.log('[Performance] Mode changed to:', newMode);

    // Apply performance optimizations
    if (newMode === 'lite') {
      // Disable animations globally
      document.documentElement.classList.add('lite-mode');
      // Hint to browser for performance
      if ('connection' in navigator) {
        console.log('[Performance] Lite mode enabled - reducing data usage');
      }
    } else {
      document.documentElement.classList.remove('lite-mode');
    }
  };

  useEffect(() => {
    // Apply initial mode
    if (mode === 'lite') {
      document.documentElement.classList.add('lite-mode');
    }

    // Log performance metrics
    if (window.performance && window.performance.memory) {
      const memory = (window.performance as any).memory;
      console.log('[Performance] Memory usage:', {
        used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
      });
    }
  }, [mode]);

  return (
    <PerformanceContext.Provider
      value={{
        mode,
        setMode,
        isLiteMode: mode === 'lite',
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within PerformanceProvider');
  }
  return context;
}
