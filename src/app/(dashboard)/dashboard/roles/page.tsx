"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield,
  Users,
  Eye,
  EyeOff,
  X,
  Key
} from "lucide-react";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";
import { Role, Permission } from "@/lib/types";
import { useRouter } from "next/navigation";
import RoleCard from "@/components/shared/RoleCard";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const router = useRouter();

  // Define seeded/default roles that should not be editable
  const seededRoles = ['Super_Admin', 'Admin', 'Tenant_Admin', 'Tenant_User'];

  const fetchRoles = async () => {
    try {
      setLoading(true);
      // Fetch roles with permissions included
      const response = await processRequestAuth("get", `${API_ENDPOINTS.GET_ALL_ROLES}?permission=true`);
      
      if (response && typeof response === 'object' && 'success' in response) {
        if (response.success && response.data) {
          setRoles(Array.isArray(response.data) ? response.data : []);
        } else {
          console.error("Failed to fetch roles:", response.message);
          toast.error(response.message || "Failed to load roles");
        }
      } else {
        setRoles(response?.data?.roles || response || []);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await processRequestAuth("get", API_ENDPOINTS.GET_ALL_PERMISSIONS);
      
      if (response && typeof response === 'object' && 'success' in response) {
        if (response.success && response.data) {
          setPermissions(Array.isArray(response.data) ? response.data : []);
        }
      } else {
        setPermissions(response?.data || response || []);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleRoleClick = (role: Role) => {
    setSelectedRole(role);
    setShowPermissionsModal(true);
  };

  const isSeededRole = (roleName: string) => {
    return seededRoles.includes(roleName);
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Roles Management</h1>
          <p className="text-gray-600 mt-1">Manage system roles and their permissions</p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/roles/create")}
          className="bg-[#003465] text-white hover:bg-[#002a52] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Role
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            onViewPermissions={handleRoleClick}
            onEdit={(role) => router.push(`/dashboard/roles/${role.id}/edit`)}
            isSeeded={isSeededRole(role.name)}
          />
        ))}
      </div>

      {filteredRoles.length === 0 && (
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No roles found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? "Try adjusting your search terms" : "Get started by creating your first role"}
          </p>
          {!searchTerm && (
            <Button
              onClick={() => router.push("/dashboard/roles/create")}
              className="bg-[#003465] text-white hover:bg-[#002a52]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Role
            </Button>
          )}
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-[#003465]" />
                  {selectedRole.name} - Permissions
                </h2>
                <p className="text-gray-600 mt-1">{selectedRole.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPermissionsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Total Permissions: {selectedRole.permissions?.length || 0}
                </span>
                <div className="flex gap-2">
                  <Badge variant={selectedRole.is_active ? "default" : "secondary"}>
                    {selectedRole.is_active ? "Active Role" : "Inactive Role"}
                  </Badge>
                  {isSeededRole(selectedRole.name) && (
                    <Badge variant="outline" className="text-xs">
                      System Role
                    </Badge>
                  )}
                </div>
              </div>

              {selectedRole.permissions && selectedRole.permissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedRole.permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <span className="text-2xl">
                        {getPermissionIcon(permission.category)}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{permission.name}</h4>
                        <p className="text-sm text-gray-600">{permission.description}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {permission.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No permissions assigned to this role</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowPermissionsModal(false)}
              >
                Close
              </Button>
              {!isSeededRole(selectedRole.name) && (
                <Button
                  onClick={() => {
                    setShowPermissionsModal(false);
                    router.push(`/dashboard/roles/${selectedRole.id}/edit`);
                  }}
                  className="bg-[#003465] text-white hover:bg-[#002a52]"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Role
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 