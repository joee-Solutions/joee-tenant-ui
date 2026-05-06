"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Printer,
  Calendar,
  Clock,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useVisitReport } from "@/hooks/swr";
import { toast } from "react-toastify";
import ActivityLogDisplay from "@/components/shared/ActivityLogDisplay";
import { useRecentActivity } from "@/hooks/useActivityLogs";

interface AppointmentStats {
  totalAppointments: number;
}

export default function EnhancedAppointmentsList() {
  const [appointmentsData] = useState<any[]>([]);
  const { data: visitReportData, isLoading } = useVisitReport();

  // Fetch appointment-related activity logs
  const { activityLogs: appointmentActivities, isLoading: activityLoading } = useRecentActivity({
    resource: 'appointment',
    limit: 5
  });

  const stats: AppointmentStats = useMemo(
    () => ({
      totalAppointments: Number(visitReportData?.totalVisits ?? 0),
    }),
    [visitReportData?.totalVisits]
  );

  const handleExportCSV = () => {
    if (!appointmentsData) return;

    const csvContent = [
      ['Appointment ID', 'Patient Name', 'Doctor Name', 'Department', 'Date', 'Time', 'Duration', 'Status', 'Type', 'Organization', 'Created Date'],
      ...appointmentsData.map(appointment => [
        appointment.id,
        appointment.patientName,
        appointment.doctorName,
        appointment.department,
        format(new Date(appointment.appointmentDate), 'MMM dd, yyyy'),
        appointment.appointmentTime,
        `${appointment.duration} minutes`,
        appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1),
        appointment.type,
        appointment.tenant.name,
        format(new Date(appointment.created_at), 'MMM dd, yyyy')
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointments-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Appointments exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="px-10 pt-[32px] pb-[56px] space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments Management</h1>
          <p className="text-gray-600">Manage and analyze appointment data across all organizations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Across all organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Appointments</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{visitReportData?.visitsThisMonth ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Appointments this month
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Activity Logs Section */}
      <ActivityLogDisplay
        activities={appointmentActivities}
        title="Recent Appointment Activity"
        description="Latest appointment-related activities across the system"
        isLoading={activityLoading}
        maxItems={5}
      />

    </div>
  );
} 