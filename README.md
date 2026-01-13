# 🎯 Financial Freedom Navigator

A comprehensive 3-year financial independence tracking system that helps you reach financial freedom in 36 months.

## Overview

The Financial Freedom Navigator is a full-stack application designed to help you:
- Track your path to financial independence
- Monitor passive income vs. living costs
- Manage multiple income engines
- Track asset productivity and automation
- Simulate financial decisions before making them
- Calculate your Freedom Score (0-100)

## 🎯 Financial Freedom Definition

You achieve financial freedom when:
- ✅ **Passive income ≥ Monthly living cost** (Coverage Ratio ≥ 100%)
- ✅ **Emergency fund ≥ 12 months** of living expenses
- ✅ **Debt ratio < 20%** (liabilities/assets)
- ✅ **At least 2 independent income engines**

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Node.js + Express
- TypeScript
- PostgreSQL
- RESTful API

**Frontend:**
- React 18
- TypeScript
- Tailwind CSS
- Vite
- Recharts for visualizations

### Project Structure

```
Freedom-cash/
├── backend/               # Express API server
│   ├── src/
│   │   ├── db/           # Database connection and migrations
│   │   ├── routes/       # API route handlers
│   │   ├── utils/        # Freedom Score calculations
│   │   └── index.ts      # Server entry point
│   └── package.json
├── frontend/             # React application
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── App.tsx       # Main app with routing
│   │   └── main.tsx      # Entry point
│   └── package.json
└── package.json          # Root workspace config
```

## 📊 Core Features

### 1. Freedom Dashboard
- Real-time Freedom Score (0-100)
- Coverage ratio (passive income / living cost)
- Net worth tracking
- Runway calculation (months until funds deplete)
- Projected freedom date

### 2. Income Engine Tracker
Track income sources by type:
- **Active:** Requires your time (job, consulting)
- **Semi-Passive:** Minimal involvement (managed rentals)
- **Passive:** Fully automated (dividends, royalties)

Each engine tracks:
- Monthly amount
- Annual growth rate
- Stability score (1-10)

### 3. Asset Productivity
Track assets with:
- Current value
- Monthly yield
- Annual ROI
- Automation level (1-10)

Categories: Real Estate, Stocks, Bonds, Crypto, Business, Savings

### 4. Liabilities Management
Track debts with:
- Remaining amount
- Interest rate
- Monthly payment
- Payoff progress

### 5. Decision Impact Simulator
Model "what-if" scenarios:
- Add new income source
- Make an investment
- Pay off debt
- Change living costs

See how each decision affects:
- Freedom date acceleration (months)
- Freedom Score change
- Net worth impact

### 6. Settings
Configure your targets:
- Monthly living cost
- Emergency fund target (months)
- Target debt ratio (%)
- Target number of income engines

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd Freedom-cash
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up PostgreSQL database:**
```bash
# Create database
createdb freedom_navigator

# Or using psql
psql -U postgres
CREATE DATABASE freedom_navigator;
\q
```

4. **Configure backend environment:**
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
```

5. **Run database migrations:**
```bash
npm run db:migrate
```

6. **Start development servers:**

In the root directory:
```bash
npm run dev
```

This starts both backend (port 3001) and frontend (port 3000) concurrently.

Or start them separately:
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

7. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

## 📐 Freedom Score Formula

The Freedom Score (0-100) is calculated using weighted components:

```
Freedom Score =
  Coverage_Ratio_Score × 0.35 +
  Emergency_Fund_Score × 0.20 +
  Debt_Score × 0.20 +
  Income_Diversity_Score × 0.15 +
  Net_Worth_Growth_Score × 0.10
```

**Component Calculations:**

1. **Coverage Ratio Score (35%):**
   - `(Passive Income / Living Cost) × 100`
   - Capped at 100

2. **Emergency Fund Score (20%):**
   - `(Emergency Fund / (Living Cost × 12)) × 100`
   - Capped at 100

3. **Debt Score (20%):**
   - Perfect score (100) if debt ratio ≤ 20%
   - Linear decline to 0 at 100% debt ratio

4. **Income Diversity Score (15%):**
   - `(Active Engines / Target Engines) × 100`
   - Measures diversification

5. **Net Worth Growth Score (10%):**
   - Based on 3-month growth trend
   - 50 = no change, 100 = +10% growth, 0 = -10% decline

## 🔌 API Endpoints

### Dashboard
- `GET /api/dashboard?user_id=<id>` - Get complete dashboard data
- `POST /api/dashboard/snapshot` - Create financial snapshot

### Income Engines
- `GET /api/income-engines?user_id=<id>` - List all income engines
- `POST /api/income-engines` - Create new income engine
- `PUT /api/income-engines/:id` - Update income engine
- `DELETE /api/income-engines/:id` - Delete income engine

### Assets
- `GET /api/assets?user_id=<id>` - List all assets
- `GET /api/assets/stats?user_id=<id>` - Get asset statistics
- `POST /api/assets` - Create new asset
- `PUT /api/assets/:id` - Update asset
- `DELETE /api/assets/:id` - Delete asset

### Liabilities
- `GET /api/liabilities?user_id=<id>` - List all liabilities
- `GET /api/liabilities/stats?user_id=<id>` - Get liability statistics
- `POST /api/liabilities` - Create new liability
- `PUT /api/liabilities/:id` - Update liability
- `DELETE /api/liabilities/:id` - Delete liability

### Simulator
- `POST /api/simulator/impact` - Calculate decision impact
- `GET /api/simulator/scenarios?user_id=<id>` - List saved scenarios
- `POST /api/simulator/scenarios` - Save simulation scenario
- `DELETE /api/simulator/scenarios/:id` - Delete scenario

### Settings
- `GET /api/settings?user_id=<id>` - Get user settings
- `POST /api/settings` - Update user settings

## 🗄️ Database Schema

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete schema documentation.

**Core Tables:**
- `users` - User accounts
- `financial_profiles` - User financial settings
- `income_engines` - Income sources
- `assets` - Asset tracking
- `liabilities` - Debt tracking
- `freedom_snapshots` - Historical progress tracking
- `simulation_scenarios` - Saved simulations

## 📈 Usage Guide

### Initial Setup

1. **Configure Settings:**
   - Navigate to Settings page
   - Enter your monthly living cost
   - Set your freedom targets

2. **Add Income Engines:**
   - Go to Income Engines page
   - Add all your income sources
   - Classify as active, semi-passive, or passive

3. **Add Assets:**
   - Navigate to Assets page
   - Add all your assets with current values
   - Enter monthly yield for income-producing assets

4. **Add Liabilities (if any):**
   - Go to Liabilities page
   - Add any debts with remaining amounts

5. **Check Dashboard:**
   - View your Freedom Score
   - See your projected freedom date
   - Monitor key metrics

### Using the Simulator

1. Go to Simulator page
2. Enter potential changes (new income, investment, etc.)
3. Click "Run Simulation"
4. See how your freedom date accelerates
5. Use insights to make informed decisions

## 🛠️ Development

### Building for Production

```bash
# Build both frontend and backend
npm run build

# Start production server
npm start
```

### Database Migrations

```bash
# Run migrations
npm run db:migrate

# Seed database with sample data (if available)
npm run db:seed
```

## 🔐 Security Notes

- User authentication not implemented (uses demo-user)
- For production use, implement JWT authentication
- Add password hashing and secure session management
- Enable HTTPS in production
- Add rate limiting to API endpoints

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! This is a tool designed to help people achieve financial independence.

## 💡 Tips for Financial Freedom

1. **Focus on passive income:** Build income engines that don't require your time
2. **Increase coverage ratio:** Goal is passive income ≥ living cost
3. **Build emergency fund:** 12+ months provides security
4. **Reduce debt:** Target <20% debt-to-asset ratio
5. **Diversify income:** Multiple sources reduce risk
6. **Use simulator:** Model decisions before executing them
7. **Track progress:** Regular monitoring keeps you accountable

---

**Built to help you achieve financial independence. Start tracking today!**
