import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { TokenSymbol } from "../utils/Modal";

interface TokenAllocation {
  symbol: TokenSymbol;
  percentage: number;
  icon?: string;
}

interface PresetCardProps {
  title: string;
  description?: string;
  creator: string;
  sellToken: {
    symbol: TokenSymbol;
    icon?: string;
  };
  buyTokens: TokenAllocation[];
  userCount: number;
  onApply: () => void;
}

export const PresetCard = ({
  title,
  description,
  creator,
  sellToken,
  buyTokens,
  userCount,
  onApply,
}: PresetCardProps) => {
  // Ensure we only display up to 4 tokens
  const displayTokens = buyTokens.slice(0, 4);
  // Calculate how many placeholder slots we need
  const placeholderCount = Math.max(0, 4 - displayTokens.length);

  return (
    <Card className="w-[380px] min-h-[460px] bg-[#0F1218] border-[#1F2937] hover:border-[#374151] transition-all duration-200 flex flex-col">
      <CardHeader className="pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold text-white">{title}</CardTitle>
          {description && <p className="text-sm text-gray-400">{description}</p>}
          <p className="text-sm text-gray-400">Created by {creator}</p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 px-6 flex-1">
        {/* Sell Token Section */}
        <div>
          <p className="text-sm text-gray-400 mb-2">Sell Token:</p>
          <div className="flex items-center space-x-2 p-3 rounded-md bg-[#1A1D24]">
            {sellToken.icon && (
              <img src={sellToken.icon} alt={String(sellToken.symbol)} className="w-6 h-6" />
            )}
            <span className="text-white">{String(sellToken.symbol)}</span>
          </div>
        </div>

        {/* Buy Tokens Section */}
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-2">Buy Tokens:</p>
          <div className="space-y-2">
            {/* Active Tokens */}
            {displayTokens.map((token, index) => (
              <div 
                key={index} 
                className="bg-[#1A1D24] rounded-md"
              >
                <div className="p-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {token.icon && (
                      <img src={token.icon} alt={String(token.symbol)} className="w-6 h-6" />
                    )}
                    <span className="text-white">{String(token.symbol)}</span>
                  </div>
                  <span className="text-white text-sm">{token.percentage}%</span>
                </div>
                <Progress 
                  value={token.percentage} 
                  className="h-1 bg-[#2D3139] rounded-none"
                />
              </div>
            ))}

            {/* Placeholder Slots */}
            {Array.from({ length: placeholderCount }).map((_, index) => (
              <div 
                key={`placeholder-${index}`} 
                className="bg-[#1A1D24] bg-opacity-50 rounded-md backdrop-blur-sm"
              >
                <div className="p-2 flex items-center justify-between opacity-30">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gray-600" />
                    <span className="text-white"></span>
                  </div>
                  {/* <span className="text-white text-sm">/span> */}
                </div>
                <div className="h-1 bg-[#2D3139] rounded-none opacity-30" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center border-t border-[#1F2937] px-6 py-4 mt-auto">
        <p className="text-sm text-gray-400">{userCount} users</p>
        <Button
          onClick={onApply}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6"
        >
          Apply Preset
        </Button>
      </CardFooter>
    </Card>
  );
}; 