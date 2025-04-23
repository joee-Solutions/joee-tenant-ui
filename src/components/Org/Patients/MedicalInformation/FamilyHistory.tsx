import { useState } from 'react';

export default function FamilyHistoryForm () {
  const [relative, setRelative] = useState('');
  const [conditions, setConditions] = useState('');
  const [ageOfDiagnosis, setAgeOfDiagnosis] = useState('');
  const [currentAge, setCurrentAge] = useState('');

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:space-x-4">
          <div className="w-full md:w-1/2 mb-4 md:mb-0">
            <label className="block text-lg font-medium mb-2">
              Relative
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none"
              placeholder="Enter here"
              value={relative}
              onChange={(e) => setRelative(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-1/2">
            <label className="block text-lg font-medium mb-2">
              Conditions
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none"
              placeholder="Enter here"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-col md:flex-row md:space-x-4">
          <div className="w-full md:w-1/2 mb-4 md:mb-0">
            <label className="block text-lg font-medium mb-2">
              Age of Diagnosis
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none"
              placeholder="Enter here"
              value={ageOfDiagnosis}
              onChange={(e) => setAgeOfDiagnosis(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-1/2">
            <label className="block text-lg font-medium mb-2">
              Current Age
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none"
              placeholder="Enter here"
              value={currentAge}
              onChange={(e) => setCurrentAge(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};