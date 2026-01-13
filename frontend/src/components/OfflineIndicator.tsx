import { usePWA } from '../hooks/usePWA';

function OfflineIndicator() {
  const { isOnline, updateAvailable, updateServiceWorker } = usePWA();

  // Show update banner if available
  if (updateAvailable) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="font-semibold">Update tersedia!</span>
          </div>
          <button
            onClick={updateServiceWorker}
            className="bg-white text-green-600 px-4 py-1 rounded-full font-semibold hover:bg-green-50 transition-colors"
          >
            Update Sekarang
          </button>
        </div>
      </div>
    );
  }

  // Show offline indicator if offline
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
          <span className="text-sm font-semibold">
            Mode Offline - Menampilkan data terakhir
          </span>
        </div>
      </div>
    );
  }

  return null;
}

export default OfflineIndicator;
