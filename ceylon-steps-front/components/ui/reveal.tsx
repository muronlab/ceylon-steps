"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { cn } from "@/lib/utils";

type RevealDirection = "up" | "down" | "left" | "right" | "none";

export type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Direction the element travels in from. Defaults to "up". */
  direction?: RevealDirection;
  /** Travel distance in pixels. Defaults to 24. */
  distance?: number;
  /** Delay before the animation starts, in seconds. */
  delay?: number;
  /** Animation duration, in seconds. Defaults to 0.6. */
  duration?: number;
  /** Replay every time the element enters the viewport. Defaults to once. */
  once?: boolean;
  /** Fraction of the element that must be visible before animating in. */
  amount?: number;
};

function offsetFor(direction: RevealDirection, distance: number) {
  switch (direction) {
    case "up":
      return { y: distance };
    case "down":
      return { y: -distance };
    case "left":
      return { x: distance };
    case "right":
      return { x: -distance };
    default:
      return {};
  }
}

/**
 * Reveals its children with a soft fade + slide as they scroll into view.
 * Honours `prefers-reduced-motion` by falling back to a plain fade.
 */
export function Reveal({
  children,
  className,
  direction = "up",
  distance = 24,
  delay = 0,
  duration = 0.6,
  once = true,
  amount = 0.2,
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  const variants: Variants = {
    hidden: { opacity: 0, ...(reduceMotion ? {} : offsetFor(direction, distance)) },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: reduceMotion ? 0.3 : duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
    >
      {children}
    </motion.div>
  );
}
