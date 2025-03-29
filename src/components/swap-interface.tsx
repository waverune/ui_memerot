"use client";
import "@rainbow-me/rainbowkit/styles.css";
import SwapInterfaceContent from "./ui_Component/swapInterfaceContent";
import TopNavBar from "./ui_Component/topNavBar";

export function SwapInterface() {
  return (

    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-900 via-purple-900 to-black">
       <TopNavBar />
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md lg:max-w-4xl xl:max-w-6xl bg-gray-900 border-2 border-blue-800 rounded-lg shadow-lg overflow-hidden">
          <SwapInterfaceContent />
        </div>
      </div>
    </div>
  );
}
