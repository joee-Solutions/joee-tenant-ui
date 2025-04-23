import { useState } from 'react';

export default function ContactDemographicForm() {
  // Arrays for dropdown options
  const countryOptions = ["United States", "Canada", "Mexico", "United Kingdom", "Australia", "Other"];
  const stateOptions = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];
  const cityOptions = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus", "Indianapolis", "Charlotte", "San Francisco", "Seattle", "Denver", "Washington DC"];
  const postalOptions = ["10001", "90001", "60601", "77001", "85001", "19101", "78201", "92101", "75201", "95101", "73301", "32099", "76101", "43085", "46201", "28201", "94101", "98101", "80201", "20001"];
  const contactMethodOptions = ["Email", "Phone", "Text Message", "Mail"];
  const livingSituationOptions = ["Own Home", "Rent", "Living with Family", "Assisted Living", "Nursing Home", "Homeless", "Other"];
  const referralSourceOptions = ["Doctor", "Friend/Family", "Insurance", "Internet Search", "Social Media", "Other"];
  const occupationStatusOptions = ["Employed", "Self-Employed", "Unemployed", "Retired", "Student", "Unable to Work", "Other"];
  const industryOptions = ["Healthcare", "Education", "Technology", "Finance", "Manufacturing", "Retail", "Government", "Construction", "Food Service", "Transportation", "Other"];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Country */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-900 mb-1">
            Country
          </label>
          <div className="relative">
            <select 
              id="country"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-500"
              defaultValue=""
            >
              <option value="" disabled>select</option>
              {countryOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* State */}
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-900 mb-1">
            State
          </label>
          <div className="relative">
            <select 
              id="state"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-500"
              defaultValue=""
            >
              <option value="" disabled>select</option>
              {stateOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-900 mb-1">
            City
          </label>
          <div className="relative">
            <select 
              id="city"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-500"
              defaultValue=""
            >
              <option value="" disabled>select</option>
              {cityOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Postal/Zip code */}
        <div>
          <label htmlFor="postal" className="block text-sm font-medium text-gray-900 mb-1">
            Postal/Zip code
          </label>
          <div className="relative">
            <select 
              id="postal"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-500"
              defaultValue=""
            >
              <option value="" disabled>select</option>
              {postalOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter here"
          />
        </div>

        {/* Email (work) */}
        <div>
          <label htmlFor="workEmail" className="block text-sm font-medium text-gray-900 mb-1">
            Email (work)
          </label>
          <input
            type="email"
            id="workEmail"
            className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter here"
          />
        </div>

        {/* Phone (Home) */}
        <div>
          <label htmlFor="homePhone" className="block text-sm font-medium text-gray-900 mb-1">
            Phone (Home)
          </label>
          <input
            type="tel"
            id="homePhone"
            className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter here"
          />
        </div>

        {/* Phone (Mobile) */}
        <div>
          <label htmlFor="mobilePhone" className="block text-sm font-medium text-gray-900 mb-1">
            Phone (Mobile)
          </label>
          <input
            type="tel"
            id="mobilePhone"
            className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter here"
          />
        </div>

        {/* Address - Full width */}
        <div className="md:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-900 mb-1">
            Address
          </label>
          <input
            type="text"
            id="address"
            className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter here"
          />
        </div>

        {/* You lived in the above address (From) */}
        <div>
          <label htmlFor="addressFrom" className="block text-sm font-medium text-gray-900 mb-1">
            You lived in the above address (From)
          </label>
          <div className="relative">
            <input
              type="text"
              id="addressFrom"
              className="block w-full px-4 py-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="DD/MM/YYYY"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-5 w-5 text-gray-400 cursor-pointer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* To date */}
        <div>
          <label htmlFor="addressTo" className="block text-sm font-medium text-gray-900 mb-1">
            To
          </label>
          <div className="relative">
            <input
              type="text"
              id="addressTo"
              className="block w-full px-4 py-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="DD/MM/YYYY"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-5 w-5 text-gray-400 cursor-pointer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Current Address (if any) - Full width */}
        <div className="md:col-span-2">
          <label htmlFor="currentAddress" className="block text-sm font-medium text-gray-900 mb-1">
            Current Address (if any)
          </label>
          <input
            type="text"
            id="currentAddress"
            className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter here"
          />
        </div>

        {/* Preferred Method of Contact */}
        <div>
          <label htmlFor="contactMethod" className="block text-sm font-medium text-gray-900 mb-1">
            Preferred Method of Contact
          </label>
          <div className="relative">
            <select 
              id="contactMethod"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-500"
              defaultValue=""
            >
              <option value="" disabled>select</option>
              {contactMethodOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Current Living Situation */}
        <div>
          <label htmlFor="livingSituation" className="block text-sm font-medium text-gray-900 mb-1">
            Current Living Situation
          </label>
          <div className="relative">
            <select 
              id="livingSituation"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-500"
              defaultValue=""
            >
              <option value="" disabled>select</option>
              {livingSituationOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Referral Source */}
        <div>
          <label htmlFor="referralSource" className="block text-sm font-medium text-gray-900 mb-1">
            Referral Source
          </label>
          <div className="relative">
            <select 
              id="referralSource"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-500"
              defaultValue=""
            >
              <option value="" disabled>select</option>
              {referralSourceOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Occupation Status */}
        <div>
          <label htmlFor="occupationStatus" className="block text-sm font-medium text-gray-900 mb-1">
            Occupation Status
          </label>
          <div className="relative">
            <select 
              id="occupationStatus"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              defaultValue="Employed"
            >
              {occupationStatusOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Industry */}
        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-900 mb-1">
            Industry
          </label>
          <div className="relative">
            <select 
              id="industry"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              defaultValue="Employed"
            >
              {industryOptions.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Household size */}
        <div>
          <label htmlFor="householdSize" className="block text-sm font-medium text-gray-900 mb-1">
            Household size
          </label>
          <div className="relative">
            <input
              type="number"
              id="householdSize"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter here"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Notes - Full width */}
        <div className="md:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-900 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            rows={4}
            className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}