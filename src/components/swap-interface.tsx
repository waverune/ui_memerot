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
import { SWAP_ABI } from "../lib/contracts";

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
type Token = "SPX6900" | "MOG" | "WETH" | "ETH" | "USDC" | string;

// Define token addresses
const SPX_ADDRESS = "0xe0f63a424a4439cbe457d80e4f4b51ad25b2c56c";
const MOG_ADDRESS = "0xaaee1a9723aadb7afa2810263653a34ba2c21c7a";
const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

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
  const [toAmounts, setToAmounts] = useState<Record<Token, string>>({
    SPX6900: "0",
    MOG: "0",
  });
  const [sliderValues, setSliderValues] = useState<Record<Token, number>>({
    SPX6900: 50,
    MOG: 50,
  });
  const [lockedTokens, setLockedTokens] = useState<Record<Token, boolean>>({
    SPX6900: false,
    MOG: false,
  });
  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token>("ETH");
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
        const spxBalance = await getTokenBalance(SPX_ADDRESS, address, provider);
        const mogBalance = await getTokenBalance(MOG_ADDRESS, address, provider);
        const wethBalance = await getTokenBalance(WETH_ADDRESS, address, provider);
        const usdcBalance = await getTokenBalance(USDC_ADDRESS, address, provider);

        setTokenBalances((prev) => ({
          ...prev,
          SPX6900: spxBalance,
          MOG: mogBalance,
          WETH: wethBalance,
          USDC: (parseInt(usdcBalance) / 1e6).toFixed(2), // Convert to a decimal string with 2 decimal places
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

  // Update toAmounts when fromAmount or sliderValues change
  useEffect(() => {
    const updateToAmounts = () => {
      if (fromAmount) {
        const totalEthValue = parseFloat(fromAmount);
        const updatedToAmounts: Record<Token, string> = {};

        Object.keys(toAmounts).forEach(token => {
          const percentage = sliderValues[token as Token] / 100;
          updatedToAmounts[token as Token] = (totalEthValue * percentage).toFixed(6);
        });

        setToAmounts(updatedToAmounts);
      }
    };

    updateToAmounts();
  }, [fromAmount, sliderValues]);

  const handleTokenSelect = useCallback(
    (token: Token) => {
      setSelectedToken(token);
      if (isConnected) {
        if (token === "ETH") {
          refetchEthBalance();
        } else {
          const fetchTokenBalance = async () => {
            if (address) {
              try {
                const provider = getProvider();
                let tokenAddress;
                let decimals = 18;
                switch (token) {
                  case "SPX6900":
                    tokenAddress = SPX_ADDRESS;
                    break;
                  case "MOG":
                    tokenAddress = MOG_ADDRESS;
                    break;
                  case "WETH":
                    tokenAddress = WETH_ADDRESS;
                    break;
                  case "USDC":
                    tokenAddress = USDC_ADDRESS;
                    decimals = 6;
                    break;
                  default:
                    return;
                }
                const balance = await getTokenBalance(tokenAddress, address, provider);
                setTokenBalances((prev) => ({
                  ...prev,
                  [token]: token === "USDC" 
                    ? (parseInt(balance) / 1e6).toFixed(2) 
                    : ethers.formatUnits(balance, decimals),
                }));
              } catch (error) {
                console.error("Error fetching token balance:", error);
                toast.error("Failed to fetch token balance. Please try again.");
              }
            }
          };
          fetchTokenBalance();
        }
      }
    },
    [isConnected, address, getProvider, refetchEthBalance]
  );

  const handleSliderChange = useCallback((token: Token, value: number) => {
    setSliderValues(prev => {
      const updatedSliderValues = { ...prev };
      updatedSliderValues[token] = value;

      // Adjust other slider to maintain total of 100%
      const otherToken = Object.keys(prev).find(t => t !== token) as Token;
      if (otherToken) {
        updatedSliderValues[otherToken] = 100 - value;
      }

      return updatedSliderValues;
    });
  }, []);

  const handleFromAmountChange = useCallback((value: string) => {
    setFromAmount(value);
  }, []);

  const toggleLock = (token: Token) => {
    setLockedTokens((prev) => ({ ...prev, [token]: !prev[token] }));
  };

  const addToken = () => {
    // In a real scenario, you would open a modal to select from supported tokens
    const newToken = `Token${Object.keys(toAmounts).length + 1}`;
    setToAmounts((prev) => ({ ...prev, [newToken]: "0" }));
    setSliderValues((prev) => {
      const newValue = 100 / (Object.keys(prev).length + 1);
      return Object.fromEntries(
        Object.entries(prev).map(([token, value]) => [token, newValue])
      );
    });
    setLockedTokens((prev) => ({ ...prev, [newToken]: false }));
    setTokenBalances((prev) => ({ ...prev, [newToken]: "0" }));
  };

  const [needsApproval, setNeedsApproval] = useState(true);

  const checkAllowance = useCallback(async () => {
    if (isConnected && address) {
      try {
        const provider = getProvider();
        const tokenAddress = selectedToken === "USDC" ? USDC_ADDRESS : WETH_ADDRESS;
        const decimals = selectedToken === "USDC" ? 6 : 18;
        
        const tokenContract = new ethers.Contract(tokenAddress, [
          "function allowance(address owner, address spender) view returns (uint256)"
        ], provider);

        const allowance = await tokenContract.allowance(address, swapContractAddress);
        const requiredAmount = ethers.parseUnits(fromAmount || "0", decimals);
        
        // Use BigInt for comparison
        setNeedsApproval(BigInt(allowance) < BigInt(requiredAmount));
      } catch (error) {
        console.error("Error checking allowance:", error);
        setNeedsApproval(true); // Assume approval is needed if check fails
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

      const tokenAddress = selectedToken === "USDC" ? USDC_ADDRESS : WETH_ADDRESS;
      const tokenContract = new ethers.Contract(tokenAddress, [
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

      const path = [WETH_ADDRESS, SPX_ADDRESS, MOG_ADDRESS];
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
      if (selectedToken === "USDC" || selectedToken === "WETH") {
        const tokenAddress = selectedToken === "USDC" ? USDC_ADDRESS : WETH_ADDRESS;
        const decimals = selectedToken === "USDC" ? 6 : 18;

        const contract = new ethers.Contract(swapContractAddress, [
          "function swapUSDForMultiTokens(address sellToken, uint256 sellAmount, uint256[] memory sellAmounts, uint256[] memory minAmounts, address[] memory path, uint256 deadline) external returns (uint256[] memory amounts)"
        ], signer);

        // const sellAmount = ethers.parseUnits(fromAmount, decimals);
          // hsrdcoded for testing
          const sellAmountsForUSDCMulti = [
            ethers.parseEther('2'),
            ethers.parseEther('1'),
            ethers.parseEther('1')
          ];
          // Convert USDC amount to Wei (USDC has 6 decimals)
          const usdcSellAmount = ethers.parseUnits(fromAmount, 6);
        
        swapTx = await contract.swapUSDForMultiTokens(
          tokenAddress,
          usdcSellAmount,
          sellAmountsForUSDCMulti,
          minAmounts,
          path,
          deadline,
          { 
            gasLimit: 300000,
            gasPrice: ethers.parseUnits("100", "gwei")  // Adjust as needed
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

  // Add this function to calculate the ratio
  // const calculateRatio = (outputTokenMC: number) => {
  //   return (DOGE_MARKET_CAP / outputTokenMC).toFixed(2);
  // };

  const [marketCaps, setMarketCaps] = useState({
    mog: 742944760,  // Mock data
    spx6900: 606265150,  // Mock data
    dogecoin: 18354750059  // Mock data
  });

  // Fetch market caps
  const fetchMarketCaps = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/market_caps');
      if (!response.ok) {
        throw new Error('Failed to fetch market caps');
      }
      const data = await response.json();
      setMarketCaps({
        mog: data.mog,
        spx6900: data.spx6900,
        dogecoin: data.dogecoin
      });
    } catch (error) {
      console.error('Error fetching market caps:', error);
      toast.error('Failed to fetch market caps. Using default values.');
      // Use mock data if API fails
      setMarketCaps({
        mog: 758062091,
        spx6900: 651612027,
        dogecoin: 18653136099
      });
    }
  }, []);

  useEffect(() => {
    fetchMarketCaps();
    // Set up an interval to fetch market caps every 5 minutes
    const intervalId = setInterval(fetchMarketCaps, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [fetchMarketCaps]);

  // Calculate ratio function
  const calculateRatio = useCallback((outputTokenMC: number) => {
    const ratio = marketCaps.dogecoin / outputTokenMC;
    console.log(ratio)
    return isNaN(ratio) || !isFinite(ratio) ? "N/A" : ratio.toFixed(2);
  }, [marketCaps.dogecoin]);

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
      {/* <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-2">
        <Switch
          id="simple-swap"
          checked={simpleSwap}
          onCheckedChange={setSimpleSwap}
        />
        <label htmlFor="simple-swap" className="text-sm">
          Try Simple Swap - No Slippage or Gas Fees
        </label>
        <span className="bg-orange-500 text-xs font-bold px-2 py-1 rounded">
          NEW
        </span>
      </div> */}

      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-400">From</label>
          <div className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
            <div className="flex flex-col items-start space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  {selectedToken}
                </div>
                <span className="font-medium">{selectedToken}</span>
                <select
                  value={selectedToken}
                  onChange={(e) => handleTokenSelect(e.target.value as Token)}
                  className="bg-transparent border-none text-black"
                >
                  <option value="ETH" className="text-black">
                    ETH
                  </option>
                  <option value="WETH" className="text-black">
                    WETH
                  </option>
                  <option value="USDC" className="text-black">
                    USDC
                  </option>
                  <option value="SPX6900" className="text-black">
                    SPX6900
                  </option>
                  <option value="MOG" className="text-black">
                    MOG
                  </option>
                </select>
              </div>
              <div className="text-xs text-gray-400">
                Balance: {tokenBalances[selectedToken] || "0"}
              </div>
            </div>
            <div className="flex flex-col items-end">
              <Input
                type="number"
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                className="bg-transparent border-none text-right w-24"
              />
              <span className="text-xs text-gray-400">
                ${getUsdValue(fromAmount, selectedToken)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-gray-700"
          >
            <ArrowDownUp className="h-6 w-6" />
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-400">To</label>
          {Object.entries(toAmounts).map(([token, amount]) => (
            <div key={token} className="space-y-2">
              <div className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                <div className="flex flex-col items-start space-y-1">
                  <div className="flex items-center space-x-2">
                    <Image
                      src={
                        token === "MOG"
                          ? mogLogo
                          : token === "SPX6900"
                          ? spx6900Logo
                          : "/placeholder.svg"
                      }
                      alt={token}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <span className="font-medium">{token}</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-xs text-gray-400">
                    Balance: {tokenBalances[token] || "0"}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <input
                    type="number"
                    value={amount}
                    readOnly
                    className="bg-transparent border-none text-right w-24"
                  />
                  <span className="text-xs text-gray-400">
                    {token === "SPX6900" && `DogeRatio: ${calculateRatio(marketCaps.spx6900)}x`}
                    {token === "MOG" && `DogeRatio: ${calculateRatio(marketCaps.mog)}x`}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderValues[token as Token]}
                    onChange={(e) => handleSliderChange(token as Token, parseInt(e.target.value))}
                    className="flex-grow"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>0%</span>
                  <span>{sliderValues[token as Token].toFixed(2)}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={addToken}
            className="w-full mt-2 flex items-center justify-center space-x-2 text-white bg-gray-700 hover:bg-gray-600"
          >
            <Plus className="h-4 w-4" />
            <span>Select multiple tokens</span>
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Output Value</span>
          <span>3000.01 USD</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Minimum Received</span>
          <span>2997.06 USD</span>
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

      {/* Add the explanatory text here */}
      <div className="text-xs text-gray-400 mt-4 text-center">
        DogeRatio is the multiplier to the current price for the token with market cap of Dogecoin
      </div>
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