import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { SwapInterface } from "./components/swap-interface";
import "./App.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import HomeLogo from "./components/HomeLogo";
import Status from "./pages/Status";
import SimulationPage from "./pages/SimulationPage";
import AboutPage from "./components/ui_Component/aboutUs";
import Discover from "./pages/Discover";
import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider,
  Chain,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

export const BuildBearChain = {
  id: 1,
  name: "Forked Testnet",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.buildbear.io/memerot"],
    },
  },
  blockExplorers: {
    default: {
      name: "BuildBear Explorer",
      url: "https://explorer.buildbear.io/memerot",
    },
  },
  iconUrl: "https://example.com/avax-icon.png",
  iconBackground: "#fff",
} as const satisfies Chain;

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: "My RainbowKit App",
  projectId: "288a12f8c7549e28f9540f38707c3c19",
  chains: [BuildBearChain],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#000",
            accentColorForeground: "#fff",
            borderRadius: "medium",
          })}
        >
          <Router>
            <div className="flex flex-col min-h-screen bg-[#0d111c]">
              <div className="flex-1 bg-[#0d111c]">
                <Routes>
                  <Route path="/" element={<HomeLogo key="home" />} />
                  <Route path="/swap" element={<SwapInterface key="swap" />} />
                  <Route path="/discover" element={<Discover key="discover" />} />
                  <Route path="/status" element={<Status key="status" />} />
                  <Route path="/sims" element={<SimulationPage key="sims" />} />
                  <Route path="/about" element={<AboutPage key="about" />} />
                </Routes>
                <ToastContainer position="bottom-right" autoClose={5000} />
              </div>
            </div>
          </Router>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
