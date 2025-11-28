import React from 'react';
import { FlowrexSignal, SignalDirection, SignalGrade } from '../lib/types';

/**
 * ═══════════════════════════════════════════════════════════════
 * FLOWREX SIGNAL CARD COMPONENT
 * ═══════════════════════════════════════════════════════════════
 * Displays the unified Flowrex signal with:
 * - Direction badge (long/short/neutral)
 * - Quality grade (A/B/C)
 * - Confidence score
 * - Playbook name
 * - Reasoning bullets
 * - Risk warnings
 */

interface SignalCardProps {
  signal: FlowrexSignal;
}

/**
 * Direction Badge Component
 */
const DirectionBadge: React.FC<{ direction: SignalDirection }> = ({ direction }) => {
  const styles = {
    long: 'bg-green-500/20 text-green-400 border-green-500/50',
    short: 'bg-red-500/20 text-red-400 border-red-500/50',
    neutral: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
  };

  const icons = {
    long: '↑',
    short: '↓',
    neutral: '→',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${styles[direction]}`}>
      <span className="text-lg font-bold">{icons[direction]}</span>
      <span className="text-sm font-semibold uppercase tracking-wide">{direction}</span>
    </div>
  );
};

/**
 * Quality Grade Badge Component
 */
const GradeBadge: React.FC<{ grade: SignalGrade }> = ({ grade }) => {
  const styles = {
    A: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    B: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    C: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  };

  const labels = {
    A: 'High Quality',
    B: 'Medium Quality',
    C: 'Low Quality',
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${styles[grade]}`}>
      <span className="text-lg font-bold">{grade}</span>
      <span className="text-xs font-medium uppercase tracking-wide">{labels[grade]}</span>
    </div>
  );
};

/**
 * Confidence Bar Component
 */
const ConfidenceBar: React.FC<{ confidence: number }> = ({ confidence }) => {
  const getBarColor = (conf: number): string => {
    if (conf >= 75) return 'bg-emerald-500';
    if (conf >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-400">Confidence</span>
        <span className="text-white font-bold">{confidence}%</span>
      </div>
      <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor(confidence)} transition-all duration-500`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Main SignalCard Component
 */
export const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">⚡ Flowrex Signal</h3>
          <div className="flex flex-wrap gap-2">
            <DirectionBadge direction={signal.direction} />
            <GradeBadge grade={signal.grade} />
          </div>
        </div>
        <div className="text-right space-y-1">
          <div className="text-xs text-gray-400">Playbook</div>
          <div className="text-sm font-bold text-blue-400">{signal.playbook}</div>
          {signal.symbol && (
            <div className="text-xs text-gray-500">{signal.symbol}</div>
          )}
        </div>
      </div>

      {/* Confidence Bar */}
      <ConfidenceBar confidence={signal.confidence} />

      {/* Context Info */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-gray-400">Instrument:</span>
          <span className="ml-2 text-white font-medium">{signal.instrument}</span>
        </div>
        <div>
          <span className="text-gray-400">Timeframe:</span>
          <span className="ml-2 text-white font-medium">{signal.timeframe}</span>
        </div>
      </div>

      {/* Reasons */}
      {signal.reasons.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <span className="text-green-400">✓</span>
            Signal Reasons
          </h4>
          <ul className="space-y-1.5 text-xs text-gray-300">
            {signal.reasons.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Hints */}
      {signal.riskHints.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <span className="text-yellow-400">⚠</span>
            Risk Hints
          </h4>
          <ul className="space-y-1.5 text-xs text-yellow-200/80">
            {signal.riskHints.map((hint, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                <span>{hint}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Backup Playbook (if exists) */}
      {signal.backupPlaybook && (
        <div className="pt-4 border-t border-gray-700/50">
          <div className="text-xs text-gray-400">
            Backup: <span className="text-blue-400 font-medium">{signal.backupPlaybook}</span>
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="pt-2 text-xs text-gray-500 text-right">
        {new Date(signal.createdAt).toLocaleString()}
      </div>
    </div>
  );
};

export default SignalCard;
