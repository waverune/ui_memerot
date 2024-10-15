// ERC20 Token Interface
export const ERC20_ABI = [
    // Read-only functions
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function name() view returns (string)',
    
    // Authenticated functions
    'function transfer(address to, uint amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    
    // Events
    'event Transfer(address indexed from, address indexed to, uint amount)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)'
  ] as const;
  
  // Mock Swap Contract Interface
  export const SWAP_ABI = [
    // Read-only functions
    'function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) view returns (uint256)',
    
    // Authenticated functions
    'function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, address to) payable returns (uint256)',
    
    // Events
    'event Swap(address indexed sender, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)'
  ] as const;
  