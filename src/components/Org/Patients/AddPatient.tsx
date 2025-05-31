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
export default function PatientFormContainer({
  slug,
}: {
  slug: string;
}): React.ReactElement {
  const [activeTab, setActiveTab] = useState<"personal" | "medical">(
    "personal"
  );

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
  const onSubmit = (data: FormData) => { console.log(data) };
  return (
    <div className=" mx-auto">
      <div className="py-8 p-[29px_14px_30px_24px] my-8 shadow-[0px_0px_4px_1px_#0000004D] mx-8">
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
            <div>
              {activeTab === "personal" && <PersonalInformationTab />}
              {activeTab === "medical" && <MedicalInformationTab />}
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
