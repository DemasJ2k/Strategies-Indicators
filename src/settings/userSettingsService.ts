import { pool } from '../db';
import { encryptJSON, decryptJSON } from '../crypto/secretStore';

export interface UserKeys {
  oanda?: { apiKey?: string; accountId?: string };
  fxcm?: { apiKey?: string };
  binance?: { apiKey?: string; secret?: string };
  bybit?: { apiKey?: string; secret?: string };
  mt5?: { webhookSecret?: string };
  tradingview?: { webhookSecret?: string };
}

export interface UserBrokerConfig {
  defaultProvider?: string; // e.g. "OANDA" or "BINANCE"
  defaultTimeframe?: string; // e.g. "15m"
  defaultSymbol?: string; // e.g. "EURUSD" or "BTCUSDT"
}

export interface UserSettings {
  brokerConfig: UserBrokerConfig;
  keys: UserKeys;
}

/**
 * Get user settings from database
 * Returns default values if no settings exist
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  const res = await pool.query(
    `SELECT broker_config, encrypted_keys FROM user_settings WHERE user_id = $1`,
    [userId]
  );

  if (res.rowCount === 0) {
    return {
      brokerConfig: {
        defaultProvider: 'BINANCE',
        defaultTimeframe: '15m',
        defaultSymbol: 'BTCUSDT',
      },
      keys: {},
    };
  }

  const row = res.rows[0];
  const brokerConfig = (row.broker_config || {}) as UserBrokerConfig;
  const keys = row.encrypted_keys ? (decryptJSON(row.encrypted_keys) as UserKeys) : {};

  return { brokerConfig, keys };
}

/**
 * Update user settings in database
 * Encrypts keys before storing
 */
export async function updateUserSettings(
  userId: string,
  brokerConfig: UserBrokerConfig,
  keys: UserKeys
): Promise<UserSettings> {
  const encrypted = encryptJSON(keys);

  const res = await pool.query(
    `
      INSERT INTO user_settings (user_id, broker_config, encrypted_keys)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id)
      DO UPDATE SET
        broker_config = EXCLUDED.broker_config,
        encrypted_keys = EXCLUDED.encrypted_keys,
        updated_at = now()
      RETURNING broker_config, encrypted_keys
    `,
    [userId, brokerConfig, encrypted]
  );

  const row = res.rows[0];
  return {
    brokerConfig: row.broker_config || {},
    keys,
  };
}

/**
 * Find user by MT5 webhook secret
 * Used to route webhook requests to the correct user workspace
 */
export async function findUserByMt5Secret(secret: string): Promise<string | null> {
  const res = await pool.query(`SELECT user_id, encrypted_keys FROM user_settings`);

  for (const row of res.rows) {
    const keys = row.encrypted_keys ? decryptJSON(row.encrypted_keys) : null;
    if (keys?.mt5?.webhookSecret === secret) {
      return row.user_id as string;
    }
  }

  return null;
}

/**
 * Find user by TradingView webhook secret
 * Used to route webhook requests to the correct user workspace
 */
export async function findUserByTvSecret(secret: string): Promise<string | null> {
  const res = await pool.query(`SELECT user_id, encrypted_keys FROM user_settings`);

  for (const row of res.rows) {
    const keys = row.encrypted_keys ? decryptJSON(row.encrypted_keys) : null;
    if (keys?.tradingview?.webhookSecret === secret) {
      return row.user_id as string;
    }
  }

  return null;
}
