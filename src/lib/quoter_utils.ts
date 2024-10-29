// viem work
// TODO: import types for tx and use for quoting
// make quoting robust:
//      1. Either pass TxType param and/or just past prepped params to quote
//      2. prep mock params: sellAmounts, path; for all transaction types 
//      3. implement quoter for all transaction types
//      4. integrate quoter with swap function  to prep final params and calculate slippage

import { createPublicClient, http, parseAbi, defineChain } from 'viem'
import { MULTISWAP_QUOTER_ABI } from '../lib/contracts'
import { BuildBearChain } from '../components/swap-interface'
// Define your custom chain
const bb_chain = defineChain(BuildBearChain);

// Create the Public Client
const publicClient = createPublicClient({
    chain: bb_chain,
    transport: http()
})

export async function quoteTokenForMultiTokens(
    sellAmounts: bigint[],
    path: `0x${string}`[]
) {
    try {
        const quoterAddress = '0xc04c8c20a3eCCbef5d1702303Dd419483068fA29' // Replace with your actual quoter address

        const result = await publicClient.readContract({
            address: quoterAddress,
            abi: MULTISWAP_QUOTER_ABI,
            functionName: 'quoteTokenForMultiTokens',
            args: [sellAmounts, path]
        })

        return result
    } catch (error) {
        console.error('Error fetching multi-token quote:', error)
        throw error
    }
}