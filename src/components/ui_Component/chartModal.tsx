"use client";

import { Modal, Tabs } from 'antd';
import { useState } from "react";
import Charts from "./charts";
import { TOKENS } from "../../config/tokens";

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCoin: string;
}

export default function ChartModal({ isOpen, onClose, selectedCoin }: ChartModalProps) {
  const [selectedTab, setSelectedTab] = useState("price");

  if (!TOKENS[selectedCoin]) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      width={"80%"}
      className="!bg-gray-900"
      title={
        <div className="text-2xl font-bold text-white">
          {TOKENS[selectedCoin]?.symbol} Charts
        </div>
      }
      footer={null}
      maskStyle={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      style={{ top: 20 }}
    >
      <Tabs
        activeKey={selectedTab}
        onChange={setSelectedTab}
        className="bg-gray-900"
        items={[
          {
            key: "price",
            label: "Price",
            children: <Charts tokenSymbol={selectedCoin} chartType="price" />,
          },
          {
            key: "marketCap",
            label: "Market Cap",
            children: <Charts tokenSymbol={selectedCoin} chartType="marketCap" />,
          },
          {
            key: "volume",
            label: "Volume",
            children: <Charts tokenSymbol={selectedCoin} chartType="volume" />,
          },
          {
            key: "ohlc",
            label: "OHLC",
            children: <Charts tokenSymbol={selectedCoin} chartType="ohlc" />,
          },
        ]}
      />
    </Modal>
  );
}