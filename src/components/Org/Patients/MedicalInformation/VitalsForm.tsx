
import { useState, useEffect } from 'react';

export default function VitalSignsForm() {
  // State for all vital sign inputs
  const [temperature, setTemperature] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [glucose, setGlucose] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState('');
  const [painScore, setPainScore] = useState('');

  // Calculate BMI when height and weight change
  useEffect(() => {
    if (height && weight) {
      try {
        // Check if height contains cm
        let heightInMeters;
        if (height.includes('cm')) {
          const cm = parseFloat(height.replace('cm', '').trim());
          heightInMeters = cm / 100;
        } else if (height.includes('in')) {
          const inches = parseFloat(height.replace('in', '').trim());
          heightInMeters = inches * 0.0254;
        } else {
          // Assume cm if no unit
          heightInMeters = parseFloat(height) / 100;
        }

        // Check if weight contains kg or lbs
        let weightInKg;
        if (weight.includes('kg')) {
          weightInKg = parseFloat(weight.replace('kg', '').trim());
        } else if (weight.includes('lbs')) {
          const lbs = parseFloat(weight.replace('lbs', '').trim());
          weightInKg = lbs * 0.453592;
        } else {
          // Assume kg if no unit
          weightInKg = parseFloat(weight);
        }

        if (!isNaN(heightInMeters) && !isNaN(weightInKg) && heightInMeters > 0) {
          const calculatedBmi = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
          setBmi(calculatedBmi);
        }
      } catch (error) {
        // If there's an error in calculation, leave BMI empty
        setBmi('');
      }
    } else {
      setBmi('');
    }
  }, [height, weight]);

  return (
    <div className="space-y-6">
      {/* Row 1: Temperature, Systolic, Diastolic */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-lg font-medium mb-2">
            Temperature (°F/°C)
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none"
            placeholder="Enter here"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-lg font-medium mb-2">
            Blood Pressure Systolic (mmHg)
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none"
            placeholder="Enter here"
            value={systolic}
            onChange={(e) => setSystolic(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-lg font-medium mb-2">
            Blood Pressure Diastolic (mmHg)
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none"
            placeholder="Enter here"
            value={diastolic}
            onChange={(e) => setDiastolic(e.target.value)}
          />
        </div>
      </div>
      
      {/* Row 2: Heart Rate, Respiratory Rate, Oxygen Saturation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-lg font-medium mb-2">
            Heart rate (Pulse); <span className="font-normal">Beats per minute</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none"
            placeholder="Enter here"
            value={heartRate}
            onChange={(e) => setHeartRate(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-lg font-medium mb-2">
            Respiratory rate ; <span className="font-normal">Breaths per minute</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none"
            placeholder="Enter here"
            value={respiratoryRate}
            onChange={(e) => setRespiratoryRate(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-lg font-medium mb-2">
            Oxygen Saturation (%)
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none"
            placeholder="Enter here"
            value={oxygenSaturation}
            onChange={(e) => setOxygenSaturation(e.target.value)}
          />
        </div>
      </div>
      
      {/* Row 3: Glucose, Height, Weight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-lg font-medium mb-2">
            Glucose
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none"
            placeholder="Enter here"
            value={glucose}
            onChange={(e) => setGlucose(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-lg font-medium mb-2">
            Height (cm/in)
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none"
            placeholder="Enter here"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-lg font-medium mb-2">
            Weight (kg/lbs)
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none"
            placeholder="Enter here"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
      </div>
      
      {/* Row 4: BMI, Pain Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-lg font-medium mb-2">
            Body Mass Index (BMI) <span className="font-normal">calculated or recorded</span>
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none"
            placeholder="Enter here"
            value={bmi}
            onChange={(e) => setBmi(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-lg font-medium mb-2">
            Pain score (0-10)
          </label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-md p-3 focus:outline-none"
            placeholder="Enter here"
            value={painScore}
            onChange={(e) => setPainScore(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
