import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ethers } from "ethers";
import { debounce } from "lodash";
import { ArrowDownUp, ChevronDown, Plus, Copy, X } from "lucide-react";
import { useAccount, useBalance, usePublicClient, useWalletClient } from "wagmi";
import TokenSelectionPopup from "./tokenSelectionPopup";
import { Button } from "../ui/button";
import { useToast } from "../../hooks/useToast";
import { TokenConfig, TOKENS, TokenSymbol } from "../../config/tokens";
import { getTokenBalance, checkAndApproveToken, performSwap } from "../../lib/tx_utils";
import { toast } from "react-toastify";


// Constants and mock data (if they're not already in a separate file)
const MOCK_BALANCES: Record<TokenSymbol, string> = {
    ETH: "0.0",
    SPX6900: "0",
    MOG: "0",
    WETH: "0.0",
    USDC: "0.0",
};

const MOCK_PRICES = {
    ETH: 2600,
    SPX6900: 0.6344,
    MOG: 0.000002062,
    WETH: 2600,
    USDC: 1,
    HPOS: 0.309,
};

type Token = TokenSymbol;
// Add this mock function at the top of the file, outside of any component
const mockUniswapOutput = (inputToken: TokenSymbol, inputAmount: number, outputToken: TokenSymbol): number => {
    const inputPrice = MOCK_PRICES[inputToken as keyof typeof MOCK_PRICES];
    const outputPrice = MOCK_PRICES[outputToken as keyof typeof MOCK_PRICES];
    const inputValue = inputAmount * inputPrice;
    let outputAmount = (inputValue / outputPrice) * 0.997; // 0.3% fee simulation

    if (outputToken === 'USDC') {
        // Round to 6 decimal places for USDC
        outputAmount = Math.round(outputAmount * 1e6) / 1e6;
    }

    return outputAmount;
};
function SwapInterfaceContent() {
    const { showToast } = useToast();
    const navigate = useNavigate();
    const hasInitialized = useRef(false);
    const location = useLocation();
    const [fromAmount, setFromAmount] = useState("");
    const [selectedToken, setSelectedToken] = useState<TokenSymbol>("ETH");
    const [selectedOutputTokens, setSelectedOutputTokens] = useState<TokenSymbol[]>([]);
    const [toAmounts, setToAmounts] = useState<Record<TokenSymbol, string>>({
        SPX6900: "0",
        MOG: "0",
    });
    const [allocationRatio, setAllocationRatio] = useState("1:1");
    const [debouncedAllocationRatio, setDebouncedAllocationRatio] = useState("");
    const [sliderValues, setSliderValues] = useState<Record<TokenSymbol, number>>({
        SPX6900: 50,
        MOG: 50,
    });

    const [isApproving, setIsApproving] = useState(false);
    const [isSwapping, setIsSwapping] = useState(false);
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    const { data: ethBalanceData, refetch: refetchEthBalance } = useBalance({
        address,

    });



    // Simulated token balances (in a real scenario, these would be fetched using ERC20:balanceOf() multicall)
    const [tokenBalances, setTokenBalances] = useState<Record<Token, string>>(MOCK_BALANCES);

    const swapContractAddress = "0x1664A211D6C2414c88671a412065A15388EFEd5d"; // Replace with your actual swap contract address
    // Non-recursive GCD calculation
    const gcd = useCallback((a: number, b: number): number => {
        while (b !== 0) {
            let t = b;
            b = a % b;
            a = t;
        }
        return a;
    }, []);
    // Validate and format allocation ratio
    const formattedAllocationRatio = useMemo(() => {
        const parts = debouncedAllocationRatio.split(':').map(Number);
        if (parts.some(isNaN) || parts.length === 0) {
            return '';
        }

        let result = parts[0];
        for (let i = 1; i < parts.length; i++) {
            result = gcd(result, parts[i]);
        }

        return parts.map(part => part / result).join(':');
    }, [debouncedAllocationRatio, gcd]);

    const getProvider = useCallback(() => {
        if (publicClient) {
            return new ethers.BrowserProvider(publicClient.transport);
        }
        // Fallback to a default provider if wallet is not connected
        return new ethers.JsonRpcProvider(
            "https://rpc.buildbear.io/relieved-groot-ee2fe6d9"
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
                        try {
                            const balance = await getTokenBalance(config.address, address, provider);
                            newBalances[symbol as Token] = ethers.formatUnits(balance, config.decimals);
                        } catch (error) {
                            console.error(`Error fetching balance for ${symbol}:`, error);
                            newBalances[symbol as Token] = '0'; // Set balance to 0 if there's an error
                        }
                    }
                }

                setTokenBalances(prev => ({
                    ...prev,
                    ...Object.fromEntries(
                        Object.entries(newBalances).map(([key, value]) => [key, value ?? '0'])
                    ),
                }));
            } catch (error) {
                console.error("Error fetching token balances:", error);
                toast.error("Failed to fetch some token balances. Please try again or check your network connection.");
            }
        }
    }, [address, getProvider]);


    // Mock market caps (replace with actual data fetching in production)
    const [marketCaps] = useState({
        mog: 742944760,
        spx6900: 606265150,
        dogecoin: 18354750059,
        hpos: 322944760,
        WOJAK: 69307369,
        PEIPEI: 54378058,
    });



    const recalculateSliders = useCallback(() => {
        const activeTokens = selectedOutputTokens.filter(token => token !== "");
        if (activeTokens.length > 0) {
            const newSliderValue = 100 / activeTokens.length;
            const updatedSliderValues = Object.fromEntries(
                activeTokens.map(token => [token, newSliderValue])
            );
            setSliderValues(updatedSliderValues);
        } else {
            setSliderValues({});
        }
    }, [selectedOutputTokens]);

    const handleOutputTokenSelect = (index: number, newToken: TokenSymbol | "") => {
        setSelectedOutputTokens(prev => {
            const updated = [...prev];
            updated[index] = newToken;
            return updated;
        });

        // Recalculate sliders after updating selectedOutputTokens
        setTimeout(recalculateSliders, 0);
    };

    const removeOutputToken = (tokenToRemove: TokenSymbol) => {
        setSelectedOutputTokens(prev => prev.filter(token => token !== tokenToRemove));
        setToAmounts(prev => {
            const { [tokenToRemove]: _, ...rest } = prev;
            return rest;
        });

        // Recalculate sliders after removing the token
        setTimeout(recalculateSliders, 0);
    };



    // Modify the addOutputToken function
    const addOutputToken = () => {
        const availableTokens = Object.keys(TOKENS).filter(token => !disabledTokens.includes(token as TokenSymbol));
        if (availableTokens.length > 0) {
            setSelectedOutputTokens(prev => [...prev, "" as TokenSymbol]);
            setSliderValues(prev => {
                const newValue = 100 / (Object.keys(prev).length + 1);
                const updatedValues = { ...prev };
                Object.keys(updatedValues).forEach(key => {
                    updatedValues[key] = newValue;
                });
                return updatedValues;
            });
        } else {
            showToast("No more tokens available to add", "error");
        }
    };

    const [needsApproval, setNeedsApproval] = useState(false);

    const checkApproval = useCallback(async () => {
        if (isConnected && address && selectedToken !== "ETH" && fromAmount) {
            try {
                const signer = await getSigner();
                const tokenAddress = TOKENS[selectedToken].address;
                const amount = fromAmount;

                const tokenContract = new ethers.Contract(
                    tokenAddress,
                    ["function allowance(address owner, address spender) view returns (uint256)"],
                    signer
                );

                const allowance = await tokenContract.allowance(address, swapContractAddress);
                const requiredAmount = ethers.parseUnits(amount, TOKENS[selectedToken].decimals);

                // Convert allowance and requiredAmount to BigInt
                const allowanceBigInt = BigInt(allowance.toString());
                const requiredAmountBigInt = BigInt(requiredAmount.toString());

                const needsApproval = allowanceBigInt < requiredAmountBigInt;
                setNeedsApproval(needsApproval);
                console.log(`Approval status for ${selectedToken}: ${needsApproval ? 'Needs approval' : 'Approved'}`);
                console.log(`Allowance: ${allowanceBigInt.toString()}, Required: ${requiredAmountBigInt.toString()}`);
            } catch (error) {
                console.error("Error checking approval:", error);
                setNeedsApproval(true);
            }
        } else {
            setNeedsApproval(false);
        }
    }, [isConnected, address, selectedToken, fromAmount, getSigner, swapContractAddress]);


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
                await checkApproval(); // Re-check approval status after successful approval
            } else {
                showToast("Approval failed. Please try again.", "error");
            }
        } catch (error) {
            console.error("Approval failed:", error);
            showToast("Approval failed. Please try again.", "error");
        } finally {
            setIsApproving(false);
            checkApproval(); // Re-check approval status after the process
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

        setIsSwapping(true);
        try {
            const signer = await getSigner();
            if (!signer) {
                throw new Error("Signer not available");
            }

            if (!fromAmount || isNaN(parseFloat(fromAmount))) {
                throw new Error("Invalid input amount");
            }

            // Check for approval if the input token is not ETH
            if (selectedToken !== "ETH") {
                const isApproved = await checkAndApproveToken(
                    TOKENS[selectedToken].address,
                    swapContractAddress,
                    fromAmount,
                    TOKENS[selectedToken].decimals,
                    signer
                );
                if (!isApproved) {
                    throw new Error("Token approval failed or was rejected");
                }
            }

            const inputAmount = ethers.parseUnits(fromAmount, TOKENS[selectedToken].decimals);
            const activeOutputTokens = selectedOutputTokens.filter(token => token !== "");

            // Prepare path
            const path = [TOKENS[selectedToken].address, TOKENS["WETH"].address, ...activeOutputTokens.map(token => TOKENS[token].address)];
            // Calculate total USD value of input
            const inputUsdValue = parseFloat(fromAmount) * (MOCK_PRICES[selectedToken as keyof typeof MOCK_PRICES] || 0);

            // Prepare sellAmounts
            let sellAmounts: bigint[];
            if (selectedToken === "ETH" || selectedToken === "WETH") {
                sellAmounts = [inputAmount];
            } else {
                // For other tokens, we need to calculate the equivalent WETH amount
                const wethEquivalent = ethers.parseUnits((inputUsdValue / MOCK_PRICES.WETH).toFixed(18), 18);
                sellAmounts = [wethEquivalent];
            }

            let totalWethOutput = BigInt(0);
            for (let i = 0; i < activeOutputTokens.length; i++) {
                const token = activeOutputTokens[i];
                const tokenUsdValue = inputUsdValue * (sliderValues[token] / 100);
                const wethAmount = tokenUsdValue / MOCK_PRICES.WETH;

                if (isNaN(wethAmount) || !isFinite(wethAmount)) {
                    throw new Error(`Invalid WETH amount calculated for ${token}`);
                }

                const tokenWethAmount = ethers.parseUnits(wethAmount.toFixed(18), 18);
                sellAmounts.push(tokenWethAmount);
                totalWethOutput += tokenWethAmount;
            }

            // Ensure the first element of sellAmounts is the sum of the rest for non-ETH/WETH inputs
            if (selectedToken !== "ETH" && selectedToken !== "WETH") {
                sellAmounts[0] = totalWethOutput;
            }

            // Prepare minAmounts (you might want to adjust this based on your requirements)
            const minAmounts = activeOutputTokens.map(() => ethers.parseUnits("1", "wei")); // Set minimum amount to 1 wei

            const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

            console.log("Swap parameters:", {
                inputToken: selectedToken,
                inputAmount: inputAmount.toString(),
                sellAmounts: sellAmounts.map(a => a.toString()),
                minAmounts: minAmounts.map(a => a.toString()),
                path,
                deadline
            });

            const swapTx = await performSwap(
                swapContractAddress,
                selectedToken as string,
                inputAmount,
                sellAmounts,
                minAmounts,
                path,
                deadline,
                signer
            );

            await swapTx.wait();
            showToast("Swap completed successfully!", "success");

            // Refresh balances after successful swap
            fetchBalances();
            refetchEthBalance();
        } catch (error) {
            console.error("Swap failed:", error);
            showToast(`Swap failed: ${(error as Error).message}`, "error");
        } finally {
            setIsSwapping(false);
        }
    };

    // Update the USD value calculation
    const getUsdValue = (amount: string, token: Token) => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount)) return "0.00";

        const price = MOCK_PRICES[token as keyof typeof MOCK_PRICES] || 0;
        return (numAmount * price).toFixed(2);
    };

    const [isTokenPopupOpen, setIsTokenPopupOpen] = useState(false);
    const [activeTokenSelection, setActiveTokenSelection] = useState<'from' | number | null>(null);

    const openTokenPopup = (type: 'from' | number) => {
        setActiveTokenSelection(type);
        setIsTokenPopupOpen(true);
    };

    const closeTokenPopup = () => {
        setIsTokenPopupOpen(false);
        setActiveTokenSelection(null);
    };

    const [disabledTokens, setDisabledTokens] = useState<TokenSymbol[]>([]);

    const updateDisabledTokens = useCallback(() => {
        const disabled = [selectedToken, ...selectedOutputTokens].filter(token => token !== "");
        setDisabledTokens(disabled);
    }, [selectedToken, selectedOutputTokens]);


    const handleTokenSelect = (token: TokenSymbol) => {
        if (activeTokenSelection === 'from') {
            setSelectedToken(token);
        } else if (typeof activeTokenSelection === 'number') {
            handleOutputTokenSelect(activeTokenSelection, token);
        }
        closeTokenPopup();
        updateDisabledTokens();
    };

    // Add this function to calculate the Doge ratio
    const calculateDogeRatio = useCallback((token: TokenSymbol) => {
        const tokenMarketCap = token === 'SPX6900' ? marketCaps.spx6900 :
            token === 'MOG' ? marketCaps.mog :
                token === 'HPOS' ? marketCaps.hpos :
                    token === 'WOJAK' ? marketCaps.WOJAK :
                        token === 'PEIPEI' ? marketCaps.PEIPEI : 0;
        const ratio = marketCaps.dogecoin / tokenMarketCap;
        return isNaN(ratio) || !isFinite(ratio) ? "N/A" : ratio.toFixed(2);
    }, [marketCaps]);

    const [simulatedOutput, setSimulatedOutput] = useState<Record<TokenSymbol, string>>({});

    // Simplify dependency management
    const simulateAndLogSwap = useCallback(() => {
        console.log("Simulating swap");
        if (!fromAmount || isNaN(parseFloat(fromAmount)) || selectedOutputTokens.length === 0) {
            console.log("Invalid input or no output tokens selected");
            setToAmounts({});
            return;
        }

        const inputAmount = parseFloat(fromAmount);
        const inputTokenPrice = MOCK_PRICES[selectedToken as keyof typeof MOCK_PRICES];
        const inputValueInWETH = selectedToken === 'WETH' ? inputAmount : (inputAmount * inputTokenPrice) / MOCK_PRICES.WETH;

        console.log(`Input: ${inputAmount} ${selectedToken} (${inputValueInWETH.toFixed(6)} WETH)`);

        const activeOutputTokens = selectedOutputTokens.filter(token => token !== "") as TokenSymbol[];
        const outputResults: Record<TokenSymbol, string> = {};

        activeOutputTokens.forEach((token) => {
            let simulatedInput: number;
            if (activeOutputTokens.length === 1) {
                simulatedInput = inputValueInWETH;
            } else {
                const sliderValue = sliderValues[token] || 100 / activeOutputTokens.length;
                simulatedInput = inputValueInWETH * (sliderValue / 100);
            }

            const outputAmount = mockUniswapOutput('WETH', simulatedInput, token);

            if (token === 'USDC') {
                outputResults[token] = outputAmount.toFixed(6);
            } else {
                outputResults[token] = outputAmount.toFixed(9);
            }
        });

        console.log("Simulated Uniswap output:", outputResults);
        setToAmounts(outputResults);
        setSimulatedOutput(outputResults);
    }, [fromAmount, selectedToken, selectedOutputTokens, sliderValues]);

    useEffect(() => {
        const updateEffects = async () => {
            // Effect 1: Fetch balances and update token balances
            if (isConnected && address) {
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

            // Effect 3: Recalculate sliders
            recalculateSliders();

            // Effect 4: Simulate swap
            if (fromAmount && selectedToken && selectedOutputTokens.length > 0) {
                simulateAndLogSwap();
            }

            // Effect 5: Check approval status
            if (isConnected && address && selectedToken !== "ETH" && fromAmount) {
                await checkApproval();
            }

            // Effect 6: Update URL
            const searchParams = new URLSearchParams();
            if (fromAmount) searchParams.set('amount', fromAmount);
            if (selectedToken) searchParams.set('from', selectedToken as string);
            if (selectedOutputTokens.length > 0) searchParams.set('to', selectedOutputTokens.join('-'));
            if (formattedAllocationRatio) searchParams.set('ratio', formattedAllocationRatio.replace(/:/g, '-'));
            navigate(`?${searchParams.toString()}`, { replace: true });

            // Effect 7: Parse URL parameters (only on mount)
            if (!hasInitialized.current) {
                const params = new URLSearchParams(location.search);
                const amount = params.get('amount');
                const from = params.get('from');
                const to = params.get('to');
                const ratio = params.get('ratio');

                if (amount) setFromAmount(amount);
                if (from) setSelectedToken(from as TokenSymbol);
                if (to) setSelectedOutputTokens(to.split('-') as TokenSymbol[]);
                if (ratio) {
                    const formattedRatio = ratio.replace(/-/g, ':');
                    setAllocationRatio(formattedRatio);
                    setDebouncedAllocationRatio(formattedRatio);
                }
                hasInitialized.current = true;
            }
        };

        updateEffects();
    }, [
        isConnected, address, ethBalanceData, fromAmount, selectedToken,
        selectedOutputTokens, formattedAllocationRatio, location.search
    ]);


    // Increase debounce time to 700ms )
    const debouncedSetAllocationRatio = useCallback(
        debounce((value: string) => {
            setDebouncedAllocationRatio(value);
        }, 700),
        []
    );

    // Handle allocation ratio input change
    const handleAllocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setAllocationRatio(newValue); // Update the input value immediately
        debouncedSetAllocationRatio(newValue); // Debounce the actual state update
    };


    // Add this function to handle sharing the URL
    const handleShareUrl = () => {
        const currentUrl = window.location.href;
        navigator.clipboard.writeText(currentUrl).then(() => {
            showToast("URL copied to clipboard!", "success");
        }).catch((err) => {
            console.error('Failed to copy URL: ', err);
            showToast("Failed to copy URL. Please try again.", "error");
        });
    };


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
                                    onChange={(e) => setFromAmount(e.target.value)}
                                    placeholder="0"
                                    className="bg-transparent border-none text-left w-full placeholder-gray-500 focus:outline-none focus:ring-0"
                                />
                                <span className="text-xs text-gray-400">
                                    ${getUsdValue(fromAmount || "0", selectedToken)}
                                </span>
                            </div>
                            <div className="flex flex-col items-end">
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
                                <span className="text-xs text-gray-400 mt-1">
                                    Balance: {parseFloat(tokenBalances[selectedToken]).toFixed(4)} {selectedToken}
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
                        {selectedOutputTokens.map((token, index) => (
                            <div key={index} className="bg-gray-700 rounded-lg p-3 flex items-center">
                                <div className="flex-grow">
                                    <input
                                        type="number"
                                        value={token ? (toAmounts[token] || "0") : "0"}
                                        readOnly
                                        className="bg-transparent border-none text-left w-full focus:outline-none focus:ring-0"
                                    />
                                    <span className="text-xs text-gray-400">
                                        ${token ? getUsdValue(toAmounts[token] || "0", token) : "0.00"}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end">
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
                                    {token && (
                                        <>
                                            <div className="text-xs text-gray-400 mt-1">
                                                Doge ratio: {calculateDogeRatio(token)}x
                                            </div>
                                            <span className="text-xs text-gray-400 mt-1">
                                                Balance: {parseFloat(tokenBalances[token]).toFixed(2)}
                                            </span>
                                        </>
                                    )}
                                </div>
                                {selectedOutputTokens.length > 1 && (
                                    <button
                                        onClick={() => removeOutputToken(token)}
                                        className="ml-2 text-gray-400 hover:text-white p-1"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {selectedOutputTokens.length < 4 && (
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

                {selectedToken !== "ETH" && needsApproval ? (
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={handleApprove}
                        disabled={!isConnected || isApproving}
                    >
                        {isApproving ? "Approving..." : `Approve ${selectedToken}`}
                    </Button>
                ) : (
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        onClick={async () => {
                            await checkApproval(); // Re-check approval before swap
                            if (!needsApproval) {
                                handleSwap();
                            }
                        }}
                        disabled={!isConnected || isSwapping}
                    >
                        {!isConnected ? "Connect Wallet" : isSwapping ? "Swapping..." : "Swap"}
                    </Button>
                )}
            </div>

            <div className="w-full lg:w-1/2 space-y-4 mt-8 lg:mt-0">
                {/* Allocation ratio input */}
                <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                    <label className="text-sm text-gray-400">Allocation Ratio</label>
                    <input
                        type="text"
                        value={allocationRatio}
                        onChange={handleAllocationChange}
                        placeholder="e.g., 1:1 or 60:40"
                        className="w-full bg-gray-700 rounded-lg p-2 text-white"
                    />
                    {/* Add the Share URL button just above the Swap button */}
                    <Button
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                        onClick={handleShareUrl}
                    >
                        <Copy className="h-4 w-4 mr-2" />
                        Share Allocation
                    </Button>
                </div>

                {/* Output tokens with view-only sliders */}
                <div className="bg-gray-800 rounded-lg p-4 space-y-4">
                    {Object.entries(sliderValues).map(([token, value], index) => (
                        <div key={token} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">
                                    {selectedOutputTokens[index] || `Token ${index + 1}`}
                                </span>
                                <span className="text-sm text-gray-400">{value.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-700 h-2 rounded-full">
                                <div
                                    className="bg-blue-500 h-full rounded-full"
                                    style={{ width: `${value}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Simulated Output */}
                {Object.entries(simulatedOutput).length > 0 && (
                    <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-sm font-semibold mb-2">Simulated Output:</h3>
                        <div className="text-xs text-gray-400 mb-2">
                            Input: {fromAmount} {selectedToken} ({(parseFloat(fromAmount) * MOCK_PRICES[selectedToken as keyof typeof MOCK_PRICES] / MOCK_PRICES.WETH).toFixed(6)} WETH)
                        </div>
                        {Object.entries(simulatedOutput).map(([token, amount]) => (
                            <div key={token} className="flex justify-between text-sm">
                                <span>{token}:</span>
                                <span>{token === 'USDC' ? parseFloat(amount).toFixed(6) : parseFloat(amount).toFixed(9)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <TokenSelectionPopup
                isOpen={isTokenPopupOpen}
                onClose={closeTokenPopup}
                onSelect={handleTokenSelect}
                tokens={TOKENS as  Record<string, TokenConfig>}
                balances={tokenBalances}
                disabledTokens={disabledTokens as string[]}
            />
        </div>
    );
}
export default SwapInterfaceContent;  