import React, { useEffect, useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import { getAuthHeader } from '../store/useAuthStore';

interface UserBrokerConfig {
  defaultProvider?: string;
  defaultTimeframe?: string;
  defaultSymbol?: string;
}

interface UserKeys {
  oanda?: { apiKey?: string; accountId?: string };
  fxcm?: { apiKey?: string };
  binance?: { apiKey?: string; secret?: string };
  bybit?: { apiKey?: string; secret?: string };
  mt5?: { webhookSecret?: string };
  tradingview?: { webhookSecret?: string };
}

export default function WorkspaceSettingsPanel() {
  const setError = useAgentStore((s) => s.setError);

  const [brokerConfig, setBrokerConfig] = useState<UserBrokerConfig>({
    defaultProvider: 'BINANCE',
    defaultTimeframe: '15m',
    defaultSymbol: 'BTCUSDT',
  });
  const [keys, setKeys] = useState<UserKeys>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch('/api/settings/me', {
        headers: getAuthHeader(),
      });
      const json = await res.json();
      setBrokerConfig(json.brokerConfig || {});
      setKeys(json.keys || {});
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    try {
      setLoading(true);
      setSaved(false);
      const res = await fetch('/api/settings/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ brokerConfig, keys }),
      });
      await res.json();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 bg-[#11131a] rounded space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Workspace Settings</h2>
        {saved && <span className="text-xs text-emerald-300">✓ Saved</span>}
      </div>

      {loading && <p className="text-xs text-gray-400">Loading...</p>}

      {/* Broker defaults */}
      <div className="space-y-2 text-sm">
        <h3 className="font-semibold text-gray-200">Defaults</h3>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Provider</label>
            <select
              value={brokerConfig.defaultProvider || 'BINANCE'}
              onChange={(e) =>
                setBrokerConfig((prev) => ({ ...prev, defaultProvider: e.target.value }))
              }
              className="w-full bg-black border border-gray-700 rounded px-2 py-1 text-gray-200"
            >
              <option value="BINANCE">Binance</option>
              <option value="BYBIT">Bybit</option>
              <option value="OANDA">OANDA</option>
              <option value="FXCM">FXCM</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Timeframe</label>
            <input
              className="w-full bg-black border border-gray-700 rounded px-2 py-1 text-gray-200"
              value={brokerConfig.defaultTimeframe || ''}
              onChange={(e) =>
                setBrokerConfig((prev) => ({ ...prev, defaultTimeframe: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Symbol</label>
            <input
              className="w-full bg-black border border-gray-700 rounded px-2 py-1 text-gray-200"
              value={brokerConfig.defaultSymbol || ''}
              onChange={(e) =>
                setBrokerConfig((prev) => ({ ...prev, defaultSymbol: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      {/* API keys */}
      <div className="space-y-2 text-sm">
        <h3 className="font-semibold text-gray-200">API Keys</h3>

        <div className="grid grid-cols-2 gap-3">
          {/* OANDA */}
          <div>
            <div className="text-xs text-gray-400 mb-1">OANDA</div>
            <input
              placeholder="API Key"
              className="w-full mb-1 bg-black border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
              value={keys.oanda?.apiKey || ''}
              onChange={(e) =>
                setKeys((prev) => ({
                  ...prev,
                  oanda: { ...(prev.oanda || {}), apiKey: e.target.value },
                }))
              }
            />
            <input
              placeholder="Account ID"
              className="w-full bg-black border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
              value={keys.oanda?.accountId || ''}
              onChange={(e) =>
                setKeys((prev) => ({
                  ...prev,
                  oanda: { ...(prev.oanda || {}), accountId: e.target.value },
                }))
              }
            />
          </div>

          {/* Binance */}
          <div>
            <div className="text-xs text-gray-400 mb-1">Binance</div>
            <input
              placeholder="API Key"
              className="w-full mb-1 bg-black border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
              value={keys.binance?.apiKey || ''}
              onChange={(e) =>
                setKeys((prev) => ({
                  ...prev,
                  binance: { ...(prev.binance || {}), apiKey: e.target.value },
                }))
              }
            />
            <input
              placeholder="Secret"
              className="w-full bg-black border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
              value={keys.binance?.secret || ''}
              onChange={(e) =>
                setKeys((prev) => ({
                  ...prev,
                  binance: { ...(prev.binance || {}), secret: e.target.value },
                }))
              }
            />
          </div>

          {/* MT5 webhook */}
          <div>
            <div className="text-xs text-gray-400 mb-1">MT5 Webhook Secret</div>
            <input
              placeholder="Secret used in X-Flowrex-Secret header"
              className="w-full bg-black border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
              value={keys.mt5?.webhookSecret || ''}
              onChange={(e) =>
                setKeys((prev) => ({
                  ...prev,
                  mt5: { ...(prev.mt5 || {}), webhookSecret: e.target.value },
                }))
              }
            />
          </div>

          {/* TradingView webhook */}
          <div>
            <div className="text-xs text-gray-400 mb-1">TradingView Webhook Secret</div>
            <input
              placeholder="Secret used in X-Flowrex-Secret header"
              className="w-full bg-black border border-gray-700 rounded px-2 py-1 text-xs text-gray-200"
              value={keys.tradingview?.webhookSecret || ''}
              onChange={(e) =>
                setKeys((prev) => ({
                  ...prev,
                  tradingview: { ...(prev.tradingview || {}), webhookSecret: e.target.value },
                }))
              }
            />
          </div>
        </div>
      </div>

      <button onClick={save} className="px-3 py-1 bg-emerald-600 rounded text-sm">
        Save Workspace
      </button>

      <p className="text-[11px] text-gray-500 mt-1">
        Secrets are stored encrypted on the server. Do not share your API keys or webhook secrets
        with anyone.
      </p>
    </div>
  );
}
