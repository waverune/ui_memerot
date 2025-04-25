import TopNavBar from "./topNavBar"
import { Link } from "react-router-dom"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0d111c] text-white overflow-hidden">
      {/* Fixed background */}
      <div className="fixed inset-0 bg-[#0d111c] -z-20" />
      
      <TopNavBar />

      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 pt-24">
        <div className="text-center max-w-4xl mx-auto mb-6">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4c82fb] via-[#7b3fe4] to-[#ff4d4d]">
              About MemeROT
            </span>
          </h1>
        </div>

        <div className="w-full max-w-4xl mx-auto space-y-12">
          {/* Mission Section */}
          <section className="bg-[#191c2a]/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-[#2d3648]">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-[#4c82fb] to-[#7b3fe4] bg-clip-text text-transparent">
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
          <section className="bg-[#191c2a]/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-[#2d3648]">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-[#4c82fb] to-[#7b3fe4] bg-clip-text text-transparent">
              What We Offer
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex space-x-4">
                <div className="mt-1 bg-gradient-to-r from-[#4c82fb] to-[#7b3fe4] p-3 rounded-lg">
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
                <div className="mt-1 bg-gradient-to-r from-[#4c82fb] to-[#7b3fe4] p-3 rounded-lg">
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
                <div className="mt-1 bg-gradient-to-r from-[#4c82fb] to-[#7b3fe4] p-3 rounded-lg">
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
                <div className="mt-1 bg-gradient-to-r from-[#4c82fb] to-[#7b3fe4] p-3 rounded-lg">
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
          <section className="bg-[#191c2a]/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-[#2d3648]">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-[#4c82fb] to-[#7b3fe4] bg-clip-text text-transparent">
              How It Works
            </h2>

            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-[#4c82fb] to-[#7b3fe4] flex items-center justify-center mr-4">
                  <span className="font-bold text-white">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
                  <p className="text-gray-300">Link your preferred crypto wallet to our platform securely.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-[#4c82fb] to-[#7b3fe4] flex items-center justify-center mr-4">
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
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-[#4c82fb] to-[#7b3fe4] flex items-center justify-center mr-4">
                  <span className="font-bold text-white">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Execute the Swap</h3>
                  <p className="text-gray-300">With one click, convert your assets into your selected token mix.</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-[#4c82fb] to-[#7b3fe4] flex items-center justify-center mr-4">
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
          <section className="bg-[#191c2a]/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-[#2d3648]">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-[#4c82fb] to-[#7b3fe4] bg-clip-text text-transparent">
              Our Vision
            </h2>

            <div className="flex space-x-4">
              <div className="mt-1 bg-gradient-to-r from-[#4c82fb] to-[#7b3fe4] p-3 rounded-lg">
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
              to="/discover"
              className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-[#4c82fb] to-[#7b3fe4] text-white font-medium hover:opacity-90 transition-opacity"
            >
              Start Diversifying Now
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex justify-center items-center space-x-6 mb-8">
            <a
              href="https://twitter.com/memer0t"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a
              href="https://t.me/+igL2Cj91n1syMWRl"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

