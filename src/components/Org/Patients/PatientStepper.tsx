"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PatientDemoSchema } from "./PersonalInformation/PatientDemographicsForm";
import { addionalDemoSchema } from "./PersonalInformation/Additionaldemographics";
import { childrenSchema } from "./PersonalInformation/ChildrenInformation";
import { emergencySchema } from "./PersonalInformation/EmergencyContact";
import { patientStatusSchema } from "./MedicalInformation/PatientStatus";
import { allergySchema } from "./MedicalInformation/AllergyInformation";
import { medHistorySchema } from "./MedicalInformation/MedicalHhistory";
import { surgeryHistorySchema } from "./MedicalInformation/SurgeryInformation";
import { immunizationHistorySchema } from "./MedicalInformation/ImmunizationHistory";
import { famHistorySchema } from "./MedicalInformation/FamilyHistory";
import { lifestyleSchema } from "./MedicalInformation/SocialHistory";
import { processRequestAuth } from "@/framework/https";
import { useRouter } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Import form components
import PatientDemographicsForm from "./PersonalInformation/PatientDemographicsForm";
import AdditionalDemographics from "./PersonalInformation/Additionaldemographics";
import ChildrenInformation from "./PersonalInformation/ChildrenInformation";
import EmergencyContact from "./PersonalInformation/EmergencyContact";
import PatientStatus from "./MedicalInformation/PatientStatus";
import AllergyInformation from "./MedicalInformation/AllergyInformation";
import MedicalHistoryForm from "./MedicalInformation/MedicalHhistory";
import SurgeryHistoryForm from "./MedicalInformation/SurgeryInformation";
import ImmunizationForm from "./MedicalInformation/ImmunizationHistory";
import FamilyHistoryForm from "./MedicalInformation/FamilyHistory";
import LifestyleForm from "./MedicalInformation/SocialHistory";
import VitalSignsForm from "./MedicalInformation/VitalsForm";
import MedicalSymptomForm from "./MedicalInformation/ReviewOfSystem";
import MedicalSymptomsForm from "./MedicalInformation/AdditionalReview";
import MedicationForm, { prescriptionSchema } from "./MedicalInformation/Prescriptions";
import MedicalVisitForm, { visitEntrySchema } from "./MedicalInformation/Visit";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/framework/api-endpoints";


export const formSchema = z.object({
  demographic: PatientDemoSchema,
  addDemographic: addionalDemoSchema,
  children: childrenSchema,
  emergency: emergencySchema,
  patientStatus: patientStatusSchema,
  allergies: allergySchema,
  medHistory: medHistorySchema,
  surgeryHistory: surgeryHistorySchema,
  immunizationHistory: immunizationHistorySchema,
  famhistory: famHistorySchema,
  lifeStyle: lifestyleSchema,
  visits: visitEntrySchema,
  prescriptions: prescriptionSchema,
}).partial();

export type FormData = z.infer<typeof formSchema>;

const steps = [
  // Personal Information Steps
  {
    id: "demographics",
    title: "Patient Demographics",
    description: "Basic patient information",
    component: PatientDemographicsForm,
    category: "personal",
  },
  {
    id: "additional-demographics",
    title: "Additional Demographics",
    description: "Additional patient details",
    component: AdditionalDemographics,
    category: "personal",
  },
  {
    id: "children-info",
    title: "Children Information",
    description: "Information for patients under 18",
    component: ChildrenInformation,
    category: "personal",
  },
  {
    id: "emergency-contact",
    title: "Emergency Contact",
    description: "Emergency contact information",
    component: EmergencyContact,
    category: "personal",
  },
  // Medical Information Steps
  {
    id: "patient-status",
    title: "Patient Status",
    description: "Current patient status",
    component: PatientStatus,
    category: "medical",
  },
  {
    id: "allergies",
    title: "Allergies",
    description: "Patient allergy information",
    component: AllergyInformation,
    category: "medical",
  },
  {
    id: "medical-history",
    title: "Medical History",
    description: "Medical and medication history",
    component: MedicalHistoryForm,
    category: "medical",
  },
  {
    id: "surgery-history",
    title: "Surgery History",
    description: "Surgery and procedures history",
    component: SurgeryHistoryForm,
    category: "medical",
  },
  {
    id: "immunization-history",
    title: "Immunization History",
    description: "Vaccination history",
    component: ImmunizationForm,
    category: "medical",
  },
  {
    id: "family-history",
    title: "Family History",
    description: "Family medical history",
    component: FamilyHistoryForm,
    category: "medical",
  },
  {
    id: "social-history",
    title: "Social History",
    description: "Lifestyle and social information",
    component: LifestyleForm,
    category: "medical",
  },
  {
    id: "vitals",
    title: "Vital Signs",
    description: "Patient vital signs and measurements",
    component: VitalSignsForm,
    category: "medical",
  },
  {
    id: "review-system",
    title: "Review of System",
    description: "System review and symptoms assessment",
    component: MedicalSymptomForm,
    category: "medical",
  },
  {
    id: "additional-review",
    title: "Additional Review",
    description: "Additional system review details",
    component: MedicalSymptomsForm,
    category: "medical",
  },
  {
    id: "prescriptions",
    title: "Prescriptions",
    description: "Current prescriptions and medications",
    component: MedicationForm,
    category: "medical",
  },
  {
    id: "visit",
    title: "Visit Information",
    description: "Visit details and notes",
    component: MedicalVisitForm,
    category: "medical",
  },
];

export default function PatientStepper({ slug }: { slug: string }): React.ReactElement {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      patientStatus: {
        dischargeEntries: [{
          patientStatus: "",
          dischargedDate: "",
          reasonForDischarge: ""
        }]
      },
      allergies: [{
        allergy: "",
        startDate: "",
        endDate: "",
        severity: "",
        reactions: "",
        comments: ""
      }],
      medHistory: [{
        condition: "",
        onsetDate: "",
        endDate: "",
        comments: "",
        medComments: "",
        medDosage: "",
        medEndDate: "",
        medFrequency: "",
        medMedication: "",
        medPrescribersName: "",
        medRoute: "",
        medStartDate: "",
      }],
      surgeryHistory: [{
        surgeryType: "",
        date: "",
        additionalInfo: ""
      }],
      immunizationHistory: [{
        immunizationType: "",
        date: "",
        additionalInfo: ""
      }],
      famhistory: [{
        relative: "",
        conditions: "",
        ageOfDiagnosis: "",
        currentAge: ""
      }],
      visits: [{
        visitCategory: "",
        dateOfService: new Date(),
        duration: "",
        chiefComplaint: "",
        hpiOnsetDate: new Date(),
        hpiDuration: "",
        severity: "",
        quality: "",
        aggravatingFactors: "",
        diagnosis: "",
        diagnosisOnsetDate: new Date(),
        treatmentPlan: "",
        providerName: "",
        providerSignature: "",
      }],
      prescriptions: [{
        checkedDrugFormulary: false,
        controlledSubstance: false,
        startDate: new Date(),
        prescriberName: "",
        dosage: "",
        directions: "",
        notes: "",
        addToMedicationList: "yes",
      }],
      
      
      
    }
  });

  const handleStepComplete = (stepIndex: number) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
  };

  const handleSaveProgress = () => {
    console.log(currentStep, "currentStep", methods.getValues())
    //  save to local storage
    localStorage.setItem(`patient-${slug}`, JSON.stringify({
      currentStep,
      completedSteps: Array.from(completedSteps),
      data: methods.getValues()
    }))
  }

  useEffect(() => {
    const patientData = localStorage.getItem(`patient-${slug}`);
    if (patientData) {
      const parsedData = JSON.parse(patientData);
      console.log(parsedData, "parsedData")
      methods.reset(parsedData.data);
      setCurrentStep(parsedData.currentStep);
      setCompletedSteps(new Set(parsedData.completedSteps));
      // toast success
      toast.success("Patient data loaded successfully");
    }
  }, [slug, methods]);

  const handleNext = () => {
    // Mark current step as completed
    handleStepComplete(currentStep);

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (canProceedToStep(stepIndex)) {
      setCurrentStep(stepIndex);
    }
  };

  const canProceedToStep = (stepIndex: number) => {
    // Allow navigation to any step that is completed or is the next step after the last completed step
    const lastCompletedStep = Math.max(...Array.from(completedSteps), -1);
    return stepIndex <= lastCompletedStep + 1;
  };

  function mapFormDataToPatientDto(formData: FormData) {
    const { demographic, addDemographic, children, emergency, patientStatus, allergies, medHistory, surgeryHistory, immunizationHistory, famhistory, lifeStyle, visits, prescriptions } = formData ;

    // Map to match backend CreatePatientDto structure
    return {
      // Primary info fields
      suffix: demographic?.suffix,
      first_name: demographic?.firstName,
      middle_name: demographic?.middleName,
      last_name: demographic?.lastName,
      preferred_name: demographic?.preferredName, // Note: typo in schema
      sex: demographic?.sex,
      date_of_birth: new Date(demographic?.dateOfBirth || "").toISOString(),
      marital_status: demographic?.maritalStatus,
      race: demographic?.race,
      ethnicity: demographic?.ethnicity,
      interpreter_required: demographic?.interpreterRequired === "Yes",
      religion: demographic?.religion,
      gender_identity: demographic?.genderIdentity,
      sexual_orientation: demographic?.sexualOrientation,
      image: demographic?.patientImage,

      // Contact info
      contact_info: {
        country: addDemographic?.country,
        state: addDemographic?.state,
        city: addDemographic?.city,
        zip_code: addDemographic?.postal,
        email: addDemographic?.email,
        email_work: addDemographic?.workEmail,
        phone_number_mobile: addDemographic?.mobilePhone,
        phone_number_home: addDemographic?.homePhone,
        address: addDemographic?.address,
        current_address: addDemographic?.currentAddress,
        method_of_contact: addDemographic?.contactMethod,
        lived_address_from: addDemographic?.addressFrom,
        lived_address_to: addDemographic?.addressTo,
        current_living_situation: addDemographic?.livingSituation,
        referral_source: addDemographic?.referralSource,
        occupational_status: addDemographic?.occupationStatus,
        industry: addDemographic?.industry,
        household_size: addDemographic?.householdSize,
        notes: addDemographic?.notes,
      },

      // Emergency info
      emergencyInfo: {
        emergency_contact_name: emergency?.name,
        emergency_contact_phone_number: emergency?.phone,
        emergency_contact_relationship: emergency?.relationship,
        emergency_contact_email: emergency?.email,
        contact_emergency_contact: emergency?.permission === "Yes",
      },

      // Guardian info
      guardian_info: {
        Guardian_full_name: children?.fullName,
        Guardian_email: children?.email,
        Guardian_phone_number: children?.phone,
        Guardian_relationship: children?.relationship,
        Guardian_sex: children?.sex,
      },

      // Medical data arrays
      allergies: allergies || [],
      medicalHistories: medHistory || [],
      surgeries: surgeryHistory || [],
      immunizations: immunizationHistory || [],
      familyHistory: famhistory || [],
      surgeryHistory: surgeryHistory || [],
      status: patientStatus || {},
      socialHistory: lifeStyle || {},
      visits: visits || [],
      prescriptions: prescriptions || [],
    };
  }

  console.log("data", methods.formState.errors)
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields
      if (!data.demographic?.firstName || !data.demographic?.lastName || !data.demographic?.dateOfBirth) {
        setError("Please fill in all required fields: First Name, Last Name, and Date of Birth");
        return;
      }

      const mappedData = mapFormDataToPatientDto(data);
      console.log("Submitting patient data:", mappedData);
      // return
      const res = await processRequestAuth(
        "post",
        API_ENDPOINTS.CREATE_PATIENT(Number(slug)),
        mappedData
      );

      console.log("API Response:", res);

      if (res && (res.status === true || res.status === 200 || res.success)) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/dashboard/organization/${slug}/patients`);
        }, 1500);
        // clear local storage
        localStorage.removeItem(`patient-${slug}`);
      } else {
        setError(res?.message || res?.error || "Failed to add patient. Please try again.");
      }
    } catch (err: unknown) {
      console.error("Patient submission error:", err);
      const errorMessage = err instanceof Error ? err.message :
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Failed to add patient. Please check your connection and try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep]?.component;

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Sidebar - Steps */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Patient Registration</h2>

          {/* Personal Information Section */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Personal Information
            </h3>
            {steps.filter(step => step.category === "personal").map((step, index) => {
              const stepIndex = steps.findIndex(s => s.id === step.id);
              const isCompleted = completedSteps.has(stepIndex);
              const isActive = currentStep === stepIndex;
              const canAccess = canProceedToStep(stepIndex);

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center p-3 rounded-lg mb-2 transition-colors",
                    isActive ? "bg-blue-50 border-l-4 border-blue-500" : "",
                    isCompleted && !isActive ? "bg-green-50" : "",
                    canAccess ? "cursor-pointer hover:bg-gray-50" : "cursor-not-allowed opacity-50"
                  )}
                  onClick={() => handleStepClick(stepIndex)}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-medium",
                    isCompleted ? "bg-green-500 text-white" :
                      isActive ? "bg-blue-500 text-white" :
                        canAccess ? "bg-gray-200 text-gray-600" : "bg-gray-100 text-gray-400"
                  )}>
                    {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{step.title}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Medical Information Section */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Medical Information
            </h3>
            {steps.filter(step => step.category === "medical").map((step, index) => {
              const stepIndex = steps.findIndex(s => s.id === step.id);
              const isCompleted = completedSteps.has(stepIndex);
              const isActive = currentStep === stepIndex;
              const canAccess = canProceedToStep(stepIndex);

              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center p-3 rounded-lg mb-2 transition-colors",
                    isActive ? "bg-blue-50 border-l-4 border-blue-500" : "",
                    isCompleted && !isActive ? "bg-green-50" : "",
                    canAccess ? "cursor-pointer hover:bg-gray-50" : "cursor-not-allowed opacity-50"
                  )}
                  onClick={() => handleStepClick(stepIndex)}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-medium",
                    isCompleted ? "bg-green-500 text-white" :
                      isActive ? "bg-blue-500 text-white" :
                        canAccess ? "bg-gray-200 text-gray-600" : "bg-gray-100 text-gray-400"
                  )}>
                    {isCompleted ? <Check className="w-4 h-4" /> : steps.filter(s => s.category === "personal").length + index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{step.title}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {steps[currentStep].title}
              </h1>
              <p className="text-gray-600 mt-1">
                {steps[currentStep].description}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                Step {currentStep + 1} of {steps.length}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {completedSteps.size} of {steps.length} steps completed
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>

          {/* Form Content */}
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
                  <Check className="w-5 h-5 mr-2" />
                  Patient added successfully! Redirecting to patients list...
                </div>
              )}

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {CurrentStepComponent ? (
                  <CurrentStepComponent />
                ) : (
                  <div className="text-red-500">
                    Error: Component not found for step {currentStep + 1} - {steps[currentStep]?.title}
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="flex items-center"
                  >
                    Previous
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveProgress}
                    className="flex items-center"
                  >
                    Save Progress
                  </Button>
                </div>

                <div className="flex gap-3">
                  {currentStep < steps.length - 1 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center bg-blue-600 hover:bg-blue-700"
                    >
                      Next Step
                      <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex items-center bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        "Submit Patient"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
} 