import { useState } from "react";
import PersonalInformationTab from "@/components/Org/Patients/PersonalInformationTab";
import MedicalInformationTab from "@/components/Org/Patients/MedicalInformationTab";
import { Button } from "@/components/ui/button";
import { FormProvider, useForm } from "react-hook-form";
import { Schema, z } from "zod";
import { PatientDemoSchema } from "./PersonalInformation/PatientDemographicsForm";
import { zodResolver } from "@hookform/resolvers/zod";
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
})

export type FormData = z.infer<typeof formSchema>
export default function PatientFormContainer({ slug }: { slug: string }): React.ReactElement {
  const [activeTab, setActiveTab] = useState<"personal" | "medical">("personal");
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
    }
  });

  function mapFormDataToPatientDto(formData: FormData) {
    // Example mapping, adjust as needed for your backend DTO
    const { demographic, addDemographic, children, emergency, patientStatus, allergies, medHistory, surgeryHistory, immunizationHistory, famhistory, lifeStyle } = formData;
    return {
      // Top-level fields (adjust as needed)
      first_name: demographic?.firstName,
      last_name: demographic?.lastName,
      middle_name: demographic?.middleName,
      preferred_name: demographic?.preferredName,
      email: demographic?.email,
      sex: demographic?.sex,
      date_of_birth: demographic?.dateOfBirth,
      address: demographic?.address,
      city: demographic?.city,
      state: demographic?.state,
      country: demographic?.country,
      zip_code: demographic?.zipCode,
      phone_number_home: demographic?.phoneNumberHome,
      // ...add more top-level fields as needed

      // Nested objects (adjust as needed)
      contact_info: {
        // Map from demographic/addDemographic
        ...addDemographic,
      },
      guardian_info: children, // guardian info if patient is a child
      emergencyInfo: {
        // Map from emergency
        ...emergency,
      },
      allergies,
      medicalHistories: medHistory,
      surgeries: surgeryHistory,
      immunizations: immunizationHistory,
      familyHistory: famhistory,
      socialHistory: lifeStyle,
      status: patientStatus,
      // ...add more nested objects as needed
    };
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const mappedData = mapFormDataToPatientDto(data);
      const res = await processRequestAuth(
        "post",
        `/super/tenants/${slug}/patients`,
        mappedData
      );
      if (res && res.status) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/dashboard/organization/${slug}/view/`);
        }, 1500);
      } else {
        setError(res?.message || "Failed to add patient.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to add patient.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className=" mx-auto">
      <div className="py-8 px-6 my-8 shadow-[0px_0px_4px_1px_#0000004D] mx-8">
        <div className="flex justify-between items-center border-b-2  py-4 mb-8">
          <h1 className="font-semibold text-xl text-black">
            Instruction - Click on a section to view and fill information
          </h1>
          <Button className="text-base text-[#003465] font-normal">
            Patients List
          </Button>
        </div>

        <div className="flex border-b">
          <button
            className={`flex-1 py-4 text-center text-lg font-medium relative ${activeTab === "personal" ? "text-[#003465]" : "text-gray-600"
              }`}
            onClick={() => setActiveTab("personal")}
          >
            Personal Information
            {activeTab === "personal" && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-[#003465]"></div>
            )}
          </button>
          <button
            className={`flex-1 py-4 text-center text-lg font-medium relative ${activeTab === "medical" ? "text-[#003465]" : "text-gray-600"
              }`}
            onClick={() => setActiveTab("medical")}
          >
            Medical Information
            {activeTab === "medical" && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-[#003465]"></div>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="mt-6">
            {error && <div className="text-red-500 mb-4">{error}</div>}
            {success && <div className="text-green-600 mb-4">Patient added successfully!</div>}
            <div>
              {activeTab === "personal" && <PersonalInformationTab />}
              {activeTab === "medical" && <MedicalInformationTab />}
            </div>
            <div className="mt-8">
              <Button type="submit" className="bg-[#003465] hover:bg-[#0d2337] text-white py-8 px-16 text-md rounded min-w-[200px]" disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
