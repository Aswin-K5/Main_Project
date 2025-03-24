
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "right" | "left" | "scale";
}

export const AnimatedCard = ({
  children,
  className,
  delay = 0,
  direction = "up",
}: AnimatedCardProps) => {
  const getAnimationClass = () => {
    switch (direction) {
      case "up":
        return "animate-slide-up";
      case "down":
        return "animate-slide-down";
      case "right":
        return "animate-slide-in-right";
      case "left":
        return "animate-slide-in-right";
      case "scale":
        return "animate-scale-in";
      default:
        return "animate-fade-in";
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg p-6 glass-card",
        getAnimationClass(),
        className
      )}
      style={{ animationDelay: `${delay * 0.1}s` }}
    >
      {children}
    </div>
  );
};
