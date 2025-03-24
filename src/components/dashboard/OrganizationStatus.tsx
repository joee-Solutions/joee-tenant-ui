import { Doughnut } from "react-chartjs-2";

const OrganizationStatus: FC<OrganizationStatusProps> = ({ data }) => {
    const chartData = {
      datasets: [
        {
          data: [data.activeCount, data.inactiveCount, data.deactivatedCount],
          backgroundColor: [
            '#0A3161', 
            '#FFD700', 
            '#E63946', 
          ],
          borderWidth: 0,
          circumference: 270,
          rotation: 225,
        },
      ],
    };
  
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
        },
      },
    };
  
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-medium text-gray-700">Organizations Status</h3>
        </div>
        
        <div className="relative h-48 flex items-center justify-center mb-6">
          <Doughnut data={chartData} options={chartOptions} />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-800">{data.completionPercentage}%</p>
            </div>
          </div>
        </div>
        
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500">Total number of all organizations</p>
          <p className="text-3xl font-bold text-gray-800">{data.totalCount}</p>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-blue-900">{data.activeCount}</p>
            <p className="text-xs text-gray-500">Active Organization</p>
          </div>
          <div>
            <p className="text-xl font-bold text-yellow-500">{data.inactiveCount}</p>
            <p className="text-xs text-gray-500">Inactive Organization</p>
          </div>
          <div>
            <p className="text-xl font-bold text-red-600">{data.deactivatedCount}</p>
            <p className="text-xs text-gray-500">Deactivated Organization</p>
          </div>
        </div>
      </div>
    );
  };
  
  export default OrganizationStatus;