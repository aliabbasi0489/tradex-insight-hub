import { useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TradingViewIframe } from '@/components/TradingViewIframe';

const POPULAR_TICKERS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'BRK.B',
  'JPM', 'V', 'JNJ', 'WMT', 'PG', 'MA', 'UNH', 'DIS',
  'HD', 'PYPL', 'BAC', 'VZ', 'ADBE', 'NFLX', 'KO', 'PEP',
  'CMCSA', 'PFE', 'INTC', 'CSCO', 'XOM', 'T'
];

export default function LiveStocks() {
  const [searchTicker, setSearchTicker] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTicker.trim()) {
      setSelectedSymbol(`NASDAQ:${searchTicker.toUpperCase()}`);
      setShowModal(true);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold">Live Stock Data</h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Enter ticker symbol (e.g., AAPL, TSLA)"
                value={searchTicker}
                onChange={(e) => setSearchTicker(e.target.value.toUpperCase())}
                className="pl-10"
              />
            </div>
            <Button type="submit">
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {POPULAR_TICKERS.map((ticker) => (
          <TradingViewIframe key={ticker} symbol={`NASDAQ:${ticker}`} height="400px" />
        ))}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-6xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedSymbol}</DialogTitle>
          </DialogHeader>
          <div className="flex-1">
            <TradingViewIframe symbol={selectedSymbol} height="100%" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
