
import AddAppointment from "@/components/Org/Appointments/AddAppointment";
import { usePathname } from "next/navigation";

export default async function NewAppointmentPage({ params }: { params: Promise<{ org: string }> }) {
    const { org } = await params;



    return (
        <div className="container mx-auto py-6 px-4">
            <AddAppointment slug={org} />
        </div>
    );
}
