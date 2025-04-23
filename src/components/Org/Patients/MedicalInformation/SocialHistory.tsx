import { useState } from 'react';

// Data for sexual history options
const partnerOptions = ["0", "1", "2-5", "6-10", "11-20", "20+"];
const protectionOptions = ["Always", "Sometimes", "Never", "Not applicable"];

export default function LifestyleForm (){
  // Tobacco use state
  const [tobaccoUse, setTobaccoUse] = useState('');
  const [tobaccoQuantity, setTobaccoQuantity] = useState('');
  const [tobaccoDuration, setTobaccoDuration] = useState('');
  
  // Alcohol use state
  const [alcoholUse, setAlcoholUse] = useState('');
  const [alcoholInfo, setAlcoholInfo] = useState('');
  
  // Illicit drug use state
  const [drugUse, setDrugUse] = useState('');
  const [drugInfo, setDrugInfo] = useState('');
  
  // Diet and exercise state
  const [dietExercise, setDietExercise] = useState('');
  const [dietExerciseInfo, setDietExerciseInfo] = useState('');
  
  // Sexual history state
  const [partners, setPartners] = useState('');
  const [protection, setProtection] = useState('');
  const [comment, setComment] = useState('');

  return (
    <div className="space-y-8">
      {/* Tobacco Use Section */}
      <div>
        <h3 className="text-lg font-medium mb-2">Tobacco Use:</h3>
        <div className="flex space-x-8 mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-5 w-5 mr-2"
              checked={tobaccoUse === 'never'}
              onChange={() => setTobaccoUse('never')}
            />
            <span>Never</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-5 w-5 mr-2"
              checked={tobaccoUse === 'former'}
              onChange={() => setTobaccoUse('former')}
            />
            <span>Former</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-5 w-5 mr-2"
              checked={tobaccoUse === 'current'}
              onChange={() => setTobaccoUse('current')}
            />
            <span>Current</span>
          </label>
        </div>
        
        {(tobaccoUse === 'former' || tobaccoUse === 'current') && (
          <div className="mb-4">
            <div className="flex flex-col md:flex-row md:items-center mb-4">
              <span className="mr-2">*If former/Current, Specify: Quantity (Packs per day):</span>
              <input
                type="text"
                className="border-b border-gray-300 w-32 focus:outline-none"
                value={tobaccoQuantity}
                onChange={(e) => setTobaccoQuantity(e.target.value)}
              />
              <span className="mx-2 md:mx-4">Duration(Years):</span>
              <input
                type="text"
                className="border-b border-gray-300 w-32 focus:outline-none"
                value={tobaccoDuration}
                onChange={(e) => setTobaccoDuration(e.target.value)}
              />
            </div>
          </div>
        )}
        <hr className="my-6" />
      </div>

      {/* Alcohol Use Section */}
      <div>
        <h3 className="text-lg font-medium mb-2">Alcohol Use:</h3>
        <div className="flex flex-wrap gap-8 mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-5 w-5 mr-2"
              checked={alcoholUse === 'never'}
              onChange={() => setAlcoholUse('never')}
            />
            <span>Never</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-5 w-5 mr-2"
              checked={alcoholUse === 'social'}
              onChange={() => setAlcoholUse('social')}
            />
            <span>Social</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-5 w-5 mr-2"
              checked={alcoholUse === 'regular'}
              onChange={() => setAlcoholUse('regular')}
            />
            <span>Regular</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-5 w-5 mr-2"
              checked={alcoholUse === 'heavy'}
              onChange={() => setAlcoholUse('heavy')}
            />
            <span>Heavy</span>
          </label>
        </div>
        
        <div className="mb-4">
          <label className="block text-lg font-medium mb-2">
            Additional Information
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-md p-3 h-24 focus:outline-none"
            value={alcoholInfo}
            onChange={(e) => setAlcoholInfo(e.target.value)}
          ></textarea>
        </div>
        <hr className="my-6" />
      </div>

      {/* Illicit Drug Use Section */}
      <div>
        <h3 className="text-lg font-medium mb-2">Illicit Drug Use:</h3>
        <div className="flex space-x-8 mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-5 w-5 mr-2"
              checked={drugUse === 'yes'}
              onChange={() => setDrugUse('yes')}
            />
            <span>Yes</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-5 w-5 mr-2"
              checked={drugUse === 'no'}
              onChange={() => setDrugUse('no')}
            />
            <span>No</span>
          </label>
        </div>
        
        {drugUse === 'yes' && (
          <div className="mb-4">
            <label className="block mb-2">
              If Yes, please specify:
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-3 h-24 focus:outline-none"
              value={drugInfo}
              onChange={(e) => setDrugInfo(e.target.value)}
            ></textarea>
          </div>
        )}
        <hr className="my-6" />
      </div>

      {/* Diet and Exercise Section */}
      <div>
        <h3 className="text-lg font-medium mb-2">Diet and Exercise:</h3>
        <div className="flex space-x-8 mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-5 w-5 mr-2"
              checked={dietExercise === 'yes'}
              onChange={() => setDietExercise('yes')}
            />
            <span>Yes</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-5 w-5 mr-2"
              checked={dietExercise === 'no'}
              onChange={() => setDietExercise('no')}
            />
            <span>No</span>
          </label>
        </div>
        
        {dietExercise === 'yes' && (
          <div className="mb-4">
            <label className="block mb-2">
              If Yes, please specify:
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-3 h-24 focus:outline-none"
              value={dietExerciseInfo}
              onChange={(e) => setDietExerciseInfo(e.target.value)}
            ></textarea>
          </div>
        )}
        <hr className="my-6" />
      </div>

      {/* Sexual History Section */}
      <div>
        <h3 className="text-lg font-medium mb-2">Sexual History:</h3>
        <div className="flex flex-col md:flex-row md:space-x-8 space-y-4 md:space-y-0 mb-4">
          <div className="flex items-center">
            <span className="mr-2">Number of Partners</span>
            <div className="relative w-40">
              <select
                className="w-full border border-gray-300 rounded-md p-2 appearance-none focus:outline-none"
                value={partners}
                onChange={(e) => setPartners(e.target.value)}
              >
                <option value="" disabled selected>select here</option>
                {partnerOptions.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="mr-2">Protection used</span>
            <div className="relative w-40">
              <select
                className="w-full border border-gray-300 rounded-md p-2 appearance-none focus:outline-none"
                value={protection}
                onChange={(e) => setProtection(e.target.value)}
              >
                <option value="" disabled selected>select here</option>
                {protectionOptions.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block mb-2">
            Comment
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-md p-3 h-24 focus:outline-none"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
        </div>
      </div>
    </div>
  );
};
