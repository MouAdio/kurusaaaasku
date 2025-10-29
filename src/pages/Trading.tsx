import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CoinData {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
}

interface Order {
  id: string;
  type: 'buy' | 'sell';
  orderType: 'market' | 'limit';
  amount: number;
  price: number;
  total: number;
  timestamp: Date;
  status: 'completed' | 'pending' | 'cancelled';
}

export default function Trading() {
  const { coinId } = useParams<{ coinId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);

  const [coin, setCoin] = useState<CoinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [buySell, setBuySell] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [timeframe, setTimeframe] = useState<'1' | '7' | '30' | '90'>('7');

  // Fetch coin data
  useEffect(() => {
    const fetchCoinData = async () => {
      try {
        const response = await fetch('/api/crypto/coins');
        const coins = await response.json();
        const selectedCoin = coins.find((c: CoinData) => c.id === coinId);
        
        if (selectedCoin) {
          setCoin(selectedCoin);
          setPrice(selectedCoin.current_price.toString());
        }
      } catch (error) {
        console.error('Error fetching coin data:', error);
        toast({
          title: "Error",
          description: "Failed to load coin data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCoinData();
  }, [coinId, toast]);

  // Initialize and update chart
  useEffect(() => {
    if (!chartContainerRef.current || !coin) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // Fetch and set OHLC data
    const fetchChartData = async () => {
      try {
        const response = await fetch(`/api/crypto/ohlc/${coinId}?days=${timeframe}`);
        const ohlcData = await response.json();
        console.log('OHLC Data:', ohlcData.slice(0, 2));

        // Transform CoinGecko OHLC format to Lightweight Charts format
        const formattedData = ohlcData.map((candle: number[]) => ({
          time: Math.floor(candle[0] / 1000), // Convert ms to seconds
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
        }));

        console.log('Formatted Data:', JSON.stringify(formattedData.slice(0, 2), null, 2));
        console.log('Total candles:', formattedData.length);
        candlestickSeries.setData(formattedData);
        chart.timeScale().fitContent();
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    fetchChartData();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [coin, coinId, timeframe]);

  // Handle order submission
  const handlePlaceOrder = () => {
    if (!coin || !amount || (orderType === 'limit' && !price)) {
      toast({
        title: "Invalid Order",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const orderPrice = orderType === 'market' ? coin.current_price : parseFloat(price);
    const orderAmount = parseFloat(amount);
    const total = orderPrice * orderAmount;

    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      type: buySell,
      orderType,
      amount: orderAmount,
      price: orderPrice,
      total,
      timestamp: new Date(),
      status: orderType === 'market' ? 'completed' : 'pending'
    };

    setOrders([newOrder, ...orders]);
    
    toast({
      title: "Order Placed",
      description: `${buySell.toUpperCase()} ${orderAmount} ${coin.symbol.toUpperCase()} at $${orderPrice.toFixed(2)}`,
    });

    // Reset form
    setAmount('');
    if (orderType === 'limit') setPrice(coin.current_price.toString());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Coin not found</div>
      </div>
    );
  }

  const priceChangePositive = coin.price_change_percentage_24h >= 0;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img src={coin.image} alt={coin.name} className="w-10 h-10" />
              <div>
                <h1 className="text-2xl font-bold">{coin.name}</h1>
                <p className="text-gray-400 text-sm">{coin.symbol.toUpperCase()}/USD</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">${coin.current_price.toLocaleString()}</div>
              <div className={`flex items-center gap-1 justify-end ${priceChangePositive ? 'text-green-500' : 'text-red-500'}`}>
                {priceChangePositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{priceChangePositive ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-gray-900 border-gray-800" data-chart-card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Price Chart</CardTitle>
                  <div className="flex gap-2">
                    {(['1', '7', '30', '90'] as const).map((tf) => (
                      <Button
                        key={tf}
                        variant={timeframe === tf ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTimeframe(tf)}
                        className="text-xs"
                      >
                        {tf}D
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div ref={chartContainerRef} className="w-full" />
              </CardContent>
            </Card>

            {/* Market Stats */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Market Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Market Cap</p>
                    <p className="text-lg font-semibold">${(coin.market_cap / 1e9).toFixed(2)}B</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">24h Volume</p>
                    <p className="text-lg font-semibold">${(coin.total_volume / 1e9).toFixed(2)}B</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">24h High</p>
                    <p className="text-lg font-semibold">${coin.high_24h.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">24h Low</p>
                    <p className="text-lg font-semibold">${coin.low_24h.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading Panel */}
          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-800" data-trading-panel>
              <CardHeader>
                <CardTitle>Place Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Buy/Sell Tabs */}
                <Tabs value={buySell} onValueChange={(v) => setBuySell(v as 'buy' | 'sell')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="buy" className="data-[state=active]:bg-green-600">
                      Buy
                    </TabsTrigger>
                    <TabsTrigger value="sell" className="data-[state=active]:bg-red-600">
                      Sell
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Order Type */}
                <div className="flex gap-2">
                  <Button
                    variant={orderType === 'market' ? 'default' : 'outline'}
                    onClick={() => setOrderType('market')}
                    className="flex-1"
                  >
                    Market
                  </Button>
                  <Button
                    variant={orderType === 'limit' ? 'default' : 'outline'}
                    onClick={() => setOrderType('limit')}
                    className="flex-1"
                  >
                    Limit
                  </Button>
                </div>

                {/* Price Input (for limit orders) */}
                {orderType === 'limit' && (
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Price (USD)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                )}

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Amount ({coin.symbol.toUpperCase()})</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>

                {/* Total */}
                <div className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total</span>
                    <span className="font-semibold">
                      ${amount && price ? (parseFloat(amount) * parseFloat(price)).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>

                {/* Place Order Button */}
                <Button
                  onClick={handlePlaceOrder}
                  className={`w-full ${buySell === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {buySell === 'buy' ? 'Buy' : 'Sell'} {coin.symbol.toUpperCase()}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Orders History */}
        <Card className="mt-6 bg-gray-900 border-gray-800" data-orders-history>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No orders yet. Place your first order above!
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={order.type === 'buy' ? 'default' : 'destructive'}
                        className={order.type === 'buy' ? 'bg-green-600' : 'bg-red-600'}
                      >
                        {order.type.toUpperCase()}
                      </Badge>
                      <div>
                        <p className="font-semibold">
                          {order.amount} {coin.symbol.toUpperCase()} @ ${order.price.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {order.orderType} • {order.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${order.total.toFixed(2)}</p>
                      <Badge
                        variant={order.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer Attribution */}
      <footer className="border-t border-gray-800 mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          Built by <a href="https://devlo.ai" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400">devlo</a>
        </div>
      </footer>
    </div>
  );
}
