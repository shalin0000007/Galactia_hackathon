# AgentPay

> AI-Powered Autonomous Agent Payment System

## 🚀 Quick Start

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Add your OpenAI API key to .env
npm run dev
```

## 📁 Project Structure

```
├── backend/
│   ├── server.js              # Express entry point (port 3000)
│   ├── testAgent.js           # LangChain + OpenAI test script
│   ├── src/
│   │   ├── config/
│   │   │   ├── index.js       # Environment & app config
│   │   │   └── agentWallets.js # Manager, Research, Execution wallets
│   │   ├── middleware/
│   │   │   ├── auth.js        # JWT auth (dev bypass)
│   │   │   └── rateLimiter.js # Rate limiting
│   │   ├── routes/
│   │   │   └── wallet.js      # Wallet API routes
│   │   └── services/
│   │       └── walletService.js # Wallet operations (mock → WDK)
│   ├── .env.example
│   └── package.json
├── frontend/                   # Dashboard (Person B)
└── docs/
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| AI Engine | LangChain + OpenAI |
| Blockchain | WDK (Web5 Decentralized Key) |
| Frontend | Next.js + Tailwind CSS |

## 💰 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/agents` | Get all 3 agent wallets |
| POST | `/wallet/create` | Create a new wallet |
| GET | `/wallet/balance/:addr` | Get wallet balance |
| POST | `/wallet/send` | Send USDT between wallets |
| GET | `/wallet/all` | List all wallets |

## 🔑 Environment Variables

See `backend/.env.example` for all required variables.

## 👥 Team

- **Person A**: Backend + AI/ML
- **Person B**: Frontend + WDK Blockchain
