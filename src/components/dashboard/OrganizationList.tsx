import { FC } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Organization {
  id: number;
  name: string;
  location: string;
  status: 'Active' | 'Inactive' | 'Deactivated';
  image: string;
}

interface OrganizationListProps {
  organizations: Organization[];
}

const OrganizationList: FC<OrganizationListProps> = ({ organizations }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      case 'Deactivated':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-medium text-gray-700">Organization List</h3>
        <Link href="/organizations" className="text-sm text-blue-600 flex items-center">
          View all
          <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      
      <div className="space-y-4">
        {organizations.map(org => (
          <div key={org.id} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 mr-3">
                <Image
                  src={org.image}
                  alt={org.name}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">{org.name}</h4>
                <p className="text-sm text-gray-500">{org.location}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(org.status)}`}>
              {org.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrganizationList;