"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { z } from "zod";
import { Controller, useFormContext } from "react-hook-form";
import { FormData } from "../AddPatient";

export const PatientDemoSchema = z.object({
  suffix: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  preferedNmae: z.string().optional(),
  medicalRecord: z.string().optional(),
  sex: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  maritalStatus: z.string().optional(),
  race: z.string().optional(),
  ethnicity: z.string().optional(),
  preferredLanguage: z.string().optional(),
  interpreterRequired: z.string().optional(),
  religion: z.string().optional(),
  genderIdentity: z.string().optional(),
  sexualOrientation: z.string().optional(),
  patientImage: z.string().optional(),
});

type PatientSchemaType = z.infer<typeof PatientDemoSchema>;
const dropdownOptions = {
  suffix: ["Mr.", "Mrs.", "Ms.", "Dr.", "Jr.", "Sr.", "II", "III", "IV"],
  sex: ["Male", "Female", "Other", "Prefer not to say"],
  maritalStatus: [
    "Single",
    "Married",
    "Divorced",
    "Widowed",
    "Separated",
    "Other",
  ],
  race: [
    "White",
    "Black or African American",
    "Asian",
    "Native Hawaiian or Pacific Islander",
    "American Indian or Alaska Native",
    "Other",
    "Prefer not to say",
  ],
  ethnicity: [
    "Hispanic or Latino",
    "Not Hispanic or Latino",
    "Prefer not to say",
  ],
  preferredLanguage: [
    "English",
    "Spanish",
    "French",
    "Mandarin",
    "Arabic",
    "Other",
  ],
  interpreterRequired: ["Yes", "No"],
  religion: [
    "Christianity",
    "Islam",
    "Judaism",
    "Hinduism",
    "Buddhism",
    "None",
    "Other",
    "Prefer not to say",
  ],
  genderIdentity: [
    "Man",
    "Woman",
    "Non-binary",
    "Transgender",
    "Other",
    "Prefer not to say",
  ],
  sexualOrientation: [
    "Heterosexual",
    "Homosexual",
    "Bisexual",
    "Asexual",
    "Other",
    "Prefer not to say",
  ],
};
type DropdownKeys = keyof typeof dropdownOptions;

export default function PatientInfoForm() {
  // const {
  //   register,
  //   handleSubmit,
  //   formState: { errors },
  // } = useForm<PatientSchemaType>({
  //   resolver: zodResolver(PatientDemoSchema),
  //   mode: "onChange",
  // });

  const {
    register,
    formState: { errors },
    control
  } = useFormContext<Pick<FormData, 'demographic'>>(); // retrieve all hook methods

  const [fileName, setFileName] = useState("");


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  console.log("Form errors:", errors);

  // Dropdown options as arrays


  return (
    <div className="mx-auto p-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label
              htmlFor="firstName"
              className="block text-base text-black font-normal mb-2"
            >
              First Name
            </label>
            <Input
              id="firstName"
              type="text"
              placeholder="Enter here"
              className="w-full h-14 p-3 border border-[#737373] rounded"
              {...register("demographic.firstName")}
            />
            {errors?.demographic?.firstName && (
              <p className="text-red-500 text-sm">{errors?.demographic?.firstName.message}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="middleName"
              className="block text-base text-black font-normal mb-2"
            >
              Middle Name
            </label>
            <Input
              id="firstName"
              type="text"
              placeholder="Enter here"
              className="w-full h-14 p-3 border border-[#737373] rounded"
              {...register("demographic.middleName")}
            />
            {errors?.demographic?.middleName && (
              <p className="text-red-500 text-sm">{errors?.demographic?.middleName.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="lastName"
              className="block text-base text-black font-normal mb-2"
            >
              Last Name
            </label>
            <Input
              id="lastName"
              type="text"
              placeholder="Enter here"
              className="w-full h-14 p-3 border border-[#737373] rounded"
              {...register("demographic.lastName")}
            />
            {errors?.demographic?.lastName && (
              <p className="text-red-500 text-sm">{errors?.demographic?.lastName?.message}</p>
            )}
          </div>
          {/* Preferred Name */}
          <div>
            <label
              htmlFor="preferedNmae"
              className="block text-base text-black font-normal mb-2"
            >
              Preferred Name
            </label>
            <Input
              id="preferedNmae"
              type="text"
              placeholder="Enter here"
              className="w-full h-14 p-3 border border-[#737373] rounded"
              {...register("demographic.preferedNmae")}
            />
            {errors?.demographic?.preferedNmae && (
              <p className="text-red-500 text-sm">{errors?.demographic?.preferedNmae.message}</p>
            )}
          </div>
          {/* medical record number */}
          <div>
            <label
              htmlFor="medicalRecord"
              className="block text-base text-black font-normal mb-2"
            >
              Medical Record Number
            </label>
            <Input
              id="medicalRecord"
              type="text"
              placeholder="Enter here"
              className="w-full h-14 p-3 border border-[#737373] rounded"
              {...register("demographic.medicalRecord")}
            />
            {errors?.demographic?.medicalRecord && (
              <p className="text-red-500 text-sm">{errors?.demographic?.medicalRecord.message}</p>
            )}
          </div>
          {/* date of birth */}
          <div>
            <label
              htmlFor="dateOfBirth"
              className="block text-base text-black font-normal mb-2"
            >
              Date of Birth
            </label>
            <Controller
              name="demographic.dateOfBirth"
              control={control}
              render={({ field }) => (
                <DatePicker
                  date={field.value ? new Date(field.value) : undefined}
                  onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                  placeholder="Select date of birth"
                />
              )}
            />
            {errors?.demographic?.dateOfBirth && (
              <p className="text-red-500 text-sm">{errors?.demographic?.dateOfBirth.message}</p>
            )}
          </div>

          {/* Dynamic Dropdowns */}

          {(Object.keys(dropdownOptions) as DropdownKeys[]).map((key) => (
            <Controller
              key={key}
              name={`demographic.${key}` as const}
              control={control}
              render={({ field }) => (
                <div>
                  <label
                    htmlFor={key}
                    className="block text-base text-black font-normal mb-2"
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  </label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full h-14 p-3 border border-[#737373] rounded">
                      <SelectValue placeholder={`Select ${key}`} />
                    </SelectTrigger>
                    <SelectContent className="z-10 bg-white">
                      {dropdownOptions[key].map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors?.demographic?.[key] && (
                    <p className="text-red-500 text-sm">
                      {errors?.demographic?.[key]?.message}
                    </p>
                  )}
                </div>
              )}
            />
          ))
          }



          {/* Upload Patient Image */}
          <div className="md:col-span-2">
            <label
              htmlFor="patientImage"
              className="block text-base text-black font-normal mb-2"
            >
              Upload Patient Image
            </label>
            <div className="flex">
              <label
                htmlFor="file-upload"
                className="flex-grow flex items-center px-4 py-3 border border-gray-300 rounded-l-md bg-white text-gray-400 cursor-pointer"
              >
                <span className="mr-2">
                  <Paperclip className="h-5 w-5" />
                </span>
                <span className="truncate">{fileName || "Choose File"}</span>
                <input
                  id="file-upload"
                  type="file"
                  className="sr-only w-full h-14 p-3 border border-[#737373] rounded"
                  onChange={handleFileChange}
                />
              </label>
              <Button
                type="button"
                className="w-24 bg-[#003465] hover:bg-[#0d2337] h-14 text-white py-3 px-4 rounded-r-md"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                Browse
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
