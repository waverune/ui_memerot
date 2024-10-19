"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ArrowDownUp, ChevronDown, Lock, Unlock, Plus, X, Search, Settings } from "lucide-react";
import Image from "next/image";

import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider,
  Chain,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, base } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useBalance,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import {
  getTokenBalance,
  approveToken,
  performSwap,
  getExpectedOutputAmount,
  performHardcodedSwap,
  checkAndApproveToken,
} from "../lib/tx_utils";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { useToast } from '../hooks/useToast';
// import { SWAP_ABI } from "../lib/contracts";
import { TOKENS, TokenSymbol } from '../config/tokens';

const BuildBearChain = {
  id: 21026,
  name: "BuildBear",
  nativeCurrency: {
    name: "BuildBear",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.buildbear.io/sorry-caliban-d9f928d6"],
    },
  },
  blockExplorers: {
    default: {
      name: "BuildBear Explorer",
      url: "https://explorer.buildbear.io/sorry-caliban-d9f928d6/",
    },
  },
  iconUrl: "https://example.com/avax-icon.png",
  iconBackground: "#fff",
} as const satisfies Chain;

// const { chains, provider } = configureChains(
//   [avalancheChain],
//   [alchemyProvider({ apiKey: "YOUR_ALCHEMY_API_KEY" }), publicProvider()]
// );

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: "My RainbowKit App",
  projectId: "288a12f8c7549e28f9540f38707c3c19",
  chains: [mainnet, polygon, optimism, arbitrum, base, BuildBearChain],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

const CustomConnectButton = () => {
  return (
    <button>
      <ConnectButton />
    </button>
  );
};

// Assuming the images are stored in the public folder
const mogLogo = "/mog-logo.png";
const spx6900Logo = "/spx6900-logo.png";

const ethPrice = 2600; // $2500 per ETH

// Add USDC address and update Token type
type Token = TokenSymbol;

// Mock data for when wallet is not connected
const MOCK_BALANCES: Record<Token, string> = {
  ETH: "0.0",
  SPX6900: "0",
  MOG: "0",
  WETH: "0.0",
  USDC: "0.0",
};

const MOCK_EXPECTED_OUTPUT: Record<Token, string> = {
  SPX6900: "2000",
  MOG: "89213.4",
};

// Add these constants at the top of the file, after other constants
const DOGE_MARKET_CAP = 18354750059;
const SPX6900_MARKET_CAP = 606265150;
const MOG_MARKET_CAP = 742944760;

// Update these constants near the top of the file
const SPX6900_PRICE = 0.6344; // $0.6344 per SPX6900
const MOG_PRICE = 0.000002062; // $0.000002062 per MOG
const HPOS_PRICE = 0.309; // $0.309 per HPOS

// Update or add these constants at the top of the file
const MOCK_PRICES = {
  ETH: 2600,
  SPX6900: 0.6344,
  MOG: 0.000002062,
  WETH: 2600,
  USDC: 1,
  HPOS: 0.309,
  // Add other tokens as needed
};

const TokenSelectionPopup = ({ isOpen, onClose, onSelect, tokens, balances }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTokens = useMemo(() => {
    return Object.entries(tokens).filter(([symbol, config]) =>
      symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tokens, searchTerm]);

  const getTokenPrice = (symbol: string) => {
    return MOCK_PRICES[symbol] || 0;
  };

  const getTokenBalance = (symbol: string) => {
    return parseFloat(balances[symbol] || "0");
  };

  const getTokenValue = (symbol: string) => {
    const price = getTokenPrice(symbol);
    const balance = getTokenBalance(symbol);
    return price * balance;
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
            {['ETH', 'USDC', 'USDT', 'WETH', 'SPX6900', 'MOG', 'HPOS'].map((symbol) => (
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

function SwapInterfaceContent() {
  const { showToast } = useToast();
  const [simpleSwap, setSimpleSwap] = useState(false);
  const [fromAmount, setFromAmount] = useState("0.69");
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>("ETH");
  const [selectedOutputTokens, setSelectedOutputTokens] = useState<(TokenSymbol | "")[]>([""]); // Use "" to represent "Select token"
  const [toAmounts, setToAmounts] = useState<Record<TokenSymbol, string>>({
    SPX6900: "0",
    MOG: "0",
  });
  const [sliderValues, setSliderValues] = useState<Record<TokenSymbol, number>>({
    SPX6900: 50,
    MOG: 50,
  });
  const [lockedTokens, setLockedTokens] = useState<Record<TokenSymbol, boolean>>({
    SPX6900: false,
    MOG: false,
  });
  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const { data: ethBalanceData, refetch: refetchEthBalance } = useBalance({
    address,
    enabled: isConnected,
  });

  const spx6900Price = 0.9; // $0.9 per SPX6900
  const mogPrice = 0.000003; // $0.000003 per MOG

  // Simulated token balances (in a real scenario, these would be fetched using ERC20:balanceOf() multicall)
  const [tokenBalances, setTokenBalances] = useState<Record<Token, string>>(MOCK_BALANCES);

  const swapContractAddress = "0x99D6dE141D7A9C76a92266776770994644Ff8053"; // Replace with your actual swap contract address

  const getProvider = useCallback(() => {
    if (publicClient) {
      return new ethers.BrowserProvider(publicClient.transport);
    }
    // Fallback to a default provider if wallet is not connected
    return new ethers.JsonRpcProvider(
      "https://rpc.buildbear.io/sorry-caliban-d9f928d6"
    );
  }, [publicClient]);

  const getSigner = useCallback(async () => {
    if (walletClient) {
      const provider = new ethers.BrowserProvider(walletClient.transport);
      return provider.getSigner();
    }
    throw new Error("Wallet not connected");
  }, [walletClient]);

  const fetchBalances = useCallback(async () => {
    if (address) {
      try {
        const provider = getProvider();
        const newBalances: Partial<Record<Token, string>> = {};

        for (const [symbol, config] of Object.entries(TOKENS)) {
          if (symbol !== 'ETH') {
            const balance = await getTokenBalance(config.address, address, provider);
            newBalances[symbol as Token] = ethers.formatUnits(balance, config.decimals);
          }
        }

        setTokenBalances(prev => ({
          ...prev,
          ...newBalances,
        }));
      } catch (error) {
        console.error("Error fetching token balances:", error);
        toast.error("Failed to fetch token balances. Please try again.");
      }
    }
  }, [address, getProvider]);

  useEffect(() => {
    if (isConnected) {
      fetchBalances();
      refetchEthBalance();
    } else {
      setTokenBalances(MOCK_BALANCES);
    }
  }, [isConnected, fetchBalances, refetchEthBalance]);

  useEffect(() => {
    if (ethBalanceData) {
      setTokenBalances((prev) => ({
        ...prev,
        ETH: ethers.formatUnits(ethBalanceData.value, 18),
      }));
    }
  }, [ethBalanceData]);

  // Mock market caps (replace with actual data fetching in production)
  const [marketCaps, setMarketCaps] = useState({
    mog: 742944760,
    spx6900: 606265150,
    dogecoin: 18354750059,
    hpos: 322944760
  });

  const [imageError, setImageError] = useState<Record<TokenSymbol, boolean>>({});

  const handleImageError = (token: TokenSymbol) => {
    setImageError(prev => ({ ...prev, [token]: true }));
  };

  const getTokenLogo = (token: TokenSymbol) => {
    return TOKENS[token]?.logo || '';
  };

  const calculateRatio = useCallback((outputTokenMC: number) => {
    const ratio = marketCaps.dogecoin / outputTokenMC;
    return isNaN(ratio) || !isFinite(ratio) ? "N/A" : ratio.toFixed(2);
  }, [marketCaps.dogecoin]);

  const handleOutputTokenSelect = (index: number, newToken: TokenSymbol | "") => {
    setSelectedOutputTokens(prev => {
      const updated = [...prev];
      updated[index] = newToken;
      return updated;
    });

    if (newToken) {
      setToAmounts(prev => ({
        ...prev,
        [newToken]: "0"
      }));
      setSliderValues(prev => ({
        ...prev,
        [newToken]: 100 / selectedOutputTokens.length
      }));
      setLockedTokens(prev => ({
        ...prev,
        [newToken]: false
      }));
    }
  };

  const handleSliderChange = useCallback((token: TokenSymbol, value: number) => {
    setSliderValues(prev => {
      const updatedSliderValues = { ...prev };
      updatedSliderValues[token] = value;

      const unlockedTokens = selectedOutputTokens.filter(t => !lockedTokens[t] && t !== token);
      const remainingValue = 100 - value - selectedOutputTokens.reduce((sum, t) => 
        lockedTokens[t] ? sum + (prev[t] || 0) : sum, 0
      );

      unlockedTokens.forEach((otherToken, index) => {
        if (index === unlockedTokens.length - 1) {
          updatedSliderValues[otherToken] = Math.max(0, remainingValue);
        } else {
          const currentValue = updatedSliderValues[otherToken] || 0;
          updatedSliderValues[otherToken] = Math.min(currentValue, remainingValue / unlockedTokens.length);
        }
      });

      return updatedSliderValues;
    });
  }, [selectedOutputTokens, lockedTokens]);

  const toggleLock = (token: TokenSymbol) => {
    setLockedTokens(prev => ({ ...prev, [token]: !prev[token] }));
  };

  useEffect(() => {
    if (fromAmount) {
      const inputUsdValue = parseFloat(getUsdValue(fromAmount, selectedToken));
      const updatedToAmounts: Record<TokenSymbol, string> = {};

      selectedOutputTokens.forEach(token => {
        const percentage = (sliderValues[token] || 0) / 100;
        const tokenUsdValue = inputUsdValue * percentage;
        let tokenAmount: number;

        switch (token) {
          case "SPX6900":
            tokenAmount = tokenUsdValue / SPX6900_PRICE;
            break;
          case "MOG":
            tokenAmount = tokenUsdValue / MOG_PRICE;
            break;
          case "HPOS":
            tokenAmount = tokenUsdValue / HPOS_PRICE;
            break;
          default:
            tokenAmount = 0;
        }

        updatedToAmounts[token] = tokenAmount.toFixed(6);
      });

      setToAmounts(updatedToAmounts);
    }
  }, [fromAmount, sliderValues, selectedOutputTokens, selectedToken]);

  // Add this function to filter out disabled tokens
  const getAvailableOutputTokens = useCallback(() => {
    return Object.entries(TOKENS).filter(([symbol, _]) => 
      symbol !== selectedToken && 
      symbol !== 'WETH' && 
      symbol !== 'USDC' &&
      !selectedOutputTokens.includes(symbol as TokenSymbol)
    );
  }, [selectedToken, selectedOutputTokens]);

  // Modify the addOutputToken function
  const addOutputToken = () => {
    const availableTokens = getAvailableOutputTokens();
    if (availableTokens.length > 0) {
      const [newToken] = availableTokens[0];
      setSelectedOutputTokens(prev => [...prev, newToken as TokenSymbol]);
      setToAmounts(prev => ({ ...prev, [newToken]: "0" }));
      setSliderValues(prev => {
        const newValue = 100 / (Object.keys(prev).length + 1);
        return { ...prev, [newToken]: newValue };
      });
      setLockedTokens(prev => ({ ...prev, [newToken]: false }));
    }
  };

  const [needsApproval, setNeedsApproval] = useState(false);

  const checkAllowance = useCallback(async () => {
    if (isConnected && address && selectedToken !== "ETH") {
      try {
        const provider = getProvider();
        const config = TOKENS[selectedToken];
        
        const tokenContract = new ethers.Contract(config.address, [
          "function allowance(address owner, address spender) view returns (uint256)"
        ], provider);

        const allowance = await tokenContract.allowance(address, swapContractAddress);
        const requiredAmount = ethers.parseUnits(fromAmount || "0", config.decimals);
        
        setNeedsApproval(BigInt(allowance) < BigInt(requiredAmount));
      } catch (error) {
        console.error("Error checking allowance:", error);
        setNeedsApproval(true);
      }
    } else {
      setNeedsApproval(false);
    }
  }, [isConnected, address, fromAmount, getProvider, selectedToken]);

  useEffect(() => {
    checkAllowance();
  }, [checkAllowance]);

  const handleApprove = async () => {
    if (!isConnected) {
      showToast("Please connect your wallet to approve.", "error");
      return;
    }

    if (selectedToken === "ETH") {
      showToast("Approval not needed for ETH.", "info");
      return;
    }

    setIsApproving(true);
    try {
      const signer = await getSigner();
      if (!signer) {
        throw new Error("Signer not available");
      }

      const config = TOKENS[selectedToken];
      const tokenContract = new ethers.Contract(config.address, [
        "function approve(address spender, uint256 amount) public returns (bool)"
      ], signer);

      const maxApproval = ethers.MaxUint256;
      const approveTx = await tokenContract.approve(swapContractAddress, maxApproval);
      await approveTx.wait();
      
      showToast(`${selectedToken} approved for swapping`, "success");
      setNeedsApproval(false);
    } catch (error) {
      console.error("Approval failed:", error);
      showToast("Approval failed. Please try again.", "error");
    } finally {
      setIsApproving(false);
    }
  };

  const handleSwap = async () => {
    if (!isConnected) {
      showToast("Please connect your wallet to perform a swap.", "error");
      return;
    }

    if (needsApproval && selectedToken !== "ETH") {
      showToast("Please approve the token before swapping.", "error");
      return;
    }

    setIsSwapping(true);
    try {
      // Implement your swap logic here
      // If selectedToken is ETH, use a different method that doesn't require approval
      if (selectedToken === "ETH") {
        // Implement ETH swap logic
      } else {
        // Implement ERC20 token swap logic
      }

      showToast("Swap completed successfully!", "success");
    } catch (error) {
      console.error("Swap failed:", error);
      showToast(`Swap failed: ${error.message}`, "error");
    } finally {
      setIsSwapping(false);
    }
  };

  // Update the USD value calculation
  const getUsdValue = (amount: string, token: Token) => {
    const numAmount = parseFloat(amount);
    switch (token) {
      case "ETH":
        return (numAmount * ethPrice).toFixed(2);
      case "WETH":
        return (numAmount * ethPrice).toFixed(2);
      case "USDC":
        return numAmount.toFixed(2); // 1 USDC = 1 USD
      case "SPX6900":
        return (numAmount * SPX6900_PRICE).toFixed(2);
      case "MOG":
        return (numAmount * MOG_PRICE).toFixed(3); // Using more decimal places due to small value
      case "HPOS":
        return (numAmount * HPOS_PRICE).toFixed(2);
      default:
        return "0.00";
    }
  };

  const removeOutputToken = (tokenToRemove: TokenSymbol) => {
    setSelectedOutputTokens(prev => prev.filter(token => token !== tokenToRemove));
    setToAmounts(prev => {
      const { [tokenToRemove]: _, ...rest } = prev;
      return rest;
    });
    setSliderValues(prev => {
      const { [tokenToRemove]: removedValue, ...rest } = prev;
      const totalRemaining = Object.values(rest).reduce((sum, value) => sum + value, 0);
      if (totalRemaining === 0) {
        // If all remaining values are 0, distribute evenly
        const newValue = 100 / Object.keys(rest).length;
        return Object.fromEntries(Object.keys(rest).map(key => [key, newValue]));
      } else {
        // Redistribute the removed value proportionally
        const factor = 100 / totalRemaining;
        return Object.fromEntries(Object.entries(rest).map(([key, value]) => [key, value * factor]));
      }
    });
    setLockedTokens(prev => {
      const { [tokenToRemove]: _, ...rest } = prev;
      return rest;
    });
  };

  const [isTokenPopupOpen, setIsTokenPopupOpen] = useState(false);
  const [activeTokenSelection, setActiveTokenSelection] = useState<'from' | number | null>(null);

  const openTokenPopup = (type: 'from' | number) => {
    setActiveTokenSelection(type);
    setIsTokenPopupOpen(true);
  };

  const handleTokenSelect = (token: TokenSymbol) => {
    if (activeTokenSelection === 'from') {
      setSelectedToken(token);
    } else if (typeof activeTokenSelection === 'number') {
      handleOutputTokenSelect(activeTokenSelection, token);
    }
    setIsTokenPopupOpen(false);
  };

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        {/* Input (Sell) section */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Sell</label>
          <div className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
            <div className="flex flex-col items-start">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="bg-transparent border-none text-left w-24"
              />
              <span className="text-xs text-gray-400">
                ≈ ${getUsdValue(fromAmount, selectedToken)}
              </span>
            </div>
            <button
              onClick={() => openTokenPopup('from')}
              className="flex items-center space-x-2 bg-gray-800 rounded-full px-3 py-2"
            >
              {selectedToken ? (
                <>
                  <img
                    src={TOKENS[selectedToken].logo}
                    alt={`${selectedToken} logo`}
                    className="w-6 h-6 rounded-full"
                  />
                  <span>{selectedToken}</span>
                </>
              ) : (
                <span>Select a token</span>
              )}
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Swap arrow */}
        <div className="flex justify-center">
          <div className="bg-gray-700 rounded-full p-2">
            <ArrowDownUp className="h-6 w-6 text-gray-400" />
          </div>
        </div>

        {/* Output (Buy) section */}
        <div className="space-y-2">
          <label className="text-sm text-gray-400">Buy</label>
          {selectedOutputTokens.map((token, index) => (
            <div key={index} className="space-y-2">
              <div className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                <div className="flex flex-col items-start">
                  <input
                    type="number"
                    value={token ? (toAmounts[token] || "0") : "0"}
                    readOnly
                    className="bg-transparent border-none text-left w-24"
                  />
                  <span className="text-xs text-gray-400">
                    ≈ ${token ? getUsdValue(toAmounts[token] || "0", token) : "0.00"}
                  </span>
                </div>
                <button
                  onClick={() => openTokenPopup(index)}
                  className="flex items-center space-x-2 bg-gray-800 rounded-full px-3 py-2"
                >
                  {token ? (
                    <>
                      <img
                        src={TOKENS[token].logo}
                        alt={`${token} logo`}
                        className="w-6 h-6 rounded-full"
                      />
                      <span>{token}</span>
                    </>
                  ) : (
                    <span>Select a token</span>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </button>
                {selectedOutputTokens.length > 1 && (
                  <button
                    onClick={() => removeOutputToken(token)}
                    className="ml-1 text-gray-400 hover:text-white p-1"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              {token && (
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderValues[token] || 0}
                      onChange={(e) => handleSliderChange(token, parseInt(e.target.value))}
                      className="flex-grow"
                    />
                    <button onClick={() => toggleLock(token)}>
                      {lockedTokens[token] ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0%</span>
                    <span>{(sliderValues[token] || 0).toFixed(2)}%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}
            </div>
          ))}
          {selectedOutputTokens.length < 3 && (
            <button
              onClick={addOutputToken}
              className="w-full mt-2 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add another token
            </button>
          )}
        </div>
      </div>

      {/* Swap button */}
      <Button
        className="w-full bg-blue-600 hover:bg-blue-700"
        onClick={handleSwap}
        disabled={!isConnected || isSwapping}
      >
        {!isConnected ? "Connect Wallet" : isSwapping ? "Swapping..." : "Swap"}
      </Button>

      <TokenSelectionPopup
        isOpen={isTokenPopupOpen}
        onClose={() => setIsTokenPopupOpen(false)}
        onSelect={handleTokenSelect}
        tokens={TOKENS}
        balances={tokenBalances}
      />
    </div>
  );
}

export function SwapInterface() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div className="min-h-screen flex flex-col justify-between p-4">
            <div className="w-full max-w-7xl mx-auto flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold">Swap</h1>
              <CustomConnectButton />
            </div>
            <div className="flex-grow flex items-center justify-center">
              <div className="w-full max-w-md space-y-4 bg-gray-900 border-2 border-blue-800 rounded-lg p-6 shadow-lg">
                <SwapInterfaceContent />
              </div>
            </div>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}