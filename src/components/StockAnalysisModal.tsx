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
  const [period, setPeriod] = useState<'Days' | 'Weeks' | 'Seasons' | 'Occasions'>('Days');
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);
  const [triggerType, setTriggerType] = useState<'price' | 'date' | 'event'>('price');
  const [triggerValue, setTriggerValue] = useState('');
  const [notificationMethod, setNotificationMethod] = useState<'Gmail' | 'WhatsApp'>('Gmail');

  const handleGetPrediction = async () => {
    setIsLoadingPrediction(true);
    try {
      const data = await apiService.getPrediction(stock.ticker, period);
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
          {/* Period Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label>Prediction Period</Label>
                <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Days">Days</SelectItem>
                    <SelectItem value="Weeks">Weeks</SelectItem>
                    <SelectItem value="Seasons">Seasons</SelectItem>
                    <SelectItem value="Occasions">Occasions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleGetPrediction} disabled={isLoadingPrediction} className="mt-6">
                {isLoadingPrediction ? 'Loading...' : 'AI Prediction'}
              </Button>
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
          </div>

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
