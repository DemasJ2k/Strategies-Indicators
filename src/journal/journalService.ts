import { pool } from '../db';

/**
 * Save a Flowrex signal to the database
 */
export async function saveSignal(signal: any, context: any, source: string, userId: string) {
  const res = await pool.query(
    `
      INSERT INTO signals (
        user_id, symbol, instrument, direction, playbook, primary_playbook, backup_playbook,
        confidence, grade, reasons, risk_hints, timeframe, source, raw_context
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING id
    `,
    [
      userId,
      signal.symbol || context.symbol,
      signal.instrument,
      signal.direction,
      signal.playbook,
      signal.primaryPlaybook,
      signal.backupPlaybook || null,
      signal.confidence,
      signal.grade,
      JSON.stringify(signal.reasons || []),
      JSON.stringify(signal.riskHints || []),
      signal.timeframe,
      source,
      JSON.stringify(context || {}),
    ]
  );

  return res.rows[0].id as string;
}

/**
 * Trade input interface
 */
export interface TradeInput {
  signalId?: string;
  symbol: string;
  instrument: string;
  direction: string;
  playbook: string;
  entryTime: string;
  entryPrice: number;
  size: number;
  status: 'open' | 'closed' | 'cancelled';
  session?: string;
  notes?: string;
}

/**
 * Create a new trade journal entry
 */
export async function createTrade(input: TradeInput, userId: string) {
  const res = await pool.query(
    `
      INSERT INTO trades (
        user_id,signal_id,symbol,instrument,direction,playbook,
        entry_time,entry_price,size,status,session,notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `,
    [
      userId,
      input.signalId || null,
      input.symbol,
      input.instrument,
      input.direction,
      input.playbook,
      input.entryTime,
      input.entryPrice,
      input.size,
      input.status,
      input.session || null,
      input.notes || null,
    ]
  );

  return res.rows[0];
}

/**
 * Close an existing trade with exit price and time
 */
export async function closeTrade(tradeId: string, exitPrice: number, exitTime: string, userId: string) {
  // Fetch original trade - ensure it belongs to the user
  const tRes = await pool.query(`SELECT * FROM trades WHERE id = $1 AND user_id = $2`, [tradeId, userId]);
  if (!tRes.rowCount) throw new Error('Trade not found');

  const trade = tRes.rows[0];

  const pnl =
    (trade.direction === 'long'
      ? exitPrice - trade.entry_price
      : trade.entry_price - exitPrice) * trade.size;

  const rr = trade.pnl_baseline ? pnl / trade.pnl_baseline : null; // optional if you store baseline

  const res = await pool.query(
    `
      UPDATE trades
      SET exit_price = $2,
          exit_time  = $3,
          pnl        = $4,
          rr         = $5,
          status     = 'closed'
      WHERE id = $1 AND user_id = $6
      RETURNING *
    `,
    [tradeId, exitPrice, exitTime, pnl, rr, userId]
  );

  return res.rows[0];
}

/**
 * List recent trades with optional limit
 */
export async function listRecentTrades(limit = 50, userId?: string) {
  if (userId) {
    const res = await pool.query(
      `SELECT * FROM trades WHERE user_id = $1 ORDER BY entry_time DESC LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  } else {
    // For backward compatibility with webhooks that don't have user context
    const res = await pool.query(
      `SELECT * FROM trades ORDER BY entry_time DESC LIMIT $1`,
      [limit]
    );
    return res.rows;
  }
}

/**
 * Get trade statistics by playbook
 */
export async function getPlaybookStats() {
  const res = await pool.query(`
    SELECT
      playbook,
      COUNT(*) as total_trades,
      COUNT(*) FILTER (WHERE status = 'closed' AND pnl > 0) as wins,
      COUNT(*) FILTER (WHERE status = 'closed' AND pnl < 0) as losses,
      AVG(pnl) FILTER (WHERE status = 'closed') as avg_pnl,
      SUM(pnl) FILTER (WHERE status = 'closed') as total_pnl
    FROM trades
    GROUP BY playbook
    ORDER BY total_trades DESC
  `);

  return res.rows;
}
