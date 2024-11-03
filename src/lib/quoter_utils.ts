import { TxOptions, swapEthForMultiTokensParam, swapTokenForMultiTokensParam, swapUSDForMultiTokensParam } from './tx_types';

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

import { createPublicClient, http, parseAbi, defineChain, Chain } from 'viem'
import { MULTISWAP_QUOTER_ABI } from '../lib/contracts'
// import { BuildBearChain } from '../components/swap-interface'
// Define your custom chain
// const bb_chain = ;
export const BuildBearChain = {
    id: 21233,
    name: "BB",
    nativeCurrency: {
        name: "BB",
        symbol: "ETH",
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ["https://rpc.buildbear.io/relieved-groot-ee2fe6d9"],
        },
    },
    blockExplorers: {
        default: {
            name: "BuildBear Explorer",
            url: "https://explorer.buildbear.io/relieved-groot-ee2fe6d9",
        },
    },
    iconUrl: "https://example.com/avax-icon.png",
    iconBackground: "#fff",
} as const satisfies Chain;

// Create the Public Client
const publicClient = createPublicClient({
    chain: defineChain(BuildBearChain),
    transport: http()
})
// Quoters returns array of token amounts in their respective decimals
// for human readable amounts, divide by 10^decimals eg decimals: 18 for ETH, divide by 10^18, usdc: 6, divide by 10^6, spx&hpos: 8, divide by 10^8
export async function quoteTokenForMultiTokens(
    param: swapTokenForMultiTokensParam
) {
    try {
        const quoterAddress = '0xc04c8c20a3eCCbef5d1702303Dd419483068fA29' // Replace with your actual quoter address

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
        const quoterAddress = '0xc04c8c20a3eCCbef5d1702303Dd419483068fA29' // Replace with your actual quoter address

        const result = await publicClient.readContract({
            address: quoterAddress,
            abi: MULTISWAP_QUOTER_ABI,
            functionName: 'quoteUSDForMultiTokens', // quoteUSDForMultiTokens /
            args: [param.sellToken, param.sellAmount, param.sellAmounts, param.path]
        })

        return result
    } catch (error) {
        console.error('Error fetching usd /erc20 multi-token quote:', error)
        throw error
    }
}