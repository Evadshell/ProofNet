"use client"

import { Users, Coins, GlobeIcon, Lock, MessageSquare, Shield } from "lucide-react"
import GlowingEffect from "../components/ui/glow"
import BentoGrid, { BentoGridItem } from "../components/ui/bento"

export default function UseCasesSection() {
  const useCases = [
    {
      title: "Social Applications",
      description:
        "Enable location-based social networks with verifiable check-ins and meetups, creating trustless social proof.",
      icon: <Users className="w-6 h-6 text-blue-500" />,
      className: "md:col-span-1",
    },
    {
      title: "DeFi & Commerce",
      description:
        "Create location-based DeFi services and enable geofenced commerce with incentives for physical presence.",
      icon: <Coins className="w-6 h-6 text-purple-500" />,
      className: "md:col-span-1",
    },
    {
      title: "Tourism & Travel",
      description:
        "Verify visits to tourist destinations with rewards for exploration and authenticated travel experiences.",
      icon: <GlobeIcon className="w-6 h-6 text-green-500" />,
      className: "md:col-span-1",
    },
    {
      title: "Security & Access",
      description:
        "Enhance physical security systems with decentralized location verification for secure access control.",
      icon: <Lock className="w-6 h-6 text-red-500" />,
      className: "md:col-span-1 md:row-span-1",
    },
    {
      title: "Events & Conferences",
      description: "Confirm attendance at events with proof-of-location, enabling new types of engagement and rewards.",
      icon: <MessageSquare className="w-6 h-6 text-yellow-500" />,
      className: "md:col-span-1",
    },
    {
      title: "Gaming & AR",
      description:
        "Power location-based games and augmented reality experiences with verifiable real-world interactions.",
      icon: <Shield className="w-6 h-6 text-cyan-500" />,
      className: "md:col-span-1",
    },
  ]

  return (
    <section id="use-cases" className="py-24 bg-gradient-to-b from-gray-950 to-black text-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6 relative inline-block">
            Use Cases
            <span className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-purple-600 rounded-full"></span>
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Buffalo`s location verification protocol opens up new possibilities across various industries and
            applications.
          </p>
        </div>

        <BentoGrid>
          {useCases.map((useCase, index) => (
            <div key={index} className="relative group">
              <BentoGridItem
                className={`${useCase.className} relative z-10 bg-gray-900/60 backdrop-blur-sm border-gray-800/50 hover:bg-gray-800/70 transition-all duration-300`}
                title={useCase.title}
                description={useCase.description}
                icon={
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-800/80 group-hover/bento:scale-110 transition-transform duration-300">
                    {useCase.icon}
                  </div>
                }
              />
              <div className="absolute inset-0 rounded-xl">
                <GlowingEffect
                  variant="default"
                  disabled={false}
                  glow={true}
                  spread={35}
                  blur={15}
                  proximity={120}
                  movementDuration={1.8}
                  borderWidth={1.5}
                />
              </div>
            </div>
          ))}
        </BentoGrid>
      </div>
    </section>
  )
}

