import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Eye, Save, ShoppingCart } from 'lucide-react';
import { apiService, StockRecommendation } from '@/lib/api';
import { toast } from 'sonner';
import { StockAnalysisModal } from '@/components/StockAnalysisModal';

export default function AIAdvisory() {
  const [riskLevel, setRiskLevel] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [horizon, setHorizon] = useState<'Short' | 'Long'>('Long');
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockRecommendation | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getRecommendations({
        risk_level: riskLevel,
        investment_horizon: horizon,
      });
      setRecommendations(data);
      toast.success(`Found ${data.length} recommendations for you!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = (stock: StockRecommendation) => {
    setSelectedStock(stock);
    setShowAnalysis(true);
  };

  const handleSave = async (ticker: string) => {
    try {
      await apiService.saveStock(ticker);
      toast.success(`${ticker} saved to your dashboard!`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save stock');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Sparkles className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">AI Advisory</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Get AI-Powered Recommendations</CardTitle>
          <CardDescription>
            Configure your preferences and let our AI find the best stocks for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Risk Level</Label>
              <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as any)}>
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
              <Select value={horizon} onValueChange={(v) => setHorizon(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Short">Short Term</SelectItem>
                  <SelectItem value="Long">Long Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleGetRecommendations} disabled={isLoading} className="w-full">
            {isLoading ? 'Analyzing...' : 'Get Recommendations'}
          </Button>
        </CardContent>
      </Card>

      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Top Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((stock) => (
              <Card key={stock.ticker} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{stock.ticker}</CardTitle>
                      <CardDescription>{stock.name}</CardDescription>
                    </div>
                    <Badge className="bg-gradient-success">
                      Score: {stock.forecast_score}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Current Price</div>
                    <div className="text-2xl font-bold text-success">
                      ${stock.current_price.toFixed(2)}
                    </div>
                  </div>

                  {stock.chart_data && stock.chart_data.length > 0 && (
                    <div className="h-20 flex items-end gap-1">
                      {stock.chart_data.slice(-20).map((point, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-success rounded-sm opacity-70"
                          style={{
                            height: `${(point.price / Math.max(...stock.chart_data!.map((p) => p.price))) * 100}%`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAnalyze(stock)}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSave(stock.ticker)}
                      className="w-full"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="w-full bg-gradient-success"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedStock && (
        <StockAnalysisModal
          stock={selectedStock}
          open={showAnalysis}
          onOpenChange={setShowAnalysis}
        />
      )}
    </div>
  );
}
