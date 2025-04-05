"use client";
import { cn } from "../../lib/utils";
import { 
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import Link from "next/link";
import React, { useRef, useState } from "react";
import { Shield, Sun, Moon, ArrowRight, Menu, X } from "lucide-react";

const BuffaluNavbar = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [darkMode, setDarkMode] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [visible, setVisible] = useState<boolean>(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const navItems = [
    { name: "Home", link: "#home" },
    { name: "How It Works", link: "#how-it-works" },
    { name: "Why Buffalu", link: "#why-buffalu" },
    { name: "Rewards", link: "#rewards" },
    { name: "Use Cases", link: "#use-cases" }
  ];

  return (
    <>
      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 bg-black text-white z-50 flex flex-col p-6"
          >
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center space-x-2">
                <Shield className="w-7 h-7 text-white" />
                <span className="text-2xl font-bold text-white">Buffalu</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            <div className="flex flex-col space-y-6 text-xl">
              {navItems.map((item, idx) => (
                <Link
                  key={`mobile-${idx}`}
                  href={item.link}
                  onClick={() => {
                    setActiveSection(item.link.substring(1));
                    setMobileMenuOpen(false);
                  }}
                  className={`${
                    activeSection === item.link.substring(1) ? "text-white font-bold border-b border-white pb-1" : "text-gray-400"
                  } hover:text-white transition-colors`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="mt-auto pt-6 border-t border-gray-800">
              <button
                onClick={toggleDarkMode}
                className="w-full py-3 rounded-lg border border-gray-800 flex items-center justify-center space-x-2 hover:bg-gray-900 transition-colors"
              >
                {darkMode ? (
                  <>
                    <Sun className="w-5 h-5 text-white" />
                    <span className="text-white">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-5 h-5 text-white" />
                    <span className="text-white">Dark Mode</span>
                  </>
                )}
              </button>
              <button className="w-full py-3 mt-4 rounded-none bg-white text-black flex items-center justify-center space-x-2 hover:bg-gray-200 transition-colors">
                <span>Launch App</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resizable Navbar */}
      <motion.div
        ref={ref}
        className="sticky inset-x-0 top-0 z-40 w-full"
      >
        {/* Desktop Navbar */}
        <motion.nav
          animate={{
            backdropFilter: visible ? "blur(10px)" : "none",
            boxShadow: visible
              ? "0 4px 30px rgba(0, 0, 0, 0.1)"
              : "none",
            width: visible ? "85%" : "100%", 
            y: visible ? 16 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 30,
          }}
          className={cn(
            "mx-auto hidden lg:flex relative z-30 py-4 px-8",
            visible 
              ? "bg-black/80 border border-gray-800 rounded-md" 
              : "bg-black border-b border-gray-800"
          )}
        >
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center space-x-2">
              <Shield className="w-7 h-7 text-white" />
              <span className="text-xl font-bold text-white">Buffalu</span>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              <div className="relative flex items-center justify-center space-x-6">
                {navItems.map((item, idx) => {
                  const isActive = activeSection === item.link.substring(1);
                  return (
                    <Link
                      key={`desktop-${idx}`}
                      href={item.link}
                      onClick={() => setActiveSection(item.link.substring(1))}
                      className="relative px-4 py-2 text-sm font-medium tracking-wider uppercase rounded-md transition-all duration-200 hover:bg-gray-800"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeSection"
                          className="absolute bottom-0 left-0 w-full h-0.5 bg-white rounded-full"
                          transition={{ duration: 0.2 }}
                        />
                      )}
                      <span className={cn(
                        "relative z-10",
                        isActive
                          ? "text-white"
                          : "text-gray-400 hover:text-white"
                      )}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <button
                onClick={toggleDarkMode}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-white" />
                ) : (
                  <Moon className="w-5 h-5 text-white" />
                )}
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                className="bg-white text-black px-6 py-2 rounded-md font-medium tracking-wide uppercase text-sm hover:bg-gray-200 transition-colors"
                onClick={() => (window.location.href = "/dashboard")}
              >
                Launch App
              </motion.button>
            </div>
          </div>
        </motion.nav>

        {/* Mobile Navbar */}
        <motion.nav
          animate={{
            backdropFilter: visible ? "blur(10px)" : "none",
            boxShadow: visible
              ? "0 4px 30px rgba(0, 0, 0, 0.1)"
              : "none",
            width: visible ? "92%" : "100%", 
            y: visible ? 16 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 30,
          }}
          className={cn(
            "mx-auto flex lg:hidden relative z-30 p-4", 
            visible 
              ? "bg-black/80 border border-gray-800 rounded-md" 
              : "bg-black border-b border-gray-800"
          )}
        >
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-white" />
              <span className="text-lg font-bold text-white">Buffalu</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-white" />
                ) : (
                  <Moon className="w-5 h-5 text-white" />
                )}
              </button>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </motion.nav>
      </motion.div>
    </>
  );
};

export default BuffaluNavbar;