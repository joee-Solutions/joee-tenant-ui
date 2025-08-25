"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "departments", label: "Departments" },
  { href: "employees", label: "Employees" },
  { href: "patients", label: "Patients" },
  { href: "appointments", label: "Appointments" },
  { href: "schedule", label: "Schedule" },
  { href: "manage", label: "Manage Organization" },
];

export default function ViewPage() {
  const pathname = usePathname();
  const base = pathname.replace(/\/view$/, "");
  return (
    <div className="w-full mx-auto px-10">
      <nav className="flex gap-6 border-b pb-3 mb-8">
        {links.map((l) => (
          <Link
            key={l.href}
            href={`${base}/${l.href}`}
            className="px-4 py-2 text-gray-600 hover:text-[#003465] hover:underline"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <p className="text-sm text-gray-500">Choose a section to continue.</p>
    </div>
  );
}


