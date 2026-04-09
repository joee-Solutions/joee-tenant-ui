"use client";

import { Spinner } from "@/components/icons/Spinner";
import FieldBox from "@/components/shared/form/FieldBox";
import FieldSelect from "@/components/shared/form/FieldSelect";
import FormComposer from "@/components/shared/form/FormComposer";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { processRequestAuth } from "@/framework/https";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CircleArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { toast } from "react-toastify";
import { Country, State } from "country-state-city";
import { LocationSearchableSelect } from "@/components/shared/form/LocationSearchableSelect";
import OrganizationSuccessModal from "@/components/shared/modals/OrganizationSuccessModal";
import { useMemo, useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import ProfileImageUploader from "@/components/ui/ImageUploader";
import {
  ORGANIZATION_TYPE_OPTIONS,
  resolveOrganizationTypeForApi,
} from "@/lib/organizationOrgType";

const NewOrganizationSchema = z
  .object({
    name: z.string().min(1, "This field is required"),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    phone_number: z.string().min(1, "This field is required"),
    fax: z.string().optional(),
    email: z
      .string()
      .min(1, "This field is required")
      .email("Invalid email address"),
    website: z.string().optional(),
    org_type: z.string().min(1, "Organization type is required"),
    org_type_other: z.string().optional(),
    logo: z.string().optional(),
    domain: z.string().min(1, "Subdomain is required"),
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

type NewOrganizationSchemaType = z.infer<typeof NewOrganizationSchema>;

const REQUIRED_FIELD_LABELS: Record<string, string> = {
  name: "Organization name",
  address: "Address",
  city: "City",
  state: "State/Province",
  country: "Country",
  phone_number: "Organization Phone number",
  email: "Organization Email",
  domain: "Subdomain",
  org_type: "Organization type",
  org_type_other: "Custom organization type",
};

interface NewOrgProps {
  setIsAddOrg: (val: "add" | "edit" | "none") => void;
}

/** Parse new tenant id from create response (several API shapes). */
function extractCreatedTenantId(res: unknown): number | null {
  if (!res || typeof res !== "object") return null;
  const r = res as Record<string, unknown>;
  const tryId = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && /^\d+$/.test(v.trim())) return parseInt(v.trim(), 10);
    return null;
  };
  const fromObj = (o: unknown): number | null => {
    if (!o || typeof o !== "object") return null;
    const obj = o as Record<string, unknown>;
    return tryId(obj.id);
  };
  let id = fromObj(r);
  if (id != null) return id;
  id = fromObj(r.data);
  if (id != null) return id;
  if (r.data && typeof r.data === "object") {
    const d = r.data as Record<string, unknown>;
    id = fromObj(d.tenant);
    if (id != null) return id;
  }
  return null;
}

// Helper function to handle organization creation errors
// Returns "PARTIAL_SUCCESS" if organization was created but admin email failed (should proceed with success)
const handleOrganizationError = (
  errorMessage: unknown,
  form: UseFormReturn<NewOrganizationSchemaType>
): string | void => {
  const normalizeErrorMessage = (input: unknown): string => {
    if (Array.isArray(input)) return input.map((x) => String(x)).join(", ");
    if (typeof input === "string") return input;
    if (input && typeof input === "object") {
      const obj = input as Record<string, unknown>;
      if (Array.isArray(obj.validationErrors) && obj.validationErrors.length > 0) {
        return obj.validationErrors.map((x) => String(x)).join(", ");
      }
      if (typeof obj.error === "string" && obj.error.trim()) return obj.error;
      if (typeof obj.message === "string" && obj.message.trim()) return obj.message;
    }
    return String(input ?? "");
  };

  const normalizedErrorMessage = normalizeErrorMessage(errorMessage);
  const errorString = normalizedErrorMessage.toLowerCase();
  const hasDuplicateEmailConstraint =
    errorString.includes("uq_5b5d9635409048b7144f5f23198") ||
    errorString.includes('duplicate key value violates unique constraint "uq_5b5d9635409048b7144f5f23198"');
  
  // Check for specific unique constraint violations using constraint IDs
  // Admin email duplicate constraint: UQ_80e5f0171fb2f6ac7196005f30b
  // Note: Admin email duplicates are allowed - organization is created but admin user creation fails
  // We treat this as a warning, not an error, since the organization was successfully created
  if (errorString.includes("uq_80e5f0171fb2f6ac7196005f30b")) {
    // Don't set form error or block - just show a warning
    // The organization was created successfully, admin email just couldn't be linked
    toast.warning("Organization created successfully, but admin email already exists. The organization admin may need to be set manually.", {
      toastId: "org-create-admin-warning",
    });
    // Return a special flag to indicate partial success
    return "PARTIAL_SUCCESS";
  }
  
  // Organization email duplicate constraint: UQ_5b5d9635409048b7144f5f23198
  if (hasDuplicateEmailConstraint) {
    form.setError("email", {
      type: "manual",
      message: "Email already exists. Please use a different email.",
    });
    toast.error("Email already exists. Please use a different email.", {
      toastId: "org-create-email-exists",
    });
    return;
  }
  
  // Domain duplicate constraint: UQ_97b9c4dae58b30f5bd875f241ab
  if (errorString.includes("uq_97b9c4dae58b30f5bd875f241ab")) {
  // Backend can return 500 with "request entity too large" for oversized base64 image payloads.
  if (errorString.includes("request entity too large")) {
    toast.error("Image upload is too large. Please use a smaller image and try again.", {
      toastId: "org-create-image-too-large",
    });
    return;
  }

    form.setError("domain", {
      type: "manual",
      message: "This domain is already taken. Please use a different domain.",
    });
    toast.error("Domain already exists. Please use a different domain.", {
      toastId: "org-create-error",
    });
    return;
  }
  
  // Check for "Tenant already exists" - this is a general tenant duplicate error
  // This should be checked after specific constraint checks
  if (errorString.includes("tenant") && (errorString.includes("already") || errorString.includes("exist"))) {
    // This could be domain, name, or email - check which field might be the issue
    // Since we can't determine which field, show a general message and let user know
    form.setError("domain", {
      type: "manual",
      message: "This organization already exists. Please check domain, name, or email.",
    });
    toast.error("Organization already exists. Please use a different domain, name, or email.", {
      toastId: "org-create-error",
    });
    return;
  }
  
  // Check for duplicate organization email errors - ONLY if error specifically mentions email
  // Don't catch generic "duplicate" errors that might be about tenant/organization
  // Note: Admin email duplicates are allowed, so we skip admin email checks
  if (errorString.includes("email") && (errorString.includes("already") || errorString.includes("exist") || errorString.includes("duplicate")) && !errorString.includes("admin")) {
    // Only set email error if error specifically mentions "email" and not "admin"
    form.setError("email", {
      type: "manual",
      message: "This email is already registered. Please use a different email.",
    });
    toast.error("Organization email already exists. Please use a different email.", {
      toastId: "org-create-error",
    });
    return;
  }
  // Check for duplicate domain errors
  if (errorString.includes("domain") && (errorString.includes("already") || errorString.includes("exist") || errorString.includes("taken"))) {
    form.setError("domain", {
      type: "manual",
      message: "This domain is already taken. Please use a different domain.",
    });
    toast.error("Domain already exists. Please use a different domain.", {
      toastId: "org-create-error",
    });
    return;
  }
  // Check for duplicate organization name
  if (errorString.includes("organization") && (errorString.includes("already") || errorString.includes("exist") || errorString.includes("name"))) {
    form.setError("name", {
      type: "manual",
      message: "Organization name already exists. Please use a different name.",
    });
    toast.error("Organization name already exists. Please use a different name.", {
      toastId: "org-create-error",
    });
    return;
  }
  
  // Generic error fallback
  toast.error(normalizedErrorMessage || "Failed to create organization. Please try again.", {
    toastId: "org-create-error",
  });
};

export default function NewOrg({ setIsAddOrg }: NewOrgProps) {
  const router = useRouter();
  const { mutate: globalMutate } = useSWRConfig();
  const [successOpen, setSuccessOpen] = useState(false);
  const form = useForm<NewOrganizationSchemaType>({
    resolver: zodResolver(NewOrganizationSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      address: "",
      city: "",
      country: "",
      email: "",
      fax: "",
      phone_number: "",
      org_type: "",
      org_type_other: "",
      logo: "",
      state: "",
      website: "",
      zip: "",
      domain: ""
    },
  });

  // Get selected country and state from form (stored as country/state names)
  const selectedCountryName = form.watch("country");
  const selectedStateName = form.watch("state");
  const selectedOrgType = form.watch("org_type");

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

  // Reset state and city when country changes
  useEffect(() => {
    if (selectedCountryName) {
      // If country is selected but state doesn't exist for that country, reset state
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
      // If country is cleared, clear state and city
      if (selectedStateName) form.setValue("state", "");
      const currentCity = form.getValues("city");
      if (currentCity) form.setValue("city", "");
    }
  }, [selectedCountryName, selectedStateName, form]);

  // Reset city when state changes
  useEffect(() => {
    if (!selectedStateName) {
      // If state is cleared, clear city
      const currentCity = form.getValues("city");
      if (currentCity) form.setValue("city", "");
    }
  }, [selectedStateName, form]);

  const onSubmit = async (payload: NewOrganizationSchemaType) => {
    try {
      const {
        address,
        city,
        state,
        zip,
        country,
        org_type,
        org_type_other,
        fax,
        logo,
        ...rest
      } = payload;
      const countryName = country;
      const stateName = state;

      const { website, ...restWithoutWebsite } = rest;
      const formattedPayload: Record<string, unknown> = {
        ...restWithoutWebsite,
        address_metadata: {
          address: address,
          city: city,
          state: stateName,
          zip: zip || "",
          country: countryName,
        },
        // Backend still reads admin_info.firstname/lastname/phone_number on create.
        // Keep this object to avoid server-side undefined property errors.
        admin_info: {
          firstname: "",
          lastname: "",
          phone_number: "",
        },
      };
      const logoStr = typeof logo === "string" ? logo.trim() : "";
      // Create payload + base64 logo often exceeds server body limits. Omit logo on POST; upload via PUT after create.
      const deferLogoUpload = logoStr.length > 0;
      formattedPayload.logo = null;
      formattedPayload.organization_logo = null;
      formattedPayload.organizationLogo = null;
      const orgTypeValue = resolveOrganizationTypeForApi(org_type, org_type_other);
      formattedPayload.organization_type = orgTypeValue;
      formattedPayload.org_type = orgTypeValue;
      const faxVal = String(fax ?? "").trim();
      formattedPayload.fax_number = faxVal || null;
      formattedPayload.fax = faxVal || null;
      formattedPayload.faxNumber = faxVal || null;
      formattedPayload.organization_fax = faxVal || null;

      // Always send website. If protocol is missing, prepend https://.
      const websiteValue = String(website ?? "").trim();
      if (websiteValue) {
        const normalizedWebsite = /^https?:\/\//i.test(websiteValue)
          ? websiteValue
          : `https://${websiteValue}`;
        formattedPayload.website = normalizedWebsite;
      } else {
        formattedPayload.website = "";
      }

      let requestError: any = null;
      const res = await processRequestAuth(
        "post",
        API_ENDPOINTS.CREATE_TENANTs,
        formattedPayload,
        (_path, _data, error) => {
          requestError = error;
        }
      );
      const hiddenErrorData = requestError?.response?.data;
      const hiddenErrorMessage =
        hiddenErrorData?.validationErrors ||
        hiddenErrorData?.error ||
        hiddenErrorData?.message ||
        requestError?.message;
      
      // Check if response contains an error (even if status code suggests success)
      // Check for error field, statusCode >= 400, validationErrors, or constraint violations
      const errorText = typeof res?.error === 'string' ? res.error : '';
      const hasConstraintError = errorText.includes('duplicate key value violates unique constraint');
      const hasError = res?.error || 
                       res?.statusCode === 500 || 
                       (res?.statusCode && res.statusCode >= 400) || 
                       res?.validationErrors ||
                       hasConstraintError ||
                       !res;
      
      if (hasError) {
        const errorMessage =
          res?.validationErrors ||
          res?.error ||
          res?.message ||
          hiddenErrorMessage ||
          "Unable to create organization.";
        const errorResult = handleOrganizationError(errorMessage, form);
        
        // If it's a partial success (org created but admin email failed), proceed with success flow
        if (errorResult === "PARTIAL_SUCCESS") {
          toast.success("Organization created successfully!", {
            toastId: "org-create-success",
          });
          setSuccessOpen(true);
          return;
        }
        
        return; // IMPORTANT: Return early to prevent success flow for real errors
      }
      
      // Only proceed with success if we have explicit success indicators
      if (res?.status || res?.success) {
        if (deferLogoUpload) {
          const newId = extractCreatedTenantId(res);
          if (newId != null) {
            const logoBody = {
              logo: logoStr,
              organization_logo: logoStr,
              organizationLogo: logoStr,
            };
            let logoPutError: unknown = null;
            await processRequestAuth(
              "put",
              API_ENDPOINTS.EDIT_ORGANIZATION(String(newId)),
              logoBody,
              (_p, _d, err) => {
                logoPutError = err;
              }
            );
            const logoErrData = (logoPutError as any)?.response?.data;
            const logoErrMsg = String(
              logoErrData?.error || logoErrData?.message || (logoPutError as any)?.message || ""
            ).toLowerCase();
            if (logoPutError && logoErrMsg.includes("request entity too large")) {
              toast.warning(
                "Organization created, but the logo was not saved (payload too large). Add the logo from Edit organization.",
                { toastId: "org-create-logo-too-large" }
              );
            } else if (logoPutError) {
              toast.warning(
                "Organization created, but the logo could not be saved. You can add it from Edit organization.",
                { toastId: "org-create-logo-failed" }
              );
            }
          } else {
            toast.warning(
              "Organization created, but the logo could not be attached automatically. Add it from Edit organization.",
              { toastId: "org-create-logo-no-id" }
            );
          }
        }

        toast.success("Organization created successfully!", {
          toastId: "org-create-success",
        });

        // Invalidate and revalidate SWR cache to update the table
        globalMutate(
          (key) => typeof key === "string" && key.includes(API_ENDPOINTS.GET_ALL_TENANTS),
          undefined,
          { revalidate: true }
        );

        // Also invalidate dashboard data to update stat cards
        globalMutate(
          (key) => typeof key === "string" && key.includes(API_ENDPOINTS.GET_DASHBOARD_DATA),
          undefined,
          { revalidate: true }
        );

        // Show success modal; navigation handled on Continue
        setSuccessOpen(true);
      }
    } catch (error: any) {
      console.error("Error creating organization:", error);
      console.error("Error response:", error?.response);
      console.error("Error response data:", error?.response?.data);
      console.error("Error response status:", error?.response?.status);
      
      // Extract error message from various possible locations
      // Check validationErrors first, then error, then message
      // Also check if error is directly in response.data (for 500 errors)
      const responseData = error?.response?.data;
      const errorMessage = 
        responseData?.validationErrors ||
        responseData?.error ||
        responseData?.message || 
        error?.message ||
        "An error occurred while creating the organization. Please try again.";
      
      console.log("Extracted error message:", errorMessage);
      
      // Use the helper function to handle the error
      const errorResult = handleOrganizationError(errorMessage, form);
      
      // If it's a partial success (org created but admin email failed), proceed with success flow
      if (errorResult === "PARTIAL_SUCCESS") {
        toast.success("Organization created successfully!", {
          toastId: "org-create-success",
        });
        
        // Invalidate and revalidate SWR cache to update the table
        globalMutate(
          (key) => typeof key === 'string' && key.includes(API_ENDPOINTS.GET_ALL_TENANTS),
          undefined,
          { revalidate: true }
        );
        
        // Also invalidate dashboard data to update stat cards
        globalMutate(
          (key) => typeof key === 'string' && key.includes(API_ENDPOINTS.GET_DASHBOARD_DATA),
          undefined,
          { revalidate: true }
        );
        
        setTimeout(() => {
          setIsAddOrg("none");
          form.reset();
        }, 1000);
        return;
      }
      
      return; // Explicit return to ensure we don't proceed for real errors
    }
  };

  return (
    <div className="flex flex-col gap-[30px]">
      <div>
        <Button
          onClick={() => setIsAddOrg("none")}
          className="font-semibold text-2xl text-black gap-1 p-0"
        >
          <CircleArrowLeft className="fill-[#003465] text-white size-[39px]" />
          Create Organization
        </Button>
      </div>
      <div className="pt-10 pb-[52px] px-[49px] shadow-[0px_0px_4px_1px_#0000004D] rounded-md">
        <FormComposer form={form} onSubmit={onSubmit}>
          <div className="flex flex-col gap-[30px]">
            <ProfileImageUploader title="Organization Logo" name="logo" />
            {form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0 && (
              <div className="flex items-start gap-2 p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Please fill in the required fields:</p>
                  <ul className="list-disc list-inside mt-1 text-sm">
                    {Object.keys(form.formState.errors).map((key) => (
                      <li key={key}>{REQUIRED_FIELD_LABELS[key] ?? key}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <FieldBox
              name="name"
              control={form.control}
              labelText="Organization name"
              type="text"
              placeholder="Enter here"
            />
            <FieldBox
              name="address"
              control={form.control}
              labelText="Address"
              type="text"
              placeholder="Enter here"
            />

            {/* Country, State, City - Country first, then State, then City (all searchable) */}
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
                name="zip"
                type="text"
                control={form.control}
                labelText="Zip/Post code"
                placeholder="Enter here"
              />
            </div>
            <div className="flex items-center gap-[30px]">
              <FieldBox
                type="text"
                name="phone_number"
                control={form.control}
                labelText="Organization Phone number"
                placeholder="Enter here"
              />
              <FieldBox
                type="text"
                name="fax"
                control={form.control}
                labelText="Organization Fax (optional)"
                placeholder="Enter here"
              />
            </div>
            <div className="flex items-center gap-[30px]">
              <FieldBox
                type="text"
                name="email"
                control={form.control}
                labelText="Organization Email"
                placeholder="Enter here"
              />
              <FieldBox
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
                type="text"
                name="domain"
                control={form.control}
                labelText="Sub Domain"
                placeholder="E.g braincare"
              />

            <div className="flex items-center gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOrg("none")}
                className="h-[60px] text-base font-medium rounded flex-1"
              >
                Cancel
              </Button>
              <Button
                className="h-[60px] bg-[#003465] text-base font-medium text-white rounded flex-1"
                type="submit"
              >
                {form.formState.isSubmitting ? (
                  <Spinner />
                ) : (
                  "Create Organization"
                )}
              </Button>
            </div>
          </div>
        </FormComposer>

        <OrganizationSuccessModal
          open={successOpen}
          onOpenChange={setSuccessOpen}
          description="Organization has been created successfully."
          onContinue={() => {
            form.reset();
            setIsAddOrg("none");
            router.push("/dashboard/organization");
          }}
        />
      </div>
    </div>
  );
}
