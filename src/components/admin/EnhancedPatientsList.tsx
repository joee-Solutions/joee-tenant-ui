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
  Users, 
  Building2,
  Calendar,
  BarChart3,
  MapPin,
  Eye,
  Edit,
  User
} from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { DatePickerWrapper } from "@/components/ui/date-picker-wrapper";
import DataTable from "@/components/shared/table/DataTable";
import { ListView } from "@/components/shared/table/DataTableFilter";
import Pagination from "@/components/shared/table/pagination";
import { SkeletonBox } from "@/components/shared/loader/skeleton";
import { useTenantsData, useAllPatientsData, useTenantPatientsData } from "@/hooks/swr";
import { Tenant } from "@/lib/types";
import { toast } from "react-toastify";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { ChartWrapper } from "@/components/ui/chart-wrapper";
import ActivityLogDisplay from "@/components/shared/ActivityLogDisplay";
import { useRecentActivity } from "@/hooks/useActivityLogs";

interface Patient {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  dateOfBirth: string;
  gender: string;
  race: string;
  ethnicity: string;
  tenant: {
    id: number;
    name: string;
  };
  created_at: string;
  service_date?: string;
}

interface PatientStats {
  totalPatients: number;
  totalOrganizations: number;
  genderDistribution: Array<{ gender: string; count: number; percentage: number; key: string }>;
  ageDistribution: Array<{ ageGroup: string; count: number; percentage: number; key: string }>;
  locationDistribution: Array<{ location: string; count: number; percentage: number; key: string }>;
}

interface FilterState {
  dateRange: DateRange | undefined;
  organization: string;
  searchTerm: string;
  gender: string;
  ageGroup: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AGE_GROUPS = [
  { label: 'Under 1', min: 0, max: 1 },
  { label: '2-5', min: 2, max: 5 },
  { label: '6-10', min: 6, max: 10 },
  { label: '11-17', min: 11, max: 17 },
  { label: '18-25', min: 18, max: 25 },
  { label: '26-35', min: 26, max: 35 },
  { label: '36-45', min: 36, max: 45 },
  { label: '46-55', min: 46, max: 55 },
  { label: '56-65', min: 56, max: 65 },
  { label: '66+', min: 66, max: 999 }
];

interface EnhancedPatientsListProps {
  organizationId?: string;
}

export default function EnhancedPatientsList({ organizationId }: EnhancedPatientsListProps = {}) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: undefined,
    organization: "all",
    searchTerm: "",
    gender: "all",
    ageGroup: "all"
  });
  const [stats, setStats] = useState<PatientStats>({
    totalPatients: 0,
    totalOrganizations: 0,
    genderDistribution: [],
    ageDistribution: [],
    locationDistribution: []
  });

  // Fetch data based on whether we're looking at all organizations or a specific one
  const isAllOrganizations = !organizationId || organizationId === "all";
  const { data: allPatientsData, isLoading: allLoading, error: allError } = useAllPatientsData();
  const { data: tenantPatientsData, isLoading: tenantLoading, error: tenantError } = useTenantPatientsData(organizationId || '');
  const { data: tenantsData } = useTenantsData({ limit: 100 });
  
  // Fetch patient-related activity logs
  const { activityLogs: patientActivities, isLoading: activityLoading } = useRecentActivity({
    resource: 'patient',
    limit: 5
  });

  // Use the appropriate data based on whether organizationId is provided
  const patientsData = isAllOrganizations ? allPatientsData : tenantPatientsData;
  const isLoading = isAllOrganizations ? allLoading : tenantLoading;
  const error = isAllOrganizations ? allError : tenantError;

  // Ensure patientsData is always an array
  const patients = Array.isArray(patientsData) ? patientsData : [];

  // Calculate stats based on filtered data
  useEffect(() => {
    if (patients && patients.length > 0) {
      const filteredPatients = filterPatients(patients);
      
      const totalPatients = filteredPatients.length;
      const uniqueOrganizations = new Set(filteredPatients.map(p => p.tenant.id)).size;
      
      // Gender distribution
      const genderCounts = new Map<string, number>();
      filteredPatients.forEach(patient => {
        genderCounts.set(patient.gender, (genderCounts.get(patient.gender) || 0) + 1);
      });
      const genderDistribution = Array.from(genderCounts.entries()).map(([gender, count]) => ({
        gender,
        count,
        percentage: Math.round((count / totalPatients) * 100),
        key: gender
      }));

      // Age distribution
      const ageCounts = new Map<string, number>();
      filteredPatients.forEach(patient => {
        const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
        const ageGroup = AGE_GROUPS.find(group => age >= group.min && age <= group.max)?.label || 'Unknown';
        ageCounts.set(ageGroup, (ageCounts.get(ageGroup) || 0) + 1);
      });
      const ageDistribution = AGE_GROUPS.map(group => ({
        ageGroup: group.label,
        count: ageCounts.get(group.label) || 0,
        percentage: Math.round(((ageCounts.get(group.label) || 0) / totalPatients) * 100),
        key: group.label
      })).filter(item => item.count > 0);

      // Location distribution
      const locationCounts = new Map<string, number>();
      filteredPatients.forEach(patient => {
        const location = `${patient.state}, ${patient.country}`;
        locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
      });
      const locationDistribution = Array.from(locationCounts.entries())
        .map(([location, count], index) => ({
          location,
          count,
          percentage: Math.round((count / totalPatients) * 100),
          key: location || `location-${index}`
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 locations

      setStats({
        totalPatients,
        totalOrganizations: uniqueOrganizations,
        genderDistribution,
        ageDistribution,
        locationDistribution
      });
    }
  }, [patientsData, filters]);

  const filterPatients = (patients: Patient[]) => {
    return patients.filter(patient => {
      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          patient.firstname.toLowerCase().includes(searchLower) ||
          patient.lastname.toLowerCase().includes(searchLower) ||
          patient.email.toLowerCase().includes(searchLower) ||
          patient.phone.toLowerCase().includes(searchLower) ||
          patient.address.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Organization filter
      if (filters.organization !== "all") {
        if (patient.tenant.id.toString() !== filters.organization) return false;
      }

      // Gender filter
      if (filters.gender !== "all") {
        if (patient.gender !== filters.gender) return false;
      }

      // Age group filter
      if (filters.ageGroup !== "all") {
        const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
        const ageGroup = AGE_GROUPS.find(group => age >= group.min && age <= group.max)?.label;
        if (ageGroup !== filters.ageGroup) return false;
      }

      // Date range filter (service date)
      if (filters.dateRange?.from && filters.dateRange?.to && patient.service_date) {
        const serviceDate = new Date(patient.service_date);
        if (serviceDate < filters.dateRange.from || serviceDate > filters.dateRange.to) return false;
      }

      return true;
    });
  };

  const handleExportCSV = () => {
    if (!patients) return;
    
    const filteredPatients = filterPatients(patients);
    const csvContent = [
      ['Patient ID', 'Date Created', 'Patient Name', 'Patient Address', 'Age', 'Gender', 'Race', 'Ethnicity', 'Phone', 'Email', 'Organization', 'State', 'Country'],
      ...filteredPatients.map(patient => {
        const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
        return [
          patient.id,
          new Date(patient.created_at).toLocaleDateString(),
          `${patient.firstname} ${patient.lastname}`,
          patient.address,
          age,
          patient.gender,
          patient.race,
          patient.ethnicity,
          patient.phone,
          patient.email,
          patient.tenant.name,
          patient.state,
          patient.country
        ];
      })
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patients-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Patients exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredPatients = patients ? filterPatients(patients) : [];

  return (
    <div className="px-10 pt-[32px] pb-[56px] space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients Management</h1>
          <p className="text-gray-600">Manage and analyze patient data across all organizations</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              Across all organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalOrganizations}</div>
            <p className="text-xs text-muted-foreground">
              With patient data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Age</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredPatients.length > 0 
                ? Math.round(filteredPatients.reduce((sum, p) => {
                    const age = new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear();
                    return sum + age;
                  }, 0) / filteredPatients.length)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Years old
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Gender Distribution
            </CardTitle>
            <CardDescription>Percentage breakdown by gender</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartWrapper width="100%" height={300}>
              <PieChart key="patients-gender-pie">
                <Pie
                  data={stats.genderDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ gender, percentage }) => `${gender} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  key="patients-gender-pie-chart"
                >
                  {stats.genderDistribution.map((entry, index) => (
                    <Cell key={`cell-${entry.key || index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ChartWrapper>
          </CardContent>
        </Card>

        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Age Distribution
            </CardTitle>
            <CardDescription>Patients by age group</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartWrapper width="100%" height={300}>
              <BarChart data={stats.ageDistribution} key="patients-age-bar">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ageGroup" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" key="patients-age-bar-chart" />
              </BarChart>
            </ChartWrapper>
          </CardContent>
        </Card>

        {/* Location Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Top Locations
            </CardTitle>
            <CardDescription>Patients by state/country</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartWrapper width="100%" height={300}>
              <BarChart data={stats.locationDistribution} layout="horizontal" key="patients-location-bar">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="location" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#10B981" key="patients-location-bar-chart" />
              </BarChart>
            </ChartWrapper>
          </CardContent>
        </Card>
      </div>

      {/* Activity Logs Section */}
      <ActivityLogDisplay
        activities={patientActivities}
        title="Recent Patient Activity"
        description="Latest patient-related activities across the system"
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
              <label className="text-sm font-medium mb-2 block">Service Date Range</label>
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
                  {(tenantsData as Tenant[])?.map((tenant: Tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id.toString()}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Gender Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Gender</label>
              <Select
                value={filters.gender}
                onValueChange={(value) => setFilters(prev => ({ ...prev, gender: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Age Group Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Age Group</label>
              <Select
                value={filters.ageGroup}
                onValueChange={(value) => setFilters(prev => ({ ...prev, ageGroup: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select age group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ages</SelectItem>
                  {AGE_GROUPS.map(group => (
                    <SelectItem key={group.label} value={group.label}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search patients..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value })) as any}
                  onBlur={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value })) as any}
                  name="searchTerm"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Patients List</CardTitle>
              <CardDescription>
                Showing {filteredPatients.length} patients
                {filters.dateRange?.from && filters.dateRange?.to && 
                  ` with service dates from ${format(filters.dateRange.from, "MMM dd, yyyy")} to ${format(filters.dateRange.to, "MMM dd, yyyy")}`
                }
              </CardDescription>
            </div>
            <ListView pageSize={pageSize} setPageSize={setPageSize} />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable tableDataObj={{
            id: "Patient ID",
            name: "Patient Name",
            address: "Address",
            age: "Age",
            gender: "Gender",
            organization: "Organization",
            phone: "Phone",
            email: "Email",
            actions: "Actions"
          }}>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><SkeletonBox className="h-4 w-8" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <SkeletonBox className="w-8 h-8 rounded-full" />
                      <SkeletonBox className="h-4 w-24" />
                    </div>
                  </TableCell>
                  <TableCell><SkeletonBox className="h-4 w-32" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-8" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-12" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-20" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-16" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-32" /></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <SkeletonBox className="h-8 w-8 rounded" />
                      <SkeletonBox className="h-8 w-8 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredPatients.length > 0 ? (
              filteredPatients
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((patient) => {
                  const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
                  return (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-500" />
                          </div>
                          <span className="font-medium">
                            {patient.firstname} {patient.lastname}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{patient.address}</TableCell>
                      <TableCell>{age}</TableCell>
                      <TableCell>
                        <Badge variant={patient.gender === 'Male' ? "default" : "secondary"}>
                          {patient.gender}
                        </Badge>
                      </TableCell>
                      <TableCell>{patient.tenant.name}</TableCell>
                      <TableCell>{patient.phone}</TableCell>
                      <TableCell>{patient.email}</TableCell>
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
                  );
                })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No patients found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </DataTable>

          <Pagination
            dataLength={filteredPatients.length}
            numOfPages={Math.ceil(filteredPatients.length / pageSize)}
            pageSize={pageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  );
} 