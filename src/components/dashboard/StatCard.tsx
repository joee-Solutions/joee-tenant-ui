"use client"

import React, { FC, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area } from "recharts";
import { ChartNoAxesColumn } from "lucide-react";
import Link from "next/link";


interface StatCardProps {
  title: string;
  value: number;
  growth: number | null;
  color: 'blue' | 'green' | 'yellow' | 'red';
  icon: React.ReactElement;
  chartData?: Array<{ value: number }>;
  href?: string;
}

const StatCard: FC<StatCardProps> = ({ title, value, growth, color, icon, chartData, href }) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-[#000000]',
      lineColor: 'rgba(10, 49, 97, 0.8)',
      fillColor: 'rgb(217, 225, 232)',
      bgColor: 'bg-[#003465]',
      growthText: 'text-blue-800',
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-900',
      lineColor: 'rgba(34, 197, 94, 0.8)',
      fillColor: 'rgb(200, 241, 179)',
      bgColor: 'bg-[#3fa907]',
      growthText: 'text-green-800',
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-900',
      lineColor: 'rgba(234, 179, 8, 0.8)',
      fillColor: 'rgb(253, 243, 176)',
      bgColor: 'bg-[#fad902]',
      growthText: 'text-yellow-800',
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-900',
      lineColor: 'rgba(239, 68, 68, 0.8)',
      fillColor: 'rgb(252, 218, 218)',
      bgColor: 'bg-[#ec090a]',
      growthText: 'text-red-800',
    },
  };

  const colors = colorMap[color];

  // Use real chart data if provided, otherwise generate trend based on growth rate
  // Growth shows the rate of change - this determines the trend direction
  const data = useMemo(() => {
    // If API provides real trend data, use it
    if (chartData && chartData.length > 0) {
      return chartData;
    }
    
    // Generate trend based on growth rate (not absolute value)
    // Growth tells us if we're growing fast/slow, which determines trend direction
    const currentValue = value || 0;
    const growthRate = growth !== null ? growth : 0;
    
    // Calculate trend points based on growth rate
    // Positive growth = upward trend, Negative growth = downward trend, Zero = flat
    const trendPoints = 6;
    const trendData: Array<{ value: number }> = [];
    
    if (growthRate > 0) {
      // Growing: upward trend ending at current value
      // Start lower and gradually increase
      for (let i = 0; i < trendPoints; i++) {
        const progress = i / (trendPoints - 1); // 0 to 1
        // Start at ~80% of current, end at 100%
        const trendValue = currentValue * (0.8 + (progress * 0.2));
        trendData.push({ value: Math.max(0, Math.round(trendValue)) });
      }
    } else if (growthRate < 0) {
      // Declining: downward trend ending at current value
      // Start higher and gradually decrease
      for (let i = 0; i < trendPoints; i++) {
        const progress = i / (trendPoints - 1); // 0 to 1
        // Start at ~120% of current, end at 100%
        const trendValue = currentValue * (1.2 - (progress * 0.2));
        trendData.push({ value: Math.max(0, Math.round(trendValue)) });
      }
    } else {
      // Stable: relatively flat trend around current value
      // Small variations to show stability (deterministic, not random)
      for (let i = 0; i < trendPoints; i++) {
        const variation = currentValue * 0.03; // 3% variation
        // Create small wave pattern: low -> high -> low -> high -> current
        const wave = Math.sin((i / trendPoints) * Math.PI * 2) * variation;
        const trendValue = currentValue + wave;
        trendData.push({ value: Math.max(0, Math.round(trendValue)) });
      }
    }
    
    return trendData;
  }, [chartData, value, growth]);

  return (


    <div className=" rounded-lg my-8 shadow-xl hover:shadow-2xl relative overflow-hidden bg-white h-[300px] p-0">

    <div className=" p-4 flex flex-col space-y-4">
      {href ? (
        <Link href={href}>
          <h3 className="text-black text-[16px] font-medium hover:text-[#003465] hover:underline cursor-pointer transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
            {title}
          </h3>
        </Link>
      ) : (
        <h3 className="text-black text-[16px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
          {title}
        </h3>
      )}
      <div className="flex items-center justify-between">
        <p className={`text-[32px] font-medium ${colors.text}`}>{value}</p>
        <div className={`rounded-full  h-[36px] w-[36px] flex items-center justify-center ${colors.bgColor}`}>
            {icon}
        </div>
      </div>
    {growth !== null && (
      <div className="flex items-center">
        <span className={`${colors.bgColor} text-white text-sm font-medium px-3 py-2 rounded-full`}>
          {growth > 0 ? "+" : ""}{growth}%
        </span>
      </div>
    )}
    </div>


    <ChartNoAxesColumn className={`${colors.text} flex items-center justify-center text-lg font-medium p-2 bg-white z-10 rounded-lg h-[43px] w-[43px] absolute bottom-4 right-6`}/>
    <div className={`absolute bottom-0 left-0 w-full h-[130px] p-0 ${colors.bg}`}>
      <ResponsiveContainer width="100%" height="100%" className="" >
        <AreaChart data={data} >
        {/* <Tooltip /> */}
        <Area type="monotone" dataKey="value" stroke={colors.lineColor} strokeWidth={4} fill={colors.fillColor} dot={true} fillOpacity={1} />
         
        </AreaChart>
      </ResponsiveContainer>
    </div>

  </div>
  );
};

export default StatCard;