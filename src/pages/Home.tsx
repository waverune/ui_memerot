import { SwapInterface } from '../components/swap-interface';
import { Navbar } from '../components/Navbar';
import {PresetCard}  from '../components/PresetCard';

const Home = () => {
  return (
    <div className="min-h-screen relative">
      {/* Gradient Background with Blur Effect */}
      <div className="fixed inset-0 bg-gradient-to-b from-blue-900 via-indigo-900 to-black">
        <div className="absolute inset-0 backdrop-blur-[150px]">
          {/* Gradient Orbs */}
          <div className="absolute top-20 left-20 w-72 h-72 bg-pink-500/30 rounded-full blur-3xl" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        
        <main className="max-w-[1000px] mx-auto px-4 py-4">
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold mb-2 text-white">
              Swap anytime, anywhere
            </h1>
            <p className="text-gray-300 text-lg">
              The largest meme coin marketplace. Buy and sell meme coins on Ethereum and 11+ other chains.
            </p>
          </div>

          {/* Swap Interface Container */}
          <div className="h-[1100px]">
          <div className="flex justify-center mb-3">
            <SwapInterface />
          </div>
          </div>


          {/* Presets Section - now closer to swap interface */}
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-white">Popular Presets</h2>
            <button className="text-blue-400 hover:text-blue-300 transition-colors">
              View All ↗
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Updated PresetCard styling for dark theme */}
            <PresetCard 
              title="Meme Mix 1"
              creator="MemeTrader1"
              allocations={[
                { token: "WOJAK", percentage: 34.55 },
                { token: "SPX9000", percentage: 49.00 },
                { token: "USDC", percentage: 16.45 },
              ]}
              users={995}
            />
             <PresetCard 
              title="Meme Mix 1"
              creator="MemeTrader1"
              allocations={[
                { token: "WOJAK", percentage: 34.55 },
                { token: "SPX9000", percentage: 49.00 },
                { token: "USDC", percentage: 16.45 },
              ]}
              users={995}
            />
             <PresetCard 
              title="Meme Mix 1"
              creator="MemeTrader1"
              allocations={[
                { token: "WOJAK", percentage: 34.55 },
                { token: "SPX9000", percentage: 49.00 },
                { token: "USDC", percentage: 16.45 },
              ]}
              users={995}
            />
            {/* Add more preset cards as needed */}
          </div>
        </main>

        <footer className="text-center py-8 text-sm text-gray-400">
          Built by the MemeROt team. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default Home;