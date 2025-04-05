/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
  AnimatePresence,
} from "motion/react";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
  color?: string; // Optional color for customization
}

const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // Calculate which timeline item is currently active based on scroll
    const newActiveIndex = Math.floor(latest * data.length);
    if (newActiveIndex !== activeIndex && newActiveIndex < data.length) {
      setActiveIndex(newActiveIndex);
    }
  });

  // Default gradient colors
  const gradientColors = [
    "from-violet-600 via-indigo-600 to-blue-500",
    "from-blue-600 via-cyan-600 to-teal-500",
    "from-teal-600 via-emerald-600 to-green-500",
    "from-amber-600 via-orange-600 to-red-500",
  ];

  return (
    <div
      className="w-full bg-black text-gray-200 font-sans md:px-10 relative overflow-hidden"
      ref={containerRef}
    >
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="max-w-7xl mx-auto py-20 px-4 md:px-8 lg:px-10 relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-2xl md:text-5xl mb-8 font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500 max-w-4xl"
        >
          Why Buffalu? How Does it work?
        </motion.h2>
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto pb-32">
        {data.map((item, index) => {
          // Determine if this item is active
          const isActive = index === activeIndex;
          const gradientClass = gradientColors[index % gradientColors.length];
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex justify-start pt-16 md:pt-40 md:gap-10"
            >
              <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
                <motion.div 
                  className="h-12 absolute left-3 md:left-3 w-12 rounded-full bg-gray-900 flex items-center justify-center"
                  animate={{ 
                    scale: isActive ? 1.2 : 1,
                    boxShadow: isActive ? "0 0 15px rgba(147, 51, 234, 0.5)" : "none"
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div 
                    className={`h-5 w-5 rounded-full bg-gradient-to-br ${isActive ? gradientClass : "from-gray-700 to-gray-600"}`}
                    animate={{ scale: isActive ? 1.2 : 1 }}
                  />
                </motion.div>
                <motion.h3 
                  className="hidden md:block text-xl md:pl-20 md:text-5xl font-bold"
                  animate={{ 
                    color: isActive ? "#fff" : "#6b7280",
                    textShadow: isActive ? "0 0 8px rgba(147, 51, 234, 0.3)" : "none"
                  }}
                >
                  {item.title}
                </motion.h3>
              </div>

              <div className="relative pl-20 pr-4 md:pl-4 w-full">
                <motion.h3 
                  className="md:hidden block text-2xl mb-4 text-left font-bold"
                  animate={{ 
                    color: isActive ? "#fff" : "#6b7280",
                    textShadow: isActive ? "0 0 8px rgba(147, 51, 234, 0.3)" : "none"
                  }}
                >
                  {item.title}
                </motion.h3>
                <motion.div
                  className="p-6 rounded-xl bg-gray-900/60 backdrop-blur-sm border border-gray-800 shadow-xl"
                  initial={{ opacity: 0.5, y: 20 }}
                  animate={{ 
                    opacity: isActive ? 1 : 0.7, 
                    y: isActive ? 0 : 10,
                    scale: isActive ? 1 : 0.98
                  }}
                  transition={{ duration: 0.4 }}
                >
                  {item.content}
                </motion.div>
              </div>
            </motion.div>
          );
        })}

        {/* Timeline line */}
        <div
          style={{
            height: height + "px",
          }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-gray-700 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] bg-gradient-to-t from-purple-500 via-blue-500 to-cyan-500 from-[0%] via-[50%] rounded-full glow-line"
          />
        </div>
      </div>

      {/* Footer gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-0" />
    </div>
  );
};

export default Timeline;