/** Preset values for organization type select (must include "Other" last for custom input). */
export const ORGANIZATION_TYPE_OPTIONS = [
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
  "Other",
] as const;

export function splitOrganizationTypeForForm(stored: string): {
  org_type: string;
  org_type_other: string;
} {
  const v = (stored ?? "").trim();
  if (!v) return { org_type: "", org_type_other: "" };
  if ((ORGANIZATION_TYPE_OPTIONS as readonly string[]).includes(v)) {
    return { org_type: v, org_type_other: "" };
  }
  return { org_type: "Other", org_type_other: v };
}

export function resolveOrganizationTypeForApi(
  org_type: string,
  org_type_other: string | undefined
): string {
  if (org_type === "Other") {
    return (org_type_other ?? "").trim();
  }
  return (org_type ?? "").trim();
}
