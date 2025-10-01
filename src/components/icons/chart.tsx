import {
    ActiveOrgChart,
    AllOrgChart,
    DeactivatedOrgChart,
    InactiveOrgChart,
  } from "@/components/icons/icon";
  
  export const chartList = {
    total: <AllOrgChart className="w-full h-full object-fit" />,
    active: <ActiveOrgChart className="w-full h-full object-fit" />,
    inactive: <InactiveOrgChart className="w-full h-full object-fit" />,
    deactivated: <DeactivatedOrgChart className="w-full h-full object-fit" />,
    all: <AllOrgChart className="w-full h-full object-fit" />,
  };
