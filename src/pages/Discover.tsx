import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, TrendingUp, TrendingDown, ChevronDown, Star } from 'lucide-react';

interface Token {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

export default function Discover() {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLite, setIsLite] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch('/api/crypto/coins');
        const data = await response.json();
        if (Array.isArray(data)) {
          setTokens(data);
        }
      } catch (error) {
        console.error('Error fetching tokens:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  const filteredTokens = tokens.filter(token =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <svg width="120" height="50" className="inline-block">
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] bg-[#0a0a0a] sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                <span className="text-white">$</span>
                <span className="text-white">kuru</span>
              </h1>
              <div className="flex items-center gap-2">
                <Button
                  variant={isLite ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsLite(true)}
                  className={isLite ? 'bg-[#a3e635] hover:bg-[#a3e635]/90 text-black' : 'border-gray-700 text-gray-400'}
                >
                  Lite
                </Button>
                <Button
                  variant={!isLite ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsLite(false)}
                  className={!isLite ? 'bg-gray-700 hover:bg-gray-600' : 'border-gray-700 text-gray-400'}
                >
                  Pro
                </Button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={() => navigate('/')}>
                Swap
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:text-gray-300 flex items-center gap-1">
                    More <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <DropdownMenuItem className="cursor-pointer hover:bg-gray-800 text-white">
                    Discover
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:bg-gray-800">
                    Exchange
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Connect Wallet */}
            <Button className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700">
              Connect wallet
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Discover</h1>
          <p className="text-gray-400 text-lg">Explore top cryptocurrencies and trending tokens</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 h-12 rounded-xl"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="mb-6" onValueChange={setActiveTab}>
          <TabsList className="bg-[#1a1a1a] border-[#2a2a2a]">
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-800">All</TabsTrigger>
            <TabsTrigger value="trending" className="data-[state=active]:bg-gray-800">Trending</TabsTrigger>
            <TabsTrigger value="gainers" className="data-[state=active]:bg-gray-800">Top Gainers</TabsTrigger>
            <TabsTrigger value="losers" className="data-[state=active]:bg-gray-800">Top Losers</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Token List */}
        <Card className="bg-[#141414] border-[#1a1a1a] rounded-2xl overflow-hidden" data-token-list>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading tokens...</div>
          ) : filteredTokens.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No tokens found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#1a1a1a]">
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="p-4 font-medium">
                      <Star className="w-4 h-4" />
                    </th>
                    <th className="p-4 font-medium">#</th>
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium text-right">Price</th>
                    <th className="p-4 font-medium text-right">24h Change</th>
                    <th className="p-4 font-medium text-right">Market Cap</th>
                    <th className="p-4 font-medium text-right">Volume (24h)</th>
                    <th className="p-4 font-medium text-center">Last 7 Days</th>
                    <th className="p-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTokens.map((token, index) => {
                    const priceChangePositive = token.price_change_percentage_24h >= 0;
                    return (
                      <tr
                        key={token.id}
                        className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/trade/${token.id}`)}
                      >
                        <td className="p-4">
                          <button className="text-gray-500 hover:text-yellow-500 transition-colors">
                            <Star className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="p-4 text-gray-400">{index + 1}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={token.image} alt={token.name} className="w-10 h-10 rounded-full" />
                            <div>
                              <p className="font-semibold text-white">{token.name}</p>
                              <p className="text-sm text-gray-400">{token.symbol.toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right font-semibold text-white">
                          ${token.current_price.toLocaleString()}
                        </td>
                        <td className={`p-4 text-right font-semibold ${priceChangePositive ? 'text-[#a3e635]' : 'text-red-500'}`}>
                          <div className="flex items-center justify-end gap-1">
                            {priceChangePositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {priceChangePositive ? '+' : ''}{token.price_change_percentage_24h.toFixed(2)}%
                          </div>
                        </td>
                        <td className="p-4 text-right text-gray-300">
                          ${(token.market_cap / 1e9).toFixed(2)}B
                        </td>
                        <td className="p-4 text-right text-gray-300">
                          ${(token.total_volume / 1e9).toFixed(2)}B
                        </td>
                        <td className="p-4 text-center">
                          {token.sparkline_in_7d && (
                            <MiniSparkline prices={token.sparkline_in_7d.price} />
                          )}
                        </td>
                        <td className="p-4">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/trade/${token.id}`);
                            }}
                            className="bg-[#a3e635] hover:bg-[#a3e635]/90 text-black"
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
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          Built by <a href="https://devlo.ai" target="_blank" rel="noopener noreferrer" className="text-[#a3e635] hover:text-[#a3e635]/80">devlo</a>
        </div>
      </footer>
    </div>
  );
}
