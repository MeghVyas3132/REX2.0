"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface HoverGlowCardProps {
  children: ReactNode;
  className?: string;
}

export function HoverGlowCard({ children, className }: HoverGlowCardProps) {
  return (
    <motion.div
      className={`hover-glow-card ${className || ""}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      whileHover={{
        y: -8,
      }}
      transition={{
        duration: 0.5,
      }}
    >
      <motion.div
        className="card-glow"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      {children}
    </motion.div>
  );
}

interface AnimatedBorderProps {
  children: ReactNode;
  borderColor?: string;
}

export function AnimatedBorder({
  children,
  borderColor = "rgba(34, 197, 94, 0.3)",
}: AnimatedBorderProps) {
  return (
    <motion.div
      className="animated-border-wrapper"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <motion.div
        className="animated-border"
        style={{ borderColor }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        animate={{
          borderColor: [
            "rgba(34, 197, 94, 0.1)",
            "rgba(59, 130, 246, 0.3)",
            "rgba(34, 197, 94, 0.1)",
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

interface TimelineItemProps {
  step: string;
  detail: string;
  index: number;
  isActive?: boolean;
}

export function AnimatedTimelineItem({
  step,
  detail,
  index,
  isActive,
}: TimelineItemProps) {
  return (
    <motion.div
      className={`timeline-item ${isActive ? "is-active" : ""}`}
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
      }}
    >
      <motion.div
        className="timeline-dot"
        whileHover={{ scale: 1.3, boxShadow: "0 0 20px rgba(34, 197, 94, 0.6)" }}
        animate={
          isActive
            ? {
                boxShadow: [
                  "0 0 10px rgba(34, 197, 94, 0.4)",
                  "0 0 20px rgba(34, 197, 94, 0.8)",
                  "0 0 10px rgba(34, 197, 94, 0.4)",
                ],
              }
            : {}
        }
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      />
      <div className="timeline-content">
        <p className="timeline-step">{step}</p>
        <p className="timeline-detail">{detail}</p>
      </div>
    </motion.div>
  );
}
