"use client";

import AddAppointment from "@/components/Org/Appointments/AddAppointment";
import { useParams } from "next/navigation";

export default function NewAppointmentPage() {
  const params = useParams();
  const org = params?.org as string;

  return (
    <div className="container mx-auto py-6 px-4">
      <AddAppointment slug={org} />
    </div>
  );
}


