"use client";

import { FC } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useRouter } from "next/navigation";

interface OrganizationStatusProps {
  data: {
    activeCount: number;
    inactiveCount: number;
    deactivatedCount: number;
    totalCount: number;
    completionPercentage: number;
  };
  colors: {
    active: string;
    inactive: string;
    deactivated: string;
  };
}

const OrganizationStatus: FC<OrganizationStatusProps> = ({ data, colors }) => {
  const router = useRouter();
  const placeholderColor = "#E5E7EB"; // light gray
  
  const hasAnyData = data.totalCount > 0;
  const hasActiveData = data.activeCount > 0;
  const hasInactiveData = data.inactiveCount > 0;
  
  // Convert to numbers - API might return strings, Recharts requires numbers
  const totalCount = typeof data.totalCount === 'string' ? parseInt(data.totalCount, 10) : Number(data.totalCount) || 0;
  const activeCount = typeof data.activeCount === 'string' ? parseInt(data.activeCount, 10) : Number(data.activeCount) || 0;
  const inactiveCount = typeof data.inactiveCount === 'string' ? parseInt(data.inactiveCount, 10) : Number(data.inactiveCount) || 0;
  
  // Calculate percentages for the rings (360 degrees = 100%)
  // All organizations ring should show completion percentage (not always full)
  // Active organizations ring should show percentage of active/total
  // Inactive organizations ring should show percentage of inactive/total
  const completionPercentage = typeof data.completionPercentage === 'number' ? data.completionPercentage : (totalCount > 0 ? 100 : 0);
  const activePercentage = totalCount > 0 ? (activeCount / totalCount) * 100 : 0;
  const inactivePercentage = totalCount > 0 ? (inactiveCount / totalCount) * 100 : 0;
  
  // Calculate end angles based on percentages
  // Start at 90 degrees (top), go clockwise
  // Full circle: 90 to -270 (360 degrees)
  const allEndAngle = hasAnyData ? 90 - (completionPercentage * 3.6) : 90; // 3.6 = 360/100
  const activeEndAngle = hasActiveData ? 90 - (activePercentage * 3.6) : 90;
  const inactiveEndAngle = hasInactiveData ? 90 - (inactivePercentage * 3.6) : 90;
  
  // Use branded color for active organizations from StatCard
  const activeColor = "#3FA907"; // Branded green color from StatCard
  
  // All organizations ring (outermost) - show completion percentage, use blue color
  const allData = [{ name: "All", value: hasAnyData ? completionPercentage : 1 }];
  // Active organizations ring - show percentage
  const activeData = [{ name: "Active", value: hasActiveData ? activePercentage : 1 }];
  // Inactive organizations ring - show percentage
  const inactiveData = [{ name: "Inactive", value: hasInactiveData ? inactivePercentage : 1 }];



  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-medium mb-4">Organizations Status</h3>
      <div className="flex items-center">
   
        <div className="relative flex-shrink-0 mr-8">
          <ResponsiveContainer width={250} height={250}>
            <PieChart>
              {/* All Organizations Pie - Outermost ring */}
              <Pie
                data={allData}
                cx="50%"
                cy="50%"
                innerRadius="85%"
                outerRadius="100%"
                startAngle={90}
                endAngle={allEndAngle}
                paddingAngle={0}
                dataKey="value"
                cornerRadius={10}
                isAnimationActive={false}
              >
                {allData.map((entry, index) => (
                  <Cell 
                    key={`all-cell-${index}`} 
                    fill={hasAnyData ? "#003465" : placeholderColor}
                    stroke="none"
                  />
                ))}
              </Pie>

              {/* Active Pie - Middle ring */}
              <Pie
                data={activeData}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="80%"
                startAngle={90}
                endAngle={activeEndAngle}
                paddingAngle={0}
                dataKey="value"
                cornerRadius={10}
                isAnimationActive={false}
              >
                {activeData.map((entry, index) => (
                  <Cell 
                    key={`active-cell-${index}`} 
                    fill={hasActiveData ? activeColor : placeholderColor}
                    stroke="none"
                  />
                ))}
              </Pie>

              {/* Inactive Pie - Inner ring */}
              <Pie
                data={inactiveData}
                cx="50%"
                cy="50%"
                innerRadius="35%"
                outerRadius="55%"
                startAngle={90}
                endAngle={inactiveEndAngle}
                paddingAngle={0}
                dataKey="value"
                cornerRadius={10}
                isAnimationActive={false}
              >
                {inactiveData.map((entry, index) => (
                  <Cell 
                    key={`inactive-cell-${index}`} 
                    fill={hasInactiveData ? colors.inactive : placeholderColor}
                    stroke="none"
                  />
                ))}
              </Pie>

            </PieChart>
          </ResponsiveContainer>

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className={`text-xl font-medium ${!hasAnyData ? 'text-gray-400' : ''}`}>
              {hasAnyData ? `${data.completionPercentage}%` : '0%'}
            </div>
            {!hasAnyData && (
              <div className="text-xs text-gray-400 mt-1">No data</div>
            )}
          </div>
        </div>

        <div>
          <p className="text-gray-500 mb-2">Total number of all organizations</p>
          <p className="text-3xl font-medium text-blue-900">{data.totalCount}</p>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <div className="text-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push("/dashboard/organization")}>
            <p className="text-2xl font-medium" style={{ color: "#003465" }}>{data.totalCount}</p>
          <div className="flex gap-2 items-center justify-center">
            <div className="w-3 h-3 " style={{ backgroundColor: "#003465" }}></div>
          <p className="text-gray-500 text-sm">All Organizations</p>
          </div>
        </div>

        <div className="text-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push("/dashboard/organization/active")}>
            <p className="text-2xl font-medium" style={{ color: activeColor }}>{data.activeCount}</p>
          <div className="flex gap-2 items-center justify-center">
            <div className="w-3 h-3 " style={{ backgroundColor: activeColor }}></div>
          <p className="text-gray-500 text-sm">Active Organization</p>
          </div>
        </div>

        <div className="text-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push("/dashboard/organization/inactive")}>
            <p className="text-2xl font-medium" style={{ color: colors.inactive }}>{data.inactiveCount}</p>
          <div className="flex gap-2 items-center justify-center">
            <div className="w-3 h-3 " style={{ backgroundColor: colors.inactive }}></div>
          <p className="text-gray-500 text-sm">Inactive Organization</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationStatus;
