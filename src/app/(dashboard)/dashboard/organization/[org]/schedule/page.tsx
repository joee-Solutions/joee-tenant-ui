

import ScheduleList from "@/components/Org/Schedule/ScheduleList";

export default async function SchedulePage(
    {params}:{params:Promise<{org: string}>}
) {
  const {org} = await params;
  return <ScheduleList slug={org} />;
}

