"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface PremiumButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export function PremiumButton({
  variant = "primary",
  size = "md",
  children,
  href,
  onClick,
  className = "",
}: PremiumButtonProps) {
  const baseClasses = `premium-button premium-button--${variant} premium-button--${size} ${className}`;

  const buttonContent = (
    <motion.button
      className={baseClasses}
      onClick={onClick}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      whileTap={{
        scale: 0.98,
        transition: { duration: 0.1 },
      }}
    >
      <motion.span
        className="button-content"
        initial={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.span>

      {/* Shine effect */}
      <motion.div
        className="button-shine"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.6 }}
      />

      {/* Gradient border */}
      <motion.div
        className="button-border"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );

  if (href) {
    return (
      <Link href={href} className="rex-link-reset">
        {buttonContent}
      </Link>
    );
  }

  return buttonContent;
}
