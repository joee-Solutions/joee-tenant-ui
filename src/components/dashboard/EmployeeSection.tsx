import { FC } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Employee {
  id: number;
  name: string;
  role: string;
  organization: string;
  description?: string;
  image: string;
}

interface EmployeeSectionProps {
  employees: Employee[];
}

const EmployeeSection: FC<EmployeeSectionProps> = ({ employees }) => {
  const mainEmployee = employees[0];
  const otherEmployees = employees.slice(1);

  return (
    <div className="bg-blue-900 p-6 rounded-lg shadow-sm text-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Employees</h3>
        <Link href="/employees" className="text-sm flex items-center">
          View all
          <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="flex flex-col items-center mt-6 mb-8">
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white mb-3">
          <Image
            src={mainEmployee.image}
            alt={mainEmployee.name}
            layout="fill"
            objectFit="cover"
          />
        </div>
        <h4 className="font-bold text-lg">{mainEmployee.name}</h4>
        <p className="text-sm text-blue-200 mb-1">{mainEmployee.role}</p>
        <p className="text-sm text-blue-200">{mainEmployee.organization}</p>
        
        {mainEmployee.description && (
          <p className="text-center text-sm text-blue-100 mt-3">
            {mainEmployee.description}
          </p>
        )}
        
        <button className="mt-4 bg-blue-800 hover:bg-blue-700 px-8 py-2 rounded">
          View
        </button>
      </div>

      <div className="flex justify-around">
        {otherEmployees.map(employee => (
          <div key={employee.id} className="flex flex-col items-center">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white mb-2">
              <Image
                src={employee.image}
                alt={employee.name}
                layout="fill"
                objectFit="cover"
              />
            </div>
            <h4 className="font-medium text-sm">{employee.name}</h4>
            <p className="text-xs text-blue-200">{employee.role}</p>
            <p className="text-xs text-blue-200">{employee.organization}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeSection;