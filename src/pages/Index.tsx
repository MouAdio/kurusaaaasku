import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, Settings, ArrowDownUp, ChevronDown } from 'lucide-react';

interface Token {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export default function Index() {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isLite, setIsLite] = useState(true);

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await fetch('/api/crypto/coins');
        const data = await response.json();
        if (Array.isArray(data)) {
          setCoins(data);
        } else {
          console.error('Invalid data format:', data);
          setCoins([]);
        }
      } catch (error) {
        console.error('Error fetching coins:', error);
        setCoins([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
    const interval = setInterval(fetchCoins, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const filteredCoins = Array.isArray(coins) ? coins.filter(coin =>
    coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const MiniSparkline = ({ prices }: { prices: number[] }) => {
    if (!prices || prices.length === 0) return null;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min;

    const points = prices
      .map((price, i) => {
        const x = (i / (prices.length - 1)) * 100;
        const y = 100 - ((price - min) / range) * 100;
        return `${x},${y}`;
      })
      .join(' ');

    const isPositive = prices[prices.length - 1] >= prices[0];

    return (
      <svg width="100" height="40" className="inline-block">
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? '#10b981' : '#ef4444'}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      {/* Hero Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="h-10 w-10 text-blue-500" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Crypto Trading Platform
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Real-time cryptocurrency trading with live charts and market data
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-8" data-search-section>
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search cryptocurrencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 h-12"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 border-blue-800/30">
            <CardContent className="p-6">
              <p className="text-gray-400 text-sm mb-2">Total Market Cap</p>
              <p className="text-3xl font-bold">
                ${coins.reduce((acc, coin) => acc + coin.market_cap, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-900/20 to-green-950/20 border-green-800/30">
            <CardContent className="p-6">
              <p className="text-gray-400 text-sm mb-2">24h Volume</p>
              <p className="text-3xl font-bold">
                ${coins.reduce((acc, coin) => acc + coin.total_volume, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-950/20 border-purple-800/30">
            <CardContent className="p-6">
              <p className="text-gray-400 text-sm mb-2">Cryptocurrencies</p>
              <p className="text-3xl font-bold">{coins.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Coins List */}
        <Card className="bg-gray-900 border-gray-800" data-coins-list>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading cryptocurrencies...</div>
            ) : filteredCoins.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No cryptocurrencies found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-800">
                    <tr className="text-left text-gray-400 text-sm">
                      <th className="p-4">#</th>
                      <th className="p-4">Coin</th>
                      <th className="p-4 text-right">Price</th>
                      <th className="p-4 text-right">24h Change</th>
                      <th className="p-4 text-right hidden md:table-cell">Market Cap</th>
                      <th className="p-4 text-center hidden lg:table-cell">7d Chart</th>
                      <th className="p-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCoins.map((coin, index) => {
                      const priceChangePositive = coin.price_change_percentage_24h >= 0;
                      return (
                        <tr
                          key={coin.id}
                          className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/trade/${coin.id}`)}
                        >
                          <td className="p-4 text-gray-400">{index + 1}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={coin.image} alt={coin.name} className="w-8 h-8" />
                              <div>
                                <p className="font-semibold">{coin.name}</p>
                                <p className="text-sm text-gray-400">{coin.symbol.toUpperCase()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right font-semibold">
                            ${coin.current_price.toLocaleString()}
                          </td>
                          <td className={`p-4 text-right font-semibold ${priceChangePositive ? 'text-green-500' : 'text-red-500'}`}>
                            <div className="flex items-center justify-end gap-1">
                              {priceChangePositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                              {priceChangePositive ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                            </div>
                          </td>
                          <td className="p-4 text-right hidden md:table-cell">
                            ${(coin.market_cap / 1e9).toFixed(2)}B
                          </td>
                          <td className="p-4 text-center hidden lg:table-cell">
                            {coin.sparkline_in_7d && (
                              <MiniSparkline prices={coin.sparkline_in_7d.price} />
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/trade/${coin.id}`);
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Trade
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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