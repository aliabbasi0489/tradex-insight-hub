# TradeX Backend API

FastAPI backend for TradeX - AI-powered robo-advisory platform.

## Features

- User authentication (JWT)
- Live stock data from Yahoo Finance
- AI-powered stock recommendations
- ML-based price predictions
- Alert system (price/date/event triggers)
- Chatbot integration (OpenAI)
- Portfolio management

## Setup

1. **Install dependencies**:
```bash
pip install -r requirements.txt
```

2. **Configure Supabase**:

Create these tables in your Supabase project:

**users table**:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**saved_stocks table**:
```sql
CREATE TABLE saved_stocks (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ticker VARCHAR(10) NOT NULL,
    saved_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(email, ticker)
);
```

**alerts table**:
```sql
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ticker VARCHAR(10) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL,
    trigger_value VARCHAR(100) NOT NULL,
    notification_method VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);
```

3. **Environment variables**:

Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Required variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon key
- `SUPABASE_SERVICE_KEY`: Your Supabase service key
- `SECRET_KEY`: Random string for JWT (generate with: `openssl rand -hex 32`)
- `OPENAI_API_KEY`: Your OpenAI API key (optional, chatbot will use fallback)

4. **Run the server**:
```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user

### Stock Data
- `GET /api/live_stock?ticker={TICKER}` - Get real-time stock data

### Recommendations
- `POST /api/recommendations` - Get AI stock recommendations

### Predictions
- `GET /api/predict_stock?ticker={TICKER}&period={PERIOD}` - Get price predictions

### Alerts
- `POST /api/alerts` - Create new alert

### Dashboard
- `GET /api/my_dashboard` - Get user's saved stocks and alerts
- `POST /api/saved_stocks` - Save a stock
- `DELETE /api/saved_stocks?ticker={TICKER}` - Remove saved stock

### Chatbot
- `POST /api/chatbot_response` - Chat with FinChat AI

## Frontend Setup

Update your frontend `.env` file:
```
VITE_API_BASE_URL=http://localhost:8000
```

## Production Deployment

1. Update CORS origins in `main.py`
2. Use strong `SECRET_KEY`
3. Enable HTTPS
4. Set up proper database indices
5. Configure rate limiting
6. Set up monitoring and logging
