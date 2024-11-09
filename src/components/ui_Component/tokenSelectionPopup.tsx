import { X, Search } from "lucide-react";
import { useMemo, useState, memo } from "react";
import { TokenSymbol } from "../../config/tokens";
import {TokenSelectionPopupProps} from "../../utils/Modal";


//TODO: change Price_usd to bigint




const TokenSelectionPopup: React.FC<TokenSelectionPopupProps> = memo(({
  isOpen,
  onClose,
  onSelect,
  tokens,
  balances,
  disabledTokens,
  tokenPriceData
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredTokens = useMemo(() => {
    return Object.entries(tokens).filter(([symbol, config]) =>
      !disabledTokens.includes(symbol) &&
      (symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        config.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [tokens, searchTerm, disabledTokens]);

  const getTokenPrice = (symbol: TokenSymbol) => {
    const coinId = tokens[symbol]?.coingeckoId;
    if (!coinId) {
      console.log(`No coinId found for ${symbol}`);
      return 0;
    }

    // Debug logs
    console.log({
      symbol,
      coinId,
      priceData: tokenPriceData[coinId],
      allPriceData: tokenPriceData
    });

    const price = tokenPriceData[coinId]?.price_usd;
    if (typeof price === 'number' && !isNaN(price)) {
      return price;
    }

  };

  const getTokenBalance = (symbol: string) => {
    return parseFloat(balances[symbol] || "0");
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg w-96 max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">Select a token</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-center bg-gray-800 rounded-lg px-3 py-2 mb-4">
            <Search className="h-4 w-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search tokens"
              className="bg-transparent border-none focus:outline-none text-white w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {['ETH', 'USDC', 'USDT', 'WETH', 'SPX6900', 'MOG', 'HPOS', 'WOJAK', 'PEIPEI'].map((symbol) => (
              <button
                key={symbol}
                className="bg-gray-800 rounded-full px-3 py-1 text-sm"
                onClick={() => onSelect(symbol)}
              >
                {symbol}
              </button>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-sm text-gray-400 mb-2">Your tokens</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredTokens.map(([symbol, config]) => (
                <button
                  key={symbol}
                  className="flex items-center justify-between w-full px-3 py-2 hover:bg-gray-800 rounded-lg"
                  onClick={() => onSelect(symbol)}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={config.logo}
                      alt={`${symbol} logo`}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        // Fallback to config.logo if the image fails to load
                        (e.target as HTMLImageElement).src = config.logo;
                      }}
                    />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{symbol}</span>
                      <span className="text-sm text-gray-400">{config.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">
                      {(() => {
                        const price = getTokenPrice(symbol as TokenSymbol);
                        if (price === 0) {
                          return 'Price loading...';
                        }
                        return `$${price?.toFixed(price < 0.01 ? 8 : 2)} USD`;
                      })()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getTokenBalance(symbol).toFixed(4)} {symbol}
                    </div>

                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.isOpen === nextProps.isOpen &&
    prevProps.tokenPriceData === nextProps.tokenPriceData &&
    prevProps.balances === nextProps.balances;
});

export default TokenSelectionPopup;