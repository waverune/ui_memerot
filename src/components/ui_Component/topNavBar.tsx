import React from "react";
import { Link } from "react-router-dom";

import Telegram from "../../assets/Telegram.png";
import TwitterIcon from "../../assets/X.png";
// import { CustomConnectButton } from "../swap-interface";
import { ConnectButton } from "@rainbow-me/rainbowkit";
const TopNavBar: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between w-full px-4 py-4 md:px-8 bg-[#0e0e1a]/90 backdrop-blur-sm border-b border-gray-800">
      <div className="flex items-center">
        <Link to="/" className="text-2xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-[#d355e2] to-[#f8a1d1] bg-clip-text text-transparent">
            MEMEROT
          </span>
        </Link>
      </div>

      <div className="flex items-center space-x-6">
        <Link
          to="https://t.me/+igL2Cj91n1syMWRl"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-gray-300 hover:text-[#d355e2] transition-colors"
        >
          <img src={Telegram} alt="Telegram" className="w-5 h-5 mr-1" />
          <span className="hidden md:inline">Telegram</span>
        </Link>

        <Link
          to="https://twitter.com/memer0t"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-gray-300 hover:text-[#d355e2] transition-colors"
        >
          <img src={TwitterIcon} alt="Twitter" className="w-5 h-5 mr-1" />
          <span className="hidden md:inline">Twitter</span>
        </Link>

        <Link
          to="/about"
          className="flex items-center text-gray-300 hover:text-[#d355e2] transition-colors"
        >
          <span className="hidden md:inline">About Us</span>
        </Link>
        <ConnectButton />
      </div>
    </nav>
  );
};

export default TopNavBar;
