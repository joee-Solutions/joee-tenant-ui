# MainHeader Component Specification

## Overview
The `MainHeader` component is a fully-featured header bar that appears at the top of the dashboard. It includes search functionality, notifications dropdown, settings button, and user profile dropdown with logout capability. The component is wrapped in a Suspense boundary for Next.js prerendering compatibility.

**File Location:** `src/components/shared/MainHeader.tsx`

---

## Component Structure

### Main Component
```typescript
const MainHeader = () => {
  return (
    <Suspense fallback={/* Loading skeleton */}>
      <MainHeaderContent />
    </Suspense>
  );
};
```

### Content Component
```typescript
const MainHeaderContent = () => {
  // All functionality and UI logic
};
```

---

## Design Specifications

### Layout Structure
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Search Bar........................] [🔔] [⚙️] [👤 Name                    │
│                                                      Role]                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Container Styles

**Header Container:**
- Display: `flex flex-col md:flex-row` (column on mobile, row on desktop)
- Items: `items-start md:items-center` (start aligned on mobile, center on desktop)
- Justify: `justify-between`
- Gap: `gap-3 md:gap-5` (smaller gap on mobile)
- Height: `h-auto md:h-[150px]` (auto height on mobile, fixed on desktop)
- Padding: `px-4 md:px-[24px] py-4 md:py-12` (reduced padding on mobile)
- Shadow: `shadow-[0px_4px_25px_0px_#0000001A]` (subtle shadow)

---

## Component Sections

### 1. Hamburger Menu Button (Mobile Only)

**Button Container:**
- Visibility: `lg:hidden` (visible on mobile/tablet, hidden on desktop)
- Display: `flex items-center justify-center`
- Background: `bg-white`
- Size: `w-[40px] h-[40px]`
- Border radius: `rounded-[10px]`
- Shadow: `shadow-[0px_4px_25px_0px_#0000001A]`
- Cursor: `cursor-pointer`
- Hover: `hover:bg-gray-50 transition-colors`

**Menu Icon:**
- Component: `Menu` from `lucide-react`
- Size: `h-6 w-6`
- Color: `text-[#003465]`

**Functionality:**
- Click handler: `toggleMobileMenu`
- State: `isMobileMenuOpen` (can be used to toggle mobile sidebar/drawer)
- Note: Currently toggles state - can be connected to mobile navigation drawer

### 2. Search Bar

**Form Container:**
- Position: `relative`
- Display: `flex items-center justify-center`
- Padding: `px-2 py-[10px]`
- Border radius: `rounded-[60px]` (fully rounded)
- Background: `bg-white`
- Shadow: `shadow-[4px_4px_4px_0px_#B7B5B566]` (soft shadow)
- Width: `flex-1` (mobile) / `md:flex-none md:basis-[50%]` (desktop - takes 50% width)

**Input Field:**
- Type: `text`
- Placeholder: `"Search organizations, employees, departments..."`
- Padding: `px-5`
- Height: `h-[50px]`
- Border radius: `rounded-[30px]`
- Background: `bg-[#E4E8F2]` (light gray-blue)
- Outline: `outline-none`
- Focus: `focus:outline-1 focus:outline-slate-400`
- Width: `w-full`
- Text size: `text-sm md:text-base` (smaller on mobile, normal on desktop)
- Custom styles: `[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none` (removes default search styling)

**Search Button:**
- Position: `absolute right-10`
- Cursor: `cursor-pointer`
- Hover: `hover:opacity-70 transition-opacity`
- Icon: `SearchIcon` from `lucide-react`
- Size: `w-5 h-5`

**Functionality:**
- Form submission handler: `handleSearch`
- Syncs with URL search params when on organization pages
- Navigates to `/dashboard/organization?search={query}` on submit
- Clears search param if query is empty

---

### 2. Notifications Button & Popover

**Button Container:**
- Position: `relative`
- Display: `flex items-center justify-center`
- Background: `bg-white`
- Size: `w-[40px] h-[40px]`
- Border radius: `rounded-[10px]`
- Shadow: `shadow-[0px_4px_25px_0px_#0000001A]`
- Cursor: `cursor-pointer`
- Hover: `hover:bg-gray-50 transition-colors`

**Bell Icon:**
- Component: `BellIcon` from `../icons/icon`
- Size: `h-6 w-6`
- Color: `#003465` (dark blue)

**Unread Badge:**
- Position: `absolute -top-1 -right-1`
- Background: `bg-red-500`
- Text color: `text-white`
- Text size: `text-xs`
- Border radius: `rounded-full`
- Size: `w-5 h-5`
- Display: `flex items-center justify-center`
- Only shows when `unreadCount > 0`

**Popover Content:**
- Width: `w-80` (320px)
- Padding: `p-0` (no padding on container)
- Alignment: `align="end"` (right-aligned)

**Popover Header:**
- Padding: `p-4`
- Border: `border-b`
- Title: `"Notifications"`
- Font: `font-semibold text-lg`

**Notifications List:**
- Max height: `max-h-96` (384px)
- Overflow: `overflow-y-auto` (scrollable)
- Empty state: Shows "No notifications" in gray text

**Notification Item:**
- Padding: `p-4`
- Border: `border-b`
- Cursor: `cursor-pointer`
- Hover: `hover:bg-gray-50 transition-colors`
- Unread background: `bg-blue-50` (light blue background for unread)
- Structure:
  - Title: `font-semibold text-sm text-[#003465]`
  - Message: `text-xs text-gray-600 mt-1`
  - Time: `text-xs text-gray-400 mt-1`
  - Unread indicator: `w-2 h-2 bg-blue-500 rounded-full ml-2` (blue dot)

**Mark All as Read Button:**
- Padding: `p-3`
- Border: `border-t`
- Text: `text-sm text-[#003465]`
- Hover: `hover:underline`
- Only shows when `notifications.length > 0`

**Notification Data Structure:**
```typescript
interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
}
```

**State Management:**
- `isNotificationOpen`: Controls popover visibility
- `notifications`: Array of notification objects (currently mocked)
- `unreadCount`: Calculated from `notifications.filter(n => !n.read).length`

---

### 3. Settings Button

**Button Container:**
- Display: `flex items-center justify-center`
- Background: `bg-white`
- Size: `w-[40px] h-[40px]`
- Border radius: `rounded-[10px]`
- Shadow: `shadow-[0px_4px_25px_0px_#0000001A]`
- Cursor: `cursor-pointer`
- Hover: `hover:bg-gray-50 transition-colors`

**Settings Icon:**
- Component: `IoSettingsSharp` from `react-icons/io5`
- Size: `w-[24px] h-[24px]`
- Color: `text-[#EC0909]` (red)

**Functionality:**
- Click handler: `handleSettings`
- Navigates to: `/dashboard/settings`

---

### 4. User Profile Section

**Profile Container:**
- Display: `flex items-center`
- Gap: `gap-[10.32px]`
- Cursor: `cursor-pointer`
- Hover: `hover:opacity-80 transition-opacity`

**Profile Image:**
- Container: `block w-[40px] h-[40px] rounded-full overflow-hidden`
- Image source: `profileImage` from `./../../../public/assets/profile.png`
- Dimensions: `width={40} height={40}`
- Object fit: `aspect-square w-full h-full object-cover`

**User Info:**
- Visibility: `hidden sm:block` (hidden on mobile, visible on tablet and up)
- Username:
  - Text: Shows `fullName` or `"Loading..."` or `"-"`
  - Font: `text-sm font-semibold`
  - Color: `text-[#003465]`
  - Margin: `mb-1`
- Role:
  - Text: Shows formatted role (e.g., "Super Admin")
  - Font: `text-xs font-medium`
  - Color: `text-[#595959]`

**Profile Popover:**
- Width: `w-48` (192px)
- Padding: `p-0` (no padding on container)
- Alignment: `align="end"` (right-aligned)

**Popover Menu Items:**
- Container: `p-2`
- Buttons:
  - "View Profile": Navigates to `/dashboard/profile`
  - "Settings": Navigates to `/dashboard/settings`
  - Divider: `border-t my-1`
  - "Logout": Red text (`text-red-600`), red hover (`hover:bg-red-50`)

**Button Styles:**
- Width: `w-full`
- Text align: `text-left`
- Padding: `px-3 py-2`
- Text size: `text-sm`
- Border radius: `rounded`
- Hover: `hover:bg-gray-100 transition-colors`
- Logout: `text-red-600 hover:bg-red-50`

**State Management:**
- `isProfileOpen`: Controls popover visibility

---

## Functionality Details

### Search Functionality

**Search Handler:**
```typescript
const handleSearch = (e: React.FormEvent) => {
  e.preventDefault();
  const query = searchQuery.trim();
  if (query) {
    router.push(`/dashboard/organization?search=${encodeURIComponent(query)}`);
  } else {
    router.push("/dashboard/organization");
  }
};
```

**URL Sync:**
- Syncs search query with URL params when on organization pages
- Uses `useEffect` to read `searchParams` and update local state
- Only syncs when `pathname?.includes("/organization")`

**State:**
- `searchQuery`: Local state for input value
- Synced with URL params via `useSearchParams`

---

### User Data Fetching

**Hook Used:**
```typescript
const { data: admin, isLoading } = useAdminProfile();
```

**Data Processing:**
```typescript
const adminData = Array.isArray(admin) ? admin[0] : admin;
const fullName = adminData 
  ? `${adminData.first_name || ""} ${adminData.last_name || ""}`.trim() 
  : "";
const role = adminData?.roles?.[0]?.split("_").join(" ") || "Admin";
```

**AdminUser Type:**
```typescript
interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  address?: string;
  profile_picture?: string;
  roles: string[];
  permissions?: string[];
  created_at: string;
  updated_at: string;
}
```

**API Endpoint:**
- `GET_ADMIN_PROFILE: "/management/super/admin/profile"`

---

### Navigation Handlers

**Settings:**
```typescript
const handleSettings = () => {
  router.push("/dashboard/settings");
};
```

**View Profile:**
```typescript
const handleViewProfile = () => {
  router.push("/dashboard/profile");
  setIsProfileOpen(false);
};
```

**Logout:**
```typescript
const handleLogout = async () => {
  try {
    Cookies.remove("auth_token");
    Cookies.remove("refresh_token");
    Cookies.remove("user");
    toast.success("Logged out successfully", { toastId: "logout-success" });
    router.push("/auth/login");
  } catch (error) {
    console.error("Logout error:", error);
    toast.error("Failed to logout", { toastId: "logout-error" });
  }
};
```

---

### Notifications (Current Implementation)

**Mock Data:**
```typescript
const notifications = [
  { 
    id: 1, 
    title: "New employee added", 
    message: "John Doe has been added to the system", 
    time: "2 hours ago", 
    read: false 
  },
  // ... more notifications
];
```

**Unread Count:**
```typescript
const unreadCount = notifications.filter(n => !n.read).length;
```

**Note:** Currently uses mock data. Should be replaced with actual API call.

---

## Suspense & Loading State

**Suspense Wrapper:**
- Wraps `MainHeaderContent` in `Suspense` boundary
- Required for Next.js prerendering compatibility (because `useSearchParams` is used)

**Loading Fallback:**
- Shows skeleton UI matching the header structure
- Uses `animate-pulse` for loading animation
- Includes:
  - Search bar skeleton (gray background)
  - Two button skeletons (notifications, settings)
  - Profile skeleton (image + name/role placeholders)

---

## Color Palette

| Element | Color | Hex Code | Tailwind Class |
|---------|-------|----------|----------------|
| Header Shadow | Light Gray | `#0000001A` | `shadow-[0px_4px_25px_0px_#0000001A]` |
| Search Bar Shadow | Gray | `#B7B5B566` | `shadow-[4px_4px_4px_0px_#B7B5B566]` |
| Search Input Background | Light Gray-Blue | `#E4E8F2` | `bg-[#E4E8F2]` |
| Search Focus Outline | Slate | `slate-400` | `focus:outline-slate-400` |
| Button Shadow | Light Gray | `#0000001A` | `shadow-[0px_4px_25px_0px_#0000001A]` |
| Button Hover | Light Gray | `gray-50` | `hover:bg-gray-50` |
| Bell Icon | Dark Blue | `#003465` | (from BellIcon component) |
| Unread Badge | Red | `#EF4444` | `bg-red-500` |
| Settings Icon | Red | `#EC0909` | `text-[#EC0909]` |
| Username Text | Dark Blue | `#003465` | `text-[#003465]` |
| Role Text | Gray | `#595959` | `text-[#595959]` |
| Notification Title | Dark Blue | `#003465` | `text-[#003465]` |
| Notification Message | Gray | `gray-600` | `text-gray-600` |
| Notification Time | Light Gray | `gray-400` | `text-gray-400` |
| Unread Background | Light Blue | `blue-50` | `bg-blue-50` |
| Unread Dot | Blue | `blue-500` | `bg-blue-500` |
| Logout Text | Red | `red-600` | `text-red-600` |
| Logout Hover | Light Red | `red-50` | `hover:bg-red-50` |

---

## Dependencies

### React/Next.js
```typescript
import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
```

### Icons
```typescript
import { IoSettingsSharp } from "react-icons/io5";
import { SearchIcon, Menu } from "lucide-react";
import { BellIcon } from "../icons/icon";
```

### UI Components
```typescript
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
```

### Hooks & Utilities
```typescript
import { useAdminProfile } from "@/hooks/swr";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
```

### Assets
```typescript
import profileImage from "./../../../public/assets/profile.png";
```

---

## State Management

### Local State
```typescript
const [searchQuery, setSearchQuery] = useState("");
const [isNotificationOpen, setIsNotificationOpen] = useState(false);
const [isProfileOpen, setIsProfileOpen] = useState(false);
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
```

### Derived State
```typescript
const unreadCount = notifications.filter(n => !n.read).length;
const fullName = adminData 
  ? `${adminData.first_name || ""} ${adminData.last_name || ""}`.trim() 
  : "";
const role = adminData?.roles?.[0]?.split("_").join(" ") || "Admin";
```

---

## Responsive Behavior

**Implementation:**

### Mobile (< md breakpoint, < 768px)
- **Layout:** Flex column (`flex-col`) - elements stack vertically
- **Height:** Auto height (`h-auto`) - adapts to content
- **Padding:** Reduced padding (`px-4 py-4`)
- **Hamburger Menu:** Visible (`lg:hidden`) - shows menu button for mobile navigation
- **Search Bar:** Full width (`flex-1`) - takes available space after hamburger button
- **Search Input:** Smaller text (`text-sm`)
- **Action Buttons:** Full width row (`w-full`) with right alignment (`justify-end`)
- **Profile Name/Role:** Hidden (`hidden sm:block`) - only shows profile image
- **Gap:** Smaller gap between elements (`gap-2`)

### Tablet (sm to md breakpoint, 640px - 768px)
- **Profile Name/Role:** Visible (`sm:block`) - shows user info
- **Search Bar:** Still full width in its container

### Desktop (≥ md breakpoint, ≥ 768px)
- **Layout:** Flex row (`md:flex-row`) - horizontal layout
- **Height:** Fixed height (`md:h-[150px]`)
- **Padding:** Full padding (`md:px-[24px] md:py-12`)
- **Hamburger Menu:** Hidden (`lg:hidden`) - not needed on desktop
- **Search Bar:** 50% width (`md:basis-[50%]`)
- **Search Input:** Normal text size (`md:text-base`)
- **Action Buttons:** Auto width (`md:w-auto`)
- **Gap:** Normal gap (`md:gap-5`)

### Breakpoints Used
- `sm:` - 640px and up (tablet)
- `md:` - 768px and up (desktop)
- `lg:` - 1024px and up (large desktop)

---

## Integration Guide for Tenant Admin

### Step 1: Copy Component Structure
1. Create `MainHeader.tsx` in your Tenant Admin codebase
2. Copy the component structure (MainHeader wrapper + MainHeaderContent)
3. Ensure Suspense wrapper is included

### Step 2: Install Dependencies
```bash
npm install react-icons lucide-react js-cookie react-toastify
npm install @radix-ui/react-popover  # If using Radix UI
```

### Step 3: Match Styling
- Copy all Tailwind classes exactly as specified
- Ensure color values match (use hex codes where custom)
- Match shadow values exactly
- Match border radius values (`rounded-[60px]`, `rounded-[10px]`, etc.)

### Step 4: Implement Functionality

**Search:**
- Implement `handleSearch` function
- Sync with URL params if needed
- Update navigation route to match your tenant admin routes

**User Data:**
- Replace `useAdminProfile()` with your tenant admin user hook
- Adjust data structure if your API returns different format
- Update `fullName` and `role` extraction logic

**Notifications:**
- Replace mock notifications with actual API call
- Implement notification click handlers
- Implement "Mark all as read" functionality

**Navigation:**
- Update routes to match your tenant admin routes:
  - `/dashboard/settings` → your settings route
  - `/dashboard/profile` → your profile route
  - `/auth/login` → your login route

**Mobile Menu:**
- Connect `toggleMobileMenu` handler to your mobile navigation drawer/sidebar
- The `isMobileMenuOpen` state can be used to control mobile menu visibility
- Consider using a drawer component (e.g., Radix UI Dialog or custom drawer) for mobile navigation

**Logout:**
- Update cookie names if different
- Update logout route
- Ensure toast notifications work

### Step 5: Update Assets
- Ensure `profile.png` exists in `public/assets/` or update path
- Update `BellIcon` component or import from your icon library

### Step 6: Test Functionality
- Test search functionality
- Test notification popover open/close
- Test profile popover open/close
- Test logout flow
- Test user data loading states

---

## API Integration Points

### User Profile
- **Endpoint:** `GET /management/super/admin/profile`
- **Hook:** `useAdminProfile()`
- **Response:** `AdminUser` object

### Notifications (To Be Implemented)
- **Endpoint:** Should fetch from notifications API
- **Structure:** Array of notification objects with `id`, `title`, `message`, `time`, `read`
- **Unread Count:** Calculate from notifications array

---

## Usage Example

```typescript
import MainHeader from "@/components/shared/MainHeader";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full">
      <SideNavigation />
      <div className="flex flex-col gap-[49px] lg:pl-72 w-full">
        <MainHeader />
        {children}
      </div>
    </div>
  );
}
```

---

## Notes

1. **Suspense Boundary:** Required for Next.js prerendering when using `useSearchParams`
2. **Mock Notifications:** Currently uses mock data - should be replaced with API call
3. **Profile Image:** Uses static import - consider using user's `profile_picture` from API
4. **Role Formatting:** Converts `"SUPER_ADMIN"` to `"Super Admin"` by splitting on `_` and joining with spaces
5. **Toast IDs:** Uses unique `toastId` to prevent duplicate toast messages
6. **Popover Alignment:** Notifications and Profile popovers use `align="end"` for right alignment
7. **Loading States:** Shows "Loading..." for username while fetching user data

---

## Related Components

- **SideNavigation.tsx** - Sidebar navigation component
- **DashboardHeader.tsx** - Simpler header variant (presentational only)
- **Popover.tsx** - Radix UI Popover wrapper component
- **BellIcon** - Custom bell icon component

---

## Future Enhancements

1. **Real-time Notifications:** Integrate WebSocket or polling for live notifications
2. **Notification Actions:** Add ability to mark individual notifications as read
3. **Search Suggestions:** Add autocomplete/dropdown for search suggestions
4. **Keyboard Shortcuts:** Add keyboard shortcuts for search, notifications, etc.
5. **Mobile Responsiveness:** Add mobile-specific layout and interactions
6. **Profile Picture Upload:** Allow users to upload/change profile picture
7. **Notification Filters:** Add filters for notification types (all, unread, etc.)

