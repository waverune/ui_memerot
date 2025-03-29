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
import {
  useAccount,
  useBalance,
  usePublicClient,
  useWalletClient,
} from "wagmi";
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
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>("ETH");
  const [selectedOutputTokens, setSelectedOutputTokens] = useState<
    TokenSymbol[]
  >([]);
  const [toAmounts, setToAmounts] = useState<Record<TokenSymbol, string>>({
    SPX6900: "0",
    MOG: "0",
  });
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
  const [allocationType, setAllocationType] = useState<"ratio" | "percentage">(
    "ratio"
  );
  const [allocationValues, setAllocationValues] = useState(["1"]);
  const [selectedTemplate, setSelectedTemplate] = useState("1");
  const [tokenPriceData, setTokenPriceData] = useState<
    Record<string, CoinPriceData>
  >({});
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

  const swapContractAddress = "0x1664A211D6C2414c88671a412065A15388EFEd5d"; // Replace with your actual swap contract address

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
    return new ethers.JsonRpcProvider("https://rpc.buildbear.io/memerot");
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
        (token) => token !== ""
      );
      setDisabledTokens(disabled);
    },
    [selectedToken]
  );

  // Modify the removeOutputToken function to handle empty slots
  const removeOutputToken = useCallback(
    (tokenToRemove: TokenSymbol | "", index: number) => {
      // If this is the only slot, just clear the selection instead of removing it
      if (selectedOutputTokens.length === 1) {
        setSelectedOutputTokens([""]); // Keep one empty slot
        setToAmounts({});

        // Keep allocation values as is for single slot
        if (allocationType === "percentage") {
          setAllocationValues(["100"]);
          setSelectedTemplate("100");
        } else {
          setAllocationValues(["1"]);
          setSelectedTemplate("1");
        }

        updateDisabledTokens([""]);
        return;
      }

      // For multiple slots, remove the slot completely
      const newSelectedOutputTokens = selectedOutputTokens.filter(
        (_, i) => i !== index
      );
      setSelectedOutputTokens(newSelectedOutputTokens);

      if (tokenToRemove) {
        const newToAmounts = { ...toAmounts };
        delete newToAmounts[tokenToRemove];
        setToAmounts(newToAmounts);
      }

      const newLength = allocationValues.length - 1;
      if (allocationType === "ratio") {
        const newAllocationValues = allocationValues.filter(
          (_, i) => i !== index
        );
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
    [
      selectedOutputTokens,
      toAmounts,
      allocationValues,
      allocationType,
      updateDisabledTokens,
    ]
  );

  const checkApproval = useCallback(async () => {
    if (isConnected && address && selectedToken !== "ETH" && fromAmount) {
      try {
        const signer = await getSigner();
        const tokenAddress = TOKENS[selectedToken].address;
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
    if (!isConnected || selectedToken === "ETH") {
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
      const currentTokens = selectedOutputTokens.filter(
        (token) => token !== ""
      );
      console.log(">>> current tokens:", currentTokens);

      // Filter out tokens that are already selected
      const newUniqueTokens = tokens.filter(
        (token) => !currentTokens.includes(token)
      );
      console.log(">>> new unique tokens:", newUniqueTokens);

      // Create new array with existing tokens
      const newTokens = [...currentTokens];

      // Add only the new unique tokens
      newUniqueTokens.forEach((token) => {
        if (newTokens.length < 4) {
          newTokens.push(token as TokenSymbol);
        }
      });

      console.log(">>> final tokens array:", newTokens);

      // Update allocation values based on number of actual tokens
      const actualTokenCount = newTokens.filter((token) => token !== "").length;
      const newAllocationValues =
        allocationType === "percentage"
          ? Array(actualTokenCount).fill((100 / actualTokenCount).toFixed(0))
          : Array(actualTokenCount).fill("1");

      setSelectedOutputTokens(newTokens);
      setAllocationValues(newAllocationValues);
      setSelectedTemplate(newAllocationValues.join(":"));
      updateDisabledTokens(newTokens);
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
      (token) => token !== ""
    ).length;

    if (currentTokenCount >= 4) {
      toast.warning("Maximum 4 tokens allowed");
      return;
    }

    // Find the next empty slot
    const nextEmptyIndex = selectedOutputTokens.findIndex(
      (token) => token === ""
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
        .fill("")
        .map((_, index) => currentTokens[index] || "");

      setSelectedTemplate(newTemplate);
      setAllocationValues(newValues);
      setSelectedOutputTokens(adjustedTokens);

      // Preserve amounts for existing tokens
      const newToAmounts = Object.fromEntries(
        Object.entries(toAmounts).filter(([token]) =>
          adjustedTokens.includes(token)
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
      // Check only the base path
      if (!mounted.current) {
        console.log("4a. Not mounted, returning");
        return;
      }

      if (!location.pathname.startsWith("/swap")) {
        console.log("4b. Not on swap page, returning");
        return;
      }
      console.log("5. Proceeding with effects...");

      try {
        // Effect 1: Fetch balances and update token balances
        console.log("isConnected", isConnected);
        console.log("address", address);
        if (isConnected && address) {
          console.log("fetching balances");
          await fetchBalances();
          await refetchEthBalance();
        } else {
          setTokenBalances(MOCK_BALANCES);
        }

        // Effect 2: Update ETH balance in token balances
        if (ethBalanceData) {
          setTokenBalances((prev) => ({
            ...prev,
            ETH: ethers.formatUnits(ethBalanceData.value, 18),
          }));
        }

        // Effect 4: Simulate swap
        if (fromAmount && selectedToken && selectedOutputTokens.length > 0) {
          simulateAndLogSwap();
        }

        // Effect 5: Check approval status
        if (isConnected && address && selectedToken !== "ETH" && fromAmount) {
          await checkApproval();
        }

        // Effect 6: Update URL - Only if we're still on swap page
        if (mounted.current && location.pathname === "/swap") {
          const searchParams = new URLSearchParams();
          if (fromAmount) searchParams.set("amount", fromAmount);
          if (selectedToken) searchParams.set("from", selectedToken as string);
          if (selectedOutputTokens.length > 0)
            searchParams.set("to", selectedOutputTokens.join("-"));
          if (allocationType === "ratio") {
            searchParams.set("ratio", allocationValues.join("-"));
          } else {
            searchParams.set("percentage", allocationValues.join("-"));
          }
          navigate(`?${searchParams.toString()}`, { replace: true });
        }

        // Effect 7: Parse URL parameters (only on mount)
        if (!hasInitialized.current && mounted.current) {
          const params = new URLSearchParams(location.search);
          const sellToken = params.get("sellToken");
          const allocationTypeParam = params.get("allocationType");
          const allocationValuesParam = params.get("allocationValues");
          const selectedOutputTokensParam = params.get("selectedOutputTokens");
          const fromAmountParam = params.get("fromAmount");

          if (sellToken) {
            setSelectedToken(sellToken as TokenSymbol);
            updateDisabledTokens();
          }
          if (allocationTypeParam) {
            setAllocationType(allocationTypeParam as "ratio" | "percentage");
          }
          if (allocationValuesParam) {
            setAllocationValues(allocationValuesParam.split(","));
          }
          if (selectedOutputTokensParam) {
            setSelectedOutputTokens(
              selectedOutputTokensParam.split(",") as TokenSymbol[]
            );
          } else {
            setSelectedOutputTokens([""]);
          }
          if (fromAmountParam) {
            setFromAmount(fromAmountParam);
          }
          hasInitialized.current = true;
        }

        // Effect 8: Handle allocation updates after adding new token
        if (selectedOutputTokens.length > 0) {
          updateDisabledTokens();
          if (fromAmount && selectedToken) {
            simulateAndLogSwap();
          }
        }
      } catch (error) {
        console.error("Error in updateEffects:", error);
      }
    };

    updateEffects();
  }, [
    isConnected,
    address,
    ethBalanceData,
    fromAmount,
    selectedToken,
    selectedOutputTokens,
    formattedAllocationRatio,
    checkApproval,
    location.search,
    selectedOutputTokens.length,
  ]);

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
    return selectedOutputTokens.filter((token) => token !== "").length;
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
      (selectedOutputTokens.length === 1 && selectedOutputTokens[0] === "")
    ) {
      setSelectedOutputTokens([""]);
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
      selectedOutputTokens[0] !== ""
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

  return (
    <div className="p-6 lg:p-8 flex flex-col lg:flex-row lg:space-x-8">
      <div className="w-full lg:w-1/2 space-y-4">
        {/* Input (Sell) section */}
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Sell</label>
            <div className="bg-gray-700 rounded-lg p-3 flex items-center">
              <div className="flex-grow">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={handleFromAmountChange}
                  placeholder="0"
                  className="bg-transparent border-none text-left w-full placeholder-gray-500 focus:outline-none focus:ring-0"
                />
                <span className="text-xs text-gray-400">
                  {getUsdValue(
                    fromAmount || "0",
                    selectedToken,
                    tokenPriceData
                  )}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <button
                  onClick={() => openTokenPopup("from")}
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
                <span className="text-xs text-gray-400 mt-1">
                  Balance:{" "}
                  {parseFloat(
                    tokenBalances[selectedToken as string] || "0"
                  ).toFixed(4)}{" "}
                  {selectedToken}
                </span>
              </div>
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
            {allocationValues.map((_, index) => (
              <div
                key={index}
                className="bg-gray-700 rounded-lg p-3 flex flex-col"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-grow">
                    <input
                      type="number"
                      value={
                        selectedOutputTokens[index]
                          ? simulatedOutputs[selectedOutputTokens[index]]
                              ?.amount || "0"
                          : "0"
                      }
                      readOnly
                      className="bg-transparent border-none text-left w-full focus:outline-none focus:ring-0 text-lg"
                    />
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-400">
                        {selectedOutputTokens[index] &&
                        simulatedOutputs[selectedOutputTokens[index]]
                          ?.loading ? (
                          "Calculating..."
                        ) : selectedOutputTokens[index] &&
                          simulatedOutputs[selectedOutputTokens[index]]
                            ?.error ? (
                          <span className="text-red-400">
                            {
                              simulatedOutputs[selectedOutputTokens[index]]
                                ?.error
                            }
                          </span>
                        ) : (
                          getUsdValue(
                            simulatedOutputs[selectedOutputTokens[index]]
                              ?.amount || "0",
                            selectedOutputTokens[index],
                            tokenPriceData
                          )
                        )}
                      </span>
                      {selectedOutputTokens[index] &&
                        simulatedOutputs[selectedOutputTokens[index]]
                          ?.priceImpact && (
                          <span
                            className={`text-xs ${
                              parseFloat(
                                simulatedOutputs[selectedOutputTokens[index]]
                                  ?.priceImpact || "0"
                              ) > 5
                                ? "text-red-400"
                                : "text-green-400"
                            }`}
                          >
                            {/* // TODO FIX Price Impact// Price Impact: {simulatedOutputs[selectedOutputTokens[index]]?.priceImpact}  */}
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openTokenPopup("output", index)}
                      className="flex items-center space-x-2 bg-gray-800 rounded-full px-3 py-2"
                    >
                      {selectedOutputTokens[index] &&
                      selectedOutputTokens[index] !== "" ? (
                        <>
                          <img
                            src={TOKENS[selectedOutputTokens[index]].logo}
                            alt={`${selectedOutputTokens[index]} logo`}
                            className="w-5 h-5 rounded-full"
                          />
                          <span>{selectedOutputTokens[index]}</span>
                        </>
                      ) : (
                        <span>Select a token</span>
                      )}
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {/* Show remove button based on conditions */}
                    {(selectedOutputTokens.length > 1 ||
                      selectedOutputTokens[index]) && (
                      <button
                        onClick={() =>
                          removeOutputToken(
                            selectedOutputTokens[index] as string,
                            index
                          )
                        }
                        className="bg-gray-800 rounded-full p-1 hover:bg-gray-600 transition-colors duration-200"
                        title={
                          selectedOutputTokens.length === 1
                            ? "Clear selection"
                            : "Remove slot"
                        }
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                {selectedOutputTokens[index] &&
                  selectedOutputTokens[index] !== "" && (
                    <div className="text-xs text-gray-400 mt-1 text-right">
                      Doge ratio:{" "}
                      {calculateDogeRatio(
                        selectedOutputTokens[index],
                        tokenPriceData,
                        dogeMarketCap
                      )}
                      x Balance:{" "}
                      {parseFloat(
                        tokenBalances[selectedOutputTokens[index] as string] ||
                          "0"
                      ).toFixed(2)}
                    </div>
                  )}
              </div>
            ))}
            {/* Show Add another token button only if we have less than 4 tokens */}
            {getSelectedTokenCount() < 4 && (
              <button
                onClick={handleAddToken}
                className="w-full mt-2 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add another token
                <span className="text-xs text-gray-400 ml-2">
                  ({4 - getSelectedTokenCount()} remaining)
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Swap button */}
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={needsApproval ? handleApprove : handleSwap}
          disabled={
            !isConnected ||
            !areFieldsValid ||
            isSwapping ||
            (needsApproval && isApproving) ||
            !isBalanceSufficient ||
            !isQuoteSucess
          }
        >
          {!isConnected
            ? "Connect Wallet"
            : !isBalanceSufficient
            ? `Insufficient ${selectedToken}`
            : needsApproval
            ? "Approve"
            : isSwapping
            ? "Swapping..."
            : !isQuoteSucess
            ? "Quote failed, please retry"
            : "Swap"}
        </Button>
      </div>

      <div className="w-full lg:w-1/2 space-y-4 mt-8 lg:mt-0">
        <div className="bg-gray-800 rounded-lg p-4 space-y-6">
          {/* Allocation Type and Templates in a horizontal layout */}
          <div className="grid grid-cols-2 gap-4">
            {/* Allocation Type Section */}
            <div className="space-y-3">
              <label className="text-sm text-gray-400 font-medium">
                Allocation Type
              </label>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="ratio"
                    checked={allocationType === "ratio"}
                    onChange={() => handleAllocationTypeChange("ratio")}
                    className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-sm">Ratio</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="percentage"
                    checked={allocationType === "percentage"}
                    onChange={() => handleAllocationTypeChange("percentage")}
                    className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-sm">Percentage</span>
                </label>
              </div>
            </div>

            {/* Templates Section with compact oval buttons */}
            <div className="space-y-3">
              <label className="text-sm text-gray-400 font-medium">
                Multiswap Presets
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {allocationType === "ratio" ? (
                  <>
                    {["1", "1:1", "1:2", "1:1:2", "1:2:2", "1:1:1:1"].map(
                      (template) => (
                        <button
                          key={template}
                          onClick={() => handleTemplateChange(template)}
                          className={`px-2.5 py-0.5 text-xs rounded-full transition-all duration-200 whitespace-nowrap ${
                            selectedTemplate === template
                              ? "bg-blue-600 text-white ring-2 ring-blue-400 ring-opacity-50"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                          }`}
                        >
                          {template}
                        </button>
                      )
                    )}
                  </>
                ) : (
                  <>
                    {[
                      "100",
                      "50:50",
                      "33:33:33",
                      "25:25:25:25",
                      "40:30:30",
                      "50:25:25",
                    ].map((template) => (
                      <button
                        key={template}
                        onClick={() => handleTemplateChange(template)}
                        className={`px-2.5 py-0.5 text-xs rounded-full transition-all duration-200 whitespace-nowrap ${
                          selectedTemplate === template
                            ? "bg-blue-600 text-white ring-2 ring-blue-400 ring-opacity-50"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
                        }`}
                      >
                        {template}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Custom Allocation Input */}
          <div className="space-y-3">
            <label className="text-sm text-gray-400 font-medium">
              Custom Allocation
            </label>
            <div className="flex space-x-2">
              {allocationValues.map((value, index) => (
                <input
                  key={index}
                  type="number"
                  value={value}
                  onChange={(e) =>
                    handleAllocationValueChange(index, e.target.value)
                  }
                  className="w-full bg-gray-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={
                    allocationType === "ratio" ? "Ratio" : "Percentage"
                  }
                />
              ))}
            </div>
            <div className="text-sm text-gray-400">
              Current Allocation: {getAllocationString()}
            </div>
          </div>

          {/* Share Button */}
          <button
            onClick={handleShareUrl}
            className="w-full flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors duration-200"
          >
            <Copy className="h-4 w-4" />
            <span>Share Allocation</span>
          </button>

          {/* Percentage Bar for Token Allocations */}
          {selectedOutputTokens.length > 0 &&
            selectedOutputTokens[0] !== "" && (
              <div className="mt-4">
                <div className="text-sm text-gray-400">Token Allocations</div>
                <div className="relative w-full h-4 bg-gray-700 rounded">
                  {allocationPercentages.map((percentage, index) => {
                    const leftPosition = allocationPercentages
                      .slice(0, index)
                      .reduce((a, b) => a + b, 0); // Calculate left position for the segment

                    return (
                      <div
                        key={index}
                        className={`absolute h-full ${
                          TOKEN_COLORS[index % TOKEN_COLORS.length]
                        } rounded`}
                        style={{
                          width: `${percentage}%`,
                          left: `${leftPosition}%`,
                        }}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  {allocationValues.map((value, index) => {
                    const tokenSymbol =
                      TOKENS[selectedOutputTokens[index]]?.symbol; // Safely access symbol
                    return (
                      <span key={index}>
                        {`${value} (${allocationPercentages[index].toFixed(
                          2
                        )}%) ${tokenSymbol || "N/A"}`}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
        </div>
      </div>

      <TokenSelectionPopup
        isOpen={isTokenPopupOpen}
        onClose={closeTokenPopup}
        onSelect={handleTokenSelect}
        tokens={
          activeTokenSelection?.type === "output"
            ? (OUTPUT_TOKENS as Record<string, TokenConfig>)
            : (TOKENS as Record<string, TokenConfig>)
        }
        balances={tokenBalances}
        disabledTokens={disabledTokens as string[]}
        tokenPriceData={tokenPriceData}
        selectedOutputTokens={selectedOutputTokens as string[]}
        allowMultiSelect={activeTokenSelection?.type === "output"}
      />
    </div>
  );
}
export default SwapInterfaceContent;
