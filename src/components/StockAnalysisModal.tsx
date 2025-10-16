import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StockChart } from '@/components/StockChart';
import { apiService, StockRecommendation, PredictionResponse } from '@/lib/api';
import { toast } from 'sonner';
import { Bell } from 'lucide-react';

interface StockAnalysisModalProps {
  stock: StockRecommendation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockAnalysisModal({ stock, open, onOpenChange }: StockAnalysisModalProps) {
  const [showPredictionForm, setShowPredictionForm] = useState(false);
  const [predictionType, setPredictionType] = useState<'Open' | 'High' | 'Low' | 'Close' | 'Volume'>('Close');
  const [predictionDays, setPredictionDays] = useState<7 | 15 | 30>(7);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [triggerType, setTriggerType] = useState<'price' | 'date' | 'event'>('price');
  const [triggerValue, setTriggerValue] = useState('');
  const [notificationMethod, setNotificationMethod] = useState<'Gmail' | 'WhatsApp'>('Gmail');

  const handleGetPrediction = async () => {
    setIsLoadingPrediction(true);
    try {
      const data = await apiService.getPrediction(stock.ticker, predictionType, predictionDays);
      setPrediction(data);
      toast.success('Prediction generated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to get prediction');
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  const handleSetAlert = async () => {
    if (!triggerValue.trim()) {
      toast.error('Please enter a trigger value');
      return;
    }

    try {
      await apiService.createAlert({
        ticker: stock.ticker,
        trigger_type: triggerType,
        trigger_value: triggerValue,
        notification_method: notificationMethod,
      });
      toast.success('Alert created successfully!');
      setTriggerValue('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create alert');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {stock.ticker} - {stock.name}
          </DialogTitle>
          <DialogDescription>
            AI-powered analysis and predictions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!showPredictionForm ? (
            <>
              {/* TradingView Graph */}
              <div className="h-96">
                <iframe
                  src={`https://www.tradingview.com/widgetembed/?symbol=${stock.ticker}&interval=D&theme=dark&style=1&locale=en&toolbar_bg=f1f3f6&enable_publishing=false&hide_top_toolbar=false&hide_legend=false&save_image=false&container_id=tradingview_chart`}
                  className="w-full h-full border-0 rounded-lg"
                  title={`${stock.ticker} Chart`}
                />
              </div>
              
              {/* AI Prediction Button */}
              <div className="flex justify-center">
                <Button onClick={() => setShowPredictionForm(true)} size="lg">
                  AI Prediction
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* LSTM Model Prediction Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Prediction Type</Label>
                    <Select value={predictionType} onValueChange={(v) => setPredictionType(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Close">Close</SelectItem>
                        <SelectItem value="Volume">Volume</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prediction Days</Label>
                    <Select value={predictionDays.toString()} onValueChange={(v) => setPredictionDays(parseInt(v) as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 Days</SelectItem>
                        <SelectItem value="15">15 Days</SelectItem>
                        <SelectItem value="30">30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleGetPrediction} disabled={isLoadingPrediction} className="w-full">
                      {isLoadingPrediction ? 'Loading...' : 'Generate Prediction'}
                    </Button>
                  </div>
                </div>

                {prediction && (
                  <div className="chart-container h-80">
                    <StockChart
                      data={prediction.forecast_data.map((item) => ({
                        time: item.time,
                        price: item.predicted_price,
                      }))}
                      isPositive={true}
                    />
                  </div>
                )}
                
                <Button variant="outline" onClick={() => setShowPredictionForm(false)} className="w-full">
                  Back to Chart
                </Button>
              </div>
            </>
          )}

          {/* Alert Setup */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Set Price Alert</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <Select value={triggerType} onValueChange={(v) => setTriggerType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Trigger Value</Label>
                <Input
                  placeholder={
                    triggerType === 'price'
                      ? '150.00'
                      : triggerType === 'date'
                      ? '2025-12-31'
                      : 'Earnings report'
                  }
                  value={triggerValue}
                  onChange={(e) => setTriggerValue(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Notification Method</Label>
                <Select value={notificationMethod} onValueChange={(v) => setNotificationMethod(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gmail">Gmail</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={handleSetAlert} className="w-full">
                  Set Alert
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
