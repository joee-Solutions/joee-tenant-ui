import orgPlaceholder from "./../../../../public/assets/orgPlaceholder.png";
import { StaticImageData } from "next/image";

export const AllOrgTableData: {
  id: number;
  organization: {
    name: string;
    image: StaticImageData;
  };
  created_at: string;
  location: string;
  status: string;
}[] = [
  {
    id: 1,
    organization: {
      name: "JON-KEN Hospital",
      image: orgPlaceholder,
    },
    created_at: "20 Jan 2024",
    location: "Lagos",
    status: "Active",
  },
  {
    id: 2,
    organization: {
      name: "JON-KEN Hospital",
      image: orgPlaceholder,
    },
    created_at: "20 Jan 2024",
    location: "Lagos",
    status: "Inactive",
  },
  {
    id: 3,
    organization: {
      name: "JON-KEN Hospital",
      image: orgPlaceholder,
    },
    created_at: "20 Jan 2024",
    location: "Lagos",
    status: "Active",
  },
  {
    id: 4,
    organization: {
      name: "JON-KEN Hospital",
      image: orgPlaceholder,
    },
    created_at: "20 Jan 2024",
    location: "Lagos",
    status: "Active",
  },
  {
    id: 5,
    organization: {
      name: "JON-KEN Hospital",
      image: orgPlaceholder,
    },
    created_at: "20 Jan 2024",
    location: "Lagos",
    status: "Inactive",
  },
  {
    id: 6,
    organization: {
      name: "JON-KEN Hospital",
      image: orgPlaceholder,
    },
    created_at: "20 Jan 2024",
    location: "Lagos",
    status: "Active",
  },
  {
    id: 7,
    organization: {
      name: "JON-KEN Hospital",
      image: orgPlaceholder,
    },
    created_at: "20 Jan 2024",
    location: "Lagos",
    status: "Active",
  },
  {
    id: 8,
    organization: {
      name: "JON-KEN Hospital",
      image: orgPlaceholder,
    },
    created_at: "20 Jan 2024",
    location: "Lagos",
    status: "Active",
  },
  {
    id: 9,
    organization: {
      name: "JON-KEN Hospital",
      image: orgPlaceholder,
    },
    created_at: "20 Jan 2024",
    location: "Lagos",
    status: "Active",
  },
];
