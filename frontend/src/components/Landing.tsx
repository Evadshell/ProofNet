"use client";
import React, { useState, useEffect } from "react";
import { Globe } from "@/components/magicui/globe";
import {
  Shield,
  ChevronRight,
  Coins,
  Globe as GlobeIcon,
  Lock,
  Zap,
  MapPin,
  Users,
  Github,
  FileText,
  Twitter,
  MessageSquare,
  Moon,
  Sun,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";
import BuffaluNavbar from "./ui/navbar";
import Footer from "./footer";
import { Vortex } from "./ui/vortex";
import HowItWorks from "./HowItWorks";
import Timeline from "./WhyBuffalu";
import { time } from "console";
import DarkRewardsSection from "./HowToUse";
import UseCasesSection from "./UseCase";
import WavyBackground from "./ui/wave";

const Landing = () => {
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [scrollProgress, setScrollProgress] = useState(0);

  interface TimelineEntry {
    title: string;
    content: React.ReactNode;
  }

  const timelineData: TimelineEntry[] = [
    {
      title: "How It Works",
      content: (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <p className="text-neutral-700 dark:text-neutral-300">
          Our system combines UDP ping validation with Solana staking
              mechanics to create a robust and reliable location verification
              system.
          </p>
        </div>
      ),
    },
    {
      title: "Claim a Location",
      content: (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <p className="text-neutral-700 dark:text-neutral-300">
          Users submit location proofs via UDP pings to the network,
          creating a verifiable claim that can be validated by others.
          </p>
        </div>
      ),
    },
    {
      title: "Validate Others",
      content: (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <p className="text-neutral-700 dark:text-neutral-300">
          Validators confirm location claims by measuring RTT (Round
            Trip Time) through decentralized verification processes.
          </p>
        </div>
      ),
    },
    {
      title: "Earn Rewards",
      content: (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all duration-300">
          <p className="text-neutral-700 dark:text-neutral-300">
          Validators and validated users receive Buffalu tokens as
          rewards for participating honestly in the network.
          </p>
        </div>
      ),
    },
  ];
  

  // Toggle dark mode and save preference
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  };

  // Initialize dark mode based on user preference
  useEffect(() => {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const savedMode = localStorage.getItem("darkMode");

    if (savedMode !== null) {
      setDarkMode(savedMode === "true");
      document.documentElement.classList.toggle("dark", savedMode === "true");
    } else if (prefersDark) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Handle scroll events for animations and active section tracking
  useEffect(() => {
    const handleScroll = () => {
      // Calculate scroll progress for progress bar
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);

      // Determine active section based on scroll position
      const sections = [
        "home",
        "how-it-works",
        "why-buffalu",
        "rewards",
        "use-cases",
      ];
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Loading states for the loader
  const loadingStates = [
    "Connecting to the network",
    "Verifying location",
    "Calculating RTT",
    "Checking validators",
    "Submitting to blockchain",
    "Transaction pending",
    "Location verified!",
    "Rewards distributed",
  ];

  // Improved loader component
  const SimpleLoader = ({
    loading,
    loadingStates,
  }: {
    loading: boolean;
    loadingStates: string[];
  }) => {
    const [currentState, setCurrentState] = useState(0);

    React.useEffect(() => {
      if (loading) {
        const interval = setInterval(() => {
          setCurrentState((prev) =>
            prev < loadingStates.length - 1 ? prev + 1 : 0
          );
        }, 1500);

        return () => clearInterval(interval);
      } else {
        setCurrentState(0);
      }
    }, [loading, loadingStates.length]);

    if (!loading) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50 transition-all duration-300">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
          <div className="mb-6">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500 ease-in-out"
                style={{
                  width: `${
                    ((currentState + 1) / loadingStates.length) * 100
                  }%`,
                }}
              />
            </div>
          </div>
          <div className="flex items-center justify-center mb-4">
            <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-center font-medium text-lg dark:text-white mb-2">
            {loadingStates[currentState]}
          </p>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">
            Step {currentState + 1} of {loadingStates.length}
          </p>
          <button
            className="w-full py-2 rounded-lg text-blue-500 hover:text-blue-700 text-sm hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => setLoading(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-hidden min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300 relative">
      {/* Scroll Progress Indicator */}
      <div
        className="fixed top-0 left-0 h-1 bg-white z-50 transition-all duration-300"
        style={{ width: `${scrollProgress}%` }}
      />

      <BuffaluNavbar/>

      {/* Hero Section with Magic UI Globe */}
      <div
        id="home"
        className="relative bg-black dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-white overflow-hidden pt-24 pb-32"
      >
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
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-full h-full opacity-30 dark:opacity-10 pointer-events-none">
            {/* Animated grid background */}
            {/* <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern
                  id="grid"
                  width="10"
                  height="10"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 10 0 L 0 0 0 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg> */}
          </div>
          {/* Animated circles */}
          {/* <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-hard-light filter blur-3xl opacity-10 animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-400 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-hard-light filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-400 dark:bg-cyan-600 rounded-full mix-blend-multiply dark:mix-blend-hard-light filter blur-3xl opacity-10 animate-blob animation-delay-4000" /> */}
        </div>

        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/40 mb-8 shadow-sm">
              <GlobeIcon className="w-4 h-4 text-blue-500" />
              <span className="text-blue-500 dark:text-blue-400 text-sm font-medium">
                Decentralized Location Verification
              </span>
            </div>

            {/* Magic UI Globe positioned behind the text */}
            <div className="relative">
              {/* Globe positioned behind the text */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden z-0">
                {/* <Globe className="scale-150 opacity-60 dark:opacity-40" /> */}
                <div className="absolute inset-0 bg-transparent" />
              </div>

              {/* Text content on top of the Globe */}
              <div className="relative z-10">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 tracking-tight">
                  Buffalu: The Future of{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                    Proof-of-Location
                  </span>
                </h1>

                <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
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
                    className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-blue-500/25 px-8 py-4 rounded-xl font-medium transition-all duration-200 inline-flex items-center w-full sm:w-auto justify-center transform hover:-translate-y-1"
                  >
                    Join the Network
                    <ChevronRight className="ml-2 w-5 h-5" />
                  </button>
                  <button
                    onClick={() => window.open("/whitepaper.pdf", "_blank")}
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg hover:shadow-gray-300/25 dark:hover:shadow-gray-700/25 px-8 py-4 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700 inline-flex items-center w-full sm:w-auto justify-center transform hover:-translate-y-1"
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
        {/* Enhanced Network Visualization */}
        <div className="container mx-auto px-6 mt-24 relative">
  <div className="h-96 relative rounded-2xl overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 shadow-2xl">
    {/* Background effects */}
    <div className="absolute inset-0 bg-black opacity-40 z-0"></div>
    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600 opacity-5 rounded-full blur-3xl"></div>
    <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-purple-600 opacity-5 rounded-full blur-3xl"></div>
    
    <div className="absolute inset-0 flex items-center justify-center z-10">
      <div className="relative w-full h-full">
        {/* Animated nodes with improved styling */}
        <div className="absolute top-1/4 left-1/4 flex flex-col items-center">
          <div className="w-5 h-5 bg-blue-500 rounded-full mb-2 shadow-lg shadow-blue-500/50 animate-pulse"></div>
          <div className="bg-gray-900 bg-opacity-80 text-blue-400 text-xs font-medium px-3 py-1 rounded-md shadow-lg backdrop-blur-sm border border-gray-800">
            Node 1
          </div>
        </div>

        <div className="absolute top-1/3 right-1/4 flex flex-col items-center">
          <div
            className="w-5 h-5 bg-purple-500 rounded-full mb-2 shadow-lg shadow-purple-500/50 animate-pulse"
            style={{ animationDelay: "0.5s" }}
          ></div>
          <div className="bg-gray-900 bg-opacity-80 text-purple-400 text-xs font-medium px-3 py-1 rounded-md shadow-lg backdrop-blur-sm border border-gray-800">
            Node 2
          </div>
        </div>

        <div className="absolute bottom-1/3 left-1/3 flex flex-col items-center">
          <div
            className="w-5 h-5 bg-emerald-500 rounded-full mb-2 shadow-lg shadow-emerald-500/50 animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div className="bg-gray-900 bg-opacity-80 text-emerald-400 text-xs font-medium px-3 py-1 rounded-md shadow-lg backdrop-blur-sm border border-gray-800">
            Node 3
          </div>
        </div>

        <div className="absolute bottom-1/4 right-1/3 flex flex-col items-center">
          <div
            className="w-5 h-5 bg-amber-500 rounded-full mb-2 shadow-lg shadow-amber-500/50 animate-pulse"
            style={{ animationDelay: "1.5s" }}
          ></div>
          <div className="bg-gray-900 bg-opacity-80 text-amber-400 text-xs font-medium px-3 py-1 rounded-md shadow-lg backdrop-blur-sm border border-gray-800">
            Node 4
          </div>
        </div>

        {/* Improved animated connection lines with data packets */}
        <svg
          className="w-full h-full"
          viewBox="0 0 800 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Connection lines with improved styling */}
          <path
            d="M200 100 L 600 300"
            stroke="rgba(59, 130, 246, 0.3)"
            strokeWidth="1"
            strokeDasharray="4,6"
          >
            <animate
              attributeName="stroke-opacity"
              values="0.2;0.4;0.2"
              dur="8s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M200 300 L 600 100"
            stroke="rgba(139, 92, 246, 0.3)"
            strokeWidth="1"
            strokeDasharray="4,6"
          >
            <animate
              attributeName="stroke-opacity"
              values="0.2;0.4;0.2"
              dur="7s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M100 200 L 700 200"
            stroke="rgba(16, 185, 129, 0.3)"
            strokeWidth="1"
            strokeDasharray="4,6"
          >
            <animate
              attributeName="stroke-opacity"
              values="0.2;0.4;0.2"
              dur="9s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M300 50 L 500 350"
            stroke="rgba(245, 158, 11, 0.3)"
            strokeWidth="1"
            strokeDasharray="4,6"
          >
            <animate
              attributeName="stroke-opacity"
              values="0.2;0.4;0.2"
              dur="10s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M300 350 L 500 50"
            stroke="rgba(59, 130, 246, 0.3)"
            strokeWidth="1"
            strokeDasharray="4,6"
          >
            <animate
              attributeName="stroke-opacity"
              values="0.2;0.4;0.2"
              dur="11s"
              repeatCount="indefinite"
            />
          </path>

          {/* Animated data packets with glow effect */}
          <circle r="3" fill="#3B82F6">
            <animateMotion
              path="M200 100 L 600 300"
              dur="4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;0.9;0"
              dur="4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="r"
              values="2;3;2"
              dur="4s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="3" fill="#8B5CF6">
            <animateMotion
              path="M600 100 L 200 300"
              dur="5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;0.9;0"
              dur="5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="r"
              values="2;3;2"
              dur="5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="3" fill="#10B981">
            <animateMotion
              path="M100 200 L 700 200"
              dur="6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;0.9;0"
              dur="6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="r"
              values="2;3;2"
              dur="6s"
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Additional data packets for more visual interest */}
          <circle r="3" fill="#F59E0B">
            <animateMotion
              path="M300 50 L 500 350"
              dur="4.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;0.9;0"
              dur="4.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="r"
              values="2;3;2"
              dur="4.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="3" fill="#3B82F6">
            <animateMotion
              path="M500 50 L 300 350"
              dur="5.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;0.9;0"
              dur="5.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="r"
              values="2;3;2"
              dur="5.5s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>
    </div>
    
    {/* Subtle grid overlay for depth */}
    <div className="absolute inset-0 opacity-5" style={{ 
      backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
      backgroundSize: "20px 20px" 
    }}></div>
  </div>
</div>
      </div>

      {/* How It Works Section - Enhanced with animations */}
       <HowItWorks/>

      {/* Why Buffalu Section - Enhanced with hover effects */}
      <Timeline data={timelineData}/>
      {/* Rewards Section - Replaced with step-by-step instructions */}
    <DarkRewardsSection/>

      {/* Use Cases Section - Enhanced with animation */}
      <UseCasesSection/>

      {/* CTA Section
      <div className="py-20 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Join the Buffalu Network Today
          </h2>
          <p className="text-lg opacity-90 mb-10 max-w-2xl mx-auto">
            Become part of the decentralized location verification revolution.
            Earn rewards, help build the network, and explore new possibilities.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <button
              onClick={() =>
                window.open("https://discord.gg/buffalu", "_blank")
              }
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-white/20 transform hover:-translate-y-1 inline-flex items-center"
            >
              Join Discord
              <MessageSquare className="ml-2 w-5 h-5" />
            </button>
            <button
              onClick={() =>
                window.open("https://github.com/evadshell", "_blank")
              }
              className="bg-transparent text-white border-2 border-white hover:bg-white/10 px-8 py-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-white/20 transform hover:-translate-y-1 inline-flex items-center"
            >
              GitHub Repo
              <Github className="ml-2 w-5 h-5" />
            </button>
            <button
              onClick={() => window.open("https://x.com/evadsh3ll", "_blank")}
              className="bg-transparent text-white border-2 border-white hover:bg-white/10 px-8 py-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-white/20 transform hover:-translate-y-1 inline-flex items-center"
            >
              Follow Us
              <Twitter className="ml-2 w-5 h-5" />
            </button>
          </div>
        </div>
      </div> */}
      {/* Footer */}
      
     <Footer/>
    </div>
  );
};

export default Landing;
