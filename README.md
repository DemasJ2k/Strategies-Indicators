Flowrex — Market Playbook Agent

Institutional-grade, AI-powered trading analysis platform for Forex, Crypto, Indices, and more.

Flowrex combines multi-playbook logic, AI analysis, real-time market feeds, portfolio risk intelligence, trade journaling, user workspaces, and a conversational trading assistant — all inside a single modern web application.



🚀 
Features Overview


✅ 
1. Multi-Playbook AI Engine (NBB, Tori, Fabio, JadeCap…)

Flowrex analyzes market structure using your uploaded or live candles and generates:

	• Signal direction: long / short / neutral
	• Confidence score (0–100)
	• Grade: A / B / C
	• Primary + backup playbooks
	• Structured reasons + risk hints
	• Trade plan generation
	• Real-time overlays & confluence checks

All powered by GPT-5.1 with custom system prompting.



✅ 
2. Live Market Data (Broker Feeds + Webhooks)

Flowrex accepts market data from multiple sources:


Live Broker Providers

	• Binance (WS + REST)
	• Bybit
	• OANDA
	• FXCM
	• Easy plugin system to add more


Webhooks

	• MT5 EA → Flowrex (institutional candle structure)
	• TradingView Alerts → Flowrex (custom Pine Script JSON payloads)


Manual Data

	• CSV uploads
	• Candle JSON uploads



✅ 
3. Real-Time Signal Engine

Every tick / new candle feeds into Flowrex’s:

	• Context builder
	• Playbook classifier
	• Trade plan generator
	• AI signal builder
	• Overlay engine
	• Risk evaluator

Signals push instantly to the UI via Socket.IO.



✅ 
4. Portfolio Risk Radar

Institutional risk analytics:

	• Position exposure summary
	• Directional currency exposure (USD/JPY/…​)
	• Correlation matrix
	• Basket risk score
	• Volatility clustering
	• Diversification ranking
	• Portfolio alerts



✅ 
5. Trading Journal + Database (Postgres)

Flowrex maintains a persistent journal:

	• Every signal auto-logged
	• Log trades from signals
	• Track PnL, R-multiples, timestamps, notes
	• Tagging system (playbooks, psychology tags, patterns)
	• Per-user data isolation



✅ 
6. AI Chat Assistant

A GPT-5.1-powered assistant that understands:

	• Your latest analysis
	• Your recent signals
	• Your trades & performance
	• Your risk profile
	• Your active portfolio

Ask:

“Why did the agent choose NBB over JadeCap?”
“What’s my current exposure risk?”
“How have my trades performed this week?”
“Explain today’s liquidity dynamics on EURUSD.”



✅ 
7. User Authentication + Secure Workspaces

	• Email/password login
	• JWT authentication
	• Each user has an isolated workspace
	• API keys stored fully encrypted (AES-256-GCM)
	• User-specific:
		○ Broker keys
		○ MT5 webhook secret
		○ TradingView webhook secret
		○ Default provider/timeframe/symbol



✅ 
8. Production Deployment Setup (Docker + Nginx + Postgres)

We provide a full production setup:


Included in 
/deployment/

	• Dockerfile.backend
	• Dockerfile.frontend
	• docker-compose.yml (backend + frontend + Postgres)
	• nginx.frontend.conf
	• production.env.template
	• healthcheck.sh


Deployment options

	• Railway (one-click Docker deployment)
	• Render (backend + static frontend)
	• Local VPS (Docker Compose)



📂 
Project Structure
.
├── frontend/               # React + Vite UI
│   ├── components/
│   ├── store/
│   └── lib/
│
├── src/                    # Node.js backend (TypeScript)
│   ├── server.ts          # Main app entry
│   ├── ai/                # OpenAI integration
│   ├── core/              # Context, classification, trade plan
│   ├── signals/           # Flowrex signal engine
│   ├── journal/           # Trades & signals DB logic
│   ├── portfolio/         # Risk radar engine
│   ├── data-providers/    # Broker integrations
│   ├── live/              # Live feed router
│   ├── settings/          # User workspace settings
│   ├── auth/              # JWT + login/register
│   └── crypto/            # Encryption utilities
│
├── deployment/            # Production-ready deployment setup
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── docker-compose.yml
│   ├── nginx.frontend.conf
│   ├── production.env.template
│   └── healthcheck.sh
│
└── README.md              # You are here



🔧 
Development Setup


1. Install dependencies

Backend:
npm install
Frontend:
cd frontend
npm install



2. Environment Setup

Copy the template:
cp deployment/production.env.template .env
Fill in:

	• OPENAI_API_KEY
	• JWT_SECRET
	• ENCRYPTION_KEY
	• Broker defaults (optional)
	• DB connection strings (local or Docker)



3. Run everything with Docker (recommended)
cd deployment
docker compose up --build
Frontend → http://localhost:8080
Backend  → http://localhost:4000



4. Running without Docker (dev mode)

Backend dev:
npm run dev
Frontend dev:
cd frontend
npm run dev



🌐 
Deployment (Production)

You can deploy using:


Option A – Railway (easiest)

	• Connect GitHub → enable Docker → Railway auto-detects docker-compose.yml.
	• Add env vars from production.env.template.


Option B – Render

	• Create a Web Service for backend
	• Create a Static Site for frontend
	• Use Postgres via Render’s managed DB
	• Add all env vars


Option C – VPS (Docker Compose)
git clone <repo>
cd deployment
cp production.env.template production.env
docker compose up --build -d



🔁 
Live Data Connections


MT5 EA → Webhook

Your EA sends JSON to:
POST https://your-domain.com/api/webhook/mt5
Header: X-Flowrex-Secret: <per-user-secret>

TradingView → Webhook

Use the included Pine Script indicator.
POST https://your-domain.com/api/webhook/tradingview
Header: X-Flowrex-Secret: <per-user-secret>



🧠 
AI Interaction Examples

You can ask Flowrex:

	• “Explain the last signal in simple terms.”
	• “What’s my portfolio correlation?”
	• “Which playbook is performing best this month?”
	• “How risky is my current exposure?”
	• “Why is GU bearish today?”



🧱 
Tech Stack

	• Node.js + TypeScript (Backend)
	• React + Vite (Frontend UI)
	• Postgres (Journal + users + settings)
	• Socket.IO (Realtime updates)
	• OpenAI GPT-5.1 (AI analysis + assistant)
	• Docker + Nginx (Deployment)



🛠 
Planned Improvements (Optional)

These are possibilities for future updates:

	• Advanced analytics dashboards
	• Automated position sizing
	• Performance heatmap
	• Multi-playbook backtesting mode
	• Event-driven strategy triggers

