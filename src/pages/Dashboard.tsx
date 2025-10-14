import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Bell, TrendingUp } from 'lucide-react';
import { apiService } from '@/lib/api';
import { toast } from 'sonner';

interface SavedStock {
  ticker: string;
  name: string;
  current_price: number;
  percent_change: number;
  chart_data?: Array<{ time: string; price: number }>;
}

interface Alert {
  id: string;
  ticker: string;
  trigger_type: string;
  trigger_value: string;
  notification_method: string;
  active: boolean;
}

export default function Dashboard() {
  const [savedStocks, setSavedStocks] = useState<SavedStock[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getSavedStocks();
      setSavedStocks(data.saved_stocks || []);
      setAlerts(data.alerts || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStock = async (ticker: string) => {
    try {
      await apiService.removeSavedStock(ticker);
      setSavedStocks(savedStocks.filter((stock) => stock.ticker !== ticker));
      toast.success(`${ticker} removed from dashboard`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove stock');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold">My Dashboard</h1>

      {/* Saved Stocks */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-success" />
          Saved Stocks
        </h2>

        {savedStocks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No saved stocks yet. Visit AI Advisory to get recommendations!
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedStocks.map((stock) => (
              <Card key={stock.ticker} className="hover:border-primary transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{stock.ticker}</CardTitle>
                      <div className="text-sm text-muted-foreground">{stock.name}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveStock(stock.ticker)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Current Price</div>
                    <div
                      className={`text-2xl font-bold ${
                        stock.percent_change >= 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      ${stock.current_price.toFixed(2)}
                    </div>
                    <div
                      className={`text-sm ${
                        stock.percent_change >= 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {stock.percent_change >= 0 ? '+' : ''}
                      {stock.percent_change.toFixed(2)}%
                    </div>
                  </div>

                  {stock.chart_data && stock.chart_data.length > 0 && (
                    <div className="h-16 flex items-end gap-0.5">
                      {stock.chart_data.slice(-30).map((point, i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-sm ${
                            stock.percent_change >= 0 ? 'bg-success/60' : 'bg-destructive/60'
                          }`}
                          style={{
                            height: `${(point.price / Math.max(...stock.chart_data!.map((p) => p.price))) * 100}%`,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Active Alerts */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          Active Alerts
        </h2>

        {alerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No active alerts. Create alerts from stock analysis!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{alert.ticker}</Badge>
                      <div>
                        <div className="font-medium">
                          {alert.trigger_type.charAt(0).toUpperCase() + alert.trigger_type.slice(1)} Alert
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Trigger: {alert.trigger_value} • Notify via {alert.notification_method}
                        </div>
                      </div>
                    </div>
                    <Badge className={alert.active ? 'bg-success' : 'bg-muted'}>
                      {alert.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
