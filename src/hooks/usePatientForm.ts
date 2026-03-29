import { useCallback, useEffect, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { toast } from "react-toastify";
import { FormDataStepper } from "@/components/Org/Patients/PatientStepper";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { mapFormDataToPatientDto, normalizePatientData, stripInvalidOptionalContactFields } from "@/utils/patientDataMapper";
import { validateRequiredFields, getFirstStepWithMissingData } from "@/utils/patientValidation";

interface UsePatientFormOptions {
  methods: UseFormReturn<FormDataStepper>;
  slug: string;
  patientId: number | null;
  currentStep: number;
  completedSteps: Set<number>;
  setPatientId: (id: number | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  setIsSavedToAPI: (saved: boolean) => void;
  setCurrentStep?: (step: number) => void;
  onSaveSuccess?: (ctx: { mode: "create" | "update" }) => void;
}

/**
 * Custom hook for patient form management including auto-save and API submission
 */
export function usePatientForm({
  methods,
  slug,
  patientId,
  currentStep,
  completedSteps,
  setPatientId,
  setLoading,
  setError,
  setHasUnsavedChanges,
  setIsSavedToAPI,
  setCurrentStep,
  onSaveSuccess,
}: UsePatientFormOptions) {
  
  // Save function - saves to localStorage and optionally to API
  const saveToLocalStorage = useCallback(async (showNotification = false, saveToAPI = false) => {
    const formData = methods.getValues();
    try {
      localStorage.setItem(`patient-${slug}`, JSON.stringify({
        currentStep,
        completedSteps: Array.from(completedSteps),
        data: formData,
        patientId: patientId // Store patient ID in localStorage
      }));
      
      if (saveToAPI) {
        // Validate required fields before saving to API
        const validation = validateRequiredFields(formData);
        if (!validation.isValid) {
          toast.error(`Please fill in required fields: ${validation.errors.join(', ')}`, { 
            toastId: "validation-error",
            autoClose: 5000,
            position: "top-right"
          });
          setError(validation.errors.join(', '));
          // Navigate to the first step with missing data
          if (setCurrentStep) {
            setCurrentStep(getFirstStepWithMissingData(formData));
          }
          return;
        }
        
        setLoading(true);
        setError(null);
        try {
          const saveMode: "create" | "update" = patientId ? "update" : "create";
          // Map and normalize form data for API
          const mappedData = mapFormDataToPatientDto(formData);
          normalizePatientData(mappedData, formData);
          stripInvalidOptionalContactFields(mappedData);

          // Dev-only debug: show what we are about to POST
          // (helps track email/phone validation mismatches with backend)
          if (process.env.NODE_ENV !== "production") {
            console.log("=== CREATE PATIENT PAYLOAD DEBUG ===", {
              endpoint: API_ENDPOINTS.CREATE_PATIENT(Number(slug)),
              raw_form_demographic: {
                dateOfBirth: formData.demographic?.dateOfBirth,
              },
              payload_date_of_birth:
                Object.prototype.hasOwnProperty.call(mappedData as any, "date_of_birth")
                  ? (mappedData as any).date_of_birth
                  : "<absent>",
              contact_info: {
                payload_has_contact_info:
                  Object.prototype.hasOwnProperty.call(mappedData as any, "contact_info")
                    ? true
                    : false,
                contact_info_keys: mappedData?.contact_info
                  ? Object.keys(mappedData.contact_info)
                  : [],
                has_email:
                  !!mappedData?.contact_info &&
                  Object.prototype.hasOwnProperty.call(mappedData.contact_info, "email"),
                has_phone_number_mobile:
                  !!mappedData?.contact_info &&
                  Object.prototype.hasOwnProperty.call(mappedData.contact_info, "phone_number_mobile"),
                email: mappedData?.contact_info?.email,
                phone_number_mobile: mappedData?.contact_info?.phone_number_mobile,
                phone_number_home: mappedData?.contact_info?.phone_number_home,
              },
              mapped_date_of_birth: mappedData?.date_of_birth,
              raw_form_addDemographic: {
                email: formData.addDemographic?.email,
                mobilePhone: formData.addDemographic?.mobilePhone,
                homePhone: formData.addDemographic?.homePhone,
              },
            });
          }
          
          let response;
          if (patientId) {
            // Update existing patient
            response = await processRequestAuth(
              "patch",
              API_ENDPOINTS.UPDATE_PATIENT(Number(slug), patientId),
              mappedData
            );
          } else {
            // Check if patient with this email already exists before creating
            const patientEmail = formData.addDemographic?.email;
            if (patientEmail) {
              try {
                // Fetch all patients to check for duplicate email
                const allPatientsResponse = await processRequestAuth(
                  "get",
                  API_ENDPOINTS.GET_ALL_PATIENTS(Number(slug))
                );
                
                const allPatients = allPatientsResponse?.data?.data || allPatientsResponse?.data || [];
                const existingPatient = Array.isArray(allPatients) 
                  ? allPatients.find((p: any) => 
                      (p.email?.toLowerCase() === patientEmail.toLowerCase()) ||
                      (p.contact_info?.email?.toLowerCase() === patientEmail.toLowerCase())
                    )
                  : null;
                
                if (existingPatient) {
                  toast.error(`A patient with email ${patientEmail} already exists. Please use a different email or edit the existing patient.`, {
                    toastId: "duplicate-email-error",
                    autoClose: 5000,
                    position: "top-right"
                  });
                  setError(`Patient with email ${patientEmail} already exists`);
                  setLoading(false);
                  return;
                }
              } catch (checkError) {
                // If check fails, log but continue with creation (might be offline)
                console.warn("Could not check for duplicate email:", checkError);
              }
            }
            
            // Create new patient
            response = await processRequestAuth(
              "post",
              API_ENDPOINTS.CREATE_PATIENT(Number(slug)),
              mappedData
            );
            
            // Store the created patient ID
            if (response?.data?.id) {
              setPatientId(response.data.id);
              // Update localStorage with patient ID
              const savedData = localStorage.getItem(`patient-${slug}`);
              if (savedData) {
                const parsed = JSON.parse(savedData);
                parsed.patientId = response.data.id;
                localStorage.setItem(`patient-${slug}`, JSON.stringify(parsed));
              }
            }
          }
          
          setHasUnsavedChanges(false);
          setIsSavedToAPI(true); // Mark as saved to API
          setError(null);
          
          if (onSaveSuccess) {
            setTimeout(() => {
              onSaveSuccess({ mode: saveMode });
            }, 500);
          }
        } catch (error: any) {
          console.error("Failed to save to API:", error);
          const validationErrors = error?.response?.data?.validationErrors;
          const errorMessage =
            (Array.isArray(validationErrors) && validationErrors.length > 0
              ? validationErrors.join(", ")
              : error?.response?.data?.message) || error?.message || "Failed to save to server";

          toast.error(`${errorMessage}. Data saved locally.`, { 
            toastId: "save-api-error",
            autoClose: 4000,
            position: "top-right"
          });
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      }
      
      if (showNotification && !saveToAPI) {
        toast.success("Data auto-saved", { 
          toastId: "auto-save",
          autoClose: 2000,
          position: "bottom-right"
        });
      }
      // Don't reset hasUnsavedChanges on localStorage save - only on API save
      // This ensures navigation warnings work correctly
    } catch (error) {
      console.error("Failed to save patient data:", error);
      toast.error("Failed to save patient data", { 
        toastId: "auto-save-error",
        autoClose: 3000,
        position: "top-right"
      });
    }
  }, [methods, currentStep, completedSteps, slug, patientId, setPatientId, setLoading, setError, setHasUnsavedChanges, setIsSavedToAPI, setCurrentStep, onSaveSuccess]);

  // Track if save is in progress to prevent multiple simultaneous saves
  const isSavingRef = useRef(false);

  // Manual save handler - validates and saves to API
  const handleSave = useCallback(async () => {
    // Prevent multiple simultaneous saves
    if (isSavingRef.current) {
      toast.info("Save already in progress, please wait...", { 
        toastId: "save-in-progress",
        autoClose: 2000,
        position: "bottom-right"
      });
      return;
    }

    const formData = methods.getValues();
    const validation = validateRequiredFields(formData);
    
    if (!validation.isValid) {
      // Show detailed error message
      const errorMessage = `Cannot save: Please fill in all required fields:\n\n${validation.errors.map((err, idx) => `${idx + 1}. ${err}`).join('\n')}\n\nRequired fields: First Name, Last Name, Date of Birth, Email, Mobile Phone.`;
      toast.error(errorMessage, { 
        toastId: "save-validation-error",
        autoClose: 7000,
        position: "top-right"
      });
      setError(validation.errors.join(', '));
      // Navigate to the first step with missing data
      if (setCurrentStep) {
        setCurrentStep(getFirstStepWithMissingData(formData));
      }
      return;
    }
    
    isSavingRef.current = true;
    try {
      await saveToLocalStorage(true, true);
    } finally {
      isSavingRef.current = false;
    }
  }, [methods, saveToLocalStorage, setError, setCurrentStep]);

  // Track unsaved changes only (no auto-save — save happens only when user clicks Save)
  useEffect(() => {
    const subscription = methods.watch(() => {
      setHasUnsavedChanges(true);
    });
    return () => subscription.unsubscribe();
  }, [methods, setHasUnsavedChanges]);

  return {
    saveToLocalStorage,
    handleSave,
  };
}

