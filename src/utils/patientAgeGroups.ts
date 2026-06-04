import type { AgeGroup } from "@/lib/types";

/** Order and colors for dashboard patient age groups (API `ageGroups` keys). */
export const PATIENT_AGE_GROUP_ORDER = [
  "Under 1",
  "2-5",
  "6-10",
  "11-17",
  "18-25",
  "26-35",
  "36-45",
  "46-55",
  "56-65",
  "66+",
] as const;

export const PATIENT_AGE_GROUP_COLORS: Record<string, string> = {
  "Under 1": "#003465",
  "2-5": "#1E5A8E",
  "6-10": "#4A9BD9",
  "11-17": "#7AB8E8",
  "18-25": "#3FA907",
  "26-35": "#2D8A06",
  "36-45": "#FAD900",
  "46-55": "#E6A800",
  "56-65": "#EC0909",
  "66+": "#B30606",
};

export function getPatientAgeGroupColor(range: string): string {
  return PATIENT_AGE_GROUP_COLORS[range] ?? "#999999";
}

export function ageGroupsToDistribution(
  ageGroups: Record<string, number>,
  totalPatients: number
): AgeGroup[] {
  const total = totalPatients > 0 ? totalPatients : 0;

  const ordered: { range: string; count: number }[] = PATIENT_AGE_GROUP_ORDER.map(
    (range) => ({
      range,
      count: Number(ageGroups[range] ?? 0),
    })
  );

  const known = new Set<string>(PATIENT_AGE_GROUP_ORDER);
  const extra = Object.keys(ageGroups).filter((k) => !known.has(k));
  for (const range of extra) {
    ordered.push({ range, count: Number(ageGroups[range] ?? 0) });
  }

  return ordered.map(({ range, count }) => ({
    range,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    color: getPatientAgeGroupColor(range),
  }));
}
