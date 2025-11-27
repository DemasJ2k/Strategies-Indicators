# 📘 Market Playbook Agent — Setup Instructions

This guide explains what to do immediately after cloning your repo.

---

## 1. Install Dependencies

### Backend

```bash
npm install
```

### Frontend

```bash
cd frontend
npm install
```

---

## 2. Create `.env` file

In backend root:

```env
PORT=4000
NODE_ENV=development
OPENAI_API_KEY=your_key_here
```

---

## 3. Development Mode

### Start backend:

```bash
npm run dev:server
```

### Start frontend:

```bash
cd frontend
npm run dev
```

Open → http://localhost:5173

---

## 4. Required Files to Add

You must add:

### 1. CSV sample data

Place candles files inside:
```
/data/*.csv
```

### 2. HTF candles

Optional, but recommended:
```
HTF_4H.csv
HTF_D1.csv
```

---

## 5. Testing the Agent

### Use CandleUploader

Paste JSON → click Analyze

### Use CSV Uploader

Upload EXEC / HTF / H4 data

### Use ReplayControl

Step through the market
Watch playbook rotation

---

## 6. Sending Live Data

### From TradingView alert

POST to:
```
/webhook/tradingview
```

### From MT5 EA

POST to:
```
/webhook/mt5
```

Payload must include:
- symbol
- instrument
- timeframe
- candles: []

---

## 7. Build for Production

### Backend

```bash
npm run build:server
```

### Frontend

```bash
cd frontend
npm run build
```

---

## 8. Deployment

See `deployment.md` for full instructions.

---

## 9. Debugging

Use `Debug Panel` in UI for:
- Detector outputs
- Context flags
- Playbook conflicts
- Overlay mapping
- Raw agent logs

```bash
npm run simulate:csv data/pair.csv
```

---

## 10. Recommended Workflow

1. Import CSV data
2. Test replay
3. Confirm playbook selection logic
4. Enable live mode
5. Deploy backend
6. Deploy frontend
7. Connect MT5 / TradingView
8. Done 🎉
