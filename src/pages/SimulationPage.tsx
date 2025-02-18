import React, { useState } from "react";
import { ethers } from "ethers";
import { Pair } from "@uniswap/v2-sdk";
import {
  getExecutionPrice,
  fetchUniswapV2Pair,
  createToken,
  WETH9,
} from "../lib/uniswap-v2-utils";
import { quoteTokenForMultiTokens } from "../lib/quoter_utils";
import { TOKENS } from "../config/tokens";

// note: hardcoded RPCprovider  BuildBear(simulated envirnment for eth mainnet):
// Token checker: renders token symbol, name, and decimals also checks if the address is valid checksummed
// Uniswap pair checker: check if the pair exists, and fetch pool address & liquidity
// TODOS:
// Uniswap simulation: simulate a trade and get the execution price (ideally prepr params for our transactin and simulate all swaps)
// 1.
// 2.
// 3.
// Utils:save token functionality >> if tokens metadta doesnt exist in tokens.ts, save it.
const provider = new ethers.JsonRpcProvider(
  "https://rpc.buildbear.io/low-aurora-b355ef67"
);

const SimulationPage: React.FC = () => {
  const [tokenAddress, setTokenAddress] = useState("");
  const [saveToken, setSaveToken] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{
    symbol: string;
    name: string;
    decimals: number;
  } | null>(null);
  const [pairInfo, setPairInfo] = useState<{
    exists: boolean;
    pairAddress?: string;
    liquidity?: string;
    token0Symbol?: string;
    token1Symbol?: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checksummedAddress, setChecksummedAddress] = useState<string>("");

  // New state for multi-token quote
  const [paths, setPaths] = useState<string[]>([""]);
  const [amounts, setAmounts] = useState<string[]>([""]);
  const [quoteResult, setQuoteResult] = useState<string[]>([]);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Add new state for token symbols
  const [tokenSymbols, setTokenSymbols] = useState<string[]>([]);

  const handleAddressInput = (input: string) => {
    setTokenAddress(input);
    try {
      if (ethers.isAddress(input)) {
        const checksummed = ethers.getAddress(input); // This gets the checksummed address
        setChecksummedAddress(checksummed);
        if (checksummed !== input) {
          console.log(
            "Address was not checksummed. Original:",
            input,
            "Checksummed:",
            checksummed
          );
        }
      } else {
        setChecksummedAddress("");
      }
    } catch (err) {
      console.error("Error checksumming address:", err);
      setChecksummedAddress("");
    }
  };

  const checkPair = async () => {
    if (!ethers.isAddress(tokenAddress)) {
      setError("Please enter a valid token address");
      return;
    }

    setIsChecking(true);
    setError(null);
    setPairInfo(null);

    try {
      // Create token instances
      const inputToken = WETH9[1]; // WETH
      const outputToken = createToken(tokenAddress, 18, "", "");

      // Calculate pair address
      const pairAddress = Pair.getAddress(inputToken, outputToken);
      console.log("Calculated Pair Address:", pairAddress);

      // Fetch the pair
      const pair = await fetchUniswapV2Pair(inputToken, outputToken, provider);

      if (!pair) {
        setPairInfo({
          exists: false,
          pairAddress, // Include pair address even if pair doesn't exist
        });
        return;
      }

      // Get pair contract to fetch liquidity
      const pairContract = new ethers.Contract(
        pair.liquidityToken.address,
        [
          "function getReserves() external view returns (uint112, uint112, uint32)",
        ],
        provider
      );

      const [reserve0, reserve1] = await pairContract.getReserves();

      // Get token symbols
      const token0Contract = new ethers.Contract(
        pair.token0.address,
        ["function symbol() view returns (string)"],
        provider
      );
      const token1Contract = new ethers.Contract(
        pair.token1.address,
        ["function symbol() view returns (string)"],
        provider
      );

      const [token0Symbol, token1Symbol] = await Promise.all([
        token0Contract.symbol(),
        token1Contract.symbol(),
      ]);

      // Calculate total liquidity in USD (simplified)
      const totalLiquidity =
        ethers.formatEther(reserve0) +
        " " +
        token0Symbol +
        " / " +
        ethers.formatEther(reserve1) +
        " " +
        token1Symbol;

      setPairInfo({
        exists: true,
        pairAddress,
        liquidity: totalLiquidity,
        token0Symbol,
        token1Symbol,
      });
    } catch (err) {
      console.error("Detailed error:", err);
      setError("Error checking pair. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const fetchTokenInfo = async () => {
    if (!ethers.isAddress(tokenAddress)) {
      setError("Please enter a valid token address");
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(
        "https://rpc.buildbear.io/low-aurora-b355ef67"
      );
      const chainId = await provider
        .getNetwork()
        .then((network) => network.chainId);
      console.log("Chain ID:", chainId);

      // Use checksummed address for contract interaction
      const tokenContract = new ethers.Contract(
        checksummedAddress || ethers.getAddress(tokenAddress),
        [
          "function symbol() view returns (string)",
          "function name() view returns (string)",
          "function decimals() view returns (uint8)",
        ],
        provider
      );

      const [symbol, name, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.name(),
        tokenContract.decimals(),
      ]);

      // Convert decimals to number if it's a BigInt
      const decimalsNumber =
        typeof decimals === "bigint" ? Number(decimals) : decimals;

      setTokenInfo({
        symbol,
        name,
        decimals: decimalsNumber,
      });

      console.log("Token info set:", {
        symbol,
        name,
        decimals: decimalsNumber,
      });
      setError(null);
    } catch (err) {
      console.error("Detailed error fetching token info:", err);
      setError("Error fetching token information. Please verify the address.");
      setTokenInfo(null);
    }
  };

  // Handle adding new input fields
  const addPathInput = () => {
    setPaths([...paths, ""]);
  };

  const addAmountInput = () => {
    setAmounts([...amounts, ""]);
  };

  // Handle updating path inputs
  const handlePathChange = (index: number, value: string) => {
    const newPaths = [...paths];
    newPaths[index] = value;
    setPaths(newPaths);
  };

  // Handle updating amount inputs
  const handleAmountChange = (index: number, value: string) => {
    const newAmounts = [...amounts];
    newAmounts[index] = value;
    setAmounts(newAmounts);
  };

  // Remove input field
  const removePathInput = (index: number) => {
    const newPaths = paths.filter((_, i) => i !== index);
    setPaths(newPaths);
  };

  const removeAmountInput = (index: number) => {
    const newAmounts = amounts.filter((_, i) => i !== index);
    setAmounts(newAmounts);
  };

  // Execute quote
  const executeMultiTokenQuote = async () => {
    try {
      setQuoteError(null);

      // Validate inputs
      const validPaths = paths.filter((p) => p && ethers.isAddress(p));
      if (validPaths.length < 2) {
        throw new Error("Need at least 2 valid addresses in path");
      }

      // Fetch decimals and symbols for each token in the path
      const tokenInfo = await Promise.all(
        validPaths.map(async (address) => {
          // Check if token exists in tokens.ts
          const knownToken = TOKENS[address.toLowerCase()];
          if (knownToken) {
            return {
              decimals: knownToken.decimals,
              symbol: knownToken.symbol,
            };
          }

          // If not in tokens.ts, fetch from contract
          const tokenContract = new ethers.Contract(
            address,
            [
              "function decimals() view returns (uint8)",
              "function symbol() view returns (string)",
            ],
            provider
          );
          const [decimals, symbol] = await Promise.all([
            tokenContract.decimals(),
            tokenContract.symbol(),
          ]);
          return { decimals, symbol };
        })
      );

      const tokenDecimals = tokenInfo.map((info) => info.decimals);
      const symbols = tokenInfo.map((info) => info.symbol);
      setTokenSymbols(symbols);

      // Convert amounts using proper decimals for each token
      const bigIntAmounts = amounts
        .filter((a) => a)
        .map((amount, index) => {
          try {
            return ethers.parseUnits(amount, tokenDecimals[index]);
          } catch (e) {
            throw new Error(`Invalid amount: ${amount}`);
          }
        });

      if (bigIntAmounts.length !== validPaths.length - 1) {
        throw new Error(
          "Number of amounts must be equal to number of paths minus 1"
        );
      }

      // Execute quote
      const result = await quoteTokenForMultiTokens(
        bigIntAmounts,
        validPaths as `0x${string}`[]
      );

      // Format results using proper decimals of the output token
      const formattedResults = result.map((r, index) =>
        ethers.formatUnits(r.toString(), tokenDecimals[index + 1])
      );

      setQuoteResult(formattedResults);
    } catch (err) {
      console.error("Quote error:", err);
      setQuoteError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="container mx-auto p-4 text-white bg-[#111827]">
      <h1 className="text-2xl font-bold mb-4 text-white">
        Uniswap Pair Checker
      </h1>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Token Address
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => handleAddressInput(e.target.value)}
            placeholder="Enter token address"
            className="flex-1 p-2 border rounded bg-gray-800 text-white border-gray-600 focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={fetchTokenInfo}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Check Token
          </button>
          <button
            onClick={checkPair}
            disabled={isChecking}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isChecking ? "Checking..." : "Check Pair"}
          </button>
        </div>

        {checksummedAddress && checksummedAddress !== tokenAddress && (
          <div className="mt-2 text-sm text-yellow-400">
            Checksummed address: {checksummedAddress}
          </div>
        )}

        <div className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="saveToken"
            checked={saveToken}
            onChange={(e) => setSaveToken(e.target.checked)}
            className="rounded bg-gray-800 border-gray-600"
          />
          <label htmlFor="saveToken" className="text-sm text-gray-200">
            Save Token
          </label>
        </div>
      </div>

      {tokenInfo && (
        <div className="mt-4 p-4 border rounded bg-gray-800 border-gray-700">
          <h2 className="text-lg font-semibold mb-2 text-white">
            Token Information
          </h2>
          <div className="space-y-1 text-gray-200">
            <p>
              <span className="font-medium text-gray-300">Name:</span>{" "}
              {tokenInfo.name}
            </p>
            <p>
              <span className="font-medium text-gray-300">Symbol:</span>{" "}
              {tokenInfo.symbol}
            </p>
            <p>
              <span className="font-medium text-gray-300">Decimals:</span>{" "}
              {tokenInfo.decimals}
            </p>
          </div>
        </div>
      )}

      {error && <div className="text-red-400 mb-4">{error}</div>}

      {pairInfo && (
        <div className="mt-4 p-4 border rounded bg-gray-800 border-gray-700">
          <h2 className="text-xl font-semibold mb-2 text-white">
            Pair Information
          </h2>
          <p className="mb-2 text-gray-200">
            <span className="font-medium text-gray-300">Pair Address:</span>{" "}
            {pairInfo.pairAddress}
          </p>
          {pairInfo.exists ? (
            <>
              <p className="mb-2 text-gray-200">✅ Pair exists on Uniswap V2</p>
              <p className="mb-2 text-gray-200">
                <span className="font-medium text-gray-300">Tokens:</span>{" "}
                {pairInfo.token0Symbol} / {pairInfo.token1Symbol}
              </p>
              <p className="mb-2 text-gray-200">
                <span className="font-medium text-gray-300">
                  Current Liquidity:
                </span>{" "}
                {pairInfo.liquidity}
              </p>
            </>
          ) : (
            <p className="text-red-400">❌ Pair does not exist on Uniswap V2</p>
          )}
        </div>
      )}

      {/* Multi-token Quote Section */}
      <div className="mt-8 p-4 border rounded bg-gray-800 border-gray-700">
        <h2 className="text-xl font-semibold mb-4">Multi-Token Quote</h2>

        {/* Path Inputs */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Token Path</label>
          {paths.map((path, index) => (
            <div key={`path-${index}`} className="flex gap-2 mb-2">
              <input
                type="text"
                value={path}
                onChange={(e) => handlePathChange(index, e.target.value)}
                placeholder="Token Address"
                className="flex-1 p-2 border rounded bg-gray-800 text-white border-gray-600"
              />
              {index > 0 && (
                <button
                  onClick={() => removePathInput(index)}
                  className="px-2 py-1 bg-red-500 rounded hover:bg-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addPathInput}
            className="mt-2 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
          >
            Add Path
          </button>
        </div>

        {/* Amount Inputs */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Sell Amounts</label>
          {amounts.map((amount, index) => (
            <div key={`amount-${index}`} className="flex gap-2 mb-2">
              <input
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(index, e.target.value)}
                placeholder="Amount in ETH"
                className="flex-1 p-2 border rounded bg-gray-800 text-white border-gray-600"
              />
              {index > 0 && (
                <button
                  onClick={() => removeAmountInput(index)}
                  className="px-2 py-1 bg-red-500 rounded hover:bg-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addAmountInput}
            className="mt-2 px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
          >
            Add Amount
          </button>
        </div>

        {/* Execute Quote Button */}
        <button
          onClick={executeMultiTokenQuote}
          className="w-full py-2 bg-green-600 rounded hover:bg-green-700"
        >
          Get Quote
        </button>

        {/* Quote Results */}
        {quoteResult.length > 0 && (
          <div className="mt-4 p-4 border rounded bg-gray-700">
            <h3 className="text-lg font-medium mb-2">Quote Results</h3>
            {quoteResult.map((result, index) => (
              <div key={`result-${index}`} className="mb-1">
                Output {index + 1}: {result}{" "}
                {tokenSymbols[index + 1] || "Unknown"}
              </div>
            ))}
          </div>
        )}

        {/* Error Display */}
        {quoteError && (
          <div className="mt-4 p-2 text-red-400 border border-red-400 rounded">
            {quoteError}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulationPage;
