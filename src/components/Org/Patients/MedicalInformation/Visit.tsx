import { Controller, useFieldArray, useFormContext } from "react-hook-form";
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
  } = useFormContext<Pick<FormDataStepper, 'visits'>>();

  const { fields, append, remove } = useFieldArray<Pick<FormDataStepper, 'visits'>>({
    control,
    name: "visits",
  });

  const addVisitEntry = (): void => {
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
              <Controller
                name={`visits.${index}.visitCategory`}
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-base text-black font-normal mb-2">
                      Visit Category
                    </label>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                        <SelectValue placeholder="Select visit category" />
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
                )}
              />

              {/* Date of Service */}
              <Controller
                name={`visits.${index}.dateOfService`}
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-base text-black font-normal mb-2">
                      Date of Service
                    </label>
                    <DatePicker
                      date={field.value ? new Date(field.value) : undefined}
                      onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                      placeholder="Select date of service"
                    />
                  </div>
                )}
              />

              {/* Duration */}
              <Controller
                name={`visits.${index}.duration`}
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="block text-base text-black font-normal mb-2">
                      Duration
                    </label>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                        <SelectValue placeholder="Select duration" />
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
                )}
              />
            </div>

            {/* Presenting Complaint & History of Present Illness */}
            <div className="mt-6">
              <h3 className="text-base font-medium mb-4">Presenting Complaint & History of Present Illness</h3>

              {/* Chief Complaint */}
              <Controller
                name={`visits.${index}.chiefComplaint`}
                control={control}
                render={({ field }) => (
                  <div className="mb-6">
                    <label className="block text-base text-black font-normal mb-2">
                      Chief Complaint
                    </label>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      className="w-full h-32 p-3 border border-[#737373] rounded focus:outline-none focus:ring-2 focus:ring-[#003465] focus:border-[#003465]"
                      placeholder="Enter chief complaint"
                    />
                  </div>
                )}
              />

              <h3 className="text-base font-medium mb-4">History of Present Illness (HPI)</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* HPI Onset Date */}
                <Controller
                  name={`visits.${index}.hpiOnsetDate`}
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-base text-black font-normal mb-2">
                        Onset date
                      </label>
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                        placeholder="Select onset date"
                      />
                    </div>
                  )}
                />

                {/* HPI Duration */}
                <Controller
                  name={`visits.${index}.hpiDuration`}
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-base text-black font-normal mb-2">
                        Duration
                      </label>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                          <SelectValue placeholder="Select duration" />
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
                  )}
                />

                {/* Severity */}
                <Controller
                  name={`visits.${index}.severity`}
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-base text-black font-normal mb-2">
                        Severity
                      </label>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                          <SelectValue placeholder="Select severity" />
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
                  )}
                />

                {/* Quality */}
                <Controller
                  name={`visits.${index}.quality`}
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-base text-black font-normal mb-2">
                        Quality
                      </label>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                          <SelectValue placeholder="Select quality" />
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
                  )}
                />
              </div>

              {/* Aggravating/relieving factors */}
              <Controller
                name={`visits.${index}.aggravatingFactors`}
                control={control}
                render={({ field }) => (
                  <div className="mt-6">
                    <label className="block text-base text-black font-normal mb-2">
                      Aggravating/relieving factors
                    </label>
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                        <SelectValue placeholder="Select aggravating factors" />
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
                )}
              />
            </div>

            {/* Diagnosis */}
            <div className="mt-6">
              <h3 className="text-base font-medium mb-4">Diagnosis</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Condition */}
                <Controller
                  name={`visits.${index}.diagnosis`}
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-base text-black font-normal mb-2">
                        Condition
                      </label>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                          <SelectValue placeholder="Select diagnosis" />
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
                  )}
                />

                {/* Diagnosis Onset Date */}
                <Controller
                  name={`visits.${index}.diagnosisOnsetDate`}
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="block text-base text-black font-normal mb-2">
                        Onset date
                      </label>
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                        placeholder="Select diagnosis onset date"
                      />
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Treatment Plan */}
            <Controller
              name={`visits.${index}.treatmentPlan`}
              control={control}
              render={({ field }) => (
                <div className="mt-6">
                  <h3 className="text-base font-medium mb-4">Treatment Plan</h3>
                  <div className="mb-6">
                    <label className="block text-base text-black font-normal mb-2">
                      Notes
                    </label>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      className="w-full h-32 p-3 border border-[#737373] rounded focus:outline-none focus:ring-2 focus:ring-[#003465] focus:border-[#003465]"
                      rows={4}
                      placeholder="Enter treatment plan"
                    />
                  </div>
                </div>
              )}
            />

            {/* Provider Information */}
            <div className="mt-6">
              <Controller
                name={`visits.${index}.providerName`}
                control={control}
                render={({ field }) => (
                  <div className="mb-6">
                    <label className="block text-base text-black font-normal mb-2">
                      Provider name
                    </label>
                    <input
                      type="text"
                      className="w-full h-14 p-3 border border-[#737373] rounded focus:outline-none focus:ring-2 focus:ring-[#003465] focus:border-[#003465]"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      name={field.name}
                      placeholder="Enter provider name"
                    />
                  </div>
                )}
              />

              <Controller
                name={`visits.${index}.providerSignature`}
                control={control}
                render={({ field }) => (
                  <div className="mb-6">
                    <label className="block text-base text-black font-normal mb-2">
                      Provider signature with date and time stamp
                    </label>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      className="w-full h-32 p-3 border border-[#737373] rounded focus:outline-none focus:ring-2 focus:ring-[#003465] focus:border-[#003465]"
                      rows={4}
                      placeholder="Enter provider signature"
                    />
                  </div>
                )}
              />
            </div>

            <hr className="my-8 border-gray-200" />
          </div>
        ))}


      </div>
    </div>
  );
};
