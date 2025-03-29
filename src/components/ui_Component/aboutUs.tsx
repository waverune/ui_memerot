import TopNavBar from "./topNavBar"
import { Link } from "react-router-dom"

export default function AboutPage() {
  return (
    <div className="relative">
      {/* Fixed gradient background that covers entire viewport */}
      <div
        className="fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-gradient-to-b from-blue-900 via-purple-900 to-black"
    
      />

      <div className="min-h-screen text-white">
        <TopNavBar />

        <div className="container mx-auto px-4 pt-24 pb-16 relative">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-8 text-center bg-gradient-to-r from-[#d355e2] to-[#f8a1d1] bg-clip-text text-transparent">
              About MemeROT
            </h1>

            <div className="space-y-12">
              {/* Mission Section */}
              <section className="backdrop-blur-sm rounded-2xl p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-[#d355e2] to-[#f8a1d1] bg-clip-text text-transparent">
                  Our Mission
                </h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  MemeROT was created with a simple yet powerful mission: to help crypto enthusiasts reduce risk through
                  intelligent diversification. We believe that the future of crypto investing lies not in impulsive
                  decisions, but in strategic allocation across multiple assets. Our platform makes this process
                  seamless, allowing anyone to convert their assets into a custom mix of tokens with just one click.
                </p>
              </section>

              {/* What We Offer Section */}
              <section className="backdrop-blur-sm rounded-2xl p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-[#d355e2] to-[#f8a1d1] bg-clip-text text-transparent">
                  What We Offer
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex space-x-4">
                    <div className="mt-1 bg-gradient-to-br from-[#d355e2] to-[#f8a1d1] p-3 rounded-lg">
                      {/* Zap icon will be added by user */}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">One-Click Swaps</h3>
                      <p className="text-gray-300">
                        Convert assets like Ethereum into a custom mix of tokens with a single transaction.
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <div className="mt-1 bg-gradient-to-br from-[#d355e2] to-[#f8a1d1] p-3 rounded-lg">
                      {/* Shield icon will be added by user */}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Risk Management</h3>
                      <p className="text-gray-300">
                        Reduce exposure to market volatility through strategic token diversification.
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <div className="mt-1 bg-gradient-to-br from-[#d355e2] to-[#f8a1d1] p-3 rounded-lg">
                      {/* Share2 icon will be added by user */}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Shareable Presets</h3>
                      <p className="text-gray-300">
                        Create and share your custom allocation strategies with the community.
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <div className="mt-1 bg-gradient-to-br from-[#d355e2] to-[#f8a1d1] p-3 rounded-lg">
                      {/* BarChart3 icon will be added by user */}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Portfolio Analytics</h3>
                      <p className="text-gray-300">
                        Track performance and adjust your strategy based on real-time data.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* How It Works Section */}
              <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-[#d355e2] to-[#f8a1d1] bg-clip-text text-transparent">
                  How It Works
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#d355e2] to-[#f8a1d1] flex items-center justify-center mr-4">
                      <span className="font-bold text-white">1</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
                      <p className="text-gray-300">Link your preferred crypto wallet to our platform securely.</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#d355e2] to-[#f8a1d1] flex items-center justify-center mr-4">
                      <span className="font-bold text-white">2</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Choose Your Mix</h3>
                      <p className="text-gray-300">
                        Select from our preset token mixes or create your own custom allocation.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#d355e2] to-[#f8a1d1] flex items-center justify-center mr-4">
                      <span className="font-bold text-white">3</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Execute the Swap</h3>
                      <p className="text-gray-300">With one click, convert your assets into your selected token mix.</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#d355e2] to-[#f8a1d1] flex items-center justify-center mr-4">
                      <span className="font-bold text-white">4</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Track & Optimize</h3>
                      <p className="text-gray-300">
                        Monitor your portfolio's performance and adjust your strategy as needed.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Vision Section */}
              <section className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-[#d355e2] to-[#f8a1d1] bg-clip-text text-transparent">
                  Our Vision
                </h2>

                <div className="flex space-x-4">
                  <div className="mt-1 bg-gradient-to-br from-[#d355e2] to-[#f8a1d1] p-3 rounded-lg">
                    {/* Lightbulb icon will be added by user */}
                  </div>
                  <div>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      We envision a future where crypto investing is no longer seen as a high-risk gamble, but as a
                      strategic part of everyone's financial portfolio. By making diversification simple and accessible,
                      we're working to create a more stable and inclusive crypto ecosystem where users can grow their
                      assets smartly while managing risk effectively.
                    </p>
                  </div>
                </div>
              </section>

              {/* CTA Section */}
              <div className="text-center pt-8">
                <Link
                  to="/"
                  className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-[#d355e2] to-[#f8a1d1] text-white font-medium hover:opacity-90 transition-opacity"
                >
                  Start Diversifying Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

