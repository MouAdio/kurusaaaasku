import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RefreshCw, Settings, ArrowDownUp, ChevronDown } from 'lucide-react';

interface Token {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

export default function Swap() {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [isLite, setIsLite] = useState(true);
  const [showFromTokens, setShowFromTokens] = useState(false);
  const [showToTokens, setShowToTokens] = useState(false);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch('/api/crypto/coins');
        const data = await response.json();
        if (Array.isArray(data)) {
          const tokenList = data.slice(0, 20).map((coin: any) => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol.toUpperCase(),
            image: coin.image,
            current_price: coin.current_price,
            price_change_percentage_24h: coin.price_change_percentage_24h,
          }));
          setTokens(tokenList);
          // Set default tokens
          if (tokenList.length >= 2) {
            setFromToken(tokenList.find((t: Token) => t.symbol === 'BTC') || tokenList[0]);
            setToToken(tokenList.find((t: Token) => t.symbol === 'USDC') || tokenList.find((t: Token) => t.symbol === 'USDT') || tokenList[1]);
          }
        }
      } catch (error) {
        console.error('Error fetching tokens:', error);
      }
    };

    fetchTokens();
  }, []);

  // Calculate swap amounts
  useEffect(() => {
    if (fromAmount && fromToken && toToken) {
      const from = parseFloat(fromAmount);
      if (!isNaN(from)) {
        const estimated = (from * fromToken.current_price) / toToken.current_price;
        setToAmount(estimated.toFixed(6));
      }
    } else if (!fromAmount) {
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken]);

  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const TokenSelector = ({ 
    token, 
    onSelect, 
    label,
    isOpen,
    setIsOpen
  }: { 
    token: Token | null; 
    onSelect: (token: Token) => void; 
    label: string;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
  }) => (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-2 py-1.5 h-auto hover:bg-[#1f1f1f] rounded-lg"
        >
          {token ? (
            <>
              <img src={token.image} alt={token.name} className="w-5 h-5 rounded-full" />
              <span className="font-medium text-white text-sm">{token.symbol}</span>
            </>
          ) : (
            <span className="text-gray-500 text-sm">Select token</span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 bg-[#1a1a1a] border-[#2a2a2a] max-h-96 overflow-y-auto">
        {tokens.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => {
              onSelect(t);
              setIsOpen(false);
            }}
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#222222] text-white"
          >
            <div className="flex items-center gap-3">
              <img src={t.image} alt={t.name} className="w-7 h-7 rounded-full" />
              <div>
                <p className="font-medium text-white text-sm">{t.symbol}</p>
                <p className="text-xs text-gray-500">{t.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white text-sm">${t.current_price.toLocaleString()}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold flex items-center gap-1">
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

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <Button variant="ghost" className="text-white hover:bg-transparent font-normal">
                Swap
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-transparent flex items-center gap-1 font-normal">
                    More <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <DropdownMenuItem onClick={() => navigate('/discover')} className="cursor-pointer hover:bg-[#2a2a2a] text-white">
                    Discover
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:bg-[#2a2a2a] text-white">
                    Exchange
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Connect Wallet */}
            <Button className="bg-transparent hover:bg-[#1a1a1a] text-white border border-[#2a2a2a] h-9 px-4 rounded-lg font-normal">
              Connect wallet
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-20 flex items-start justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md">
          {/* Swap Card */}
          <Card className="bg-[#141414] border-[#1f1f1f] rounded-3xl p-4" data-swap-card>
            {/* Settings Icons */}
            <div className="flex justify-end gap-1 mb-6">
              <Button
                size="icon"
                variant="ghost"
                className="w-9 h-9 rounded-full hover:bg-[#1f1f1f] text-gray-500 hover:text-gray-400"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="w-9 h-9 rounded-full hover:bg-[#1f1f1f] text-gray-500 hover:text-gray-400"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>

            {/* From Section */}
            <div className="space-y-2 mb-2">
              <label className="text-xs text-gray-500 font-normal pl-1">You pay</label>
              <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#1f1f1f]">
                <div className="flex items-center justify-between mb-2">
                  <TokenSelector
                    token={fromToken}
                    onSelect={setFromToken}
                    label="From"
                    isOpen={showFromTokens}
                    setIsOpen={setShowFromTokens}
                  />
                  <div className="text-right flex-1">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={fromAmount}
                      onChange={(e) => setFromAmount(e.target.value)}
                      className="text-right text-3xl font-normal bg-transparent border-none text-gray-400 placeholder:text-gray-600 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">≈ $0</span>
                </div>
              </div>
            </div>

            {/* Switch Button */}
            <div className="flex justify-center -my-2 relative z-10">
              <Button
                size="icon"
                onClick={switchTokens}
                className="w-8 h-8 rounded-lg bg-[#1a1a1a] hover:bg-[#222222] border border-[#1f1f1f] text-gray-500"
              >
                <ArrowDownUp className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* To Section */}
            <div className="space-y-2">
              <label className="text-xs text-gray-500 font-normal pl-1">You receive</label>
              <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#1f1f1f]">
                <div className="flex items-center justify-between mb-2">
                  <TokenSelector
                    token={toToken}
                    onSelect={setToToken}
                    label="To"
                    isOpen={showToTokens}
                    setIsOpen={setShowToTokens}
                  />
                  <div className="text-right flex-1">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={toAmount}
                      readOnly
                      className="text-right text-3xl font-normal bg-transparent border-none text-gray-400 placeholder:text-gray-600 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">$0</span>
                </div>
              </div>
            </div>

            {/* Connect Wallet Button */}
            <Button
              className="w-full mt-5 h-12 text-base font-medium rounded-2xl bg-[#a3e635] hover:bg-[#a3e635]/90 text-black"
              disabled={!fromAmount || !fromToken || !toToken}
            >
              Connect wallet
            </Button>
          </Card>
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
