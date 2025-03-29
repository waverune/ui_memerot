import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { SwapInterface } from "./components/swap-interface";
import "./App.css";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HomeLogo from "./components/HomeLogo";
import Status from './pages/Status';
import SimulationPage from './pages/SimulationPage';
import AboutPage from "./components/ui_Component/aboutUs";
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
  chains: [BuildBearChain],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

function App() {
  return (
    <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider  theme={darkTheme({
      accentColor: "#000", // Makes the button black
      accentColorForeground: "#fff", // Text color inside button
      borderRadius: "medium",
    })}>
    <Router>
      <div  className="app-container text-white">
        <Routes>
        <Route path="/" element={<HomeLogo key="home" />} />
          <Route path="/swap" element={<SwapInterface key="swap" />} />
          <Route path="/status" element={<Status key="status" />} />
          <Route path="/sims" element={<SimulationPage key="sims" />} />
          <Route path="/about" element={<AboutPage key="about" />} />
        </Routes>
        <ToastContainer position="bottom-right" autoClose={5000} />
      </div>
    </Router>
    </RainbowKitProvider>
    </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
