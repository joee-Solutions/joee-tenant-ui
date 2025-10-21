import {
  ActiveUserIcon,
  DashboardIcon,
  OrgIcon,
} from "@/components/icons/icon";
import { icons, UserRoundMinusIcon } from "lucide-react";

export const sideNavigation = [
  {
    name: "Dashboard",
    icon: DashboardIcon,
    href: "/dashboard",
    showRuler: false,
    isTitle: false,
  },
  {
    name: "Organization",
    icon: OrgIcon,
    // href: "/dashboard/organization",
    isTitle: true,
    // showRuler: true,
    children: [
      {
        title: "Organization",
        href: "/dashboard/organization",
        icon: OrgIcon,
      },
      {
        title: "Active",
        icon: ActiveUserIcon,
        href: "/dashboard/organization/active",
      },
      {
        title: "Inactive",
        icon: UserRoundMinusIcon,
        href: "/dashboard/organization/inactive",
      },
      {
        title: "Deactivated",
        icon: icons.UserX,
        href: "/dashboard/organization/deactivated",
      },
    ],
  },
  {
    name: "Notifications",
    icon: OrgIcon,
    href: "/dashboard/notifications",
    showRuler: true,
    isTitle: true,

    children: [
      {
        title: "notification list",
        icon: icons.FileChartColumn,
        href: "/dashboard/notifications",
      },
      {
        title: "Send Notifications",
        icon: icons.Send,
        href: "/dashboard/notifications/send",
      },
    ],
  },
  {
    name: "Admin",
    icon: OrgIcon,
    href: "/dashboard/admin",
    showRuler: true,
    isTitle: true,

    children: [
      {
        title: "Admin Profile",
        icon: icons.CircleUserRound,
        href: "/dashboard/profile",
      },
      {
        title: "Create Admin",
        icon: icons.BookUser,
        href: "/dashboard/admin/create",
      },
      {
        title: "Admin List",
        icon: icons.Users,
        href: "/dashboard/admin/list",
      },
    ],
  },
  {
    name: "Access Control",
    icon: icons.Shield,
    href: "/dashboard/roles",
    showRuler: true,
    isTitle: true,

    children: [
      {
        title: "Roles",
        icon: icons.Shield,
        href: "/dashboard/roles",
      },
      {
        title: "Permissions",
        icon: icons.Key,
        href: "/dashboard/permissions",
      },
    ],
  },
  {
    name: "Reports & Analytics",
    icon: icons.FileChartColumn,
    href: "/dashboard/reports",
    showRuler: true,
    isTitle: true,

    children: [
      {
        title: "Reports Dashboard",
        icon: icons.FileChartColumn,
        href: "/dashboard/reports",
      },
    ],
  },
  { 
    name: "Settings & Support",
    icon: OrgIcon,
    href: "/dashboard/settings",
    showRuler: true,
    isTitle: true,

    children: [
      {
        title: "User Training Guide",
        icon: icons.FileArchive,
        href: "/dashboard/training-guides",
      },
      // {
      //   title: "User Training Guide",
      //   icon: icons.FileText,
      //   href: "/dashboard/user-training-guide",
      // },
      {
        title: "System Settings",
        icon: icons.Cog,
        href: "/dashboard/settings",
      },
      {
        title: "Logout",
        icon: icons.LogOut,
      },
    ],
  },
];
