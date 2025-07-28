"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Pill,
  Calendar,
  User,
  Building2,
  BarChart3,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { DatePickerWrapper } from "@/components/ui/date-picker-wrapper";
import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { SkeletonBox } from "@/components/shared/loader/skeleton";
import { useTenantsData } from "@/hooks/swr";
import { Tenant } from "@/lib/types";
import { toast } from "react-toastify";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import ActivityLogDisplay from "@/components/shared/ActivityLogDisplay";
import { useRecentActivity } from "@/hooks/useActivityLogs";

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
  completedPrescriptions: number;
  totalCost: number;
  averageCost: number;
  prescriptionsByStatus: Array<{ status: string; count: number; percentage: number }>;
  prescriptionsByMedication: Array<{ medication: string; count: number; percentage: number }>;
  prescriptionsByMonth: Array<{ month: string; count: number }>;
  costByMonth: Array<{ month: string; cost: number }>;
}

interface FilterState {
  dateRange: DateRange | undefined;
  organization: string;
  status: string;
  medicationType: string;
  searchTerm: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const MEDICATIONS = [
  'Lisinopril', 'Metformin', 'Albuterol', 'Atorvastatin', 'Levothyroxine',
  'Amlodipine', 'Metoprolol', 'Omeprazole', 'Simvastatin', 'Losartan',
  'Ibuprofen', 'Acetaminophen', 'Aspirin', 'Warfarin', 'Insulin'
];

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  discontinued: 'bg-red-100 text-red-800',
  expired: 'bg-yellow-100 text-yellow-800'
};

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
  const [stats, setStats] = useState<PrescriptionStats>({
    totalPrescriptions: 0,
    activePrescriptions: 0,
    completedPrescriptions: 0,
    totalCost: 0,
    averageCost: 0,
    prescriptionsByStatus: [],
    prescriptionsByMedication: [],
    prescriptionsByMonth: [],
    costByMonth: []
  });

  // Mock data - replace with actual API call
  const [prescriptionsData, setPrescriptionsData] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: tenantsData } = useTenantsData({ limit: 100 });
  
  // Fetch prescription-related activity logs
  const { activityLogs: prescriptionActivities, isLoading: activityLoading } = useRecentActivity({
    resource: 'prescription',
    limit: 5
  });

  // Mock data generation
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockPrescriptions: Prescription[] = Array.from({ length: 300 }, (_, i) => {
        const statuses: Array<'active' | 'completed' | 'discontinued' | 'expired'> = ['active', 'completed', 'discontinued', 'expired'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const medication = MEDICATIONS[Math.floor(Math.random() * MEDICATIONS.length)];
        const isControlled = Math.random() > 0.8;
        const isGeneric = Math.random() > 0.6;
        const cost = Math.round((Math.random() * 200 + 10) * 100) / 100;
        
        return {
          id: i + 1,
          patientName: `Patient ${i + 1}`,
          patientId: Math.floor(Math.random() * 1000) + 1,
          doctorName: `Dr. ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(Math.random() * 5)]}`,
          medicationName: medication,
          dosage: `${Math.floor(Math.random() * 50) + 5}mg`,
          frequency: ['Once daily', 'Twice daily', 'Three times daily', 'As needed'][Math.floor(Math.random() * 4)],
          route: ['Oral', 'Topical', 'Inhalation', 'Injection'][Math.floor(Math.random() * 4)],
          quantity: Math.floor(Math.random() * 90) + 10,
          refills: Math.floor(Math.random() * 5),
          startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: Math.random() > 0.3 ? new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString() : undefined,
          status,
          isControlled,
          isGeneric,
          cost,
          tenant: {
            id: Math.floor(Math.random() * 10) + 1,
            name: `Organization ${Math.floor(Math.random() * 10) + 1}`
          },
          created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
        };
      });
      
      setPrescriptionsData(mockPrescriptions);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Calculate stats based on filtered data
  useEffect(() => {
    if (prescriptionsData.length > 0) {
      const filteredPrescriptions = filterPrescriptions(prescriptionsData);
      
      const totalPrescriptions = filteredPrescriptions.length;
      const activePrescriptions = filteredPrescriptions.filter(p => p.status === 'active').length;
      const completedPrescriptions = filteredPrescriptions.filter(p => p.status === 'completed').length;
      const totalCost = filteredPrescriptions.reduce((sum, p) => sum + p.cost, 0);
      const averageCost = totalPrescriptions > 0 ? Math.round((totalCost / totalPrescriptions) * 100) / 100 : 0;
      
      // Status distribution
      const statusCounts = new Map<string, number>();
      filteredPrescriptions.forEach(prescription => {
        statusCounts.set(prescription.status, (statusCounts.get(prescription.status) || 0) + 1);
      });
      const prescriptionsByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: Math.round((count / totalPrescriptions) * 100)
      }));

      // Medication distribution
      const medCounts = new Map<string, number>();
      filteredPrescriptions.forEach(prescription => {
        medCounts.set(prescription.medicationName, (medCounts.get(prescription.medicationName) || 0) + 1);
      });
      const prescriptionsByMedication = Array.from(medCounts.entries())
        .map(([medication, count]) => ({
          medication,
          count,
          percentage: Math.round((count / totalPrescriptions) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 medications

      // Monthly distribution (last 12 months)
      const prescriptionsByMonth = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthPrescriptions = filteredPrescriptions.filter(prescription => {
          const prescriptionDate = new Date(prescription.created_at);
          return prescriptionDate.getMonth() === date.getMonth() && 
                 prescriptionDate.getFullYear() === date.getFullYear();
        });
        return {
          month: format(date, 'MMM yyyy'),
          count: monthPrescriptions.length
        };
      }).reverse();

      // Cost by month
      const costByMonth = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthPrescriptions = filteredPrescriptions.filter(prescription => {
          const prescriptionDate = new Date(prescription.created_at);
          return prescriptionDate.getMonth() === date.getMonth() && 
                 prescriptionDate.getFullYear() === date.getFullYear();
        });
        return {
          month: format(date, 'MMM yyyy'),
          cost: Math.round(monthPrescriptions.reduce((sum, p) => sum + p.cost, 0) * 100) / 100
        };
      }).reverse();

      setStats({
        totalPrescriptions,
        activePrescriptions,
        completedPrescriptions,
        totalCost,
        averageCost,
        prescriptionsByStatus,
        prescriptionsByMedication,
        prescriptionsByMonth,
        costByMonth
      });
    }
  }, [prescriptionsData, filters]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'discontinued': return <AlertTriangle className="w-4 h-4" />;
      case 'expired': return <AlertTriangle className="w-4 h-4" />;
      default: return <Pill className="w-4 h-4" />;
    }
  };

  const filteredPrescriptions = filterPrescriptions(prescriptionsData);

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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${stats.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Average: ${stats.averageCost.toFixed(2)} per prescription
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.completedPrescriptions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPrescriptions > 0 ? Math.round((stats.completedPrescriptions / stats.totalPrescriptions) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Prescriptions by Status
            </CardTitle>
            <CardDescription>Distribution of prescription statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.prescriptionsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }) => `${status} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.prescriptionsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Medications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Top Medications
            </CardTitle>
            <CardDescription>Most prescribed medications</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.prescriptionsByMedication} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="medication" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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

        {/* Monthly Cost */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Monthly Cost
            </CardTitle>
            <CardDescription>Prescription costs over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.costByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                <Line type="monotone" dataKey="cost" stroke="#8B5CF6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Logs Section */}
      <ActivityLogDisplay
        activities={prescriptionActivities}
        title="Recent Prescription Activity"
        description="Latest prescription-related activities across the system"
        isLoading={activityLoading}
        maxItems={5}
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Date Range */}
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <DatePickerWrapper
                dateRange={filters.dateRange}
                onDateRangeChange={(range) => setFilters(prev => ({ ...prev, dateRange: range }))}
                placeholder="Pick a date range"
                className="w-full"
              />
            </div>

            {/* Organization Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Organization</label>
              <Select
                value={filters.organization}
                onValueChange={(value) => setFilters(prev => ({ ...prev, organization: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {tenantsData?.map((tenant: Tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id.toString()}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="discontinued">Discontinued</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Medication Type Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Medication Type</label>
              <Select
                value={filters.medicationType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, medicationType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="controlled">Controlled Substances</SelectItem>
                  <SelectItem value="generic">Generic</SelectItem>
                  <SelectItem value="brand">Brand Name</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search prescriptions..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
            id: "Prescription ID",
            patient: "Patient",
            doctor: "Doctor",
            medication: "Medication",
            dosage: "Dosage",
            frequency: "Frequency",
            status: "Status",
            cost: "Cost",
            organization: "Organization",
            actions: "Actions"
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
                  <TableCell><SkeletonBox className="h-4 w-12" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-20" /></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <SkeletonBox className="h-8 w-8 rounded" />
                      <SkeletonBox className="h-8 w-8 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredPrescriptions.length > 0 ? (
              filteredPrescriptions
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell className="font-medium">{prescription.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="font-medium">{prescription.patientName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{prescription.doctorName}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{prescription.medicationName}</div>
                        <div className="text-xs text-gray-500">
                          {prescription.isControlled && <Badge variant="destructive" className="text-xs mr-1">Controlled</Badge>}
                          {prescription.isGeneric ? 'Generic' : 'Brand'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{prescription.dosage}</TableCell>
                    <TableCell>{prescription.frequency}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[prescription.status]}>
                        {getStatusIcon(prescription.status)}
                        <span className="ml-1">{prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>${prescription.cost.toFixed(2)}</TableCell>
                    <TableCell>{prescription.tenant.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
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