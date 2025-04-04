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

const Landing = () => {
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [scrollProgress, setScrollProgress] = useState(0);

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
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300 relative">
      {/* Scroll Progress Indicator */}
      <div
        className="fixed top-0 left-0 h-1 bg-blue-500 z-50 transition-all duration-300"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 bg-white dark:bg-gray-900 z-40 flex flex-col p-6 transition-transform duration-300 transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center space-x-2">
            <Shield className="w-7 h-7 text-blue-500" />
            <span className="text-2xl font-bold">Buffalu</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-col space-y-6 text-xl">
          <a
            href="#home"
            onClick={() => setMobileMenuOpen(false)}
            className={`${
              activeSection === "home" ? "text-blue-500 font-bold" : ""
            } hover:text-blue-500 transition-colors`}
          >
            Home
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className={`${
              activeSection === "how-it-works" ? "text-blue-500 font-bold" : ""
            } hover:text-blue-500 transition-colors`}
          >
            How It Works
          </a>
          <a
            href="#why-buffalu"
            onClick={() => setMobileMenuOpen(false)}
            className={`${
              activeSection === "why-buffalu" ? "text-blue-500 font-bold" : ""
            } hover:text-blue-500 transition-colors`}
          >
            Why Buffalu
          </a>
          <a
            href="#rewards"
            onClick={() => setMobileMenuOpen(false)}
            className={`${
              activeSection === "rewards" ? "text-blue-500 font-bold" : ""
            } hover:text-blue-500 transition-colors`}
          >
            Rewards
          </a>
          <a
            href="#use-cases"
            onClick={() => setMobileMenuOpen(false)}
            className={`${
              activeSection === "use-cases" ? "text-blue-500 font-bold" : ""
            } hover:text-blue-500 transition-colors`}
          >
            Use Cases
          </a>
        </div>
        <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={toggleDarkMode}
            className="w-full py-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {darkMode ? (
              <>
                <Sun className="w-5 h-5" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
          <button className="w-full py-3 mt-4 rounded-lg bg-blue-500 text-white flex items-center justify-center space-x-2 hover:bg-blue-600 transition-colors">
            <span>Launch App</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fixed Navbar */}
      <nav className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Shield className="w-7 h-7 text-blue-500" />
              <span className="text-xl font-bold">Buffalu</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a
                href="#home"
                className={`${
                  activeSection === "home"
                    ? "text-blue-500 font-medium"
                    : "text-gray-700 dark:text-gray-300"
                } hover:text-blue-500 dark:hover:text-blue-400 transition-colors`}
              >
                Home
              </a>
              <a
                href="#how-it-works"
                className={`${
                  activeSection === "how-it-works"
                    ? "text-blue-500 font-medium"
                    : "text-gray-700 dark:text-gray-300"
                } hover:text-blue-500 dark:hover:text-blue-400 transition-colors`}
              >
                How It Works
              </a>
              <a
                href="#why-buffalu"
                className={`${
                  activeSection === "why-buffalu"
                    ? "text-blue-500 font-medium"
                    : "text-gray-700 dark:text-gray-300"
                } hover:text-blue-500 dark:hover:text-blue-400 transition-colors`}
              >
                Why Buffalu
              </a>
              <a
                href="#rewards"
                className={`${
                  activeSection === "rewards"
                    ? "text-blue-500 font-medium"
                    : "text-gray-700 dark:text-gray-300"
                } hover:text-blue-500 dark:hover:text-blue-400 transition-colors`}
              >
                Rewards
              </a>
              <a
                href="#use-cases"
                className={`${
                  activeSection === "use-cases"
                    ? "text-blue-500 font-medium"
                    : "text-gray-700 dark:text-gray-300"
                } hover:text-blue-500 dark:hover:text-blue-400 transition-colors`}
              >
                Use Cases
              </a>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              <button
                className="hidden md:flex bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                onClick={() => (window.location.href = "/dashboard")}
              >
                Launch App
              </button>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Magic UI Globe */}
      <div
        id="home"
        className="relative bg-gradient-to-b from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-white overflow-hidden pt-24 pb-32"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-full h-full opacity-30 dark:opacity-10 pointer-events-none">
            {/* Animated grid background */}
            <svg
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
            </svg>
          </div>
          {/* Animated circles */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400 dark:bg-blue-600 rounded-full mix-blend-multiply dark:mix-blend-hard-light filter blur-3xl opacity-10 animate-blob" />
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-400 dark:bg-purple-600 rounded-full mix-blend-multiply dark:mix-blend-hard-light filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-400 dark:bg-cyan-600 rounded-full mix-blend-multiply dark:mix-blend-hard-light filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
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
                <Globe className="scale-150 opacity-60 dark:opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-b from-blue-50/90 to-white/90 dark:from-gray-800/90 dark:to-gray-900/90" />
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

        {/* Enhanced Network Visualization */}
        <div className="container mx-auto px-6 mt-24 relative">
          <div className="h-80 relative rounded-2xl overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                {/* Animated nodes */}
                <div className="absolute top-1/4 left-1/4 flex flex-col items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mb-1 shadow-lg shadow-blue-500/50 animate-pulse" />
                  <div className="bg-white dark:bg-gray-800 text-xs font-medium px-2 py-1 rounded shadow opacity-75">
                    Node 1
                  </div>
                </div>

                <div className="absolute top-1/3 right-1/4 flex flex-col items-center">
                  <div
                    className="w-4 h-4 bg-purple-500 rounded-full mb-1 shadow-lg shadow-purple-500/50 animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                  />
                  <div className="bg-white dark:bg-gray-800 text-xs font-medium px-2 py-1 rounded shadow opacity-75">
                    Node 2
                  </div>
                </div>

                <div className="absolute bottom-1/3 left-1/3 flex flex-col items-center">
                  <div
                    className="w-4 h-4 bg-green-500 rounded-full mb-1 shadow-lg shadow-green-500/50 animate-pulse"
                    style={{ animationDelay: "1s" }}
                  />
                  <div className="bg-white dark:bg-gray-800 text-xs font-medium px-2 py-1 rounded shadow opacity-75">
                    Node 3
                  </div>
                </div>

                <div className="absolute bottom-1/4 right-1/3 flex flex-col items-center">
                  <div
                    className="w-4 h-4 bg-yellow-500 rounded-full mb-1 shadow-lg shadow-yellow-500/50 animate-pulse"
                    style={{ animationDelay: "1.5s" }}
                  />
                  <div className="bg-white dark:bg-gray-800 text-xs font-medium px-2 py-1 rounded shadow opacity-75">
                    Node 4
                  </div>
                </div>

                {/* Animated connection lines with data packets */}
                <svg
                  className="w-full h-full"
                  viewBox="0 0 800 400"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M200 100 L 600 300"
                    stroke="rgba(59, 130, 246, 0.5)"
                    strokeWidth="1.5"
                    strokeDasharray="5,5"
                  />
                  <path
                    d="M200 300 L 600 100"
                    stroke="rgba(59, 130, 246, 0.5)"
                    strokeWidth="1.5"
                    strokeDasharray="5,5"
                  />
                  <path
                    d="M100 200 L 700 200"
                    stroke="rgba(59, 130, 246, 0.5)"
                    strokeWidth="1.5"
                    strokeDasharray="5,5"
                  />
                  <path
                    d="M300 50 L 500 350"
                    stroke="rgba(59, 130, 246, 0.5)"
                    strokeWidth="1.5"
                    strokeDasharray="5,5"
                  />
                  <path
                    d="M300 350 L 500 50"
                    stroke="rgba(59, 130, 246, 0.5)"
                    strokeWidth="1.5"
                    strokeDasharray="5,5"
                  />

                  {/* Animated data packets */}
                  <circle r="4" fill="#3B82F6">
                    <animateMotion
                      path="M200 100 L 600 300"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle r="4" fill="#8B5CF6">
                    <animateMotion
                      path="M600 100 L 200 300"
                      dur="4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle r="4" fill="#10B981">
                    <animateMotion
                      path="M100 200 L 700 200"
                      dur="5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section - Enhanced with animations */}
      <div id="how-it-works" className="py-28 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 dark:text-white relative inline-block">
              How It Works
              <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-blue-500 rounded-full"></span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg">
              Our system combines UDP ping validation with Solana staking
              mechanics to create a robust and reliable location verification
              system.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group transform transition-all duration-300 hover:-translate-y-2">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all h-full flex flex-col">
                <div className="bg-blue-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4 dark:text-white">
                  Claim a Location
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                  Users submit location proofs via UDP pings to the network,
                  creating a verifiable claim that can be validated by others.
                </p>
                <div className="mt-auto">
                  <span className="text-blue-500 font-medium inline-flex items-center group-hover:translate-x-1 transition-transform duration-300">
                    Learn more <ChevronRight className="ml-1 w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>

            <div className="group transform transition-all duration-300 hover:-translate-y-2">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all h-full flex flex-col">
                <div className="bg-purple-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4 dark:text-white">
                  Validate Others
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                  Validators confirm location claims by measuring RTT (Round
                  Trip Time) through decentralized verification processes.
                </p>
                <div className="mt-auto">
                  <span className="text-purple-500 font-medium inline-flex items-center group-hover:translate-x-1 transition-transform duration-300">
                    Learn more <ChevronRight className="ml-1 w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>

            <div className="group transform transition-all duration-300 hover:-translate-y-2">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all h-full flex flex-col">
                <div className="bg-green-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Coins className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-4 dark:text-white">
                  Earn Rewards
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                  Validators and validated users receive Buffalu tokens as
                  rewards for participating honestly in the network.
                </p>
                <div className="mt-auto">
                  <span className="text-green-500 font-medium inline-flex items-center group-hover:translate-x-1 transition-transform duration-300">
                    Learn more <ChevronRight className="ml-1 w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Process Demo */}
          <div className="mt-24">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4 dark:text-white">
                See the process in action
              </h3>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Click the button below to see a simulation of the location
                verification process.
              </p>
            </div>
            <div className="w-full flex items-center justify-center">
              <button
                onClick={() => setLoading(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white mx-auto transition font-medium duration-300 py-4 px-8 rounded-xl flex items-center justify-center shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-1"
              >
                Simulate Verification
                <Zap className="ml-2 w-5 h-5" />
              </button>
              <SimpleLoader loading={loading} loadingStates={loadingStates} />
            </div>
          </div>
        </div>
      </div>

      {/* Why Buffalu Section - Enhanced with hover effects */}
      <div
        id="why-buffalu"
        className="py-28 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-white"
      >
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 relative inline-block">
              Why Buffalu?
              <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-blue-500 rounded-full"></span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
              Our decentralized system ensures network integrity through
              economic incentives. Honest validators earn rewards while
              malicious actors face penalties.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col">
              <div className="text-blue-500 mb-6">
                <GlobeIcon className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-4">
                Decentralized & Trustless
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                No central authority or trust required - the network validates
                through distributed consensus
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col">
              <div className="text-purple-500 mb-6">
                <Coins className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-4">
                Earn Tokens for Verifications
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get rewarded with Buffalu tokens for every validation you
                perform or receive
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col">
              <div className="text-green-500 mb-6">
                <Zap className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-4">Fast & Scalable</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Built on Solana for lightning-fast transactions and high
                throughput capacity
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col">
              <div className="text-red-500 mb-6">
                <Lock className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-4">Secure By Design</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Economic incentives and advanced cryptography ensure network
                integrity
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rewards Section - Replaced with step-by-step instructions */}
      <div id="rewards" className="py-28 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/40 mb-6">
                <Coins className="w-4 h-4 text-blue-500" />
                <span className="text-blue-500 dark:text-blue-400 text-sm font-medium">
                  Getting Started
                </span>
              </div>
              <h2 className="text-4xl font-bold mb-6 dark:text-white">
                Start Earning Rewards in 6 Simple Steps
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                Follow these straightforward steps to begin your journey with
                Buffalu and start earning rewards by validating locations and
                participating in the network.
              </p>

              <div className="space-y-6 mt-8">
                <div className="flex items-start">
                  <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-lg mr-4 flex-shrink-0">
                    <span className="w-6 h-6 text-blue-500 font-bold flex items-center justify-center">
                      1
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-2 dark:text-white">
                      Go to Dashboard
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Access your Buffalu dashboard to begin the setup process.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-lg mr-4 flex-shrink-0">
                    <span className="w-6 h-6 text-purple-500 font-bold flex items-center justify-center">
                      2
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-2 dark:text-white">
                      Install Server Package
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-blue-500">
                        npm i buffalu-cli
                      </code>
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-green-100 dark:bg-green-900/40 p-2 rounded-lg mr-4 flex-shrink-0">
                    <span className="w-6 h-6 text-green-500 font-bold flex items-center justify-center">
                      3
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-2 dark:text-white">
                      Start the Server
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-green-500">
                        buffalu-cli
                      </code>
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded-lg mr-4 flex-shrink-0">
                    <span className="w-6 h-6 text-yellow-500 font-bold flex items-center justify-center">
                      4
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-2 dark:text-white">
                      Enter Session ID
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Copy the session ID and enter it in the frontend field.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-lg mr-4 flex-shrink-0">
                    <span className="w-6 h-6 text-red-500 font-bold flex items-center justify-center">
                      5
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-2 dark:text-white">
                      Get Validated
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Get validated from available servers in the network.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-cyan-100 dark:bg-cyan-900/40 p-2 rounded-lg mr-4 flex-shrink-0">
                    <span className="w-6 h-6 text-cyan-500 font-bold flex items-center justify-center">
                      6
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-2 dark:text-white">
                      Start Earning
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Begin earning rewards by validating others on the network.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:w-1/2 relative">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-50 pointer-events-none">
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
                        />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid-small)" />
                  </svg>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg animate-pulse">
                      <Zap className="w-10 h-10 text-white" />
                    </div>
                  </div>

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2 dark:text-white">
                      Ready to Start?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Join the Buffalu network and begin earning rewards today
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="space-y-4">
                      <div className="flex items-center justify-center space-x-2">
                        <Shield className="w-5 h-5 text-blue-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Secure Verification
                        </span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <Coins className="w-5 h-5 text-purple-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Instant Rewards
                        </span>
                      </div>
                      <div className="flex items-center justify-center space-x-2">
                        <Users className="w-5 h-5 text-green-500" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Growing Community
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => (window.location.href = "/dashboard")}
                      className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 transform hover:-translate-y-1 flex items-center justify-center"
                    >
                      Go to Dashboard
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases Section - Enhanced with animation */}
      <div
        id="use-cases"
        className="py-28 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 text-gray-900 dark:text-white"
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 relative inline-block">
              Use Cases
              <span className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-blue-500 rounded-full"></span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg">
              Buffalu`s location verification protocol opens up new
              possibilities across various industries and applications.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 dark:text-white">
                Social Applications
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Enable location-based social networks with verifiable check-ins
                and meetups, creating trustless social proof.
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 text-white group-hover:scale-110 transition-transform duration-300">
                <Coins className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 dark:text-white">
                DeFi & Commerce
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create location-based DeFi services and enable geofenced
                commerce with incentives for physical presence.
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 text-white group-hover:scale-110 transition-transform duration-300">
                <GlobeIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 dark:text-white">
                Tourism & Travel
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Verify visits to tourist destinations with rewards for
                exploration and authenticated travel experiences.
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 text-white group-hover:scale-110 transition-transform duration-300">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 dark:text-white">
                Security & Access
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Enhance physical security systems with decentralized location
                verification for secure access control.
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-white group-hover:scale-110 transition-transform duration-300">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 dark:text-white">
                Events & Conferences
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Confirm attendance at events with proof-of-location, enabling
                new types of engagement and rewards.
              </p>
            </div>

            <div className="group bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-white group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4 dark:text-white">
                Gaming & AR
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Power location-based games and augmented reality experiences
                with verifiable real-world interactions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
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
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Shield className="w-7 h-7 text-blue-500" />
                <span className="text-xl font-bold dark:text-white">
                  Buffalu
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                A decentralized location verification protocol built on Solana,
                enabling trustless proof-of-location.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://twitter.com/buffaluprotocol"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Twitter className="w-6 h-6" />
                </a>
                <a
                  href="https://github.com/buffalu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Github className="w-6 h-6" />
                </a>
                <a
                  href="https://discord.gg/buffalu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <MessageSquare className="w-6 h-6" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6 dark:text-white">
                Protocol
              </h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
                  >
                    Tokenomics
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
                  >
                    Validators
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
                  >
                    Whitepaper
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6 dark:text-white">
                Resources
              </h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
                  >
                    API Reference
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
                  >
                    Community
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6 dark:text-white">Legal</h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-500 transition-colors"
                  >
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © {new Date().getFullYear()} Buffalu Protocol. All rights
              reserved.
            </p>
            <div className="flex items-center space-x-2 mt-4 md:mt-0">
              <span className="text-gray-600 dark:text-gray-400 text-sm">
                Built on
              </span>
              <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs px-2 py-1 rounded font-medium">
                Solana
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
