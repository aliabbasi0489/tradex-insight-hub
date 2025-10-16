import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticker, period } = await req.json();
    console.log(`Generating prediction for ${ticker} with period ${period}`);

    const TWELVE_DATA_API_KEY = Deno.env.get('TWELVE_DATA_API_KEY');
    if (!TWELVE_DATA_API_KEY) {
      throw new Error('TWELVE_DATA_API_KEY not configured');
    }

    // Fetch time series data from Twelve Data
    const interval = '1day';
    const outputsize = 30; // Get 30 days of historical data
    
    const timeSeriesResponse = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${ticker}&interval=${interval}&outputsize=${outputsize}&apikey=${TWELVE_DATA_API_KEY}`
    );

    if (!timeSeriesResponse.ok) {
      console.error('Twelve Data API error:', timeSeriesResponse.status);
      throw new Error('Failed to fetch stock data');
    }

    const timeSeriesData = await timeSeriesResponse.json();
    console.log('Time series data:', JSON.stringify(timeSeriesData, null, 2));

    if (!timeSeriesData.values || timeSeriesData.values.length === 0) {
      throw new Error('No historical data available for this stock');
    }

    // Calculate prediction periods based on user selection
    let predictionDays = 7; // Default to 7 days
    switch (period) {
      case 'Days':
        predictionDays = 7;
        break;
      case 'Weeks':
        predictionDays = 28; // 4 weeks
        break;
      case 'Seasons':
        predictionDays = 90; // ~3 months
        break;
      case 'Occasions':
        predictionDays = 180; // ~6 months
        break;
    }

    // Get the latest prices for trend analysis
    const recentPrices = timeSeriesData.values.slice(0, 10).map((v: any) => parseFloat(v.close));
    const latestPrice = recentPrices[0];
    
    // Calculate simple moving average and trend
    const avg = recentPrices.reduce((a: number, b: number) => a + b, 0) / recentPrices.length;
    const trend = (latestPrice - avg) / avg; // Percentage trend
    
    // Calculate volatility (standard deviation)
    const variance = recentPrices.reduce((sum: number, price: number) => 
      sum + Math.pow(price - avg, 2), 0) / recentPrices.length;
    const volatility = Math.sqrt(variance);

    // Generate predictions
    const forecastData = [];
    const today = new Date();
    
    for (let i = 1; i <= predictionDays; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      
      // Simple prediction model: trend + random walk with volatility
      const trendComponent = latestPrice * (1 + trend * (i / predictionDays));
      const randomComponent = (Math.random() - 0.5) * volatility * Math.sqrt(i);
      const predictedPrice = Math.max(0, trendComponent + randomComponent);
      
      forecastData.push({
        time: futureDate.toISOString().split('T')[0],
        predicted_price: parseFloat(predictedPrice.toFixed(2))
      });
    }

    return new Response(
      JSON.stringify({
        ticker,
        period,
        current_price: latestPrice,
        forecast_data: forecastData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in stock-prediction function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
