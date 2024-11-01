// DATATYPES FOR Transactions
// 1. swapEthForMultiTokens when ETH is the input token
// 2. swapTokenForMultiTokens when WETH is the input token
// 3. swapUSDForMultiTokens when any erc20 token other than weth is the input token

export interface swapEthForMultiTokensParam {
    etherValue: bigint;
    sellAmounts: bigint[];
    minAmounts: bigint[];
    path: `0x${string}`[];
    deadline: number;
}
export interface swapTokenForMultiTokensParam {
    sellAmounts: bigint[];
    minAmounts: bigint[];
    path: `0x${string}`[];
    deadline: number;
}
export interface swapUSDForMultiTokensParam {
    sellToken: `0x${string}`;
    sellAmount: bigint;
    sellAmounts: bigint[];
    minAmounts: bigint[];
    path: `0x${string}`[];
    deadline: number;
}

// interface for transaction options
export interface TxOptions {
    gasLimit?: number;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
}