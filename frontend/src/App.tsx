import React from 'react';
import CandleUploader from './components/CandleUploader';
import PlaybookScores from './components/PlaybookScores';
import TradePlanView from './components/TradePlanView';

export default function App() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Market Playbook Agent</h1>
      <CandleUploader />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PlaybookScores />
        <TradePlanView />
      </div>
    </div>
  );
}
