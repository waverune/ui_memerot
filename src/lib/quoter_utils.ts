import { swapEthForMultiTokensParam, swapTokenForMultiTokensParam, swapUSDForMultiTokensParam } from './tx_types';

// viem work
// TODO: import types for tx and use for quoting
// make quoting robust:
//      1. Either pass TxType param and/or just past prepped params to quote
//      2. prep mock params: sellAmounts, path; for all transaction types 
//      3. implement quoter for all transaction types
//      4. integrate quoter with swap function  to prep final params and calculate slippage

// TODO refactor :  single config file for hardcodings 
// - network: BuildBearChain +.... ()since every netwrok has an id calld chain_id  
// - addresses : swapContractAddress & quoterAddress 
// {
//     chain_id: {
//         swapContractAddress: "0xfasdfasd...",
//         swapContractAddress: "0xzxcnbvqw..."

//     }
// }

import { createPublicClient, http, defineChain, Chain } from 'viem'
import { MULTISWAP_QUOTER_ABI } from '../lib/contracts'
// import { BuildBearChain } from '../components/swap-interface'
// Define your custom chain
// const bb_chain = ;
export const BuildBearChain = {
    id: 25925,
    name: "Forked Testnet",
    nativeCurrency: {
        name: "Ethereum Virtual",
        symbol: "ETH",
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ["https://rpc.buildbear.io/early-captainmarvel-0939f826"],
        },
    },
    blockExplorers: {
        default: {
            name: "BuildBear Explorer",
            url: "https://explorer.buildbear.io/early-captainmarvel-0939f826",
        },
    },
} as const satisfies Chain;

// Create the Public Client
const publicClient = createPublicClient({
    chain: defineChain(BuildBearChain),
    transport: http()
})
const quoterAddress = '0x791c5908921AA9b08a101be02D095d4e8F545e2A' // Replace with your actual quoter address

// Quoters returns array of token amounts in their respective decimals
// for human readable amounts, divide by 10^decimals eg decimals: 18 for ETH, divide by 10^18, usdc: 6, divide by 10^6, spx&hpos: 8, divide by 10^8
export async function quoteTokenForMultiTokens(
    param: swapTokenForMultiTokensParam | swapEthForMultiTokensParam
) {
    try {

        const result = await publicClient.readContract({
            address: quoterAddress,
            abi: MULTISWAP_QUOTER_ABI,
            functionName: 'quoteTokenForMultiTokens', // quoteUSDForMultiTokens /
            args: [param.sellAmounts.slice(1), param.path]
        })

        return result
    } catch (error) {
        console.error('Error fetching multi-token quote:', error)
        throw error
    }
}
// swapUSDForMultiTokensParam 
export async function quoteERC20ForMultiTokens(
    param: swapUSDForMultiTokensParam
) {
    try {

        const result = await publicClient.readContract({
            address: quoterAddress,
            abi: MULTISWAP_QUOTER_ABI,
            functionName: 'quoteUSDForMultiTokens', // quoteUSDForMultiTokens /
            args: [param.sellToken, param.sellAmount, param.sellAmounts.slice(1), param.path]
        })

        return result
    } catch (error) {
        console.error('Error fetching usd /erc20 multi-token quote:', error)
        throw error
    }
}
export async function quoteExactInputSingle(swapParams: swapUSDForMultiTokensParam) {
    try {

        const result = await publicClient.readContract({
            address: quoterAddress,
            abi: MULTISWAP_QUOTER_ABI,
            functionName: 'quoteExactInputSingle', // quoteUSDForMultiTokens /
            args: [swapParams.sellToken, swapParams.path[0], swapParams.sellAmount]
        })
        return result

    } catch (error) {
        console.error('Error fetching usd /erc20 multi-token quote:', error)
        throw error
    }

}

export async function altQuoteExactInputSingle(sellToken: `0x${string}`, path: `0x${string}`[], sellAmount: bigint) {
    try {

        const result = await publicClient.readContract({
            address: quoterAddress,
            abi: MULTISWAP_QUOTER_ABI,
            functionName: 'quoteExactInputSingle', // quoteUSDForMultiTokens /
            args: [sellToken, path[0], sellAmount]
        })
        return result

    } catch (error) {
        console.error('Error fetching usd /erc20 multi-token quote:', error)
        throw error
    }
}