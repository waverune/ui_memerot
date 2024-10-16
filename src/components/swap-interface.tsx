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
} from "../lib/tx_utils";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { useToast } from '../hooks/useToast';

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

type Token = "SPX6900" | "MOG" | "WETH" | "ETH" | string;

// Define token addresses
const SPX_ADDRESS = "0xe0f63a424a4439cbe457d80e4f4b51ad25b2c56c";
const MOG_ADDRESS = "0xaaee1a9723aadb7afa2810263653a34ba2c21c7a";
const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

// Mock data for when wallet is not connected
const MOCK_BALANCES: Record<Token, string> = {
  ETH: "0.0",
  SPX6900: "0",
  MOG: "0",
  WETH: "0.0",
};

const MOCK_EXPECTED_OUTPUT: Record<Token, string> = {
  SPX6900: "2000",
  MOG: "89213.4",
};

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
  });

  const swapContractAddress = "0x7c615Fdd7e0b66e57F9AD360e18c0C85BdBD0fC1"; // Replace with your actual swap contract address

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
        const spxBalance = await getTokenBalance(
          SPX_ADDRESS,
          address,
          provider
        );
        const mogBalance = await getTokenBalance(
          MOG_ADDRESS,
          address,
          provider
        );
        const wethBalance = await getTokenBalance(
          WETH_ADDRESS,
          address,
          provider
        );

        setTokenBalances((prev) => ({
          ...prev,
          SPX6900: spxBalance,
          MOG: mogBalance,
          WETH: wethBalance,
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
                  default:
                    return;
                }
                const balance = await getTokenBalance(
                  tokenAddress,
                  address,
                  provider
                );
                setTokenBalances((prev) => ({
                  ...prev,
                  [token]: balance,
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
        const wethContract = new ethers.Contract(WETH_ADDRESS, [
          "function allowance(address owner, address spender) view returns (uint256)"
        ], provider);

        const allowance = await wethContract.allowance(address, swapContractAddress);
        const requiredAmount = ethers.parseEther(fromAmount || "0");
        
        // Use BigInt for comparison
        setNeedsApproval(BigInt(allowance) < BigInt(requiredAmount));
      } catch (error) {
        console.error("Error checking allowance:", error);
        setNeedsApproval(true); // Assume approval is needed if check fails
      }
    }
  }, [isConnected, address, fromAmount, getProvider]);

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

      const wethContract = new ethers.Contract(WETH_ADDRESS, [
        "function approve(address spender, uint256 amount) public returns (bool)"
      ], signer);

      const maxApproval = ethers.MaxUint256;
      const approveTx = await wethContract.approve(swapContractAddress, maxApproval);
      await approveTx.wait();
      
      toast.success("WETH approved for swapping");
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

      // Perform the hardcoded swap
      const swapTx = await performHardcodedSwap(
        swapContractAddress,
        WETH_ADDRESS,
        SPX_ADDRESS,
        MOG_ADDRESS,
        spx6900Amount,
        mogAmount,
        signer
      );

      showToast("Swap transaction sent. Waiting for confirmation...", "info");
      await swapTx.wait();

      showToast("Hardcoded swap completed successfully!", "success");
      fetchBalances();
    } catch (error) {
      console.error("Hardcoded swap failed:", error);
      showToast(`Hardcoded swap failed: ${error.message}`, "error");
    } finally {
      setIsSwapping(false);
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
                ${(parseFloat(fromAmount) * ethPrice).toFixed(2)}
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
