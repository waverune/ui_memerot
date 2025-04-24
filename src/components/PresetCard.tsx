import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";

interface TokenAllocation {
  symbol: string;
  percentage: number;
  icon?: string;
}

interface PresetCardProps {
  title: string;
  creator: string;
  sellToken: {
    symbol: string;
    icon?: string;
  };
  buyTokens: TokenAllocation[];
  userCount: number;
  onApply: () => void;
}

export const PresetCard = ({
  title,
  creator,
  sellToken,
  buyTokens,
  userCount,
  onApply,
}: PresetCardProps) => {
  return (
    <Card className="w-[380px] h-[460px] bg-[#0F1218] border-[#1F2937] hover:border-[#374151] transition-all duration-200 flex flex-col">
      <CardHeader className="flex-none h-[88px] pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-semibold text-white truncate">{title}</CardTitle>
          <p className="text-sm text-gray-400 truncate">Created by {creator}</p>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-6 overflow-hidden px-6">
        <div className="flex-none h-[72px]">
          <p className="text-sm text-gray-400 mb-2">Sell Token:</p>
          <div className="flex items-center space-x-2 p-3 rounded-md bg-[#1A1D24] h-[48px]">
            {sellToken.icon && (
              <img src={sellToken.icon} alt={sellToken.symbol} className="w-6 h-6" />
            )}
            <span className="text-white truncate">{sellToken.symbol}</span>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <p className="text-sm text-gray-400 mb-2">Buy Tokens:</p>
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-3">
              {buyTokens.map((token, index) => (
                <div 
                  key={index} 
                  className="p-3 rounded-md bg-[#1A1D24] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      {token.icon && (
                        <img src={token.icon} alt={token.symbol} className="w-5 h-5 flex-shrink-0" />
                      )}
                      <span className="text-white text-sm truncate">{token.symbol}</span>
                    </div>
                    <span className="text-white text-sm flex-shrink-0">{token.percentage}%</span>
                  </div>
                  <Progress 
                    value={token.percentage} 
                    className="h-1.5 bg-[#2D3139]"
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>

      <CardFooter className="flex-none h-[76px] flex justify-between items-center border-t border-[#1F2937] px-6">
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