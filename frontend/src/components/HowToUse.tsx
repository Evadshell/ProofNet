import React from 'react';
import { ArrowRight, Coins, Shield, Users, Zap } from 'lucide-react';
import SparklesCore from '../components/ui/sparkle';

const DarkRewardsSection = () => {
  return (
    <div id="rewards" className="relative py-28 bg-gray-950 text-gray-100 overflow-hidden">
      {/* Particle background effect */}
      <div className="absolute inset-0 z-0">
        <SparklesCore
          background="transparent"
          particleColor="#3b82f6"
          particleDensity={60}
          speed={1}
          minSize={0.5}
          maxSize={2}
          className="h-full w-full"
        />
      </div>
      
      {/* Glow effect */}
      <div className="absolute top-40 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="md:w-1/2">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-900/40 border border-blue-800/50 backdrop-blur-sm mb-6">
              <Coins className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">
                Getting Started
              </span>
            </div>
            
            <h2 className="text-4xl font-bold mb-6 text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Start Earning Rewards in 6 Simple Steps
            </h2>
            
            <p className="text-gray-300 leading-relaxed mb-8">
              Follow these straightforward steps to begin your journey with
              Buffalu and start earning rewards by validating locations and
              participating in the network.
            </p>

            <div className="space-y-6 mt-8">
              <div className="flex items-start group hover:translate-x-2 transition-transform duration-300">
                <div className="bg-blue-900/40 border border-blue-700/50 p-2 rounded-lg mr-4 flex-shrink-0 group-hover:bg-blue-800/60 transition-colors duration-300">
                  <span className="w-6 h-6 text-blue-400 font-bold flex items-center justify-center">
                    1
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2 text-blue-300">
                    Go to Dashboard
                  </h3>
                  <p className="text-gray-400">
                    Access your Buffalu dashboard to begin the setup process.
                  </p>
                </div>
              </div>

              <div className="flex items-start group hover:translate-x-2 transition-transform duration-300">
                <div className="bg-purple-900/40 border border-purple-700/50 p-2 rounded-lg mr-4 flex-shrink-0 group-hover:bg-purple-800/60 transition-colors duration-300">
                  <span className="w-6 h-6 text-purple-400 font-bold flex items-center justify-center">
                    2
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2 text-purple-300">
                    Install Server Package
                  </h3>
                  <p className="text-gray-400">
                    <code className="bg-gray-800 border border-gray-700 px-2 py-1 rounded text-blue-400">
                      npm i buffalu-cli
                    </code>
                  </p>
                </div>
              </div>

              <div className="flex items-start group hover:translate-x-2 transition-transform duration-300">
                <div className="bg-green-900/40 border border-green-700/50 p-2 rounded-lg mr-4 flex-shrink-0 group-hover:bg-green-800/60 transition-colors duration-300">
                  <span className="w-6 h-6 text-green-400 font-bold flex items-center justify-center">
                    3
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2 text-green-300">
                    Start the Server
                  </h3>
                  <p className="text-gray-400">
                    <code className="bg-gray-800 border border-gray-700 px-2 py-1 rounded text-green-400">
                      buffalu-cli
                    </code>
                  </p>
                </div>
              </div>

              <div className="flex items-start group hover:translate-x-2 transition-transform duration-300">
                <div className="bg-yellow-900/40 border border-yellow-700/50 p-2 rounded-lg mr-4 flex-shrink-0 group-hover:bg-yellow-800/60 transition-colors duration-300">
                  <span className="w-6 h-6 text-yellow-400 font-bold flex items-center justify-center">
                    4
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2 text-yellow-300">
                    Enter Session ID
                  </h3>
                  <p className="text-gray-400">
                    Copy the session ID and enter it in the frontend field.
                  </p>
                </div>
              </div>

              <div className="flex items-start group hover:translate-x-2 transition-transform duration-300">
                <div className="bg-red-900/40 border border-red-700/50 p-2 rounded-lg mr-4 flex-shrink-0 group-hover:bg-red-800/60 transition-colors duration-300">
                  <span className="w-6 h-6 text-red-400 font-bold flex items-center justify-center">
                    5
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2 text-red-300">
                    Get Validated
                  </h3>
                  <p className="text-gray-400">
                    Get validated from available servers in the network.
                  </p>
                </div>
              </div>

              <div className="flex items-start group hover:translate-x-2 transition-transform duration-300">
                <div className="bg-cyan-900/40 border border-cyan-700/50 p-2 rounded-lg mr-4 flex-shrink-0 group-hover:bg-cyan-800/60 transition-colors duration-300">
                  <span className="w-6 h-6 text-cyan-400 font-bold flex items-center justify-center">
                    6
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-2 text-cyan-300">
                    Start Earning
                  </h3>
                  <p className="text-gray-400">
                    Begin earning rewards by validating others on the network.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:w-1/2 relative">
            <div className="bg-gradient-to-r from-blue-950/50 to-purple-950/50 rounded-3xl p-8 border border-gray-800 shadow-xl relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern
                      id="grid-small"
                      width="5"
                      height="5"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 5 0 L 0 0 0 5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.2"
                        className="text-blue-500/20"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid-small)" />
                </svg>
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 animate-pulse">
                    <Zap className="w-10 h-10 text-white" />
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2 text-white">
                    Ready to Start?
                  </h3>
                  <p className="text-gray-400">
                    Join the Buffalu network and begin earning rewards today
                  </p>
                </div>

                <div className="bg-gray-900 rounded-xl p-6 shadow-lg shadow-blue-500/5 border border-gray-800 backdrop-blur-sm">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 p-2 hover:bg-gray-800/50 rounded-lg transition-colors duration-300">
                      <Shield className="w-5 h-5 text-blue-400" />
                      <span className="text-gray-300">
                        Secure Verification
                      </span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 p-2 hover:bg-gray-800/50 rounded-lg transition-colors duration-300">
                      <Coins className="w-5 h-5 text-purple-400" />
                      <span className="text-gray-300">
                        Instant Rewards
                      </span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 p-2 hover:bg-gray-800/50 rounded-lg transition-colors duration-300">
                      <Users className="w-5 h-5 text-green-400" />
                      <span className="text-gray-300">
                        Growing Community
                      </span>
                    </div>
                  </div>

                  <button
                    className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center group"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DarkRewardsSection;