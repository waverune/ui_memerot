import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Menu, X, ChevronDown } from "lucide-react";

const TopNavBar: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTestnetDropdownOpen, setIsTestnetDropdownOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleTestnetDropdown = () => {
    setIsTestnetDropdownOpen(!isTestnetDropdownOpen);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between w-full px-4 py-4 md:px-8 bg-[#0d111c]/90 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-2xl font-bold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4c82fb] via-[#3a6fd0] to-[#2d5cb3]">
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
          {/* Testnet Badge with Dropdown */}
          <div className="relative hidden md:block">
            <button
              onClick={toggleTestnetDropdown}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Testnet</span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>
            
            {isTestnetDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#191c2a] rounded-lg shadow-lg border border-gray-800 py-2">
                <a
                  href="https://faucet.buildbear.io/memerot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#293249] hover:text-white transition-colors"
                >
                  Get Testnet Tokens
                </a>
                <a
                  href="https://www.notion.so/Testnet-Doc-for-users-1afc41fdf8db80a5b9c0c46416545b45"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#293249] hover:text-white transition-colors"
                >
                  Testnet Guide for Users
                </a>
              </div>
            )}
          </div>

          <Link
            to="/about"
            className="hidden md:flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <span>About Us</span>
          </Link>
          <ConnectButton />
          <button
            onClick={toggleMobileMenu}
            className="md:hidden text-gray-300 hover:text-white transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={toggleMobileMenu} />
          <div className="fixed top-[73px] left-0 right-0 bg-[#0d111c] border-b border-gray-800 p-4 flex flex-col space-y-2">
            <Link
              to="/swap"
              onClick={toggleMobileMenu}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive('/swap')
                  ? 'bg-[#293249] text-white'
                  : 'text-gray-300 hover:bg-[#293249] hover:text-white'
              }`}
            >
              Swap
            </Link>
            <Link
              to="/discover"
              onClick={toggleMobileMenu}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive('/discover')
                  ? 'bg-[#293249] text-white'
                  : 'text-gray-300 hover:bg-[#293249] hover:text-white'
              }`}
            >
              Discover
            </Link>
            <Link
              to="/about"
              onClick={toggleMobileMenu}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive('/about')
                  ? 'bg-[#293249] text-white'
                  : 'text-gray-300 hover:bg-[#293249] hover:text-white'
              }`}
            >
              About Us
            </Link>
            <a
              href="https://faucet.buildbear.io/memerot"
              target="_blank"
              rel="noopener noreferrer"
              onClick={toggleMobileMenu}
              className="px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-[#293249] hover:text-white transition-colors"
            >
              Get Testnet Tokens
            </a>

            {/* Social Links */}
            <div className="border-t border-gray-800 mt-2 pt-4">
              <div className="flex justify-center space-x-6">
                <a
                  href="https://twitter.com/memer0t"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors px-4 py-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  <span className="text-sm font-medium">Twitter</span>
                </a>
                <a
                  href="https://t.me/+igL2Cj91n1syMWRl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors px-4 py-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  <span className="text-sm font-medium">Telegram</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopNavBar;
