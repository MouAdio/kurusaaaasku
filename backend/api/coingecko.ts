import type { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  ASSETS: Fetcher;
};

type App = Hono<{ Bindings: Bindings }>;

const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export default (app: App) => {
  // Get top coins with market data
  app.get('/api/crypto/coins', async (c) => {
    try {
      console.log('Fetching coins from CoinGecko...');
      const response = await fetch(
        `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h,7d`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );
      
      if (!response.ok) {
        console.error('CoinGecko API error:', response.status, response.statusText);
        return c.json({ error: `CoinGecko API returned ${response.status}` }, 500);
      }
      
      const data = await response.json();
      console.log(`Successfully fetched ${data.length || 0} coins`);
      return c.json(data);
    } catch (error) {
      console.error('Error in /api/crypto/coins:', error);
      return c.json({ error: 'Failed to fetch coins', details: String(error) }, 500);
    }
  });

  // Get detailed coin data with historical data
  app.get('/api/crypto/coin/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const response = await fetch(
        `${COINGECKO_API}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
      );
      const data = await response.json();
      return c.json(data);
    } catch (error) {
      return c.json({ error: 'Failed to fetch coin data' }, 500);
    }
  });

  // Get OHLC (candlestick) data for charts
  app.get('/api/crypto/ohlc/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const days = c.req.query('days') || '7';
      const response = await fetch(
        `${COINGECKO_API}/coins/${id}/ohlc?vs_currency=usd&days=${days}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        }
      );
      const data = await response.json();
      return c.json(data);
    } catch (error) {
      return c.json({ error: 'Failed to fetch OHLC data' }, 500);
    }
  });

  // Get trending coins
  app.get('/api/crypto/trending', async (c) => {
    try {
      const response = await fetch(`${COINGECKO_API}/search/trending`);
      const data = await response.json();
      return c.json(data);
    } catch (error) {
      return c.json({ error: 'Failed to fetch trending coins' }, 500);
    }
  });

  // Search coins
  app.get('/api/crypto/search', async (c) => {
    try {
      const query = c.req.query('q') || '';
      const response = await fetch(`${COINGECKO_API}/search?query=${query}`);
      const data = await response.json();
      return c.json(data);
    } catch (error) {
      return c.json({ error: 'Failed to search coins' }, 500);
    }
  });
};
