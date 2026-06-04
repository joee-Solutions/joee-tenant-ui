"use client";

import { FC, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { AgeGroup } from "@/lib/types";

interface PatientsDonutProps {
  data: {
    totalPatients: number;
    averageAge?: number;
    ageDistribution: AgeGroup[];
  };
}

const PatientsDonut: FC<PatientsDonutProps> = ({ data }) => {
  const chartData = useMemo(
    () =>
      data.ageDistribution.filter(
        (g) => (g.count ?? 0) > 0 || g.percentage > 0
      ),
    [data.ageDistribution]
  );

  const centerLabel = useMemo(() => {
    if (data.totalPatients === 0) {
      return { value: "0%", subtitle: "No patients" };
    }
    if (typeof data.averageAge === "number" && !Number.isNaN(data.averageAge)) {
      return {
        value: String(Math.round(data.averageAge)),
        subtitle: "Avg. age (yrs)",
      };
    }
    const under18 = chartData
      .filter((g) =>
        ["Under 1", "2-5", "6-10", "11-17"].includes(g.range)
      )
      .reduce((sum, g) => sum + g.percentage, 0);
    return { value: `${under18}%`, subtitle: "Below 18 years" };
  }, [chartData, data.averageAge, data.totalPatients]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md min-w-0 max-w-full overflow-hidden">
      <h2 className="text-base sm:text-lg md:text-xl font-medium text-black mb-3 sm:mb-4 truncate">
        Patients
      </h2>

      <div className="w-full flex flex-row md:flex-col flex-wrap gap-4 justify-center items-center">
        <div className="w-full min-w-0 shrink-0">
          <p className="text-gray-500 text-xs sm:text-sm">Total Patients</p>
          <p className="text-base sm:text-lg md:text-xl font-medium text-blue-900 truncate">
            {data.totalPatients === 0
              ? "0 Patients"
              : `${data.totalPatients.toLocaleString()} Patients`}
          </p>
        </div>

        <div className="flex flex-row items-start gap-4 min-w-0 flex-1">
          <div className="w-full max-w-[180px] sm:max-w-[200px] aspect-square shrink-0 self-start min-w-0">
            <div className="relative w-full h-full min-w-0 top-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      chartData.length > 0
                        ? chartData
                        : [
                            {
                              range: "empty",
                              percentage: 1,
                              color: "#E5E7EB",
                              count: 1,
                            },
                          ]
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="85%"
                    dataKey="count"
                    stroke="none"
                  >
                    {(chartData.length > 0
                      ? chartData
                      : [
                          {
                            range: "empty",
                            percentage: 1,
                            color: "#E5E7EB",
                            count: 1,
                          },
                        ]
                    ).map((group, index) => (
                      <Cell
                        key={`cell-${group.range}-${index}`}
                        fill={
                          data.totalPatients === 0 ? "#E5E7EB" : group.color
                        }
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-1">
                <span
                  className={`font-bold text-sm sm:text-base md:text-lg ${
                    data.totalPatients === 0 ? "text-gray-400" : "text-black"
                  }`}
                >
                  {centerLabel.value}
                </span>
                <span
                  className={`text-[10px] sm:text-xs text-center leading-tight max-w-[90%] truncate ${
                    data.totalPatients === 0
                      ? "text-gray-400"
                      : "text-[#595959]"
                  }`}
                >
                  {centerLabel.subtitle}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full min-w-0 flex-1 self-start max-h-40 md:max-h-52 overflow-y-auto overscroll-contain pr-1">
            <ul className="flex flex-col gap-1.5 sm:gap-2">
              {chartData.map((group, index) => (
                <li
                  key={`legend-${group.range}-${index}`}
                  className="flex items-center gap-2 min-w-0"
                >
                  <span
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="text-[11px] sm:text-xs text-gray-700 truncate min-w-0">
                    {group.range}
                    {group.count != null ? ` (${group.count})` : ""}
                    {group.percentage > 0 ? ` · ${group.percentage}%` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientsDonut;
