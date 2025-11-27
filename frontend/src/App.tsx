import React from 'react';
import CandleUploader from './components/CandleUploader';
import CsvUploader from './components/CsvUploader';
import ReplayController from './components/ReplayController';
import PlaybookScores from './components/PlaybookScores';
import TradePlanView from './components/TradePlanView';
import Chart from './components/Chart';
import PlaybookDetail from './components/PlaybookDetail';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-2">Market Playbook Agent</h1>
      <p className="text-sm text-gray-400">
        Upload candles or import CSV. Replay the market and watch NBB / Tori / Fabio / JadeCap rotate in real time.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CandleUploader />
        <CsvUploader />
      </div>

      <ReplayController />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart />
        <PlaybookScores />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlaybookDetail />
        <TradePlanView />
      </div>

      <SettingsPanel />
    </div>
  );
}
