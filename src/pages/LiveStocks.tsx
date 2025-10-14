import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StockChart } from '@/components/StockChart';
import { apiService, StockData } from '@/lib/api';
import { toast } from 'sonner';

export default function LiveStocks() {
  const [ticker, setTicker] = useState('AAPL');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStockData = async (symbol: string) => {
    setIsLoading(true);
    try {
      const data = await apiService.getLiveStock(symbol);
      setStockData(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch stock data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (ticker) {
      fetchStockData(ticker);
    }
  }, []);

  useEffect(() => {
    if (!autoRefresh || !ticker) return;

    const interval = setInterval(() => {
      fetchStockData(ticker);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [ticker, autoRefresh]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) {
      fetchStockData(ticker.trim().toUpperCase());
    }
  };

  const isPositive = stockData ? stockData.percent_change >= 0 : true;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Live Stock Data</h1>
        <Button
          variant={autoRefresh ? 'default' : 'outline'}
          size="sm"
          onClick={() => setAutoRefresh(!autoRefresh)}
        >
          Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter ticker symbol (e.g., AAPL, TSLA)"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {stockData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Stock Name
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stockData.name}</div>
                <div className="text-sm text-muted-foreground">{stockData.ticker}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Current Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stockData.current_price.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Change
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold flex items-center gap-2 ${
                    isPositive ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                  {stockData.percent_change.toFixed(2)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Market Cap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(stockData.market_cap / 1e9).toFixed(2)}B
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Price Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {stockData.chart_data && stockData.chart_data.length > 0 ? (
                  <StockChart data={stockData.chart_data} isPositive={isPositive} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No chart data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
