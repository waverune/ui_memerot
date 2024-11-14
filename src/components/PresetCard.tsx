interface PresetCardProps {
  title: string;
  creator: string;
  allocations: Array<{token: string; percentage: number}>;
  users: number;
}

const PresetCard = ({ title, creator, allocations, users }: PresetCardProps) => {
  return (
    <div className="bg-[#1a1f2e]/80 backdrop-blur-xl border border-gray-800/50 rounded-xl p-6 hover:bg-[#1a1f2e] transition-all duration-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-400">Created by {creator}</p>
      </div>
      
      <div className="space-y-2 mb-4">
        {allocations.map((allocation, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-gray-300">{allocation.token}</span>
            <span className="text-gray-300">{allocation.percentage}%</span>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">{users} users</span>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors">
          Apply Preset
        </button>
      </div>
    </div>
  );
}; 
export default PresetCard;