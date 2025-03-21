"use client";
import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider,
  Chain,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import CustomWalletConnectButton from "./ui/CustomWalletConnectButton";
import SwapInterfaceContent from "./ui_Component/swapInterfaceContent";
import { Link } from "react-router-dom";

export const BuildBearChain = {
  id: 1,
  name: "Tenderly Virtual Testnet",
  nativeCurrency: {
    name: "Tenderly Virtual Testnet",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://virtual.mainnet.rpc.tenderly.co/87a41065-48e0-49aa-b7cf-593798b729b7"],
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
  chains: [ BuildBearChain],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

const CustomConnectButton = () => {
  return <CustomWalletConnectButton />;
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
                  className="text-2xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-white"
                  
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
