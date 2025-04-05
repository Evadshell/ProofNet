/* eslint-disable @typescript-eslint/no-unused-vars */

import { cn } from "@/lib/utils";
import { GlobeIcon, ChevronRight, FileText } from "lucide-react";
import { Vortex } from "./ui/vortex"; // Make sure the path is correct
import { Globe } from "./magicui/globe"; // Assuming this is your existing Globe component

export default function HeroSection() {
  return (
    <Vortex 
      particleCount={700}
      baseHue={220}
      backgroundColor="#000000"
      baseRadius={1}
      rangeRadius={2}
      baseSpeed={0.1}
      rangeSpeed={1.5}
      containerClassName="relatuve inset-0"
    >
      <div className="container mx-auto px-6 relative min-h-screen flex items-center">
        <div className="max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-900/40 mb-8 shadow-sm">
            <GlobeIcon className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">
              Decentralized Location Verification
            </span>
          </div>

          {/* Magic UI Globe positioned behind the text */}
          <div className="relative">
            {/* Globe positioned behind the text */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden z-0">
              <Globe className="scale-150 opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 to-black/90" />
            </div>

            {/* Text content on top of the Globe */}
            <div className="relative z-10">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 tracking-tight text-white">
                Buffalu: The Future of{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                  Proof-of-Location
                </span>
              </h1>

              <p className="text-xl text-gray-300 mb-12 leading-relaxed">
                A revolutionary decentralized protocol built on Solana,
                enabling verifiable real-world location validation with
                rewards. Our system combines UDP ping validation with
                blockchain technology for robust location verification without
                centralized GPS.
              </p>

              <div className="flex flex-wrap items-center space-x-0 sm:space-x-6 space-y-4 sm:space-y-0">
                <button
                  onClick={() =>
                    window.open("https://discord.gg/buffalu", "_blank")
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25 px-8 py-4 rounded-xl font-medium transition-all duration-200 inline-flex items-center w-full sm:w-auto justify-center transform hover:-translate-y-1"
                >
                  Join the Network
                  <ChevronRight className="ml-2 w-5 h-5" />
                </button>
                <button
                  onClick={() => window.open("/whitepaper.pdf", "_blank")}
                  className="bg-gray-800 text-white shadow-lg hover:shadow-gray-700/25 px-8 py-4 rounded-xl font-medium hover:bg-gray-700 transition-all duration-200 border border-gray-700 inline-flex items-center w-full sm:w-auto justify-center transform hover:-translate-y-1"
                >
                  Read the Whitepaper
                  <FileText className="ml-2 w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Vortex>
  );
}