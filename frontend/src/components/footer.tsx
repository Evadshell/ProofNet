import React from 'react'
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
import { Vortex } from './ui/vortex';

function Footer() {
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
          <footer className="bg-white dark:bg-transparent border-t border-gray-200 dark:border-gray-800">
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
          </Vortex>
  )
}

export default Footer