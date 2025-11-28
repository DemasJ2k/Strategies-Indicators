# 📡 FlowrexBridgeEA - MT5 to Flowrex Integration

This Expert Advisor (EA) streams live candle data from MetaTrader 5 to your Flowrex backend, enabling real-time playbook analysis and automated trading signals.

---

## 🎯 What It Does

**FlowrexBridgeEA** automatically:
1. Detects new candles on any chart/timeframe
2. Packages the last N candles as JSON
3. POSTs to your Flowrex backend (`/webhook/mt5`)
4. Receives analysis results
5. Your web UI updates automatically via WebSocket

**Flow:**
```
MT5 Chart → FlowrexBridgeEA → Backend Webhook → Analysis → WebSocket → Web UI
```

---

## 📋 Installation Steps

### 1. Copy EA to MT5

1. Open MT5 → **File** → **Open Data Folder**
2. Navigate to: `MQL5/Experts/`
3. Create a folder called `Flowrex` (optional, for organization)
4. Copy `FlowrexBridgeEA.mq5` into that folder
5. Open **MetaEditor** (F4 in MT5 or Tools → MetaQuotes Language Editor)
6. Open the EA file
7. Click **Compile** (F7)
8. Check for any errors (should compile clean)

### 2. Enable WebRequest in MT5

**⚠️ CRITICAL:** MT5 blocks HTTP requests by default for security.

1. Go to **Tools** → **Options** → **Expert Advisors** tab
2. Check: ☑ **"Allow WebRequest for listed URL:"**
3. Add your backend URL:
   - **Production:** `https://your-server.com`
   - **Local testing:** `http://localhost:4000`
4. Click **OK**

### 3. Configure Backend Secret

In your project root, create a `.env` file (copy from `.env.example`):

```env
MT5_WEBHOOK_SECRET=your-super-secret-key-here
```

**⚠️ IMPORTANT:** This secret must match the EA's `InpSecretHeader` parameter.

### 4. Attach EA to Chart

1. Open any chart (e.g., EURUSD M15)
2. From **Navigator** → **Expert Advisors** → `Flowrex` folder
3. Drag **FlowrexBridgeEA** onto the chart
4. A settings dialog appears - configure:

**Input Parameters:**

| Parameter | Example Value | Description |
|-----------|--------------|-------------|
| `InpWebhookURL` | `http://localhost:4000/webhook/mt5` | Your backend webhook URL |
| `InpInstrumentType` | `FOREX` | Asset class (FOREX, CRYPTO, FUTURES) |
| `InpTimeframeMinutes` | `15` | Chart timeframe in minutes |
| `InpCandlesToSend` | `120` | How many candles to send (last 120 bars) |
| `InpSecretHeader` | `your-super-secret-key-here` | Must match `MT5_WEBHOOK_SECRET` in .env |
| `InpSendEveryBars` | `1` | Send every Nth bar (1 = every new bar) |
| `InpSendOnEveryTick` | `false` | Set true for tick-by-tick (not recommended) |

5. Check: ☑ **"Allow Algo Trading"**
6. Click **OK**

### 5. Enable Algo Trading

On the MT5 toolbar, click the **"Algo Trading"** button (green play icon).

It should turn **green** when active.

---

## ✅ Verify It's Working

### Check MT5 Logs

1. Open **Toolbox** panel (View → Toolbox or Ctrl+T)
2. Go to **Experts** tab
3. Look for:

```
FlowrexBridgeEA initialized on EURUSD / PERIOD_M15
Make sure WebRequest is enabled for: http://localhost:4000/webhook/mt5
FlowrexBridgeEA: Sending 1234 bytes to http://localhost:4000/webhook/mt5
FlowrexBridgeEA: Response status=200, body={"ok":true,"resultId":"..."}
```

### Check Backend Logs

Your Node.js server should log:

```
[Server] ✓ Analysis complete [/webhook/mt5]: FOREX 15m (120 candles) → NBB
```

### Check Web UI

Open http://localhost:5173

You should see:
- ✅ Candlestick chart updates automatically
- ✅ Playbook scores refresh
- ✅ Trade plan updates
- ✅ Debug panel shows new analysis

---

## ⚠️ Troubleshooting

### Error: WebRequest is not allowed

**Symptom:** MT5 logs show `error code 4014` or "WebRequest is not allowed"

**Solution:**
1. Go to **Tools** → **Options** → **Expert Advisors**
2. Make sure your URL is in the **WebRequest whitelist**
3. Restart MT5 after adding

### Error: Forbidden - Invalid secret

**Symptom:** MT5 logs show `Response status=403`

**Solution:**
- Check that `InpSecretHeader` in EA matches `MT5_WEBHOOK_SECRET` in `.env`
- Restart backend after changing `.env`

### No response / timeout

**Symptom:** EA logs show timeout or no response

**Solution:**
- Check backend is running (`npm run dev:server` or `ts-node src/server.ts`)
- Check firewall isn't blocking localhost:4000
- Try `curl http://localhost:4000/health` to verify backend is up

### Backend doesn't receive data

**Symptom:** No backend logs, web UI doesn't update

**Solution:**
- Check MT5 **Journal** tab for errors
- Verify EA is attached to chart (green smile icon in top-right)
- Check "Algo Trading" is enabled (green button in toolbar)

---

## 🔒 Security Best Practices

### For Production:

1. **Use HTTPS:** Never send data over HTTP in production
2. **Use strong secrets:** Generate random secret with:
   ```bash
   openssl rand -hex 32
   ```
3. **IP Whitelisting:** Configure `MT5_ALLOWED_IPS` in `.env`:
   ```env
   MT5_ALLOWED_IPS=203.0.113.0/24,198.51.100.0/24
   ```
4. **Rate limiting:** Add rate limiting middleware to backend
5. **Monitor logs:** Check for unauthorized webhook attempts

---

## 📊 JSON Payload Format

The EA sends this structure to `/webhook/mt5`:

```json
{
  "symbol": "EURUSD",
  "instrument": "FOREX",
  "timeframe": "15m",
  "candles": [
    {
      "time": 1732834800,
      "open": 1.10000,
      "high": 1.10234,
      "low": 1.09876,
      "close": 1.10123,
      "volume": 1234
    },
    ...
  ]
}
```

**Header:**
```
X-Flowrex-Secret: your-super-secret-key-here
```

---

## 🚀 Advanced Usage

### Send Multiple Timeframes

Attach the EA to multiple charts:
- EURUSD M15 (execution timeframe)
- EURUSD H1 (higher timeframe)
- EURUSD H4 (context timeframe)

Each will send independently to the backend.

### Custom Instruments

For crypto or futures, change `InpInstrumentType`:
- `FOREX` - Currency pairs
- `CRYPTO` - Bitcoin, Ethereum, etc.
- `FUTURES` - ES, NQ, etc.

### Throttling

To reduce server load:
- Set `InpSendEveryBars` = `5` (send every 5th bar)
- Or increase send frequency only during active trading hours

---

## 📚 Related Documentation

- **Backend Setup:** See `/instructions.md`
- **Deployment:** See `/deployment.md`
- **Environment Config:** See `/.env.example`
- **TradingView Integration:** See `/tradingview/README.md` (Phase 21)

---

## 🆘 Support

If you encounter issues:

1. Check MT5 **Experts** and **Journal** tabs for error codes
2. Check backend logs for webhook errors
3. Verify `.env` configuration matches EA inputs
4. Test with `curl` to isolate frontend/backend issues:

```bash
curl -X POST http://localhost:4000/webhook/mt5 \
  -H "Content-Type: application/json" \
  -H "X-Flowrex-Secret: your-super-secret-key-here" \
  -d '{"symbol":"EURUSD","instrument":"FOREX","timeframe":"15m","candles":[...]}'
```

---

**Flowrex Bridge EA v1.0** - Real-time MT5 → Flowrex Integration 🚀
