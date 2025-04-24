import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const TopNavBar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between w-full px-4 py-4 md:px-8 bg-[#0d111c]/90 backdrop-blur-sm border-b border-gray-800">
      <div className="flex items-center space-x-6">
        <Link to="/" className="text-2xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-[#4c82fb] to-[#4c82fb] bg-clip-text text-transparent">
            MEMEROT
          </span>
        </Link>

        <div className="hidden md:flex items-center space-x-1">
          <Link
            to="/swap"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/swap')
                ? 'bg-[#293249] text-white'
                : 'text-gray-300 hover:bg-[#293249] hover:text-white'
            }`}
          >
            Swap
          </Link>
          <Link
            to="/discover"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/discover')
                ? 'bg-[#293249] text-white'
                : 'text-gray-300 hover:bg-[#293249] hover:text-white'
            }`}
          >
            Discover
          </Link>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <Link
          to="/about"
          className="hidden md:flex items-center text-gray-300 hover:text-white transition-colors"
        >
          <span>About Us</span>
        </Link>
        <ConnectButton />
      </div>
    </nav>
  );
};

export default TopNavBar;
