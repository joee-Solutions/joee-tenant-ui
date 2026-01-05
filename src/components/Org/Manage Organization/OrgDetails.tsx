"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Users,
  Eye,
  X,
  Settings,
  User,
} from "lucide-react";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";
import { Role } from "@/lib/types";
import PermissionsManager from "./PermissionsManager";

interface OrganizationUser {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  is_active: boolean;
  roles: Role[];
  department?: {
    id: number;
    name: string;
  };
  created_at: string;
}

export default function OrgDetails({ slug }: { slug: string }) {
  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<OrganizationUser | null|any>(null);
  const [showRolesModal, setShowRolesModal] = useState(false);
  // Assign-role modal has been deprecated – roles are now assigned only from the Admin page
  // Keeping state removed to avoid unused code and JSX syntax issues

  // Define seeded/default roles that should not be editable
  const seededRoles = ['Super_Admin', 'Admin', 'Tenant_Admin', 'Tenant_User'];

  const fetchOrganizationUsers = async () => {
    try {
      setLoading(true);
      // This endpoint would need to be created in the backend
      const response = await processRequestAuth("get", `${API_ENDPOINTS.GET_TENANT_USERS(slug)}?type=Admin`);

      if (response && typeof response === 'object' && 'success' in response) {
        if (response.success && response.data) {
          setOrganizationUsers(Array.isArray(response.data) ? response.data : []);
        } else {
          console.error("Failed to fetch organization users:", response.message);
          toast.error(response.message || "Failed to load organization users");
        }
      } else {
        setOrganizationUsers(response?.data || response || []);
      }
    } catch (error) {
      console.error("Error fetching organization users:", error);
      toast.error("Failed to load organization users");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRoles = async () => {
    try {
      const response = await processRequestAuth("get", `${API_ENDPOINTS.GET_ALL_ROLES}?permission=true`);

      if (response && typeof response === 'object' && 'success' in response) {
        if (response.success && response.data) {
          setAvailableRoles(Array.isArray(response.data) ? response.data : []);
        }
      } else {
        setAvailableRoles(response?.data?.roles || response || []);
      }
    } catch (error) {
      console.error("Error fetching available roles:", error);
    }
  };

  useEffect(() => {
    fetchOrganizationUsers();
    fetchAvailableRoles();
  }, [slug]);

  const filteredOrganizationUsers = organizationUsers.filter(user =>
    user.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleCount = (user: OrganizationUser) => {
    return user.roles?.length || 0;
  };

  const getRoleNames = (user: OrganizationUser) => {
    return user.roles?.map(role => role.name) || [];
  };

  const handleUserClick = (user: OrganizationUser) => {
    setSelectedUser(user);
    setShowRolesModal(true);
  };

  const isSeededRole = (roleName: string) => {
    return seededRoles.includes(roleName);
  };


  const handleRemoveRole = async (userId: number, roleId: number) => {
    try {
      // This endpoint would need to be created in the backend
      const response = await processRequestAuth("delete", `${API_ENDPOINTS.REMOVE_ROLE_FROM_USER}/${userId}/${roleId}`);

      if (response && typeof response === 'object' && 'success' in response) {
        if (response.success) {
          toast.success("Role removed successfully");
          fetchOrganizationUsers(); // Refresh the list
        } else {
          toast.error(response.message || "Failed to remove role");
        }
      }
    } catch (error) {
      console.error("Error removing role:", error);
      toast.error("Failed to remove role");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500 border-blue-200"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger 
            value="users" 
            className="data-[state=active]:bg-[#003465] data-[state=active]:text-white data-[state=active]:font-semibold"
          >
            Users & Roles
          </TabsTrigger>
          <TabsTrigger 
            value="permissions"
            className="data-[state=active]:bg-[#003465] data-[state=active]:text-white data-[state=active]:font-semibold"
          >
            Access Control
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          {/* Organization Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#003465]" />
                Organization Settings
              </CardTitle>
              <CardDescription>
                Manage organization account settings and user access controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <h4 className="font-medium text-sm text-gray-600">Organization Status</h4>
                    <Badge variant="default" className="bg-green-100 text-green-800 mt-1">
                      Active
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <h4 className="font-medium text-sm text-gray-600">Organization ID</h4>
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm mt-1 block">{slug}</code>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <h4 className="font-medium text-sm text-gray-600">Total Users</h4>
                    <Badge variant="outline" className="text-lg font-semibold mt-1">
                      {organizationUsers.length}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Management */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#003465]" />
                    Organization Admin
                  </CardTitle>
                  <CardDescription>
                    Manage Admin and their role assignments within this organization
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6">
                {filteredOrganizationUsers.map((user) => (
                  <Card
                    key={user.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleUserClick(user)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-[#003465]" />
                          <CardTitle className="text-lg">{user.firstname} {user.lastname}</CardTitle>
                        </div>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm text-gray-600">
                        {user.email}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Roles:</span>
                          <span className="font-medium">{getRoleCount(user)}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Department:</span>
                          <span className="text-xs text-gray-500">
                            {user.department?.name || "Not assigned"}
                          </span>
                        </div>

                        {getRoleNames(user).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {getRoleNames(user).slice(0, 2).map((roleName) => (
                              <Badge key={roleName} variant="outline" className="text-xs">
                                {roleName}
                              </Badge>
                            ))}
                            {getRoleNames(user).length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{getRoleNames(user).length - 2} more
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUserClick(user);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Roles
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredOrganizationUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? "Try adjusting your search terms" : "This organization has no users yet"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Roles Modal */}
          {showRolesModal && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <User className="w-6 h-6 text-[#003465]" />
                      {selectedUser.firstname} {selectedUser.lastname} - Roles
                    </h2>
                    <p className="text-gray-600 mt-1">{selectedUser.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRolesModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Total Roles: {selectedUser.roles?.length || 0}
                    </span>
                    <Badge variant={selectedUser.is_active ? "default" : "secondary"}>
                      {selectedUser.is_active ? "Active User" : "Inactive User"}
                    </Badge>
                  </div>

                  {selectedUser.roles && selectedUser.roles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.roles.map((role) => (
                        <div
                          key={role.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-[#003465]" />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{role.name}</h4>
                              <p className="text-sm text-gray-600">{role.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={role.is_active ? "default" : "secondary"} className="text-xs">
                                  {role.is_active ? "Active" : "Inactive"}
                                </Badge>
                                {isSeededRole(role.name) && (
                                  <Badge variant="outline" className="text-xs">
                                    System
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {!isSeededRole(role.name) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveRole(selectedUser.id, role.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">No roles assigned to this user</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowRolesModal(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Assign Roles modal has been removed – admin roles are now managed exclusively on the Admin page */}
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsManager slug={slug} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
