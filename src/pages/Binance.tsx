import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bitcoin, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';

interface BinanceTicker {
  symbol: string;
  price: number;
  change: number;
  volume: number;
}

// Mock data - replace with actual Binance API integration
const mockTickers: BinanceTicker[] = [
  { symbol: 'BTCUSDT', price: 43250.50, change: 2.34, volume: 1234567890 },
  { symbol: 'ETHUSDT', price: 2285.75, change: -1.23, volume: 987654321 },
  { symbol: 'BNBUSDT', price: 315.20, change: 3.45, volume: 456789012 },
  { symbol: 'ADAUSDT', price: 0.52, change: 1.89, volume: 234567890 },
  { symbol: 'SOLUSDT', price: 98.45, change: -2.15, volume: 345678901 },
  { symbol: 'DOTUSDT', price: 7.23, change: 0.67, volume: 123456789 },
];

export default function Binance() {
  const [tickers, setTickers] = useState<BinanceTicker[]>(mockTickers);

  useEffect(() => {
    // Simulate real-time price updates
    const interval = setInterval(() => {
      setTickers((prev) =>
        prev.map((ticker) => ({
          ...ticker,
          price: ticker.price * (1 + (Math.random() - 0.5) * 0.01),
          change: ticker.change + (Math.random() - 0.5) * 0.5,
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleBuyOnBinance = (symbol: string) => {
    window.open(`https://www.binance.com/en/trade/${symbol}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Bitcoin className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">TradeX/Binance</h1>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Trade Crypto on Binance</h3>
              <p className="text-muted-foreground">
                Real-time cryptocurrency prices and direct trading integration
              </p>
            </div>
            <Button className="bg-gradient-primary">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Binance
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tickers.map((ticker) => {
          const isPositive = ticker.change >= 0;
          return (
            <Card key={ticker.symbol} className="hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{ticker.symbol}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Vol: ${(ticker.volume / 1e6).toFixed(2)}M
                    </div>
                  </div>
                  <Badge className={isPositive ? 'bg-success' : 'bg-destructive'}>
                    {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {isPositive ? '+' : ''}{ticker.change.toFixed(2)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Current Price</div>
                  <div className="text-3xl font-bold pulse-glow">
                    ${ticker.price.toFixed(2)}
                  </div>
                </div>

                <Button
                  onClick={() => handleBuyOnBinance(ticker.symbol)}
                  className="w-full bg-gradient-success"
                >
                  Buy on Binance
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integration Notice</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This integration allows you to view live cryptocurrency prices and provides direct links to trade on Binance.
            For full trading functionality, you'll be redirected to the Binance platform where you can execute trades
            using your Binance account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
