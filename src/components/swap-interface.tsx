"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  ArrowDownUp,
  ChevronDown,
  Info,
  Lock,
  Unlock,
  Plus,
} from "lucide-react";
import Image from "next/image";

// Assuming the images are stored in the public folder
const mogLogo = "/mog-logo.png";
const spx6900Logo = "/spx6900-logo.png";

const ethPrice = 2500; // $2500 per ETH

type Token = "SPX6900" | "MOG" | string;

export function SwapInterface() {
  const [simpleSwap, setSimpleSwap] = useState(false);
  const [fromAmount, setFromAmount] = useState("0.69");
  const [toAmounts, setToAmounts] = useState<Record<Token, string>>({
    SPX6900: "2000",
    MOG: "89213.4",
  });
  const [sliderValues, setSliderValues] = useState<Record<Token, number>>({
    SPX6900: 50,
    MOG: 50,
  });
  const [lockedTokens, setLockedTokens] = useState<Record<Token, boolean>>({
    SPX6900: false,
    MOG: false,
  });

  const spx6900Price = 0.9; // $0.9 per SPX6900
  const mogPrice = 0.000003; // $0.000003 per MOG

  // Simulated token balances (in a real scenario, these would be fetched using ERC20:balanceOf() multicall)
  const [tokenBalances, setTokenBalances] = useState<Record<Token, string>>({
    ETH: "42",
    SPX6900: "10000",
    MOG: "5000000",
  });

  const handleSliderChange = (token: Token, value: number) => {
    if (lockedTokens[token]) return;

    const newSliderValues = { ...sliderValues, [token]: value };
    const unlockedTokens = Object.keys(newSliderValues).filter(
      (t) => !lockedTokens[t]
    );
    const remainingValue = 100 - value;
    const valuePerToken = remainingValue / (unlockedTokens.length - 1);

    unlockedTokens.forEach((t) => {
      if (t !== token) {
        newSliderValues[t] = valuePerToken;
      }
    });

    setSliderValues(newSliderValues);
  };

  const toggleLock = (token: Token) => {
    setLockedTokens((prev) => ({ ...prev, [token]: !prev[token] }));
  };

  const addToken = () => {
    // In a real scenario, you would open a modal to select from supported tokens
    const newToken = `Token${Object.keys(toAmounts).length + 1}`;
    setToAmounts((prev) => ({ ...prev, [newToken]: "0" }));
    setSliderValues((prev) => {
      const newValue = 100 / (Object.keys(prev).length + 1);
      return Object.fromEntries(
        Object.entries(prev).map(([token, value]) => [token, newValue])
      );
    });
    setLockedTokens((prev) => ({ ...prev, [newToken]: false }));
    setTokenBalances((prev) => ({ ...prev, [newToken]: "0" }));
  };

  useEffect(() => {
    // Update token amounts based on slider values
    const totalAmount = parseFloat(fromAmount) * ethPrice; // Total value in USD
    setToAmounts((prev) =>
      Object.fromEntries(
        Object.entries(sliderValues).map(([token, value]) => [
          token,
          (
            ((value / 100) * totalAmount) /
            (token === "SPX6900" ? spx6900Price : mogPrice)
          ).toFixed(2),
        ])
      )
    );

    // In a real scenario, you would fetch token balances here using ERC20:balanceOf() multicall
    // For now, we'll just use the simulated balances
  }, [sliderValues, fromAmount]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-between p-4">
      <div className="w-full max-w-7xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Swap</h1>
        <Button
          variant="outline"
          className="bg-gradient-to-r from-blue-400 to-blue-600 text-white border-blue-500 hover:from-blue-500 hover:to-blue-700 hover:border-blue-600 transition-all duration-200 shadow-md"
        >
          Connect Wallet
        </Button>
      </div>
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-2">
            <Switch
              id="simple-swap"
              checked={simpleSwap}
              onCheckedChange={setSimpleSwap}
            />
            <label htmlFor="simple-swap" className="text-sm">
              Try Simple Swap - No Slippage or Gas Fees
            </label>
            <span className="bg-orange-500 text-xs font-bold px-2 py-1 rounded">
              NEW
            </span>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">From</label>
              <div className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                <div className="flex flex-col items-start space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      ETH
                    </div>
                    <span className="font-medium">ETH</span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="text-xs text-gray-400">
                    Balance: {tokenBalances.ETH}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <Input
                    type="number"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="bg-transparent border-none text-right w-24"
                  />
                  <span className="text-xs text-gray-400">
                    ${(parseFloat(fromAmount) * ethPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-gray-700"
              >
                <ArrowDownUp className="h-6 w-6" />
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">To</label>
              {Object.entries(toAmounts).map(([token, amount]) => (
                <div key={token} className="space-y-2">
                  <div className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                    <div className="flex flex-col items-start space-y-1">
                      <div className="flex items-center space-x-2">
                        <Image
                          src={
                            token === "MOG"
                              ? mogLogo
                              : token === "SPX6900"
                              ? spx6900Logo
                              : "/placeholder.svg"
                          }
                          alt={token}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                        <span className="font-medium">{token}</span>
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="text-xs text-gray-400">
                        Balance: {tokenBalances[token] || "0"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) =>
                          setToAmounts((prev) => ({
                            ...prev,
                            [token]: e.target.value,
                          }))
                        }
                        className="bg-transparent border-none text-right w-24"
                      />
                      <span className="text-xs text-gray-400">
                        $
                        {(
                          parseFloat(amount) *
                          (token === "SPX6900" ? spx6900Price : mogPrice)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderValues[token]}
                        onChange={(e) =>
                          handleSliderChange(token, parseInt(e.target.value))
                        }
                        className="flex-grow"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleLock(token)}
                        className="p-1"
                      >
                        {lockedTokens[token] ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Unlock className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>0%</span>
                      <span>{sliderValues[token]}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addToken}
                className="w-full mt-2 flex items-center justify-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Select multiple tokens</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Output Value</span>
              <span>3000.01 USD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Minimum Received</span>
              <span>2997.06 USD</span>
            </div>
          </div>

          <Button className="w-full bg-blue-600 hover:bg-blue-700">Swap</Button>
        </div>
      </div>
    </div>
  );
}
