import React from "react";
import {
  Sparkles,
  Zap,
  Rocket,
  Shield,
  TrendingUp,
  Cpu,
  Layers,
  Gauge,
  Check,
  X,
  Code,
  Globe,
  Star,
  Award,
  BarChart3,
  Flame,
  ArrowRight,
  Clock,
  Compass,
  Database,
  Terminal,
  Video,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>> = {
  Sparkles,
  Zap,
  Rocket,
  Shield,
  TrendingUp,
  Cpu,
  Layers,
  Gauge,
  Check,
  X,
  Code,
  Globe,
  Star,
  Award,
  BarChart3,
  Flame,
  ArrowRight,
  Clock,
  Compass,
  Database,
  Terminal,
  Video,
};

interface IconRendererProps {
  name: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export const IconRenderer: React.FC<IconRendererProps> = ({
  name,
  size = 28,
  color = "currentColor",
  style,
}) => {
  const IconComponent = ICON_MAP[name] || Sparkles;
  return <IconComponent size={size} color={color} style={style} />;
};
