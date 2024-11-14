export const SwapCard = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-[400px]">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-semibold">Swap</h2>
        <div className="flex gap-2">
          <button className="px-4 py-1 rounded-full bg-gray-100">Swap</button>
          <button className="px-4 py-1 rounded-full">Buy</button>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-xl">
          <div className="text-sm text-gray-500 mb-2">Sell</div>
          <div className="flex justify-between">
            <input 
              type="number" 
              placeholder="0" 
              className="bg-transparent outline-none w-full"
            />
            <select className="bg-transparent outline-none">
              <option>ETH</option>
            </select>
          </div>
        </div>

        <div className="flex justify-center">
          <button className="p-2 rounded-full bg-gray-100">
            ↓
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl">
          <div className="text-sm text-gray-500 mb-2">Buy</div>
          <div className="flex justify-between">
            <input 
              type="number" 
              placeholder="0" 
              className="bg-transparent outline-none w-full"
            />
            <select className="bg-transparent outline-none">
              <option>Select token</option>
            </select>
          </div>
        </div>

        <button className="w-full bg-black text-white py-3 rounded-xl">
          Connect Wallet
        </button>
      </div>
    </div>
  );
}; 