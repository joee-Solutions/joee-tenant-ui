import AddSchedule from '@/components/Org/Schedule/AddSchedule';
import React from 'react'

export default async function NewSchedulePage(
    {params}:{params:Promise<{org: string}>}
) {
    const {org} = await params;
  return (
    <div className="container mx-auto py-6 px-4">
      <AddSchedule slug={org} />
    </div>
  )
}