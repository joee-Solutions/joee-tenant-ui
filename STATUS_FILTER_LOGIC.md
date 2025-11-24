# Status Filter Logic Flow

## Complete Flow: From Filter Selection to Data Rendering

### Step 1: User Selects Status Filter
**File:** `src/components/shared/table/DataTableFilter.tsx` (Lines 56-80)

```typescript
<Select
  value={status || ""}
  onValueChange={(value) => setStatus(value === "all" ? "" : value)}
>
  <SelectItem value="all">All</SelectItem>
  <SelectItem value="Active">Active</SelectItem>
  <SelectItem value="Inactive">Inactive</SelectItem>
</Select>
```

**Logic:**
- User selects "Active", "Inactive", or "All"
- If "All" is selected → `status = ""` (empty string, clears filter)
- If "Active" or "Inactive" is selected → `status = "Active"` or `status = "Inactive"`

---

### Step 2: Status State Update
**File:** `src/app/(dashboard)/dashboard/organization/page.tsx` (Line 31)

```typescript
const [status, setStatus] = useState("");
```

**State Values:**
- `status = ""` → No filter (show all organizations)
- `status = "Active"` → Filter for active organizations
- `status = "Inactive"` → Filter for inactive organizations

---

### Step 3: Status Transformation for API
**File:** `src/app/(dashboard)/dashboard/organization/page.tsx` (Line 44)

```typescript
const mappedStatus = status ? status.toUpperCase() : undefined;
```

**Transformation:**
- `status = ""` → `mappedStatus = undefined` (no status parameter sent to API)
- `status = "Active"` → `mappedStatus = "ACTIVE"`
- `status = "Inactive"` → `mappedStatus = "INACTIVE"`

---

### Step 4: API Request with Status Filter
**File:** `src/hooks/swr.ts` (Lines 294-313)

```typescript
export const useTenantsData = (filters?: { 
  search?: string; 
  sort?: string; 
  status?: string;  // This receives "ACTIVE" or "INACTIVE"
  page?: number; 
  limit?: number 
}) => {
  let endpoint = API_ENDPOINTS.GET_ALL_TENANTS;
  const params = new URLSearchParams();
  
  if (filters?.status) params.append("status", filters.status);
  // ... other params
  
  if (Array.from(params).length > 0) endpoint += `?${params.toString()}`;
  
  const { data, isLoading, error } = useSWR(endpoint, authFectcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });
  
  return {
    data: extractData<Tenant[]>(data) as any,
    meta: extractMeta(data),
    isLoading,
    error,
  };
};
```

**API Endpoint Examples:**
- No filter: `/super/tenants?page=1&limit=10`
- Active filter: `/super/tenants?status=ACTIVE&page=1&limit=10`
- Inactive filter: `/super/tenants?status=INACTIVE&page=1&limit=10`

---

### Step 5: Data Extraction
**File:** `src/framework/joee.client.ts` (Lines 32-42)

```typescript
export const extractData = <T>(response: ApiResponse<T> | T[] | T): T | T[] => {
  // If it's already the new format
  if (response && typeof response === 'object' && 'success' in response) {
    const apiResponse = response as ApiResponse<T>;
    return apiResponse.data as T;  // Returns the array of organizations
  }
  
  // If it's legacy format (direct data)
  return response as T | T[];
};
```

**Result:**
- `tenantsData` = Array of organization objects filtered by status (or all if no filter)
- Each organization has a `status` property: "active", "inactive", or "deactivated"

---

### Step 6: Rendering Decision Logic
**File:** `src/app/(dashboard)/dashboard/organization/page.tsx` (Lines 189-302)

```typescript
<DataTable>
  {tenantsLoading ? (
    // 1. SHOW LOADING SKELETON
    <SkeletonRows />
    
  ) : tenantsError ? (
    // 2. CHECK FOR ERRORS FIRST
    (() => {
      const isStatusFilter = !!status;  // true if status filter is active
      const errorMessage = tenantsError?.message || '';
      const errorStatus = tenantsError?.response?.status || tenantsError?.status;
      
      // Check if it's a 500 error
      const is500Error = 
        errorStatus === 500 ||
        errorMessage.includes('500') ||
        errorMessage.includes('status code 500') ||
        errorMessage.toLowerCase().includes('internal server error');
      
      if (isStatusFilter && is500Error) {
        // If filtering by status AND getting 500 error → Show empty message
        return <EmptyMessage>{`No ${status.toLowerCase()} organizations found`}</EmptyMessage>;
      }
      
      // Otherwise show error message
      return <ErrorMessage>Failed to load organizations</ErrorMessage>;
    })()
    
  ) : Array.isArray(tenantsData) && tenantsData.length > 0 ? (
    // 3. CHECK IF DATA EXISTS (Array with length > 0)
    tenantsData.map((data: any) => (
      <TableRow>
        {/* Render organization data */}
        <TableCell>{data.status.toUpperCase()}</TableCell>
      </TableRow>
    ))
    
  ) : (
    // 4. NO DATA AND NO ERROR → Show empty state
    <EmptyMessage>
      {status 
        ? `No ${status.toLowerCase()} organizations found` 
        : "No organizations found"}
    </EmptyMessage>
  )}
</DataTable>
```

---

## Decision Tree Summary

```
User selects status filter
    ↓
status state updated ("Active", "Inactive", or "")
    ↓
mappedStatus = status.toUpperCase() or undefined
    ↓
API called with status parameter
    ↓
Response received
    ↓
┌─────────────────────────────────────┐
│ RENDERING DECISION LOGIC            │
└─────────────────────────────────────┘
    ↓
Is loading? 
    ├─ YES → Show skeleton
    └─ NO → Continue
        ↓
Is there an error?
    ├─ YES → Check error type
    │   ├─ Status filter + 500 error → "No {status} organizations found"
    │   └─ Other error → "Failed to load organizations"
    └─ NO → Continue
        ↓
Is tenantsData an array with length > 0?
    ├─ YES → Render organizations table
    └─ NO → Show empty message
        ├─ If status filter active → "No {status} organizations found"
        └─ If no filter → "No organizations found"
```

---

## Key Points

1. **Status Filter is Applied at API Level**: The backend filters organizations by status, not the frontend
2. **Data Check Priority**: 
   - First: Check if loading
   - Second: Check if error exists
   - Third: Check if data exists (array with length > 0)
   - Fourth: Show empty state
3. **Error Handling**: 500 errors during status filtering are treated as "no data" for better UX
4. **Status Values**: Backend expects uppercase ("ACTIVE", "INACTIVE"), frontend uses title case ("Active", "Inactive")

---

## Current Issue

The problem you're experiencing is likely:
- API returns 500 error when filtering by "Active"
- Error handler shows "No active organizations found"
- But data exists because the initial load (without filter) shows active organizations

**Solution**: The backend should return an empty array `[]` instead of a 500 error when filtering by status with no results. The current code handles 500 errors gracefully, but ideally the API should return `{ success: true, data: [] }` for empty filtered results.

