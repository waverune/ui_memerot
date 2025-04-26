import { Chain } from 'viem'

export type NetworkConfig = {
  chainId: number
  name: string
  rpcUrl: string
  explorerUrl: string
  contracts: {
    multiswap: string
    multiswapQuoter: string
  }
}

export const NETWORKS: Record<string, NetworkConfig> = {
  buildbear: {
    chainId: 1, // Replace with actual BuildBear chain ID
    name: 'BuildBear',
    rpcUrl: 'https://rpc.buildbear.io/your-network-id', // Replace with your BuildBear RPC URL
    explorerUrl: 'https://explorer.buildbear.io/your-network-id', // Replace with your BuildBear explorer URL
    contracts: {
      multiswap: '0x...', // Replace with actual Multiswap contract address
      multiswapQuoter: '0x...', // Replace with actual Multiswap Quoter contract address
    },
  },
  // Add more networks as needed
}

export const getNetworkConfig = (chainId: number): NetworkConfig | undefined => {
  return Object.values(NETWORKS).find((network) => network.chainId === chainId)
}

export const getContractAddress = (chainId: number, contractName: keyof NetworkConfig['contracts']): string | undefined => {
  const network = getNetworkConfig(chainId)
  return network?.contracts[contractName]
}

export const getViemChain = (chainId: number): Chain | undefined => {
  const network = getNetworkConfig(chainId)
  if (!network) return undefined

  return {
    id: network.chainId,
    name: network.name,
    network: network.name.toLowerCase(),
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [network.rpcUrl] },
      public: { http: [network.rpcUrl] },
    },
    blockExplorers: {
      default: { name: 'Explorer', url: network.explorerUrl },
    },
  }
}

// Type guard to check if a chainId is supported
export const isSupportedNetwork = (chainId: number): boolean => {
  return Object.values(NETWORKS).some((network) => network.chainId === chainId)
}

// Get all supported chain IDs
export const getSupportedChainIds = (): number[] => {
  return Object.values(NETWORKS).map((network) => network.chainId)
} 