"use client";

import { useState, useEffect } from "react";
import { ResponsiveContainer } from "recharts";

interface ChartWrapperProps {
  children: React.ReactNode;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function ChartWrapper({ 
  children, 
  width = "100%", 
  height = 300, 
  className 
}: ChartWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div 
        className={`animate-pulse bg-gray-200 rounded ${className}`}
        style={{ width, height }}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading chart...</div>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width={width} height={height} className={className}>
      {children}
    </ResponsiveContainer>
  );
} 