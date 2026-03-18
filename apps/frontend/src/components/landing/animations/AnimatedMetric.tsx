"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

interface AnimatedMetricProps {
  value: string | number;
  label: string;
  hint?: string;
  index?: number;
}

export function AnimatedMetric({
  value,
  label,
  hint,
  index = 0,
}: AnimatedMetricProps) {
  const numValue = typeof value === "string" 
    ? parseInt(value.replace("%", "").replace("+", "")) 
    : value;
  
  const motionValue = useMotionValue(0);
  const displayValue = useTransform(motionValue, (v) => {
    if (typeof value === "string" && value.includes("%")) {
      return `${Math.floor(v)}%`;
    }
    if (typeof value === "string" && value.includes("K")) {
      return `${(v / 1000).toFixed(0)}K+`;
    }
    return Math.floor(v).toString();
  });

  useEffect(() => {
    const controls = animate(motionValue, numValue, {
      duration: 2.5,
      delay: index * 0.15,
    });

    return () => controls.stop();
  }, [motionValue, numValue, index]);

  return (
    <motion.div
      className="animated-metric"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
      }}
    >
      <motion.p className="metric-value">
        {displayValue}
      </motion.p>
      <h3 className="metric-label">{label}</h3>
      {hint && <p className="metric-hint">{hint}</p>}
      
      <motion.div
        className="metric-pulse"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: 0.5,
        }}
      />
    </motion.div>
  );
}
