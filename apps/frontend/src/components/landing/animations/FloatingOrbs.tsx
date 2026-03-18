"use client";

import { motion } from "framer-motion";

export function FloatingOrbs() {
  return (
    <div className="floating-orbs" aria-hidden="true">
      {/* Large orb - top left */}
      <motion.div
        className="floating-orb floating-orb--lg floating-orb--primary"
        animate={{
          x: [0, 30, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
      />

      {/* Medium orb - center */}
      <motion.div
        className="floating-orb floating-orb--md floating-orb--secondary"
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
        }}
      />

      {/* Small orb - bottom right */}
      <motion.div
        className="floating-orb floating-orb--sm floating-orb--accent"
        animate={{
          x: [0, 50, 0],
          y: [0, 20, 0],
          rotate: [0, 360],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
        }}
      />
    </div>
  );
}
