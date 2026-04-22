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
import { cityOverrides } from "@/lib/geo/cityOverrides";
import { LocationSearchableSelect } from "@/components/shared/form/LocationSearchableSelect";
import OrganizationSuccessModal from "@/components/shared/modals/OrganizationSuccessModal";
import ProfileImageUploader from "@/components/ui/ImageUploader";
import {
  ORGANIZATION_TYPE_OPTIONS,
  resolveOrganizationTypeForApi,
  splitOrganizationTypeForForm,
} from "@/lib/organizationOrgType";

function resolveOrgLogoSrc(logo: unknown): string | typeof orgPlaceholder {
  if (typeof logo !== "string") return orgPlaceholder;
  const value = logo.trim();
  if (!value) return orgPlaceholder;
  if (value.startsWith("data:image/") || value.startsWith("/")) return value;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return value;
  } catch {
    // fallback to placeholder for malformed URLs
  }
  return orgPlaceholder;
}

const EditOrganizationSchema = z
  .object({
    name: z.string().min(1, "This field is required"),
    status: z.string().min(1, "This field is required"),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    phone_number: z.string().min(1, "This field is required"),
    fax: z.string().optional(),
    email: z
      .string()
      .email("Invalid email address")
      .min(1, "This field is required"),
    website: z.string().optional(),
    org_type: z.string().min(1, "Organization type is required"),
    org_type_other: z.string().optional(),
    logo: z.string().optional(),
    domain: z.string().min(1, "This field is required"),
  })
  .superRefine((data, ctx) => {
    if (data.org_type === "Other") {
      const v = (data.org_type_other ?? "").trim();
      if (!v) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please specify your organization type",
          path: ["org_type_other"],
        });
      }
    }
  });

type EditOrganizationSchemaType = z.infer<typeof EditOrganizationSchema>;

const orgStatus = ["active", "inactive"];

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
  const [editSuccessOpen, setEditSuccessOpen] = useState(false);

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
      org_type: "",
      org_type_other: "",
      logo: "",
      domain: "",
    },
  });

  // Get selected country and state from form (stored as country/state names)
  const selectedCountryName = form.watch("country");
  const selectedStateName = form.watch("state");
  const selectedOrgType = form.watch("org_type");
  const selectedLogo = form.watch("logo");

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
    const baseCities = City.getCitiesOfState(selectedCountryCode, selectedStateCode)
      .map((city) => city.name);

    const overrideKey = `${selectedCountryCode}-${selectedStateCode}`;
    const extraCities = cityOverrides[overrideKey] || [];

    // International fallback:
    // If state/province based lookup returns 0 cities (common for UK-style subdivisions),
    // fall back to all cities in the selected country so the dropdown isn't empty.
    const fallbackCities =
      baseCities.length === 0
        ? (City.getCitiesOfCountry(selectedCountryCode) || []).map((c) => c.name)
        : [];

    // Ensure the organization's existing city is always present so it can be displayed
    const existingCity =
      (organization?.address_metadata?.city as string | undefined) ||
      (organization?.city as string | undefined) ||
      undefined;

    const merged = [...baseCities, ...extraCities, ...fallbackCities];
    if (existingCity && !merged.includes(existingCity)) {
      merged.push(existingCity);
    }

    return Array.from(new Set(merged)).sort((a, b) => a.localeCompare(b));
  }, [selectedCountryCode, selectedStateCode, organization]);

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
      
      const countryValue = String(addressMetadata?.country || "");
      const stateValue = String(addressMetadata?.state || "");
      const cityValue = String(addressMetadata?.city || "");
      
      const orgTypeStored = String(
        organization?.organization_type ||
          organization?.org_type ||
          organization?.organizationType ||
          ""
      );
      const { org_type: orgTypeSelect, org_type_other: orgTypeOtherField } =
        splitOrganizationTypeForForm(orgTypeStored);

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
        org_type: orgTypeSelect,
        org_type_other: orgTypeOtherField,
        logo: String(organization?.logo || ""),
        domain: String(organization?.domain || ""),
      };
      
      console.log("EditOrganizationModal - Organization data:", {
        organization,
        orgTypeStored,
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
        
        setTimeout(() => {
          form.setValue("org_type", orgTypeSelect, { shouldValidate: false, shouldDirty: false });
          form.setValue("org_type_other", orgTypeOtherField, {
            shouldValidate: false,
            shouldDirty: false,
          });
        }, 150);
        
        setTimeout(() => {
          form.trigger(["org_type", "status"]);
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
        status,
        org_type,
        org_type_other,
        fax,
        ...rest
      } = changedFields;

      // Build update payload (omit form-only org type fields; send resolved API string)
      const updatePayload: any = { ...rest };

      const defaultResolved = resolveOrganizationTypeForApi(
        defaults?.org_type ?? "",
        defaults?.org_type_other
      );
      const payloadResolved = resolveOrganizationTypeForApi(
        payload.org_type,
        payload.org_type_other
      );
      if (payloadResolved !== defaultResolved) {
        // Business category (Hospital, Clinic, …) — backend expects organization_type, not org_type
        updatePayload.organization_type = payloadResolved;
      }

      // Handle status — backend validates org_type as active | deactivated (tenant lifecycle)
      if (status) {
        const statusValue = status.toLowerCase();
        if (statusValue === "inactive") {
          updatePayload.status = "deactivated";
        } else {
          updatePayload.status = "active";
        }
        updatePayload.is_active = statusValue === "active";
        updatePayload.org_type = statusValue === "active" ? "active" : "deactivated";
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

      // Fax / logo / website: merge from full payload vs defaults so we always hit backend keys
      // even if change detection on nested/spread fields misses an edge case.
      const faxPayload = String(payload.fax ?? "").trim();
      const faxDefault = String(defaults?.fax ?? "").trim();
      if (faxPayload !== faxDefault || fax !== undefined) {
        updatePayload.fax_number = faxPayload || null;
        updatePayload.fax = faxPayload || null;
        updatePayload.faxNumber = faxPayload || null;
        updatePayload.organization_fax = faxPayload || null;
      }

      const logoPayload = typeof payload.logo === "string" ? payload.logo.trim() : "";
      const logoDefault = typeof defaults?.logo === "string" ? defaults.logo.trim() : "";
      if (logoPayload !== logoDefault) {
        // Send logo once — duplicate keys triple base64 size and trigger 413 on small files.
        if (logoPayload) {
          updatePayload.logo = logoPayload;
        } else {
          updatePayload.logo = null;
        }
      }

      const webPayload = String(payload.website ?? "").trim();
      const webDefault = String(defaults?.website ?? "").trim();
      if (webPayload !== webDefault) {
        if (webPayload) {
          updatePayload.website = /^https?:\/\//i.test(webPayload)
            ? webPayload
            : `https://${webPayload}`;
        } else {
          updatePayload.website = "";
        }
      }

      let putError: any = null;
      const response = await processRequestAuth(
        "put",
        API_ENDPOINTS.EDIT_ORGANIZATION(String(organization.id)),
        updatePayload,
        (_path, _data, error) => {
          putError = error;
        }
      );

      if (putError) {
        const errData = putError?.response?.data;
        const errLower = String(
          errData?.error ?? errData?.message ?? putError?.message ?? ""
        ).toLowerCase();
        const status = putError?.response?.status;
        const isPayloadTooLarge =
          status === 413 ||
          errLower.includes("request entity too large") ||
          errLower.includes("payload too large");
        if (isPayloadTooLarge) {
          form.setError("logo", {
            type: "manual",
            message: "Image is too large. Please use a smaller file.",
          });
          toast.error("Image upload is too large. Please use a smaller image and try again.", {
            toastId: "org-edit-image-too-large",
          });
          return;
        }
        toast.error("Failed to update organization", {
          toastId: "org-edit-failed",
        });
        return;
      }

      if (response == null) {
        toast.error("Failed to update organization", {
          toastId: "org-edit-failed",
        });
        return;
      }
      
      // The backend response may not include all fields we sent (like organization_type and admin_info)
      // So we merge the response with the data we sent to preserve all fields
      const responseData = response?.data || response;
      
      // Merge response with sent data to preserve fields not returned by backend
      const mergedData = {
        ...responseData,
        // Preserve fax field (backend returns fax_number)
        fax:
          updatePayload.fax_number ??
          updatePayload.fax ??
          responseData?.fax ??
          responseData?.fax_number ??
          organization?.fax ??
          "",
        // Preserve logo
        logo:
          updatePayload.logo ??
          responseData?.logo ??
          organization?.logo ??
          "",
        website: updatePayload.website ?? responseData?.website ?? organization?.website ?? "",
        // Preserve organization_type if we sent it (backend doesn't return it)
        organization_type: updatePayload.organization_type || organization?.organization_type || organization?.org_type || "",
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
      setEditSuccessOpen(true);
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
            <ProfileImageUploader title="Organization Logo" name="logo" />
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
              <Image
                src={resolveOrgLogoSrc(selectedLogo || organization?.logo)}
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
                <LocationSearchableSelect
                  control={form.control}
                  name="country"
                  label="Country"
                  options={countryOptions}
                  placeholder="Select Country"
                  searchPlaceholder="Search country..."
                />
              </div>
              <div className="w-full">
                <LocationSearchableSelect
                  control={form.control}
                  name="state"
                  label="State/Province"
                  options={stateOptions}
                  placeholder={
                    selectedCountryName
                      ? "Select State/Province"
                      : "Select Country first"
                  }
                  searchPlaceholder="Search state/province..."
                  disabled={!selectedCountryName}
                />
              </div>
            </div>

            <div className="flex items-center gap-[30px]">
              <div className="w-full">
                <FieldBox
                  bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                  name="city"
                  control={form.control}
                  labelText="City"
                  type="text"
                  placeholder="Enter city"
                />
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
                labelText="Organization Fax (optional)"
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

            <div className="flex flex-col gap-[30px]">
              <div className="flex items-center gap-[30px] flex-wrap">
                <div className="w-full min-w-[200px] max-w-md">
                  <FieldSelect
                    bgSelectClass="bg-[#D9EDFF] border-[#D9EDFF]"
                    name="org_type"
                    control={form.control}
                    options={[...ORGANIZATION_TYPE_OPTIONS]}
                    labelText="Organization Type"
                    placeholder="Select"
                  />
                </div>
                {selectedOrgType === "Other" && (
                  <div className="w-full min-w-[200px] max-w-md">
                    <FieldBox
                      bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                      type="text"
                      name="org_type_other"
                      control={form.control}
                      labelText="Specify organization type"
                      placeholder="Enter your organization type"
                    />
                  </div>
                )}
              </div>
            </div>

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
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-[60px] text-base font-medium rounded flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updatingId === organization?.id}
                className="h-[60px] bg-[#003465] text-base font-medium text-white rounded flex-1"
              >
                {updatingId === organization?.id ? "Updating..." : "Update Organization"}
              </Button>
            </div>
          </div>
        </FormComposer>
      </div>

      <OrganizationSuccessModal
        open={editSuccessOpen}
        onOpenChange={setEditSuccessOpen}
        description="Organization has been updated successfully."
        onContinue={() => {
          onSuccess();
          onClose();
        }}
      />
    </div>
  );
}

