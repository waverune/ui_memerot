import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import TopNavBar from "./ui_Component/topNavBar";
import FloatingElements from "./ui_Component/FloatingElements";
import { ChevronDown } from "lucide-react";

const HomeLogo: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleGetStarted = () => {
    navigate('/swap', { 
      state: { 
        selectedToken,
        defaultMode: 'multi'
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#0d111c] text-white">
      <TopNavBar />
      
      {/* Hero Section */}
      <div className="relative min-h-screen">
        <FloatingElements />
        
        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 pt-32">
          {/* Initial View */}
          <div className="text-center max-w-4xl mx-auto mb-8">
            <h1 className={`${isMobile ? 'text-5xl' : 'text-7xl'} font-bold mb-8`}>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4c82fb] via-[#7b3fe4] to-[#ff4d4d]">
                One-Click Token Diversification
              </span>
            </h1>
          </div>

          {/* Minimal Swap Interface */}
          <div className="bg-[#191c2a] rounded-2xl p-6 w-full max-w-md mb-24">
            <div className="space-y-4">
              {/* Input Token */}
              <div className="p-4 bg-[#212638] rounded-xl">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <button className="flex items-center space-x-2 bg-[#293249] rounded-full px-4 py-2 hover:bg-[#374160] transition-colors">
                      <div className="w-6 h-6 rounded-full bg-gray-600"></div>
                      <span>Select token</span>
                      <ChevronDown size={20} />
                    </button>
                    <input
                      type="text"
                      placeholder="0"
                      className="bg-transparent text-2xl font-medium focus:outline-none text-right w-[160px]"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Balance: 0</span>
                    <button className="hover:text-white transition-colors">MAX</button>
                  </div>
                </div>
              </div>

              {/* Output Tokens Section */}
              <div className="space-y-3">
                {/* Token Output Header */}
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm text-gray-400">Output Tokens</span>
                </div>

                {/* Quick Split Presets */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button className="bg-[#293249] hover:bg-[#374160] rounded-xl p-3 transition-colors text-center">
                    <div className="text-sm font-medium">Equal Split</div>
                    <div className="text-xs text-gray-400 mt-1">50/50</div>
                  </button>
                  <button className="bg-[#293249] hover:bg-[#374160] rounded-xl p-3 transition-colors text-center">
                    <div className="text-sm font-medium">Weighted</div>
                    <div className="text-xs text-gray-400 mt-1">70/30</div>
                  </button>
                  <button className="bg-[#293249] hover:bg-[#374160] rounded-xl p-3 transition-colors text-center">
                    <div className="text-sm font-medium">Custom</div>
                    <div className="text-xs text-gray-400 mt-1">Your Split</div>
                  </button>
                </div>

                {/* Token Outputs */}
                <div className="space-y-3">
                  {/* Token 1 */}
                  <div className="p-4 bg-[#212638] rounded-xl">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <button className="flex items-center space-x-2 bg-[#293249] rounded-full px-4 py-2 hover:bg-[#374160] transition-colors">
                          <div className="w-6 h-6 rounded-full bg-gray-600"></div>
                          <span>Select token</span>
                          <ChevronDown size={20} />
                        </button>
                        <span className="text-lg font-medium">50%</span>
                      </div>
                      <div className="w-full bg-[#293249] rounded-full h-2">
                        <div className="bg-[#4c82fb] h-2 rounded-full" style={{ width: '50%' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Token 2 */}
                  <div className="p-4 bg-[#212638] rounded-xl">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <button className="flex items-center space-x-2 bg-[#293249] rounded-full px-4 py-2 hover:bg-[#374160] transition-colors">
                          <div className="w-6 h-6 rounded-full bg-gray-600"></div>
                          <span>Select token</span>
                          <ChevronDown size={20} />
                        </button>
                        <span className="text-lg font-medium">50%</span>
                      </div>
                      <div className="w-full bg-[#293249] rounded-full h-2">
                        <div className="bg-[#4c82fb] h-2 rounded-full" style={{ width: '50%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add Token Button */}
                <button className="w-full flex items-center justify-center space-x-2 py-3 text-[#4c82fb] hover:text-[#3a6fd0] transition-colors group">
                  <div className="bg-[#212638] rounded-full p-1 group-hover:bg-[#293249] transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <span className="text-sm">Add another token (optional)</span>
                </button>

                {/* Info Text */}
                <div className="text-center text-sm text-gray-400 mt-4">
                  Drag the sliders to adjust allocation percentages
                </div>
              </div>

              <button
                onClick={handleGetStarted}
                className="w-full bg-gradient-to-r from-[#4c82fb] to-[#7b3fe4] hover:from-[#3a6fd0] hover:to-[#6a36c7] text-white rounded-xl py-3 font-medium transition-colors"
              >
                Review Swap
              </button>
            </div>
          </div>

          {/* Scroll Indicator */}
          {showScrollIndicator && (
            <div className="flex flex-col items-center mb-16">
              <p className="text-gray-400 text-sm mb-2">Scroll to learn more</p>
              <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex items-center justify-center">
                <div className="w-1 h-3 bg-gray-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}

          {/* Feature Cards Section */}
          <div className="w-full max-w-7xl mx-auto px-4 py-24">
            {/* MultiSwap Feature */}
            <div className="flex flex-col md:flex-row items-center gap-12 mb-32">
              <div className="flex-1">
                <h2 className="text-4xl font-bold mb-6">Multi-Token Swaps</h2>
                <p className="text-xl text-gray-400">
                  Diversify your portfolio in a single transaction. Swap any token into multiple tokens with customizable allocations, saving time and gas fees.
                </p>
              </div>
              <div className="flex-1 bg-[#191c2a] rounded-2xl p-8">
                {/* Placeholder for MultiSwap illustration */}
                <div className="aspect-video bg-[#212638] rounded-xl"></div>
              </div>
            </div>

            {/* Discover Narratives Feature */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 mb-32">
              <div className="flex-1">
                <h2 className="text-4xl font-bold mb-6">Discover Narratives</h2>
                <p className="text-xl text-gray-400">
                  Explore and invest in trending narratives across DeSci, DeFi, Memes, DePIN, and more. Our curated token baskets make it easy to gain exposure to emerging sectors.
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <span className="px-4 py-2 bg-[#212638] rounded-full text-sm text-gray-300">DeSci</span>
                  <span className="px-4 py-2 bg-[#212638] rounded-full text-sm text-gray-300">DeFi</span>
                  <span className="px-4 py-2 bg-[#212638] rounded-full text-sm text-gray-300">Memes</span>
                  <span className="px-4 py-2 bg-[#212638] rounded-full text-sm text-gray-300">DePIN</span>
                  <span className="px-4 py-2 bg-[#212638] rounded-full text-sm text-gray-300">AI</span>
                </div>
              </div>
              <div className="flex-1 bg-[#191c2a] rounded-2xl p-8">
                {/* Placeholder for Narratives illustration */}
                <div className="aspect-video bg-[#212638] rounded-xl"></div>
              </div>
            </div>

            {/* Lower Fees Feature */}
            <div className="flex flex-col md:flex-row items-center gap-12 mb-32">
              <div className="flex-1">
                <h2 className="text-4xl font-bold mb-6">Lower Fees & MEV Protection</h2>
                <p className="text-xl text-gray-400">
                  Our optimized routing ensures you get the best rates while protecting your trades from MEV attacks. Save on gas and trade with confidence.
                </p>
              </div>
              <div className="flex-1 bg-[#191c2a] rounded-2xl p-8">
                {/* Placeholder for Fees illustration */}
                <div className="aspect-video bg-[#212638] rounded-xl"></div>
              </div>
            </div>

            {/* D/acc Funding Feature */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 mb-32">
              <div className="flex-1">
                <h2 className="text-4xl font-bold mb-6">D/acc Project Funding</h2>
                <p className="text-xl text-gray-400">
                  Supporting innovation through decentralized acceleration. A portion of trading fees goes directly to fund DeSci and other d/acc projects, creating a sustainable ecosystem for technological advancement.
                </p>
              </div>
              <div className="flex-1 bg-[#191c2a] rounded-2xl p-8">
                {/* Placeholder for Funding illustration */}
                <div className="aspect-video bg-[#212638] rounded-xl"></div>
              </div>
            </div>

            {/* AI-Driven Feature */}
            <div className="flex flex-col md:flex-row items-center gap-12 mb-16">
              <div className="flex-1">
                <h2 className="text-4xl font-bold mb-6">AI-Driven Discovery <span className="text-sm font-normal text-gray-400 ml-2">Coming Soon</span></h2>
                <p className="text-xl text-gray-400">
                  Let AI help you discover the best token combinations based on market trends, sentiment analysis, and historical data.
                </p>
              </div>
              <div className="flex-1 bg-[#191c2a] rounded-2xl p-8">
                {/* Placeholder for AI illustration */}
                <div className="aspect-video bg-[#212638] rounded-xl"></div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex justify-center items-center space-x-6 mb-8">
              <a
                href="https://twitter.com/memer0t"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://t.me/+igL2Cj91n1syMWRl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeLogo;