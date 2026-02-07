import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "inverted"; // Kept for compatibility, but unused for the image
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  return (
    <div className={cn("relative flex-shrink-0", className)} style={{ width: sizeMap[size], height: sizeMap[size] }}>
      <Image
        src="/odoologo.png"
        alt="LearnSphere Logo"
        width={sizeMap[size]}
        height={sizeMap[size]}
        className="object-contain"
        priority
      />
    </div>
  );
}
