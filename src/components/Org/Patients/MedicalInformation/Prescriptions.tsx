import { Controller, useFormContext, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup";
import { DatePicker } from "@/components/ui/date-picker";
import { FormDataStepper } from "../PatientStepper";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { authFectcher } from "@/hooks/swr";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Define the validation schema
export const prescriptionSchema = z.array(z.object({
  checkedDrugFormulary: z.boolean().default(false).optional(),
  controlledSubstance: z.boolean().default(false).optional(),
  startDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  prescriberName: z.string().optional(),
  dosage: z.string().optional(),
  directions: z.string().optional(),
  notes: z.string().optional(),
  addToMedicationList: z.enum(["yes", "no"], {
    required_error: "Please select whether to add to medication list",
  }).optional().default("no"),
}));

export type PrescriptionFormData = z.infer<typeof prescriptionSchema>;

export default function MedicationForm() {
  const pathname = usePathname();
  const orgSlug = pathname?.split('/organization/')[1]?.split('/')[0] || '';
  
  const {
    register,
    control,
    formState: { errors, },
    getValues,
  } = useFormContext<Pick<FormDataStepper, 'prescriptions'>>();

  const { fields, append, remove } = useFieldArray<Pick<FormDataStepper, 'prescriptions'>>({
    control,
    name: "prescriptions",
  });

  // Fetch employees for prescriber dropdown
  const { data: employeesData, isLoading: employeesLoading, error: employeesError } = useSWR(
    orgSlug ? API_ENDPOINTS.GET_TENANTS_EMPLOYEES(parseInt(orgSlug)) : null,
    authFectcher
  );

  const employees = employeesData?.data || [];
  const useEmployeeDropdown = !employeesError && employees.length > 0;


  return (
    <div className="mx-auto p-6 flex flex-col gap-4">
      {
        fields.map((field, index) => (
          <div key={field.id} className="mb-8 border-b pb-6">
            <div className="flex flex-col justify-between mb-4">
              <div className="flex flex-col justify-between mb-4">
                <div className="flex gap-2 mb-3">
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => remove(index)}
                      variant="outline"
                      className="border border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 h-[60px] px-6 font-normal text-base"
                    >
                      Remove
                    </Button>
                  )}
                  {index === fields.length - 1 && (
                    <Button
                      type="button"
                      onClick={() =>
                        append({
                          checkedDrugFormulary: false,
                          controlledSubstance: false,
                          startDate: new Date(),
                          prescriberName: "",
                          dosage: "",
                          directions: "",
                          notes: "",
                          addToMedicationList: "no",
                        })
                      }
                      className="font-normal text-base text-white bg-[#003465] h-[60px] px-6 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Another
                    </Button>
                  )}
                </div>
                <div className="flex gap-12 mb-8">
                  <div className="flex items-center gap-2">
                    <Controller
                      name={`prescriptions.${index}.checkedDrugFormulary`}
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
                       Drug Formulary
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <Controller
                      name={`prescriptions.${index}.controlledSubstance`}
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          id="controlledSubstance"
                          className="accent-green-600 w-6 h-6 rounded"
                          checked={field.value as boolean}
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
                      name={`prescriptions.${index}.startDate`}
                      control={control}
                      key={field.id}
                      render={({ field }) => (
                        <DatePicker
                          date={field.value ? new Date(field.value) : undefined}
                          onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                          placeholder="Select start date"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label htmlFor="prescriberName" className="block text-base text-black font-normal mb-2">
                      Prescriber Name
                    </label>
                    {useEmployeeDropdown ? (
                      <Controller
                        name={`prescriptions.${index}.prescriberName`}
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value || ""} onValueChange={field.onChange}>
                            <SelectTrigger className="w-full h-14 p-3 border border-[#737373] rounded">
                              <SelectValue placeholder={employeesLoading ? "Loading..." : "Select prescriber"} />
                            </SelectTrigger>
                            <SelectContent className="bg-white z-[1000]">
                              {employees.map((employee: any) => (
                                <SelectItem 
                                  key={employee.id} 
                                  value={`${employee.firstname} ${employee.lastname}`}
                                >
                                  {employee.firstname} {employee.lastname}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    ) : (
                      <Input
                        id="prescriptions?.prescriberName"
                        type="text"
                        placeholder="Enter prescriber name"
                        key={field.id}
                        className="w-full h-14 p-3 border border-[#737373] rounded"
                        {...register(`prescriptions.${index}.prescriberName`)}
                        error={errors.prescriptions?.[index]?.prescriberName?.message}
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <label htmlFor="dosage" className="block text-base text-black font-normal mb-2">
                      Dosage
                    </label>
                    <Input
                      id="prescriptions.dosage"
                      type="text"
                      placeholder="Enter here"
                      key={field.id}
                      className="w-full h-14 p-3 border border-[#737373] rounded"
                      {...register(`prescriptions.${index}.dosage`)}
                      error={errors.prescriptions?.[index]?.dosage?.message}
                    />
                  </div>

                  <div>
                    <label htmlFor="directions" className="block text-base text-black font-normal mb-2">
                      Directions
                    </label>
                    <Input
                      id="prescriptions.directions"
                      type="text"
                      key={field.id}
                      placeholder="Enter here"
                      className="w-full h-14 p-3 border border-[#737373] rounded"
                      {...register(`prescriptions.${index}.directions`)}
                      error={errors.prescriptions?.[index]?.directions?.message}
                    />
                  </div>
                </div>

                <div className="mb-8">
                  <label htmlFor="notes" className="block text-base text-black font-normal mb-2">
                    Notes
                  </label>
                  <Textarea
                    id="prescriptions.notes"
                    key={field.id}
                    placeholder="Enter notes here"
                    className="w-full h-32 p-3 border border-[#737373] rounded"
                    {...register(`prescriptions.${index}.notes`)}
                  />
                  {errors.prescriptions?.[index]?.notes && (
                    <p className="text-red-500 text-sm mt-1">{errors.prescriptions?.[index]?.notes.message}</p>
                  )}
                </div>

                <div className="mb-8">
                  <span className="block text-base text-black font-normal mb-2">Add to Medication List</span>
                  <Controller
                    name={`prescriptions.${index}.addToMedicationList`}
                    control={control}
                    render={({ field }) => (
                      <RadioGroup value={field.value || null} onValueChange={field.onChange} className="space-x-4 flex">
                        <RadioGroupItem value="yes" id="yes">
                          Yes
                        </RadioGroupItem>
                        <RadioGroupItem value="no" id="no">
                          No
                        </RadioGroupItem>
                      </RadioGroup>
                    )}
                  />
                  {errors.prescriptions?.[index]?.addToMedicationList && (
                    <p className="text-red-500 text-sm mt-1">{errors.prescriptions?.[index]?.addToMedicationList.message}</p>
                  )}
                </div>

              </div>
            </div>
          </div>
        ))}
    </div>
  );
}