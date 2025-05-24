import { cn } from "@/lib/utils";

export const SkeletonBox = ({ className = "" }) => (
  <div className={cn(`bg-gray-200 animate-pulse rounded`, className)} />
);
