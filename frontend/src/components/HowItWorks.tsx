"use client";

import { motion, useInView } from "motion/react";
import { useState, useRef } from "react";
import { MapPin, Users, Coins, ChevronRight, Zap } from "lucide-react";

export default function HowItWorks() {
  const [loading, setLoading] = useState(false);
  const loadingStates = ["Validating", "Processing", "Verifying", "Complete"];
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.2 });

  return (
    <div id="how-it-works" className="py-28 bg-black w-full font-sans">
      <div className="container mx-auto px-4 md:px-8 lg:px-10 max-w-7xl" ref={containerRef}>
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-lg md:text-4xl font-bold mb-6 text-white relative inline-block">
            How It Works
            <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></span>
          </h2>
          <p className="text-neutral-300 max-w-2xl mx-auto text-sm md:text-base">
            Our system combines UDP ping validation with Solana staking
            mechanics to create a robust and reliable location verification
            system.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <MapPin className="w-7 h-7" />,
              color: "from-blue-500 to-blue-400",
              title: "Claim a Location",
              description: "Users submit location proofs via UDP pings to the network, creating a verifiable claim that can be validated by others.",
              linkColor: "text-blue-500"
            },
            {
              icon: <Users className="w-7 h-7" />,
              color: "from-purple-500 to-purple-400",
              title: "Validate Others",
              description: "Validators confirm location claims by measuring RTT (Round Trip Time) through decentralized verification processes.",
              linkColor: "text-purple-500"
            },
            {
              icon: <Coins className="w-7 h-7" />,
              color: "from-green-500 to-green-400",
              title: "Earn Rewards",
              description: "Validators and validated users receive Buffalu tokens as rewards for participating honestly in the network.",
              linkColor: "text-green-500"
            }
          ].map((item, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="group transform transition-all duration-300 hover:-translate-y-2"
            >
              <div className="bg-black border border-neutral-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all h-full flex flex-col relative overflow-hidden">
                <div className={`bg-gradient-to-br ${item.color} text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 z-10`}>
                  {item.icon}
                </div>
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-t from-blue-500/10 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />
                <h3 className="text-2xl font-bold mb-4 text-white">
                  {item.title}
                </h3>
                <p className="text-neutral-300 leading-relaxed mb-6">
                  {item.description}
                </p>
                <div className="mt-auto">
                  <span className={`${item.linkColor} font-medium inline-flex items-center group-hover:translate-x-1 transition-transform duration-300`}>
                    Learn more <ChevronRight className="ml-1 w-4 h-4" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Interactive Process Demo */}
        <motion.div 
          className="mt-24"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4 text-white">
              See the process in action
            </h3>
            <p className="text-neutral-300 max-w-2xl mx-auto">
              Click the button below to see a simulation of the location
              verification process.
            </p>
          </div>
          <div className="w-full flex items-center justify-center">
            <motion.button
              onClick={() => setLoading(true)}
              className="bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white mx-auto transition-all font-medium duration-500 py-4 px-8 rounded-xl flex items-center justify-center shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Simulate Verification
              <Zap className="ml-2 w-5 h-5" />
            </motion.button>
            {loading && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-black border border-neutral-800 p-8 rounded-2xl max-w-md w-full">
                  <div className="space-y-4">
                    {loadingStates.map((state, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`h-4 w-4 rounded-full ${idx === 3 ? "bg-green-500" : "bg-blue-500"} animate-pulse`}></div>
                        <p className="text-white">{state}</p>
                      </div>
                    ))}
                  </div>
                  <motion.button
                    onClick={() => setLoading(false)}
                    className="mt-6 w-full bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded-lg"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}