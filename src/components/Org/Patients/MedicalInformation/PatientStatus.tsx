// PatientDischargeForm.jsx
import React, { useState } from 'react';

export default function PatientDischargeForm() {
  const [formData, setFormData] = useState({
    patientStatus: 'Discharged',
    dischargedDate: '',
    reasonForDischarge: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const clearDate = () => {
    setFormData(prevState => ({
      ...prevState,
      dischargedDate: ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Patient Discharge Form submitted:', formData);
    // Here you would typically send the data to an API
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient Status */}
          <div>
            <label htmlFor="patientStatus" className="block text-lg font-medium mb-2">
              Patient Status
            </label>
            <select
              id="patientStatus"
              name="patientStatus"
              value={formData.patientStatus}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              <option value="Discharged">Discharged</option>
              <option value="Admitted">Admitted</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Transferred">Transferred</option>
            </select>
          </div>
          
          {/* Discharged date */}
          <div>
            <label htmlFor="dischargedDate" className="block text-lg font-medium mb-2">
              Discharged date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                id="dischargedDate"
                name="dischargedDate"
                value={formData.dischargedDate}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                onFocus={(e) => (e.target.type = 'date')}
                onBlur={(e) => (e.target.type = 'text')}
              />
              {formData.dischargedDate && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={clearDate}
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Reason for Discharge */}
        <div className="mt-6">
          <label htmlFor="reasonForDischarge" className="block text-lg font-medium mb-2">
            Reason for Discharge
          </label>
          <textarea
            id="reasonForDischarge"
            name="reasonForDischarge"
            value={formData.reasonForDischarge}
            onChange={handleChange}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>
        
        <div className="mt-8">
          <button 
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}