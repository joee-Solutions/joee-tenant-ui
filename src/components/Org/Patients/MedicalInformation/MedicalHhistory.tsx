import { useState, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Controller, useFieldArray, useForm, useFormContext } from "react-hook-form";
import { DatePicker } from "@/components/ui/date-picker";
import { FormData } from "../AddPatient";
import { z } from "zod";

// Define interfaces for our data structures
interface MedicalCondition {
  id: number;
  condition: string;
  onsetDate: string;
  endDate: string;
  comments: string;
}

interface Medication {
  id: number;
  medication: string;
  startDate: string;
  endDate: string;
  dosage: string;
  frequency: string;
  route: string;
  prescribersName: string;
  comments: string;
}
const medicalConditionOptions = [
  "Asthma",
  "Diabetes",
  "Hypertension",
  "Arthritis",
  "Allergies",
  "Heart Disease",
  "Cancer",
  "Depression",
  "Anxiety",
  "COPD",
];

const medicationOptions = [
  "Lisinopril",
  "Metformin",
  "Albuterol",
  "Atorvastatin",
  "Levothyroxine",
  "Amlodipine",
  "Metoprolol",
  "Omeprazole",
  "Simvastatin",
  "Losartan",
];

const frequencyOptions = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "Every 4 hours",
  "Every 6 hours",
  "Every 12 hours",
  "Weekly",
  "As needed",
];

const routeOptions = [
  "Oral",
  "Intravenous",
  "Intramuscular",
  "Subcutaneous",
  "Topical",
  "Inhalation",
  "Nasal",
  "Rectal",
  "Ophthalmic",
];

export const medHistorySchema = z.array(
  z.object({
    id: z.number(),
    condition: z.string().optional(),
    onsetDate: z.string().optional(),
    endDate: z.string().optional(),
    comments: z.string().optional(),
    medMedication: z.string().optional(),
    medStartDate: z.string().optional(),
    medEndDate: z.string().optional(),
    medDosage: z.string().optional(),
    medFrequency: z.string().optional(),
    medRoute: z.string().optional(),
    medPrescribersName: z.string().optional(),
    medComments: z.string().optional(),
  }),

)
export type MedicalHistoryFormData = z.infer<typeof medHistorySchema>;
export default function MedicalHistoryForm() {

  const { control, register, formState: { errors } } = useFormContext<Pick<FormData, 'medHistory'>>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medHistory',
  });

  return (
    <div className=" mx-auto p-6">
      {/* Medical History Section */}
      <h1 className="text-2xl font-bold mb-6">Medical History</h1>
      {
        fields.map((field, index) => (
          <div key={field.id} className="mb-8 border-b pb-6">
            <div className="flex flex-col justify-between mb-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Remove
                    </button>
                  )}
                  {index === fields.length - 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        append({
                          id: Date.now(),
                          condition: "",
                          onsetDate: "",
                          endDate: "",
                          comments: "",
                          medMedication: "",
                          medStartDate: "",
                          medEndDate: "",
                          medDosage: "",
                          medFrequency: "",
                          medRoute: "",
                          medPrescribersName: "",
                          medComments: "",
                        })
                      }
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Add Another
                    </button>
                  )}
                </div>
              </div>

              <div className="">
                <h2 className="text-lg font-semibold">Medical History Entry {index + 1}</h2>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="w-full md:w-1/2">
                    <label className="block text-base text-black font-normal mb-2">Medical Condition</label>
                    <Input
                      type="text"
                      {...register(`medHistory.${index}.condition`, { required: "Condition is required" })}
                      className={`w-full h-14 p-3 border ${errors.medHistory?.[index]?.condition ? 'border-red-500' : 'border-[#737373]'} rounded`}
                    />
                    {errors.medHistory?.[index]?.condition && (
                      <p className="text-red-500 text-sm mt-1">{errors.medHistory[index].condition.message}</p>
                    )}
                  </div>

                  <div className="w-full md:w-1/2">
                    <label className="block text-base text-black font-normal mb-2">Onset Date</label>
                    <Controller
                      name={`medHistory.${index}.onsetDate`}
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          date={field.value ? new Date(field.value) : undefined}
                          onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                          placeholder="Select onset date"
                        />
                      )}
                    />
                    {errors.medHistory?.[index]?.onsetDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.medHistory[index].onsetDate.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="w-full md:w-1/2">
                    <label className="block text-base text-black font-normal mb-2">End Date</label>
                    <Controller
                      name={`medHistory.${index}.endDate`}
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          date={field.value ? new Date(field.value) : undefined}
                          onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                          placeholder="Select end date"
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="w-full">
                  <label className="block text-base text-black font-normal mb-2">Comments</label>
                  <Textarea
                    {...register(`medHistory.${index}.comments`)}
                    className="w-full h-32 p-3 border border-[#737373] rounded"
                    rows={4}
                  />
                </div>

              </div>
            </div>
            {/* Medication History */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-4">Medication History</h2>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="w-full md:w-1/2">
                  <label className="block text-base text-black font-normal mb-2">Medication</label>
                  <Input
                    type="text"
                    {...register(`medHistory.${index}.medMedication`, { required: "Medication is required" })}
                    className={`w-full h-14 p-3 border ${errors.medHistory?.[index]?.medMedication ? 'border-red-500' : 'border-[#737373]'} rounded`}
                  />
                  {errors.medHistory?.[index]?.medMedication && (
                    <p className="text-red-500 text-sm mt-1">{errors.medHistory[index].medMedication.message}</p>
                  )}
                </div>

                <div className="w-full md:w-1/2">
                  <label className="block text-base text-black font-normal mb-2">Start Date</label>
                  <Controller
                    name={`medHistory.${index}.medStartDate`}
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                        placeholder="Select start date"
                      />
                    )}
                  />
                  {errors.medHistory?.[index]?.medStartDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.medHistory[index].medStartDate.message}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:grid md:grid-cols-2 gap-4 mb-4">
                <div className="w-full">
                  <label className="block text-base text-black font-normal mb-2">End Date</label>
                  <Controller
                    name={`medHistory.${index}.medEndDate`}
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                        placeholder="Select end date"
                      />
                    )}
                  />
                </div>

                <div className="w-full">
                  <label className="block text-base text-black font

                  normal mb-2">Dosage</label>
                  <Input
                    type="text"
                    {...register(`medHistory.${index}.medDosage`, { required: "Dosage is required" })}
                    className={`w-full h-14 p-3 border ${errors.medHistory?.[index]?.medDosage ? 'border-red-500' : 'border-[#737373]'} rounded`}
                  />
                  {errors.medHistory?.[index]?.medDosage && (
                    <p className="text-red-500 text-sm mt-1">{errors.medHistory[index].medDosage.message}</p>
                  )}

                </div>

                <div className="w-full">
                  <Controller
                    control={control}
                    name={`medHistory.${index}.medFrequency`}
                    render={({ field }) => (
                      <div>
                        <label className="block text-base text-black font-normal mb-2">Frequency</label>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className={`w-full h-14 p-3 border ${errors.medHistory?.[index]?.medFrequency ? 'border-red-500' : 'border-[#737373]'} rounded`}
                          >
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent className="z-10 bg-white">
                            {frequencyOptions.map((opt) => (
                              <SelectItem key={opt} value={opt} className="hover:bg-gray-200 py-2">
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.medHistory?.[index]?.medFrequency && (
                          <p className="text-red-500 text-sm mt-1">{errors.medHistory[index].medFrequency.message}</p>
                        )}
                      </div>
                    )}
                  />


                </div>
                <div className="w-full">
                  <Controller
                    control={control}
                    name={`medHistory.${index}.medRoute`}
                    render={({ field }) => (
                      <div>
                        <label className="block text-base text-black font-normal mb-2">Route</label>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className={`w-full h-14 p-3 border ${errors.medHistory?.[index]?.medRoute ? 'border-red-500' : 'border-[#737373]'} rounded`}
                          >
                            <SelectValue placeholder="Select route" />
                          </SelectTrigger>
                          <SelectContent className="z-10 bg-white">
                            {routeOptions.map((opt) => (
                              <SelectItem key={opt} value={opt} className="hover:bg-gray-200 py-2">
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.medHistory?.[index]?.medRoute && (
                          <p className="text-red-500 text-sm mt-1">{errors.medHistory[index].medRoute.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>
                <div className="w-full col-span-2">
                  <label className="block text-base text-black font-normal mb-2">Prescriber&apos;s Name</label>
                  <Input
                    type="text"
                    {...register(`medHistory.${index}.medPrescribersName`, { required: "Prescriber's name is required" })}
                    className={`w-full h-14 p-3 border ${errors.medHistory?.[index]?.medPrescribersName ? 'border-red-500' : 'border-[#737373]'} rounded`}
                  />
                  {errors.medHistory?.[index]?.medPrescribersName && (
                    <p className="text-red-500 text-sm mt-1">{errors.medHistory[index].medPrescribersName.message}</p>
                  )}
                </div>
                <div className="w-full">
                  <label className="block text-base text-black font-normal mb-2">Comments</label>
                  <Textarea
                    {...register(`medHistory.${index}.medComments`)}
                    className="w-full h-32 p-3 border border-[#737373] rounded"
                    rows={4}
                  />
                  {errors.medHistory?.[index]?.medComments && (
                    <p className="text-red-500 text-sm mt-1">{errors.medHistory[index].medComments.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
    </div>
  )


}