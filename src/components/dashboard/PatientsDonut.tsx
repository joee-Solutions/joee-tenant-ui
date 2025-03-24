"use client"
import { FC } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import Link from 'next/link';

ChartJS.register(ArcElement, Tooltip, Legend);

interface AgeGroup {
  range: string;
  percentage: number;
  color: string;
}

interface PatientsDonutProps {
  data: {
    totalPatients: number;
    ageDistribution: AgeGroup[];
  };
}

const PatientsDonut: FC<PatientsDonutProps> = ({ data }) => {
  const chartData = {
    labels: data.ageDistribution.map(group => group.range),
    datasets: [
      {
        data: data.ageDistribution.map(group => group.percentage),
        backgroundColor: data.ageDistribution.map(group => group.color),
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.raw}%`;
          }
        }
      }
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-700">Patients</h3>
        <Link href="/patients" className="text-sm text-blue-600 flex items-center">
          View all
          <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      
      <div className="flex flex-col items-center my-4">
        <p className="text-sm text-gray-500 mb-1">Total Patients</p>
        <p className="text-2xl font-bold text-gray-800">{data.totalPatients.toLocaleString()} People</p>
      </div>
      
      <div className="relative h-64">
        <Doughnut data={chartData} options={chartOptions} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center flex flex-col items-center justify-center">
            <p className="text-xl font-bold text-gray-800">50%</p>
            <p className="text-xs text-gray-500">Average</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientsDonut;