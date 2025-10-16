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
    const { ticker, prediction_type, days } = await req.json();
    console.log(`LSTM prediction request for ${ticker}, type: ${prediction_type}, days: ${days}`);

    // Get the Python backend URL from environment
    const PYTHON_BACKEND_URL = Deno.env.get('PYTHON_BACKEND_URL') || 'http://localhost:8000';
    
    // Call Python backend for LSTM inference
    const response = await fetch(
      `${PYTHON_BACKEND_URL}/api/lstm_predict?ticker=${ticker}&prediction_type=${prediction_type}&days=${days}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      console.error('Python backend error:', response.status, errorData);
      
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ 
            error: errorData.detail || `No trained model found for ${ticker}. Only AMZN models are currently available.`,
            available_tickers: ['AMZN'],
            available_types: ['Open', 'High', 'Low', 'Close', 'Volume']
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      throw new Error(errorData.detail || 'Failed to get prediction from Python backend');
    }

    const predictionData = await response.json();
    
    return new Response(
      JSON.stringify(predictionData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in lstm-prediction function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        note: 'Make sure the Python backend is running and accessible'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
