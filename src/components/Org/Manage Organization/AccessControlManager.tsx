"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/Checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";

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
      // TODO: Implement API call to save permissions
      // await processRequestAuth("put", API_ENDPOINTS.UPDATE_ORGANIZATION_PERMISSIONS(slug), {
      //   permissions
      // });
      
      toast.success("Permissions updated successfully");
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Failed to save permissions");
    } finally {
      setLoading(false);
    }
  };

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
            <div className="border-b overflow-x-auto relative">
              {/* Gradient overlay to indicate more tabs on the right */}
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white via-white to-transparent pointer-events-none z-10"></div>
              {/* Scroll indicator on the left if scrolled */}
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white to-transparent pointer-events-none z-10 opacity-0 data-[scrolled]:opacity-100" data-scrolled={activeTab !== permissionCategories[0].key ? "true" : "false"}></div>
              <TabsList className="h-auto bg-gray-50 p-1 w-full justify-start flex-nowrap min-w-max pb-1 rounded-t-lg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {permissionCategories.map((category) => (
                  <TabsTrigger
                    key={category.key}
                    value={category.key}
                    className="px-4 py-3 text-xs sm:text-sm font-medium rounded-md bg-transparent data-[state=active]:bg-[#003465] data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white data-[state=inactive]:hover:bg-gray-100 whitespace-nowrap transition-all flex-shrink-0"
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

