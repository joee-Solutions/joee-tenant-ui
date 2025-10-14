"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  UserCheck, 
  Calendar, 
  Pill, 
  FileText, 
  Download, 
  BarChart3,
  TrendingUp,
  Building2
} from "lucide-react";
import EnhancedUsersList from "@/components/admin/EnhancedUsersList";
import EnhancedPatientsList from "@/components/admin/EnhancedPatientsList";
import EnhancedAppointmentsList from "@/components/admin/EnhancedAppointmentsList";
import EnhancedPrescriptionsList from "@/components/admin/EnhancedPrescriptionsList";
import { useRecentActivity, useActivityStats } from "@/hooks/useActivityLogs";
import { useDashboardData } from "@/hooks/swr";
import { formatDistanceToNow } from "date-fns";
import { clsx } from "clsx";

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = searchParams.get("tab");
  
  const [activeTab, setActiveTab] = useState(tabFromUrl || "overview");

  // Update active tab when URL changes
  useEffect(() => {
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);
  const { activityLogs: recentActivity, isLoading: activityLoading } = useRecentActivity({ limit: 5 });
  const { stats: activityStats, isLoading: statsLoading } = useActivityStats();
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboardData();

  const reportTabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <BarChart3 className="w-4 h-4" />,
      description: "System-wide analytics and key metrics"
    },
    {
      id: "users",
      label: "Users",
      icon: <Users className="w-4 h-4" />,
      description: "User management and analytics"
    },
    {
      id: "patients",
      label: "Patients",
      icon: <UserCheck className="w-4 h-4" />,
      description: "Patient data and demographics"
    },
    {
      id: "appointments",
      label: "Appointments",
      icon: <Calendar className="w-4 h-4" />,
      description: "Appointment scheduling and tracking"
    },
    {
      id: "prescriptions",
      label: "Prescriptions",
      icon: <Pill className="w-4 h-4" />,
      description: "Medication and prescription management"
    }
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL with the new tab
    if (value === "overview") {
      router.push("/dashboard/reports");
    } else {
      router.push(`/dashboard/reports?tab=${value}`);
    }
  };

  const handleExportAllReports = () => {
    // This would trigger export of all report data
    console.log("Exporting all reports...");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" /> Reports & Analytics
        </h1>
        <p className="text-lg text-blue-700 mb-8 font-medium">Comprehensive insights and analytics for your organization</p>

        {/* Overview Cards */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="rounded-xl shadow-md border-t-4 border-blue-500 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" /> Total Organizations
                </CardTitle>
                <Building2 className="h-5 w-5 text-blue-400" />
              </CardHeader>
              <CardContent>
                {dashboardLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900">{dashboardData?.totalTenants || 0}</div>
                    <p className="text-xs text-green-600 font-semibold">
                      +12% <span className="text-gray-500 font-normal">from last month</span>
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-xl shadow-md border-t-4 border-green-500 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-500" /> Total Users
                </CardTitle>
                <Users className="h-5 w-5 text-green-400" />
              </CardHeader>
              <CardContent>
                {dashboardLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900">{dashboardData?.totalUsers || 0}</div>
                    <p className="text-xs text-green-600 font-semibold">
                      +8% <span className="text-gray-500 font-normal">from last month</span>
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-xl shadow-md border-t-4 border-purple-500 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Pill className="h-5 w-5 text-purple-500" /> Total Patients
                </CardTitle>
                <Pill className="h-5 w-5 text-purple-400" />
              </CardHeader>
              <CardContent>
                {dashboardLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900">{dashboardData?.totalPatients || 0}</div>
                    <p className="text-xs text-green-600 font-semibold">
                      +15% <span className="text-gray-500 font-normal">from last month</span>
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-xl shadow-md border-t-4 border-yellow-500 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-yellow-500" /> Monthly Appointments
                </CardTitle>
                <Calendar className="h-5 w-5 text-yellow-400" />
              </CardHeader>
              <CardContent>
                {dashboardLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900">{dashboardData?.totalAppointments || 0}</div>
                    <p className="text-xs text-green-600 font-semibold">
                      +5% <span className="text-gray-500 font-normal">from last month</span>
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Stats for Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="rounded-xl shadow border-l-4 border-blue-400 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  System Growth
                </CardTitle>
                <CardDescription className="text-blue-700">Key metrics over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Organizations</span>
                    <span className="text-sm text-green-600 font-semibold">+24% growth</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Users</span>
                    <span className="text-sm text-green-600 font-semibold">+18% growth</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Patients</span>
                    <span className="text-sm text-green-600 font-semibold">+32% growth</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Appointments</span>
                    <span className="text-sm text-green-600 font-semibold">+12% growth</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow border-l-4 border-purple-400 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <FileText className="w-5 h-5 text-purple-500" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-purple-700">Latest system activities</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Activity Log Section */}
                {activityLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                          <div className="h-3 bg-gray-100 rounded animate-pulse w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => {
                      const getActivityColor = (activityType: string) => {
                        switch (activityType?.toLowerCase()) {
                          case 'super_admin':
                            return 'bg-purple-500';
                          case 'tenant':
                            return 'bg-blue-500';
                          case 'system':
                            return 'bg-orange-500';
                          default:
                            return 'bg-gray-500';
                        }
                      };

                      return (
                        <div key={activity.id} className="flex items-center gap-3 bg-white rounded-lg shadow-sm p-3 hover:bg-purple-100 transition-colors">
                          <div className={`w-2 h-2 ${getActivityColor(activity.activityType)} rounded-full`}></div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">{activity.metadata?.description || activity.action}</span>
                              {activity.userContext?.name && (
                                <span className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                                  by {activity.userContext.name}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {activity.tenantId && (
                                <span className="text-xs text-gray-500">
                                  Tenant ID: {activity.tenantId}
                                </span>
                              )}
                              {activity.userContext?.email && (
                                <span className="text-xs text-gray-500">
                                  • {activity.userContext.email}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500 ml-auto">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Report Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mt-8">
          <TabsList className="flex w-full rounded-xl shadow border border-gray-200 bg-white overflow-hidden">
            {reportTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={clsx(
                  "flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-150",
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 shadow-md rounded-xl -mb-1 border-b-4 border-blue-500"
                    : "text-gray-500 hover:bg-gray-100"
                )}
              >
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card className="rounded-xl shadow bg-gradient-to-br from-white to-blue-50 border border-blue-100">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-blue-900">System Overview</CardTitle>
                <CardDescription className="text-blue-700">
                  Welcome to the comprehensive reporting dashboard. Select a tab above to view detailed reports for each category.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Report Category</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Choose from the tabs above to access detailed analytics and reports for users, patients, appointments, and prescriptions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <EnhancedUsersList />
          </TabsContent>

          <TabsContent value="patients" className="mt-6">
            <EnhancedPatientsList />
          </TabsContent>

          <TabsContent value="appointments" className="mt-6">
            <EnhancedAppointmentsList />
          </TabsContent>

          <TabsContent value="prescriptions" className="mt-6">
            <EnhancedPrescriptionsList />
          </TabsContent>
        </Tabs>

        {/* Footer Information */}
        <Card className="mt-8 bg-white/80 rounded-xl shadow border-t-4 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center text-sm text-gray-500">
              <p>Reports are generated in real-time and reflect the current state of the system.</p>
              <p className="mt-1">
                Last updated: {new Date().toLocaleString()} | 
                Data refresh: Every 5 minutes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 