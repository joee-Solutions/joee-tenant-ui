# Tenant Admin Sync Guide

## Quick Reference for Syncing Super Admin → Tenant Admin

This guide highlights the key differences and changes needed when adapting the Super Admin codebase for Tenant Admin.

---

## 1. API Endpoint Changes

### Super Admin Endpoints (Current)
```typescript
// Multi-tenant endpoints
GET_ALL_TENANTS: "/super/tenants/all"
GET_TENANT: "/super/tenants/${tenantId}"
TENANTS_PATIENTS: "/super/tenants/${tenantId}/patients"
TENANTS_APPOINTMENTS: "/super/tenants/${tenantId}/appointments"
TENANTS_EMPLOYEES: "/super/tenants/${tenantId}/employees"

// Admin management
GET_SUPER_ADMIN: "/management/super/admin/all"
ADD_SUPER_ADMIN: "/auth/super/register"
```

### Tenant Admin Endpoints (Expected)
```typescript
// Single tenant endpoints (tenant ID from auth context)
GET_TENANT: "/tenants/me" or "/tenants/current"
GET_PATIENTS: "/patients"  // Implicitly scoped to tenant
GET_APPOINTMENTS: "/appointments"  // Implicitly scoped to tenant
GET_EMPLOYEES: "/employees"  // Implicitly scoped to tenant

// Admin management (if tenant admin can manage their own admins)
GET_ADMINS: "/admins"  // Scoped to tenant
CREATE_ADMIN: "/admins"  // Scoped to tenant
```

**Action Required:**
- Update `src/framework/api-endpoints.ts` to remove `/super/` prefix
- Remove tenant ID parameters from endpoints (use auth context)
- Update authentication endpoints if different

---

## 2. Authentication Changes

### Current (Super Admin)
```typescript
// Login endpoint
LOGIN: "/auth/super/login"

// Token storage
Cookies.set("auth_token", token);
Cookies.set("customer", JSON.stringify(user));
```

### Expected (Tenant Admin)
```typescript
// Login endpoint (may differ)
LOGIN: "/auth/tenant/login" or "/auth/login"

// Token storage (same pattern, but user object includes tenant context)
Cookies.set("auth_token", token);
Cookies.set("customer", JSON.stringify(user)); // user.tenantId included
```

**Action Required:**
- Update login endpoint in `api-endpoints.ts`
- Ensure user object includes tenant context
- Update token refresh endpoint if different

---

## 3. Routing Structure Changes

### Current (Super Admin)
```
/dashboard/organization              # List all organizations
/dashboard/organization/[org]/patients    # Org-specific patients
/dashboard/organization/[org]/employees   # Org-specific employees
```

### Expected (Tenant Admin)
```
/dashboard                           # Main dashboard (tenant-scoped)
/dashboard/patients                  # Tenant's patients (no [org] param)
/dashboard/employees                 # Tenant's employees (no [org] param)
/dashboard/appointments              # Tenant's appointments
```

**Action Required:**
- Remove `[org]` dynamic route segments
- Simplify route structure
- Update navigation in `src/utils/navigation.ts`

---

## 4. Component Changes

### Components to Remove/Modify

1. **Remove:**
   - `src/app/(dashboard)/dashboard/organization/page.tsx` (organization list)
   - `src/app/(dashboard)/dashboard/organization/active/page.tsx`
   - `src/app/(dashboard)/dashboard/organization/inactive/page.tsx`
   - `src/app/(dashboard)/dashboard/organization/deactivated/page.tsx`
   - `src/components/dashboard/OrganizationList.tsx`
   - `src/components/dashboard/OrganizationStatus.tsx`
   - Multi-tenant selection components

2. **Modify:**
   - `src/app/(dashboard)/dashboard/page.tsx` - Remove organization stats, show tenant-specific stats
   - `src/components/shared/MainHeader.tsx` - Update search to be tenant-scoped
   - All components in `src/app/(dashboard)/dashboard/organization/[org]/` - Remove `[org]` param

3. **Keep (with modifications):**
   - Patient management components (remove tenant ID from URLs)
   - Employee management components (remove tenant ID from URLs)
   - Appointment management components (remove tenant ID from URLs)
   - Schedule management components (remove tenant ID from URLs)

---

## 5. Data Fetching Hooks Changes

### Current (Super Admin)
```typescript
// Multi-tenant hooks
useTenantsData()                    // Get all tenants
useTenantPatientsData(orgId)        // Get patients for specific tenant
useTenantUsersData(orgId)          // Get users for specific tenant
useAllUsersData()                   // Get all users across tenants
useAllPatientsData()                // Get all patients across tenants
```

### Expected (Tenant Admin)
```typescript
// Single tenant hooks (tenant from auth context)
useTenantData()                     // Get current tenant
usePatientsData()                   // Get tenant's patients
useUsersData()                      // Get tenant's users
useEmployeesData()                  // Get tenant's employees
```

**Action Required:**
- Update `src/hooks/swr.ts` to remove tenant ID parameters
- Use authenticated tenant context instead
- Remove multi-tenant hooks

---

## 6. State Management Changes

### Current (Super Admin)
```typescript
interface StoreState {
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
  };
}
```

### Expected (Tenant Admin)
```typescript
interface StoreState {
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string;
    tenantId: number;              // Add tenant ID
    tenant?: Tenant;                // Add tenant object
  };
  currentTenant?: Tenant;           // Current tenant context
}
```

**Action Required:**
- Update `src/contexts/stores/tenant-store.tsx` to include tenant context
- Initialize tenant from auth response
- Remove tenant selection logic

---

## 7. Dashboard Changes

### Current (Super Admin Dashboard)
- Shows stats for all tenants
- Organization list
- Multi-tenant statistics

### Expected (Tenant Admin Dashboard)
- Shows stats for current tenant only
- Tenant-specific charts and metrics
- No organization selection/switching

**Action Required:**
- Update `src/app/(dashboard)/dashboard/page.tsx`
- Remove organization-related stats
- Update chart data to be tenant-scoped
- Remove organization list component

---

## 8. Navigation Changes

### Current (Super Admin)
```typescript
{
  name: "Organization",
  children: [
    { title: "Organization", href: "/dashboard/organization" },
    { title: "Active", href: "/dashboard/organization/active" },
    { title: "Inactive", href: "/dashboard/organization/inactive" },
    { title: "Deactivated", href: "/dashboard/organization/deactivated" },
  ],
}
```

### Expected (Tenant Admin)
```typescript
// Remove organization section entirely
// Add direct links to tenant resources
{
  name: "Patients",
  href: "/dashboard/patients",
},
{
  name: "Employees",
  href: "/dashboard/employees",
},
{
  name: "Appointments",
  href: "/dashboard/appointments",
},
```

**Action Required:**
- Update `src/utils/navigation.ts`
- Remove organization-related navigation items
- Add direct tenant resource links

---

## 9. HTTP Client Changes

### Current (Super Admin)
```typescript
// Tenant ID extracted from URL or passed explicitly
const path = window.location.pathname;
const orgSlug = parts[3]; // Extract from URL
const tenantDomain = localStorage.getItem(`orgDomain:${orgSlug}`);
config.headers['x-tenant-id'] = tenantDomain;
```

### Expected (Tenant Admin)
```typescript
// Tenant ID from auth context
const tenantId = getTenantIdFromAuth(); // From token or store
config.headers['x-tenant-id'] = tenantId;
```

**Action Required:**
- Update `src/framework/https.ts` to get tenant ID from auth context
- Remove URL-based tenant extraction
- Simplify tenant header injection

---

## 10. Form Component Changes

### Current Pattern
```typescript
// Tenant ID passed as URL parameter
const { org } = useParams();
const tenantId = org;

// API call includes tenant ID
await processRequestAuth("post", 
  API_ENDPOINTS.CREATE_PATIENT(tenantId), 
  data
);
```

### Expected Pattern
```typescript
// Tenant ID from auth context
const tenantId = useTenantStore(state => state.state.user?.tenantId);

// API call uses tenant-scoped endpoint
await processRequestAuth("post", 
  API_ENDPOINTS.CREATE_PATIENT,  // No tenant ID param
  data
);
```

**Action Required:**
- Remove `[org]` from route parameters
- Update all form components to use tenant from context
- Update API endpoint calls

---

## 11. File Structure Changes

### Files to Remove
```
src/app/(dashboard)/dashboard/organization/
  - page.tsx
  - active/page.tsx
  - inactive/page.tsx
  - deactivated/page.tsx
  - [org]/layout.tsx (or modify to remove [org])
```

### Files to Modify
```
src/app/(dashboard)/dashboard/
  - page.tsx (dashboard stats)
  - organization/[org]/patients/page.tsx → patients/page.tsx
  - organization/[org]/employees/page.tsx → employees/page.tsx
  - organization/[org]/appointments/page.tsx → appointments/page.tsx
  - organization/[org]/schedules/page.tsx → schedules/page.tsx
```

---

## 12. Type Changes

### Current Types
```typescript
interface Tenant {
  id: number;
  name: string;
  // ... other fields
}

// Used in lists, selections
```

### Expected Types
```typescript
interface Tenant {
  id: number;
  name: string;
  // ... other fields
}

// Single tenant context, not a list
interface TenantContext {
  tenant: Tenant;
  isLoaded: boolean;
}
```

**Action Required:**
- Update types in `src/lib/types.ts`
- Remove multi-tenant list types where not needed
- Add tenant context types

---

## 13. Checklist for Migration

### Phase 1: Configuration
- [ ] Update `api-endpoints.ts` - Remove `/super/` prefix
- [ ] Update `site-config.ts` - Remove multi-tenant configs
- [ ] Update authentication endpoints
- [ ] Update environment variables

### Phase 2: Routing
- [ ] Remove organization list routes
- [ ] Remove `[org]` dynamic routes
- [ ] Update navigation structure
- [ ] Update route guards (if any)

### Phase 3: Components
- [ ] Remove organization management components
- [ ] Update dashboard to tenant-scoped
- [ ] Update all form components
- [ ] Update list components

### Phase 4: Data Fetching
- [ ] Update SWR hooks
- [ ] Remove tenant ID parameters
- [ ] Use auth context for tenant
- [ ] Update data transformation logic

### Phase 5: State Management
- [ ] Update Zustand store
- [ ] Add tenant context
- [ ] Remove tenant selection logic
- [ ] Update all store usages

### Phase 6: Testing
- [ ] Test authentication flow
- [ ] Test data fetching
- [ ] Test form submissions
- [ ] Test navigation
- [ ] Test error handling

---

## 14. Key Differences Summary

| Aspect | Super Admin | Tenant Admin |
|--------|------------|--------------|
| **Scope** | Multi-tenant | Single tenant |
| **API Prefix** | `/super/` | `/` (or `/tenant/`) |
| **Routes** | `/organization/[org]/...` | Direct routes |
| **Dashboard** | All tenants stats | Single tenant stats |
| **Navigation** | Organization selection | Direct resource links |
| **State** | Tenant selection | Tenant from auth |
| **Components** | Multi-tenant aware | Tenant-scoped |

---

## 15. Common Pitfalls to Avoid

1. **Don't forget to remove tenant ID from URLs**
   - ❌ `/dashboard/organization/1/patients`
   - ✅ `/dashboard/patients`

2. **Don't pass tenant ID to API calls**
   - ❌ `API_ENDPOINTS.GET_PATIENTS(tenantId)`
   - ✅ `API_ENDPOINTS.GET_PATIENTS` (tenant from auth)

3. **Don't show organization selection UI**
   - Remove any tenant/org switchers
   - Remove organization lists

4. **Don't fetch all tenants**
   - Remove `useTenantsData()` calls
   - Use tenant from auth context only

5. **Don't forget to update error messages**
   - Update error messages to be tenant-specific
   - Remove references to "organizations"

---

## 16. Testing Checklist

After migration, test:

- [ ] Login/logout flow
- [ ] Dashboard loads with tenant data
- [ ] Patient CRUD operations
- [ ] Employee CRUD operations
- [ ] Appointment CRUD operations
- [ ] Schedule CRUD operations
- [ ] Navigation between pages
- [ ] Search functionality (tenant-scoped)
- [ ] Filtering and pagination
- [ ] Error handling
- [ ] Loading states
- [ ] Form validations
- [ ] Image uploads
- [ ] Notifications (if tenant-scoped)

---

## 17. Rollback Plan

If issues arise:

1. Keep Super Admin codebase intact
2. Create tenant admin as separate branch
3. Test thoroughly before merging
4. Maintain API compatibility
5. Document any breaking changes

---

**Last Updated:** December 2024  
**For:** Tenant Admin Codebase Sync

