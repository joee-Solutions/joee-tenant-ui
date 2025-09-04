import PatientStepper from '@/components/Org/Patients/PatientStepper'
import React from 'react'

export default async function AddPatientPage({params}:{params:Promise<{org: string}>}) {
  const {org} = await params;
  return (
    <PatientStepper slug={org} />
  )
}   