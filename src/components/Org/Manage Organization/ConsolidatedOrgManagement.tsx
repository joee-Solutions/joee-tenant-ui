"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Shield,
  Users,
  Eye,
  Plus,
  X,
  Key,
  Settings,
  UserCheck,
  User,
  Lock,
  Unlock,
  AlertTriangle
} from "lucide-react";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";
import { Role, Permission } from "@/lib/types";

interface OrganizationUser {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  is_active: boolean;
  status: string;
  roles: Role[];
  permissions: string[];
  department?: string;
  hasAuthCredentials: boolean;
  created_at: string;
}

interface PermissionWithRestriction {
  id: number;
  name: string;
  description: string;
  category: string;
  is_allowed: boolean;
  restriction?: {
    reason: string;
    restrictions: any;
  };
}

export default function ConsolidatedOrgManagement({ slug }: { slug: string }) {
  const [activeTab, setActiveTab] = useState("users");
  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<PermissionWithRestriction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<OrganizationUser | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<PermissionWithRestriction | null>(null);

  const fetchOrganizationUsers = async () => {
    try {
      setLoading(true);
      const response = await processRequestAuth("get", `/tenant/permissions/users`);

      if (response && response.status) {
        setOrganizationUsers(response.data || []);
      } else {
        toast.error("Failed to load organization users");
      }
    } catch (error) {
      console.error("Error fetching organization users:", error);
      toast.error("Failed to load organization users");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePermissions = async () => {
    try {
      const response = await processRequestAuth("get", `/tenant/permissions/available`);

      if (response && response.status) {
        setAvailablePermissions(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  useEffect(() => {
    fetchOrganizationUsers();
    fetchAvailablePermissions();
  }, [slug]);

  const filteredUsers = organizationUsers.filter(user =>
    user.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPermissions = availablePermissions.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePermissionToggle = async (permission: PermissionWithRestriction) => {
    try {
      const response = await processRequestAuth("post", `/tenant/permissions/restrictions`, {
        permission_id: permission.id,
        is_allowed: !permission.is_allowed,
        reason: !permission.is_allowed ? "Enabled by admin" : "Disabled by admin"
      });

      if (response && response.status) {
        toast.success(`Permission ${permission.is_allowed ? 'disabled' : 'enabled'} successfully`);
        fetchAvailablePermissions(); // Refresh the list
      } else {
        toast.error("Failed to update permission");
      }
    } catch (error) {
      console.error("Error updating permission:", error);
      toast.error("Failed to update permission");
    }
  };

  const getPermissionIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'user': return '👤';
      case 'tenant': return '🏢';
      case 'department': return '🏥';
      case 'patient': return '👨‍⚕️';
      case 'appointment': return '📅';
      case 'employee': return '👷';
      case 'record': return '📋';
      case 'training_guide': return '📚';
      case 'notification': return '🔔';
      case 'system_settings': return '⚙️';
      case 'backup': return '💾';
      case 'audit_log': return '📊';
      case 'support': return '🆘';
      case 'profile': return '👤';
      case 'dashboard': return '📈';
      default: return '🔑';
    }
  };

  const getPermissionCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'tenant': return 'bg-purple-100 text-purple-800';
      case 'department': return 'bg-green-100 text-green-800';
      case 'patient': return 'bg-red-100 text-red-800';
      case 'appointment': return 'bg-yellow-100 text-yellow-800';
      case 'employee': return 'bg-indigo-100 text-indigo-800';
      case 'record': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading organization data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Organization Management</h2>
          <p className="text-gray-600">Manage users and permissions for your organization</p>
        </div>
        <Button onClick={() => setActiveTab("users")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users ({organizationUsers.length})
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissions ({availablePermissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Organization Users
              </CardTitle>
              <CardDescription>
                Manage all users in your organization, their roles, and authentication status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value) as any}
                    className="pl-10"
                    onBlur={(e) => setSearchTerm(e.target.value) as any}
                    name="seacrh-user"

                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowUserDetails(true);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {user.firstname} {user.lastname}
                        </h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                            {user.status}
                          </Badge>
                          {user.hasAuthCredentials ? (
                            <Badge variant="outline" className="text-green-600">
                              <Key className="h-3 w-3 mr-1" />
                              Can Login
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Profile Only
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{user.department || 'No Department'}</p>
                      <p className="text-xs text-gray-400">{user.roles?.length || 0} roles</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permission Management
              </CardTitle>
              <CardDescription>
                Control which permissions are available to users in your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value) as any}
                    className="pl-10"
                    onBlur={(e) => setSearchTerm(e.target.value) as any}
                  name="seacrh-perm"

                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredPermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {getPermissionIcon(permission.category)}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{permission.name}</h3>
                        <p className="text-sm text-gray-500">{permission.description}</p>
                        <Badge className={`mt-1 ${getPermissionCategoryColor(permission.category)}`}>
                          {permission.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={permission.is_allowed ? "default" : "destructive"}>
                        {permission.is_allowed ? (
                          <>
                            <Unlock className="h-3 w-3 mr-1" />
                            Allowed
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3 mr-1" />
                            Restricted
                          </>
                        )}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePermissionToggle(permission)}
                      >
                        {permission.is_allowed ? "Restrict" : "Allow"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">User Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserDetails(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Basic Information</h4>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium">Name:</span> {selectedUser.firstname} {selectedUser.lastname}</p>
                  <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
                  <p><span className="font-medium">Department:</span> {selectedUser.department || 'Not assigned'}</p>
                  <p><span className="font-medium">Status:</span>
                    <Badge variant={selectedUser.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                      {selectedUser.status}
                    </Badge>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Authentication</h4>
                <div className="mt-2">
                  {selectedUser.hasAuthCredentials ? (
                    <Badge variant="outline" className="text-green-600">
                      <Key className="h-3 w-3 mr-1" />
                      Can Login to System
                    </Badge>
                  ) : (
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-orange-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Profile Only - Cannot Login
                      </Badge>
                      <Button size="sm" className="ml-2">
                        Enable Authentication
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Roles & Permissions</h4>
                <div className="mt-2 space-y-2">
                  <div>
                    <p className="font-medium text-sm text-gray-700">Roles ({selectedUser.roles?.length || 0}):</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedUser.roles?.map((role) => (
                        <Badge key={role.id} variant="secondary">
                          {role.name}
                        </Badge>
                      )) || <span className="text-gray-500">No roles assigned</span>}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-700">Permissions ({selectedUser.permissions?.length || 0}):</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedUser.permissions?.slice(0, 5).map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                      {selectedUser.permissions?.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{selectedUser.permissions.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowUserDetails(false)}>
                Close
              </Button>
              <Button>
                Edit User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 