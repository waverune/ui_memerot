import { CoinPriceData } from "../Modal";

// Validates price data structure and values
export const isValidPriceData = (data: any): data is CoinPriceData => {
    return data 
        && typeof data.price_usd === 'number' 
        && data.price_usd > 0 
        && typeof data.market_cap_usd === 'number'
        && !isNaN(data.price_usd)
        && isFinite(data.price_usd);
};

// Add this helper function at the top level
export const calculatePriceImpact = (
    inputAmount: string,
    outputAmount: string,
    inputTokenPrice: number,
    outputTokenPrice: number
): string => {
    const inputValue = parseFloat(inputAmount) * inputTokenPrice;
    const outputValue = parseFloat(outputAmount) * outputTokenPrice;
    
    if (inputValue === 0 || isNaN(inputValue) || isNaN(outputValue)) {
        return '0.00';
    }

    // Calculate price impact using Uniswap V2 formula
    // Price impact = (expectedOutput - actualOutput) / expectedOutput * 100
    const expectedOutput = inputValue; // In perfect conditions, input value = output value
    const priceImpact = ((expectedOutput - outputValue) / expectedOutput) * 100;
    
    // Return absolute value, rounded to 2 decimal places
    return Math.abs(priceImpact).toFixed(2);
};