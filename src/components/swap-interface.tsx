"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
// import { Switch } from "./ui/switch";
import { ArrowDownUp, ChevronDown, Lock, Unlock, Plus } from "lucide-react";
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

const ethPrice = 2500; // $2500 per ETH

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

function SwapInterfaceContent() {
  const { showToast } = useToast();
  const [simpleSwap, setSimpleSwap] = useState(false);
  const [fromAmount, setFromAmount] = useState("0.69");
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>("ETH");
  const [selectedOutputTokens, setSelectedOutputTokens] = useState<TokenSymbol[]>(["SPX6900", "MOG"]);
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
  const [tokenBalances, setTokenBalances] = useState<Record<Token, string>>({
    ETH: "42",
    SPX6900: "10000",
    MOG: "5000000",
    WETH: "0",
    USDC: "0",
  });

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

  const handleOutputTokenSelect = (index: number, newToken: TokenSymbol) => {
    setSelectedOutputTokens(prev => {
      const updated = [...prev];
      updated[index] = newToken;
      return updated;
    });

    setToAmounts(prev => {
      const updated = { ...prev };
      delete updated[selectedOutputTokens[index]];
      updated[newToken] = "0";
      return updated;
    });

    setSliderValues(prev => {
      const updated = { ...prev };
      delete updated[selectedOutputTokens[index]];
      updated[newToken] = 100 / selectedOutputTokens.length;
      return updated;
    });

    setLockedTokens(prev => {
      const updated = { ...prev };
      delete updated[selectedOutputTokens[index]];
      updated[newToken] = false;
      return updated;
    });
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
      const totalEthValue = parseFloat(fromAmount);
      const updatedToAmounts: Record<TokenSymbol, string> = {};

      selectedOutputTokens.forEach(token => {
        const percentage = (sliderValues[token] || 0) / 100;
        updatedToAmounts[token] = (totalEthValue * percentage).toFixed(6);
      });

      setToAmounts(updatedToAmounts);
    }
  }, [fromAmount, sliderValues, selectedOutputTokens]);

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

  const [needsApproval, setNeedsApproval] = useState(true);

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
    }
  }, [isConnected, address, fromAmount, getProvider, selectedToken]);

  useEffect(() => {
    checkAllowance();
  }, [checkAllowance]);

  const handleApprove = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet to approve.");
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
      
      toast.success(`${selectedToken} approved for swapping`);
      setNeedsApproval(false);
    } catch (error) {
      console.error("Approval failed:", error);
      toast.error("Approval failed. Please try again.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleHardcodedSwap = async () => {
    if (!isConnected) {
      showToast("Please connect your wallet to perform a swap.", "error");
      return;
    }

    setIsSwapping(true);
    try {
      const signer = await getSigner();

      // Calculate amounts based on slider values
      const spx6900Amount = (parseFloat(fromAmount) * sliderValues.SPX6900 / 100).toString();
      const mogAmount = (parseFloat(fromAmount) * sliderValues.MOG / 100).toString();

      const path = [TOKENS.WETH.address, TOKENS.SPX6900.address, TOKENS.MOG.address];
      const sellAmounts = [
        ethers.parseEther(fromAmount),
        ethers.parseEther(spx6900Amount),
        ethers.parseEther(mogAmount)
      ];
      const minAmounts = [
        ethers.parseUnits("1", 0),  // Minimum amount for SPX6900 (adjust as needed)
        ethers.parseUnits("1", 0)   // Minimum amount for MOG (adjust as needed)
      ];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

      let swapTx;
      if (selectedToken !== "ETH") {
        const config = TOKENS[selectedToken];
        const contract = new ethers.Contract(swapContractAddress, [
          "function swapUSDForMultiTokens(address sellToken, uint256 sellAmount, uint256[] memory sellAmounts, uint256[] memory minAmounts, address[] memory path, uint256 deadline) external returns (uint256[] memory amounts)"
        ], signer);

        const sellAmount = ethers.parseUnits(fromAmount, config.decimals);

        swapTx = await contract.swapUSDForMultiTokens(
          config.address,
          sellAmount,
          sellAmounts,
          minAmounts,
          path,
          deadline,
          { 
            gasLimit: 300000,
            gasPrice: ethers.parseUnits("100", "gwei")
          }
        );
      } else if (selectedToken === "ETH") {
        const contract = new ethers.Contract(swapContractAddress, [
          "function swapEthForMultiTokens(uint256[] memory sellAmounts, uint256[] memory minAmounts, address[] memory path, uint256 deadline) external payable returns (uint256[] memory amounts)"
        ], signer);

        swapTx = await contract.swapEthForMultiTokens(
          sellAmounts,
          minAmounts,
          path,
          deadline,
          { 
            value: ethers.parseEther(fromAmount),
            gasLimit: 300000,
            gasPrice: ethers.parseUnits("100", "gwei")  // Adjust as needed
          }
        );
      } else {
        throw new Error("Unsupported token for swap");
      }

      showToast("Swap transaction sent. Waiting for confirmation...", "info");
      await swapTx.wait();

      showToast("Swap completed successfully!", "success");
      fetchBalances();
    } catch (error) {
      console.error("Swap failed:", error);
      showToast(`Swap failed: ${error.message}`, "error");
    } finally {
      setIsSwapping(false);
    }
  };

  // Update the USD value calculation
  const getUsdValue = (amount: string, token: Token) => {
    switch (token) {
      case "ETH":
      case "WETH":
        return (parseFloat(amount) * ethPrice).toFixed(2);
      case "USDC":
        return parseFloat(amount).toFixed(2); // 1 USDC = 1 USD
      default:
        return "0.00";
    }
  };

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-400">From</label>
          <div className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
            <div className="flex flex-col items-start space-y-1">
              <div className="flex items-center space-x-2">
                {!imageError[selectedToken] ? (
                  <img
                    src={getTokenLogo(selectedToken)}
                    alt={`${selectedToken} logo`}
                    width={24}
                    height={24}
                    className="rounded-full"
                    onError={() => handleImageError(selectedToken)}
                  />
                ) : (
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs">
                    {selectedToken.charAt(0)}
                  </div>
                )}
                <select
                  value={selectedToken}
                  onChange={(e) => setSelectedToken(e.target.value as TokenSymbol)}
                  className="bg-transparent border-none text-white"
                >
                  {Object.entries(TOKENS).map(([symbol, config]) => (
                    <option key={symbol} value={symbol} className="text-black">
                      {config.symbol}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-gray-400">
                Balance: {tokenBalances[selectedToken] || "0"}
              </div>
            </div>
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="bg-transparent border-none text-right w-24"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-400">To</label>
          {selectedOutputTokens.map((token, index) => (
            <div key={index} className="space-y-2">
              <div className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                <div className="flex flex-col items-start space-y-1">
                  <div className="flex items-center space-x-2">
                    {!imageError[token] ? (
                      <img
                        src={getTokenLogo(token)}
                        alt={`${token} logo`}
                        width={24}
                        height={24}
                        className="rounded-full"
                        onError={() => handleImageError(token)}
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs text-gray-700">
                        {token.charAt(0)}
                      </div>
                    )}
                    <select
                      value={token}
                      onChange={(e) => handleOutputTokenSelect(index, e.target.value as TokenSymbol)}
                      className="bg-transparent border-none text-white"
                    >
                      {[
                        [token, TOKENS[token]],
                        ...getAvailableOutputTokens()
                      ].map(([symbol, config]) => (
                        <option key={symbol} value={symbol} className="text-black">
                          {config.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-xs text-gray-400">
                    Balance: {tokenBalances[token] || "0"}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <input
                    type="number"
                    value={toAmounts[token] || "0"}
                    readOnly
                    className="bg-transparent border-none text-right w-24"
                  />
                  <span className="text-xs text-gray-400">
                    DogeRatio: {calculateRatio(marketCaps[token.toLowerCase() as keyof typeof marketCaps] || 0)}x
                  </span>
                </div>
              </div>
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
            </div>
          ))}
          {getAvailableOutputTokens().length > 0 && (
            <Button
              variant="outline"
              onClick={addOutputToken}
              className="w-full mt-2 flex items-center justify-center space-x-2 text-white bg-gray-700 hover:bg-gray-600"
            >
              <Plus className="h-4 w-4" />
              <span>Add another token</span>
            </Button>
          )}
        </div>
      </div>

      <Button
        className="w-full bg-blue-600 hover:bg-blue-700"
        onClick={needsApproval ? handleApprove : handleHardcodedSwap}
        disabled={!isConnected || isApproving || isSwapping}
      >
        {!isConnected
          ? "Connect Wallet"
          : needsApproval
          ? isApproving
            ? "Approving..."
            : "Approve"
          : isSwapping
          ? "Swapping..."
          : "Swap"}
      </Button>
    </div>
  );
}

export function SwapInterface() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-between p-4">
            <div className="w-full max-w-7xl mx-auto flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold">Swap</h1>
              <CustomConnectButton />
            </div>
            <div className="flex-grow flex items-center justify-center">
              <div className="w-full max-w-md space-y-4">
                <SwapInterfaceContent />
              </div>
            </div>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
