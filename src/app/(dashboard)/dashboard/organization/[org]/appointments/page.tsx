
import AppointmentList from "@/components/Org/Appointments/AppointmentList";

export default async function AppointmentsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;

  return <AppointmentList slug={org} />;
}

