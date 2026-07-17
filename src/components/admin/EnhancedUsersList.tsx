"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Printer, 
  Users, 
  UserX, 
  Calendar,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useAllUsersData, useTenantsData, useTenantUsersData, useTenantsUsersReport } from "@/hooks/swr";
import { OrganizationUser } from "@/hooks/swr";
import { toast } from "react-toastify";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { sortByCreatedAtAsc } from "@/utils/sortByCreatedAt";
import { ChartWrapper } from "@/components/ui/chart-wrapper";

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersThisMonth: number;
  usersByMonth: Array<{ month: string; count: number; key: string }>;
  usersByOrganization: Array<{ organization: string; count: number; key: string }>;
}

interface FilterState {
  dateRange: DateRange | undefined;
  organization: string;
  includeInactive: boolean;
  searchTerm: string;
}

interface EnhancedUsersListProps {
  organizationId?: string;
}

export default function EnhancedUsersList({ organizationId }: EnhancedUsersListProps = {}) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: undefined,
    organization: "all",
    includeInactive: false,
    searchTerm: ""
  });
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    newUsersThisMonth: 0,
    usersByMonth: [],
    usersByOrganization: []
  });

  // Fetch data based on whether we're looking at all organizations or a specific one
  const isAllOrganizations = !organizationId || organizationId === "all";
  const { data: allUsersData, isLoading: allLoading, error: allError } = useAllUsersData();
  const { data: tenantUsersData, isLoading: tenantLoading, error: tenantError } = useTenantUsersData(organizationId || '');
  useTenantsData({ limit: 100 });
  const { data: usersReportData, isLoading: usersReportLoading } = useTenantsUsersReport();
  console.log(tenantUsersData, "tenantUsersData", allUsersData, "allUsersData", tenantLoading, "tenantLoading", allLoading, "allLoading");

  // Use the appropriate data based on whether organizationId is provided
  const usersData = isAllOrganizations ? allUsersData : tenantUsersData;
  const isLoading = isAllOrganizations ? allLoading : tenantLoading;
  const error = isAllOrganizations ? allError : tenantError;

  // Ensure usersData is always an array
  const users = Array.isArray(usersData) ? usersData : [];

  // Calculate stats based on filtered data
  useEffect(() => {
    if (users && Array.isArray(users)) {
      const filteredUsers = filterUsers(users  as any[]);
      
      const totalUsers = filteredUsers.length;
      const activeUsers = filteredUsers.filter(user => user.is_active).length;
      const inactiveUsers = totalUsers - activeUsers;
      
      // Calculate new users this month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const newUsersThisMonth = filteredUsers.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
      }).length;

      // Generate monthly data for the last 12 months
      const usersByMonth = Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthUsers = filteredUsers.filter(user => {
          const userDate = new Date(user.createdAt);
          return userDate.getMonth() === date.getMonth() && userDate.getFullYear() === date.getFullYear();
        });
        return {
          month: format(date, 'MMM yyyy'),
          count: monthUsers.length,
          key: format(date, 'yyyy-MM') // Add unique key
        };
      }).reverse();

      // Group by organization
      const orgMap = new Map<string, number>();
      filteredUsers.forEach(user => {
        const orgName = user.tenant?.name || 'Unknown';
        orgMap.set(orgName, (orgMap.get(orgName) || 0) + 1);
      });
      const usersByOrganization = Array.from(orgMap.entries()).map(([organization, count], index) => ({
        organization,
        count,
        key: organization || `unknown-${index}` // Add unique key
      }));

      setStats({
        totalUsers,
        activeUsers,
        inactiveUsers,
        newUsersThisMonth,
        usersByMonth,
        usersByOrganization
      });
    }
  }, [usersData, filters]);

  const filterUsers = (users: OrganizationUser[]) => {
    return users.filter(user => {
      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          user.firstname?.toLowerCase().includes(searchLower) ||
          user.lastname?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Organization filter
      if (filters.organization !== "all") {
        if (user.tenant?.id?.toString() !== filters.organization) return false;
      }

      // Date range filter
      if (filters.dateRange?.from || filters.dateRange?.to) {
        const userDate = new Date(user.createdAt);
        userDate.setHours(0, 0, 0, 0); // Normalize to start of day
        
        if (filters.dateRange?.from) {
          const fromDate = new Date(filters.dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          if (userDate < fromDate) return false;
        }
        
        if (filters.dateRange?.to) {
          const toDate = new Date(filters.dateRange.to);
          toDate.setHours(23, 59, 59, 999); // End of day
          if (userDate > toDate) return false;
        }
      }

      // Inactive users filter
      if (!filters.includeInactive && !user.is_active) return false;

      return true;
    });
  };

  const handleExportCSV = () => {
    if (!users) return;
    
    const filteredUsers = filterUsers(users as any[]);
    const csvContent = [
      ['ID', 'First Name', 'Last Name', 'Email', 'Organization', 'Status', 'Created Date'],
      ...filteredUsers.map(user => [
        user.id,
        user.firstname || '',
        user.lastname || '',
        user.email || '',
        user.tenant?.name || '',
        user.is_active ? 'Active' : 'Inactive',
        new Date(user.createdAt).toLocaleDateString()
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Users exported successfully');
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredUsers = users ? sortByCreatedAtAsc(filterUsers(users as any[])) : [];
  const summaryTotalUsers = usersReportData?.totalUsers ?? stats.totalUsers;
  const summaryActiveUsers = usersReportData?.activeCount ?? stats.activeUsers;
  const summaryInactiveUsers = usersReportData?.inactiveCount ?? stats.inactiveUsers;
  const summaryNewUsersThisMonth = usersReportData?.usersCreatedThisMonth ?? stats.newUsersThisMonth;
  const summaryMaleUsers = usersReportData?.maleCount ?? 0;
  const summaryFemaleUsers = usersReportData?.femaleCount ?? 0;
  const summaryLoading = usersReportLoading && !usersReportData;

  return (
    <div className="px-10 pt-[32px] pb-[56px] space-y-6">
      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800 font-medium">
              Failed to load users. Please try again.
            </p>
          </CardContent>
        </Card>
      )}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600">Manage and analyze user data across all organizations</p>
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
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryLoading ? "..." : summaryTotalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Across all organizations • M: {summaryMaleUsers} / F: {summaryFemaleUsers}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summaryLoading ? "..." : summaryActiveUsers}</div>
            <p className="text-xs text-muted-foreground">
              {summaryTotalUsers > 0 ? Math.round((summaryActiveUsers / summaryTotalUsers) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summaryLoading ? "..." : summaryInactiveUsers}</div>
            <p className="text-xs text-muted-foreground">
              {summaryTotalUsers > 0 ? Math.round((summaryInactiveUsers / summaryTotalUsers) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summaryLoading ? "..." : summaryNewUsersThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              New registrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Users by Month
            </CardTitle>
            <CardDescription>User registrations over the last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartWrapper width="100%" height={300}>
              <BarChart data={stats.usersByMonth} key="users-by-month">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" key="users-count-bar" />
              </BarChart>
            </ChartWrapper>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 