import React from "react";
import { useFormContext, useFieldArray, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

// schema.ts
import { z } from "zod";
import { FormData } from "../AddPatient";

export const dischargeEntrySchema = z.object({
  patientStatus: z.string().optional(),
  dischargedDate: z.string().optional(),
  reasonForDischarge: z.string().optional(),
});

export const patientStatusSchema = z.object({
  dischargeEntries: z.array(dischargeEntrySchema).optional(),
});

export type patientStatusData = z.infer<typeof patientStatusSchema>;

export default function PatientDischargeForm() {
  const { control, register, setValue, watch,formState:{errors} } = useFormContext<Pick<FormData, 'patientStatus'>>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "patientStatus.dischargeEntries",
  });

  const patientStatusOptions = [
    "Discharged",
    "Admitted",
    "Ongoing",
    "Transferred",
  ];

  const dischargeEntries = watch('patientStatus.dischargeEntries');
  console.log(dischargeEntries, 'dischargeEntries',fields);
  return (
    <div className="mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Patient Discharge Information</h1>

      {fields.map((field, index) => (
        <div key={field.id} className="mb-8 border-b pb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Discharge Entry {index + 1}</h2>
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
                      patientStatus: "Discharged",
                      dischargedDate: "",
                      reasonForDischarge: "",
                    })
                  }
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                >
                  Add Another
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Status */}
            <div>
              <label className="block text-base text-black font-normal mb-2">
                Patient Status
              </label>
              <Select
                value={dischargeEntries?.[index]?.patientStatus}
                onValueChange={(value) =>
                  setValue(`patientStatus.dischargeEntries.${index}.patientStatus`, value)
                }
              >
                <SelectTrigger className="w-full p-3 border border-[#737373] h-14 rounded flex justify-between items-center">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="z-10 bg-white">
                  {patientStatusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {
                errors.patientStatus?.dischargeEntries?.[index]?.patientStatus && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.patientStatus.dischargeEntries[index].patientStatus.message}
                  </p>
                )
              }
            </div>

            {/* Discharged Date */}
            <div>
              <label className="block text-base text-black font-normal mb-2">
                Discharged Date
              </label>
              <Controller
                name={`patientStatus.dischargeEntries.${index}.dischargedDate`}
                control={control}
                render={({ field }) => (
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                    placeholder="Select discharge date"
                  />
                )}
              />
              {
                errors.patientStatus?.dischargeEntries?.[index]?.dischargedDate && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.patientStatus.dischargeEntries[index].dischargedDate.message}
                  </p>
                )
              }
            </div>

          </div>

          {/* Reason for Discharge */}
          <div className="mt-6">
            <label className="block text-base text-black font-normal mb-2">
              Reason for Discharge
            </label>
            <Textarea
              className="w-full h-32 p-3 border border-[#737373] rounded"
              placeholder="Enter reason for discharge"
              {...register(`patientStatus.dischargeEntries.${index}.reasonForDischarge`)}
            />
            {
              errors.patientStatus?.dischargeEntries?.[index]?.reasonForDischarge && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.patientStatus.dischargeEntries[index].reasonForDischarge.message}
                </p>
              )
            }
          </div>
        </div>
      ))}
    </div>
  );
}
