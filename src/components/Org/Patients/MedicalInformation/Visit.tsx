import { ChangeHandler, useFieldArray, useFormContext } from "react-hook-form";
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
import { ChangeEventHandler } from "react";

// Define validation schema for a visit entry
export const visitEntrySchema = z.array(
  z.object({
    visitCategory: z.string().optional(),
    dateOfService: z.string().optional().transform((val) => val ? new Date(val) : undefined),
    duration: z.string().optional(),
    chiefComplaint: z.string().optional(),
    hpiOnsetDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
    hpiDuration: z.string().optional(),
    severity: z.string().optional(),
    quality: z.string().optional(),
    aggravatingFactors: z.string().optional(),
    diagnosis: z.string().optional(),
    diagnosisOnsetDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
    treatmentPlan: z.string().optional(),
    providerName: z.string().optional(),
    providerSignature: z.string().optional(),
  })
).optional();

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

    append(
      {
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
    );
  };

  const removeVisitEntry = (id: number): void => {
    remove(id);
  };


console.log(fields, 'fields')

  const handleInputChange = (id: number, field: keyof VisitEntrySchemaType, value: string): void => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue(`visits.${id}.${String(field)}` as any, value);
  };


  return (
    <div className=" mx-auto p-6 ">
      <h1 className="text-2xl font-bold mb-6">Medical Visit Details</h1>

      <div>
        {fields.map((entry, index) => (
          <div key={index} className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Visit Entry {index + 1}
              </h2>
              <div className="flex gap-2">
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVisitEntry(index)}
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
                    handleInputChange(index, "visitCategory" as keyof VisitEntrySchemaType, value)
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
                    handleInputChange(index, 'dateOfService' as keyof VisitEntrySchemaType, date ? date.toISOString().split('T')[0] : '')
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
                    handleInputChange(index, "duration" as keyof VisitEntrySchemaType, value)
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
                    handleInputChange(index, "chiefComplaint" as keyof VisitEntrySchemaType, e.target.value)
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
                      handleInputChange(index, "hpiOnsetDate" as keyof VisitEntrySchemaType, date ? date.toISOString().split('T')[0] : '')
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
                      handleInputChange(index, "hpiDuration" as keyof VisitEntrySchemaType, value)
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
                      handleInputChange(index, "severity" as keyof VisitEntrySchemaType, value)
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
                      handleInputChange(index, "quality" as keyof VisitEntrySchemaType, value)
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
                    handleInputChange(index, "aggravatingFactors" as keyof VisitEntrySchemaType, value)
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
                      handleInputChange(index, "diagnosis" as keyof VisitEntrySchemaType, value)
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
                      handleInputChange(index, "diagnosisOnsetDate" as keyof VisitEntrySchemaType, date ? date.toISOString().split('T')[0] : '')
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
                    handleInputChange(index, "treatmentPlan" as keyof VisitEntrySchemaType, e.target.value)
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
                    handleInputChange(index, "providerName" as keyof VisitEntrySchemaType, e.target.value) as any
                  }
                  onBlur={(e) =>
                    handleInputChange(index, "providerName" as keyof VisitEntrySchemaType, e.target.value) as any
                  }
                  name="providerName"
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
                    handleInputChange(index, "providerSignature" as keyof VisitEntrySchemaType, e.target.value)
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
