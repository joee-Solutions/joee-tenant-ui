"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";
import { Role } from "@/lib/types";

interface Permission {
  key: string;
  name: string;
  description: string;
}

interface Category {
  key: string;
  title: string;
  permissions: Permission[];
}

const roles = [
  { key: "super_admin", label: "Super Admin" },
  { key: "admin", label: "Admin" },
  { key: "tenant_admin", label: "Tenant Admin" },
  { key: "tenant_user", label: "Tenant User" },
];

const permissionCategories: Category[] = [
  {
    key: "appointment_management",
    title: "Appointment Management",
    permissions: [
      {
        key: "create_appointment",
        name: "create_appointment",
        description: "Authorises the scheduling and initiation of new calendar entries for consultations.",
      },
      {
        key: "manage_appointment",
        name: "manage_appointment / update_appointment",
        description: "Provides full administrative control to reschedule, modify details, or oversee all active scheduled events.",
      },
      {
        key: "delete_appointment",
        name: "delete_appointment",
        description: "Grants authority to remove or cancel scheduled events from the system calendar.",
      },
    ],
  },
  {
    key: "backup_data_security",
    title: "Backup & Data Security",
    permissions: [
      {
        key: "create_backup",
        name: "create_backup",
        description: "Allows the manual initiation of a system data snapshot to ensure redundancy.",
      },
      {
        key: "manage_backup",
        name: "manage_backup",
        description: "Allows for the configuration, scheduling, oversight, and updating of automated data protection routines.",
      },
      {
        key: "restore_backup",
        name: "restore_backup",
        description: "Grants the critical authority to roll back the system to a previous state using saved data snapshots.",
      },
      {
        key: "delete_backup",
        name: "delete_backup",
        description: "Allows for the permanent removal of old or redundant data snapshot files.",
      },
    ],
  },
  {
    key: "department_organisation",
    title: "Department & Organisation",
    permissions: [
      {
        key: "create_department",
        name: "create_department",
        description: "Grants the ability to define and add new organisational departments to the system.",
      },
      {
        key: "manage_department",
        name: "manage_department / update_department",
        description: "Grants authority to restructure, rename, edit metadata, or oversee the settings of existing organisational units.",
      },
      {
        key: "delete_department",
        name: "delete_department",
        description: "Permits the removal of an organisational department from the system hierarchy.",
      },
    ],
  },
  {
    key: "roles_permissions",
    title: "Roles & Permissions",
    permissions: [
      {
        key: "create_role",
        name: "create_role",
        description: "Enables the creation of new titles or user categories to which permissions can be assigned.",
      },
      {
        key: "manage_role",
        name: "manage_role / update_role",
        description: "Allows for the modification of existing roles, including renaming, changing scope, or bundling specific permissions.",
      },
      {
        key: "delete_role",
        name: "delete_role",
        description: "Enables the removal of a user role, provided it is no longer assigned to active users.",
      },
      {
        key: "create_permission",
        name: "create_permission",
        description: "Allows for the definition of new access rights or security rules within the application.",
      },
      {
        key: "manage_permission",
        name: "manage_permission / update_permission",
        description: "Authorises the assignment, adjustment, and correction of specific access rights for existing roles.",
      },
      {
        key: "delete_permission",
        name: "delete_permission",
        description: "Permits the deletion of specific permissions that are no longer required.",
      },
    ],
  },
  {
    key: "tenant_administration",
    title: "Tenant & Multi-Client Administration",
    permissions: [
      {
        key: "create_tenant",
        name: "create_tenant",
        description: "Grants the high-level ability to set up a new organisation environment.",
      },
      {
        key: "manage_tenant",
        name: "manage_tenant / update_tenant",
        description: "Provides the ability to oversee, configure, and modify organisation profiles and specific settings.",
      },
      {
        key: "delete_tenant",
        name: "delete_tenant",
        description: "Grants the high-level authority to completely remove an organisation and its data.",
      },
      {
        key: "create_tenant_user",
        name: "create_tenant_user",
        description: "Allows for the addition of new users specifically assigned to a particular tenant environment.",
      },
      {
        key: "manage_tenant_user",
        name: "manage_tenant_user / update_tenant_user",
        description: "Allows for the administration and editing of user accounts, profiles, passwords, and statuses within a specific tenant.",
      },
      {
        key: "delete_tenant_user",
        name: "delete_tenant_user",
        description: "Permits the removal of a specific user's access within a tenant environment.",
      },
    ],
  },
  {
    key: "employee_staff",
    title: "Employee & Staff Records",
    permissions: [
      {
        key: "create_employee",
        name: "create_employee",
        description: "Enables registration of new staff members and their associated personnel files.",
      },
      {
        key: "manage_employee",
        name: "manage_employee / update_employee",
        description: "Enables full administrative oversight and modification of staff records, including contact info and job titles.",
      },
      {
        key: "delete_employee",
        name: "delete_employee",
        description: "Authorises the removal of a staff member's record from the active directory.",
      },
    ],
  },
  {
    key: "patient_information",
    title: "Patient Information",
    permissions: [
      {
        key: "create_patient",
        name: "create_patient",
        description: "Permits the onboarding and registration of new clients into the medical or client database.",
      },
      {
        key: "manage_patient",
        name: "manage_patient / update_patient",
        description: "Provides full access to oversee, organise, and update existing patient files and sensitive demographic data.",
      },
      {
        key: "delete_patient",
        name: "delete_patient",
        description: "Allows for the permanent removal of a patient's profile and history from the database.",
      },
    ],
  },
  {
    key: "user_profiles",
    title: "User Profiles & Accounts",
    permissions: [
      {
        key: "create_user",
        name: "create_user",
        description: "Enables the general creation of new login credentials and basic account profiles.",
      },
      {
        key: "manage_user",
        name: "manage_user / update_user",
        description: "Provides comprehensive control over all user accounts, including security resets, settings, and profile modifications.",
      },
      {
        key: "delete_user",
        name: "delete_user",
        description: "Enables the permanent deletion of a user account and its associated access.",
      },
      {
        key: "view_profile",
        name: "view_profile",
        description: "Permits the viewing of user account details and personal identification information.",
      },
      {
        key: "update_profile",
        name: "update_profile",
        description: "Permits a user to modify their own personal account details and preferences.",
      },
    ],
  },
  {
    key: "system_audit",
    title: "System, Audit & Analytics",
    permissions: [
      {
        key: "manage_system",
        name: "manage_system / manage_system_settings",
        description: "Grants high-level administrative access to core platform functions, metrics, and global configuration protocols.",
      },
      {
        key: "view_audit_log",
        name: "view_audit_log",
        description: "Permits access to the chronological record of all system activities and user actions for security auditing.",
      },
      {
        key: "view_dashboard",
        name: "view_dashboard",
        description: "Grants access to visual data summaries and real-time performance analytics.",
      },
    ],
  },
  {
    key: "records_logging",
    title: "Records & Logging",
    permissions: [
      {
        key: "create_record",
        name: "create_record",
        description: "Authorises the entry of new primary data points, such as clinical notes or transaction logs.",
      },
      {
        key: "manage_record",
        name: "manage_record / update_record",
        description: "Permits the administrative oversight, organisation, and correction of historical data entries and logs.",
      },
      {
        key: "delete_record",
        name: "delete_record",
        description: "Authorises the permanent removal of specific data entries or logged items.",
      },
    ],
  },
  {
    key: "notifications_communications",
    title: "Notifications & Communications",
    permissions: [
      {
        key: "manage_notification",
        name: "manage_notification",
        description: "Allows for the configuration and updating of system-wide alerts, triggers, and messaging rules.",
      },
      {
        key: "send_notification",
        name: "send_notification",
        description: "Permits the manual dispatch of alerts or messages to specific users or groups.",
      },
      {
        key: "view_notification",
        name: "view_notification",
        description: "Allows the user to see and read system alerts and incoming messages.",
      },
      {
        key: "delete_notification",
        name: "delete_notification",
        description: "Enables the clearing or permanent removal of specific system alerts and messages.",
      },
    ],
  },
  {
    key: "training_support",
    title: "Training & Support",
    permissions: [
      {
        key: "create_training_guide",
        name: "create_training_guide",
        description: "Permits the authoring and publication of new instructional materials for system users.",
      },
      {
        key: "manage_training_guide",
        name: "manage_training_guide / update_training_guide",
        description: "Authorises the editing, revision, archiving, and organisation of the instructional guide library.",
      },
      {
        key: "delete_training_guide",
        name: "delete_training_guide",
        description: "Authorises the permanent removal of instructional materials from the system library.",
      },
      {
        key: "manage_support",
        name: "manage_support",
        description: "Enables the oversight and management of technical assistance workflows.",
      },
      {
        key: "view_support",
        name: "view_support",
        description: "Enables access to the support portal to view the status of help requests or documentation.",
      },
    ],
  },
];

// Default permissions based on Excel data
const defaultPermissions: Record<string, Record<string, boolean>> = {
  appointment_management: {
    super_admin: true,
    admin: true,
    tenant_admin: true,
    tenant_user: true,
  },
  backup_data_security: {
    super_admin: true,
    admin: false,
    tenant_admin: false,
    tenant_user: false,
  },
  department_organisation: {
    super_admin: true,
    admin: true,
    tenant_admin: true,
    tenant_user: false,
  },
  roles_permissions: {
    super_admin: true,
    admin: true,
    tenant_admin: true,
    tenant_user: false,
  },
  tenant_administration: {
    super_admin: true,
    admin: true,
    tenant_admin: true,
    tenant_user: false,
  },
  employee_staff: {
    super_admin: true,
    admin: true,
    tenant_admin: true,
    tenant_user: false,
  },
  patient_information: {
    super_admin: true,
    admin: true,
    tenant_admin: true,
    tenant_user: false,
  },
  user_profiles: {
    super_admin: true,
    admin: true,
    tenant_admin: true,
    tenant_user: false,
  },
  system_audit: {
    super_admin: true,
    admin: true,
    tenant_admin: true,
    tenant_user: false,
  },
  records_logging: {
    super_admin: true,
    admin: true,
    tenant_admin: true,
    tenant_user: false,
  },
  notifications_communications: {
    super_admin: true,
    admin: true,
    tenant_admin: false,
    tenant_user: false,
  },
  training_support: {
    super_admin: true,
    admin: true,
    tenant_admin: false,
    tenant_user: false,
  },
};

export default function AccessControlManager({ slug }: { slug: string }) {
  const [rolesData, setRolesData] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(() => {
    // Initialize with default permissions
    const initial: Record<string, Record<string, boolean>> = {};
    permissionCategories.forEach((category) => {
      category.permissions.forEach((permission) => {
        if (!initial[permission.key]) {
          initial[permission.key] = {};
        }
        roles.forEach((role) => {
          // Use category-level defaults, or default to false
          const categoryDefault = defaultPermissions[category.key]?.[role.key] || false;
          initial[permission.key][role.key] = categoryDefault;
        });
      });
    });
    return initial;
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(permissionCategories[0].key);

  // Fetch roles to get their IDs
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true);
        const response = await processRequestAuth("get", `${API_ENDPOINTS.GET_ALL_ROLES}?permission=true`);
        
        if (response && typeof response === 'object' && 'success' in response) {
          if (response.success && response.data) {
            const fetchedRoles = Array.isArray(response.data) ? response.data : [];
            setRolesData(fetchedRoles);
            
            // Load existing permissions from roles if available
            if (fetchedRoles.length > 0) {
              const loadedPermissions: Record<string, Record<string, boolean>> = {};
              
              fetchedRoles.forEach((role: Role) => {
                // Map role name to role key
                const roleNameLower = role.name.toLowerCase().replace(/\s+/g, '_');
                let mappedRoleKey = '';
                
                if (roleNameLower.includes('super') && roleNameLower.includes('admin')) {
                  mappedRoleKey = 'super_admin';
                } else if (roleNameLower === 'admin' || roleNameLower.includes('admin') && !roleNameLower.includes('super') && !roleNameLower.includes('tenant')) {
                  mappedRoleKey = 'admin';
                } else if (roleNameLower.includes('tenant') && roleNameLower.includes('admin')) {
                  mappedRoleKey = 'tenant_admin';
                } else if (roleNameLower.includes('tenant') && roleNameLower.includes('user')) {
                  mappedRoleKey = 'tenant_user';
                } else {
                  // Try direct match
                  const directMatch = roles.find(r => r.key === roleNameLower);
                  mappedRoleKey = directMatch ? directMatch.key : '';
                }
                
                if (!mappedRoleKey) return;
                
                // Load permissions from role
                if (role.permissions && Array.isArray(role.permissions)) {
                  role.permissions.forEach((perm: any) => {
                    const permName = perm.name || perm.key || String(perm);
                    // Find matching permission key in our categories
                    permissionCategories.forEach((category) => {
                      category.permissions.forEach((p) => {
                        // Check if permission name matches (handle cases like "manage_appointment / update_appointment")
                        const permNames = p.name.split('/').map(n => n.trim().toLowerCase());
                        if (permNames.some(n => n === permName.toLowerCase() || permName.toLowerCase().includes(n))) {
                          if (!loadedPermissions[p.key]) {
                            loadedPermissions[p.key] = {};
                          }
                          loadedPermissions[p.key][mappedRoleKey] = true;
                        }
                      });
                    });
                  });
                }
              });
              
              // Merge loaded permissions with defaults
              setPermissions((prev) => {
                const merged = { ...prev };
                Object.keys(loadedPermissions).forEach((permKey) => {
                  if (merged[permKey]) {
                    Object.keys(loadedPermissions[permKey]).forEach((roleKey) => {
                      merged[permKey][roleKey] = loadedPermissions[permKey][roleKey];
                    });
                  }
                });
                return merged;
              });
            }
          }
        } else {
          setRolesData(response?.data?.roles || response || []);
        }
      } catch (error) {
        console.error("Error fetching roles:", error);
        toast.error("Failed to load roles");
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  const handlePermissionChange = (
    permissionKey: string,
    roleKey: string,
    value: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [permissionKey]: {
        ...prev[permissionKey],
        [roleKey]: value,
      },
    }));
  };

  const handleSaveChanges = async () => {
    try {
      setLoading(true);
      
      // Map role keys to role names for API
      const roleNameMap: Record<string, string> = {
        'super_admin': 'Super_Admin',
        'admin': 'Admin',
        'tenant_admin': 'Tenant_Admin',
        'tenant_user': 'Tenant_User',
      };
      
      // For each role, collect all enabled permissions and update
      const updatePromises = roles.map(async (role) => {
        // Find the role in fetched roles data
        const roleData = rolesData.find((r: Role) => 
          r.name === roleNameMap[role.key] || 
          r.name.toLowerCase().replace(/_/g, '_') === role.key ||
          r.name.toLowerCase().replace(/\s/g, '_') === role.key
        );
        
        if (!roleData || !roleData.id) {
          console.warn(`Role not found: ${role.key}`);
          return;
        }
        
        // Collect all permissions enabled for this role
        const enabledPermissions: string[] = [];
        Object.keys(permissions).forEach((permissionKey) => {
          if (permissions[permissionKey]?.[role.key]) {
            // Get the permission name from the category
            const category = permissionCategories.find(cat => 
              cat.permissions.some(p => p.key === permissionKey)
            );
            if (category) {
              const permission = category.permissions.find(p => p.key === permissionKey);
              if (permission) {
                // Use the permission name (which may contain multiple names separated by /)
                const permissionNames = permission.name.split('/').map(n => n.trim());
                enabledPermissions.push(...permissionNames);
              }
            }
          }
        });
        
        // Update the role with new permissions
        try {
          await processRequestAuth("put", API_ENDPOINTS.UPDATE_ROLE(roleData.id), {
            permissions: enabledPermissions,
          });
        } catch (error) {
          console.error(`Error updating role ${role.label}:`, error);
          throw error;
        }
      });
      
      await Promise.all(updatePromises);
      
      toast.success("Access control permissions updated successfully!");
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Failed to save permissions");
    } finally {
      setLoading(false);
    }
  };

  if (loadingRoles) {
    return (
      <div className="w-full max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Loading roles and permissions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-semibold">Access Control</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Manage permissions for different user roles across all system modules
          </p>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b relative">
              <TabsList className="h-auto bg-gray-50 p-1 w-full justify-start flex-wrap gap-2 pb-1 rounded-t-lg">
                {permissionCategories.map((category) => (
                  <TabsTrigger
                    key={category.key}
                    value={category.key}
                    className="px-4 py-3 text-xs sm:text-sm font-medium rounded-md bg-gray-100 data-[state=active]:bg-[#003465] data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-200 whitespace-nowrap transition-all"
                  >
                    {category.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {permissionCategories.map((category) => (
              <TabsContent key={category.key} value={category.key} className="p-6 m-0">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {category.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Manage permissions for {category.title.toLowerCase()} operations
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700 border border-gray-200 min-w-[300px]">
                          Permission
                        </th>
                        {roles.map((role) => (
                          <th
                            key={role.key}
                            className="text-center py-3 px-4 font-semibold text-gray-700 border border-gray-200 w-32"
                          >
                            {role.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {category.permissions.map((permission) => (
                        <tr
                          key={permission.key}
                          className="hover:bg-gray-50 border-b border-gray-200"
                        >
                          <td className="py-4 px-4 border border-gray-200">
                            <div>
                              <div className="font-medium text-gray-900 mb-1">
                                {permission.name}
                              </div>
                              <div className="text-xs text-gray-600">
                                {permission.description}
                              </div>
                            </div>
                          </td>
                          {roles.map((role) => (
                            <td
                              key={role.key}
                              className="py-4 px-4 text-center border border-gray-200"
                            >
                              <Checkbox
                                checked={permissions[permission.key]?.[role.key] || false}
                                onCheckedChange={(checked) =>
                                  handlePermissionChange(
                                    permission.key,
                                    role.key,
                                    !!checked
                                  )
                                }
                                className="mx-auto"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 p-6 border-t bg-gray-50">
            <Button
              variant="outline"
              onClick={() => {
                // Reset to defaults
                const reset: Record<string, Record<string, boolean>> = {};
                permissionCategories.forEach((category) => {
                  category.permissions.forEach((permission) => {
                    if (!reset[permission.key]) {
                      reset[permission.key] = {};
                    }
                    roles.forEach((role) => {
                      const categoryDefault = defaultPermissions[category.key]?.[role.key] || false;
                      reset[permission.key][role.key] = categoryDefault;
                    });
                  });
                });
                setPermissions(reset);
                toast.info("Permissions reset to defaults");
              }}
              className="px-6"
            >
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={loading}
              className="px-8 bg-[#003465] hover:bg-[#00254a] text-white"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

