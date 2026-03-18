"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface ParallaxSectionProps {
  children: React.ReactNode;
  offset?: number;
  className?: string;
}

export function ParallaxSection({
  children,
  offset = 50,
  className,
}: ParallaxSectionProps) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

interface RevealOnScrollProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
}

export function RevealOnScroll({
  children,
  duration = 0.6,
  delay = 0,
}: RevealOnScrollProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

interface GradientTextProps {
  children: React.ReactNode;
  gradientFrom?: string;
  gradientTo?: string;
  animate?: boolean;
}

export function GradientText({
  children,
  gradientFrom = "#22c55e",
  gradientTo = "#3b82f6",
  animate = true,
}: GradientTextProps) {
  return (
    <motion.span
      className="gradient-text"
      style={{
        background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
      animate={
        animate
          ? {
              backgroundPosition: ["0%", "100%", "0%"],
            }
          : {}
      }
      transition={
        animate
          ? {
              duration: 3,
              repeat: Infinity,
            }
          : {}
      }
    >
      {children}
    </motion.span>
  );
}
