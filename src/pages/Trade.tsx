import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import type { IChartApi } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, TrendingUp, TrendingDown, ChevronDown, ExternalLink, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TokenData {
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
  circulating_supply: number;
  total_supply: number;
}

interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  timestamp: Date;
  address: string;
}

interface Holder {
  address: string;
  balance: number;
  percentage: number;
}

export default function Trade() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);

  const [token, setToken] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLite, setIsLite] = useState(true);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [tradeType, setTradeType] = useState<'market' | 'limit'>('market');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [timeframe, setTimeframe] = useState<'1' | '7' | '30' | '90'>('7');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [holders, setHolders] = useState<Holder[]>([]);

  // Fetch token data
  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        const response = await fetch('/api/crypto/coins');
        const coins = await response.json();
        const selectedToken = coins.find((c: TokenData) => c.id === tokenId);
        
        if (selectedToken) {
          setToken(selectedToken);
          setPrice(selectedToken.current_price.toString());
          
          // Generate mock transactions
          const mockTxs: Transaction[] = Array.from({ length: 20 }, (_, i) => ({
            id: Math.random().toString(36).substr(2, 9),
            type: Math.random() > 0.5 ? 'buy' : 'sell',
            amount: Math.random() * 10,
            price: selectedToken.current_price * (0.95 + Math.random() * 0.1),
            total: 0,
            timestamp: new Date(Date.now() - i * 60000 * 5),
            address: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`
          }));
          mockTxs.forEach(tx => tx.total = tx.amount * tx.price);
          setTransactions(mockTxs);

          // Generate mock holders
          const mockHolders: Holder[] = Array.from({ length: 10 }, (_, i) => ({
            address: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 4)}`,
            balance: Math.random() * 1000000,
            percentage: Math.random() * 10
          }));
          setHolders(mockHolders);
        }
      } catch (error) {
        console.error('Error fetching token data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
  }, [tokenId]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current || !token) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#666666',
      },
      grid: {
        vertLines: { color: '#1a1a1a' },
        horzLines: { color: '#1a1a1a' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#1a1a1a',
      },
      rightPriceScale: {
        borderColor: '#1a1a1a',
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

    // Fetch OHLC data
    const fetchChartData = async () => {
      try {
        const response = await fetch(`/api/crypto/ohlc/${tokenId}?days=${timeframe}`);
        const ohlcData = await response.json();

        const formattedData = ohlcData.map((candle: number[]) => ({
          time: Math.floor(candle[0] / 1000),
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
        }));

        candlestickSeries.setData(formattedData);
        chart.timeScale().fitContent();
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    fetchChartData();

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
  }, [token, tokenId, timeframe]);

  const handleTrade = () => {
    if (!token || !amount) {
      toast({
        title: "Invalid Trade",
        description: "Please enter an amount",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Order Placed",
      description: `${orderType.toUpperCase()} ${amount} ${token.symbol.toUpperCase()} at $${price}`,
    });

    setAmount('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl">Token not found</div>
      </div>
    );
  }

  const priceChangePositive = token.price_change_percentage_24h >= 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] bg-[#0a0a0a] sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold flex items-center gap-1 cursor-pointer" onClick={() => navigate('/')}>
                <span className="text-white">$</span>
                <span className="text-white">kuru</span>
              </h1>
              <div className="flex items-center gap-1.5">
                <Button
                  variant={isLite ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setIsLite(true)}
                  className={isLite ? 'bg-[#a3e635] hover:bg-[#a3e635]/90 text-black font-medium h-8 px-4 rounded-full' : 'text-gray-400 hover:text-white h-8 px-4'}
                >
                  Lite
                </Button>
                <Button
                  variant={!isLite ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => { setIsLite(false); navigate("/discover"); }}
                  className={!isLite ? 'bg-gray-700 hover:bg-gray-600 h-8 px-4 rounded-full' : 'text-gray-400 hover:text-white h-8 px-4'}
                >
                  Pro
                </Button>
              </div>
            </div>

            <nav className="flex items-center gap-6">
              <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-transparent font-normal" onClick={() => navigate('/')}>
                Swap
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-transparent flex items-center gap-1 font-normal">
                    More <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <DropdownMenuItem onClick={() => navigate('/discover')} className="cursor-pointer hover:bg-[#2a2a2a] text-white">
                    Discover
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            <Button className="bg-transparent hover:bg-[#1a1a1a] text-white border border-[#2a2a2a] h-9 px-4 rounded-lg font-normal">
              Connect wallet
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        {/* Token Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/discover')} className="text-gray-400 hover:text-white p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={token.image} alt={token.name} className="w-12 h-12 rounded-full" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{token.name}</h1>
                <Badge className="bg-[#1a1a1a] text-gray-400 border-[#2a2a2a]">
                  {token.symbol.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-bold">${token.current_price.toLocaleString()}</span>
                <span className={`text-lg font-semibold flex items-center gap-1 ${priceChangePositive ? 'text-green-500' : 'text-red-500'}`}>
                  {priceChangePositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {priceChangePositive ? '+' : ''}{token.price_change_percentage_24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Chart + Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart */}
            <Card className="bg-[#141414] border-[#1a1a1a]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Price Chart</CardTitle>
                  <div className="flex gap-2">
                    {(['1', '7', '30', '90'] as const).map((tf) => (
                      <Button
                        key={tf}
                        variant={timeframe === tf ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setTimeframe(tf)}
                        className={timeframe === tf ? 'bg-[#a3e635] text-black h-7 px-3' : 'text-gray-400 h-7 px-3'}
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

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-[#141414] border-[#1a1a1a]">
                <CardContent className="p-4">
                  <p className="text-gray-500 text-xs mb-1">Market Cap</p>
                  <p className="text-lg font-bold">${(token.market_cap / 1e9).toFixed(2)}B</p>
                </CardContent>
              </Card>
              <Card className="bg-[#141414] border-[#1a1a1a]">
                <CardContent className="p-4">
                  <p className="text-gray-500 text-xs mb-1">24h Volume</p>
                  <p className="text-lg font-bold">${(token.total_volume / 1e9).toFixed(2)}B</p>
                </CardContent>
              </Card>
              <Card className="bg-[#141414] border-[#1a1a1a]">
                <CardContent className="p-4">
                  <p className="text-gray-500 text-xs mb-1">24h High</p>
                  <p className="text-lg font-bold">${token.high_24h.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-[#141414] border-[#1a1a1a]">
                <CardContent className="p-4">
                  <p className="text-gray-500 text-xs mb-1">24h Low</p>
                  <p className="text-lg font-bold">${token.low_24h.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs: Transactions & Holders */}
            <Tabs defaultValue="transactions" className="w-full">
              <TabsList className="bg-[#141414] border-[#1a1a1a]">
                <TabsTrigger value="transactions" className="data-[state=active]:bg-[#1a1a1a]">Transactions</TabsTrigger>
                <TabsTrigger value="holders" className="data-[state=active]:bg-[#1a1a1a]">Holders</TabsTrigger>
                <TabsTrigger value="info" className="data-[state=active]:bg-[#1a1a1a]">Info</TabsTrigger>
              </TabsList>

              <TabsContent value="transactions" className="mt-4">
                <Card className="bg-[#141414] border-[#1a1a1a]">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-[#1a1a1a]">
                          <tr className="text-left text-gray-500 text-xs">
                            <th className="p-3">Type</th>
                            <th className="p-3 text-right">Amount</th>
                            <th className="p-3 text-right">Price</th>
                            <th className="p-3 text-right">Total</th>
                            <th className="p-3">Time</th>
                            <th className="p-3">Address</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx) => (
                            <tr key={tx.id} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]/50">
                              <td className="p-3">
                                <Badge className={tx.type === 'buy' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                                  {tx.type.toUpperCase()}
                                </Badge>
                              </td>
                              <td className="p-3 text-right text-white">{tx.amount.toFixed(4)}</td>
                              <td className="p-3 text-right text-white">${tx.price.toFixed(2)}</td>
                              <td className="p-3 text-right text-white">${tx.total.toFixed(2)}</td>
                              <td className="p-3 text-gray-400 text-xs">{tx.timestamp.toLocaleTimeString()}</td>
                              <td className="p-3 text-gray-400 text-xs font-mono">{tx.address}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="holders" className="mt-4">
                <Card className="bg-[#141414] border-[#1a1a1a]">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-[#1a1a1a]">
                          <tr className="text-left text-gray-500 text-xs">
                            <th className="p-3">Rank</th>
                            <th className="p-3">Address</th>
                            <th className="p-3 text-right">Balance</th>
                            <th className="p-3 text-right">Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {holders.map((holder, index) => (
                            <tr key={holder.address} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]/50">
                              <td className="p-3 text-gray-400">{index + 1}</td>
                              <td className="p-3 text-white font-mono text-xs">{holder.address}</td>
                              <td className="p-3 text-right text-white">{holder.balance.toLocaleString()}</td>
                              <td className="p-3 text-right text-[#a3e635]">{holder.percentage.toFixed(2)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="info" className="mt-4">
                <Card className="bg-[#141414] border-[#1a1a1a]">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Circulating Supply</span>
                      <span className="text-white font-semibold">{token.circulating_supply?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Supply</span>
                      <span className="text-white font-semibold">{token.total_supply?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Market Cap Rank</span>
                      <span className="text-white font-semibold">#{token.market_cap}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Trade Panel */}
          <div className="space-y-4">
            <Card className="bg-[#141414] border-[#1a1a1a] rounded-2xl overflow-hidden">
              {/* Buy/Sell Tabs */}
              <div className="grid grid-cols-2 bg-[#1a1a1a]">
                <button
                  onClick={() => setOrderType('buy')}
                  className={`py-3 text-sm font-medium transition-colors ${
                    orderType === 'buy'
                      ? 'bg-green-500/20 text-green-500 border-b-2 border-green-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Buy
                </button>
                <button
                  onClick={() => setOrderType('sell')}
                  className={`py-3 text-sm font-medium transition-colors ${
                    orderType === 'sell'
                      ? 'bg-red-500/20 text-red-500 border-b-2 border-red-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sell
                </button>
              </div>

              <CardContent className="p-4 space-y-4">
                {/* Market/Limit Toggle */}
                <div className="flex gap-1 p-1 bg-[#1a1a1a] rounded-lg">
                  <button
                    onClick={() => setTradeType('market')}
                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                      tradeType === 'market'
                        ? 'bg-[#2a2a2a] text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Market
                  </button>
                  <button
                    onClick={() => setTradeType('limit')}
                    className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
                      tradeType === 'limit'
                        ? 'bg-[#2a2a2a] text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Limit
                  </button>
                </div>

                {/* Price Display / Input */}
                {tradeType === 'limit' ? (
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-500">Price</label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-11 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                        USD
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-[#1a1a1a] rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Market Price</span>
                      <span className="text-sm font-semibold text-white">
                        ${token.current_price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Amount */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-500">Amount</label>
                    <button className="text-xs text-[#a3e635] hover:text-[#a3e635]/80">
                      Max
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-11 pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                      {token.symbol.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Available Balance */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Available</span>
                  <span className="text-gray-400">0.00 USD</span>
                </div>

                {/* Total */}
                <div className="p-3 bg-[#1a1a1a] rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Total</span>
                    <span className="text-sm font-semibold text-white">
                      ${amount && price ? (parseFloat(amount) * parseFloat(price)).toFixed(2) : '0.00'} USD
                    </span>
                  </div>
                </div>

                {/* Connect or Place Order Button */}
                <Button
                  onClick={handleTrade}
                  className={`w-full h-11 text-sm font-semibold rounded-xl ${
                    orderType === 'buy'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {orderType === 'buy' ? 'Buy' : 'Sell'} {token.symbol.toUpperCase()}
                </Button>

                {/* Login Message */}
                <p className="text-center text-xs text-gray-500">
                  Connect wallet to start trading
                </p>
              </CardContent>
            </Card>

            {/* Order Book / Recent Activity */}
            <Card className="bg-[#141414] border-[#1a1a1a] rounded-2xl">
              <CardHeader>
                <CardTitle className="text-sm text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0.5">
                  {transactions.slice(0, 8).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between px-4 py-2 hover:bg-[#1a1a1a]/50 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className={tx.type === 'buy' ? 'text-green-500' : 'text-red-500'}>
                          {tx.type === 'buy' ? '▲' : '▼'}
                        </span>
                        <span className="text-white">${tx.price.toFixed(2)}</span>
                      </div>
                      <span className="text-gray-500">{tx.amount.toFixed(4)}</span>
                      <span className="text-gray-600">{tx.timestamp.toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600 text-xs">
          Built by <a href="https://devlo.ai" target="_blank" rel="noopener noreferrer" className="text-[#a3e635] hover:text-[#a3e635]/80">devlo</a>
        </div>
      </footer>
    </div>
  );
}
