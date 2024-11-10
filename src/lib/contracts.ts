// ERC20 Token Interface
export const ERC20_ABI = [
  // Read-only functions
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function allowance(address owner, address spender) view returns (uint256)',

  // Authenticated functions
  'function transfer(address to, uint amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint amount)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
] as const;

export const MULTICALL_ADDRESSES: Record<number, string> = {
  1: '0xcA11bde05977b3631167028862bE2a173976CA11', // Ethereum Mainnet
  56: '0xcA11bde05977b3631167028862bE2a173976CA11', // BSC
  137: '0xcA11bde05977b3631167028862bE2a173976CA11', // Polygon
  21598:'0x8413176534f9bd6c85f143c30c8b66ae50904457' 
  // Add other networks as needed
};
// Mock Swap Contract Interface
export const SWAP_ABI = [
  'function swapWithPermit(uint256 sellAmount, uint256 minBuyAmount, uint256 deadline, address[] path, uint8 v, bytes32 r, bytes32 s) returns (uint256)',
  'function swapTokenForMultiTokens(uint256[] sellAmounts, uint256[] minAmounts, address[] path, uint256 deadline) returns (uint256[])',
  'function swapEthForMultiTokens(uint256[] sellAmounts, uint256[] minAmounts, address[] path, uint256 deadline) payable returns (uint256[])',
  'function swapTokensForTokens(uint256[] minAmounts, address[] path, uint256 deadline) returns (uint256)',
  'function swapUSDForMultiTokens(address sellToken, uint256 sellAmount, uint256[] sellAmounts, uint256[] minAmounts, address[] path, uint256 deadline) returns (uint256[] receivedAmount)',
] as const;

export const MULTISWAP_QUOTER_ABI = [{ "type": "function", "name": "UNISWAP_V2_FACTORY", "inputs": [], "outputs": [{ "name": "", "type": "address", "internalType": "contract IUniswapV2Factory" }], "stateMutability": "view" }, { "type": "function", "name": "UNISWAP_V2_ROUTER", "inputs": [], "outputs": [{ "name": "", "type": "address", "internalType": "contract IUniswapV2Router" }], "stateMutability": "view" }, { "type": "function", "name": "getReserves", "inputs": [{ "name": "tokenA", "type": "address", "internalType": "address" }, { "name": "tokenB", "type": "address", "internalType": "address" }], "outputs": [{ "name": "reserveA", "type": "uint112", "internalType": "uint112" }, { "name": "reserveB", "type": "uint112", "internalType": "uint112" }], "stateMutability": "view" }, { "type": "function", "name": "quoteExactInputSingle", "inputs": [{ "name": "tokenIn", "type": "address", "internalType": "address" }, { "name": "tokenOut", "type": "address", "internalType": "address" }, { "name": "amountIn", "type": "uint256", "internalType": "uint256" }], "outputs": [{ "name": "amountOut", "type": "uint256", "internalType": "uint256" }], "stateMutability": "view" }, { "type": "function", "name": "quoteTokenForMultiTokens", "inputs": [{ "name": "sellAmounts", "type": "uint256[]", "internalType": "uint256[]" }, { "name": "path", "type": "address[]", "internalType": "address[]" }], "outputs": [{ "name": "expectedAmounts", "type": "uint256[]", "internalType": "uint256[]" }], "stateMutability": "view" }, { "type": "function", "name": "quoteUSDForMultiTokens", "inputs": [{ "name": "usdToken", "type": "address", "internalType": "address" }, { "name": "usdAmount", "type": "uint256", "internalType": "uint256" }, { "name": "sellAmounts", "type": "uint256[]", "internalType": "uint256[]" }, { "name": "path", "type": "address[]", "internalType": "address[]" }], "outputs": [{ "name": "expectedAmounts", "type": "uint256[]", "internalType": "uint256[]" }], "stateMutability": "view" }] as const;
