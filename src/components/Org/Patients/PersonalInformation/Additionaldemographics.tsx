import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";
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
import { FormData } from "../AddPatient";

// Validation schema
export const addionalDemoSchema = z.object({
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  postal: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  workEmail: z.string().email("Invalid work email address").optional(),
  homePhone: z.string().optional(),
  mobilePhone: z.string().optional(),
  address: z.string().optional(),
  addressFrom: z.string().optional(),
  addressTo: z.string().optional(),
  currentAddress: z.string().optional(),
  contactMethod: z.string().optional(),
  livingSituation: z.string().optional(),
  referralSource: z.string().optional(),
  occupationStatus: z.string().optional(),
  industry: z.string().optional(),
  householdSize: z.number().optional(),
  notes: z.string().optional(),
});


const countryOptions = [
  "United States",
  "Canada",
  "Mexico",
  "United Kingdom",
  "Australia",
  "Other",
];
const stateOptions = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];
const cityOptions = [
  "New York",
  "Los Angeles",
  "Chicago",
  "Houston",
  "Phoenix",
  "Philadelphia",
  "San Antonio",
  "San Diego",
  "Dallas",
  "San Jose",
  "Austin",
  "Jacksonville",
  "Fort Worth",
  "Columbus",
  "Indianapolis",
  "Charlotte",
  "San Francisco",
  "Seattle",
  "Denver",
  "Washington DC",
];
const postalOptions = [
  "10001",
  "90001",
  "60601",
  "77001",
  "85001",
  "19101",
  "78201",
  "92101",
  "75201",
  "95101",
  "73301",
  "32099",
  "76101",
  "43085",
  "46201",
  "28201",
  "94101",
  "98101",
  "80201",
  "20001",
];
const contactMethodOptions = ["Email", "Phone", "Text Message", "Mail"];
const livingSituationOptions = [
  "Own Home",
  "Rent",
  "Living with Family",
  "Assisted Living",
  "Nursing Home",
  "Homeless",
  "Other",
];
const referralSourceOptions = [
  "Doctor",
  "Friend/Family",
  "Insurance",
  "Internet Search",
  "Social Media",
  "Other",
];
const occupationStatusOptions = [
  "Employed",
  "Self-Employed",
  "Unemployed",
  "Retired",
  "Student",
  "Unable to Work",
  "Other",
];
const industryOptions = [
  "Healthcare",
  "Education",
  "Technology",
  "Finance",
  "Manufacturing",
  "Retail",
  "Government",
  "Construction",
  "Food Service",
  "Transportation",
  "Other",
];
export default function ContactDemographicForm() {

  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<Pick<FormData, 'addDemographic'>>();

  return (
    <div className=" mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Country */}
        <Controller
          name="addDemographic.country"
          render={({ field }) => (
            <div>
              <label
                htmlFor="country"
                className="block text-base text-black font-normal mb-2"
              >
                Country
              </label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full h-14 p-3 border border-[#737373] rounded">
                  <SelectValue placeholder={`Select Country`} />
                </SelectTrigger>
                <SelectContent className="z-10 bg-white">
                  {countryOptions.map((option, index) => (
                    <SelectItem
                      key={index}
                      value={option}
                      className="hover:bg-gray-200"
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.addDemographic?.country && (
                <p className="text-red-500 text-sm">
                  {errors.addDemographic.country.message}
                </p>
              )}
            </div>
          )}
        />

        {/* State */}
        <Controller
          name="addDemographic.state"
          render={({ field }) => (
            <div>
              <label
                htmlFor="state"
                className="block text-base text-black font-normal mb-2"
              >
                State
              </label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full h-14 p-3 border border-[#737373] rounded">
                  <SelectValue placeholder={`Select State`} />
                </SelectTrigger>
                <SelectContent className="z-10 bg-white">
                  {stateOptions.map((option, index) => (
                    <SelectItem
                      key={index}
                      value={option}
                      className="hover:bg-gray-200"
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.addDemographic?.state && (
                <p className="text-red-500 text-sm">
                  {errors.addDemographic.state.message}
                </p>
              )}
            </div>
          )}
        />

        {/* City */}
        <Controller
          name="addDemographic.city"
          render={({ field }) => (
            <div>
              <label
                htmlFor="city"
                className="block text-base text-black font-normal mb-2"
              >
                City
              </label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full h-14 p-3 border border-[#737373] rounded">
                  <SelectValue placeholder={`Select City`} />
                </SelectTrigger>
                <SelectContent className="z-10 bg-white">
                  {cityOptions.map((option, index) => (
                    <SelectItem
                      key={index}
                      value={option}
                      className="hover:bg-gray-200"
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.addDemographic?.city && (
                <p className="text-red-500 text-sm">
                  {errors.addDemographic.city.message}
                </p>
              )}
            </div>
          )}
        />

        {/* Postal/Zip code */}
        <Controller
          name="addDemographic.postal"
          render={({ field }) => (
            <div>
              <label
                htmlFor="postal"
                className="block text-base text-black font-normal mb-2"
              >
                Postal/Zip code
              </label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full h-14 p-3 border border-[#737373] rounded">
                  <SelectValue placeholder={`Select Postal/Zip code`} />
                </SelectTrigger>
                <SelectContent className="z-10 bg-white">
                  {postalOptions.map((option, index) => (
                    <SelectItem
                      key={index}
                      value={option}
                      className="hover:bg-gray-200"
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.addDemographic?.postal && (
                <p className="text-red-500 text-sm">
                  {errors.addDemographic.postal.message}
                </p>
              )}
            </div>
          )}
        />

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-base text-black font-normal mb-2"
          >
            Email
          </label>
          <Input
            type="email"
            id="email"
            placeholder="Enter here"
            className="w-full h-14 p-3 border border-[#737373] rounded"
            {...register('addDemographic.email')}
          />
          {errors.addDemographic?.email && (
            <p className="text-red-500 text-sm">
              {errors.addDemographic.email.message}
            </p>
          )}
        </div>

        {/* Email (work) */}
        <div>
          <label
            htmlFor="workEmail"
            className="block text-base text-black font-normal mb-2"
          >
            Email (work)
          </label>
          <Input
            type="email"
            id="workEmail"
            placeholder="Enter here"
            className="w-full h-14 p-3 border border-[#737373] rounded"
            {...register('addDemographic.workEmail')}
          />
          {
            errors.addDemographic?.workEmail && (
              <p className="text-red-500 text-sm">
                {errors.addDemographic.workEmail.message}
              </p>
            )
          }
        </div>

        {/* Phone (Home) */}
        <div>
          <label
            htmlFor="homePhone"
            className="block text-base text-black font-normal mb-2"
          >
            Phone (Home)
          </label>
          <Input
            type="tel"
            id="homePhone"
            placeholder="Enter here"
            className="w-full h-14 p-3 border border-[#737373] rounded"
            {...register("addDemographic.homePhone")}
          />
          {errors.addDemographic?.homePhone && (
            <p className="text-red-500 text-sm">
              {errors.addDemographic.homePhone.message}
            </p>
          )}
        </div>

        {/* Phone (Mobile) */}
        <div>
          <label
            htmlFor="mobilePhone"
            className="block text-base text-black font-normal mb-2"
          >
            Phone (Mobile)
          </label>
          <Input
            type="tel"
            id="mobilePhone"
            placeholder="Enter here"
            className="w-full h-14 p-3 border border-[#737373] rounded"
            {...register("addDemographic.mobilePhone")}
          />
          {errors.addDemographic?.mobilePhone && (
            <p className="text-red-500 text-sm">
              {errors.addDemographic.mobilePhone.message}
            </p>
          )}
        </div>

        {/* Address - Full width */}
        <div className="md:col-span-2">
          <label
            htmlFor="address"
            className="block text-base text-black font-normal mb-2"
          >
            Address
          </label>
          <Input
            type="text"
            id="address"
            placeholder="Enter here"
            className="w-full h-14 p-3 border border-[#737373] rounded"
            {...register('addDemographic.address')}
          />
          {errors.addDemographic?.address && (
            <p className="text-red-500 text-sm">
              {errors.addDemographic.address.message}
            </p>
          )}
        </div>

        {/* You lived in the above address (From) */}
        <div>
          <label
            htmlFor="addressFrom"
            className="block text-base text-black font-normal mb-2"
          >
            You lived in the above address (From)
          </label>
          <Controller
            name="addDemographic.addressFrom"
            control={control}
            render={({ field }) => (
              <DatePicker
                date={field.value ? new Date(field.value) : undefined}
                onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                placeholder="Select start date"
              />
            )}
          />
          {errors.addDemographic?.addressFrom && (
            <p className="text-red-500 text-sm">
              {errors.addDemographic.addressFrom.message}
            </p>
          )}
        </div>

        {/* To date */}
        <div>
          <label
            htmlFor="addressTo"
            className="block text-base text-black font-normal mb-2"
          >
            To
          </label>
          <Controller
            name="addDemographic.addressTo"
            control={control}
            render={({ field }) => (
              <DatePicker
                date={field.value ? new Date(field.value) : undefined}
                onDateChange={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                placeholder="Select end date"
              />
            )}
          />
          {errors.addDemographic?.addressTo && (
            <p className="text-red-500 text-sm">
              {errors.addDemographic.addressTo.message}
            </p>
          )}
        </div>

        {/* Current Address (if any) - Full width */}
        <div className="md:col-span-2">
          <label
            htmlFor="currentAddress"
            className="block text-base text-black font-normal mb-2"
          >
            Current Address (if any)
          </label>
          <Input
            type="text"
            id="currentAddress"
            placeholder="Enter here"
            className="w-full h-14 p-3 border border-[#737373] rounded"
            {...register("addDemographic.currentAddress")}

          />
          {errors.addDemographic?.currentAddress && (
            <p className="text-red-500 text-sm">
              {errors.addDemographic.currentAddress.message}
            </p>
          )}
        </div>

        {/* Preferred Method of Contact */}
        <Controller
          name="addDemographic.contactMethod"
          render={({ field }) => (
            <div>
              <label
                htmlFor="contactMethod"
                className="block text-base text-black font-normal mb-2"
              >
                Preferred Method of Contact
              </label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full h-14 p-3 border border-[#737373] rounded">
                  <SelectValue placeholder={`Select contact method`} />
                </SelectTrigger>
                <SelectContent className="z-10 bg-white">
                  {contactMethodOptions.map((option, index) => (
                    <SelectItem
                      key={index}
                      value={option}
                      className="hover:bg-gray-200"
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.addDemographic?.contactMethod && (
                <p className="text-red-500 text-sm">
                  {errors.addDemographic.contactMethod.message}
                </p>
              )}
            </div>
          )}
        />
        {/* Current Living Situation */}
        <Controller
          name="addDemographic.livingSituation"
          render={({ field }) => (
            <div>
              <label
                htmlFor="livingSituation"
                className="block text-base text-black font-normal mb-2"
              >
                Current Living Situation
              </label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full h-14 p-3 border border-[#737373] rounded">
                  <SelectValue placeholder={`Select living situation`} />
                </SelectTrigger>
                <SelectContent className="z-10 bg-white">
                  {livingSituationOptions.map((option, index) => (
                    <SelectItem
                      key={index}
                      value={option}
                      className="hover:bg-gray-200"
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.addDemographic?.livingSituation && (
                <p className="text-red-500 text-sm">
                  {errors.addDemographic.livingSituation.message}
                </p>
              )}
            </div>
          )}
        />

        {/* Referral Source */}

        <Controller
          name="addDemographic.referralSource"
          render={({ field }) => (
            <div>
              <label
                htmlFor="referralSource"
                className="block text-base text-black font-normal mb-2"
              >
                Referral Source
              </label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full h-14 p-3 border border-[#737373] rounded">
                  <SelectValue placeholder={`Select referral source`} />
                </SelectTrigger>
                <SelectContent className="z-10 bg-white">
                  {referralSourceOptions.map((option, index) => (
                    <SelectItem
                      key={index}
                      value={option}
                      className="hover:bg-gray-200"
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.addDemographic?.referralSource && (
                <p className="text-red-500 text-sm">
                  {errors.addDemographic.referralSource.message}
                </p>
              )}
            </div>
          )}
        />

        {/* Occupation Status */}

        <Controller
          name="addDemographic.occupationStatus"
          render={({ field }) => (
            <div>
              <label
                htmlFor="occupationStatus"
                className="block text-base text-black font-normal mb-2"
              >
                Occupation Status
              </label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full h-14 p-3 border border-[#737373] rounded">
                  <SelectValue placeholder={`Select occupation status`} />
                </SelectTrigger>
                <SelectContent className="z-10 bg-white">
                  {occupationStatusOptions.map((option, index) => (
                    <SelectItem
                      key={index}
                      value={option}
                      className="hover:bg-gray-200"
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.addDemographic?.occupationStatus && (
                <p className="text-red-500 text-sm">
                  {errors.addDemographic.occupationStatus.message}
                </p>
              )}
            </div>
          )}
        />

        {/* Industry */}
        <Controller
          name="addDemographic.industry"
          render={({ field }) => (
            <div>
              <label
                htmlFor="industry"
                className="block text-base text-black font-normal mb-2"
              >
                Industry
              </label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full h-14 p-3 border border-[#737373] rounded">
                  <SelectValue placeholder={`Select industry`} />
                </SelectTrigger>
                <SelectContent className="z-10 bg-white">
                  {industryOptions.map((option, index) => (
                    <SelectItem
                      key={index}
                      value={option}
                      className="hover:bg-gray-200"
                    >
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.addDemographic?.industry && (
                <p className="text-red-500 text-sm">
                  {errors.addDemographic.industry.message}
                </p>
              )}
            </div>
          )}
        />

        {/* Household size */}
        <div>
          <label
            htmlFor="householdSize"
            className="block text-base text-black font-normal mb-2"
          >
            Household size
          </label>
          <Input
            type="number"
            id="householdSize"
            placeholder="Enter here"
            className="w-full h-14 p-3 border border-[#737373] rounded"
            {...register('addDemographic.householdSize', {
              valueAsNumber: true,
              min: {
                value: 1,
                message: "Household size must be at least 1",
              },
            })}
          />
          {errors.addDemographic?.householdSize && (
            <p className="text-red-500 text-sm">
              {errors.addDemographic.householdSize.message}
            </p>
          )}
        </div>

        {/* Notes - Full width */}
        <div className="md:col-span-2">
          <label
            htmlFor="notes"
            className="block text-base text-black font-normal mb-2"
          >
            Notes
          </label>
          <Textarea
            id="notes"
            className="w-full h-32 p-3 border border-[#737373] rounded"
            rows={4}
            placeholder="Enter any additional notes here"
            {...register('addDemographic.notes')}
          />
          {errors.addDemographic?.notes && (
            <p className="text-red-500 text-sm">
              {errors.addDemographic.notes.message}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        {/* <div className="flex space-x-4 pt-4">
        <Button
            type="button"
            className=" border border-[#EC0909] text-[#EC0909] hover:bg-[#ec090922] py-8 px-16 text-md rounded"
          
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className=" bg-[#003465] hover:bg-[#0d2337] text-white py-8 px-16 text-md rounded"
          >
            Submit
          </Button>
        </div> */}
      </div>
    </div>
  );
}
