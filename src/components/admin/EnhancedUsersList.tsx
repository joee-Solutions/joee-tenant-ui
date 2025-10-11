"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Users, 
  UserX, 
  Calendar,
  BarChart3,
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
import { useAllUsersData, useTenantsData, useTenantUsersData } from "@/hooks/swr";
import { Tenant } from "@/lib/types";
import { OrganizationUser } from "@/hooks/swr";
import { toast } from "react-toastify";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { ChartWrapper } from "@/components/ui/chart-wrapper";
import ActivityLogDisplay from "@/components/shared/ActivityLogDisplay";
import { useRecentActivity } from "@/hooks/useActivityLogs";

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
  const { data: tenantsData } = useTenantsData({ limit: 100 });
  
  // Fetch user-related activity logs
  const { activityLogs: userActivities, isLoading: activityLoading } = useRecentActivity({
    resource: 'user',
    limit: 5
  });

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
      if (filters.dateRange?.from && filters.dateRange?.to) {
        const userDate = new Date(user.createdAt);
        if (userDate < filters.dateRange.from || userDate > filters.dateRange.to) return false;
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

  const filteredUsers = users ? filterUsers(users as any[]) : [];

  if (error) {
    return (
      <div className="px-10 pt-[32px] pb-[56px]">
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <h2 className="text-2xl font-semibold text-red-600">Failed to Load Users</h2>
          <p className="text-gray-600">Please try refreshing the page or contact support.</p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-10 pt-[32px] pb-[56px] space-y-6">
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
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Across all organizations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactiveUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0 ? Math.round((stats.inactiveUsers / stats.totalUsers) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.newUsersThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              New registrations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users by Organization
            </CardTitle>
            <CardDescription>Distribution across organizations</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartWrapper width="100%" height={300}>
              <PieChart key="users-by-organization">
                <Pie
                  data={stats.usersByOrganization}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ organization, percent }) => `${organization} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  key="users-organization-pie"
                >
                  {stats.usersByOrganization.map((entry, index) => (
                    <Cell key={`cell-${entry.key || index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ChartWrapper>
          </CardContent>
        </Card>
      </div>

      {/* Activity Logs Section */}
      <ActivityLogDisplay
        activities={userActivities}
        title="Recent User Activity"
        description="Latest user-related activities across the system"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  {(tenantsData as Tenant[])?.map((tenant: Tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id.toString()}>
                      {tenant.name}
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
                  placeholder="Search users..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value })) as any}
                  className="pl-10"
                  onBlur={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value })) as any}
                  name="search-user"
                />
              </div>
            </div>

            {/* Include Inactive */}
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="includeInactive"
                checked={filters.includeInactive}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, includeInactive: checked as boolean }))
                }
              />
              <label htmlFor="includeInactive" className="text-sm font-medium">
                Include Inactive Users
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Users List</CardTitle>
              <CardDescription>
                Showing {filteredUsers.length} users
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
            id: "ID",
            name: "Name",
            email: "Email",
            organization: "Organization",
            phone: "Phone",
            status: "Status",
            created: "Created Date",
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
                  <TableCell><SkeletonBox className="h-4 w-20" /></TableCell>
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
            ) : filteredUsers.length > 0 ? (
              filteredUsers
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="font-medium">
                          {user.firstname} {user.lastname}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.tenant?.name || 'N/A'}</TableCell>
                    <TableCell>N/A</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user?.createdAt), "MMM dd, yyyy")}
                    </TableCell>
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
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No users found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </DataTable>

          <Pagination
            dataLength={filteredUsers.length}
            numOfPages={Math.ceil(filteredUsers.length / pageSize)}
            pageSize={pageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  );
} 