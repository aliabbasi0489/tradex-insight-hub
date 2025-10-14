from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from jose import JWTError, jwt
from passlib.context import CryptContext
import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import openai

load_dotenv()

app = FastAPI(title="TradeX API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")

# Models
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str

class RecommendationRequest(BaseModel):
    risk_level: str
    investment_horizon: str
    sectors: Optional[List[str]] = None

class AlertRequest(BaseModel):
    ticker: str
    trigger_type: str
    trigger_value: str
    notification_method: str

class ChatMessage(BaseModel):
    message: str

class SavedStock(BaseModel):
    ticker: str

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def get_stock_data(ticker: str):
    """Fetch real-time stock data from Yahoo Finance"""
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        hist = stock.history(period="1d", interval="5m")
        
        current_price = info.get('currentPrice', info.get('regularMarketPrice', 0))
        previous_close = info.get('previousClose', current_price)
        percent_change = ((current_price - previous_close) / previous_close) * 100 if previous_close else 0
        
        chart_data = []
        if not hist.empty:
            for idx, row in hist.iterrows():
                chart_data.append({
                    "time": idx.strftime("%H:%M"),
                    "price": round(float(row['Close']), 2)
                })
        
        return {
            "ticker": ticker.upper(),
            "name": info.get('longName', ticker),
            "current_price": round(current_price, 2),
            "percent_change": round(percent_change, 2),
            "market_cap": info.get('marketCap', 0),
            "chart_data": chart_data
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Stock {ticker} not found")

def predict_stock_price(ticker: str, period: str):
    """Generate stock price predictions using ML"""
    try:
        stock = yf.Ticker(ticker)
        
        # Determine history period based on prediction period
        period_map = {
            "Days": "3mo",
            "Weeks": "6mo",
            "Seasons": "2y",
            "Occasions": "5y"
        }
        
        hist = stock.history(period=period_map.get(period, "6mo"))
        
        if hist.empty:
            raise HTTPException(status_code=404, detail="No historical data available")
        
        # Prepare features
        hist['Day'] = range(len(hist))
        X = hist[['Day']].values
        y = hist['Close'].values
        
        # Train simple model
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X, y)
        
        # Generate predictions
        forecast_periods = {
            "Days": 30,
            "Weeks": 12,
            "Seasons": 4,
            "Occasions": 12
        }
        
        periods = forecast_periods.get(period, 30)
        future_days = np.array([[len(hist) + i] for i in range(periods)])
        predictions = model.predict(future_days)
        
        forecast_data = []
        for i, pred in enumerate(predictions):
            if period == "Days":
                time_label = f"Day {i+1}"
            elif period == "Weeks":
                time_label = f"Week {i+1}"
            elif period == "Seasons":
                time_label = f"Q{i+1}"
            else:
                time_label = f"Month {i+1}"
            
            forecast_data.append({
                "time": time_label,
                "predicted_price": round(float(pred), 2)
            })
        
        return {
            "ticker": ticker.upper(),
            "forecast_data": forecast_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Routes
@app.get("/")
def read_root():
    return {"message": "TradeX API is running"}

@app.post("/api/register")
async def register(user: UserRegister):
    try:
        # Hash password
        hashed_password = get_password_hash(user.password)
        
        # Insert user into Supabase
        response = supabase.table('users').insert({
            "email": user.email,
            "password": hashed_password,
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        
        return {"message": "User registered successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/login")
async def login(user: UserLogin):
    try:
        # Get user from database
        response = supabase.table('users').select("*").eq('email', user.email).execute()
        
        if not response.data:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        db_user = response.data[0]
        
        # Verify password
        if not verify_password(user.password, db_user['password']):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create access token
        access_token = create_access_token(data={"sub": user.email})
        
        return {"token": access_token, "email": user.email}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/live_stock")
async def get_live_stock(ticker: str, current_user: str = Depends(get_current_user)):
    return get_stock_data(ticker)

@app.post("/api/recommendations")
async def get_recommendations(request: RecommendationRequest, current_user: str = Depends(get_current_user)):
    """Get AI-powered stock recommendations"""
    
    # Popular tickers by sector
    sector_tickers = {
        "Technology": ["AAPL", "MSFT", "GOOGL", "NVDA", "META"],
        "Finance": ["JPM", "BAC", "GS", "WFC", "C"],
        "Healthcare": ["JNJ", "UNH", "PFE", "ABBV", "LLY"],
        "Energy": ["XOM", "CVX", "COP", "SLB", "EOG"],
        "Consumer": ["AMZN", "TSLA", "NKE", "MCD", "SBUX"]
    }
    
    # Select tickers based on sectors or use diverse portfolio
    if request.sectors:
        tickers = []
        for sector in request.sectors:
            tickers.extend(sector_tickers.get(sector, [])[:2])
    else:
        tickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"]
    
    recommendations = []
    for ticker in tickers[:5]:
        try:
            stock_data = get_stock_data(ticker)
            
            # Calculate simple forecast score based on risk level
            score_multiplier = {
                "Low": 0.6,
                "Medium": 0.75,
                "High": 0.9
            }
            
            base_score = abs(stock_data['percent_change']) * 10
            forecast_score = min(base_score * score_multiplier.get(request.risk_level, 0.7), 100)
            
            recommendations.append({
                "ticker": stock_data['ticker'],
                "name": stock_data['name'],
                "current_price": stock_data['current_price'],
                "forecast_score": round(forecast_score, 1),
                "chart_data": stock_data.get('chart_data', [])[:10]
            })
        except:
            continue
    
    return recommendations

@app.get("/api/predict_stock")
async def predict_stock(ticker: str, period: str, current_user: str = Depends(get_current_user)):
    return predict_stock_price(ticker, period)

@app.post("/api/chatbot_response")
async def chatbot_response(message: ChatMessage, current_user: str = Depends(get_current_user)):
    """AI chatbot for financial queries"""
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are FinChat, an expert financial advisor AI. Provide clear, concise investment advice and stock market insights."},
                {"role": "user", "content": message.message}
            ],
            max_tokens=200
        )
        
        return {"response": response.choices[0].message.content}
    except:
        # Fallback response if OpenAI is not configured
        return {
            "response": f"I understand you're asking about: '{message.message}'. As a financial advisor, I recommend diversifying your portfolio and conducting thorough research before making investment decisions."
        }

@app.post("/api/alerts")
async def create_alert(alert: AlertRequest, current_user: str = Depends(get_current_user)):
    """Create price/event alerts"""
    try:
        response = supabase.table('alerts').insert({
            "email": current_user,
            "ticker": alert.ticker,
            "trigger_type": alert.trigger_type,
            "trigger_value": alert.trigger_value,
            "notification_method": alert.notification_method,
            "created_at": datetime.utcnow().isoformat(),
            "is_active": True
        }).execute()
        
        return {"message": "Alert created successfully", "alert": response.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/saved_stocks")
async def save_stock(stock: SavedStock, current_user: str = Depends(get_current_user)):
    """Save a stock to user's dashboard"""
    try:
        # Check if already saved
        existing = supabase.table('saved_stocks').select("*").eq('email', current_user).eq('ticker', stock.ticker).execute()
        
        if existing.data:
            return {"message": "Stock already saved"}
        
        response = supabase.table('saved_stocks').insert({
            "email": current_user,
            "ticker": stock.ticker,
            "saved_at": datetime.utcnow().isoformat()
        }).execute()
        
        return {"message": "Stock saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/saved_stocks")
async def remove_saved_stock(ticker: str, current_user: str = Depends(get_current_user)):
    """Remove a stock from user's dashboard"""
    try:
        supabase.table('saved_stocks').delete().eq('email', current_user).eq('ticker', ticker).execute()
        return {"message": "Stock removed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/my_dashboard")
async def get_dashboard(current_user: str = Depends(get_current_user)):
    """Get user's saved stocks and alerts"""
    try:
        # Get saved stocks
        saved_response = supabase.table('saved_stocks').select("*").eq('email', current_user).execute()
        
        saved_stocks = []
        for item in saved_response.data:
            try:
                stock_data = get_stock_data(item['ticker'])
                saved_stocks.append({
                    **stock_data,
                    "saved_at": item['saved_at']
                })
            except:
                continue
        
        # Get alerts
        alerts_response = supabase.table('alerts').select("*").eq('email', current_user).eq('is_active', True).execute()
        
        return {
            "saved_stocks": saved_stocks,
            "alerts": alerts_response.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
