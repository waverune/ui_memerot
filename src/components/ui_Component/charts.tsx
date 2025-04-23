import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { getCoinChart } from "../../services/coinApi";
import { TOKENS } from "../../config/tokens";

interface ChartProps {
  tokenSymbol: string;
  chartType: "price" | "marketCap" | "volume" | "ohlc";
}

const Charts = ({ tokenSymbol, chartType }: ChartProps) => {
  const [chartData, setChartData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        const coinId = TOKENS[tokenSymbol]?.coingeckoId;
        if (!coinId) {
          throw new Error("Invalid token symbol");
        }

        const response = await getCoinChart(coinId);
        
        if (!response || (!response.prices && !response.market_caps && !response.total_volumes)) {
          throw new Error("No data available");
        }

        let formattedData;
        let options = {
          chart: {
            type: "line",
            height: 350,
            toolbar: { show: true },
            background: "transparent"
          },
          xaxis: { type: "datetime" },
          yaxis: { 
            title: { 
              text: chartType === "price" ? "Price (USD)" : 
                    chartType === "marketCap" ? "Market Cap (USD)" : 
                    chartType === "volume" ? "Volume (USD)" : "OHLC" 
            },
            labels: { style: { colors: "#fff" } }
          },
          stroke: { curve: "smooth" },
          theme: { mode: "dark" },
          colors: ["#4361ee"],
          grid: {
            borderColor: "#404040",
            strokeDashArray: 2
          },
          tooltip: {
            theme: "dark"
          }
        };

        switch (chartType) {
          case "price":
            formattedData = response.prices.map((entry: [number, number]) => ({
              x: new Date(entry[0]).toLocaleDateString(),
              y: entry[1]
            }));
            break;
          case "marketCap":
            formattedData = response.market_caps.map((entry: [number, number]) => ({
              x: new Date(entry[0]).toLocaleDateString(),
              y: entry[1]
            }));
            break;
          case "volume":
            formattedData = response.total_volumes.map((entry: [number, number]) => ({
              x: new Date(entry[0]).toLocaleDateString(),
              y: entry[1]
            }));
            break;
          case "ohlc":
            options.chart.type = "candlestick";
            formattedData = response.ohlc.map((entry: [number, number, number, number, number]) => ({
              x: new Date(entry[0]).getTime(),
              y: [entry[1], entry[2], entry[3], entry[4]] // OHLC data
            }));
            break;
        }

        if (formattedData) {
          setChartData({
            series: [{ name: `${tokenSymbol} ${chartType === "ohlc" ? "OHLC" : chartType.charAt(0).toUpperCase() + chartType.slice(1)}`, data: formattedData }],
            options
          });
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
        setError(error instanceof Error ? error.message : "Failed to load chart data");
        setChartData(null);
      }
    };

    fetchData();
  }, [tokenSymbol, chartType]);

  if (error) return <div className="flex items-center justify-center h-full text-red-500">{error}</div>;
  if (!chartData) return <div className="flex items-center justify-center h-full">Loading chart...</div>;

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <Chart options={chartData.options} series={chartData.series} type={chartData.options.chart.type} height={350} />
    </div>
  );
};

export default Charts;
