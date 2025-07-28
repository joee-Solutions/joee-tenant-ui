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
  Calendar,
  Clock,
  User,
  Building2,
  BarChart3,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle
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

interface Appointment {
  id: number;
  patientName: string;
  patientId: number;
  doctorName: string;
  department: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  type: string;
  notes?: string;
  tenant: {
    id: number;
    name: string;
  };
  created_at: string;
}

interface AppointmentStats {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  averageDuration: number;
  appointmentsByStatus: Array<{ status: string; count: number; percentage: number }>;
  appointmentsByDepartment: Array<{ department: string; count: number; percentage: number }>;
  appointmentsByDay: Array<{ day: string; count: number }>;
  appointmentsByMonth: Array<{ month: string; count: number }>;
}

interface FilterState {
  dateRange: DateRange | undefined;
  organization: string;
  status: string;
  department: string;
  searchTerm: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const DEPARTMENTS = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology', 
  'Gynaecology', 'Nephrology', 'Dermatology', 'Psychiatry', 'Emergency'
];

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  'no-show': 'bg-yellow-100 text-yellow-800'
};

export default function EnhancedAppointmentsList() {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: undefined,
    organization: "all",
    status: "all",
    department: "all",
    searchTerm: ""
  });
  const [stats, setStats] = useState<AppointmentStats>({
    totalAppointments: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    noShowAppointments: 0,
    averageDuration: 0,
    appointmentsByStatus: [],
    appointmentsByDepartment: [],
    appointmentsByDay: [],
    appointmentsByMonth: []
  });

  // Mock data - replace with actual API call
  const [appointmentsData, setAppointmentsData] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: tenantsData } = useTenantsData({ limit: 100 });
  
  // Fetch appointment-related activity logs
  const { activityLogs: appointmentActivities, isLoading: activityLoading } = useRecentActivity({
    resource: 'appointment',
    limit: 5
  });

  // Mock data generation
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockAppointments: Appointment[] = Array.from({ length: 200 }, (_, i) => {
        const statuses: Array<'scheduled' | 'completed' | 'cancelled' | 'no-show'> = ['scheduled', 'completed', 'cancelled', 'no-show'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const department = DEPARTMENTS[Math.floor(Math.random() * DEPARTMENTS.length)];
        const appointmentDate = new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000);
        
        return {
          id: i + 1,
          patientName: `Patient ${i + 1}`,
          patientId: Math.floor(Math.random() * 1000) + 1,
          doctorName: `Dr. ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(Math.random() * 5)]}`,
          department,
          appointmentDate: appointmentDate.toISOString(),
          appointmentTime: `${Math.floor(Math.random() * 12) + 8}:${Math.random() > 0.5 ? '00' : '30'} ${Math.random() > 0.5 ? 'AM' : 'PM'}`,
          duration: [15, 30, 45, 60, 90][Math.floor(Math.random() * 5)],
          status,
          type: ['Consultation', 'Follow-up', 'Emergency', 'Routine'][Math.floor(Math.random() * 4)],
          notes: Math.random() > 0.7 ? 'Special notes for this appointment' : undefined,
          tenant: {
            id: Math.floor(Math.random() * 10) + 1,
            name: `Organization ${Math.floor(Math.random() * 10) + 1}`
          },
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        };
      });
      
      setAppointmentsData(mockAppointments);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Calculate stats based on filtered data
  useEffect(() => {
    if (appointmentsData.length > 0) {
      const filteredAppointments = filterAppointments(appointmentsData);
      
      const totalAppointments = filteredAppointments.length;
      const completedAppointments = filteredAppointments.filter(a => a.status === 'completed').length;
      const cancelledAppointments = filteredAppointments.filter(a => a.status === 'cancelled').length;
      const noShowAppointments = filteredAppointments.filter(a => a.status === 'no-show').length;
      const averageDuration = filteredAppointments.length > 0 
        ? Math.round(filteredAppointments.reduce((sum, a) => sum + a.duration, 0) / filteredAppointments.length)
        : 0;
      
      // Status distribution
      const statusCounts = new Map<string, number>();
      filteredAppointments.forEach(appointment => {
        statusCounts.set(appointment.status, (statusCounts.get(appointment.status) || 0) + 1);
      });
      const appointmentsByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        percentage: Math.round((count / totalAppointments) * 100)
      }));

      // Department distribution
      const deptCounts = new Map<string, number>();
      filteredAppointments.forEach(appointment => {
        deptCounts.set(appointment.department, (deptCounts.get(appointment.department) || 0) + 1);
      });
      const appointmentsByDepartment = Array.from(deptCounts.entries())
        .map(([department, count]) => ({
          department,
          count,
          percentage: Math.round((count / totalAppointments) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8); // Top 8 departments

      // Daily distribution (last 7 days)
      const appointmentsByDay = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayAppointments = filteredAppointments.filter(appointment => {
          const appointmentDate = new Date(appointment.appointmentDate);
          return appointmentDate.toDateString() === date.toDateString();
        });
        return {
          day: format(date, 'EEE'),
          count: dayAppointments.length
        };
      }).reverse();

      // Monthly distribution (last 12 months)
      const appointmentsByMonth = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthAppointments = filteredAppointments.filter(appointment => {
          const appointmentDate = new Date(appointment.appointmentDate);
          return appointmentDate.getMonth() === date.getMonth() && 
                 appointmentDate.getFullYear() === date.getFullYear();
        });
        return {
          month: format(date, 'MMM yyyy'),
          count: monthAppointments.length
        };
      }).reverse();

      setStats({
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        noShowAppointments,
        averageDuration,
        appointmentsByStatus,
        appointmentsByDepartment,
        appointmentsByDay,
        appointmentsByMonth
      });
    }
  }, [appointmentsData, filters]);

  const filterAppointments = (appointments: Appointment[]) => {
    return appointments.filter(appointment => {
      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          appointment.patientName.toLowerCase().includes(searchLower) ||
          appointment.doctorName.toLowerCase().includes(searchLower) ||
          appointment.department.toLowerCase().includes(searchLower) ||
          appointment.type.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Organization filter
      if (filters.organization !== "all") {
        if (appointment.tenant.id.toString() !== filters.organization) return false;
      }

      // Status filter
      if (filters.status !== "all") {
        if (appointment.status !== filters.status) return false;
      }

      // Department filter
      if (filters.department !== "all") {
        if (appointment.department !== filters.department) return false;
      }

      // Date range filter
      if (filters.dateRange?.from && filters.dateRange?.to) {
        const appointmentDate = new Date(appointment.appointmentDate);
        if (appointmentDate < filters.dateRange.from || appointmentDate > filters.dateRange.to) return false;
      }

      return true;
    });
  };

  const handleExportCSV = () => {
    if (!appointmentsData) return;
    
    const filteredAppointments = filterAppointments(appointmentsData);
    const csvContent = [
      ['Appointment ID', 'Patient Name', 'Doctor Name', 'Department', 'Date', 'Time', 'Duration', 'Status', 'Type', 'Organization', 'Created Date'],
      ...filteredAppointments.map(appointment => [
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'no-show': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredAppointments = filterAppointments(appointmentsData);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAppointments > 0 ? Math.round((stats.completedAppointments / stats.totalAppointments) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelledAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAppointments > 0 ? Math.round((stats.cancelledAppointments / stats.totalAppointments) * 100) : 0}% cancellation rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.averageDuration}</div>
            <p className="text-xs text-muted-foreground">
              Minutes per appointment
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
              Appointments by Status
            </CardTitle>
            <CardDescription>Distribution of appointment statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.appointmentsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percentage }) => `${status} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.appointmentsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Appointments by Department
            </CardTitle>
            <CardDescription>Top departments by appointment volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.appointmentsByDepartment} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="department" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Daily Appointments
            </CardTitle>
            <CardDescription>Appointments over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.appointmentsByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Monthly Appointments
            </CardTitle>
            <CardDescription>Appointments over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.appointmentsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
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
              <label className="text-sm font-medium mb-2 block">Appointment Date Range</label>
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
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no-show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Department</label>
              <Select
                value={filters.department}
                onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
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
                  placeholder="Search appointments..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Appointments List</CardTitle>
              <CardDescription>
                Showing {filteredAppointments.length} appointments
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
            id: "Appointment ID",
            patient: "Patient",
            doctor: "Doctor",
            department: "Department",
            date: "Date",
            time: "Time",
            duration: "Duration",
            status: "Status",
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
                  <TableCell><SkeletonBox className="h-4 w-20" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-12" /></TableCell>
                  <TableCell><SkeletonBox className="h-4 w-16" /></TableCell>
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
            ) : filteredAppointments.length > 0 ? (
              filteredAppointments
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">{appointment.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="font-medium">{appointment.patientName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{appointment.doctorName}</TableCell>
                    <TableCell>{appointment.department}</TableCell>
                    <TableCell>{format(new Date(appointment.appointmentDate), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{appointment.appointmentTime}</TableCell>
                    <TableCell>{appointment.duration} min</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[appointment.status]}>
                        {getStatusIcon(appointment.status)}
                        <span className="ml-1">{appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>{appointment.tenant.name}</TableCell>
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
                  No appointments found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </DataTable>

          <Pagination
            dataLength={filteredAppointments.length}
            numOfPages={Math.ceil(filteredAppointments.length / pageSize)}
            pageSize={pageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  );
} 