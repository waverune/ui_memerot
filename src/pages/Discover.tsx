import React from 'react';
import TopNavBar from '../components/ui_Component/topNavBar';
import { PresetCard } from '../components/PresetCard';
import { TOKENS } from '../config/tokens';
import { TokenSymbol } from '../utils/Modal';

interface PresetBasket {
  id: string;
  title: string;
  description: string;
  creator: string;
  sellToken: {
    symbol: TokenSymbol;
    icon: string;
  };
  buyTokens: {
    symbol: TokenSymbol;
    percentage: number;
    icon: string;
  }[];
  userCount: number;
  category: 'meme' | 'defi' | 'ai' | 'depin' | 'desci';
}

const Discover: React.FC = () => {
  const presets: PresetBasket[] = [
    {
      id: "meme-mix",
      title: "Meme Power Mix",
      description: "Diversify into top meme tokens",
      creator: "MemeRot",
      sellToken: {
        symbol: "ETH",
        icon: TOKENS.ETH.logo
      },
      buyTokens: [
        { symbol: "WOJAK", percentage: 40, icon: TOKENS.WOJAK.logo },
        { symbol: "MOG", percentage: 30, icon: TOKENS.MOG.logo },
        { symbol: "PEIPEI", percentage: 30, icon: TOKENS.PEIPEI.logo }
      ],
      userCount: 1205,
      category: 'meme'
    },
    {
      id: "defi-mix",
      title: "DeFi Blue Chip Mix",
      description: "Top DeFi protocols exposure",
      creator: "MemeRot",
      sellToken: {
        symbol: "WETH",
        icon: TOKENS.WETH.logo
      },
      buyTokens: [
        { symbol: "USDC", percentage: 50, icon: TOKENS.USDC.logo },
        { symbol: "SHIBA", percentage: 50, icon: TOKENS.SHIBA.logo }
      ],
      userCount: 923,
      category: 'defi'
    },
    {
      id: "ai-mix",
      title: "AI Narrative Mix",
      description: "Leading AI tokens portfolio",
      creator: "MemeRot",
      sellToken: {
        symbol: "ETH",
        icon: TOKENS.ETH.logo
      },
      buyTokens: [
        { symbol: "SPX6900", percentage: 50, icon: TOKENS.SPX6900.logo },
        { symbol: "HPOS", percentage: 50, icon: TOKENS.HPOS.logo }
      ],
      userCount: 1567,
      category: 'ai'
    },
    {
      id: "depin-mix",
      title: "DePIN Infrastructure Mix",
      description: "Physical infrastructure tokens",
      creator: "MemeRot",
      sellToken: {
        symbol: "WETH",
        icon: TOKENS.WETH.logo
      },
      buyTokens: [
        { symbol: "MOG", percentage: 40, icon: TOKENS.MOG.logo },
        { symbol: "WOJAK", percentage: 30, icon: TOKENS.WOJAK.logo },
        { symbol: "PEIPEI", percentage: 30, icon: TOKENS.PEIPEI.logo }
      ],
      userCount: 842,
      category: 'depin'
    },
    {
      id: "desci-mix",
      title: "DeSci Innovation Mix",
      description: "Decentralized science tokens",
      creator: "MemeRot",
      sellToken: {
        symbol: "ETH",
        icon: TOKENS.ETH.logo
      },
      buyTokens: [
        { symbol: "SPX6900", percentage: 50, icon: TOKENS.SPX6900.logo },
        { symbol: "HPOS", percentage: 50, icon: TOKENS.HPOS.logo }
      ],
      userCount: 678,
      category: 'desci'
    }
  ];

  const categories = ['all', 'meme', 'defi', 'ai', 'depin', 'desci'] as const;
  const [selectedCategory, setSelectedCategory] = React.useState<typeof categories[number]>('all');

  const filteredPresets = selectedCategory === 'all' 
    ? presets 
    : presets.filter(preset => preset.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#0d111c] text-white overflow-hidden">
      <TopNavBar />
      <div className="container mx-auto px-4 pt-24 pb-16 overflow-y-auto h-full">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-8">Discover Preset Baskets</h1>
          
          {/* Category Filter */}
          <div className="flex flex-wrap gap-3 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Preset Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {filteredPresets.map((preset) => (
              <PresetCard
                key={preset.id}
                title={preset.title}
                description={preset.description}
                creator={preset.creator}
                sellToken={preset.sellToken}
                buyTokens={preset.buyTokens}
                userCount={preset.userCount}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discover; 