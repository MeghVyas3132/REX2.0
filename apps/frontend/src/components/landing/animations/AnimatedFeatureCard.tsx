"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedFeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  index?: number;
}

export function AnimatedFeatureCard({
  icon,
  title,
  description,
  index = 0,
}: AnimatedFeatureCardProps) {
  return (
    <motion.div
      className="animated-feature-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
      }}
      whileHover={{
        y: -8,
        transition: { duration: 0.3 },
      }}
    >
      <motion.div
        className="feature-card-icon"
        whileHover={{
          scale: 1.15,
          rotate: 5,
          transition: { duration: 0.3 },
        }}
      >
        {icon}
      </motion.div>

      <h3 className="feature-card-title">{title}</h3>
      <p className="feature-card-desc">{description}</p>

      <motion.div
        className="feature-card-border"
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.4 }}
      />
    </motion.div>
  );
}
