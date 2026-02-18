"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { processRequestAuth } from "@/framework/https";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { getChangedFields } from "@/lib/utils";
import FieldBox from "@/components/shared/form/FieldBox";
import FieldSelect from "@/components/shared/form/FieldSelect";
import FormComposer from "@/components/shared/form/FormComposer";
import Image from "next/image";
import { formatDateFn } from "@/lib/utils";
import orgPlaceholder from "@public/assets/orgPlaceholder.png";
import { Country, State, City } from "country-state-city";

const EditOrganizationSchema = z.object({
  name: z.string().min(1, "This field is required"),
  status: z.string().min(1, "This field is required"),
  address: z.string().min(1, "This field is required"),
  city: z.string().min(1, "This field is required"),
  state: z.string().min(1, "This field is required"),
  zip: z.string().optional(),
  country: z.string().min(1, "This field is required"),
  phone_number: z.string().min(1, "This field is required"),
  fax: z.string().optional(),
  email: z
    .string()
    .email("Invalid email address")
    .min(1, "This field is required"),
  website: z
    .string()
    .url("Invalid URL address")
    .min(1, "This field is required"),
  adminName: z
    .string()
    .min(1, "This field is required")
    .refine((val) => val.trim().split(" ").length >= 2, {
      message: "Please enter a full name (first and last)",
    }),
  adminPhoneNumber: z.string().min(1, "This field is required"),
  org_type: z.string().min(1, "This field is required"),
  domain: z.string().min(1, "This field is required"),
});

type EditOrganizationSchemaType = z.infer<typeof EditOrganizationSchema>;
const orgStatus = ["active", "inactive"];
const orgTypes = [
  "Hospital",
  "Clinic",
  "Medical Center",
  "Pharmacy",
  "Laboratory",
  "Diagnostic Center",
  "Rehabilitation Center",
  "Nursing Home",
  "Urgent Care",
  "Specialty Clinic",
  "Dental Clinic",
  "Eye Clinic",
  "Mental Health Center",
  "Other"
];

interface EditOrganizationModalProps {
  organization: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditOrganizationModal({
  organization,
  onClose,
  onSuccess,
}: EditOrganizationModalProps) {
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [defaults, setDefaults] = useState<any>(null);

  const form = useForm<EditOrganizationSchemaType>({
    resolver: zodResolver(EditOrganizationSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      status: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      phone_number: "",
      fax: "",
      email: "",
      website: "",
      adminName: "",
      adminPhoneNumber: "",
      org_type: "",
      domain: "",
    },
  });

  // Get selected country and state from form (stored as country/state names)
  const selectedCountryName = form.watch("country");
  const selectedStateName = form.watch("state");

  // Get country code from country name
  const selectedCountryCode = useMemo(() => {
    if (!selectedCountryName) return null;
    const country = Country.getAllCountries().find(
      (c) => c.name === selectedCountryName
    );
    return country?.isoCode || null;
  }, [selectedCountryName]);

  // Get state code from state name
  const selectedStateCode = useMemo(() => {
    if (!selectedStateName || !selectedCountryCode) return null;
    const state = State.getStatesOfCountry(selectedCountryCode).find(
      (s) => s.name === selectedStateName
    );
    return state?.isoCode || null;
  }, [selectedStateName, selectedCountryCode]);

  // Get all countries (as names for display) - sorted alphabetically
  const countryOptions = useMemo(() => {
    return Country.getAllCountries()
      .map((country) => country.name)
      .sort((a, b) => a.localeCompare(b));
  }, []);

  // Get states based on selected country (as names for display) - sorted alphabetically
  const stateOptions = useMemo(() => {
    if (!selectedCountryCode) return [];
    return State.getStatesOfCountry(selectedCountryCode)
      .map((state) => state.name)
      .sort((a, b) => a.localeCompare(b));
  }, [selectedCountryCode]);

  // Get cities based on selected country and state (as names for display) - sorted alphabetically
  const cityOptions = useMemo(() => {
    if (!selectedCountryCode || !selectedStateCode) return [];
    return City.getCitiesOfState(selectedCountryCode, selectedStateCode)
      .map((city) => city.name)
      .sort((a, b) => a.localeCompare(b));
  }, [selectedCountryCode, selectedStateCode]);

  // Reset state and city when country changes
  useEffect(() => {
    if (selectedCountryName) {
      const countryCode = Country.getAllCountries().find(
        (c) => c.name === selectedCountryName
      )?.isoCode;
      if (countryCode) {
        const availableStates = State.getStatesOfCountry(countryCode);
        const stateExists = availableStates.some((s) => s.name === selectedStateName);
        if (!stateExists && selectedStateName) {
          form.setValue("state", "");
          form.setValue("city", "");
        }
      }
    } else {
      if (selectedStateName) form.setValue("state", "");
      const currentCity = form.getValues("city");
      if (currentCity) form.setValue("city", "");
    }
  }, [selectedCountryName, selectedStateName, form]);

  // Reset city when state changes
  useEffect(() => {
    if (!selectedStateName) {
      const currentCity = form.getValues("city");
      if (currentCity) form.setValue("city", "");
    }
  }, [selectedStateName, form]);

  useEffect(() => {
    if (organization && organization.id) {
      // Normalize status - handle different status values
      let normalizedStatus = "inactive";
      const orgStatus = String(organization?.status || "").toLowerCase();
      if (orgStatus === "active") {
        normalizedStatus = "active";
      } else if (orgStatus === "inactive" || orgStatus === "deactivated") {
        normalizedStatus = "inactive";
      }

      // Extract address metadata
      const addressMetadata = organization?.address_metadata || {};
      
      // Try multiple paths for admin info
      const adminInfo = organization?.admin_info || 
                       organization?.profile || 
                       organization?.adminInfo ||
                       organization?.admin ||
                       {};

      // Combine firstname and lastname for adminName - try multiple field name variations
      const adminFirstName = adminInfo?.first_name || 
                             adminInfo?.firstname || 
                             adminInfo?.firstName ||
                             "";
      const adminLastName = adminInfo?.last_name || 
                           adminInfo?.lastname || 
                           adminInfo?.lastName ||
                           "";
      const adminName = `${adminFirstName} ${adminLastName}`.trim() || "";

      // Extract admin contact info - try multiple field name variations
      const adminPhone = adminInfo?.phone_number || 
                        adminInfo?.phoneNumber || 
                        adminInfo?.phone ||
                        organization?.admin_phone_number ||
                        "";

      const countryValue = String(addressMetadata?.country || "");
      const stateValue = String(addressMetadata?.state || "");
      const cityValue = String(addressMetadata?.city || "");
      
      // Try multiple paths for org_type
      // Note: Backend returns organization_type in update response but may not include it in list responses
      // Priority: organization_type (from update response) > org_type (legacy) > organizationType (camelCase)
      const orgTypeValue = String(organization?.organization_type || 
                                  organization?.org_type || 
                                  organization?.organizationType ||
                                  "");

      const formData = {
        name: String(organization?.name || ""),
        status: normalizedStatus,
        address: String(addressMetadata?.address || organization?.address || ""),
        city: cityValue,
        state: stateValue,
        zip: String(addressMetadata?.zip || addressMetadata?.zip_code || addressMetadata?.zipCode || ""),
        country: countryValue,
        phone_number: String(organization?.phone_number || ""),
        fax: String(organization?.fax || organization?.fax_number || organization?.organizationFax || ""),
        email: String(organization?.email || ""),
        website: String(organization?.website || ""),
        adminName: adminName || "",
        adminPhoneNumber: String(adminPhone || ""),
        org_type: orgTypeValue,
        domain: String(organization?.domain || ""),
      };
      
      // Debug: Log the extracted data
      console.log("EditOrganizationModal - Organization data:", {
        organization,
        adminInfo,
        adminName,
        adminPhone,
        orgTypeValue,
        formData
      });
      
      // Reset form with the data - this will set all values at once
      // Use shouldValidate: false to prevent validation errors during reset
      form.reset(formData, {
        keepDefaultValues: false,
        keepErrors: false,
      });
      
      // Use requestAnimationFrame to ensure DOM is updated before setting select values
      requestAnimationFrame(() => {
        // Set select fields that need options to be loaded first
        // These need delays because the select options might not be ready yet
        
        // Set status select
        if (normalizedStatus) {
          setTimeout(() => {
            form.setValue("status", normalizedStatus, { shouldValidate: false, shouldDirty: false });
          }, 50);
        }
        
        // Set org_type select - needs delay to ensure options are loaded
        if (orgTypeValue) {
          setTimeout(() => {
            // Check if orgTypeValue exists in the orgTypes array
            const validOrgTypes = [
              "Hospital", "Clinic", "Medical Center", "Pharmacy", "Laboratory",
              "Diagnostic Center", "Rehabilitation Center", "Nursing Home",
              "Urgent Care", "Specialty Clinic", "Dental Clinic", "Eye Clinic",
              "Mental Health Center", "Other"
            ];
            if (validOrgTypes.includes(orgTypeValue)) {
              form.setValue("org_type", orgTypeValue, { shouldValidate: false, shouldDirty: false });
            }
          }, 150);
        }
        
        // Re-set admin fields to ensure they're properly set (form.reset might not work for all field types)
        setTimeout(() => {
          if (adminName) {
            form.setValue("adminName", adminName, { shouldValidate: false, shouldDirty: false });
          }
          if (adminPhone) {
            form.setValue("adminPhoneNumber", String(adminPhone), { shouldValidate: false, shouldDirty: false });
          }
          
          // Trigger validation after all fields are set (with a delay to ensure DOM is updated)
          setTimeout(() => {
            form.trigger(["adminName", "adminPhoneNumber", "org_type", "status"]);
          }, 200);
        }, 100);
        
        // Set country first if value exists in options
        if (countryValue && countryOptions.length > 0) {
          const countryExists = countryOptions.includes(countryValue);
          if (countryExists) {
            form.setValue("country", countryValue, { shouldValidate: true, shouldDirty: false });
            
            // Set state after country is set (wait for state options to be available)
            setTimeout(() => {
              if (stateValue) {
                // Get fresh state options based on selected country
                const countryCode = Country.getAllCountries().find(
                  (c) => c.name === countryValue
                )?.isoCode;
                if (countryCode) {
                  const availableStates = State.getStatesOfCountry(countryCode)
                    .map((s) => s.name)
                    .sort((a, b) => a.localeCompare(b));
                  if (availableStates.includes(stateValue)) {
                    form.setValue("state", stateValue, { shouldValidate: true, shouldDirty: false });
                    
                    // Set city after state is set (wait for city options to be available)
                    setTimeout(() => {
                      if (cityValue) {
                        const stateCode = State.getStatesOfCountry(countryCode).find(
                          (s) => s.name === stateValue
                        )?.isoCode;
                        if (stateCode) {
                          const availableCities = City.getCitiesOfState(countryCode, stateCode)
                            .map((c) => c.name)
                            .sort((a, b) => a.localeCompare(b));
                          if (availableCities.includes(cityValue)) {
                            form.setValue("city", cityValue, { shouldValidate: true, shouldDirty: false });
                          }
                        }
                      }
                      // Trigger validation after all async operations complete
                      form.trigger();
                    }, 100);
                  } else {
                    // If state not found, still trigger validation
                    form.trigger();
                  }
                }
              } else {
                // If no state value, trigger validation
                form.trigger();
              }
            }, 100);
          } else {
            // If country not found, still trigger validation
            form.trigger();
          }
        } else {
          // If no country value, trigger validation
          form.trigger();
        }
      });
      
      setDefaults(formData);
    }
  }, [organization?.id, form, countryOptions]);

  const handleSubmit = async (payload: EditOrganizationSchemaType) => {
    if (!organization) return;

    setUpdatingId(organization.id);
    try {
      const changedFields = getChangedFields(defaults, payload);
      if (Object.keys(changedFields).length === 0) {
        toast.info("No changes detected");
        return;
      }

      const {
        address,
        city,
        state,
        zip,
        country,
        adminName,
        adminPhoneNumber,
        status,
        org_type, // Exclude org_type from update - backend validation expects status values, not org types
        ...rest
      } = changedFields;

      // Build update payload
      const updatePayload: any = { ...rest };
      
      // Note: org_type is excluded from updates because:
      // 1. Backend PUT validation incorrectly expects org_type to be "active" or "deactivated" (status values)
      // 2. We're sending organization types (Hospital, Clinic, etc.) which don't match status validation
      // 3. If organization type needs to be updated, use organization_type field instead
      if (org_type && org_type !== defaults?.org_type) {
        // Use organization_type instead of org_type to avoid backend validation conflict
        updatePayload.organization_type = org_type;
      }

      // Handle status
      if (status) {
        const statusValue = status.toLowerCase();
        if (statusValue === "inactive") {
          updatePayload.status = "deactivated";
        } else {
          updatePayload.status = "active";
        }
        updatePayload.is_active = statusValue === "active";
      }

      // Handle address metadata if any address fields changed
      if (address || city || state || zip || country) {
        updatePayload.address_metadata = {
          address: address || defaults?.address || "",
          city: city || defaults?.city || "",
          state: state || defaults?.state || "",
          zip: zip || defaults?.zip || "",
          country: country || defaults?.country || "",
        };
      }

      // Handle admin info if any admin fields changed
      if (adminName || adminPhoneNumber) {
        const [firstname, ...lastnameParts] = (adminName || defaults?.adminName || "").split(" ");
        const lastname = lastnameParts.join(" ") || firstname;
        
        updatePayload.admin_info = {
          firstname: firstname,
          lastname: lastname,
          phone_number: adminPhoneNumber || defaults?.adminPhoneNumber || "",
        };
      }

      const response = await processRequestAuth(
        "put",
        API_ENDPOINTS.EDIT_ORGANIZATION(String(organization.id)),
        updatePayload
      );
      
      // The backend response may not include all fields we sent (like organization_type and admin_info)
      // So we merge the response with the data we sent to preserve all fields
      const responseData = response?.data || response;
      
      // Merge response with sent data to preserve fields not returned by backend
      const mergedData = {
        ...responseData,
        // Preserve fax field (backend returns fax_number)
        fax: updatePayload.fax || responseData?.fax || responseData?.fax_number || organization?.fax || "",
        // Preserve organization_type if we sent it (backend doesn't return it)
        organization_type: updatePayload.organization_type || organization?.organization_type || organization?.org_type || "",
        // Preserve admin_info if we sent it (backend doesn't return it)
        admin_info: updatePayload.admin_info || organization?.admin_info || {},
        // Ensure address_metadata has all fields
        address_metadata: {
          ...(responseData?.address_metadata || {}),
          ...(updatePayload.address_metadata || {}),
        },
      };
      
      // Update the organization prop with merged data so form can repopulate if needed
      // This is a workaround since the backend doesn't return all fields
      if (organization) {
        Object.assign(organization, mergedData);
      }
      
      toast.success("Organization updated successfully");

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update organization");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ margin: "0 auto" }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-black">Edit Organization</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <FormComposer form={form} onSubmit={handleSubmit}>
          <div className="flex flex-col gap-[30px]">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
              <Image
                src={organization?.logo || orgPlaceholder}
                alt={organization?.name}
                width={60}
                height={60}
                className="rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-lg text-black">{organization?.name}</p>
                <p className="text-sm text-gray-500">
                  {organization?.address || organization?.domain}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Created: {formatDateFn(organization?.created_at || organization?.createdAt)}
                </p>
              </div>
            </div>

            <FieldBox
              bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
              name="name"
              control={form.control}
              labelText="Organization name"
              type="text"
              placeholder="Enter organization name"
            />

            <FieldBox
              bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
              name="address"
              control={form.control}
              labelText="Address"
              type="text"
              placeholder="Enter address"
            />

            {/* Country, State, City */}
            <div className="flex items-center gap-[30px]">
              <div className="w-full">
                <FieldSelect
                  bgSelectClass="bg-[#D9EDFF] border-[#D9EDFF]"
                  name="country"
                  control={form.control}
                  options={countryOptions}
                  labelText="Country"
                  placeholder="Select Country"
                />
                {selectedCountryName && (
                  <button
                    type="button"
                    onClick={() => {
                      form.setValue("country", "");
                      form.setValue("state", "");
                      form.setValue("city", "");
                    }}
                    className="text-xs text-blue-600 hover:underline mt-1"
                  >
                    Clear selection
                  </button>
                )}
              </div>
              <div className="w-full">
                <FieldSelect
                  bgSelectClass="bg-[#D9EDFF] border-[#D9EDFF]"
                  name="state"
                  control={form.control}
                  options={stateOptions}
                  labelText="State"
                  placeholder={selectedCountryName ? "Select State" : "Select Country first"}
                  disabled={!selectedCountryName}
                />
                {!selectedCountryName && (
                  <p className="text-xs text-gray-500 mt-1">Please select a country first</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-[30px]">
              <div className="w-full">
                <FieldSelect
                  bgSelectClass="bg-[#D9EDFF] border-[#D9EDFF]"
                  name="city"
                  control={form.control}
                  options={cityOptions}
                  labelText="City"
                  placeholder={selectedStateName ? "Select City" : "Select State first"}
                  disabled={!selectedStateName}
                />
                {!selectedStateName && selectedCountryName && (
                  <p className="text-xs text-gray-500 mt-1">Please select a state first</p>
                )}
              </div>
              <FieldBox
                bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                name="zip"
                type="text"
                control={form.control}
                labelText="Zip/Post code"
                placeholder="Enter here"
              />
            </div>

            <div className="flex items-center gap-[30px]">
              <FieldBox
                bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                type="text"
                name="phone_number"
                control={form.control}
                labelText="Organization Phone number"
                placeholder="Enter here"
              />
              <FieldBox
                bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                type="text"
                name="fax"
                control={form.control}
                labelText="Organization Fax"
                placeholder="Enter here"
              />
            </div>

            <div className="flex items-center gap-[30px]">
              <FieldBox
                bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                type="email"
                name="email"
                control={form.control}
                labelText="Organization Email"
                placeholder="Enter here"
              />
              <FieldBox
                bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                type="text"
                name="website"
                control={form.control}
                labelText="Website"
                placeholder="Enter here"
              />
            </div>

            <div className="flex items-center gap-[30px]">
              <FieldSelect
                bgSelectClass="bg-[#D9EDFF] border-[#D9EDFF]"
                name="org_type"
                control={form.control}
                options={orgTypes}
                labelText="Organization Type"
                placeholder="Select"
              />
              <FieldBox
                bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                type="text"
                name="adminName"
                control={form.control}
                labelText="Admin/Contact Person name"
                placeholder="e.g John Doe"
              />
            </div>

            <FieldBox
              bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
              type="text"
              name="adminPhoneNumber"
              control={form.control}
              labelText="Admin Phone number"
              placeholder="Enter here"
            />

            <FieldBox
              bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
              type="text"
              name="domain"
              control={form.control}
              labelText="Sub Domain"
              placeholder="E.g braincare"
            />

            <FieldSelect
              bgSelectClass="bg-[#D9EDFF] border-[#D9EDFF]"
              name="status"
              control={form.control}
              options={orgStatus}
              labelText="Status"
              placeholder="Select status"
            />

            <div className="flex items-center gap-4 pt-4">
              <Button
                type="submit"
                disabled={updatingId === organization?.id}
                className="h-[60px] bg-[#003465] text-base font-medium text-white rounded flex-1"
              >
                {updatingId === organization?.id ? "Updating..." : "Update Organization"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-[60px] text-base font-medium rounded flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </FormComposer>
      </div>
    </div>
  );
}

