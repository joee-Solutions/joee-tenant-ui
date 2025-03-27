"use client";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { FaPlus, FaUpload } from "react-icons/fa";
import { Button } from "../ui/button";
import { TabVal } from "@/app/(dashboard)/dashboard/organization/[org]/view/page";

// example , Default Tab based on parent tab 
const innerTab = [
  { name: "List", text: "Department List", icon: null, parent: "Departments" },
  {
    name: "Add",
    text: "Add Department",
    icon: <FaPlus />,
    parent: "Departments",
  },
  { name: "Backup", text: "Backup", icon: <FaUpload />, parent: "Departments" },
];

export default function DynamicTabCompContent({
  tabName,
}: {
  tabName: TabVal;
}) {

  useEffect(() => {
    console.log("name", tabName);
  }, [tabName]);

  const [activeTab, setActiveTab] = useState(innerTab[0].name);
  return (
    <div className="mt-6  bg-white">
      <div className="flex gap-4 mb-6 max-w-3xl w-full">
        {innerTab.map((tab) => (
          <Button
            key={tab.name}
            size={"lg"}
            className={cn(
              `px-4 py-2 rounded `,
              activeTab === tab.name
                ? "bg-[#003465] text-white font-semibold"
                : "bg-gray-300 text-[#737373]"
            )}
            onClick={() => setActiveTab(tab.name)}
          >
            {tab.text} {tab.icon ? tab.icon : null}
          </Button>
        ))}
      </div>

        <div className="">content</div>
      
    </div>
  );
}
