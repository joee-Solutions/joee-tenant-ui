import { useForm, Controller, useFormContext, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { FormData } from "../AddPatient";

// Define the validation schema
export const prescriptionSchema = z.array(z.object({
  checkedDrugFormulary: z.boolean().default(false),
  controlledSubstance: z.boolean().default(false),
  startDate: z.date().optional(),
  prescriberName: z.string().min(1, "Prescriber name is required").max(100, "Name too long"),
  dosage: z.string().min(1, "Dosage is required").max(50, "Dosage description too long"),
  directions: z.string().min(1, "Directions are required").max(500, "Directions too long"),
  notes: z.string().max(1000, "Notes too long").optional(),
  addToMedicationList: z.enum(["yes", "no"], {
    required_error: "Please select whether to add to medication list",
  }),
}));

export type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

export default function MedicationForm() {
  const {
    register,
    control,
    formState: { errors, isSubmitting },
    setValue,
  } = useFormContext<Pick<FormData, 'prescriptions'>>();

  const { fields, append, remove } = useFieldArray<Pick<FormData, 'prescriptions'>>({
    control,
    name: "prescriptions",
  });

  const handleChange = (id: number, field: string, value: string): void => {
    setValue(`prescriptions?.${id}.${field as string}`, value);
  };


  return (
    <div className="mx-auto p-6">
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
                          checkedDrugFormulary: false,
                          controlledSubstance: false,
                          startDate: undefined,
                          prescriberName: "",
                          dosage: "",
                          directions: "",
                          notes: "",
                          addToMedicationList: "no",
                        })
                      }
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Add Another
                    </button>
                  )}
                </div>
                <div className="flex gap-12 mb-8">
                  <div className="flex items-center gap-2">
                    <Controller
                      name="prescriptions?.checkedDrugFormulary"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="checkedDrugFormulary"
                          className="accent-green-600 w-6 h-6 rounded"
                          checked={field.value as boolean}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <label htmlFor="checkedDrugFormulary" className="block text-base text-black font-normal mb-2">
                      Checked Drug Formulary
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <Controller
                      name="prescriptions?.controlledSubstance"
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="controlledSubstance"
                          className="accent-green-600 w-6 h-6 rounded"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                    <label htmlFor="controlledSubstance" className="block text-base text-black font-normal mb-2">
                      Controlled Substance
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <label htmlFor="startDate" className="block text-base text-black font-normal mb-2">
                      Start Date
                    </label>
                    <Controller
                      name="prescriptions?.startDate"
                      control={control}
                      key={field.id}
                      render={({ field }) => (
                        <DatePicker
                          date={field.value}
                          onDateChange={field.onChange}
                          placeholder="Select start date"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label htmlFor="prescriberName" className="block text-base text-black font-normal mb-2">
                      Prescriber Name
                    </label>
                    <Input
                      id="prescriptions?.prescriberName"
                      type="text"
                      placeholder="Enter here"
                      key={field.id}
                      className="w-full h-14 p-3 border border-[#737373] rounded"
                      {...register("prescriptions?.prescriberName")}
                      error={errors.prescriptions?.prescriberName?.message}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <label htmlFor="dosage" className="block text-base text-black font-normal mb-2">
                      Dosage
                    </label>
                    <Input
                      id="prescriptions?.dosage"
                      type="text"
                      placeholder="Enter here"
                      key={field.id}
                      className="w-full h-14 p-3 border border-[#737373] rounded"
                      {...register("prescriptions?.dosage")}
                      error={errors.prescriptions?.dosage?.message}
                    />
                  </div>

                  <div>
                    <label htmlFor="directions" className="block text-base text-black font-normal mb-2">
                      Directions
                    </label>
                    <Input
                      id="prescriptions?.directions"
                      type="text"
                      key={field.id}
                      placeholder="Enter here"
                      className="w-full h-14 p-3 border border-[#737373] rounded"
                      {...register("prescriptions?.directions")}
                      error={errors.prescriptions?.directions?.message}
                    />
                  </div>
                </div>

                <div className="mb-8">
                  <label htmlFor="notes" className="block text-base text-black font-normal mb-2">
                    Notes
                  </label>
                  <Textarea
                    id="prescriptions?.notes"
                    key={field.id}
                    placeholder="Enter notes here"
                    className="w-full h-32 p-3 border border-[#737373] rounded"
                    {...register("notes")}
                  />
                  {errors.prescriptions?.notes && (
                    <p className="text-red-500 text-sm mt-1">{errors.prescriptions?.notes.message}</p>
                  )}
                </div>

                <div className="mb-8">
                  <span className="block text-base text-black font-normal mb-2">Add to Medication List</span>
                  <Controller
                    name="prescriptions?.addToMedicationList"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup value={field.value} onValueChange={field.onChange} className="space-x-4 flex">
                        <RadioGroupItem value="yes" id="yes">
                          Yes
                        </RadioGroupItem>
                        <RadioGroupItem value="no" id="no">
                          No
                        </RadioGroupItem>
                      </RadioGroup>
                    )}
                  />
                  {errors.prescriptions?.addToMedicationList && (
                    <p className="text-red-500 text-sm mt-1">{errors.prescriptions?.addToMedicationList.message}</p>
                  )}
                </div>

              </div>
            </div>
          </div>
        ))}
    </div>
  );
}