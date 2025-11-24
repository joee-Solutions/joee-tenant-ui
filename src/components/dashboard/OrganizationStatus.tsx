"use client";

import { FC } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

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
  const placeholderColor = "#E5E7EB"; // light gray
  
  const hasAnyData = data.totalCount > 0;
  const hasActiveData = data.activeCount > 0;
  const hasInactiveData = data.inactiveCount > 0;
  const hasDeactivatedData = data.deactivatedCount > 0;
  
  // Use actual values when data exists, use 1 as placeholder when no data (so ring still renders)
  // For single data point Pie with fixed startAngle/endAngle, the value doesn't affect arc length
  // but Recharts needs value > 0 to render
  // IMPORTANT: Convert to number - API might return strings, Recharts requires numbers
  const activeValue = hasActiveData ? (typeof data.activeCount === 'string' ? parseInt(data.activeCount, 10) : Number(data.activeCount)) || 1 : 1;
  const inactiveValue = hasInactiveData ? (typeof data.inactiveCount === 'string' ? parseInt(data.inactiveCount, 10) : Number(data.inactiveCount)) || 1 : 1;
  const deactivatedValue = hasDeactivatedData ? (typeof data.deactivatedCount === 'string' ? parseInt(data.deactivatedCount, 10) : Number(data.deactivatedCount)) || 1 : 1;
  
  const activeData = [{ name: "Active", value: activeValue }];
  const inactiveData = [{ name: "Inactive", value: inactiveValue }];
  const deactivatedData = [{ name: "Deactivated", value: deactivatedValue }];



  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-medium mb-4">Organizations Status</h3>
      <div className="flex items-center">
   
        <div className="relative flex-shrink-0 mr-8">
          <ResponsiveContainer width={250} height={250}>
            <PieChart>
              {/* Active Pie - Outer ring */}
              <Pie
                data={activeData}
                cx="50%"
                cy="50%"
                innerRadius="80%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-250}
                paddingAngle={0}
                dataKey="value"
                cornerRadius={10}
                isAnimationActive={false}
              >
                {activeData.map((entry, index) => (
                  <Cell 
                    key={`active-cell-${index}`} 
                    fill={hasActiveData ? colors.active : placeholderColor}
                    stroke="none"
                  />
                ))}
              </Pie>

              {/* Inactive Pie - Middle ring */}
              <Pie
                data={inactiveData}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="75%"
                startAngle={90}
                endAngle={-200}
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

              {/* Deactivated Pie - Inner ring */}
              <Pie
                data={deactivatedData}
                cx="50%"
                cy="50%"
                innerRadius="30%"
                outerRadius="50%"
                startAngle={90}
                endAngle={-160}
                paddingAngle={0}
                dataKey="value"
                cornerRadius={10}
                isAnimationActive={false}
              >
                {deactivatedData.map((entry, index) => (
                  <Cell 
                    key={`deactivated-cell-${index}`} 
                    fill={hasDeactivatedData ? colors.deactivated : placeholderColor}
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
        <div className="text-center">
            <p className="text-2xl font-medium" style={{ color: colors.active }}>{data.activeCount}</p>
          <div className="flex gap-2 items-center">
            <div className="w-3 h-3 " style={{ backgroundColor: colors.active }}></div>
          <p className="text-gray-500 text-sm">Active Organization</p>
          </div>
        </div>

        <div className="text-center">
            <p className="text-2xl font-medium" style={{ color: colors.inactive }}>{data.inactiveCount}</p>
          <div className="flex gap-2 items-center">
            <div className="w-3 h-3 " style={{ backgroundColor: colors.inactive }}></div>
          <p className="text-gray-500 text-sm">Inactive Organization</p>
          </div>
        </div>

        <div className="text-center">
            <p className="text-2xl font-medium" style={{ color: colors.deactivated }}>{data.deactivatedCount}</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 " style={{ backgroundColor: colors.deactivated }}></div>
          <p className="text-gray-500 text-sm">Deactivated Organization</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationStatus;
