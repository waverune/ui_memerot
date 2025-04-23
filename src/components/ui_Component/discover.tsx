"use client"
import { Card, Button, Row, Col, Typography, Space, Divider } from "antd"
import { motion } from "motion/react"
import { useNavigate } from "react-router-dom"

const { Title, Text } = Typography

// Create a motion-enhanced Ant Design Card
const MotionCard = motion(Card)

const DiscoverPresetsPage = () => {
  const navigate = useNavigate()

  // Sample data for the Meme Mix cards with actual tokens from our system
  const memeMixes = [
    {
      id: 1,
      title: "ETH to Meme Mix",
      creator: "MemeRot",
      sellToken: "ETH",
      buyTokens: [
        { name: "WOJAK", symbol: "WOJAK", percentage: 40 },
        { name: "MOG", symbol: "MOG", percentage: 30 },
        { name: "PEIPEI", symbol: "PEIPEI", percentage: 30 },
      ],
      users: 905,
    },
    {
      id: 2,
      title: "WETH Power Mix",
      creator: "MemeRot",
      sellToken: "WETH",
      buyTokens: [
        { name: "SPX6900", symbol: "SPX6900", percentage: 50 },
        { name: "HPOS", symbol: "HPOS", percentage: 50 },
      ],
      users: 723,
    },
    {
      id: 3,
      title: "USDC Meme Portfolio",
      creator: "MemeRot",
      sellToken: "USDC",
      buyTokens: [
        { name: "WOJAK", symbol: "WOJAK", percentage: 25 },
        { name: "SPX6900", symbol: "SPX6900", percentage: 25 },
        { name: "SHIBA INU", symbol: "SHIBA_INU", percentage: 25 },
        { name: "MOG", symbol: "MOG", percentage: 25 },
      ],
      users: 612,
    },
  ]

  // Handle Apply Preset click
  const handleApplyPreset = (mix: typeof memeMixes[0]) => {
    const buyTokenSymbols = mix.buyTokens.map(token => token.symbol)
    const allocationValues = mix.buyTokens.map(token => token.percentage.toString())

    const queryParams = new URLSearchParams({
      sellToken: mix.sellToken,
      allocationType: "custom",
      allocationValues: allocationValues.join(","),
      selectedOutputTokens: buyTokenSymbols.join(","),
      fromAmount: "1",
    }).toString()

    navigate(`/swap?${queryParams}`)
  }


  return (
    <div style={{
      background: "#0a0e1a",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "row",
      padding: "48px 24px",
      marginTop: "30px"
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <Title
            level={2}
            style={{
              marginTop: "80px",
              margin: 0,
              background: "linear-gradient(to right, #9333ea, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Discover Presets
          </Title>
        </div>

        <Row gutter={[24, 24]}>
          {memeMixes.map((mix) => (
            <Col xs={24} md={12} lg={8} key={mix.id}>
              <MotionCard
                style={{
                  background: "#111827",
                  borderRadius: 12,
                  border: "1px solid #1f2937",
                  overflow: "hidden",
                }}
                bodyStyle={{ padding: 20 }}
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 10px 25px -5px rgba(138, 75, 175, 0.2), 0 8px 10px -6px rgba(138, 75, 175, 0.1)",
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <Title level={5} style={{ color: "white", margin: 0 }}>
                    {mix.title}
                  </Title>
                  <Text style={{ color: "#9ca3af", fontSize: 12 }}>Created by {mix.creator}</Text>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#d1d5db", fontSize: 14 }}>Sell Token:</span>
                    <img
                      src={`/logos/${mix.sellToken}.png`}
                      alt={mix.sellToken}
                      style={{ width: 18, height: 18, objectFit: "contain" }}
                      onError={e => { e.currentTarget.src = "/logos/default.png" }}
                    />
                    <span style={{ color: "#60a5fa", fontSize: 14 }}>{mix.sellToken}</span>
                  </span>
                </div>

                <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }}>
                  <Text style={{ color: "#9ca3af", fontSize: 12 }}>Buy Tokens:</Text>
                  {mix.buyTokens.map((token, index) => (
                    <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <img
                          src={`/logos/${token.symbol}.png`}
                          alt={token.symbol}
                          style={{ width: 18, height: 18, objectFit: "contain" }}
                          onError={e => { e.currentTarget.src = "/logos/default.png" }}
                        />
                        <Text style={{ color: "#d1d5db", fontSize: 14 }}>{token.name}</Text>
                      </div>
                      <Text style={{ color: "#d1d5db", fontSize: 14 }}>{token.percentage}%</Text>
                    </div>
                  ))}
                </Space>

                {/* Percentage Bar (identical to swapInterfaceContent.tsx) */}
                <div style={{ margin: '16px 0' }}>
                  <div className="text-sm text-gray-400">Token Allocations</div>
                  <div className="relative h-4 bg-gray-700 rounded" style={{ width: '100%' }}>
                    {mix.buyTokens.map((token, idx) => {
                      const leftPosition = mix.buyTokens.slice(0, idx).reduce((a, b) => a + b.percentage, 0)
                      // Use Tailwind color classes for consistency
                      const TOKEN_COLORS = [
                        "bg-blue-500",
                        "bg-green-500",
                        "bg-pink-500",
                        "bg-yellow-500",
                        "bg-purple-500",
                        "bg-red-500",
                        "bg-indigo-500",
                        "bg-teal-500",
                      ]
                      return (
                        <div
                          key={token.symbol}
                          className={`absolute h-full ${TOKEN_COLORS[idx % TOKEN_COLORS.length]} rounded`}
                          style={{
                            width: `${token.percentage}%`,
                            left: `${leftPosition}%`,
                          }}
                        />
                      )
                    })}
                  </div>
                  {/* Allocation labels overlayed on the bar */}
                  <div className="relative" style={{ width: '100%', height: 18, marginTop: 4 }}>
                    {mix.buyTokens.map((token, idx) => {
                      const leftPosition = mix.buyTokens.slice(0, idx).reduce((a, b) => a + b.percentage, 0)
                      return (
                        <div
                          key={token.symbol}
                          style={{
                            position: "absolute",
                            left: `${leftPosition}%`,
                            width: `${token.percentage}%`,
                            textAlign: "center",
                            color: "#d1d5db",
                            fontSize: 13,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            pointerEvents: "none",
                            lineHeight: "18px",
                          }}
                        >
                          {`${token.percentage}% ${token.name}`}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Divider style={{ margin: "16px 0", borderColor: "#1f2937" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: "#9ca3af", fontSize: 12 }}>{mix.users} users</Text>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      type="primary"
                      onClick={() => handleApplyPreset(mix)}
                      style={{
                        backgroundColor: "#2563eb",
                        borderColor: "#2563eb",
                        height: 32,
                        fontSize: 14,
                      }}
                    >
                      Apply Preset
                    </Button>
                  </motion.div>
                </div>
              </MotionCard>
            </Col>
          ))}
        </Row>
        <Button
          type="primary"
          style={{
            position: "fixed",
            bottom: 80,
            right: 32,
            zIndex: 100,
          }}
          onClick={() => navigate("/swap")}
        >
          Go to Swap Page
        </Button>

      </div>
    </div>
  )
}

export default DiscoverPresetsPage
