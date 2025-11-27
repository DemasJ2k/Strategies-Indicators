import React from 'react';
import CandleUploader from './components/CandleUploader';
import PlaybookScores from './components/PlaybookScores';
import TradePlanView from './components/TradePlanView';
import Chart from './components/Chart';

export default function App() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-2">Market Playbook Agent</h1>
      <p className="text-sm text-gray-400 mb-4">
        Paste candles, classify the market, and see which playbook (NBB / Tori
        / Fabio / JadeCap) the agent chooses.
      </p>
      <CandleUploader />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Chart />
        <PlaybookScores />
      </div>
      <TradePlanView />
    </div>
  );
}
