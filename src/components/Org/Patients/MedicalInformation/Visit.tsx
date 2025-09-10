import { useFieldArray, useFormContext } from "react-hook-form";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { FormDataStepper } from "../PatientStepper";

// Define validation schema for a visit entry
export const visitEntrySchema = z.array(
  z.object({
    id: z.number(),
    visitCategory: z.string().min(1, "Visit category is required"),
    dateOfService: z.date({ required_error: "Date of service is required" }),
    duration: z.string().min(1, "Duration is required"),
    chiefComplaint: z.string().min(1, "Chief complaint is required").max(500, "Chief complaint too long"),
    hpiOnsetDate: z.date({ required_error: "HPI onset date is required" }),
    hpiDuration: z.string().min(1, "HPI duration is required"),
    severity: z.string().min(1, "Severity is required"),
    quality: z.string().min(1, "Quality is required"),
    aggravatingFactors: z.string().max(500, "Aggravating factors too long").optional(),
    diagnosis: z.string().min(1, "Diagnosis is required").max(500, "Diagnosis too long"),
    diagnosisOnsetDate: z.date({ required_error: "Diagnosis onset date is required" }),
    treatmentPlan: z.string().min(1, "Treatment plan is required").max(1000, "Treatment plan too long"),
    providerName: z.string().min(1, "Provider name is required").max(100, "Provider name too long"),
    providerSignature: z.string().min(1, "Provider signature is required").max(100, "Provider signature too long"),
  })
);

export type VisitEntrySchemaType = z.infer<typeof visitEntrySchema>;


// Mock data for dropdowns
const visitCategories = [
  "Initial Visit",
  "Follow-up",
  "Urgent Care",
  "Annual Physical",
  "Consultation",
];
const durations = [
  "15 minutes",
  "30 minutes",
  "45 minutes",
  "60 minutes",
  "90 minutes",
];
const severityOptions = ["Mild", "Moderate", "Severe", "Very Severe"];
const qualityOptions = ["Sharp", "Dull", "Burning", "Throbbing", "Aching"];
const aggravatingFactors = ["Movement", "Rest", "Cold", "Heat", "Stress", "Food"];
const conditions = ["Hypertension", "Diabetes", "Asthma", "Arthritis", "Migraine"];
export default function MedicalVisitForm() {
  const {
    control,
    setValue,
  } = useFormContext<Pick<FormDataStepper, 'visits'>>();

  const { fields, append, remove } = useFieldArray<Pick<FormDataStepper, 'visits'>>({
    control,
    name: "visits",
  });

  const addVisitEntry = (): void => {
    const newId =
      fields.length > 0
        ? Math.max(...fields.map((entry) => entry.id as unknown as number)) + 1
        : 1;

    append([
      ...fields,
      {
        id: newId,
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
      }
    ]);
  };

  const removeVisitEntry = (id: string): void => {
    remove(parseInt(id));
  };




  const handleInputChange = (id: string, field: keyof VisitEntrySchemaType, value: string): void => {
    setValue(`visits?.${parseInt(id)}.${field as unknown as string}`, value);
  };


  return (
    <div className=" mx-auto p-6 ">
      <h1 className="text-2xl font-bold mb-6">Medical Visit Details</h1>

      <div>
        {fields.map((entry, index) => (
          <div key={entry.id} className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Visit Entry {index + 1}
              </h2>
              <div className="flex gap-2">
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVisitEntry(entry.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Remove
                  </button>
                )}
                {index === fields.length - 1 && (
                  <button
                    type="button"
                    onClick={addVisitEntry}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Add Another
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Visit Category */}
              <div>
                <label className="block text-base text-black font-normal mb-2">
                  Visit Category
                </label>
                <Select
                  value={entry.visitCategory}
                  onValueChange={(value) =>
                    handleInputChange(entry.id,"visitCategory", value)
                  }
                >
                  <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                    <SelectValue placeholder="Enter here" />
                  </SelectTrigger>
                  <SelectContent className="z-10 bg-white">
                    {visitCategories.map((category) => (
                      <SelectItem key={category} value={category} className="hover:bg-gray-200">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date of Service */}
              <div>
                <label className="block text-base text-black font-normal mb-2">
                  Date of Service
                </label>
                <DatePicker
                  date={entry.dateOfService ? new Date(entry.dateOfService) : undefined}
                  onDateChange={(date) =>
                    handleInputChange(entry.id,'dateOfService', date ? date.toISOString().split('T')[0] : '')
                  }
                  placeholder="Select date of service"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-base text-black font-normal mb-2">
                  Duration
                </label>
                <Select
                  value={entry.duration}
                  onValueChange={(value) =>
                    handleInputChange(entry.id, "duration", value)
                  }
                >
                  <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                    <SelectValue placeholder="Enter here" />
                  </SelectTrigger>
                  <SelectContent className="z-10 bg-white">
                    {durations.map((duration) => (
                      <SelectItem key={duration} value={duration} className="hover:bg-gray-200">
                        {duration}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Presenting Complaint & History of Present Illness */}
            <div className="mt-6">
              <h3 className="text-base font-medium mb-4">Presenting Complaint & History of Present Illness</h3>

              {/* Chief Complaint */}
              <div className="mb-6">
                <label className="block text-base text-black font-normal mb-2">
                  Chief Complaint
                </label>
                <Textarea
                  value={entry.chiefComplaint}
                  className="w-full h-32 p-3 border border-[#737373] rounded"
                  onChange={(e) =>
                    handleInputChange(entry.id, "chiefComplaint", e.target.value)
                  }
                />
              </div>

              <h3 className="text-base font-medium mb-4">History of Present Illness (HPI)</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* HPI Onset Date */}
                <div>
                  <label className="block text-base text-black font-normal mb-2">
                    Onset date
                  </label>
                  <DatePicker
                    date={entry.hpiOnsetDate ? new Date(entry.hpiOnsetDate) : undefined}
                    onDateChange={(date) =>
                      handleInputChange(entry.id, "hpiOnsetDate", date ? date.toISOString().split('T')[0] : '')
                    }
                    placeholder="Select onset date"
                  />
                </div>

                {/* HPI Duration */}
                <div>
                  <label className="block text-base text-black font-normal mb-2">
                    Duration
                  </label>
                  <Select
                    value={entry.hpiDuration}
                    onValueChange={(value) =>
                      handleInputChange(entry.id, "hpiDuration", value)
                    }
                  >
                    <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                      <SelectValue placeholder="Enter here" />
                    </SelectTrigger>
                    <SelectContent className="z-10 bg-white">
                      {durations.map((duration) => (
                        <SelectItem key={duration} value={duration} className="hover:bg-gray-200">
                          {duration}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-base text-black font-normal mb-2">
                    Severity
                  </label>
                  <Select
                    value={entry.severity}
                    onValueChange={(value) =>
                      handleInputChange(entry.id, "severity", value)
                    }
                  >
                    <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                      <SelectValue placeholder="Enter here" />
                    </SelectTrigger>
                    <SelectContent className="z-10 bg-white">
                      {severityOptions.map((option) => (
                        <SelectItem key={option} value={option} className="hover:bg-gray-200">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quality */}
                <div>
                  <label className="block text-base text-black font-normal mb-2">
                    Quality
                  </label>
                  <Select
                    value={entry.quality}
                    onValueChange={(value) =>
                      handleInputChange(entry.id, "quality", value)
                    }
                  >
                    <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                      <SelectValue placeholder="Enter here" />
                    </SelectTrigger>
                    <SelectContent className="z-10 bg-white">
                      {qualityOptions.map((option) => (
                        <SelectItem key={option} value={option} className="hover:bg-gray-200">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Aggravating/relieving factors */}
              <div className="mt-6">
                <label className="block text-base text-black font-normal mb-2">
                  Aggravating/relieving factors
                </label>
                <Select
                  value={entry.aggravatingFactors}
                  onValueChange={(value) =>
                    handleInputChange(entry.id, "aggravatingFactors", value)
                  }
                >
                  <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                    <SelectValue placeholder="Enter here" />
                  </SelectTrigger>
                  <SelectContent className="z-10 bg-white">
                    {aggravatingFactors.map((factor) => (
                      <SelectItem key={factor} value={factor} className="hover:bg-gray-200">
                        {factor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="mt-6">
              <h3 className="text-base font-medium mb-4">Diagnosis</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Condition */}
                <div>
                  <label className="block text-base text-black font-normal mb-2">
                    Condition
                  </label>
                  <Select
                    value={entry.diagnosis}
                    onValueChange={(value) =>
                      handleInputChange(entry.id, "diagnosis", value)
                    }
                  >
                    <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                      <SelectValue placeholder="Enter here" />
                    </SelectTrigger>
                    <SelectContent className="z-10 bg-white">
                      {conditions.map((condition) => (
                        <SelectItem key={condition} value={condition} className="hover:bg-gray-200">
                          {condition}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Diagnosis Onset Date */}
                <div>
                  <label className="block text-base text-black font-normal mb-2">
                    Onset date
                  </label>
                  <DatePicker
                    date={entry.diagnosisOnsetDate ? new Date(entry.diagnosisOnsetDate) : undefined}
                    onDateChange={(date) =>
                      handleInputChange(entry.id, "diagnosisOnsetDate", date ? date.toISOString().split('T')[0] : '')
                    }
                    placeholder="Select diagnosis onset date"
                  />
                </div>
              </div>
            </div>

            {/* Treatment Plan */}
            <div className="mt-6">
              <h3 className="text-base font-medium mb-4">Treatment Plan</h3>

              <div className="mb-6">
                <label className="block text-base text-black font-normal mb-2">
                  Notes
                </label>
                <Textarea
                  value={entry.treatmentPlan}
                  className="w-full h-32 p-3 border border-[#737373] rounded"
                  onChange={(e) =>
                    handleInputChange(entry.id, "treatmentPlan", e.target.value)
                  }
                  rows={4}
                />
              </div>
            </div>

            {/* Provider Information */}
            <div className="mt-6">
              <div className="mb-6">
                <label className="block text-base text-black font-normal mb-2">
                  Provider name
                </label>
                <Input
                  type="text"
                  className="w-full h-14 p-3 border border-[#737373] rounded"
                  value={entry.providerName}
                  onChange={(e) =>
                    handleInputChange(entry.id, "providerName", e.target.value)
                  }
                  placeholder="Enter here"
                />
              </div>

              <div className="mb-6">
                <label className="block text-base text-black font-normal mb-2">
                  Provider signature with date and time stamp
                </label>
                <Textarea
                  value={entry.providerSignature}
                  className="w-full h-32 p-3 border border-[#737373] rounded"
                  onChange={(e) =>
                    handleInputChange(entry.id, "providerSignature", e.target.value)
                  }
                  rows={4}
                />
              </div>
            </div>

            <hr className="my-8 border-gray-200" />
          </div>
        ))}


      </div>
    </div>
  );
};
