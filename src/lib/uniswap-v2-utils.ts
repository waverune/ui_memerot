import { ethers } from 'ethers';
import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json';
import { Token, Pair } from '@uniswap/sdk';

export const WETH9: { [chainId: number]: Token } = {
    1: new Token(1, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 18, 'WETH', 'Wrapped Ether'),
};

export function createToken(
    address: string,
    decimals: number,
    symbol: string,
    name: string,
    chainId = 1
): Token {
    return new Token(chainId, address, decimals, symbol, name);
}

export async function fetchUniswapV2Pair(
    token0: Token,
    token1: Token,
    provider: ethers.Provider
): Promise<Pair | null> {
    try {
        const pairAddress = Pair.getAddress(token0, token1);
        const pairContract = new ethers.Contract(pairAddress, IUniswapV2Pair.abi, provider);

        // Check if the pair exists by trying to call a method
        await pairContract.token0();

        const [reserves0, reserves1] = await pairContract.getReserves();
        return new Pair(
            ethers.parseUnits(reserves0.toString(), token0.decimals),
            ethers.parseUnits(reserves1.toString(), token1.decimals)
        );
    } catch (error) {
        return null;
    }
}

export function getExecutionPrice(
    pair: Pair,
    inputToken: Token,
    outputToken: Token,
    inputAmount: string,
    slippageTolerance: number
) {
    const parsedAmount = ethers.parseUnits(inputAmount, inputToken.decimals);
    const trade = pair.getOutputAmount(
        ethers.parseUnits(parsedAmount.toString(), inputToken.decimals)
    );

    const executionPrice = trade[0].toFixed(6);
    const minimumAmountOut = trade[0]
        .multiply((100 - slippageTolerance) / 100)
        .toFixed(6);
    const priceImpact = pair.priceImpact(trade[0]).toFixed(2);

    return {
        executionPrice,
        minimumAmountOut,
        priceImpact,
    };
}
