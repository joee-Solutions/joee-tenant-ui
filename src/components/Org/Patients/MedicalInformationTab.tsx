import React from 'react';
import { AccordionSection } from '@/components/ui/AccordionSection';
import PatientStatus from '@/components/Org/Patients/MedicalInformation/PatientStatus';
import AllergyInformation from '@/components/Org/Patients/MedicalInformation/AllergyInformation';
import MedicalHhistory from '@/components/Org/Patients/MedicalInformation/MedicalHhistory';
import ImmunizationHistory from '@/components/Org/Patients/MedicalInformation/ImmunizationHistory';
import FamilyHistoryForm from './MedicalInformation/FamilyHistory';
import SurgeryHistoryForm from '@/components/Org/Patients/MedicalInformation/SurgeryInformation';
import LifestyleForm from './MedicalInformation/SocialHistory';
import VitalSignsForm from './MedicalInformation/VitalsForm';


export default function MedicalInformationTab(): React.ReactElement {
  return (
    <div>
      <AccordionSection title="Patient Status">
              <PatientStatus />
      </AccordionSection>
      
      <AccordionSection title="Allergy">
      <AllergyInformation />
      </AccordionSection>
      
      <AccordionSection title="Medical and Medication History">
      <MedicalHhistory />
      </AccordionSection>
      
      <AccordionSection title="Surgery/Procedures">
      <SurgeryHistoryForm />
      </AccordionSection>
      
      <AccordionSection title="Immunization History">
      <ImmunizationHistory />
      </AccordionSection>
      
      <AccordionSection title="Family History">
      <FamilyHistoryForm />
      </AccordionSection>
      
      <AccordionSection title="Social History">
      <LifestyleForm />
      </AccordionSection>
      
      <AccordionSection title="Vitals">
      <VitalSignsForm />
      </AccordionSection>
      
      <AccordionSection title="Review of System">
      <VitalSignsForm />
        <p className="text-gray-500">ReviewOfSystem.tsx form fields will go here...</p>
      </AccordionSection>
      
      <AccordionSection title="Additional Review of System">
        <p className="text-gray-500">Additional review form fields will go here...</p>
      </AccordionSection>
      
      <AccordionSection title="Prescriptions">
        <p className="text-gray-500">Prescription form fields will go here...</p>
      </AccordionSection>
      
      <AccordionSection title="Visit">
        <p className="text-gray-500">Visit information form fields will go here...</p>
      </AccordionSection>
    </div>
  );
}