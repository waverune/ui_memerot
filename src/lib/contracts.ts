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
    'function swapWithPermit(uint256 sellAmount, uint256 minBuyAmount, uint256 deadline, address[] path, uint8 v, bytes32 r, bytes32 s) returns (uint256)',
  'function swapTokenForMultiTokens(uint256[] sellAmounts, uint256[] minAmounts, address[] path, uint256 deadline) returns (uint256[])',
  'function swapEthForMultiTokens(uint256[] sellAmounts, uint256[] minAmounts, address[] path, uint256 deadline) payable returns (uint256[])',
  'function swapTokensForTokens(uint256[] minAmounts, address[] path, uint256 deadline) returns (uint256)',
  ] as const;
  