import React from 'react';
import TopNavBar from '../components/ui_Component/topNavBar';
import { PresetCard } from '../components/PresetCard';

const Discover: React.FC = () => {
  const presets = [
    {
      id: "eth-meme-mix",
      title: "ETH to Meme Mix",
      creator: "MemeRot",
      sellToken: {
        symbol: "ETH",
        icon: "/icons/eth.svg"
      },
      buyTokens: [
        { symbol: "WOJAK", percentage: 40, icon: "/icons/wojak.svg" },
        { symbol: "MOG", percentage: 30, icon: "/icons/mog.svg" },
        { symbol: "PEIPEI", percentage: 30, icon: "/icons/peipei.svg" }
      ],
      userCount: 905
    },
    {
      id: "weth-power-mix",
      title: "WETH Power Mix",
      creator: "MemeRot",
      sellToken: {
        symbol: "WETH",
        icon: "/icons/weth.svg"
      },
      buyTokens: [
        { symbol: "SPX6900", percentage: 50, icon: "/icons/spx6900.svg" },
        { symbol: "HPOS", percentage: 50, icon: "/icons/hpos.svg" }
      ],
      userCount: 723
    }
  ];

  return (
    <div className="min-h-screen bg-[#0d111c]">
      <TopNavBar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Popular Presets</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presets.map((preset) => (
              <PresetCard
                key={preset.id}
                title={preset.title}
                creator={preset.creator}
                sellToken={preset.sellToken}
                buyTokens={preset.buyTokens}
                userCount={preset.userCount}
                onApply={() => {
                  // Handle preset application
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discover; 