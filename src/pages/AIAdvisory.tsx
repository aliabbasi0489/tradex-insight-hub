import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Save } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { apiService, StockRecommendation } from '@/lib/api';
import { TradingViewIframe } from '@/components/TradingViewIframe';
import { toast } from 'sonner';

export default function AIAdvisory() {
  const [riskLevel, setRiskLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [investmentHorizon, setInvestmentHorizon] = useState<'Short' | 'Long'>('Long');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState('');

  const handleGetRecommendations = async () => {
    if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
      toast.error('Please enter a valid investment amount');
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiService.getRecommendations({
        risk_level: riskLevel,
        investment_horizon: investmentHorizon,
      });
      setRecommendations(data);
      toast.success('AI recommendations generated!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to get recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = (ticker: string) => {
    setSelectedTicker(ticker);
    setShowPrediction(true);
  };

  const handleSave = async (ticker: string) => {
    try {
      await apiService.saveStock(ticker);
      toast.success(`${ticker} saved to dashboard!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save stock');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold">AI Stock Advisory</h1>

      <Card>
        <CardHeader>
          <CardTitle>Get AI-Powered Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Risk Level</Label>
              <Select value={riskLevel} onValueChange={(value: any) => setRiskLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low Risk</SelectItem>
                  <SelectItem value="Medium">Medium Risk</SelectItem>
                  <SelectItem value="High">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Investment Horizon</Label>
              <Select
                value={investmentHorizon}
                onValueChange={(value: any) => setInvestmentHorizon(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Short">Short Term</SelectItem>
                  <SelectItem value="Long">Long Term</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Investment Amount ($)</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                min="1"
                step="100"
              />
            </div>
          </div>

          <Button 
            onClick={handleGetRecommendations}
            disabled={isLoading}
            className="w-full md:w-auto"
          >
            {isLoading ? 'Generating...' : 'Get Recommendations'}
          </Button>
        </CardContent>
      </Card>

      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-success" />
            Recommended Stocks
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((stock) => (
              <Card key={stock.ticker} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{stock.ticker}</CardTitle>
                      <div className="text-sm text-muted-foreground">{stock.name}</div>
                    </div>
                    <Badge variant="outline">
                      Score: {stock.forecast_score.toFixed(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAnalyze(stock.ticker)}
                      className="flex-1"
                    >
                      AI Prediction
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSave(stock.ticker)}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Dialog open={showPrediction} onOpenChange={setShowPrediction}>
        <DialogContent className="max-w-6xl h-[80vh]">
          <div className="flex-1">
            <TradingViewIframe symbol={`NASDAQ:${selectedTicker}`} height="100%" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
