import React, { useEffect } from 'react';
import LiveListener from './components/LiveListener';
import LoadingOverlay from './components/LoadingOverlay';
import ErrorBanner from './components/ErrorBanner';
import CandleUploader from './components/CandleUploader';
import CsvUploader from './components/CsvUploader';
import ReplayController from './components/ReplayController';
import PlaybookScores from './components/PlaybookScores';
import TradePlanView from './components/TradePlanView';
import Chart from './components/Chart';
import PlaybookDetail from './components/PlaybookDetail';
import SettingsPanel from './components/SettingsPanel';
import DebugPanel from './components/DebugPanel';
import SignalCard from './components/SignalCard';
import LiveMarketPanel from './components/LiveMarketPanel';
import PortfolioRadar from './components/PortfolioRadar';
import JournalPanel from './components/JournalPanel';
import ChatAssistant from './components/ChatAssistant';
import AuthPanel from './components/AuthPanel';
import { useAgentStore } from './store/useAgentStore';
import { useAuthStore } from './store/useAuthStore';

export default function App() {
  const result = useAgentStore((s) => s.result);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);

  // Initialize auth on app load
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Show auth panel if not authenticated
  if (!isAuthenticated) {
    return <AuthPanel />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <LiveListener />
      <LoadingOverlay />

      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold">Market Playbook Agent</h1>
          <p className="text-sm text-gray-400 mt-1">
            Upload candles or import CSV. Replay the market and watch NBB / Tori / Fabio / JadeCap rotate in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {user?.email}
          </span>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-sm border border-red-600/30 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <ErrorBanner />

      <LiveMarketPanel />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CandleUploader />
        <CsvUploader />
      </div>

      <ReplayController />

      {/* ⚡ FLOWREX SIGNAL CARD - NEW IN PHASE 22 */}
      {result?.signal && (
        <SignalCard signal={result.signal} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart />
        <PlaybookScores />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlaybookDetail />
        <TradePlanView />
      </div>

      <SettingsPanel />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PortfolioRadar />
        <JournalPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChatAssistant />
        <DebugPanel />
      </div>
    </div>
  );
}
