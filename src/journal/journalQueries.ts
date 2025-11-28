import { pool } from '../db';

/**
 * Get recent signals from the database
 */
export async function listRecentSignals(limit = 20, userId?: string) {
  if (userId) {
    const res = await pool.query(
      `SELECT * FROM signals WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  } else {
    // For backward compatibility
    const res = await pool.query(
      `SELECT * FROM signals ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return res.rows;
  }
}

/**
 * Get recent trades from the database
 */
export async function listRecentTrades(limit = 20, userId?: string) {
  if (userId) {
    const res = await pool.query(
      `SELECT * FROM trades WHERE user_id = $1 ORDER BY entry_time DESC LIMIT $2`,
      [userId, limit]
    );
    return res.rows;
  } else {
    // For backward compatibility
    const res = await pool.query(
      `SELECT * FROM trades ORDER BY entry_time DESC LIMIT $1`,
      [limit]
    );
    return res.rows;
  }
}
