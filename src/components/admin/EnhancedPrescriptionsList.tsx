"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Download, 
  Printer, 
  Pill,
  Calendar,
  BarChart3,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { SkeletonBox } from "@/components/shared/loader/skeleton";
import { usePatientsPrescriptionReport } from "@/hooks/swr";
import { toast } from "react-toastify";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Prescription {
  id: number;
  patientName: string;
  patientId: number;
  doctorName: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  route: string;
  quantity: number;
  refills: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'discontinued' | 'expired';
  isControlled: boolean;
  isGeneric: boolean;
  cost: number;
  tenant: {
    id: number;
    name: string;
  };
  created_at: string;
}

interface PrescriptionStats {
  totalPrescriptions: number;
  activePrescriptions: number;
  prescriptionsByMonth: Array<{ month: string; count: number }>;
}

interface FilterState {
  dateRange: DateRange | undefined;
  organization: string;
  status: string;
  medicationType: string;
  searchTerm: string;
}

export default function EnhancedPrescriptionsList() {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: undefined,
    organization: "all",
    status: "all",
    medicationType: "all",
    searchTerm: ""
  });
  const { data: prescriptionsReportData, isLoading } = usePatientsPrescriptionReport();

  const prescriptionsData: Prescription[] = useMemo(() => {
    return (prescriptionsReportData ?? []).map((item, index) => ({
      id: Number(`${item.patientId || 0}${index + 1}`),
      patientName: item.patientName || "Unknown Patient",
      patientId: item.patientId || 0,
      doctorName: item.prescriberName || "Unknown Prescriber",
      medicationName: item.medicationName || "Unknown Medication",
      dosage: item.dosage || "-",
      frequency: item.notes || "As directed",
      route: item.directions || "-",
      quantity: 0,
      refills: 0,
      startDate: item.startDate || new Date().toISOString(),
      endDate: undefined,
      status: "active",
      isControlled: Boolean(item.controlledSubstance),
      isGeneric: Boolean(item.checkedDrugFormulary),
      cost: 0,
      tenant: {
        id: 0,
        name: "N/A",
      },
      created_at: item.startDate || new Date().toISOString(),
    }));
  }, [prescriptionsReportData]);

  const filterPrescriptions = (prescriptions: Prescription[]) => {
    return prescriptions.filter(prescription => {
      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          prescription.patientName.toLowerCase().includes(searchLower) ||
          prescription.doctorName.toLowerCase().includes(searchLower) ||
          prescription.medicationName.toLowerCase().includes(searchLower) ||
          prescription.dosage.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Organization filter
      if (filters.organization !== "all") {
        if (prescription.tenant.id.toString() !== filters.organization) return false;
      }

      // Status filter
      if (filters.status !== "all") {
        if (prescription.status !== filters.status) return false;
      }

      // Medication type filter
      if (filters.medicationType !== "all") {
        if (filters.medicationType === "controlled" && !prescription.isControlled) return false;
        if (filters.medicationType === "generic" && !prescription.isGeneric) return false;
        if (filters.medicationType === "brand" && prescription.isGeneric) return false;
      }

      // Date range filter
      if (filters.dateRange?.from && filters.dateRange?.to) {
        const prescriptionDate = new Date(prescription.created_at);
        if (prescriptionDate < filters.dateRange.from || prescriptionDate > filters.dateRange.to) return false;
      }

      return true;
    });
  };

  const filteredPrescriptions = useMemo(
    () => filterPrescriptions(prescriptionsData),
    [prescriptionsData, filters]
  );

  const stats: PrescriptionStats = useMemo(() => {
    const totalPrescriptions = filteredPrescriptions.length;
    const activePrescriptions = filteredPrescriptions.filter((p) => p.status === "active").length;

    const prescriptionsByMonth = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthPrescriptions = filteredPrescriptions.filter((prescription) => {
        const prescriptionDate = new Date(prescription.created_at);
        return (
          prescriptionDate.getMonth() === date.getMonth() &&
          prescriptionDate.getFullYear() === date.getFullYear()
        );
      });
      return {
        month: format(date, "MMM yyyy"),
        count: monthPrescriptions.length,
      };
    }).reverse();

    return {
      totalPrescriptions,
      activePrescriptions,
      prescriptionsByMonth,
    };
  }, [filteredPrescriptions]);

  const handleExportCSV = () => {
    if (!prescriptionsData) return;
    
    const filteredPrescriptions = filterPrescriptions(prescriptionsData);
    const csvContent = [
      ['Prescription ID', 'Patient Name', 'Doctor Name', 'Medication', 'Dosage', 'Frequency', 'Route', 'Quantity', 'Refills', 'Start Date', 'End Date', 'Status', 'Cost', 'Organization', 'Created Date'],
      ...filteredPrescriptions.map(prescription => [
        prescription.id,
        prescription.patientName,
        prescription.doctorName,
        prescription.medicationName,
        prescription.dosage,
        prescription.frequency,
        prescription.route,
        prescription.quantity,
        prescription.refills,
        format(new Date(prescription.startDate), 'MMM dd, yyyy'),
        prescription.endDate ? format(new Date(prescription.endDate), 'MMM dd, yyyy') : 'Ongoing',
        prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1),
        `$${prescription.cost.toFixed(2)}`,
        prescription.tenant.name,
        format(new Date(prescription.created_at), 'MMM dd, yyyy')
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescriptions-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Prescriptions exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="px-10 pt-[32px] pb-[56px] space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prescriptions Management</h1>
          <p className="text-gray-600">Manage and analyze prescription data across all organizations</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prescriptions</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrescriptions}</div>
            <p className="text-xs text-muted-foreground">
              Across all organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activePrescriptions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPrescriptions > 0 ? Math.round((stats.activePrescriptions / stats.totalPrescriptions) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">

        {/* Monthly Prescriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Monthly Prescriptions
            </CardTitle>
            <CardDescription>Prescriptions over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.prescriptionsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Prescriptions Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Prescriptions List</CardTitle>
              <CardDescription>
                Showing {filteredPrescriptions.length} prescriptions
                {filters.dateRange?.from && filters.dateRange?.to && 
                  ` from ${format(filters.dateRange.from, "MMM dd, yyyy")} to ${format(filters.dateRange.to, "MMM dd, yyyy")}`
                }
              </CardDescription>
            </div>
            <ListView pageSize={pageSize} setPageSize={setPageSize} />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable tableDataObj={{
            id: "S/N",
            patient: "Patient",
            doctor: "Doctor",
            medication: "Medication",
            dosage: "Dosage",
            notes: "Notes",
            startDate: "Start Date",
            directions: "Directions"
          }}>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><SkeletonBox className="h-4 w-8" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-24" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-20" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-16" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-12" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-16" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-12" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-20" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-16" /></TableCell>
                </TableRow>
              ))
            ) : filteredPrescriptions.length > 0 ? (
              filteredPrescriptions
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((prescription, index) => (
                  <TableRow key={prescription.id}>
                    <TableCell className="font-medium">{(currentPage - 1) * pageSize + index + 1}</TableCell>
                    <TableCell>
                      <span className="font-medium">{prescription.patientName}</span>
                    </TableCell>
                    <TableCell>{prescription.doctorName}</TableCell>
                    <TableCell>{prescription.medicationName}</TableCell>
                    <TableCell>{prescription.dosage}</TableCell>
                    <TableCell>{prescription.frequency}</TableCell>
                    <TableCell>{format(new Date(prescription.startDate), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{prescription.route}</TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No prescriptions found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </DataTable>

          <Pagination
            dataLength={filteredPrescriptions.length}
            numOfPages={Math.ceil(filteredPrescriptions.length / pageSize)}
            pageSize={pageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  );
} 