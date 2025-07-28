"use client";
import React from "react";
import TrainingGuideList from "@/components/admin/TrainingGuideList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TrainingGuidesPage() {
  const router = useRouter();

  return (
    <div className="px-12 pb-20 flex flex-col gap-[30px] w-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Training Guides</h1>
        <Button
          onClick={() => router.push("/dashboard/training-guides/create")}
          className="bg-[#003465] text-white hover:bg-[#002a52] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Upload New Guide
        </Button>
      </div>
      <TrainingGuideList />
    </div>
  );
} 