import type { AdminUser } from "@/lib/types";
import { SUPER_ADMIN_DELETE_MESSAGE } from "@/framework/api-errors";

export { SUPER_ADMIN_DELETE_MESSAGE };

function normalizeRoleToken(role: string): string {
  return role.toLowerCase().replace(/[\s-]+/g, "_");
}

export function isSuperAdminAccount(
  admin: AdminUser | null | undefined
): boolean {
  if (!admin) return false;

  const roleStrings: string[] = [];
  if (Array.isArray(admin.roles)) {
    roleStrings.push(...admin.roles.map(String));
  }
  const singleRole = (admin as { role?: string }).role;
  if (singleRole) roleStrings.push(String(singleRole));

  return roleStrings.some((role) => {
    const normalized = normalizeRoleToken(role);
    return (
      normalized === "super_admin" ||
      normalized === "superadmin" ||
      normalized.includes("super_admin")
    );
  });
}
