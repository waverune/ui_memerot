import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ethers } from "ethers";
import { ArrowDownUp, ChevronDown, Plus, Copy, X } from "lucide-react";
import telegramIcon from "../../assets/Telegram.png";
import xIcon from "../../assets/X.png";
import {
  useAccount,
  useBalance,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import { useConnectModal } from '@rainbow-me/rainbowkit';
import TokenSelectionPopup from "./tokenSelectionPopup";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/useToast";
import { TOKENS } from "../../config/tokens";
import {
  multicallTokenBalances,
  checkAndApproveToken,
  performSwap,
} from "../../lib/tx_utils";
import { toast } from "react-toastify";
import { fetchCoinData } from "../../services/coinApi";
import {
  swapEthForMultiTokensParam,
  swapTokenForMultiTokensParam,
  swapUSDForMultiTokensParam,
} from "../../lib/tx_types";
import {
  quoteTokenForMultiTokens,
  quoteERC20ForMultiTokens,
  altQuoteExactInputSingle,
} from "../../lib/quoter_utils"; // Adjust the path as necessary
import {
  SimulatedOutput,
  MOCK_BALANCES,
  CoinPriceData,
  TokenSelectionType,
  Token,
  DEFAULT_PRICE_DATA,
  TOKEN_COLORS,
  TokenConfig,
  TokenSymbol,
  TokenBalances,
} from "../../utils/Modal";
import {
  getUsdValue,
  calculateDogeRatio,
} from "../../utils/helpers/tokenHelper";
import {
  isValidPriceData,
  calculatePriceImpact,
} from "../../utils/helpers/priceHelper";
import {
  calculateAllocationPercentages,
  gcd,
} from "../../utils/helpers/allocationHelper";

const SLIPPAGE_TOLERANCE = 0.8;
//Function to construct sellAmounts based on allocation values, ensure Amount of WETH shoule be parsed
const sellAmountsConstruct = (
  selectedOutputTokens: TokenSymbol[],
  allocationValues: string[],
  Amount: bigint
) => {
  const sellAmounts = selectedOutputTokens.map((token, index) => {
    console.log("Token:", token);
    console.log("Index:", index);
    console.log("Allocation Values:", allocationValues);

    // Convert allocation values to numbers and calculate total ratio
    const ratios = allocationValues.map((v) => parseFloat(v) || 0);
    const totalRatio = ratios.reduce((sum, ratio) => sum + ratio, 0);

    // Calculate proportion for this token (e.g., for 1:2 ratio, first token gets 1/3, second gets 2/3)
    const proportion = ratios[index] / totalRatio;
    console.log("Proportion for token:", proportion);
    console.log(">> totalRatio", totalRatio);
    // Calculate this token's share of the netWethQuote
    const tokenShare =
      (Amount * BigInt(Math.floor(proportion * 10000))) / BigInt(10000);
    console.log("Token share of WETH:", tokenShare.toString());
    console.log(">> tokenShare", tokenShare);
    return tokenShare;
  });
  return sellAmounts;
};
const constructSwapParams = async (
  selectedToken: TokenSymbol,
  fromAmount: string,
  activeOutputTokens: TokenSymbol[],
  allocationValues: string[],
  isQuote: boolean,
  quoteResult?: readonly bigint[]
): Promise<
  | swapUSDForMultiTokensParam
  | swapEthForMultiTokensParam
  | swapTokenForMultiTokensParam
> => {
  if (!fromAmount || isNaN(parseFloat(fromAmount))) {
    throw new Error("Invalid input amount");
  }

  const inputAmount = ethers.parseUnits(
    fromAmount,
    TOKENS[selectedToken].decimals
  );
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
  const path = [
    TOKENS["WETH"].address,
    ...activeOutputTokens.map((token) => TOKENS[token].address),
  ];

  // Calculate sellAmounts based on allocations

  // Set minAmounts based on whether this is for quote or swap
  const minAmounts = isQuote
    ? activeOutputTokens.map(() => ethers.parseUnits("1", 0))
    : quoteResult!.map(
        (amount) =>
          (amount * BigInt(Math.floor((1 - SLIPPAGE_TOLERANCE) * 10000))) /
          BigInt(10000)
      );

  // Return appropriate params based on token type
  if (selectedToken === "ETH" || selectedToken === "WETH") {
    const sellAmounts = sellAmountsConstruct(
      activeOutputTokens,
      allocationValues,
      inputAmount
    );
    const baseParams = {
      sellAmounts: [inputAmount, ...(sellAmounts as bigint[])],
      minAmounts,
      path: path as `0x${string}`[],
      deadline,
      ...(selectedToken === "ETH" && { etherValue: inputAmount }),
    };

    return baseParams as
      | swapEthForMultiTokensParam
      | swapTokenForMultiTokensParam;
  } else {
    const netWethQuote = await altQuoteExactInputSingle(
      TOKENS[selectedToken].address as `0x${string}`,
      [path[0]] as `0x${string}`[],
      inputAmount
    );
    const sellAmounts = sellAmountsConstruct(
      activeOutputTokens,
      allocationValues,
      netWethQuote
    );

    return {
      sellToken: TOKENS[selectedToken].address as `0x${string}`,
      sellAmount: inputAmount,
      sellAmounts: [netWethQuote!, ...sellAmounts],
      minAmounts,
      path: path as `0x${string}`[],
      deadline,
    } as swapUSDForMultiTokensParam;
  }
};

function SwapInterfaceContent() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const hasInitialized = useRef(false);
  const location = useLocation();
  const [fromAmount, setFromAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<TokenSymbol | null>(null);
  const [selectedOutputTokens, setSelectedOutputTokens] = useState<Array<TokenSymbol | null>>([null]);
  const [toAmounts, setToAmounts] = useState<Record<TokenSymbol, string>>({});
  const [areFieldsValid, setAreFieldsValid] = useState(false);
  const [quoteResult, setQuoteResult] = useState<readonly bigint[]>([]);
  const [isTokenPopupOpen, setIsTokenPopupOpen] = useState(false);
  const [activeTokenSelection, setActiveTokenSelection] =
    useState<TokenSelectionType>(null);
  const [disabledTokens, setDisabledTokens] = useState<TokenSymbol[]>([]);
  const [tokenBalances, setTokenBalances] =
    useState<TokenBalances>(MOCK_BALANCES);
  const [dogeMarketCap, setDogeMarketCap] = useState(0);
  const [isBalanceSufficient, setIsBalanceSufficient] = useState(true);
  const [debouncedAllocationRatio] = useState("");
  // const [sliderValues, setSliderValues] = useState<Record<TokenSymbol, number>>({
  //     SPX6900: 50,
  //     MOG: 50,
  // });
  const [isQuoteSucess, setIsQuoteSucess] = useState(true);
  const [simulatedOutputs, setSimulatedOutputs] = useState<
    Record<TokenSymbol, SimulatedOutput>
  >({});
  const [allocationType, setAllocationType] = useState<"ratio" | "percentage">("percentage");
  const [allocationValues, setAllocationValues] = useState<string[]>(["100"]);
  const [selectedTemplate, setSelectedTemplate] = useState("100");
  const [tokenPriceData, setTokenPriceData] = useState<
    Record<string, CoinPriceData>
  >({});
  const { openConnectModal } = useConnectModal();
  const getDogeCoinMarketCap = async () => {
    const data = await fetchCoinData("dogecoin");
    setDogeMarketCap(data.market_cap_usd);
  };
  const mounted = useRef(true);
  const [failedTokens, setFailedTokens] = useState<Set<string>>(new Set());
  const retryIntervalRef = useRef<NodeJS.Timeout>();
  const updateIntervalRef = useRef<NodeJS.Timeout>();
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const { data: ethBalanceData, refetch: refetchEthBalance } = useBalance({
    address,
  });

  const fetchMultiplePriceData = useCallback(
    async (tokensToFetch?: string[]) => {
      try {
        // Create a mapping of token symbols to their CoinGecko IDs
        const tokenToCoinGeckoMap = Object.entries(TOKENS).reduce(
          (acc, [symbol, config]) => {
            if (config.coingeckoId) {
              acc[symbol] = config.coingeckoId;
            }
            return acc;
          },
          {} as Record<string, string>
        );

        // Determine which IDs to fetch
        const tokenIds = tokensToFetch || Object.values(tokenToCoinGeckoMap);

        const pricePromises = tokenIds.map(async (coinId) => {
          try {
            const result = await fetchCoinData(coinId);
            if (!isValidPriceData(result)) {
              console.warn(`Invalid price data received for ${coinId}`, result);
              setFailedTokens((prev) => new Set([...prev, coinId]));
              return {
                ...DEFAULT_PRICE_DATA,
                ...tokenPriceData[coinId],
                coin_id: coinId,
              };
            }
            setFailedTokens((prev) => {
              const newSet = new Set(prev);
              newSet.delete(coinId);
              return newSet;
            });
            return result;
          } catch (error) {
            console.error(`Error fetching ${coinId}:`, error);
            setFailedTokens((prev) => new Set([...prev, coinId]));
            return {
              ...DEFAULT_PRICE_DATA,
              ...tokenPriceData[coinId],
              coin_id: coinId,
            };
          }
        });

        const results = await Promise.all(pricePromises);
        const newPriceData = results.reduce((acc, result) => {
          if (result.coin_id) {
            acc[result.coin_id] = {
              ...DEFAULT_PRICE_DATA,
              ...result,
              price_usd:
                Number(result.price_usd) ||
                tokenPriceData[result.coin_id]?.price_usd ||
                0,
              market_cap_usd:
                Number(result.market_cap_usd) ||
                tokenPriceData[result.coin_id]?.market_cap_usd ||
                0,
            };
          }
          return acc;
        }, {} as Record<string, CoinPriceData>);

        console.log("newPriceData", newPriceData);
        setTokenPriceData((prev) => ({
          ...prev,
          ...newPriceData,
        }));
      } catch (error) {
        console.error("Error in fetchMultiplePriceData:", error);
        toast.error("Some price data may be delayed or unavailable");
      }
    },
    [tokenPriceData]
  );

  const swapContractAddress = "0x71618D8BBa10c21ffd42bB409D2aBfEED8A8F997"; // Replace with your actual swap contract address

  // Validate and format allocation ratio
  const formattedAllocationRatio = useMemo(() => {
    const parts = debouncedAllocationRatio.split(":").map(Number);
    if (parts.some(isNaN) || parts.length === 0) {
      return "";
    }

    let result = parts[0];
    for (let i = 1; i < parts.length; i++) {
      result = gcd(result, parts[i]);
    }

    return parts.map((part) => part / result).join(":");
  }, [debouncedAllocationRatio, gcd]);

  const getProvider = useCallback(() => {
    if (publicClient) {
      return new ethers.BrowserProvider(publicClient.transport);
    }
    // Fallback to a default provider if wallet is not connected
    return new ethers.JsonRpcProvider(
      "https://virtual.mainnet.rpc.tenderly.co/87a41065-48e0-49aa-b7cf-593798b729b7"
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

        // Prepare tokens array for multicall
        const tokensToFetch = Object.entries(TOKENS)
          .filter(([symbol]) => symbol !== "ETH")
          .map(([symbol, config]) => ({
            address: config.address,
            decimals: config.decimals,
            symbol,
          }));

        // Fetch all balances in a single multicall
        const balanceResults = await multicallTokenBalances(
          tokensToFetch,
          address,
          provider
        );
        console.log("balanceResults", balanceResults);
        // Process results
        tokensToFetch.forEach(({ symbol, address }) => {
          newBalances[symbol as Token] = balanceResults[address] || "0";
        });

        setTokenBalances((prev) => ({
          ...prev,
          ...newBalances,
        }));
      } catch (error) {
        console.error("Error fetching token balances:", error);
        toast.error("Failed to fetch token balances. Please try again.");

        // Set all balances to 0 in case of error
        const zeroBalances = Object.fromEntries(
          Object.keys(TOKENS)
            .filter((symbol) => symbol !== "ETH")
            .map((symbol) => [symbol, "0"])
        );
        setTokenBalances((prev) => ({
          ...prev,
          ...zeroBalances,
        }));
      }
    }
  }, [address, getProvider]);

  useEffect(() => {
    if (selectedToken && fromAmount) {
      const balance = parseFloat(tokenBalances[selectedToken] || "0");
      const amountToSell = parseFloat(fromAmount);
      setIsBalanceSufficient(amountToSell <= balance);
    }
  }, [selectedToken, fromAmount, tokenBalances]);

  const updateDisabledTokens = useCallback(
    (tokens: TokenSymbol[] = selectedOutputTokens) => {
      const disabled = [selectedToken, ...tokens].filter(
        (token) => token !== null
      );
      setDisabledTokens(disabled);
    },
    [selectedToken]
  );

  const removeOutputToken = useCallback(
    (tokenToRemove: TokenSymbol, index: number) => {
      // If this is the only slot, just clear the selection instead of removing it
      if (selectedOutputTokens.length === 1) {
        setSelectedOutputTokens([null]); // Keep one empty slot
        setToAmounts({});

        // Keep allocation values as is for single slot
        if (allocationType === "percentage") {
          setAllocationValues(["100"]);
          setSelectedTemplate("100");
        } else {
          setAllocationValues(["1"]);
          setSelectedTemplate("1");
        }

        updateDisabledTokens([]);
        return;
      }

      // For multiple slots, remove the token completely
      const newSelectedOutputTokens = selectedOutputTokens.filter(
        (_, i) => i !== index
      ).filter(token => token !== null) as TokenSymbol[];

      setSelectedOutputTokens(newSelectedOutputTokens);

      // Update toAmounts by removing the removed token
      const newToAmounts = { ...toAmounts };
      delete newToAmounts[tokenToRemove];
      setToAmounts(newToAmounts);

      // Update allocation values
      const newLength = newSelectedOutputTokens.length;
      if (allocationType === "ratio") {
        const newAllocationValues = Array(newLength).fill("1");
        setAllocationValues(newAllocationValues);
        setSelectedTemplate(newAllocationValues.join(":"));
      } else {
        const evenPercentage = (100 / newLength).toFixed(0);
        const newAllocationValues = Array(newLength).fill(evenPercentage);
        setAllocationValues(newAllocationValues);
        setSelectedTemplate(newAllocationValues.join(":"));
      }

      updateDisabledTokens(newSelectedOutputTokens);
    },
    [selectedOutputTokens, toAmounts, allocationType, updateDisabledTokens]
  );

  const checkApproval = useCallback(async () => {
    if (isConnected && address && selectedToken !== "ETH" && selectedToken !== "WETH" && fromAmount) {
      try {
        const signer = await getSigner();
        const tokenAddress = TOKENS[selectedToken]?.address;
        const amount = fromAmount;

        const tokenContract = new ethers.Contract(
          tokenAddress,
          [
            "function allowance(address owner, address spender) view returns (uint256)",
          ],
          signer
        );

        const allowance = await tokenContract.allowance(
          address,
          swapContractAddress
        );
        const requiredAmount = ethers.parseUnits(
          amount,
          TOKENS[selectedToken].decimals
        );

        // Convert allowance and requiredAmount to BigInt
        const allowanceBigInt = BigInt(allowance.toString());
        const requiredAmountBigInt = BigInt(requiredAmount.toString());

        const needsApproval = allowanceBigInt < requiredAmountBigInt;
        setNeedsApproval(needsApproval);
        console.log(
          `Approval status for ${selectedToken}: ${
            needsApproval ? "Needs approval" : "Approved"
          }`
        );
        console.log(
          `Allowance: ${allowanceBigInt.toString()}, Required: ${requiredAmountBigInt.toString()}`
        );
      } catch (error) {
        console.error("Error checking approval:", error);
        setNeedsApproval(true);
      }
    } else {
      setNeedsApproval(false);
    }
  }, [
    isConnected,
    address,
    selectedToken,
    fromAmount,
    getSigner,
    swapContractAddress,
  ]);

  const handleApprove = async () => {
    if (!isConnected || selectedToken === "ETH" || selectedToken === "WETH") {
      return;
    }

    setIsApproving(true);
    try {
      const signer = await getSigner();
      const approved = await checkAndApproveToken(
        TOKENS[selectedToken].address,
        swapContractAddress,
        fromAmount,
        TOKENS[selectedToken].decimals,
        signer
      );
      if (approved) {
        setNeedsApproval(false);
        showToast(`${selectedToken} approved for swapping`, "success");
      } else {
        showToast("Approval failed. Please try again.", "error");
      }
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
    if (needsApproval) {
      showToast("Please approve the token before swapping.", "error");
      return;
    }
    const paramForSwap = await constructSwapParams(
      selectedToken,
      fromAmount,
      selectedOutputTokens,
      allocationValues,
      false,
      quoteResult
    );
    setIsSwapping(true);
    try {
      const signer = await getSigner();
      if (!signer) throw new Error("Signer not available");
      if (!fromAmount || isNaN(parseFloat(fromAmount)))
        throw new Error("Invalid input amount");
      console.log(">> paramForSwap", paramForSwap);
      const swapTx = await performSwap(
        swapContractAddress,
        selectedToken as string,
        paramForSwap,
        signer
      );
      const receipt = await swapTx.wait();
      if (receipt && receipt.status === 1) {
        showToast("Swap completed successfully!", "success");
        fetchBalances();
        refetchEthBalance();
      } else {
        showToast("Swap failed.", "error");
      }
    } catch (error) {
      console.error("Swap failed:", error);
      showToast(`Swap failed: ${(error as Error).message}`, "error");
    } finally {
      setIsSwapping(false);
    }
  };

  const openTokenPopup = (type: "from" | "output", index?: number) => {
    setActiveTokenSelection({ type, index });
    setIsTokenPopupOpen(true);
  };

  const closeTokenPopup = () => {
    setIsTokenPopupOpen(false);
    setActiveTokenSelection(null);
  };

  const handleTokenSelect = (tokens: string[]) => {
    console.log(">>> tokens received:", tokens);
    if (activeTokenSelection?.type === "from") {
      setSelectedToken(tokens[0] as TokenSymbol);
    } else if (activeTokenSelection?.type === "output") {
      // Get the current tokens array
      const currentTokens = [...selectedOutputTokens];
      
      // If we have an index, update that specific slot
      if (activeTokenSelection.index !== undefined) {
        // If multiple tokens are selected, add them to new slots
        if (tokens.length > 1) {
          // First, update the current slot with the first token
          currentTokens[activeTokenSelection.index] = tokens[0] as TokenSymbol;
          
          // Then add remaining tokens to new slots
          for (let i = 1; i < tokens.length; i++) {
            if (currentTokens.length < 4) {
              currentTokens.push(tokens[i] as TokenSymbol);
            }
          }
        } else {
          // Single token selection
          currentTokens[activeTokenSelection.index] = tokens[0] as TokenSymbol;
        }
      } else {
        // If no index specified, add tokens to empty slots or create new ones
        tokens.forEach(token => {
          const emptySlotIndex = currentTokens.findIndex(t => t === null);
          if (emptySlotIndex !== -1) {
            currentTokens[emptySlotIndex] = token as TokenSymbol;
          } else if (currentTokens.length < 4) {
            currentTokens.push(token as TokenSymbol);
          }
        });
      }

      // Update allocation values based on number of actual tokens
      const actualTokenCount = currentTokens.filter(token => token !== null).length;
      const newAllocationValues =
        allocationType === "percentage"
          ? Array(actualTokenCount).fill((100 / actualTokenCount).toFixed(0))
          : Array(actualTokenCount).fill("1");

      setSelectedOutputTokens(currentTokens);
      setAllocationValues(newAllocationValues);
      setSelectedTemplate(newAllocationValues.join(":"));
      updateDisabledTokens(currentTokens.filter(token => token !== null) as TokenSymbol[]);
    }
    closeTokenPopup();
  };

  const getAllocationForIndex = useCallback(
    (index: number) => {
      // Convert allocation values to numbers
      const numericValues = allocationValues.map((v) => parseFloat(v) || 0);

      // Calculate total for percentage normalization
      const total = numericValues.reduce((sum, val) => sum + val, 0);

      if (total === 0) return 0;

      // If using percentages, ensure they sum to 100
      if (allocationType === "percentage") {
        return numericValues[index] || 0;
      }

      // If using ratios, convert to percentage
      return (numericValues[index] / total) * 100;
    },
    [allocationValues, allocationType]
  );

  // Simplify dependency management
  const simulateAndLogSwap = useCallback(() => {
    if (!fromAmount || !selectedToken || selectedOutputTokens.length === 0)
      return;

    const inputAmount = parseFloat(fromAmount);
    const inputCoinId = TOKENS[selectedToken]?.coingeckoId || "";
    const inputPrice = tokenPriceData[inputCoinId]?.price_usd || 0;
    const inputValueUSD = inputAmount * inputPrice;

    // Calculate output amounts based on allocation ratio
    const newToAmounts: Record<TokenSymbol, string> = {};

    selectedOutputTokens.forEach((outputToken, index) => {
      if (!outputToken) return;
      const outputCoinId = TOKENS[outputToken]?.coingeckoId || "";
      const outputPrice = tokenPriceData[outputCoinId]?.price_usd || 0;

      if (outputPrice === 0) return;

      // Calculate the portion of input value allocated to this output token
      const allocation = getAllocationForIndex(index);
      const outputValueUSD = inputValueUSD * (allocation / 100);

      // Convert USD value to token amount
      const outputAmount = outputValueUSD / outputPrice;

      // Apply swap fee (e.g., 0.3%)
      const outputAmountAfterFee = outputAmount * 0.997;

      newToAmounts[outputToken] = outputAmountAfterFee.toString();
    });

    setToAmounts(newToAmounts);
  }, [
    fromAmount,
    selectedToken,
    selectedOutputTokens,
    tokenPriceData,
    getAllocationForIndex,
  ]);

  // Modify the handleAddToken function to automatically open the token selection popup when adding a new token slot
  const handleAddToken = useCallback(() => {
    const currentTokenCount = selectedOutputTokens.filter(
      (token) => token !== null
    ).length;

    if (currentTokenCount >= 4) {
      toast.warning("Maximum 4 tokens allowed");
      return;
    }

    // Find the next empty slot
    const nextEmptyIndex = selectedOutputTokens.findIndex(
      (token) => token === null
    );

    // Open token selection popup with the correct index
    openTokenPopup(
      "output",
      nextEmptyIndex >= 0 ? nextEmptyIndex : currentTokenCount
    );
  }, [selectedOutputTokens, openTokenPopup]);

  // Add a function to handle template/ratio changes
  const handleTemplateChange = useCallback(
    (newTemplate: string) => {
      const newValues = newTemplate.split(":");
      const currentTokens = [...selectedOutputTokens];

      // Preserve existing token selections up to the new template length
      const adjustedTokens = Array(newValues.length)
        .fill(null)
        .map((_, index) => currentTokens[index] || null);

      setSelectedTemplate(newTemplate);
      setAllocationValues(newValues);
      setSelectedOutputTokens(adjustedTokens);

      // Preserve amounts for existing tokens
      const newToAmounts = Object.fromEntries(
        Object.entries(toAmounts).filter(([token]) =>
          adjustedTokens.includes(token as TokenSymbol)
        )
      );
      setToAmounts(newToAmounts);
    },
    [selectedOutputTokens, toAmounts]
  );
  // First, separate the price fetching useEffect
  useEffect(() => {
    console.log("Setting up price fetching intervals");
    if (dogeMarketCap === 0) {
      getDogeCoinMarketCap();
    }
    // Initial fetch
    fetchMultiplePriceData();

    // Set up retry interval for failed tokens (every 10 seconds)
    retryIntervalRef.current = setInterval(() => {
      if (failedTokens.size > 0) {
        console.log("Retrying failed tokens:", Array.from(failedTokens));
        fetchMultiplePriceData(Array.from(failedTokens));
      }
    }, 10000);

    // Set up regular update interval (every 10 minutes)
    updateIntervalRef.current = setInterval(() => {
      console.log("Regular price update");
      fetchMultiplePriceData();
    }, 600000);

    // Cleanup
    return () => {
      if (retryIntervalRef.current) {
        clearInterval(retryIntervalRef.current);
        retryIntervalRef.current = undefined;
      }
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = undefined;
      }
    };
  }, []);

  // Modify the existing useEffect to handle new token additions
  useEffect(() => {
    const updateEffects = async () => {
      // Only proceed if still mounted and on swap page
      if (!mounted.current) return;

      try {
        // Parse URL parameters
        const params = new URLSearchParams(location.search);
        const fromToken = params.get('from');
        const toTokens = params.get('to')?.split('-') || [];
        const ratio = params.get('ratio')?.split('-') || [];
        const urlAllocationType = params.get('allocationType');

        // Initialize state with URL parameters if they exist
        if (fromToken) {
          setSelectedToken(fromToken as TokenSymbol);
        }
        if (toTokens.length > 0) {
          setSelectedOutputTokens(toTokens as Array<TokenSymbol | null>);
        }
        if (ratio.length > 0) {
          setAllocationValues(ratio);
          // Only set allocation type to ratio if explicitly specified in URL
          if (urlAllocationType === 'ratio') {
            setAllocationType('ratio');
          }
        }

        // Fetch balances and update token balances
        if (isConnected && address) {
          await fetchBalances();
          await refetchEthBalance();
        } else {
          setTokenBalances(MOCK_BALANCES);
        }

        // Update ETH balance in token balances
        if (ethBalanceData) {
          setTokenBalances((prev) => ({
            ...prev,
            ETH: ethers.formatUnits(ethBalanceData.value, 18),
          }));
        }

        // Simulate swap if we have all required parameters
        if (fromToken && toTokens.length > 0 && ratio.length > 0) {
          simulateAndLogSwap();
        }

        // Check approval status
        if (isConnected && address && selectedToken !== "ETH" && selectedToken !== "WETH" && fromAmount) {
          await checkApproval();
        }
      } catch (error) {
        console.error("Error in updateEffects:", error);
      }
    };

    updateEffects();
  }, [location.search, isConnected, address, ethBalanceData, fromAmount, selectedToken]);

  // Add cleanup in a separate useEffect
  useEffect(() => {
    console.log("1. Mount effect starting, current value:", mounted.current);
    mounted.current = true;
    console.log("2. Set mounted to true:", mounted.current);

    return () => {
      console.log("Cleanup: Setting mounted to false");
      mounted.current = false;
    };
  }, []);

  // Function to get the number of selected output tokens
  const getSelectedTokenCount = () => {
    return selectedOutputTokens.filter((token) => token !== null).length;
  };

  // Add this function to handle sharing the URL
  const handleShareUrl = () => {
    // Serialize the relevant state values into a query string
    const queryParams = new URLSearchParams({
      sellToken: String(selectedToken),
      allocationType,
      allocationValues: allocationValues.join(","),
      selectedOutputTokens: selectedOutputTokens.join(","),
      fromAmount,
    }).toString();
    console.log("queryParams", queryParams);
    // Construct the new URL with the query string
    const currentUrl =
      window.location.origin + window.location.pathname + "?" + queryParams;

    // Copy the updated URL to the clipboard
    navigator.clipboard
      .writeText(currentUrl)
      .then(() => {
        showToast("URL copied to clipboard!", "success");
      })
      .catch((err) => {
        console.error("Failed to copy URL: ", err);
        showToast("Failed to copy URL. Please try again.", "error");
      });
  };
  // Handle from amount change
  const handleFromAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const balance = parseFloat(tokenBalances[selectedToken as string] || "0");
      const amountToSell = parseFloat(e.target.value);

      if (!isNaN(amountToSell) && amountToSell > balance) {
        setIsBalanceSufficient(false);
      } else {
        setIsBalanceSufficient(true);
      }
      const value: string = e.target.value;
      if (value.includes("-")) {
        toast.error("Sell amount cannot be negative");
      } else {
        setFromAmount(value);
      }
    },
    [selectedToken, tokenBalances]
  );

  const handleAllocationTypeChange = (value: "ratio" | "percentage") => {
    setAllocationType(value);

    let newValues: string[];
    if (value === "ratio") {
      // Convert percentages to ratio
      const percentages = allocationValues.map((v) => parseFloat(v) || 0);
      const total = percentages.reduce((sum, v) => sum + v, 0);

      if (total === 0) {
        // Handle edge case where all values are 0
        newValues = Array(percentages.length).fill("1");
      } else {
        // Find the smallest percentage to use as base for ratio conversion
        const smallestPercentage = Math.min(
          ...percentages.filter((p) => p > 0)
        );
        newValues = percentages.map((p) => {
          const ratio = p / smallestPercentage;
          return ratio === 0 ? "1" : Math.round(ratio).toString();
        });
      }

      // Check if it matches a template
      const newTemplate = newValues.join(":");
      const isTemplate = [
        "1",
        "1:1",
        "1:2",
        "1:1:2",
        "1:2:2",
        "1:1:1:1",
      ].includes(newTemplate);
      setSelectedTemplate(isTemplate ? newTemplate : "");
    } else {
      // Convert ratio to percentages
      const ratios = allocationValues.map((v) => parseFloat(v) || 1);
      const total = ratios.reduce((sum, v) => sum + v, 0);

      newValues = ratios.map((v) => {
        const percentage = (v / total) * 100;
        return percentage.toFixed(2);
      });

      // Check if it matches a template
      const newTemplate = newValues.join(":");
      const isTemplate = [
        "100",
        "50:50",
        "33.33:33.33:33.33",
        "25:25:25:25",
        "40:30:30",
        "50:25:25",
      ].includes(newTemplate);
      setSelectedTemplate(isTemplate ? newTemplate : "");
    }

    // Update allocation values while preserving tokens
    setAllocationValues(newValues);

    // Only reset output tokens if there are none selected
    if (
      selectedOutputTokens.length === 0 ||
      (selectedOutputTokens.length === 1 && selectedOutputTokens[0] === null)
    ) {
      setSelectedOutputTokens([null]);
    }
  };

  const handleAllocationValueChange = (index: number, value: string) => {
    setAllocationValues((prev) => {
      const newValues = [...prev];
      newValues[index] = value;

      if (allocationType === "percentage") {
        // Validate percentage total
        const total = newValues.reduce(
          (sum, v) => sum + (parseFloat(v) || 0),
          0
        );
        if (total > 100) {
          toast.error("Total percentage cannot exceed 100%");
          return prev;
        }
      }
      // Check if the new values match any template
      const newTemplate = newValues.join(":");
      const templates =
        allocationType === "ratio"
          ? ["1", "1:1", "1:2", "1:1:2", "1:2:2", "1:1:1:1"]
          : [
              "100",
              "50:50",
              "33.33:33.33:33.33",
              "25:25:25:25",
              "40:30:30",
              "50:25:25",
            ];

      setSelectedTemplate(templates.includes(newTemplate) ? newTemplate : "");
      console.log(">> newValues", newValues);
      return newValues;
    });
  };

  const getAllocationString = () => {
    if (allocationType === "ratio") {
      return allocationValues.join(" : ");
    } else {
      // Convert values to numbers and handle invalid inputs
      const values = allocationValues.map((v) => parseFloat(v) || 0);
      const total = values.reduce((sum, v) => sum + v, 0);

      // If total is 0, return all zeros
      if (total === 0) {
        return values.map(() => "0.00%").join(" : ");
      }

      // Calculate percentages with extra precision
      let percentages = values.map((v) => (v / total) * 100);

      // Round to 2 decimal places
      percentages = percentages.map((v) => Math.round(v * 100) / 100);

      // Adjust last value to ensure total is exactly 100%
      const currentTotal = percentages.reduce((sum, v) => sum + v, 0);
      if (currentTotal !== 100 && percentages.length > 0) {
        const diff = 100 - currentTotal;
        percentages[percentages.length - 1] += diff;
      }

      // Format with exactly 2 decimal places and consistent spacing
      return percentages.map((v) => `${v.toFixed(2)}%`).join(" : ");
    }
  };

  // Calculate percentages for the allocation values
  const allocationPercentages =
    calculateAllocationPercentages(allocationValues);

  // Move simulateQuote inside component
  const simulateQuote = useCallback(async () => {
    if (!fromAmount || !selectedToken || selectedOutputTokens.length === 0) {
      setSimulatedOutputs({});
      return;
    }

    // Set loading state for all output tokens

    try {
      let quoteResult;
      if (selectedToken === "ETH" || selectedToken === "WETH") {
        const quoteParams = await constructSwapParams(
          selectedToken,
          fromAmount,
          selectedOutputTokens,
          allocationValues,
          true
        );

        // Get quote for ETH/WETH
        quoteResult = await quoteTokenForMultiTokens(quoteParams);
      } else {
        const quoteParams = await constructSwapParams(
          selectedToken,
          fromAmount,
          selectedOutputTokens,
          allocationValues,
          true
        );
        console.log(">> quoteParams", quoteParams);

        // Get quote for ERC20 tokens
        quoteResult = await quoteERC20ForMultiTokens(
          quoteParams as swapUSDForMultiTokensParam
        );
        console.log(">>> intermediate USD quote == ", quoteResult);
      }
      setQuoteResult(quoteResult);
      console.log(">> quoteResult", quoteResult);
      // Process quote results
      const newSimulatedOutputs: Record<TokenSymbol, SimulatedOutput> = {};
      selectedOutputTokens.forEach((token, index) => {
        if (!token) return;

        const amount = ethers.formatUnits(
          quoteResult[index] || 0,
          TOKENS[token].decimals
        );

        // Get input token price
        const inputCoinId = TOKENS[selectedToken].coingeckoId;
        const inputPrice =
          inputCoinId && tokenPriceData[inputCoinId]
            ? tokenPriceData[inputCoinId].price_usd
            : 0;

        // Get output token price
        const outputCoinId = TOKENS[token].coingeckoId;
        const outputPrice =
          outputCoinId && tokenPriceData[outputCoinId]
            ? tokenPriceData[outputCoinId].price_usd
            : 0;

        // Calculate allocated input amount based on percentage
        const allocation = getAllocationForIndex(index) / 100;
        const allocatedInputAmount = (
          parseFloat(fromAmount) * allocation
        ).toString();

        // Calculate price impact
        const priceImpact = calculatePriceImpact(
          allocatedInputAmount,
          amount,
          inputPrice,
          outputPrice
        );

        // Calculate USD value
        const usdValue = (parseFloat(amount) * outputPrice).toString();

        newSimulatedOutputs[token] = {
          amount,
          usdValue,
          priceImpact: priceImpact + "%",
          loading: false,
        };
      });

      setSimulatedOutputs(newSimulatedOutputs);
      setIsQuoteSucess(true);
    } catch (error) {
      setIsQuoteSucess(false);
      console.error("Quote simulation failed:", error);
      // Set error state for all output tokens
      setSimulatedOutputs(() => {
        const newOutputs: Record<TokenSymbol, SimulatedOutput> = {};
        selectedOutputTokens.forEach((token) => {
          if (token) {
            newOutputs[token] = {
              amount: "0",
              usdValue: "0",
              error: "Quote failed",
              loading: false,
            };
          }
        });
        return newOutputs;
      });
    }
  }, [
    fromAmount,
    selectedToken,
    selectedOutputTokens,
    tokenPriceData,
    getAllocationForIndex,
  ]);

  // Add useEffect for simulation
  useEffect(() => {
    if (
      fromAmount &&
      selectedToken &&
      selectedOutputTokens.length > 0 &&
      selectedOutputTokens[0] !== null
    ) {
      setAreFieldsValid(true);
      simulateQuote();
    } else {
      setAreFieldsValid(false);
    }
  }, [fromAmount, selectedToken, selectedOutputTokens, allocationValues]);

  const OUTPUT_TOKENS = useMemo(() => {
    return Object.fromEntries(
      Object.entries(TOKENS).filter(
        ([symbol]) => symbol !== "ETH" && symbol !== "WETH"
      )
    ) as Record<string, TokenConfig>;
  }, []);

  const [activePercentageIndex, setActivePercentageIndex] = useState<number | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActivePercentageIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Function to handle percentage change
  const handlePercentageChange = (index: number, value: number) => {
    const newValues = [...allocationValues];
    newValues[index] = Math.min(100, Math.max(0, value)).toString();
    
    // Calculate total of other percentages
    const otherTotal = newValues
      .filter((_, i) => i !== index)
      .reduce((sum, val) => sum + (parseFloat(val) || 0), 0);

    // If total exceeds 100%, adjust other values proportionally
    if (parseFloat(newValues[index]) + otherTotal > 100) {
      const excess = parseFloat(newValues[index]) + otherTotal - 100;
      const otherIndices = newValues
        .map((_, i) => i)
        .filter(i => i !== index);
      
      otherIndices.forEach(idx => {
        const currentVal = parseFloat(newValues[idx]) || 0;
        const proportion = currentVal / otherTotal;
        newValues[idx] = Math.max(0, currentVal - (excess * proportion)).toString();
      });
    }

    setAllocationValues(newValues);
  };

  // Initialize percentages when tokens change
  useEffect(() => {
    if (allocationType === "percentage") {
      const newValues = Array(selectedOutputTokens.length).fill(
        (100 / selectedOutputTokens.length).toFixed(2)
      );
      setAllocationValues(newValues);
      setSelectedTemplate(newValues.join(":"));
    }
  }, [selectedOutputTokens.length, allocationType]);

  return (
    <div className="min-h-screen bg-[#0d111c] relative overflow-x-hidden">
      {/* Background blur effect */}
      <div className="fixed inset-0 bg-[#0d111c]">
        <div className="absolute inset-0 backdrop-blur-[150px]" />
      </div>
      
      {/* Main content */}
      <div className="relative w-full max-w-[1000px] mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* Main container box */}
        <div className="flex-grow flex items-center">
          <div className="w-full bg-[#191c2a]/80 backdrop-blur-xl rounded-2xl border border-[#2d3648]/50 p-6">
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left column - Swap Interface */}
              <div className="space-y-3">
                {/* Input (Sell) section */}
                <div className="bg-[#212638]/80 backdrop-blur-xl rounded-xl p-3 border border-[#2d3648]/30">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Sell</label>
                    <div className="flex items-center justify-between">
                      <div className="flex-grow">
                        <input
                          type="number"
                          value={fromAmount}
                          onChange={handleFromAmountChange}
                          placeholder="0"
                          className="bg-transparent border-none text-left w-full placeholder-gray-500 focus:outline-none focus:ring-0 text-white text-xl"
                        />
                        <span className="text-xs text-gray-400">
                          {getUsdValue(fromAmount || "0", selectedToken, tokenPriceData)}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <button
                          onClick={() => openTokenPopup("from")}
                          className="flex items-center justify-between bg-[#293249]/80 hover:bg-[#374160] rounded-full px-3 py-1.5 transition-all duration-200 min-w-[140px] max-w-[180px] truncate border border-[#3d4860]/50"
                        >
                          <div className="flex items-center space-x-2">
                            {selectedToken ? (
                              <>
                                <img
                                  src={TOKENS[selectedToken].logo}
                                  alt={`${selectedToken} logo`}
                                  className="w-5 h-5 rounded-full flex-shrink-0"
                                />
                                <span className="text-sm text-white truncate">{selectedToken}</span>
                              </>
                            ) : (
                              <>
                                <div className="w-5 h-5 rounded-full bg-[#374160] flex items-center justify-center flex-shrink-0">
                                  <ChevronDown className="h-3 w-3 text-gray-400" />
                                </div>
                                <span className="text-sm text-gray-400 truncate">Select token</span>
                              </>
                            )}
                          </div>
                          <ChevronDown className="h-3 w-3 text-gray-400 ml-1 flex-shrink-0" />
                        </button>
                        <span className="text-xs text-gray-400 mt-1">
                          {selectedToken ? `Balance: ${parseFloat(tokenBalances[selectedToken] || "0").toFixed(4)} ${selectedToken}` : "Select a token to view balance"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Swap arrow */}
                <div className="flex justify-center -my-1">
                  <div className="bg-[#293249]/80 backdrop-blur-sm rounded-full p-2 border border-[#3d4860]/50">
                    <ArrowDownUp className="h-4 w-4 text-gray-400" />
                  </div>
                </div>

                {/* Output (Buy) section */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Buy</label>
                  {(selectedOutputTokens.length > 0 ? selectedOutputTokens : [null]).map((token, index) => (
                    <div
                      key={index}
                      className="bg-[#212638]/80 backdrop-blur-sm rounded-xl p-3 border border-[#2d3648]/30"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-grow">
                          <input
                            type="number"
                            value={token ? simulatedOutputs[token]?.amount || "0" : "0"}
                            readOnly
                            className="bg-transparent border-none text-left w-full focus:outline-none focus:ring-0 text-white text-xl"
                          />
                          <span className="text-xs text-gray-400">
                            {token && simulatedOutputs[token]?.loading
                              ? "Calculating..."
                              : token && simulatedOutputs[token]?.error
                              ? simulatedOutputs[token]?.error
                              : token
                              ? getUsdValue(
                                  simulatedOutputs[token]?.amount || "0",
                                  token,
                                  tokenPriceData
                                )
                              : "$0.00"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openTokenPopup("output", index)}
                            className="flex items-center justify-between bg-[#293249]/80 hover:bg-[#374160] rounded-full px-3 py-1.5 transition-all duration-200 min-w-[140px] max-w-[180px] truncate border border-[#3d4860]/50"
                          >
                            <div className="flex items-center space-x-2">
                              {token ? (
                                <>
                                  <img
                                    src={TOKENS[token].logo}
                                    alt={`${token} logo`}
                                    className="w-5 h-5 rounded-full flex-shrink-0"
                                  />
                                  <span className="text-sm text-white truncate">{token}</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-5 h-5 rounded-full bg-[#374160] flex items-center justify-center flex-shrink-0">
                                    <ChevronDown className="h-3 w-3 text-gray-400" />
                                  </div>
                                  <span className="text-sm text-gray-400 truncate">Select token</span>
                                </>
                              )}
                            </div>
                            <ChevronDown className="h-3 w-3 text-gray-400 ml-1 flex-shrink-0" />
                          </button>
                          {selectedOutputTokens.length > 1 && token && (
                            <button
                              onClick={() => removeOutputToken(token, index)}
                              className="bg-[#293249]/80 hover:bg-[#374160] rounded-full p-1.5 transition-all duration-200 border border-[#3d4860]/50 flex-shrink-0"
                            >
                              <X className="h-3 w-3 text-gray-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {getSelectedTokenCount() < 4 && (
                    <button
                      onClick={handleAddToken}
                      className="w-full mt-2 py-2.5 bg-[#293249]/80 hover:bg-[#374160] backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-200 border border-[#3d4860]/50"
                    >
                      <Plus className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-white">Add another token</span>
                      <span className="text-xs text-gray-400 ml-2">
                        ({4 - getSelectedTokenCount()} remaining)
                      </span>
                    </button>
                  )}
                </div>

                {/* Transaction Button Section */}
                <div className="mt-4">
                  {!isConnected ? (
                    <button
                      onClick={openConnectModal}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <span>Connect Wallet</span>
                    </button>
                  ) : !fromAmount ? (
                    <button
                      disabled
                      className="w-full bg-[#293249]/50 text-gray-400 font-medium py-3 px-4 rounded-xl cursor-not-allowed"
                    >
                      Enter amount to sell
                    </button>
                  ) : selectedOutputTokens.filter(token => token !== null).length === 0 ? (
                    <button
                      disabled
                      className="w-full bg-[#293249]/50 text-gray-400 font-medium py-3 px-4 rounded-xl cursor-not-allowed"
                    >
                      Select output tokens
                    </button>
                  ) : !isBalanceSufficient ? (
                    <button
                      disabled
                      className="w-full bg-[#293249]/50 text-gray-400 font-medium py-3 px-4 rounded-xl cursor-not-allowed"
                    >
                      Insufficient balance
                    </button>
                  ) : needsApproval && selectedToken !== "ETH" && selectedToken !== "WETH" ? (
                    <button
                      onClick={handleApprove}
                      disabled={isApproving}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isApproving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Approving...</span>
                        </>
                      ) : (
                        <span>Approve {selectedToken}</span>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleSwap}
                      disabled={isSwapping || !isQuoteSucess}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSwapping ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Swapping...</span>
                        </>
                      ) : !isQuoteSucess ? (
                        <span>Price Impact Too High</span>
                      ) : (
                        <span>Swap</span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Right column - Allocation Controls */}
              <div className="space-y-3">
                <div className="bg-[#212638]/80 backdrop-blur-xl rounded-xl p-4 border border-[#2d3648]/30">
                  {/* Split Options */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400 font-medium">Split Type</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            if (selectedOutputTokens.filter(t => t !== null).length < 2) {
                              toast.error("Please select at least 2 tokens first");
                              return;
                            }
                            setAllocationType("percentage");
                            const count = selectedOutputTokens.filter(t => t !== null).length;
                            const equalValue = (100 / count).toFixed(2);
                            setAllocationValues(Array(count).fill(equalValue));
                          }}
                          className={`bg-[#293249]/80 hover:bg-[#374160] text-white py-3 px-4 rounded-xl transition-all duration-200 border ${
                            allocationValues.every((v, i, arr) => v === arr[0])
                              ? "border-[#4c82fb]"
                              : "border-[#3d4860]/50"
                          }`}
                        >
                          <div className="font-medium">Equal Split</div>
                          <div className="text-xs text-gray-400">Split tokens equally</div>
                        </button>
                        <button
                          onClick={() => {
                            if (selectedOutputTokens.filter(t => t !== null).length < 2) {
                              toast.error("Please select at least 2 tokens first");
                              return;
                            }
                            setAllocationType("percentage");
                          }}
                          className={`bg-[#293249]/80 hover:bg-[#374160] text-white py-3 px-4 rounded-xl transition-all duration-200 border ${
                            !allocationValues.every((v, i, arr) => v === arr[0])
                              ? "border-[#4c82fb]"
                              : "border-[#3d4860]/50"
                          }`}
                        >
                          <div className="font-medium">Custom Split</div>
                          <div className="text-xs text-gray-400">Set custom weights</div>
                        </button>
                      </div>
                    </div>

                    {/* Allocation Type Toggle */}
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400 font-medium">Input Type</label>
                      <div className="flex items-center justify-center p-1 bg-[#212638]/80 backdrop-blur-sm rounded-xl border border-[#2d3648]/30">
                        <button
                          onClick={() => handleAllocationTypeChange("ratio")}
                          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                            allocationType === "ratio"
                              ? "bg-[#4c82fb] text-white"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Ratio
                        </button>
                        <button
                          onClick={() => handleAllocationTypeChange("percentage")}
                          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                            allocationType === "percentage"
                              ? "bg-[#4c82fb] text-white"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Percentage
                        </button>
                      </div>
                    </div>

                    {/* Custom Allocation */}
                    <div className="space-y-2">
                      <label className="text-sm text-gray-400 font-medium">
                        Token Allocation ({allocationType === "percentage" ? "%" : "ratio"})
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {Array(4).fill(null).map((_, index) => {
                          const hasToken = selectedOutputTokens[index] && selectedOutputTokens[index] !== null;
                          return (
                            <div
                              key={index}
                              className="relative group w-full"
                            >
                              {allocationType === "percentage" ? (
                                <button
                                  onClick={() => hasToken && setActivePercentageIndex(activePercentageIndex === index ? null : index)}
                                  className={`w-full bg-[#212638]/80 backdrop-blur-sm rounded-xl p-2.5 text-white border ${
                                    hasToken ? "border-[#2d3648]/30" : "border-[#2d3648]/10"
                                  } focus:ring-2 focus:ring-[#4c82fb] focus:border-transparent ${
                                    !hasToken && "opacity-50 cursor-not-allowed"
                                  } truncate`}
                                >
                                  {hasToken ? `${parseFloat(allocationValues[index] || "0").toFixed(1)}%` : ""}
                                </button>
                              ) : (
                                <input
                                  type="number"
                                  value={hasToken ? allocationValues[index] || "" : ""}
                                  onChange={(e) => {
                                    if (hasToken) {
                                      handleAllocationValueChange(index, e.target.value);
                                    }
                                  }}
                                  disabled={!hasToken}
                                  placeholder=""
                                  className={`w-full bg-[#212638]/80 backdrop-blur-sm rounded-xl p-2.5 text-white border ${
                                    hasToken ? "border-[#2d3648]/30" : "border-[#2d3648]/10"
                                  } focus:ring-2 focus:ring-[#4c82fb] focus:border-transparent ${
                                    !hasToken && "opacity-50 cursor-not-allowed"
                                  } truncate`}
                                />
                              )}
                              {!hasToken && (
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                  <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-[#293249] text-white text-sm px-2 py-1 rounded whitespace-nowrap">
                                    Select token to customize allocation
                                  </div>
                                </div>
                              )}
                              {allocationType === "percentage" && activePercentageIndex === index && (
                                <div 
                                  ref={popoverRef}
                                  className="absolute right-0 top-full mt-2 p-4 bg-[#191c2a] rounded-xl border border-[#2d3648] shadow-lg z-50 min-w-[240px]"
                                >
                                  <div className="space-y-4">
                                    {/* Direct Input */}
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="number"
                                        value={parseFloat(allocationValues[index] || "0").toFixed(1)}
                                        onChange={(e) => handlePercentageChange(index, parseFloat(e.target.value) || 0)}
                                        className="w-20 px-2 py-1 bg-[#293249] rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#4c82fb]"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                      />
                                      <span className="text-gray-400">%</span>
                                      <button
                                        onClick={() => setActivePercentageIndex(null)}
                                        className="ml-2 px-2 py-1 bg-[#4c82fb] hover:bg-[#3a6fd0] text-white rounded-lg text-sm transition-colors"
                                      >
                                        Confirm
                                      </button>
                                    </div>
                                    
                                    {/* Slider */}
                                    <div className="space-y-2">
                                      <input
                                        type="range"
                                        value={parseFloat(allocationValues[index] || "0")}
                                        onChange={(e) => handlePercentageChange(index, parseFloat(e.target.value))}
                                        className="w-full appearance-none h-2 bg-[#293249] rounded-full outline-none cursor-pointer
                                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                                          [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                                          [&::-webkit-slider-thumb]:bg-[#4c82fb] [&::-webkit-slider-thumb]:cursor-pointer
                                          [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 
                                          [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#4c82fb] 
                                          [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                      />
                                      <div className="flex justify-between text-xs text-gray-400">
                                        <span>0%</span>
                                        <span>50%</span>
                                        <span>100%</span>
                                      </div>
                                    </div>

                                    {/* Quick Select Buttons */}
                                    <div className="flex flex-wrap gap-2">
                                      {[25, 50, 75, 100].map((value) => (
                                        <button
                                          key={value}
                                          onClick={() => handlePercentageChange(index, value)}
                                          className="px-2 py-1 bg-[#293249] hover:bg-[#374160] rounded-lg text-sm transition-colors"
                                        >
                                          {value}%
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-sm text-gray-400">
                        Current Allocation: {getAllocationString()}
                      </div>
                    </div>

                    {/* Token Allocations Bar */}
                    {selectedOutputTokens.length > 0 && selectedOutputTokens[0] !== null && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-400">Token Allocations</div>
                        <div className="relative h-2.5 bg-[#212638]/80 rounded-full overflow-hidden border border-[#2d3648]/30">
                          {allocationPercentages.map((percentage, index) => {
                            const leftPosition = allocationPercentages
                              .slice(0, index)
                              .reduce((a, b) => a + b, 0);
                            return (
                              <div
                                key={index}
                                className={`absolute h-full ${TOKEN_COLORS[index % TOKEN_COLORS.length]}`}
                                style={{
                                  width: `${percentage}%`,
                                  left: `${leftPosition}%`,
                                }}
                              />
                            );
                          })}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                          {allocationValues.map((value, index) => {
                            const tokenSymbol = TOKENS[selectedOutputTokens[index] as TokenSymbol]?.symbol;
                            return tokenSymbol ? (
                              <span key={index} className="bg-[#212638]/50 px-2 py-1 rounded-full">
                                {`${value} (${allocationPercentages[index].toFixed(2)}%) ${tokenSymbol}`}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Share Button */}
                    <button
                      onClick={handleShareUrl}
                      className="w-full flex items-center justify-center space-x-2 bg-[#293249]/80 hover:bg-[#374160] text-white py-2.5 rounded-xl transition-all duration-200 border border-[#3d4860]/50"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Share Allocation</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex items-center justify-center space-x-8 py-6">
          <a
            href="https://twitter.com/memerot"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-70 hover:opacity-100 transition-opacity duration-200"
          >
            <img src={xIcon} alt="X (Twitter)" className="w-6 h-6" />
          </a>
          <a
            href="https://t.me/memerot"
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-70 hover:opacity-100 transition-opacity duration-200"
          >
            <img src={telegramIcon} alt="Telegram" className="w-6 h-6" />
          </a>
        </div>
      </div>

      <TokenSelectionPopup
        isOpen={isTokenPopupOpen}
        onClose={closeTokenPopup}
        onSelect={handleTokenSelect}
        tokens={activeTokenSelection?.type === "output" ? OUTPUT_TOKENS : TOKENS}
        balances={tokenBalances}
        disabledTokens={disabledTokens as string[]}
        tokenPriceData={tokenPriceData}
        selectedOutputTokens={selectedOutputTokens.filter(token => token !== null) as string[]}
        allowMultiSelect={activeTokenSelection?.type === "output"}
        selectedToken={activeTokenSelection?.type === "from" ? selectedToken : null}
      />
    </div>
  );
}
export default SwapInterfaceContent;
