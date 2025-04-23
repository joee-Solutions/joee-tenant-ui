// AllergyInformationForm.jsx
import React, { useState } from 'react';

export default function AllergyInformationForm() {
  const [formData, setFormData] = useState({
    allergy: '',
    startDate: '',
    endDate: '',
    severity: '',
    reactions: '',
    comments: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const clearDate = (field) => {
    setFormData(prevState => ({
      ...prevState,
      [field]: ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Allergy Information Form submitted:', formData);
    // Here you would typically send the data to an API
  };

  // Common options for allergies
  const allergyOptions = [
    'Select an allergy',
    'Penicillin',
    'Peanuts',
    'Dairy',
    'Shellfish',
    'Eggs',
    'Tree nuts',
    'Wheat',
    'Soy',
    'Fish',
    'Latex',
    'Other'
  ];

  // Severity levels
  const severityLevels = [
    'Select severity',
    'Mild',
    'Moderate',
    'Severe',
    'Life-threatening'
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Allergy */}
          <div>
            <label htmlFor="allergy" className="block text-lg font-medium mb-2">
              Allergy
            </label>
            <select
              id="allergy"
              name="allergy"
              value={formData.allergy}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              {allergyOptions.map((option, index) => (
                <option key={index} value={index === 0 ? '' : option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          
          {/* Start date */}
          <div>
            <label htmlFor="startDate" className="block text-lg font-medium mb-2">
              Start date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                onFocus={(e) => (e.target.type = 'date')}
                onBlur={(e) => (e.target.type = 'text')}
              />
              {formData.startDate && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => clearDate('startDate')}
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* End date */}
          <div>
            <label htmlFor="endDate" className="block text-lg font-medium mb-2">
              End date
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                onFocus={(e) => (e.target.type = 'date')}
                onBlur={(e) => (e.target.type = 'text')}
              />
              {formData.endDate && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => clearDate('endDate')}
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Severity */}
          <div>
            <label htmlFor="severity" className="block text-lg font-medium mb-2">
              Severity
            </label>
            <select
              id="severity"
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              {severityLevels.map((level, index) => (
                <option key={index} value={index === 0 ? '' : level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
          
          {/* Reactions */}
          <div>
            <label htmlFor="reactions" className="block text-lg font-medium mb-2">
              Reactions
            </label>
            <textarea
              id="reactions"
              name="reactions"
              value={formData.reactions}
              onChange={handleChange}
              rows={5}
              placeholder="Enter reactions here"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
          
          {/* Comments */}
          <div>
            <label htmlFor="comments" className="block text-lg font-medium mb-2">
              Comments
            </label>
            <textarea
              id="comments"
              name="comments"
              value={formData.comments}
              onChange={handleChange}
              rows={5}
              placeholder="Enter comments here"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
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