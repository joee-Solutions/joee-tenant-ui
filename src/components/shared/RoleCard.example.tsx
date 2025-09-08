// Example usage of RoleCard component in different scenarios

import React from "react";
import RoleCard from "./RoleCard";
import { Role } from "@/lib/types";

// Mock role data for examples
const mockRole: Role = {
  id: 1,
  name: "Hospital Admin",
  description: "Full administrative access to hospital management functions",
  is_active: true,
  permissions: [
    { id: 1, name: "MANAGE_PATIENT", description: "Manage patient records", category: "patient" },
    { id: 2, name: "MANAGE_APPOINTMENT", description: "Manage appointments", category: "appointment" },
    { id: 3, name: "MANAGE_DEPARTMENT", description: "Manage departments", category: "department" },
  ]
};

export function RoleCardExamples() {
  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold">RoleCard Component Examples</h2>

      {/* 1. Default Role Card (for roles management page) */}
      <div>
        <h3 className="text-lg font-semibold mb-4">1. Default Role Card (Roles Management)</h3>
        <div className="max-w-sm">
          <RoleCard
            role={mockRole}
            onViewPermissions={(role) => console.log("View permissions for:", role.name)}
            onEdit={(role) => console.log("Edit role:", role.name)}
            isSeeded={false}
          />
        </div>
      </div>

      {/* 2. Compact Role Card */}
      <div>
        <h3 className="text-lg font-semibold mb-4">2. Compact Role Card</h3>
        <div className="max-w-sm">
          <RoleCard
            role={mockRole}
            variant="compact"
            onViewPermissions={(role) => console.log("View permissions for:", role.name)}
            isSeeded={false}
          />
        </div>
      </div>

      {/* 3. Selection Role Card (for role assignment) */}
      <div>
        <h3 className="text-lg font-semibold mb-4">3. Selection Role Card (Role Assignment)</h3>
        <div className="grid grid-cols-2 gap-4 max-w-2xl">
          <RoleCard
            role={mockRole}
            variant="selection"
            isSelected={false}
            showActions={false}
            onClick={(role) => console.log("Toggle selection for:", role.name)}
          />
          <RoleCard
            role={{...mockRole, name: "Doctor"}}
            variant="selection"
            isSelected={true}
            showActions={false}
            onClick={(role) => console.log("Toggle selection for:", role.name)}
          />
        </div>
      </div>

      {/* 4. System Role Card (read-only) */}
      <div>
        <h3 className="text-lg font-semibold mb-4">4. System Role Card (Read-only)</h3>
        <div className="max-w-sm">
          <RoleCard
            role={{...mockRole, name: "Super_Admin"}}
            onViewPermissions={(role) => console.log("View permissions for:", role.name)}
            isSeeded={true} // System role, no edit allowed
          />
        </div>
      </div>

      {/* 5. Role Card in Tenant Permission Context */}
      <div>
        <h3 className="text-lg font-semibold mb-4">5. Role Card with Tenant Restrictions</h3>
        <div className="max-w-sm">
          <RoleCard
            role={{
              ...mockRole,
              name: "Tenant Admin",
              description: "Administrative access within tenant permissions"
            }}
            onViewPermissions={(role) => console.log("View tenant-restricted permissions for:", role.name)}
            onEdit={(role) => console.log("Edit tenant role:", role.name)}
            isSeeded={false}
          />
        </div>
      </div>
    </div>
  );
}

// Usage Examples in Different Contexts:

/* 
1. In Roles Management Page:
<RoleCard
  role={role}
  onViewPermissions={handleViewPermissions}
  onEdit={(role) => router.push(`/dashboard/roles/${role.id}/edit`)}
  isSeeded={isSystemRole(role.name)}
/>

2. In Role Assignment Modal:
<RoleCard
  role={role}
  variant="selection"
  isSelected={selectedRoles.includes(role.id)}
  showActions={false}
  onClick={handleRoleToggle}
/>

3. In User Profile (showing assigned roles):
<RoleCard
  role={role}
  variant="compact"
  showActions={false}
  onClick={(role) => showRoleDetails(role)}
/>

4. In Tenant Permission Management:
<RoleCard
  role={role}
  onViewPermissions={(role) => showTenantRestrictedPermissions(role)}
  onEdit={(role) => editTenantRole(role)}
  isSeeded={isSystemRole(role.name)}
/>
*/
