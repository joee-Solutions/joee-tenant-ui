"use client";
import React, { useState, useEffect, ChangeEventHandler } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Key,
  Eye,
  Filter,
  X,
  Shield,
  Users
} from "lucide-react";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";
import { Permission, Role } from "@/lib/types";
import { useRouter } from "next/navigation";
import { ChangeHandler } from "react-hook-form";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const router = useRouter();

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await processRequestAuth("get", API_ENDPOINTS.GET_ALL_PERMISSIONS);
      
      if (response && typeof response === 'object' && 'success' in response) {
        if (response.success && response.data) {
          setPermissions(Array.isArray(response.data) ? response.data : []);
        } else {
          console.error("Failed to fetch permissions:", response.message);
          toast.error(response.message || "Failed to load permissions");
        }
      } else {
        setPermissions(response?.data || response || []);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast.error("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await processRequestAuth("get", `${API_ENDPOINTS.GET_ALL_ROLES}?permission=true`);
      
      if (response && typeof response === 'object' && 'success' in response) {
        if (response.success && response.data) {
          setRoles(Array.isArray(response.data) ? response.data : []);
        }
      } else {
        setRoles(response?.data?.roles || response || []);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  useEffect(() => {
    fetchPermissions();
    fetchRoles();
  }, []);

  const filteredPermissions = permissions.filter(permission =>
    (permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     permission.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (categoryFilter === "" || permission.category === categoryFilter)
  );

  const categories = [...new Set(permissions.map(p => p.category))];

  const getPermissionIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'user':
        return '👤';
      case 'tenant':
        return '🏢';
      case 'department':
        return '🏥';
      case 'patient':
        return '👨‍⚕️';
      case 'appointment':
        return '📅';
      case 'employee':
        return '👷';
      case 'record':
        return '📋';
      case 'training_guide':
        return '📚';
      case 'notification':
        return '🔔';
      case 'system_settings':
        return '⚙️';
      case 'backup':
        return '💾';
      case 'audit_log':
        return '📊';
      case 'support':
        return '🆘';
      case 'profile':
        return '👤';
      case 'dashboard':
        return '📈';
      default:
        return '🔑';
    }
  };

  const getRolesWithPermission = (permissionId: number) => {
    return roles.filter(role => 
      role.permissions?.some(p => p.id === permissionId)
    );
  };

  const handlePermissionClick = (permission: Permission) => {
    setSelectedPermission(permission);
    setShowRolesModal(true);
  };

  if (loading) {
    return (
      <div className="px-12 pb-20 flex flex-col gap-[30px] w-full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500 border-blue-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-12 pb-20 flex flex-col gap-[30px] w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permissions Management</h1>
          <p className="text-gray-600 mt-1">View system permissions and access controls</p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value) as any}
            className="pl-10"
            name="searchTerm"
            onBlur={(e) => setSearchTerm(e.target.value) as any}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003465] focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPermissions.map((permission) => {
          const rolesWithPermission = getRolesWithPermission(permission.id);
          return (
            <Card key={permission.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getPermissionIcon(permission.category)}</span>
                    <CardTitle className="text-lg">{permission.name}</CardTitle>
                  </div>
                  <Badge variant={permission.is_active ? "default" : "secondary"}>
                    {permission.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription className="text-sm text-gray-600">
                  {permission.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Category:</span>
                    <Badge variant="outline" className="text-xs">
                      {permission.category}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Assigned to:</span>
                    <span className="font-medium">{rolesWithPermission.length} role(s)</span>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePermissionClick(permission);
                      }}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      View Roles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPermissions.length === 0 && (
        <div className="text-center py-12">
          <Key className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No permissions found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || categoryFilter ? "Try adjusting your search terms or filters" : "No permissions available"}
          </p>
        </div>
      )}

      {/* Roles Modal */}
      {showRolesModal && selectedPermission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">{getPermissionIcon(selectedPermission.category)}</span>
                  {selectedPermission.name} - Assigned Roles
                </h2>
                <p className="text-gray-600 mt-1">{selectedPermission.description}</p>
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
                  Total Roles: {getRolesWithPermission(selectedPermission.id).length}
                </span>
                <Badge variant={selectedPermission.is_active ? "default" : "secondary"}>
                  {selectedPermission.is_active ? "Active Permission" : "Inactive Permission"}
                </Badge>
              </div>

              {getRolesWithPermission(selectedPermission.id).length > 0 ? (
                <div className="space-y-3">
                  {getRolesWithPermission(selectedPermission.id).map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <Shield className="w-5 h-5 text-[#003465]" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{role.name}</h4>
                        <p className="text-sm text-gray-600">{role.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={role.is_active ? "default" : "secondary"} className="text-xs">
                            {role.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {role.permissions?.length || 0} permissions
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No roles assigned to this permission</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t">
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
    </div>
  );
} 