
import AddAppointment from "@/components/Org/Appointments/AddAppointment";
import { usePathname } from "next/navigation";

export default async function NewAppointmentPage({ params }: { params: Promise<{ org: string }> }) {
    const { org } = await params;



    return (
        <div className="container mx-auto py-6 px-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Create New Appointment</h1>
                <p className="text-gray-600 mt-1">Schedule a new appointment for a patient</p>
            </div>

            <AddAppointment slug={org} />
        </div>
    );
}
