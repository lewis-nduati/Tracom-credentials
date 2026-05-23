"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCelebrationStore } from "~/stores/celebration-store";
import { AndamioHeading, AndamioText, AndamioButton } from "~/components/andamio";
import { CelebrateIcon, StarIcon, SparkleIcon, CloseIcon } from "~/components/icons";
import { cn } from "~/lib/utils";
import type { IconComponent } from "~/types/ui";

interface Particle {
  id: number;
  x: number;
  y: number;
  icon: IconComponent;
  color: string;
  size: number;
}

/**
 * Standardized celebration component for Andamio.
 * Provides high-impact visual feedback for "Moments of Commitment."
 * 
 * Features:
 * - Particle burst effect using Framer Motion
 * - Central achievement card with title and description
 * - Accessible and respects prefers-reduced-motion
 * - Global trigger via useCelebrationStore
 */
export function AndamioCelebration() {
  const { active, dismiss } = useCelebrationStore();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (active) {
      // Generate random particles for the burst
      const icons = [CelebrateIcon, StarIcon, SparkleIcon];
      const colors = ["text-primary", "text-success", "text-info", "text-warning"];
      const newParticles: Particle[] = Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        icon: icons[Math.floor(Math.random() * icons.length)] ?? CelebrateIcon,
        color: colors[Math.floor(Math.random() * colors.length)] ?? "text-primary",
        size: Math.random() * 20 + 10,
      }));
      setParticles(newParticles);
    }
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden">
          {/* Backdrop blur (minimal) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/20 backdrop-blur-[2px]"
          />

          {/* Particle Burst */}
          <div className="relative">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1.2, 1, 0.5],
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: 2.5,
                  ease: "easeOut",
                }}
                className={cn("absolute pointer-events-none", p.color)}
                style={{ width: p.size, height: p.size }}
              >
                <p.icon className="w-full h-full" />
              </motion.div>
            ))}
          </div>

          {/* Central Card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="relative pointer-events-auto bg-card border shadow-2xl rounded-sm p-8 max-w-sm w-full mx-4 flex flex-col items-center text-center gap-4"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-primary/10">
              {active.icon ?? <CelebrateIcon className="h-7 w-7 text-primary animate-bounce" />}
            </div>

            <div className="space-y-2">
              <AndamioHeading level={2} size="xl" className="tracking-tight">
                {active.title}
              </AndamioHeading>
              {active.description && (
                <AndamioText variant="muted" className="text-sm">
                  {active.description}
                </AndamioText>
              )}
            </div>

            {active.action && (
              <AndamioButton
                onClick={() => {
                  active.action?.onClick();
                  dismiss();
                }}
                className="w-full mt-2"
              >
                {active.action.label}
              </AndamioButton>
            )}

            <button
              onClick={dismiss}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss celebration"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
