import React, { useEffect, useState } from 'react';
import { TOKENS, TokenSymbol } from '../config/tokens';
import { fetchCoinData } from '../services/coinApi';

interface TokenMarketData {
  symbol: string;
  price: number | null;
  marketCap: number | null;
  status: 'success' | 'error';
  statusCode: number | null;
  errorMessage: string | null;
}

const Status: React.FC = () => {
  const [tokenData, setTokenData] = useState<TokenMarketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      const tokenSymbols = Object.keys(TOKENS) as TokenSymbol[];
      const results = await Promise.all(
        tokenSymbols
          .filter(symbol => TOKENS[symbol].coingeckoId)
          .map(async (symbol) => {
            try {
              const data = await fetchCoinData(TOKENS[symbol].coingeckoId!);
              return {
                symbol,
                price: data.price_usd,
                marketCap: data.market_cap_usd,
                status: 'success' as const,
                statusCode: 200,
                errorMessage: null,
              };
            } catch (error) {
              console.error(`Error fetching data for ${symbol}:`, error);
              return {
                symbol,
                price: null,
                marketCap: null,
                status: 'error' as const,
                statusCode: error.response?.status || null,
                errorMessage: error.message || 'Unknown error',
              };
            }
          })
      );

      setTokenData(results);
      setLoading(false);
    };

    fetchMarketData();
  }, []);

  if (loading) return <div className="text-center mt-8 text-green-400 text-xl">Initializing...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-green-400">Token Status</h1>
        <div className="overflow-x-auto bg-gray-800 rounded-lg shadow">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-700">
                <th className="py-3 px-4 text-left">Symbol</th>
                <th className="py-3 px-4 text-left">Price (USD)</th>
                <th className="py-3 px-4 text-left">Market Cap (USD)</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {tokenData.map((token) => (
                <tr key={token.symbol} className={`border-b border-gray-700 ${token.status === 'error' ? 'bg-red-900' : ''}`}>
                  <td className="py-3 px-4">{token.symbol}</td>
                  <td className="py-3 px-4">
                    {token.price !== null ? `$${token.price.toFixed(2)}` : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    {token.marketCap !== null ? `$${token.marketCap.toLocaleString()}` : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded ${token.status === 'success' ? 'bg-green-700 text-green-200' : 'bg-red-700 text-red-200'}`}>
                      {token.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {token.status === 'success' ? (
                      <span className="text-green-400">HTTP 200 OK</span>
                    ) : (
                      <span className="text-red-400">
                        {token.statusCode ? `HTTP ${token.statusCode}` : 'Unknown Error'}: {token.errorMessage}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Status;
