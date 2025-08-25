"use client";

import AppointmentList from "@/components/Org/Appointments/AppointmentList";
import { usePathname } from "next/navigation";

export default function AppointmentsPage() {
  const pathname = usePathname();
  const slug = pathname.split("/")[4];
  return <AppointmentList slug={slug} />;
}

