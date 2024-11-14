import {Navbar} from '../components/Navbar'
import {PresetCard} from '../components/PresetCard'
import {SwapCard} from '../components/SwapCard'


const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            Swap anytime, anywhere
          </h1>
          <p className="text-gray-600 text-lg">
            The largest meme coin marketplace. Buy and sell meme coins on Ethereum and 11+ other chains.
          </p>
        </div>

        <div className="flex justify-center mb-24">
          <SwapCard />
        </div>

        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Popular Presets</h2>
          <button className="text-pink-500">View All ↗</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      <footer className="text-center py-8 text-sm text-gray-500">
        Built by the MemeROt team. All rights reserved.
      </footer>
    </div>
  );
}; 
export default Home;