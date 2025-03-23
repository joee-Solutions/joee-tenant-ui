"use client"; // Required in Next.js App Router

import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "18-24", uv: 48.47, pv: 2400, fill: "#eb0f0f" },
  { name: "25-29", uv: 53.69, pv: 4567, fill: "#081836" },
  { name: "30-34", uv: 50.69, pv: 2398, fill: "#e8d909" },
  { name: "30-34", uv: 60.69, pv: 1398, fill: "" },
];

const style = {
  top: "50%",
  right: 0,
  transform: "translate(0, -50%)",
  lineHeight: "24px",
};

const RadialChart = () => {
  return (
    <div className="w-full h-[300px] flex justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="20%"
          outerRadius="80%"
          barSize={30}
          data={data}
        >
          <RadialBar
            // label={{ position: "insideStart", fill: "#fff" }}
            background
            // clockWise
            dataKey="uv"
          />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadialChart;
