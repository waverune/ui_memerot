import { TOKENS } from "../config/tokens";

// Represents the mock balance data structure for testing and development
// Maps each token symbol to its balance as a string
export const MOCK_BALANCES: Record<TokenSymbol, string> = {
    ETH: "0.0",
    SPX6900: "0",
    MOG: "0",
    WETH: "0.0",
    USDC: "0.0",
};

// Defines the structure of a token's configuration
// Used to store essential token information like address, decimals, and metadata
export interface TokenConfig {
    name?: string;          // Optional token name
    address: string;        // Token's contract address
    decimals: number;       // Number of decimal places the token uses
    symbol: string;         // Token's symbol (e.g., "ETH", "USDC")
    logo: string;          // URL or path to token's logo image
    coingeckoId?: string;  // Optional CoinGecko API identifier for price data
}

// Represents the current token selection state in the UI
// Used to track whether user is selecting an input or output token
export type TokenSelectionType = {
    type: 'from' | 'output';  // Whether selecting input ('from') or output token
    index?: number;           // Index of the output token slot being selected
} | null;

// Defines the structure of price and market data for a token
// Used for displaying token prices and market caps
export type CoinPriceData = {
    coin_id: string;         // Unique identifier for the token
    price_usd: number;       // Current price in USD
    market_cap_usd: number;  // Market capitalization in USD
    image: string;           // Token logo URL
};

export type TokenSymbol = keyof typeof TOKENS;
// Type alias for TokenSymbol
// Used throughout the application for type safety when referring to token symbols
export type Token = TokenSymbol;

export type TokenBalances = Partial<Record<TokenSymbol, string>>;

// Default values for token price data
// Used as fallback when price data is unavailable
export const DEFAULT_PRICE_DATA: CoinPriceData = {
    coin_id: '',
    price_usd: 0,
    market_cap_usd: 0,
    image: '/default-token-icon.png'
};

// Array of CSS gradient classes for token allocation visualization
// Used to style the allocation bars with different colors
export const TOKEN_COLORS = [
    'bg-gradient-to-r from-indigo-200 via-purple-700 to-indigo-600',
    'bg-gradient-to-r from-teal-200 via-cyan-700 to-teal-600',
    'bg-gradient-to-r from-orange-200 via-yellow-700 to-orange-600',
    'bg-gradient-to-r from-lime-200 via-green-700 to-lime-600',
];

// Represents the simulated output data for a token swap
// Used to display estimated swap results and loading states
export type SimulatedOutput = {
    amount: string;       // Estimated output amount
    usdValue: string;     // USD value of the output amount
    priceImpact?: string; // Estimated price impact percentage
    loading?: boolean;    // Whether the simulation is in progress
    error?: string;       // Error message if simulation fails
};

// Props interface for the TokenSelectionPopup component
// Defines the required properties for the token selection modal
export interface TokenSelectionPopupProps {
    isOpen: boolean;                                    // Controls modal visibility
    onClose: () => void;                               // Handler for closing the modal
    onSelect: (symbol: string[]) => void;                // Handler for token selection
    tokens: Record<string, TokenConfig>;               // Available tokens configuration
    balances: TokenBalances;                  // User's token balances
    disabledTokens: string[];                         // Tokens that cannot be selected
    tokenPriceData: Record<string, CoinPriceData>;    // Price data for all tokens
    maxSelections?: number;                          // Maximum number of tokens that can be selected
    selectedOutputTokens?: string[];                  // Currently selected output tokens
    allowMultiSelect?: boolean;                      // Whether multiple tokens can be selected
}

export interface AuthState {
    isAuthSidebarOpen: boolean;
    authMode: 'signin' | 'signup';
}