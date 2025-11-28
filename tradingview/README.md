# 📈 Flowrex TradingView Integration

Stream live market data from TradingView charts to your Flowrex backend for real-time AI analysis and playbook signals.

---

## 🎯 What It Does

**Flowrex Streamer** is a TradingView Pine Script indicator that:
1. Collects candle data from any TradingView chart
2. Builds JSON payload with last N bars
3. Sends alerts to your Flowrex webhook endpoint
4. Triggers real-time analysis and UI updates

**Flow:**
```
TradingView Chart → Alert Webhook → Backend /webhook/tradingview → Analysis → WebSocket → Web UI
```

---

## 🚀 Quick Start

### 1. Add Indicator to TradingView

1. Open TradingView
2. Click **Pine Editor** (bottom panel)
3. Click **"Open"** → **"New blank indicator"**
4. Delete all default code
5. Copy entire contents of `flowrex_tradingview_indicator.pine`
6. Paste into editor
7. Click **"Save"** → Name it **"Flowrex Streamer"**
8. Click **"Add to Chart"**

### 2. Configure Indicator Settings

Click the **⚙ Settings** icon on the indicator:

**Webhook Settings:**
- ☑ **Send alert every new bar?** → `true` (recommended)
- ☐ **Send alert on every tick** → `false` (high frequency, use with caution)

**Metadata:**
- **Candles to include in JSON** → `120` (adjust as needed, max 500)
- **Instrument Type** → Select from dropdown:
  - `FOREX` - Currency pairs
  - `CRYPTO` - Bitcoin, Ethereum, etc.
  - `FUTURES` - ES, NQ, etc.
  - `CFD` - Indices, commodities

### 3. Create Alert

1. Click **🔔 Alert** button (top toolbar)
2. In the alert dialog:
   - **Condition:** Select **"Flowrex Streamer"**
   - **Options:** Choose **"Once Per Bar Close"** (recommended)
   - **Expiration:** Set to your preference (or "Open-ended")

3. **Enable Webhook:**
   - Check ☑ **"Webhook URL"**
   - Enter your backend URL:
     - **Production:** `https://your-server.com/webhook/tradingview`
     - **Local testing:** `http://localhost:4000/webhook/tradingview`

4. **Alert Message:**
   - **CRITICAL:** Delete the default message
   - Paste exactly: `{{strategy.order.alert_message}}`
   - This tells TradingView to send the JSON from the indicator

5. **Alert Name:** `Flowrex - EURUSD M15` (or your symbol/timeframe)

6. Click **"Create"**

### 4. Configure Backend Secret

In your project `.env` file:

```env
TV_WEBHOOK_SECRET=your-super-secret-key-here
```

**⚠️ IMPORTANT:** For security, use a strong random secret in production:

```bash
# Generate a secure secret
openssl rand -hex 32
```

### 5. Add Secret to TradingView Alert (Optional - Production)

If you configured `TV_WEBHOOK_SECRET`:

TradingView doesn't support custom headers in webhook alerts, so for additional security:

**Option 1:** Include secret in URL as query parameter:
```
https://your-server.com/webhook/tradingview?secret=your-super-secret-key-here
```

Then update backend to check query param.

**Option 2:** Use IP whitelisting on your server
**Option 3:** Use TradingView's webhook signature validation (enterprise feature)

**For now:** Development mode allows webhooks without secrets.

---

## ✅ Verify It's Working

### Check TradingView Alerts

1. Go to **Alert Log** panel (bottom panel → Alerts tab)
2. Look for your alert firing
3. Check status:
   - ✅ **Green checkmark** = Alert sent successfully
   - ❌ **Red X** = Failed to send (check URL)

### Check Backend Logs

Your Node.js server should log:

```
[Server] ✓ Analysis complete [/webhook/tradingview]: FOREX 15m (120 candles) → NBB
```

### Check Web UI

Open http://localhost:5173

You should see:
- ✅ Candlestick chart updates automatically
- ✅ Symbol and timeframe match TradingView chart
- ✅ Playbook scores refresh in real-time
- ✅ Trade plan updates
- ✅ Debug panel shows new analysis

---

## 📊 JSON Payload Format

The indicator sends this structure to `/webhook/tradingview`:

```json
{
  "symbol": "EURUSD",
  "instrument": "FOREX",
  "timeframe": "15",
  "candles": [
    {
      "time": 1732834800,
      "open": 1.10000,
      "high": 1.10234,
      "low": 1.09876,
      "close": 1.10123,
      "volume": 12345
    },
    ...
  ]
}
```

**Fields:**
- `symbol` - Auto-detected from chart (e.g., "EURUSD", "BTCUSD")
- `instrument` - From indicator settings (FOREX, CRYPTO, FUTURES, CFD)
- `timeframe` - Auto-detected from chart (e.g., "15", "60", "240", "D")
- `candles` - Array of OHLCV data
  - `time` - Unix timestamp in seconds
  - `open, high, low, close` - Price data
  - `volume` - Volume/tick volume

---

## ⚠️ Troubleshooting

### Alert not firing

**Symptom:** No alerts in Alert Log

**Solutions:**
1. Check indicator is added to chart (visible in chart legend)
2. Verify alert condition is set to "Flowrex Streamer"
3. Wait for next bar close (if "Once Per Bar Close")
4. Check "Send alert every new bar?" is enabled in indicator settings

### Webhook URL error

**Symptom:** Red X in Alert Log, "Failed to send webhook"

**Solutions:**
1. Verify URL is correct and accessible
2. Check backend is running
3. Test with `curl`:
   ```bash
   curl -X POST http://localhost:4000/health
   ```
4. For local testing, use ngrok or expose localhost:
   ```bash
   ngrok http 4000
   # Use ngrok URL in alert: https://xyz.ngrok.io/webhook/tradingview
   ```

### Backend receives no data

**Symptom:** TradingView shows alert sent, but backend logs nothing

**Solutions:**
1. Check alert message is exactly: `{{strategy.order.alert_message}}`
2. Verify backend `/webhook/tradingview` endpoint exists
3. Check server logs for errors
4. Test endpoint manually:
   ```bash
   curl -X POST http://localhost:4000/webhook/tradingview \
     -H "Content-Type: application/json" \
     -d '{"symbol":"EURUSD","instrument":"FOREX","timeframe":"15","candles":[...]}'
   ```

### Web UI doesn't update

**Symptom:** Backend logs show analysis, but frontend doesn't change

**Solutions:**
1. Check frontend is running (http://localhost:5173)
2. Verify `LiveListener` component is mounted in App.tsx
3. Check browser console for WebSocket connection
4. Confirm Socket.IO is connected (should see "🔌 Live socket connected" in console)

### Invalid JSON format

**Symptom:** Backend returns 400 error

**Solutions:**
1. Check indicator version is Pine Script v5
2. Verify no syntax errors in Pine Script
3. Check `candles` array has at least 3 elements
4. Review backend logs for specific error message

---

## 🔒 Security Best Practices

### For Production:

1. **Use HTTPS:** Never use HTTP in production
   ```
   https://your-server.com/webhook/tradingview
   ```

2. **Use Strong Secrets:**
   ```bash
   # Generate secure secret
   openssl rand -hex 32
   ```

3. **Rate Limiting:** Add rate limiting middleware:
   ```ts
   import rateLimit from 'express-rate-limit';

   const webhookLimiter = rateLimit({
     windowMs: 1 * 60 * 1000, // 1 minute
     max: 100 // limit each IP to 100 requests per minute
   });

   app.post('/webhook/tradingview', webhookLimiter, async (req, res) => {
     // ...
   });
   ```

4. **IP Whitelisting:** Configure allowed IPs in `.env`:
   ```env
   TV_WEBHOOK_ALLOWED_IPS=104.16.0.0/12,172.64.0.0/13
   ```

5. **Monitor Logs:** Watch for unauthorized webhook attempts

---

## 🎨 Customization

### Adjust Candle Count

Send more or fewer candles:
```pine
candlesToSend = input.int(200, "Candles to include in JSON", minval=10, maxval=500)
```

### Send on Every Tick (High Frequency)

Enable for real-time tick updates:
```pine
sendOnEveryTick = input.bool(true, "Send alert on every tick (high frequency!)")
```

⚠️ **Warning:** This generates MANY alerts. Only use for scalping strategies.

### Multiple Timeframes

Create separate alerts for different timeframes:
1. Add indicator to EURUSD M15 chart → Create alert → Name: "Flowrex EURUSD M15"
2. Add indicator to EURUSD H1 chart → Create alert → Name: "Flowrex EURUSD H1"
3. Add indicator to EURUSD H4 chart → Create alert → Name: "Flowrex EURUSD H4"

Backend will receive all timeframes and analyze independently.

---

## 🚀 Advanced Features

### Multi-Symbol Monitoring

Monitor multiple pairs simultaneously:

1. Open EURUSD chart → Add indicator → Create alert
2. Open GBPUSD chart → Add indicator → Create alert
3. Open USDJPY chart → Add indicator → Create alert

Each will stream independently to Flowrex.

### Integration with Trading Strategies

Combine with your Pine Script strategies:

```pine
// Your strategy logic
if buySignal
    strategy.entry("Long", strategy.long)

// Trigger Flowrex analysis on strategy events
if buySignal or sellSignal
    alert(f_build_json(), alert.freq_once_per_bar)
```

### Custom Instrument Types

For exotic instruments, modify the indicator:

```pine
instrumentType = input.string("FOREX", "Instrument Type",
    options=["FOREX","CRYPTO","FUTURES","CFD","STOCKS","COMMODITIES"])
```

---

## 📚 Related Documentation

- **MT5 Integration:** See `/mt5/README.md`
- **Backend Setup:** See `/instructions.md`
- **Deployment:** See `/deployment.md`
- **Environment Config:** See `/.env.example`

---

## 🔄 How It Works

### Alert Trigger Flow

```
1. New bar closes on TradingView chart
   ↓
2. Indicator detects bar confirmation (barstate.isconfirmed)
   ↓
3. Builds JSON with last 120 candles
   ↓
4. Fires alert with JSON payload
   ↓
5. TradingView sends webhook POST to backend
   ↓
6. Backend validates request
   ↓
7. Runs detectors + classifier
   ↓
8. Broadcasts via Socket.IO
   ↓
9. Frontend auto-updates
```

### Data Structure

```
Pine Script Arrays → JSON Builder → Alert Message → Webhook → Backend → Analysis → WebSocket → UI
```

---

## 🆘 Support

For issues:

1. Check TradingView Alert Log for send status
2. Check backend logs for webhook receipt
3. Verify JSON format with manual curl test
4. Test WebSocket connection in browser console
5. Review indicator code for syntax errors

**Test Command:**
```bash
# Test webhook endpoint
curl -X POST http://localhost:4000/webhook/tradingview \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "EURUSD",
    "instrument": "FOREX",
    "timeframe": "15",
    "candles": [
      {"time": 1732834800, "open": 1.1, "high": 1.101, "low": 1.099, "close": 1.1001, "volume": 1000},
      {"time": 1732834860, "open": 1.1001, "high": 1.102, "low": 1.1, "close": 1.101, "volume": 1100},
      {"time": 1732834920, "open": 1.101, "high": 1.103, "low": 1.1005, "close": 1.102, "volume": 1200}
    ]
  }'
```

---

**Flowrex TradingView Streamer v1.0** - Real-time Chart → AI Analysis Integration 📈
