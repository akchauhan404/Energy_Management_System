# AI-Based Energy Consumption Prediction & Optimization

A production-quality full-stack web application built as a final-year engineering project demonstrating AI-driven energy management using a Horizon-Specific Multi-Scale Transformer for time-series forecasting and a Stable-Baselines3 PPO reinforcement learning agent for energy dispatch optimization.

---

## 🚀 Quick Start

### Frontend (Mock Mode — No Backend Required)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

**Demo Login Credentials:**
| Role | Email | Password |
|------|-------|----------|
| User | `researcher@energy-ai.local` | `password123` |
| Admin | `admin@energy-ai.local` | `adminpass123` |

> The app runs in **Mock Mode** by default (`VITE_USE_MOCK_API=true`). All data, forecasts, optimization results, and admin metrics are served from realistic in-memory mock services — no database needed.

---

## 🏗️ Architecture

```
Major/
├── frontend/          # React 19 + Vite 8 + Tailwind CSS v4
│   ├── src/
│   │   ├── context/          # AuthContext, ThemeContext
│   │   ├── components/
│   │   │   ├── charts/       # Recharts chart components
│   │   │   ├── common/       # MetricCard, States, Badges
│   │   │   ├── energy/       # Upload, Preview, History
│   │   │   ├── forecast/     # ForecastSummary, Explanation
│   │   │   ├── layout/       # AppShell, Sidebar, Header
│   │   │   ├── optimization/ # OptimizationSummary, Schedule
│   │   │   └── settings/     # ColorTheme
│   │   ├── pages/
│   │   │   ├── admin/        # AdminDashboard, Datasets, Models, Training, ForecastPerformance, PPOPerformance, AdminSettings
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EnergyData.jsx
│   │   │   ├── Forecast.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Optimization.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Settings.jsx
│   │   ├── routes/           # AppRoutes with auth/admin guards
│   │   └── services/
│   │       └── api/          # apiClient, authApi, forecastApi, energyDataApi, optimizationApi, adminApi, profileApi, mockData
│   └── .env                  # VITE_USE_MOCK_API=true
│
└── backend/           # Node.js + Express + Prisma + PostgreSQL
    ├── prisma/schema.prisma  # 17-table schema (EnergyRecord, Forecast, PPO, Admin, etc.)
    └── src/
```

---

## 🎨 Design System — Neo-Energy Cyber-Glassmorphism

The UI uses a CSS-variable-based theme system with 5 color themes selectable at runtime:

| Theme | Mode | Description |
|-------|------|-------------|
| **Energy Dark** *(default)* | Dark | Neon green `#22ff88` on deep void `#07111f` |
| **Ocean Deep** | Dark | Electric cyan `#00c8ff` on oceanic `#071224` |
| **Forest** | Dark | Emerald `#10b981` on dark canopy `#051811` |
| **Solar Light** | Light | Solar green `#059669` on crisp `#f8fafc` |
| **Minimal** | Light | Royal indigo `#2563eb` on clean white |

All components use CSS custom properties (`--color-primary`, `--color-surface`, etc.) and glassmorphism utilities (`.glass-panel`, `.glass-panel-interactive`).

---

## 📊 AI Models

### 1. Forecast Model — Horizon-Specific Multi-Scale Transformer
- **Architecture:** Multi-head attention with horizon-specific heads
- **Input:** 15 engineered features (cyclical time encodings, lag features, rolling statistics)
- **Output:** 48-step (24-hour) energy consumption forecast at 30-min intervals
- **Test MAE:** 61.7247 Wh | **RMSE:** 89.4116 | **R²:** 0.9505

### 2. Optimization Agent — Stable-Baselines3 PPO
- **Algorithm:** Proximal Policy Optimization (MlpPolicy Actor-Critic)
- **Environment:** Simulated microgrid (10 kWh battery, 3 kW solar PV, TOU tariffs)
- **Test Results:** -4.70% grid energy, -2.69% cost, -9.95% peak demand
- **Constraint Compliance:** 0 violations, 100% renewable self-consumption

---

## ⚡ Features

### User Panel
- **Dashboard** — Live KPI cards, historical consumption chart, 24-hour forecast trajectory, PPO dispatch summary
- **Energy Data** — CSV upload with validation (timestamp + energy_kwh columns, 48-step minimum), upload history, data preview table
- **Forecast** — Full 48-step chart, forecast summary, feature attribution explanation (Captum Integrated Gradients)
- **Optimization** — PPO dispatch summary, 48-step schedule table, trajectory chart, decision explanations
- **Profile** — Edit name/email, change password
- **Settings** — 5-theme color picker, dispatch constraint config, notification preferences

### Admin Panel
- **Admin Dashboard** — System overview, dataset registry preview, model artifacts preview, quick navigation
- **Dataset Versioning** — Version registry with record counts, temporal ranges, status badges
- **Model Registry** — Forecast and PPO model artifact tracking
- **Training Operations** — Training run history with MAE/RMSE/R² metrics, trigger new training
- **Forecast Benchmarks** — Transformer vs GRU vs Seasonal Naive comparison table + trajectory chart
- **PPO Performance** — Validation + test split simulation results (grid energy, cost, peak demand)
- **System Config** — PPO environment parameter contract, 15-feature preprocessing contract

---

## 🔧 Environment Configuration

```env
# frontend/.env
VITE_API_URL=/api              # Proxied to backend on port 5000
VITE_USE_MOCK_API=true         # Set to 'false' to use real backend
```

### Switching to Real Backend

1. Set `VITE_USE_MOCK_API=false` in `frontend/.env`
2. Start the backend server (PostgreSQL + Prisma migrations)
3. The frontend automatically falls back to mock data on API failures

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 (CSS-first config) |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Routing | React Router DOM v7 |
| Backend | Node.js + Express |
| ORM | Prisma |
| Database | PostgreSQL |
| ML Forecasting | PyTorch Transformer |
| RL Optimization | Stable-Baselines3 PPO |
| XAI | Captum Integrated Gradients |
| Dataset | Low Carbon London (LCL) Smart Meter |

---

## 📋 Benchmark Disclosure

The GRU baseline achieves lower numerical test error (MAE: 53.25 vs 61.72; R²: 0.9638 vs 0.9505). The Transformer is selected as the project artifact for its multi-scale attention mechanism and Captum attribution capability. See `/admin/forecast-performance` for the full comparison table.

PPO metrics are simulation-derived (virtual battery, synthetic TOU tariffs, simulated solar PV) and do not represent direct physical household telemetry.
