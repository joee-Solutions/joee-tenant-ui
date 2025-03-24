"use client"

import { FC } from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AppointmentsByDay {
  day: string;
  male: number;
  female: number;
}

interface AppointmentsChartProps {
  data: {
    clinic: string;
    weeklyGrowth: number;
    appointmentsByDay: AppointmentsByDay[];
  };
}

const AppointmentsChart: FC<AppointmentsChartProps> = ({ data }) => {
  const chartData = {
    labels: data.appointmentsByDay.map(d => d.day),
    datasets: [
      {
        label: 'Male',
        data: data.appointmentsByDay.map(d => d.male),
        backgroundColor: '#0A3161',
        borderRadius: 4,
      },
      {
        label: 'Female',
        data: data.appointmentsByDay.map(d => d.female),
        backgroundColor: '#FFD700',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 10,
          usePointStyle: true,
        },
      },
    },
    barPercentage: 0.6,
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-700">Appointments</h3>
        <div className="flex items-center">
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded mr-2">
            This Week
          </span>
          <span className="text-green-500 text-sm flex items-center">
            +{data.weeklyGrowth}%
            <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </span>
        </div>
      </div>
      <p className="text-gray-500 text-sm mb-4">{data.clinic}</p>
      <div className="h-64">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default AppointmentsChart;