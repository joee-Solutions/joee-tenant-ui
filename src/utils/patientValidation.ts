import { FormDataStepper } from "@/components/Org/Patients/PatientStepper";
import { formatPhoneNumber } from "@/utils/phoneFormatter";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_REGEX = /^\+\d{10,15}$/;

/**
 * Validate required fields before saving to API.
 * Product rule: only first name, last name, and date of birth are required to save.
 * When email or mobile are provided, they must still be well-formed (backend rejects invalid values).
 */
export function validateRequiredFields(formData: FormDataStepper): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Names are required
  const firstName = (formData.demographic?.firstName || "").trim();
  const lastName = (formData.demographic?.lastName || "").trim();
  if (!firstName) errors.push("First name is required");
  if (!lastName) errors.push("Last name is required");

  // DOB is required by backend
  const dobStr = (formData.demographic?.dateOfBirth || "").trim();
  if (!dobStr) {
    errors.push("Date of birth is required");
  } else {
    let date: Date | null = null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dobStr)) {
      const [year, month, day] = dobStr.split("-").map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(dobStr);
    }
    if (!date || isNaN(date.getTime())) {
      errors.push("Date of birth must be a valid ISO 8601 date string");
    }
  }

  const email = (formData.addDemographic?.email || "").trim();
  if (email && !EMAIL_REGEX.test(email)) {
    errors.push("Email must be a valid email address");
  }

  const mobileRaw = formData.addDemographic?.mobilePhone;
  const mobileTrimmed = mobileRaw != null ? String(mobileRaw).trim() : "";
  if (mobileTrimmed) {
    const mobileFormatted = formatPhoneNumber(mobileRaw);
    if (!mobileFormatted || !E164_REGEX.test(mobileFormatted)) {
      errors.push("Mobile phone must be a valid phone number");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get the step index for the first step with missing required data
 */
export function getFirstStepWithMissingData(formData: FormDataStepper): number {
  // Step 0: demographics (first/last + DOB)
  const firstName = (formData.demographic?.firstName || "").trim();
  const lastName = (formData.demographic?.lastName || "").trim();
  const dobStr = (formData.demographic?.dateOfBirth || "").trim();

  if (!firstName || !lastName || !dobStr) return 0;

  // Step 0: DOB format check
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dobStr)) {
    const date = new Date(dobStr);
    if (!date || isNaN(date.getTime())) return 0;
  }

  // Optional contact fields: if present but invalid, send user to additional demographics step
  const email = (formData.addDemographic?.email || "").trim();
  if (email && !EMAIL_REGEX.test(email)) return 1;

  const mobileRaw = formData.addDemographic?.mobilePhone;
  const mobileTrimmed = mobileRaw != null ? String(mobileRaw).trim() : "";
  if (mobileTrimmed) {
    const mobileFormatted = formatPhoneNumber(mobileRaw);
    if (!mobileFormatted || !E164_REGEX.test(mobileFormatted)) return 1;
  }

  return 0;
}

