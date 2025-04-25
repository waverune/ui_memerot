import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import TopNavBar from "./ui_Component/topNavBar";
import FloatingElements from "./ui_Component/FloatingElements";
import { ChevronDown, Plus, X, Percent } from "lucide-react";
import TokenSelectionPopup from "./ui_Component/tokenSelectionPopup";
import { TOKENS } from "../config/tokens";
import { TokenConfig, TokenSymbol, TokenSelectionType } from "../utils/Modal";

const HomeLogo: React.FC = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [selectedToken, setSelectedToken] = useState<TokenSymbol | null>(null);
  const [selectedOutputTokens, setSelectedOutputTokens] = useState<(TokenSymbol | null)[]>([null]);
  const [isTokenPopupOpen, setIsTokenPopupOpen] = useState(false);
  const [activeTokenSelection, setActiveTokenSelection] = useState<TokenSelectionType>(null);
  const [disabledTokens, setDisabledTokens] = useState<TokenSymbol[]>([]);
  const [allocationType, setAllocationType] = useState<"ratio" | "percentage">("percentage");
  const [selectedSplitType, setSelectedSplitType] = useState<"equal" | "custom">("equal");
  const [customPercentages, setCustomPercentages] = useState<Record<number, number>>({});
  const [activePercentageIndex, setActivePercentageIndex] = useState<number | null>(null);
  const [tempPercentages, setTempPercentages] = useState<Record<number, number>>({});
  const popoverRef = useRef<HTMLDivElement>(null);
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
    setShowScrollIndicator(true); // Initialize as visible
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleGetStarted = () => {
    // Create URL parameters
    const searchParams = new URLSearchParams();
    if (selectedToken) {
      searchParams.set('from', selectedToken);
    }
    if (selectedOutputTokens.length > 0) {
      searchParams.set('to', selectedOutputTokens.filter(token => token !== null).join('-'));
    }
    if (selectedSplitType === 'custom') {
      const percentages = selectedOutputTokens.map((_, index) => getTokenPercentage(index));
      const commonDivisor = percentages.reduce((a, b) => {
        const _gcd = (x: number, y: number): number => (!y ? x : _gcd(y, x % y));
        return _gcd(a, b);
      });
      const ratios = percentages.map(p => p / commonDivisor);
      searchParams.set('ratio', ratios.join('-'));
    } else {
      // For equal split, use 1:1:1... ratio
      const ratio = Array(selectedOutputTokens.filter(token => token !== null).length).fill('1').join('-');
      searchParams.set('ratio', ratio);
    }

    navigate(`/swap?${searchParams.toString()}`);
  };

  const openTokenPopup = (type: "from" | "output", index?: number) => {
    setActiveTokenSelection({ type, index });
    setIsTokenPopupOpen(true);
  };

  const closeTokenPopup = () => {
    setIsTokenPopupOpen(false);
    setActiveTokenSelection(null);
  };

  const handleRemoveToken = (indexToRemove: number) => {
    setSelectedOutputTokens(prev => {
      const newTokens = prev.filter((_, index) => index !== indexToRemove);
      // Ensure there's always at least one token slot
      return newTokens.length === 0 ? [null] : newTokens;
    });
    updateDisabledTokens();
  };

  const updateDisabledTokens = (tokens: (TokenSymbol | null)[] = selectedOutputTokens) => {
    const disabled = [selectedToken, ...tokens].filter((token): token is TokenSymbol => token !== null) as TokenSymbol[];
    setDisabledTokens(disabled);
  };

  const handleTokenSelect = (tokens: string[]) => {
    if (activeTokenSelection?.type === "from") {
      setSelectedToken(tokens[0] as TokenSymbol);
      updateDisabledTokens();
    } else if (activeTokenSelection?.type === "output") {
      const newTokens = tokens.slice(0, 4) as TokenSymbol[]; // Allow up to 4 tokens
      setSelectedOutputTokens(newTokens.map(token => token as TokenSymbol | null));
      updateDisabledTokens(newTokens);
    }
    closeTokenPopup();
  };

  // Filter tokens for output selection (excluding ETH/WETH)
  const OUTPUT_TOKENS = Object.fromEntries(
    Object.entries(TOKENS).filter(([symbol]) => symbol !== "ETH" && symbol !== "WETH")
  ) as Record<TokenSymbol, TokenConfig>;

  const handleAddToken = () => {
    if (selectedOutputTokens.length < 4) {
      setSelectedOutputTokens(prev => [...prev, null]);
      updateDisabledTokens();
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActivePercentageIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Function to handle percentage change
  const handlePercentageChange = (index: number, value: number) => {
    const newPercentages = { ...customPercentages };
    newPercentages[index] = Math.min(100, Math.max(0, value));
    
    // Calculate total of other percentages
    const otherTotal = Object.entries(newPercentages)
      .filter(([key]) => Number(key) !== index)
      .reduce((sum, [_, val]) => sum + val, 0);

    // If total exceeds 100%, adjust other values proportionally
    if (newPercentages[index] + otherTotal > 100) {
      const excess = newPercentages[index] + otherTotal - 100;
      const otherIndices = Object.keys(newPercentages)
        .map(Number)
        .filter(key => key !== index);
      
      otherIndices.forEach(idx => {
        const currentVal = newPercentages[idx];
        const proportion = currentVal / otherTotal;
        newPercentages[idx] = Math.max(0, currentVal - (excess * proportion));
      });
    }

    setCustomPercentages(newPercentages);
  };

  // Initialize percentages when tokens change
  useEffect(() => {
    if (selectedSplitType === "custom") {
      const newPercentages: Record<number, number> = {};
      selectedOutputTokens.forEach((_, index) => {
        newPercentages[index] = 100 / selectedOutputTokens.length;
      });
      setCustomPercentages(newPercentages);
    }
  }, [selectedOutputTokens.length, selectedSplitType]);

  // Get percentage for a token
  const getTokenPercentage = (index: number) => {
    if (selectedSplitType === "equal") {
      return 100 / (selectedOutputTokens.filter(t => t !== null).length || 1);
    }
    return customPercentages[index] || 0;
  };

  return (
    <div className="min-h-screen bg-[#0d111c] text-white overflow-hidden">
      <TopNavBar />
      
      {/* Hero Section */}
      <div className="relative min-h-screen">
        {/* Fixed background */}
        <div className="fixed inset-0 bg-[#0d111c] -z-20" />
        
        <FloatingElements />
        
        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 pt-24">
          {/* Initial View */}
          <div className="text-center max-w-4xl mx-auto mb-6">
            <h1 className={`${isMobile ? 'text-5xl' : 'text-7xl'} font-bold mb-6`}>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4c82fb] via-[#7b3fe4] to-[#ff4d4d]">
                Swap Once, Diversify Instantly
              </span>
            </h1>
          </div>

          {/* Minimal Swap Interface */}
          <div className="bg-[#191c2a] rounded-2xl p-6 w-full max-w-md mb-12">
            <div className="space-y-4">
              {/* Input Token */}
              <div className="p-4 bg-[#212638] rounded-xl">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => openTokenPopup("from")}
                      className="flex items-center space-x-2 bg-[#293249] rounded-full px-4 py-2 hover:bg-[#374160] transition-colors"
                    >
                      {selectedToken ? (
                        <>
                          <img 
                            src={TOKENS[selectedToken].logo} 
                            alt={selectedToken} 
                            className="w-6 h-6 rounded-full"
                          />
                          <span>{selectedToken}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-6 h-6 rounded-full bg-gray-600"></div>
                          <span>Select token</span>
                        </>
                      )}
                      <ChevronDown size={20} />
                    </button>
                    <input
                      type="text"
                      placeholder="0"
                      className="bg-transparent text-2xl font-medium focus:outline-none text-right w-[160px]"
                    />
                  </div>
                </div>
              </div>

              {/* Split Types */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedSplitType("equal")}
                  className={`bg-[#293249] hover:bg-[#374160] rounded-xl p-3 transition-all duration-200 border ${
                    selectedSplitType === "equal" ? "border-[#4c82fb]" : "border-[#3d4860]/50"
                  }`}
                >
                  <div className="text-sm font-medium">Equal Split</div>
                  <div className="text-xs text-gray-400 mt-1">Split tokens equally</div>
                </button>
                <button
                  onClick={() => setSelectedSplitType("custom")}
                  className={`bg-[#293249] hover:bg-[#374160] rounded-xl p-3 transition-all duration-200 border ${
                    selectedSplitType === "custom" ? "border-[#4c82fb]" : "border-[#3d4860]/50"
                  }`}
                >
                  <div className="text-sm font-medium">Custom Split</div>
                  <div className="text-xs text-gray-400 mt-1">Set custom weights</div>
                </button>
              </div>

              {/* Token Outputs with Allocation */}
              <div className="space-y-3">
                {selectedOutputTokens.map((token, index) => (
                  <div key={`output-${index}`} className="p-4 bg-[#212638] rounded-xl">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <button 
                            onClick={() => openTokenPopup("output", index)}
                            className="flex items-center space-x-2 bg-[#293249] rounded-full px-4 py-2 hover:bg-[#374160] transition-colors flex-1"
                          >
                            {token ? (
                              <>
                                <img 
                                  src={TOKENS[token].logo} 
                                  alt={token} 
                                  className="w-6 h-6 rounded-full"
                                />
                                <span>{token}</span>
                              </>
                            ) : (
                              <>
                                <div className="w-6 h-6 rounded-full bg-gray-600"></div>
                                <span>Select token</span>
                              </>
                            )}
                            <ChevronDown size={20} />
                          </button>
                          {selectedOutputTokens.length > 1 && (
                            <button
                              onClick={() => handleRemoveToken(index)}
                              className="p-2 hover:bg-[#374160] rounded-full transition-colors"
                              aria-label="Remove token"
                            >
                              <X size={20} className="text-gray-400 hover:text-white" />
                            </button>
                          )}
                        </div>
                        {/* Percentage Display/Button */}
                        <div className="relative">
                          {selectedSplitType === "custom" ? (
                            <button
                              onClick={() => setActivePercentageIndex(activePercentageIndex === index ? null : index)}
                              className="flex items-center space-x-2 px-3 py-1.5 bg-[#293249] hover:bg-[#374160] rounded-full transition-colors"
                            >
                              <span className="text-lg font-medium">{getTokenPercentage(index).toFixed(1)}%</span>
                              <Percent className="h-4 w-4 text-gray-400" />
                            </button>
                          ) : (
                            <span className="text-lg font-medium">{getTokenPercentage(index).toFixed(1)}%</span>
                          )}
                          
                          {/* Percentage Selector Popover */}
                          {selectedSplitType === "custom" && activePercentageIndex === index && (
                            <div 
                              ref={popoverRef}
                              className="absolute right-0 top-full mt-2 p-4 bg-[#191c2a] rounded-xl border border-[#2d3648] shadow-lg z-50 min-w-[240px]"
                            >
                              <div className="space-y-4">
                                {/* Direct Input */}
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    value={customPercentages[index]?.toFixed(1) || "0"}
                                    onChange={(e) => handlePercentageChange(index, parseFloat(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 bg-[#293249] rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#4c82fb]"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                  />
                                  <span className="text-gray-400">%</span>
                                </div>
                                
                                {/* Slider */}
                                <div className="space-y-2">
                                  <input
                                    type="range"
                                    value={customPercentages[index] || 0}
                                    onChange={(e) => handlePercentageChange(index, parseFloat(e.target.value))}
                                    className="w-full appearance-none h-2 bg-[#293249] rounded-full outline-none cursor-pointer
                                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                                      [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                                      [&::-webkit-slider-thumb]:bg-[#4c82fb] [&::-webkit-slider-thumb]:cursor-pointer
                                      [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 
                                      [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#4c82fb] 
                                      [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                  />
                                  <div className="flex justify-between text-xs text-gray-400">
                                    <span>0%</span>
                                    <span>50%</span>
                                    <span>100%</span>
                                  </div>
                                </div>

                                {/* Quick Select Buttons */}
                                <div className="flex flex-wrap gap-2">
                                  {[25, 50, 75, 100].map((value) => (
                                    <button
                                      key={value}
                                      onClick={() => handlePercentageChange(index, value)}
                                      className="px-2 py-1 bg-[#293249] hover:bg-[#374160] rounded-lg text-sm transition-colors"
                                    >
                                      {value}%
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Allocation Bar */}
                      <div className="w-full bg-[#293249] rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#4c82fb] to-[#7b3fe4] h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${getTokenPercentage(index)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Token Button */}
                {selectedOutputTokens.length < 4 && (
                  <button
                    onClick={handleAddToken}
                    className="w-full mt-2 py-2.5 bg-[#293249] hover:bg-[#374160] rounded-xl flex items-center justify-center transition-colors border border-[#3d4860]/50"
                  >
                    <Plus className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-white">Add another token</span>
                    <span className="text-xs text-gray-400 ml-2">
                      ({4 - selectedOutputTokens.length} remaining)
                    </span>
                  </button>
                )}
              </div>

              {/* Review Swap Button */}
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
              <p className="text-gray-400 text-lg mb-2">Scroll to learn more</p>
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

      {/* Token Selection Popup */}
      <TokenSelectionPopup
        isOpen={isTokenPopupOpen}
        onClose={closeTokenPopup}
        onSelect={handleTokenSelect}
        tokens={activeTokenSelection?.type === "output" ? OUTPUT_TOKENS : TOKENS}
        balances={{}}
        disabledTokens={disabledTokens.map(String)}
        tokenPriceData={{}}
        selectedOutputTokens={selectedOutputTokens.map(token => token?.toString() || "")}
        allowMultiSelect={activeTokenSelection?.type === "output"}
      />
    </div>
    );
};

export default HomeLogo;