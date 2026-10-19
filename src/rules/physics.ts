import { SpringPhysicsPreset } from "../types/schema";

export interface SpringConfig {
  mass: number;
  damping: number;
  stiffness: number;
  overshootClamping?: boolean;
}

/**
 * 60 FPS Spring Configurations
 * Calibrated specifically for high-framerate rendering with natural physical feel.
 */
export const SPRING_PRESETS: Record<SpringPhysicsPreset, SpringConfig> = {
  // Snappy: Quick reaction, tight settling, high energy
  snappy: {
    mass: 0.5,
    damping: 14,
    stiffness: 220,
    overshootClamping: false,
  },

  // Bouncy: Elastic pop, noticeable joyful overshoot
  bouncy: {
    mass: 0.8,
    damping: 10,
    stiffness: 130,
    overshootClamping: false,
  },

  // Smooth: Silky fluid motion, subtle deceleration, modern UI feel
  smooth: {
    mass: 1.0,
    damping: 20,
    stiffness: 100,
    overshootClamping: false,
  },

  // Cinematic: Elegant heavy feel, slow luxurious drift
  cinematic: {
    mass: 1.4,
    damping: 28,
    stiffness: 60,
    overshootClamping: true,
  },
};

export const getSpringConfig = (preset: SpringPhysicsPreset = "bouncy"): SpringConfig => {
  return SPRING_PRESETS[preset] || SPRING_PRESETS.bouncy;
};
