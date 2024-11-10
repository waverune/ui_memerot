// DATATYPES FOR Transactions
// 1. swapEthForMultiTokens when ETH is the input token
// 2. swapTokenForMultiTokens when WETH is the input token
// 3. swapUSDForMultiTokens when any erc20 token other than weth is the input token


// Base transaction interface that all types share
export type BaseTransactionParam = {
    sellAmounts: bigint[];
    minAmounts: bigint[];
    path: `0x${string}`[];
    deadline: number;
}


export type swapEthForMultiTokensParam = BaseTransactionParam & {
    etherValue: bigint;
};

export type swapTokenForMultiTokensParam = BaseTransactionParam

export type swapUSDForMultiTokensParam = BaseTransactionParam & {
    sellToken: `0x${string}`;
    sellAmount: bigint;
};
// Unified type for all swap parameters
export type UnifiedSwapParams = {
    type: 'ETH' | 'WETH' | 'ERC20';
    params: swapEthForMultiTokensParam | swapTokenForMultiTokensParam | swapUSDForMultiTokensParam;
};

// Transaction options interface
export interface TxOptions {
    gasLimit?: number;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
}