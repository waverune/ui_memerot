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
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className={`${isMobile ? 'text-5xl' : 'text-7xl'} font-bold mb-8`}>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4c82fb] to-[#4c82fb]">
                One-Click Token Diversification
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Revolutionizing DeFi trading by merging Uniswap's swapping capabilities with DeFiLlama's analytics. Diversify into multiple top tokens in a single transaction.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button 
                onClick={handleGetStarted}
                className="w-full sm:w-auto bg-[#4c82fb] hover:bg-[#4c82fb]/90 text-white rounded-2xl px-8 py-4 font-medium transition-colors"
              >
                Start Swapping
              </button>
              <Link
                to="/discover"
                className="w-full sm:w-auto bg-[#293249] hover:bg-[#374160] text-white rounded-2xl px-8 py-4 font-medium transition-colors"
              >
                Explore Presets
              </Link>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-[#191c2a] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Lower Fees</h3>
                <p className="text-gray-400">Reduce gas fees and slippage with our optimized routing</p>
              </div>
              <div className="bg-[#191c2a] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-2">MEV Protection</h3>
                <p className="text-gray-400">Secure your trades with built-in MEV protection</p>
              </div>
              <div className="bg-[#191c2a] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-2">AI-Driven Discovery</h3>
                <p className="text-gray-400">Find the best token combinations with AI-powered insights</p>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex justify-center items-center space-x-6">
              <a
                href="https://github.com/your-repo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
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