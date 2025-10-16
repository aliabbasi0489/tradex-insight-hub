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
    const { message } = await req.json();
    console.log('Received message:', message);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const TWELVE_DATA_API_KEY = Deno.env.get('TWELVE_DATA_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    if (!TWELVE_DATA_API_KEY) {
      throw new Error('TWELVE_DATA_API_KEY not configured');
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "get_stock_price",
          description: "Get the current price of a US stock using its ticker symbol. Use this when users ask about current stock prices.",
          parameters: {
            type: "object",
            properties: {
              symbol: {
                type: "string",
                description: "The stock ticker symbol (e.g., AAPL for Apple, TSLA for Tesla)"
              }
            },
            required: ["symbol"]
          }
        }
      }
    ];

    const messages = [
      {
        role: 'system',
        content: `You are FinChat, an AI assistant specialized in US stock market analysis. You help users with:
- Current stock prices and market data
- Stock recommendations based on market trends
- Price predictions for specific timeframes
- General market insights for US stocks only

When users ask for stock prices, use the get_stock_price function to fetch real-time data.
When making predictions, base them on current price data and market trends.
Keep responses focused on US stocks only. Be concise and professional.`
      },
      {
        role: 'user',
        content: message
      }
    ];

    console.log('Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        tools: tools,
        tool_choice: 'auto',
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', JSON.stringify(data, null, 2));

    const assistantMessage = data.choices[0].message;

    // Check if the model wants to call a function
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log('Function call detected');
      const toolCall = assistantMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      if (functionName === 'get_stock_price') {
        const symbol = functionArgs.symbol.toUpperCase();
        console.log(`Fetching stock price for ${symbol}`);

        // Fetch stock price from Twelve Data API
        const stockResponse = await fetch(
          `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${TWELVE_DATA_API_KEY}`
        );

        if (!stockResponse.ok) {
          console.error('Twelve Data API error:', stockResponse.status);
          return new Response(
            JSON.stringify({ 
              response: `Sorry, I couldn't fetch the price for ${symbol}. Please verify the ticker symbol is correct.` 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const stockData = await stockResponse.json();
        console.log('Stock data:', stockData);

        if (stockData.price) {
          // Send the function result back to OpenAI
          const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                ...messages,
                assistantMessage,
                {
                  role: 'tool',
                  tool_call_id: toolCall.id,
                  content: JSON.stringify({ 
                    symbol: symbol, 
                    price: stockData.price,
                    currency: 'USD'
                  })
                }
              ],
              temperature: 0.7,
            }),
          });

          const finalData = await finalResponse.json();
          const finalMessage = finalData.choices[0].message.content;

          return new Response(
            JSON.stringify({ response: finalMessage }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          return new Response(
            JSON.stringify({ 
              response: `I couldn't find pricing data for ${symbol}. Please check if the ticker symbol is correct.` 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // No function call, return the direct response
    const responseText = assistantMessage.content || "I'm here to help with US stock market information. Ask me about stock prices, recommendations, or predictions!";

    return new Response(
      JSON.stringify({ response: responseText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in chatbot function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
