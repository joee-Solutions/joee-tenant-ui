"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/Checkbox";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";

interface Permission {
  id: number;
  name: string;
  description?: string;
  category?: string;
}

interface AccountType {
  id: string;
  name: string;
  permissions: {
    [key: string]: {
      read: boolean;
      list: boolean;
      create: boolean;
      delete: boolean;
    };
  };
}

const permissionCategories = [
  { key: 'departments', label: 'Departments' },
  { key: 'employees', label: 'Employees' },
  { key: 'patients', label: 'Patients' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'medical_notes', label: 'Medical notes' },
  { key: 'medical_records', label: 'Medical records' },
  { key: 'schedules', label: 'Schedules' },
  { key: 'prescriptions', label: 'Prescriptions' },
  { key: 'notifications', label: 'Notifications' },
];

export default function PermissionsManager({ slug }: { slug: string }) {
  const [accountTypes, setAccountTypes] = useState<AccountType[]>([
    {
      id: 'admin',
      name: 'Admin Organization Account',
      permissions: {}
    },
    {
      id: 'create',
      name: 'Create Organization Account', 
      permissions: {}
    },
    {
      id: 'role_permission',
      name: 'Role Permission Account',
      permissions: {}
    }
  ]);
  const [loading, setLoading] = useState(false);

  // Initialize default permissions
  useEffect(() => {
    const initializePermissions = () => {
      const updatedAccountTypes = accountTypes.map(accountType => {
        const permissions: any = {};
        
        permissionCategories.forEach(category => {
          permissions[category.key] = {
            read: accountType.id === 'admin', // Admin has read access by default
            list: accountType.id === 'admin', // Admin has list access by default
            create: false,
            delete: false
          };
        });

        return {
          ...accountType,
          permissions
        };
      });

      setAccountTypes(updatedAccountTypes);
    };

    initializePermissions();
  }, []);

  const handlePermissionChange = (
    accountTypeId: string, 
    category: string, 
    permissionType: 'read' | 'list' | 'create' | 'delete',
    value: boolean
  ) => {
    setAccountTypes(prev => 
      prev.map(accountType => {
        if (accountType.id === accountTypeId) {
          return {
            ...accountType,
            permissions: {
              ...accountType.permissions,
              [category]: {
                ...accountType.permissions[category],
                [permissionType]: value
              }
            }
          };
        }
        return accountType;
      })
    );
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      
      // Here you would make API calls to save the permission changes
      // const response = await processRequestAuth("put", API_ENDPOINTS.UPDATE_ORGANIZATION_PERMISSIONS(slug), {
      //   accountTypes
      // });
      
      toast.success("Permissions updated successfully");
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Failed to save permissions");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original state or close modal
    toast.info("Changes cancelled");
  };


  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card>
        <CardHeader className="border-b">
            <CardTitle className="text-xl font-semibold">Access Control</CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {/* Show all account types content without tabs */}
                {accountTypes.map((accountType) => (
            <div key={accountType.id} className="border-b last:border-b-0">
                <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">{accountType.name}</h3>

                  {/* Permissions Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Module</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-700 w-20">Read</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-700 w-20">List</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-700 w-20">Create</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-700 w-20">Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                      {permissionCategories.map((category) => {
                          const permissions = accountType.permissions[category.key];
                          
                          return (
                            <tr key={category.key} className="border-b hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="font-medium">{category.label}</span>
                                </div>
                              </td>
                              
                              {/* Read Permission */}
                              <td className="py-4 px-4 text-center">
                                <Checkbox
                                  checked={permissions?.read || false}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(accountType.id, category.key, 'read', !!checked)
                                  }
                                  className="mx-auto"
                                />
                              </td>
                              
                              {/* List Permission */}
                              <td className="py-4 px-4 text-center">
                                <Checkbox
                                  checked={permissions?.list || false}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(accountType.id, category.key, 'list', !!checked)
                                  }
                                  className="mx-auto"
                                />
                              </td>
                              
                              {/* Create Permission */}
                              <td className="py-4 px-4 text-center">
                                <Checkbox
                                  checked={permissions?.create || false}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(accountType.id, category.key, 'create', !!checked)
                                  }
                                  className="mx-auto"
                                />
                              </td>
                              
                              {/* Delete Permission */}
                              <td className="py-4 px-4 text-center">
                                <Checkbox
                                  checked={permissions?.delete || false}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(accountType.id, category.key, 'delete', !!checked)
                                  }
                                  className="mx-auto"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
              </div>
            </div>
          ))}

                  {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8 p-6 border-t">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="px-8 py-2 border-red-500 text-red-500 hover:bg-red-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveChanges}
                      disabled={loading}
                      className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
        </CardContent>
      </Card>
    </div>
  );
}
