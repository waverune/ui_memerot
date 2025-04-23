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
        { symbol: "WOJAK", percentage: 40 },
        { symbol: "MOG", percentage: 30 },
        { symbol: "PEIPEI", percentage: 30 },
      ],
      users: 905,
    },
    {
      id: 2,
      title: "WETH Power Mix",
      creator: "MemeRot",
      sellToken: "WETH",
      buyTokens: [
        { symbol: "SPX6900", percentage: 50 },
        { symbol: "HPOS", percentage: 50 },
      ],
      users: 723,
    },
    {
      id: 3,
      title: "USDC Meme Portfolio",
      creator: "MemeRot",
      sellToken: "USDC",
      buyTokens: [
        { symbol: "WOJAK", percentage: 25 },
        { symbol: "SPX6900", percentage: 25 },
        { symbol: "SHIBA INU", percentage: 25 },
        { symbol: "MOG", percentage: 25 },
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

  // Get token colors based on symbol
  const getTokenColor = (symbol: string) => {
    switch (symbol) {
      case "WOJAK":
        return "#34d399"
      case "SPX6900":
        return "#f59e0b"
      case "MOG":
        return "#60a5fa"
      case "PEIPEI":
        return "#ec4899"
      case "SHIBA INU":
        return "#fbbf24"
      case "HPOS":
        return "#8b5cf6"
      default:
        return "#a855f7"
    }
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
                  <Text style={{ color: "#d1d5db", fontSize: 14, display: "block", marginBottom: 8 }}>
                    Sell Token: <span style={{ color: "#60a5fa" }}>{mix.sellToken}</span>
                  </Text>
                </div>

                <Space direction="vertical" style={{ width: "100%", marginBottom: 16 }}>
                  <Text style={{ color: "#9ca3af", fontSize: 12 }}>Buy Tokens:</Text>
                  {mix.buyTokens.map((token, index) => (
                    <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: getTokenColor(token.symbol),
                          }}
                        />
                        <Text style={{ color: "#d1d5db", fontSize: 14 }}>{token.symbol}</Text>
                      </div>
                      <Text style={{ color: "#d1d5db", fontSize: 14 }}>{token.percentage}%</Text>
                    </div>
                  ))}
                </Space>

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
