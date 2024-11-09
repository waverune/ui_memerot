import { CoinPriceData, Token } from "../Modal";
import { TOKENS, TokenSymbol } from "../../config/tokens"; // Fixed import path
import { toast } from "react-toastify";

// Calculates USD value for a given token amount
export const getUsdValue = (amount: string, token: Token, tokenPriceData: Record<string, CoinPriceData>) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return "$0.00";

    const coinId = TOKENS[token]?.coingeckoId;
    if (!coinId) return "$0.00";
    const price = tokenPriceData[coinId]?.price_usd || 0;
    const usdValue = numAmount * price;
    // Simple threshold check
    if (usdValue > 0 && usdValue < 0.01) {
        return "< $0.01";
    }

    return `$${usdValue.toFixed(2)}`;
};

// Calculates market cap ratio between a token and Dogecoin
export const calculateDogeRatio = (
    token: TokenSymbol, 
    tokenPriceData: Record<string, CoinPriceData>,
    dogeMarketCap: number
) => {
    const tokenId = TOKENS[token]?.coingeckoId || '';
    const tokenMarketCap = tokenId ? (tokenPriceData[tokenId]?.market_cap_usd || 0) : 0;
    
    if (tokenMarketCap === 0 || dogeMarketCap === 0) return '0.00';
    
    const ratio = dogeMarketCap / tokenMarketCap;
    
    if (ratio > 0 && ratio < 0.01) {
        return '< 0.01';
    }
    
    return ratio.toFixed(2);
};



// Validates token selection and returns updated token list
export const validateAndUpdateTokenSelection = (
    newToken: TokenSymbol | "",
    selectedToken: TokenSymbol,
    selectedOutputTokens: TokenSymbol[]
): { isValid: boolean; updatedTokens?: TokenSymbol[] } => {
    if (!newToken || newToken === selectedToken) {
        return { isValid: false };
    }

    if (selectedOutputTokens.includes(newToken)) {
        toast.error("Token already selected");
        return { isValid: false };
    }

    return {
        isValid: true,
        updatedTokens: [...selectedOutputTokens, newToken]
    };
};

// Gets token path for swap operations
export const getTokenPath = (
    selectedToken: TokenSymbol,
    activeOutputTokens: TokenSymbol[]
): string[] => {
    if (selectedToken === "ETH") {
        return [
            TOKENS["WETH"].address,
            ...activeOutputTokens.map(token => TOKENS[token].address)
        ];
    }
    return [TOKENS[selectedToken].address, ...activeOutputTokens.map(token => TOKENS[token].address)];
}; 