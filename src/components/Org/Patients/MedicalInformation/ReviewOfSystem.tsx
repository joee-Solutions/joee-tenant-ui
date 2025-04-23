import { useState } from 'react';

export default function MedicalSymptomForm() {
  const [formData, setFormData] = useState({
    // Genitourinary
    urinaryFrequency: false,
    dysuria: false,
    incontinence: false,
    genitourinaryDetails: '',
    
    // Musculoskeletal
    jointPain: false,
    muscleWeakness: false,
    stiffness: false,
    musculoskeletalDetails: '',
    
    // Neurological
    headaches: false,
    dizziness: false,
    numbnessWeakness: false,
    seizures: false,
    neurologicalDetails: '',
    
    // Psychiatric
    depression: false,
    anxiety: false,
    sleepingDisturbances: false,
    psychiatricDetails: '',
    
    // Endocrine
    heatColdIntolerance: false,
    excessiveThirstHunger: false,
    endocrineDetails: '',
    
    // Haematologic/Lymphatic
    easyBruising: false,
    bleedingTendencies: false,
    haematologicDetails: '',
    
    // Allergic/Immunologic
    frequentInfections: false,
    allergicReactions: false,
    allergicDetails: ''
  });

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const SymptomSection = ({ title, checkboxes, detailsName }) => (
    <div className="mb-8">
      <h3 className="font-medium text-gray-800 mb-4">{title}:</h3>
      <div className="flex flex-wrap gap-8 mb-4">
        {checkboxes.map(({ name, label }) => (
          <label key={name} className="flex items-center space-x-2">
            <input
              type="checkbox"
              name={name}
              checked={formData[name]}
              onChange={handleCheckboxChange}
              className="h-5 w-5 border-gray-300 rounded"
            />
            <span className="text-gray-700">{label}</span>
          </label>
        ))}
      </div>
      <div>
        <p className="text-gray-700 mb-2">Details</p>
        <textarea
          name={detailsName}
          value={formData[detailsName]}
          onChange={handleTextChange}
          className="w-full border border-gray-300 rounded p-2 h-32"
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <form>
        <SymptomSection
          title="Genitourinary"
          checkboxes={[
            { name: 'urinaryFrequency', label: 'Urinary frequency' },
            { name: 'dysuria', label: 'Dysuria' },
            { name: 'incontinence', label: 'Incontinence' }
          ]}
          detailsName="genitourinaryDetails"
        />
        
        <SymptomSection
          title="Musculoskeletal"
          checkboxes={[
            { name: 'jointPain', label: 'Joint pain' },
            { name: 'muscleWeakness', label: 'Muscle Weakness' },
            { name: 'stiffness', label: 'Stiffness' }
          ]}
          detailsName="musculoskeletalDetails"
        />
        
        <SymptomSection
          title="Neurological"
          checkboxes={[
            { name: 'headaches', label: 'Headaches' },
            { name: 'dizziness', label: 'Dizziness' },
            { name: 'numbnessWeakness', label: 'Numbness/Weakness' },
            { name: 'seizures', label: 'Seizures' }
          ]}
          detailsName="neurologicalDetails"
        />
        
        <SymptomSection
          title="Psychiatric"
          checkboxes={[
            { name: 'depression', label: 'Depression' },
            { name: 'anxiety', label: 'Anxiety' },
            { name: 'sleepingDisturbances', label: 'Sleeping Disturbances' }
          ]}
          detailsName="psychiatricDetails"
        />
        
        <SymptomSection
          title="Endocrine"
          checkboxes={[
            { name: 'heatColdIntolerance', label: 'Heat/Cold Intolerance' },
            { name: 'excessiveThirstHunger', label: 'Excessive Thirst/Hunger' }
          ]}
          detailsName="endocrineDetails"
        />
        
        <SymptomSection
          title="Haematologic/Lymphatic"
          checkboxes={[
            { name: 'easyBruising', label: 'Easy Bruising' },
            { name: 'bleedingTendencies', label: 'Bleeding Tendencies' }
          ]}
          detailsName="haematologicDetails"
        />
        
        <SymptomSection
          title="Allergic/Immunologic"
          checkboxes={[
            { name: 'frequentInfections', label: 'Frequent Infections' },
            { name: 'allergicReactions', label: 'Allergic Reactions' }
          ]}
          detailsName="allergicDetails"
        />
        
        <div className="mt-8">
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}