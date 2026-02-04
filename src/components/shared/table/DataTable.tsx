import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { Ellipsis } from "lucide-react";
import React, { useMemo } from "react";

const getColumnHeaders = function (data: Record<string, any>) {
  const headers = Object.keys(data).map((key) => {
    // Handle specific column name transformations
    if (key === "id") {
      // Check if this is a patient table by checking for patient-specific keys
      if (data.patient || data.email || data.gender || data.date_of_birth) {
        return "S/N";
      }
      return "ID";
    } else if (key === "S/N") {
      return "S/N";
    } else if (key === "created_at") {
      return "Date Created";
    } else if (key === "location") {
      return "Address";
    } else if (key === "no_of_empployees" || key === "no_of_employees") {
      return "No of Employees";
    } else if (key === "designation") {
      return "Title";
    } else if (key.includes("_")) {
      const c = key.split("_");
      const firstC = c[0][0].toUpperCase() + c[0].slice(1);
      const secondC = c[1][0].toUpperCase() + c[1].slice(1);
      c[0] = firstC;
      c[1] = secondC;

      return c.join(" ");
    }
    // Return key as-is if it's already properly formatted (e.g., "S/N", "Patient", "Date", "Provider", "Time", "Action")
    return key;
  });

  return headers;
};

interface DataTableProps {
  tableDataObj: Record<string, any>;
  children: React.ReactNode;
  showAction?: boolean;
}

export default function DataTable({
  tableDataObj,
  children,
  showAction,
}: DataTableProps) {
  const columnHeaders = useMemo(
    () => getColumnHeaders(tableDataObj),
    [tableDataObj]
  );

  return (
    <Table>
      <TableHeader className="bg-[#EDF0F6] h-[38px]">
        <TableRow>
          {columnHeaders.map((column) => {
            return (
              <TableHead
                key={column}
                className="font-semibold text-xs text-black"
              >
                {column}
              </TableHead>
            );
          })}
          {showAction && <TableHead>Action</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>{children}</TableBody>
    </Table>
  );
}
