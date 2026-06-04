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
  const placeholderColor = "#E5E7EB";

  const hasAnyData = data.totalCount > 0;
  const hasActiveData = data.activeCount > 0;
  const hasInactiveData = data.inactiveCount > 0;

  const totalCount =
    typeof data.totalCount === "string"
      ? parseInt(data.totalCount, 10)
      : Number(data.totalCount) || 0;
  const activeCount =
    typeof data.activeCount === "string"
      ? parseInt(data.activeCount, 10)
      : Number(data.activeCount) || 0;
  const inactiveCount =
    typeof data.inactiveCount === "string"
      ? parseInt(data.inactiveCount, 10)
      : Number(data.inactiveCount) || 0;

  const completionPercentage =
    typeof data.completionPercentage === "number"
      ? data.completionPercentage
      : totalCount > 0
        ? 100
        : 0;
  const activePercentage =
    totalCount > 0 ? (activeCount / totalCount) * 100 : 0;
  const inactivePercentage =
    totalCount > 0 ? (inactiveCount / totalCount) * 100 : 0;

  const allEndAngle = hasAnyData ? 90 - completionPercentage * 3.6 : 90;
  const activeEndAngle = hasActiveData ? 90 - activePercentage * 3.6 : 90;
  const inactiveEndAngle = hasInactiveData ? 90 - inactivePercentage * 3.6 : 90;

  const activeColor = "#3FA907";

  const allData = [{ name: "All", value: hasAnyData ? completionPercentage : 1 }];
  const activeData = [
    { name: "Active", value: hasActiveData ? activePercentage : 1 },
  ];
  const inactiveData = [
    { name: "Inactive", value: hasInactiveData ? inactivePercentage : 1 },
  ];

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md min-w-0 max-w-full overflow-hidden">
      <h3 className="text-base sm:text-lg md:text-xl font-medium mb-3 sm:mb-4 truncate">
        Organizations Status
      </h3>

      <div className="flex flex-col md:flex-row items-center md:items-center gap-4 min-w-0">
        <div className="relative shrink-0 w-full max-w-[200px] sm:max-w-[220px] aspect-square mx-auto md:mx-0 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
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
                    fill={
                      hasInactiveData ? colors.inactive : placeholderColor
                    }
                    stroke="none"
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none px-1">
            <div
              className={`text-base sm:text-lg md:text-xl font-medium ${
                !hasAnyData ? "text-gray-400" : ""
              }`}
            >
              {hasAnyData ? `${data.completionPercentage}%` : "0%"}
            </div>
            {!hasAnyData && (
              <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                No data
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 text-center md:text-left w-full">
          <p className="text-gray-500 text-xs sm:text-sm mb-1 line-clamp-2">
            Total number of all organizations
          </p>
          <p className="text-xl sm:text-2xl md:text-3xl font-medium text-blue-900 tabular-nums">
            {data.totalCount}
          </p>
        </div>
      </div>

      <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 min-w-0">
        <div
          className="text-center cursor-pointer hover:opacity-80 transition-opacity min-w-0 px-1"
          onClick={() => router.push("/dashboard/organization")}
        >
          <p
            className="text-lg sm:text-xl md:text-2xl font-medium tabular-nums truncate"
            style={{ color: "#003465" }}
          >
            {data.totalCount}
          </p>
          <div className="flex gap-1.5 sm:gap-2 items-center justify-center mt-1 min-w-0">
            <div
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0"
              style={{ backgroundColor: "#003465" }}
            />
            <p className="text-gray-500 text-[10px] sm:text-xs truncate">
              All Organizations
            </p>
          </div>
        </div>

        <div
          className="text-center cursor-pointer hover:opacity-80 transition-opacity min-w-0 px-1"
          onClick={() => router.push("/dashboard/organization/active")}
        >
          <p
            className="text-lg sm:text-xl md:text-2xl font-medium tabular-nums truncate"
            style={{ color: activeColor }}
          >
            {data.activeCount}
          </p>
          <div className="flex gap-1.5 sm:gap-2 items-center justify-center mt-1 min-w-0">
            <div
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0"
              style={{ backgroundColor: activeColor }}
            />
            <p className="text-gray-500 text-[10px] sm:text-xs truncate">
              Active Organization
            </p>
          </div>
        </div>

        <div
          className="text-center cursor-pointer hover:opacity-80 transition-opacity min-w-0 px-1"
          onClick={() => router.push("/dashboard/organization/inactive")}
        >
          <p
            className="text-lg sm:text-xl md:text-2xl font-medium tabular-nums truncate"
            style={{ color: colors.inactive }}
          >
            {data.inactiveCount}
          </p>
          <div className="flex gap-1.5 sm:gap-2 items-center justify-center mt-1 min-w-0">
            <div
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0"
              style={{ backgroundColor: colors.inactive }}
            />
            <p className="text-gray-500 text-[10px] sm:text-xs truncate">
              Inactive Organization
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationStatus;
