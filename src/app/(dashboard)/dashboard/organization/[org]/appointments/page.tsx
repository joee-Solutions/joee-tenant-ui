import { Suspense } from "react";
import AppointmentList from "@/components/Org/Appointments/AppointmentList";

export default async function AppointmentsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;

  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading appointments…</div>}>
      <AppointmentList slug={org} />
    </Suspense>
  );
}

