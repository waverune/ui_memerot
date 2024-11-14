interface PresetCardProps {
  title: string;
  creator: string;
  allocations: Array<{token: string; percentage: number}>;
  users: number;
}

export const PresetCard = ({ title, creator, allocations, users }: PresetCardProps) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-gray-500">Created by {creator}</p>
      </div>
      
      <div className="space-y-2 mb-4">
        {allocations.map((allocation, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span>{allocation.token}</span>
            <span>{allocation.percentage}%</span>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{users} users</span>
        <button className="bg-black text-white px-4 py-2 rounded-lg text-sm">
          Apply Preset
        </button>
      </div>
    </div>
  );
}; 
export default PresetCard;