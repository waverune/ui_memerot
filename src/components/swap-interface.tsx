"use client";
import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider,
  Chain,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { mainnet, polygon, optimism, arbitrum, base } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import SwapInterfaceContent from "./ui_Component/swapInterfaceContent";
import { Link } from "react-router-dom";

export const BuildBearChain = {
  id: 22892,
  name: "BB",
  nativeCurrency: {
    name: "BB",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.buildbear.io/bizarre-nebula-535f2d2c"],
    },
  },
  blockExplorers: {
    default: {
      name: "BuildBear Explorer",
      url: "https://explorer.buildbear.io/bizarre-nebula-535f2d2c",
    },
  },
  iconUrl: "https://example.com/avax-icon.png",
  iconBackground: "#fff",
} as const satisfies Chain;

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: "My RainbowKit App",
  projectId: "288a12f8c7549e28f9540f38707c3c19",
  chains: [mainnet, BuildBearChain],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

const CustomConnectButton = () => {
  return <ConnectButton />;
};

export function SwapInterface() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-900 via-purple-900 to-black">
            <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center p-4">
              <Link to="/">
                <h1
                  className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-white"
                  style={{ fontFamily: "'Roboto Mono', monospace" }}
                >
                  MemeR0t
                </h1>
              </Link>
              <div className="mt-4 md:mt-0">
                <CustomConnectButton />
              </div>
            </div>
            <div className="flex-grow flex items-center justify-center p-4">
              <div className="w-full max-w-md lg:max-w-4xl xl:max-w-6xl bg-gray-900 border-2 border-blue-800 rounded-lg shadow-lg overflow-hidden">
                <SwapInterfaceContent />
              </div>
            </div>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
