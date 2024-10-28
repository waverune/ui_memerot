import React, { useState } from 'react';
import { ethers } from 'ethers';
import { Pair } from '@uniswap/v2-sdk';
import { getExecutionPrice, fetchUniswapV2Pair, createToken, WETH9 } from '../lib/uniswap-v2-utils';

// note: hardcoded RPCprovider  BuildBear(simulated envirnment for eth mainnet): 
// Token checker: renders token symbol, name, and decimals also checks if the address is valid checksummed
// TODOS:
// Uniswap pair checker: check if the pair exists, and get the liquidity
// Uniswap simulation: simulate a trade and get the execution price

const SimulationPage: React.FC = () => {
  const [tokenAddress, setTokenAddress] = useState('');
  const [saveToken, setSaveToken] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{
    symbol: string;
    name: string;
    decimals: number;
  } | null>(null);
  const [pairInfo, setPairInfo] = useState<{
    exists: boolean;
    liquidity?: string;
    token0Symbol?: string;
    token1Symbol?: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checksummedAddress, setChecksummedAddress] = useState<string>('');

  const handleAddressInput = (input: string) => {
    setTokenAddress(input);
    try {
      if (ethers.isAddress(input)) {
        const checksummed = ethers.getAddress(input); // This gets the checksummed address
        setChecksummedAddress(checksummed);
        if (checksummed !== input) {
          console.log('Address was not checksummed. Original:', input, 'Checksummed:', checksummed);
        }
      } else {
        setChecksummedAddress('');
      }
    } catch (err) {
      console.error('Error checksumming address:', err);
      setChecksummedAddress('');
    }
  };

  const checkPair = async () => {
    if (!ethers.isAddress(tokenAddress)) {
      setError('Please enter a valid token address');
      return;
    }

    setIsChecking(true);
    setError(null);
    setPairInfo(null);

    try {
      const provider = new ethers.JsonRpcProvider('https://rpc.buildbear.io/relieved-groot-ee2fe6d9');
      
      // Add logging for token addresses
      // console.log('Input Token (WETH):', inputToken.address);
      // console.log('Output Token:', tokenAddress);
      
      // Create token instances
      const inputToken = WETH9[1]; // WETH
      const outputToken = createToken(tokenAddress, 18, '', '');

      // Log the calculated pair address
      const pairAddress = Pair.getAddress(inputToken, outputToken);
      console.log('Calculated Pair Address:', pairAddress);

      // Fetch the pair
      const pair = await fetchUniswapV2Pair(inputToken, outputToken, provider);
      
      if (!pair) {
        console.log('Pair fetch failed. This could mean:');
        console.log('1. The pair hasn\'t been created on Uniswap V2 yet');
        console.log('2. There might be an issue with token decimals');
        console.log('3. The RPC endpoint might not be responding correctly');
        setPairInfo({ exists: false });
        return;
      }

      // Get pair contract to fetch liquidity
      const pairContract = new ethers.Contract(
        pair.liquidityToken.address,
        ['function getReserves() external view returns (uint112, uint112, uint32)'],
        provider
      );

      const [reserve0, reserve1] = await pairContract.getReserves();
      
      // Get token symbols
      const token0Contract = new ethers.Contract(
        pair.token0.address,
        ['function symbol() view returns (string)'],
        provider
      );
      const token1Contract = new ethers.Contract(
        pair.token1.address,
        ['function symbol() view returns (string)'],
        provider
      );

      const [token0Symbol, token1Symbol] = await Promise.all([
        token0Contract.symbol(),
        token1Contract.symbol()
      ]);

      // Calculate total liquidity in USD (simplified)
      const totalLiquidity = ethers.formatEther(reserve0) + ' ' + token0Symbol + ' / ' +
                            ethers.formatEther(reserve1) + ' ' + token1Symbol;

      setPairInfo({
        exists: true,
        liquidity: totalLiquidity,
        token0Symbol,
        token1Symbol
      });

    } catch (err) {
      console.error('Detailed error:', err);
      setError('Error checking pair. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const fetchTokenInfo = async () => {
    if (!ethers.isAddress(tokenAddress)) {
      setError('Please enter a valid token address');
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider('https://rpc.buildbear.io/relieved-groot-ee2fe6d9');
      const chainId = await provider.getNetwork().then(network => network.chainId);
      console.log('Chain ID:', chainId);

      // Use checksummed address for contract interaction
      const tokenContract = new ethers.Contract(
        checksummedAddress || ethers.getAddress(tokenAddress),
        [
          'function symbol() view returns (string)',
          'function name() view returns (string)',
          'function decimals() view returns (uint8)'
        ],
        provider
      );

      const [symbol, name, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.name(),
        tokenContract.decimals()
      ]);

      // Convert decimals to number if it's a BigInt
      const decimalsNumber = typeof decimals === 'bigint' ? Number(decimals) : decimals;

      setTokenInfo({
        symbol,
        name,
        decimals: decimalsNumber
      });
      
      console.log('Token info set:', { symbol, name, decimals: decimalsNumber });
      setError(null);
    } catch (err) {
      console.error('Detailed error fetching token info:', err);
      setError('Error fetching token information. Please verify the address.');
      setTokenInfo(null);
    }
  };

  return (
    <div className="container mx-auto p-4 text-white bg-[#111827]">
      <h1 className="text-2xl font-bold mb-4 text-white">Uniswap Pair Checker</h1>
      
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
            {isChecking ? 'Checking...' : 'Check Pair'}
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
          <h2 className="text-lg font-semibold mb-2 text-white">Token Information</h2>
          <div className="space-y-1 text-gray-200">
            <p><span className="font-medium text-gray-300">Name:</span> {tokenInfo.name}</p>
            <p><span className="font-medium text-gray-300">Symbol:</span> {tokenInfo.symbol}</p>
            <p><span className="font-medium text-gray-300">Decimals:</span> {tokenInfo.decimals}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-400 mb-4">
          {error}
        </div>
      )}

      {pairInfo && (
        <div className="mt-4 p-4 border rounded bg-gray-800 border-gray-700">
          <h2 className="text-xl font-semibold mb-2 text-white">Pair Information</h2>
          {pairInfo.exists ? (
            <>
              <p className="mb-2 text-gray-200">✅ Pair exists on Uniswap V2</p>
              <p className="mb-2 text-gray-200">
                <span className="font-medium text-gray-300">Tokens:</span> {pairInfo.token0Symbol} / {pairInfo.token1Symbol}
              </p>
              <p className="mb-2 text-gray-200">
                <span className="font-medium text-gray-300">Current Liquidity:</span> {pairInfo.liquidity}
              </p>
            </>
          ) : (
            <p className="text-red-400">❌ Pair does not exist on Uniswap V2</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SimulationPage;
