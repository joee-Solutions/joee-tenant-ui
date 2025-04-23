import { useState } from 'react';


const immunizationTypes = [
  "Influenza (Flu)",
  "COVID-19",
  "Tdap (Tetanus, Diphtheria, Pertussis)",
  "MMR (Measles, Mumps, Rubella)",
  "HPV",
  "Hepatitis B",
  "Pneumococcal",
  "Varicella (Chickenpox)",
  "Meningococcal"
];

export default function ImmunizationForm(){
  const [date, setDate] = useState('');
  const [immunizationType, setImmunizationType] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:space-x-4">
          <div className="w-full md:w-1/2 mb-4 md:mb-0">
            <label className="block text-lg font-medium mb-2">
              Immunization Type
            </label>
            <div className="relative">
              <select
                className="w-full border border-gray-300 rounded-md p-3 appearance-none focus:outline-none"
                value={immunizationType}
                onChange={(e) => setImmunizationType(e.target.value)}
              >
                <option value="" disabled selected>Enter here</option>
                {immunizationTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-1/2">
            <label className="block text-lg font-medium mb-2">
              Date
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full border border-gray-300 rounded-md p-3 pl-10 focus:outline-none"
                placeholder="DD/MM/YYYY"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              {date && (
                <button 
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setDate('')}
                  aria-label="Clear date"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-lg font-medium mb-2">
          Additional Information
        </label>
        <textarea
          className="w-full border border-gray-300 rounded-md p-3 h-40 focus:outline-none"
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
        ></textarea>
      </div>
    </div>
  );
};