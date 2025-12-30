"use client";

import Image from "next/image";
import Link from "next/link";
import { Playfair_Display, Poppins } from "next/font/google";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CardStack } from "../components/ui/card-stack";
import { QuickMenu } from "./quick-menu";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"], // Regular and Semibold
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"], // Bold
});

function CardStackDemo() {
  return (
    <div className="flex items-center justify-center w-full pt-24">
      <CardStack items={CARDS} />
    </div>
  );
}

const CARDS = [
  {
    id: 0,
    name: "Urban Explorer",
    designation: "Sold Out +15,000",
    content: (
      <Image
        src="/234.jpg"
        alt="Fashion Look 1"
        fill
        style={{ objectFit: "cover" }}
        className="rounded-3xl"
      />
    ),
  },
  {
    id: 1,
    name: "Midnight Gala",
    designation: "Sold Out +25,000",
    content: (
      <Image
        src="/Shoes-Men.jpg"
        alt="Fashion Look 2"
        fill
        style={{ objectFit: "cover" }}
        className="rounded-3xl"
      />
    ),
  },
  {
    id: 2,
    name: "Casual Chic",
    designation: "Sold Out +45,000",
    content: (
      <Image
        src="/Kaidifeiniroo-K015-Wholesale-Designer-Bags-Women-Famous-Brands-Luxury-Designer-Fashion-Lady-Handbag-for-Women.avif"
        alt="Fashion Look 3"
        fill
        style={{ objectFit: "cover" }}
        className="rounded-3xl"
      />
    ),
  },
];

export default function FashionLandingPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const dynamicContent = [
    {
      title: "Your Style, Reimagined.",
      subtitle: "Discover unique pieces from our exclusive collection.",
    },
    {
      title: "Exclusive Collections.",
      subtitle: "Hand-picked items you won't find anywhere else.",
    },
    {
      title: "Find Your Perfect Outfit.",
      subtitle: "From casual wear to evening elegance, we have it all.",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % dynamicContent.length);
    }, 4000); // Change text every 4 seconds for a more relaxed pace

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [dynamicContent.length]);

  return (
    <div className={`min-h-screen text-white relative overflow-hidden ${poppins.className}`}>
      {/* Logo */}
      <motion.div
        className={`absolute top-0 left-0 z-20 p-8 ${playfair.className}`}
      >
        <Link href="/" className="hover:opacity-80 transition-opacity flex">
          {"RHEN".split("").map((letter, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
              className="text-4xl font-black uppercase text-white"
              style={{ marginRight: index !== 3 ? "0.2em" : 0 }}
            >
              {letter}
            </motion.span>
          ))}
        </Link>
      </motion.div>

      {/* Quick Menu Modal */}
      <QuickMenu />

      {/* Hero Image */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-b from-red-500 to-red-800" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between items-center p-8 pb-12">
        <CardStackDemo />

        <div className="w-full max-w-2xl text-left">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="mb-8 h-40"
          >
            <h1
              className={`text-5xl md:text-7xl font-bold tracking-tight ${playfair.className}`}
            >
              {dynamicContent[currentIndex].title}
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeInOut" }}
              className="mt-4 text-lg md:text-xl text-red-100 max-w-2xl"
            >
              {dynamicContent[currentIndex].subtitle}
            </motion.p>
          </motion.div>
        </AnimatePresence>
        {/* Get Started Button */}
        <Link href="/signup">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.5, delay: 0.2, ease: "easeInOut" },
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{
              // This transition is for the repeating pulse animation
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            className="px-8 py-4 bg-white text-red-700 font-semibold rounded-full shadow-md hover:bg-gray-100 transition-colors tracking-wide inline-block cursor-pointer"
          >
            Get Started
          </motion.div>
        </Link>
        </div>
      </div>
    </div>
  );
}