import React from 'react';
import { useAgentStore } from '../store/useAgentStore';

function BoolPill({ label, value }: { label: string; value?: boolean }) {
  const active = !!value;
  return (
    <span
      className={
        'px-2 py-0.5 rounded-full text-xs mr-2 mb-2 inline-block ' +
        (active ? 'bg-green-500/20 text-green-300' : 'bg-gray-700/50 text-gray-400')
      }
    >
      {label}
    </span>
  );
}

export default function PlaybookDetail() {
  const result = useAgentStore((s) => s.result);
  const ctx = result?.context;
  const plan = result?.tradePlan;

  if (!plan || !ctx) {
    return (
      <div className="p-4 bg-[#11131a] rounded">
        <h2 className="text-xl font-semibold mb-2">Playbook Details</h2>
        <p className="text-sm text-gray-400">No analysis yet.</p>
      </div>
    );
  }

  const pb = plan.playbook;

  return (
    <div className="p-4 bg-[#11131a] rounded h-full">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">Playbook Details</h2>
        <span className="text-xs text-gray-400">
          {pb} · {ctx.session} · HTF: {ctx.htfBias}
        </span>
      </div>

      {pb === 'NBB' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-300">
            <b>NBB</b> (Market Maker Model + OTE). Focused on HTF bias, PD arrays and MMM structure.
          </p>
          <div className="mt-2">
            <BoolPill label="MMM structure" value={ctx.hasMMMStructure} />
            <BoolPill label="Breaker displacement" value={ctx.hasBreakerDisplacement} />
            <BoolPill label="OTE available" value={ctx.hasOTEZoneAvailable} />
            <BoolPill label="ADR OK" value={ctx.adrIsValidForSetup} />
            <BoolPill label="Near PD Array" value={ctx.nearPDArray} />
          </div>
        </div>
      )}

      {pb === 'JADE' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-300">
            <b>JadeCap</b> – intraday liquidity raid + confirmation (FVG / MSS / Turtle Soup).
          </p>
          <div className="mt-2">
            <BoolPill label="Session liquidity raid" value={ctx.hasSessionLiquidityRaid} />
            <BoolPill label="Confirmation pattern" value={ctx.hasIntradayConfirmationPattern} />
            <BoolPill label="Intraday focus" value={ctx.isIntradayFocus} />
          </div>
        </div>
      )}

      {pb === 'TORI' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-300">
            <b>Tori</b> – 4H trendline model. Looks for clean, respected lines with age and touches.
          </p>
          <div className="mt-2">
            <BoolPill label="Near action trendline" value={ctx.isNearActionTrendline} />
            <BoolPill label="Trendline break" value={ctx.isTrendlineBreak} />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Touches: <b>{ctx.trendlineTouches}</b> · Age: <b>{ctx.trendlineAgeDays?.toFixed?.(1)}d</b>
          </p>
        </div>
      )}

      {pb === 'FABIO' && (
        <div className="space-y-2">
          <p className="text-sm text-gray-300">
            <b>Fabio (Auction)</b> – balance/imbalance, value area rotations and LVNs.
          </p>
          <div className="mt-2">
            <BoolPill label="Volume profile avail." value={ctx.volumeProfileAvailable} />
            <BoolPill label="Balanced rotation" value={ctx.isBalanced} />
            <BoolPill label="Imbalanced trend" value={ctx.isImbalanced} />
            <BoolPill label="Valid LVN" value={ctx.hasValidLVN} />
            <BoolPill label="Impulse away from value" value={ctx.hasTrendImpulseAwayFromValue} />
            <BoolPill label="Failed breakout" value={ctx.hasFailedBreakoutFromBalance} />
          </div>
        </div>
      )}

      {pb !== 'NBB' && pb !== 'JADE' && pb !== 'TORI' && pb !== 'FABIO' && (
        <p className="text-sm text-gray-300">
          Selected playbook: <b>{pb}</b>. No custom visual yet, but you can still inspect the raw trade plan.
        </p>
      )}
    </div>
  );
}
