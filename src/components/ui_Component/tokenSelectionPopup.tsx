import React, { useState, useEffect, memo } from 'react';
import { X, Search } from "lucide-react";
import { TokenConfig, CoinPriceData, TokenSymbol } from '../../utils/Modal';
import { toast } from "react-toastify";
import { TOKENS } from "../../config/tokens";
import { MOCK_BALANCES } from "../../utils/Modal";

interface TokenSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tokens: string[]) => void;
  tokens: Record<string, TokenConfig>;
  balances: Record<string, string>;
  disabledTokens: string[];
  tokenPriceData: Record<string, CoinPriceData>;
  selectedOutputTokens: string[];
  maxSelections?: number;
  allowMultiSelect?: boolean;
  selectedToken?: string | null;
}

const TokenSelectionPopup: React.FC<TokenSelectionPopupProps> = memo(({
  isOpen,
  onClose,
  onSelect,
  tokens,
  balances,
  disabledTokens,
  tokenPriceData,
  maxSelections = 4,
  selectedOutputTokens = [],
  allowMultiSelect = false,
  selectedToken = null,
  tokenBalances = MOCK_BALANCES
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [newSelections, setNewSelections] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setNewSelections(new Set());
      setSearchTerm("");
    }
  }, [isOpen]);

  const currentOutputTokens = selectedOutputTokens.filter(token => token !== '');

  const handleTokenClick = (symbol: string) => {
    if (allowMultiSelect) {
      const isAlreadySelected = currentOutputTokens.includes(symbol);
      const isNewlySelected = newSelections.has(symbol);

      if (isAlreadySelected) {
        toast.warning(`${symbol} is already in your output tokens`, {
          toastId: `already-selected-${symbol}`,
        });
        return;
      }

      setNewSelections(prev => {
        const updated = new Set(prev);
        if (isNewlySelected) {
          updated.delete(symbol);
        } else if (updated.size >= (maxSelections - currentOutputTokens.length)) {
          toast.warning(`Maximum ${maxSelections - currentOutputTokens.length} more token${maxSelections - currentOutputTokens.length === 1 ? '' : 's'} can be selected`, {
            toastId: `Maximum-Slots-Used-${symbol}`,
          });
        } else {
          updated.add(symbol);
        }
        return updated;
      });
    } else {
      onSelect([symbol]);
      onClose();
    }
  };

  const handleConfirmSelection = () => {
    const updatedTokens = [...currentOutputTokens];
    Array.from(newSelections).forEach(token => {
      if (updatedTokens.length < maxSelections) {
        updatedTokens.push(token);
      }
    });
    
    onSelect(updatedTokens);
    setNewSelections(new Set());
    onClose();
  };

  const filteredTokens = Object.entries(tokens).filter(([symbol, config]) => {
    const matchesSearch = symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (allowMultiSelect) {
      return matchesSearch && !disabledTokens.includes(symbol);
    } else {
      return matchesSearch && !selectedOutputTokens.includes(symbol);
    }
  });

  const getTokenPrice = (symbol: TokenSymbol) => {
    const coinId = tokens[symbol]?.coingeckoId;
    if (!coinId || !tokenPriceData[coinId]) return 0;
    return tokenPriceData[coinId].price_usd || 0;
  };

  const getTokenBalance = (symbol: string) => {
    return parseFloat(balances[symbol] || "0");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#191c2a] rounded-2xl w-96 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#293249] flex justify-between items-center">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white">Select tokens</h2>
            <span className="text-sm text-gray-400">
              {maxSelections - currentOutputTokens.length > 0 
                ? `Select up to ${maxSelections - currentOutputTokens.length} more token${maxSelections - currentOutputTokens.length === 1 ? '' : 's'}`
                : 'Maximum tokens selected'}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="p-4 border-b border-[#293249]">
            <div className="flex items-center bg-[#212638] rounded-xl px-4 py-3">
              <Search className="h-4 w-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search tokens"
                className="bg-transparent border-none focus:outline-none text-white w-full placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {['ETH', 'USDC', 'USDT', 'WETH', 'SPX6900', 'MOG', 'HPOS', 'WOJAK', 'PEIPEI'].map((symbol) => (
                <button
                  key={symbol}
                  onClick={() => handleTokenClick(symbol)}
                  disabled={disabledTokens.includes(symbol)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                    ${disabledTokens.includes(symbol)
                      ? 'bg-[#212638] text-gray-500 cursor-not-allowed'
                      : currentOutputTokens.includes(symbol) || newSelections.has(symbol)
                      ? 'bg-[#4c82fb] text-white'
                      : 'bg-[#293249] text-white hover:bg-[#374160]'
                    }`}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Token List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="space-y-2">
                {filteredTokens.map(([symbol, config]) => (
                  <button
                    key={symbol}
                    onClick={() => handleTokenClick(symbol)}
                    disabled={disabledTokens.includes(symbol)}
                    className={`w-full p-3 rounded-xl transition-colors flex items-center justify-between
                      ${disabledTokens.includes(symbol)
                        ? 'bg-[#212638] cursor-not-allowed opacity-50'
                        : currentOutputTokens.includes(symbol) || newSelections.has(symbol)
                        ? 'bg-[#293249] ring-2 ring-[#4c82fb]'
                        : 'bg-[#212638] hover:bg-[#293249]'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={config.logo}
                        alt={`${symbol} logo`}
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = config.logo;
                        }}
                      />
                      <div className="text-left">
                        <div className="font-medium text-white">{symbol}</div>
                        <div className="text-sm text-gray-400">{config.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white">
                        {getTokenBalance(symbol).toFixed(4)} {symbol}
                      </div>
                      <div className="text-sm text-gray-400">
                        ${(getTokenBalance(symbol) * getTokenPrice(symbol as TokenSymbol)).toFixed(2)} USD
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {allowMultiSelect && newSelections.size > 0 && (
          <div className="p-4 border-t border-[#293249]">
            <div className="text-sm text-gray-400 mb-2">
              New selections: {Array.from(newSelections).join(', ')}
            </div>
            <button
              onClick={handleConfirmSelection}
              className="w-full bg-gradient-to-r from-[#4c82fb] to-[#7b3fe4] hover:from-[#3a6fd0] hover:to-[#6a36c7] text-white font-medium py-3 px-4 rounded-xl transition-colors"
            >
              Confirm Selection ({currentOutputTokens.length + newSelections.size}/{maxSelections})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.isOpen === nextProps.isOpen &&
    prevProps.tokenPriceData === nextProps.tokenPriceData &&
    prevProps.balances === nextProps.balances &&
    prevProps.selectedOutputTokens === nextProps.selectedOutputTokens &&
    prevProps.selectedToken === nextProps.selectedToken;
});

export default TokenSelectionPopup;