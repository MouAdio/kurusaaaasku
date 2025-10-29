import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, TrendingUp, TrendingDown, ChevronDown, ExternalLink, Star } from 'lucide-react';

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
  market_cap_rank: number;
}

export default function TokenDetail() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const navigate = useNavigate();
  const [token, setToken] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLite, setIsLite] = useState(true);

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        const response = await fetch('/api/crypto/coins');
        const coins = await response.json();
        const selectedToken = coins.find((c: TokenData) => c.id === tokenId);
        
        if (selectedToken) {
          setToken(selectedToken);
        }
      } catch (error) {
        console.error('Error fetching token data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
  }, [tokenId]);

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
                  <DropdownMenuItem onClick={() => navigate('/discover')} className="cursor-pointer hover:bg-gray-800">
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
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/discover')}
          className="mb-6 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Discover
        </Button>

        {/* Token Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <img src={token.image} alt={token.name} className="w-20 h-20 rounded-full" />
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold">{token.name}</h1>
                  <Badge variant="outline" className="text-gray-400 border-gray-700">
                    {token.symbol.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-gray-400 border-gray-700">
                    Rank #{token.market_cap_rank}
                  </Badge>
                  <button className="text-gray-400 hover:text-yellow-500 transition-colors">
                    <Star className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-bold">${token.current_price.toLocaleString()}</span>
                  <span className={`text-2xl font-semibold flex items-center gap-1 ${priceChangePositive ? 'text-[#a3e635]' : 'text-red-500'}`}>
                    {priceChangePositive ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                    {priceChangePositive ? '+' : ''}{token.price_change_percentage_24h.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => navigate(`/?from=${token.id}`)}
              className="bg-[#a3e635] hover:bg-[#a3e635]/90 text-black h-12 px-8 text-lg font-semibold"
            >
              Trade {token.symbol.toUpperCase()}
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#141414] border-[#1a1a1a]">
            <CardContent className="p-6">
              <p className="text-gray-400 text-sm mb-2">Market Cap</p>
              <p className="text-2xl font-bold">${(token.market_cap / 1e9).toFixed(2)}B</p>
            </CardContent>
          </Card>
          <Card className="bg-[#141414] border-[#1a1a1a]">
            <CardContent className="p-6">
              <p className="text-gray-400 text-sm mb-2">24h Volume</p>
              <p className="text-2xl font-bold">${(token.total_volume / 1e9).toFixed(2)}B</p>
            </CardContent>
          </Card>
          <Card className="bg-[#141414] border-[#1a1a1a]">
            <CardContent className="p-6">
              <p className="text-gray-400 text-sm mb-2">24h High</p>
              <p className="text-2xl font-bold">${token.high_24h.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#141414] border-[#1a1a1a]">
            <CardContent className="p-6">
              <p className="text-gray-400 text-sm mb-2">24h Low</p>
              <p className="text-2xl font-bold">${token.low_24h.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="bg-[#141414] border-[#1a1a1a]">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#1a1a1a]">Overview</TabsTrigger>
            <TabsTrigger value="markets" className="data-[state=active]:bg-[#1a1a1a]">Markets</TabsTrigger>
            <TabsTrigger value="news" className="data-[state=active]:bg-[#1a1a1a]">News</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card className="bg-[#141414] border-[#1a1a1a]">
              <CardHeader>
                <CardTitle>About {token.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 leading-relaxed">
                  {token.name} ({token.symbol.toUpperCase()}) is currently ranked #{token.market_cap_rank} by market capitalization.
                  The current price is ${token.current_price.toLocaleString()} with a 24-hour trading volume of ${(token.total_volume / 1e9).toFixed(2)} billion.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="markets" className="mt-6">
            <Card className="bg-[#141414] border-[#1a1a1a]">
              <CardHeader>
                <CardTitle>Markets</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Market data will be displayed here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="news" className="mt-6">
            <Card className="bg-[#141414] border-[#1a1a1a]">
              <CardHeader>
                <CardTitle>Latest News</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">News feed will be displayed here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
