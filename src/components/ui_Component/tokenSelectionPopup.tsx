import { X, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { TokenConfig, TokenSymbol } from "../../config/tokens";

const MOCK_PRICES = {
    ETH: 2579,
    SPX6900: 0.7075,
    MOG: 0.000001809,
    WETH: 2579,
    USDC: 0.999898,
    HPOS: 0.2425,
    WOJAK: 0.0009993,
    PEIPEI: 0.0000001293,
  };



interface TokenSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (symbol: string) => void;
  tokens: Record<string, TokenConfig>;
  balances: Record<string, string>;
  disabledTokens: string[];
}

const TokenSelectionPopup: React.FC<TokenSelectionPopupProps> = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  tokens, 
  balances, 
  disabledTokens 
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
      return MOCK_PRICES[symbol as keyof typeof MOCK_PRICES] || 0;
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
                      />
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{symbol}</span>
                        <span className="text-sm text-gray-400">{config.name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                    <div className="text-sm text-gray-400">
                        ${getTokenPrice(symbol).toFixed(2)} USD
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
  };

  export default TokenSelectionPopup;