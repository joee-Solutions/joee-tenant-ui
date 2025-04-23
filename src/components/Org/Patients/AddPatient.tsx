import { useState } from 'react';
import PersonalInformationTab from '@/components/Org/Patients/PersonalInformationTab';
import MedicalInformationTab from '@/components/Org/Patients/MedicalInformationTab';

export default function PatientFormContainer(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'personal' | 'medical'>('personal');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h1 className="text-xl font-medium">Instruction - Click on a section to view and fill information</h1>
          <a href="#" className="text-blue-800 font-medium">Patients List</a>
        </div>

        <div className="flex border-b">
          <button
            className={`flex-1 py-4 text-center text-lg font-medium relative ${
              activeTab === 'personal' ? 'text-blue-800' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('personal')}
          >
            Personal Information
            {activeTab === 'personal' && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-800"></div>
            )}
          </button>
          <button
            className={`flex-1 py-4 text-center text-lg font-medium relative ${
              activeTab === 'medical' ? 'text-blue-800' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('medical')}
          >
            Medical Information
            {activeTab === 'medical' && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-800"></div>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'personal' && <PersonalInformationTab />}
          {activeTab === 'medical' && <MedicalInformationTab />}
        </div>
      </div>
    </div>
  );
}