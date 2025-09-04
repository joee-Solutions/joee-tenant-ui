import AddSchedule from '@/components/Org/Schedule/AddSchedule';
import React from 'react'

export default async function NewSchedulePage(
    {params}:{params:Promise<{org: string}>}
) {
    const {org} = await params;
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Schedule</h1>
        <p className="text-gray-600 mt-1">Schedule a new schedule for a patient</p>
      </div>
      <AddSchedule slug={org} />
    </div>
  )
}