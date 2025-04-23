import { useState } from 'react';

export default function MedicalHistoryForm() {
  const medicalConditionOptions = [
    "Asthma", 
    "Diabetes", 
    "Hypertension", 
    "Arthritis", 
    "Allergies", 
    "Heart Disease", 
    "Cancer", 
    "Depression", 
    "Anxiety", 
    "COPD"
  ];
  
  const medicationOptions = [
    "Lisinopril", 
    "Metformin", 
    "Albuterol", 
    "Atorvastatin", 
    "Levothyroxine", 
    "Amlodipine", 
    "Metoprolol", 
    "Omeprazole", 
    "Simvastatin", 
    "Losartan"
  ];
  
  const frequencyOptions = [
    "Once daily", 
    "Twice daily", 
    "Three times daily", 
    "Four times daily", 
    "Every 4 hours", 
    "Every 6 hours", 
    "Every 12 hours", 
    "Weekly", 
    "As needed"
  ];
  
  const routeOptions = [
    "Oral", 
    "Intravenous", 
    "Intramuscular", 
    "Subcutaneous", 
    "Topical", 
    "Inhalation", 
    "Nasal", 
    "Rectal", 
    "Ophthalmic"
  ];

  const [medicalConditions, setMedicalConditions] = useState([
    { id: 1, condition: '', onsetDate: '', endDate: '', comments: '' }
  ]);
  
  const [medications, setMedications] = useState([
    { id: 1, medication: '', startDate: '', endDate: '', dosage: '', frequency: '', route: '', prescribersName: '', comments: '' }
  ]);

  const addMedicalCondition = () => {
    const newId = medicalConditions.length > 0 
      ? Math.max(...medicalConditions.map(item => item.id)) + 1 
      : 1;
    
    setMedicalConditions([
      ...medicalConditions, 
      { id: newId, condition: '', onsetDate: '', endDate: '', comments: '' }
    ]);
  };

  const removeMedicalCondition = (id) => {
    if (medicalConditions.length > 1) {
      setMedicalConditions(medicalConditions.filter(item => item.id !== id));
    }
  };

  const updateMedicalCondition = (id, field, value) => {
    setMedicalConditions(medicalConditions.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addMedication = () => {
    const newId = medications.length > 0 
      ? Math.max(...medications.map(item => item.id)) + 1 
      : 1;
    
    setMedications([
      ...medications, 
      { id: newId, medication: '', startDate: '', endDate: '', dosage: '', frequency: '', route: '', prescribersName: '', comments: '' }
    ]);
  };

  const removeMedication = (id) => {
    if (medications.length > 1) {
      setMedications(medications.filter(item => item.id !== id));
    }
  };

  const updateMedication = (id, field, value) => {
    setMedications(medications.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Medical History Section */}
      <h1 className="text-2xl font-bold mb-6">Medical History</h1>
      
      {medicalConditions.map((condition, index) => (
        <div key={condition.id} className="mb-8 border-b pb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Medical Condition {index + 1}</h2>
            <div className="flex gap-2">
              {medicalConditions.length > 1 && (
                <button 
                  onClick={() => removeMedicalCondition(condition.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                >
                  Remove
                </button>
              )}
              {index === medicalConditions.length - 1 && (
                <button 
                  onClick={addMedicalCondition}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                >
                  Add Another
                </button>
              )}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="w-full md:w-1/2">
              <label className="block font-medium mb-2">Medical Condition</label>
              <div className="relative">
                <select 
                  value={condition.condition}
                  onChange={(e) => updateMedicalCondition(condition.id, 'condition', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded appearance-none pr-10"
                >
                  <option value="">Enter here</option>
                  {medicalConditionOptions.map(option => (
                    <option key={option} value={option.toLowerCase()}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/2">
              <label className="block font-medium mb-2">Onset date</label>
              <div className="relative">
                <input
                  type="date"
                  value={condition.onsetDate}
                  onChange={(e) => updateMedicalCondition(condition.id, 'onsetDate', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded"
                  placeholder="DD/MM/YYYY"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block font-medium mb-2">End date</label>
            <div className="relative max-w-md">
              <input
                type="date"
                value={condition.endDate}
                onChange={(e) => updateMedicalCondition(condition.id, 'endDate', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded"
                placeholder="DD/MM/YYYY"
              />
              <div className="absolute inset-y-0 right-0 flex items-center px-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block font-medium mb-2">Comments</label>
            <textarea
              value={condition.comments}
              onChange={(e) => updateMedicalCondition(condition.id, 'comments', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded h-32"
            ></textarea>
          </div>
        </div>
      ))}
      
      {/* Medication History Section */}
      <h1 className="text-2xl font-bold mb-6">Medication History</h1>
      
      {medications.map((medication, index) => (
        <div key={medication.id} className="mb-8 border-b pb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Medication {index + 1}</h2>
            <div className="flex gap-2">
              {medications.length > 1 && (
                <button 
                  onClick={() => removeMedication(medication.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                >
                  Remove
                </button>
              )}
              {index === medications.length - 1 && (
                <button 
                  onClick={addMedication}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                >
                  Add Another
                </button>
              )}
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="w-full md:w-1/2">
              <label className="block font-medium mb-2">Medication</label>
              <div className="relative">
                <select 
                  value={medication.medication}
                  onChange={(e) => updateMedication(medication.id, 'medication', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded appearance-none pr-10"
                >
                  <option value="">select</option>
                  {medicationOptions.map(option => (
                    <option key={option} value={option.toLowerCase()}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/2">
              <label className="block font-medium mb-2">Start date</label>
              <div className="relative">
                <input
                  type="date"
                  value={medication.startDate}
                  onChange={(e) => updateMedication(medication.id, 'startDate', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded"
                  placeholder="DD/MM/YYYY"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="w-full md:w-1/2">
              <label className="block font-medium mb-2">End date</label>
              <div className="relative">
                <input
                  type="date"
                  value={medication.endDate}
                  onChange={(e) => updateMedication(medication.id, 'endDate', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded"
                  placeholder="DD/MM/YYYY"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/2">
              <label className="block font-medium mb-2">Dosage</label>
              <input
                type="text"
                value={medication.dosage}
                onChange={(e) => updateMedication(medication.id, 'dosage', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded"
                placeholder="Enter here"
              />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="w-full md:w-1/2">
              <label className="block font-medium mb-2">Frequency</label>
              <div className="relative">
                <select
                  value={medication.frequency}
                  onChange={(e) => updateMedication(medication.id, 'frequency', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded appearance-none pr-10"
                >
                  <option value="">Enter here</option>
                  {frequencyOptions.map(option => (
                    <option key={option} value={option.toLowerCase()}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/2">
              <label className="block font-medium mb-2">Route</label>
              <div className="relative">
                <select
                  value={medication.route}
                  onChange={(e) => updateMedication(medication.id, 'route', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded appearance-none pr-10"
                >
                  <option value="">Enter here</option>
                  {routeOptions.map(option => (
                    <option key={option} value={option.toLowerCase()}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block font-medium mb-2">Prescriber's name</label>
            <input
              type="text"
              value={medication.prescribersName}
              onChange={(e) => updateMedication(medication.id, 'prescribersName', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded"
              placeholder="Enter here"
            />
          </div>
          
          <div>
            <label className="block font-medium mb-2">Comments</label>
            <textarea
              value={medication.comments}
              onChange={(e) => updateMedication(medication.id, 'comments', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded h-32"
            ></textarea>
          </div>
        </div>
      ))}

      {/* Submit button */}
      <div className="mt-8">
        <button 
          className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-6 rounded"
          onClick={() => {
            console.log('Form Data:', { medicalConditions, medications });
            // Handle form submission here
          }}
        >
          Save Information
        </button>
      </div>
    </div>
  );
}