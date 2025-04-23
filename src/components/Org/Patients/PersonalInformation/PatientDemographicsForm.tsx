import { useState } from 'react';
import { Paperclip } from 'lucide-react';

export default function PatientInfoForm() {
  // Arrays for dropdown options
  const suffixOptions = ["Mr.", "Mrs.", "Ms.", "Dr.", "Jr.", "Sr.", "II", "III", "IV"];
  const sexOptions = ["Male", "Female", "Other", "Prefer not to say"];
  const maritalStatusOptions = ["Single", "Married", "Divorced", "Widowed", "Separated", "Other"];
  const raceOptions = ["White", "Black or African American", "Asian", "Native Hawaiian or Pacific Islander", "American Indian or Alaska Native", "Other", "Prefer not to say"];
  const ethnicityOptions = ["Hispanic or Latino", "Not Hispanic or Latino", "Prefer not to say"];
  const languageOptions = ["English", "Spanish", "French", "Mandarin", "Arabic", "Other"];
  const interpreterOptions = ["Yes", "No"];
  const religionOptions = ["Christianity", "Islam", "Judaism", "Hinduism", "Buddhism", "None", "Other", "Prefer not to say"];
  const genderIdentityOptions = ["Man", "Woman", "Non-binary", "Transgender", "Other", "Prefer not to say"];
  const sexualOrientationOptions = ["Heterosexual", "Homosexual", "Bisexual", "Asexual", "Other", "Prefer not to say"];
  
  // State for file upload
  const [fileName, setFileName] = useState("");
  
  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Suffix */}
        <div>
          <label htmlFor="suffix" className="block text-sm font-medium text-gray-900 mb-1">
            Suffix
          </label>
          <div className="relative">
            <select 
              id="suffix"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-500"
              defaultValue=""
            >
              <option value="" disabled>select</option>
              {suffixOptions.map((option, index) => (
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

        {/* First name */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-900 mb-1">
            First name
          </label>
          <input
            type="text"
            id="firstName"
            className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter here"
          />
        </div>

        {/* Middle name */}
        <div>
          <label htmlFor="middleName" className="block text-sm font-medium text-gray-900 mb-1">
            Middle name
          </label>
          <input
            type="text"
            id="middleName"
            className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter here"
          />
        </div>

        {/* Last name */}
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-900 mb-1">
            Last name
          </label>
          <input
            type="text"
            id="lastName"
            className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter here"
          />
        </div>

        {/* Preferred name */}
        <div>
          <label htmlFor="preferredName" className="block text-sm font-medium text-gray-900 mb-1">
            Preferred name
          </label>
          <input
            type="text"
            id="preferredName"
            className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter here"
          />
        </div>

        {/* Medical Record Number */}
        <div>
          <label htmlFor="medicalRecordNumber" className="block text-sm font-medium text-gray-900 mb-1">
            Medical Record Number
          </label>
          <input
            type="text"
            id="medicalRecordNumber"
            className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter here"
          />
        </div>

        {/* Sex */}
        <div>
          <label htmlFor="sex" className="block text-sm font-medium text-gray-900 mb-1">
            Sex
          </label>
          <div className="relative">
            <select 
              id="sex"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-500"
              defaultValue=""
            >
              <option value="" disabled>select</option>
              {sexOptions.map((option, index) => (
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

        {/* Date of Birth */}
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-900 mb-1">
            Date of Birth
          </label>
          <div className="relative">
            <input
              type="text"
              id="dateOfBirth"
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

        {/* Marital Status */}
        <div>
          <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-900 mb-1">
            Marital Status
          </label>
          <div className="relative">
            <select 
              id="maritalStatus"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-500"
              defaultValue=""
            >
              <option value="" disabled>select</option>
              {maritalStatusOptions.map((option, index) => (
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

        {/* Race */}
        <div>
          <label htmlFor="race" className="block text-sm font-medium text-gray-900 mb-1">
            Race
          </label>
          <div className="relative">
            <select 
              id="race"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-500"
              defaultValue=""
            >
              <option value="" disabled>select</option>
              {raceOptions.map((option, index) => (
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

        {/* Ethnicity */}
        <div>
          <label htmlFor="ethnicity" className="block text-sm font-medium text-gray-900 mb-1">
            Ethnicity
          </label>
          <div className="relative">
            <select 
              id="ethnicity"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-500"
              defaultValue=""
            >
              <option value="" disabled>select</option>
              {ethnicityOptions.map((option, index) => (
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

        {/* Preferred Language */}
        <div>
          <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-900 mb-1">
            Preferred Language
          </label>
          <div className="relative">
            <select 
              id="preferredLanguage"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-500"
              defaultValue=""
            >
              <option value="" disabled>select</option>
              {languageOptions.map((option, index) => (
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

        {/* Interpreter Required */}
        <div>
          <label htmlFor="interpreterRequired" className="block text-sm font-medium text-gray-900 mb-1">
            Interpreter Required
          </label>
          <div className="relative">
            <select 
              id="interpreterRequired"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-500"
              defaultValue=""
            >
              <option value="" disabled>select</option>
              {interpreterOptions.map((option, index) => (
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

        {/* Religion */}
        <div>
          <label htmlFor="religion" className="block text-sm font-medium text-gray-900 mb-1">
            Religion
          </label>
          <div className="relative">
            <select 
              id="religion"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-500"
              defaultValue=""
            >
              <option value="" disabled>select</option>
              {religionOptions.map((option, index) => (
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

        {/* Gender Identity */}
        <div>
          <label htmlFor="genderIdentity" className="block text-sm font-medium text-gray-900 mb-1">
            Gender Identity
          </label>
          <div className="relative">
            <select 
              id="genderIdentity"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-500"
              defaultValue=""
            >
              <option value="" disabled>select</option>
              {genderIdentityOptions.map((option, index) => (
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

        {/* Sexual Orientation */}
        <div>
          <label htmlFor="sexualOrientation" className="block text-sm font-medium text-gray-900 mb-1">
            Sexual Orientation
          </label>
          <div className="relative">
            <select 
              id="sexualOrientation"
              className="block w-full px-4 py-3 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-500"
              defaultValue=""
            >
              <option value="" disabled>select</option>
              {sexualOrientationOptions.map((option, index) => (
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

        {/* Upload Patient Image - Spans full width */}
        <div className="md:col-span-2">
          <label htmlFor="patientImage" className="block text-sm font-medium text-gray-900 mb-1">
            Upload Patient Image
          </label>
          <div className="flex">
            <label 
              htmlFor="file-upload" 
              className="flex-grow flex items-center px-4 py-3 border border-gray-300 rounded-l-md bg-white text-gray-400 cursor-pointer"
            >
              <span className="mr-2">
                <Paperclip className="h-5 w-5" />
              </span>
              <span className="truncate">{fileName || "Choose File"}</span>
              <input
                id="file-upload"
                type="file"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
            <button 
              type="button" 
              className="w-24 bg-blue-900 text-white py-3 px-4 rounded-r-md hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              Browse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}