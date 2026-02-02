import { FormDataStepper } from "@/components/Org/Patients/PatientStepper";
import { formatPhoneNumber } from "./phoneFormatter";

/**
 * Map form data to API DTO format
 */
export function mapFormDataToPatientDto(formData: FormDataStepper) {
  const { 
    demographic, 
    addDemographic, 
    children, 
    emergency, 
    patientStatus, 
    allergies, 
    medHistory, 
    diagnosisHistory, 
    surgeryHistory, 
    immunizationHistory, 
    famhistory, 
    lifeStyle, 
    visits, 
    prescriptions, 
    vitalSigns,
    reviewOfSystem,
    additionalReview,
  } = formData;

  // Map to match backend CreatePatientDto structure
  return {
    // Primary info fields - ensure all optional strings are empty strings, not undefined
    suffix: demographic?.suffix || '',
    first_name: demographic?.firstName || '',
    middle_name: demographic?.middleName || '',
    last_name: demographic?.lastName || '',
    preferred_name: demographic?.preferredName || '',
    sex: demographic?.sex || '',
    date_of_birth: demographic?.dateOfBirth ? (() => {
      try {
        // Parse the date string (YYYY-MM-DD) to avoid timezone issues
        const dateStr = demographic.dateOfBirth;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const [year, month, day] = dateStr.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          return !isNaN(date.getTime()) ? date.toISOString() : '';
        }
        const date = new Date(demographic.dateOfBirth);
        return !isNaN(date.getTime()) ? date.toISOString() : '';
      } catch {
        return '';
      }
    })() : '',
    marital_status: demographic?.maritalStatus || '',
    race: demographic?.race || '',
    ethnicity: demographic?.ethnicity || '',
    interpreter_required: demographic?.interpreterRequired === "Yes",
    religion: demographic?.religion || '',
    gender_identity: demographic?.genderIdentity || '',
    sexual_orientation: demographic?.sexualOrientation || '',
    image: demographic?.patientImage || '',

    // Contact info - build object without phone numbers first, then conditionally add them
    contact_info: (() => {
      const contactInfo: any = {
        country: addDemographic?.country || "",
        state: addDemographic?.state || "",
        city: addDemographic?.city || "",
        zip_code: addDemographic?.postal || "",
        email: addDemographic?.email || "",
        email_work: addDemographic?.workEmail || "",
        address: addDemographic?.address || "",
        current_address: addDemographic?.currentAddress || "",
        method_of_contact: addDemographic?.contactMethod || "",
        // Convert date strings to Date instances for lived_address_from and lived_address_to
        lived_address_from: addDemographic?.addressFrom ? (() => {
          try {
            const dateStr = addDemographic.addressFrom;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              const [year, month, day] = dateStr.split('-').map(Number);
              return new Date(year, month - 1, day);
            }
            return new Date(addDemographic.addressFrom);
          } catch {
            return null;
          }
        })() : null,
        lived_address_to: addDemographic?.addressTo ? (() => {
          try {
            const dateStr = addDemographic.addressTo;
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              const [year, month, day] = dateStr.split('-').map(Number);
              return new Date(year, month - 1, day);
            }
            return new Date(addDemographic.addressTo);
          } catch {
            return null;
          }
        })() : null,
        current_living_situation: addDemographic?.livingSituation || "",
        referral_source: addDemographic?.referralSource || "",
        occupational_status: addDemographic?.occupationStatus || "",
        industry: addDemographic?.industry || "",
        household_size: addDemographic?.householdSize || 0,
        notes: addDemographic?.notes || "",
      };
      
      // Only add phone numbers if they have valid, non-empty values
      // Format phone numbers before adding - must be valid E.164 format
      const mobilePhone = formatPhoneNumber(addDemographic?.mobilePhone);
      if (mobilePhone && mobilePhone.length > 0 && /^\+\d{10,15}$/.test(mobilePhone)) {
        contactInfo.phone_number_mobile = mobilePhone;
      } else if (addDemographic?.mobilePhone !== undefined && addDemographic?.mobilePhone !== null && addDemographic?.mobilePhone !== '') {
        // If phone number was provided but is invalid, don't include it (let backend handle validation)
        // Or set to null to explicitly remove it on update
        // For PATCH updates, we can omit the field entirely if invalid
      }
      
      const homePhone = formatPhoneNumber(addDemographic?.homePhone);
      if (homePhone && homePhone.length > 0 && /^\+\d{10,15}$/.test(homePhone)) {
        contactInfo.phone_number_home = homePhone;
      } else if (addDemographic?.homePhone !== undefined && addDemographic?.homePhone !== null && addDemographic?.homePhone !== '') {
        // If phone number was provided but is invalid, don't include it
      }
      
      return contactInfo;
    })(),

    // Emergency info - build object without phone number first, then conditionally add it
    emergencyInfo: (() => {
      const emergencyInfo: any = {
        emergency_contact_name: emergency?.name || "",
        emergency_contact_relationship: emergency?.relationship || "",
        // Only include email if it's valid, otherwise omit it (backend validates it must be email if present)
        contact_emergency_contact: emergency?.permission === "Yes",
      };
      
      // Only add email if it's a valid email address
      if (emergency?.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emergency.email)) {
        emergencyInfo.emergency_contact_email = emergency.email;
      }
      
      // Only add phone number if it has a valid, non-empty value
      // Format phone number before adding - must be valid E.164 format
      const phone = formatPhoneNumber(emergency?.phone);
      if (phone && phone.length > 0 && /^\+\d{10,15}$/.test(phone)) {
        emergencyInfo.emergency_contact_phone_number = phone;
      }
      
      return emergencyInfo;
    })(),

    // Guardian info
    guardian_info: {
      Guardian_full_name: children?.fullName,
      Guardian_email: children?.email,
      Guardian_phone_number: children?.phone,
      Guardian_relationship: children?.relationship,
      Guardian_sex: children?.sex,
    },

    // Medical data arrays
    allergies: allergies || [],
    medicalHistories: medHistory || [],
    diagnosisHistory: diagnosisHistory || [],
    surgeries: surgeryHistory || [],
    immunizations: immunizationHistory || [],
    familyHistory: famhistory || [],
    surgeryHistory: surgeryHistory || [],
    status: patientStatus || {},
    socialHistory: lifeStyle || {},
    visits: visits || [],
    prescriptions: prescriptions || [],
    vitalSigns: vitalSigns || [],
    reviewOfSystem: reviewOfSystem || {},
    additionalReview: additionalReview || {},
  };
}

/**
 * Normalize mapped data to ensure all required fields are properly formatted
 */
export function normalizePatientData(mappedData: ReturnType<typeof mapFormDataToPatientDto>, formData: FormDataStepper) {
  // Ensure all optional string fields are empty strings, not undefined
  mappedData.suffix = mappedData.suffix || '';
  mappedData.first_name = mappedData.first_name || '';
  mappedData.last_name = mappedData.last_name || '';
  mappedData.middle_name = mappedData.middle_name || '';
  mappedData.preferred_name = mappedData.preferred_name || '';
  mappedData.marital_status = mappedData.marital_status || '';
  mappedData.race = mappedData.race || '';
  mappedData.ethnicity = mappedData.ethnicity || '';
  mappedData.religion = mappedData.religion || '';
  mappedData.gender_identity = mappedData.gender_identity || '';
  mappedData.sexual_orientation = mappedData.sexual_orientation || '';
  
  // Ensure date is in ISO 8601 format (handle empty/invalid dates)
  if (formData.demographic?.dateOfBirth) {
    try {
      const dateStr = formData.demographic.dateOfBirth;
      // Parse YYYY-MM-DD format directly to avoid timezone issues
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          mappedData.date_of_birth = date.toISOString();
        } else {
          mappedData.date_of_birth = '';
        }
      } else {
        const date = new Date(formData.demographic.dateOfBirth);
        if (!isNaN(date.getTime())) {
          mappedData.date_of_birth = date.toISOString();
        } else {
          mappedData.date_of_birth = '';
        }
      }
    } catch (e) {
      mappedData.date_of_birth = '';
    }
  } else {
    mappedData.date_of_birth = '';
  }
  
  // Ensure contact_info fields are properly formatted
  if (mappedData.contact_info) {
    // Ensure all string fields in contact_info are strings
    mappedData.contact_info.country = mappedData.contact_info.country || '';
    mappedData.contact_info.state = mappedData.contact_info.state || '';
    mappedData.contact_info.city = mappedData.contact_info.city || '';
    mappedData.contact_info.zip_code = mappedData.contact_info.zip_code || '';
    mappedData.contact_info.email = mappedData.contact_info.email || '';
    mappedData.contact_info.email_work = mappedData.contact_info.email_work || '';
    mappedData.contact_info.address = mappedData.contact_info.address || '';
    mappedData.contact_info.current_address = mappedData.contact_info.current_address || '';
    mappedData.contact_info.method_of_contact = mappedData.contact_info.method_of_contact || '';
    mappedData.contact_info.current_living_situation = mappedData.contact_info.current_living_situation || '';
    mappedData.contact_info.referral_source = mappedData.contact_info.referral_source || '';
    mappedData.contact_info.occupational_status = mappedData.contact_info.occupational_status || '';
    mappedData.contact_info.industry = mappedData.contact_info.industry || '';
    mappedData.contact_info.notes = mappedData.contact_info.notes || '';
    
    // Validate and format phone numbers - only include if valid, otherwise remove
    if (mappedData.contact_info.phone_number_mobile !== undefined) {
      const formattedMobile = formatPhoneNumber(mappedData.contact_info.phone_number_mobile);
      if (formattedMobile && /^\+\d{10,15}$/.test(formattedMobile)) {
        mappedData.contact_info.phone_number_mobile = formattedMobile;
      } else {
        // Remove invalid phone number - don't send it to backend
        delete mappedData.contact_info.phone_number_mobile;
      }
    }
    
    if (mappedData.contact_info.phone_number_home !== undefined) {
      const formattedHome = formatPhoneNumber(mappedData.contact_info.phone_number_home);
      if (formattedHome && /^\+\d{10,15}$/.test(formattedHome)) {
        mappedData.contact_info.phone_number_home = formattedHome;
      } else {
        // Remove invalid phone number - don't send it to backend
        delete mappedData.contact_info.phone_number_home;
      }
    }
    
    // Ensure dates are Date instances or null
    if (mappedData.contact_info.lived_address_from && typeof mappedData.contact_info.lived_address_from === 'string') {
      try {
        const dateStr = mappedData.contact_info.lived_address_from;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const [year, month, day] = dateStr.split('-').map(Number);
          mappedData.contact_info.lived_address_from = new Date(year, month - 1, day);
        } else {
          mappedData.contact_info.lived_address_from = new Date(dateStr);
        }
      } catch {
        mappedData.contact_info.lived_address_from = null;
      }
    }
    
    if (mappedData.contact_info.lived_address_to && typeof mappedData.contact_info.lived_address_to === 'string') {
      try {
        const dateStr = mappedData.contact_info.lived_address_to;
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const [year, month, day] = dateStr.split('-').map(Number);
          mappedData.contact_info.lived_address_to = new Date(year, month - 1, day);
        } else {
          mappedData.contact_info.lived_address_to = new Date(dateStr);
        }
      } catch {
        mappedData.contact_info.lived_address_to = null;
      }
    }
  }
  
  // Ensure emergencyInfo fields are properly formatted
  if (mappedData.emergencyInfo) {
    mappedData.emergencyInfo.emergency_contact_name = mappedData.emergencyInfo.emergency_contact_name || '';
    mappedData.emergencyInfo.emergency_contact_relationship = mappedData.emergencyInfo.emergency_contact_relationship || '';
    // Only include email if it's valid, otherwise set to empty string
    if (mappedData.emergencyInfo.emergency_contact_email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mappedData.emergencyInfo.emergency_contact_email)) {
        mappedData.emergencyInfo.emergency_contact_email = '';
      }
    } else {
      mappedData.emergencyInfo.emergency_contact_email = '';
    }
  }
  
  // Ensure arrays are arrays (not undefined or null)
  mappedData.medicalHistories = Array.isArray(mappedData.medicalHistories) ? mappedData.medicalHistories : [];
  mappedData.immunizations = Array.isArray(mappedData.immunizations) ? mappedData.immunizations : [];
  mappedData.familyHistory = Array.isArray(mappedData.familyHistory) ? mappedData.familyHistory : [];
  mappedData.surgeries = Array.isArray(mappedData.surgeries) ? mappedData.surgeries : [];
  mappedData.allergies = Array.isArray(mappedData.allergies) ? mappedData.allergies : [];
  mappedData.diagnosisHistory = Array.isArray(mappedData.diagnosisHistory) ? mappedData.diagnosisHistory : [];
  mappedData.visits = Array.isArray(mappedData.visits) ? mappedData.visits : [];
  mappedData.prescriptions = Array.isArray(mappedData.prescriptions) ? mappedData.prescriptions : [];
  mappedData.vitalSigns = Array.isArray(mappedData.vitalSigns) ? mappedData.vitalSigns : [];
  
  // Ensure interpreter_required is boolean (default to false if not set)
  if (typeof mappedData.interpreter_required !== 'boolean') {
    mappedData.interpreter_required = formData.demographic?.interpreterRequired === 'Yes' || formData.demographic?.interpreterRequired === 'true' || false;
  }
  
  return mappedData;
}

