// DATATYPES FOR Transactions
// 1. swapEthForMultiTokens when ETH is the input token
// 2. swapTokenForMultiTokens when WETH is the input token
// 3. swapUSDForMultiTokens when any erc20 token other than weth is the input token


// Base transaction interface that all types share
interface BaseTransactionParam {
    minAmounts: bigint[];
    path: `0x${string}`[];
    deadline: number;
}


export interface swapEthForMultiTokensParam extends BaseTransactionParam {
    etherValue: bigint;
    sellAmounts: bigint[];
}

export interface swapTokenForMultiTokensParam extends BaseTransactionParam {
    sellAmounts: bigint[];
}

export interface swapUSDForMultiTokensParam extends BaseTransactionParam {
    sellToken: `0x${string}`;
    sellAmount: bigint;
    sellAmounts: bigint[];
}

// Transaction options interface
export interface TxOptions {
    gasLimit?: number;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
}