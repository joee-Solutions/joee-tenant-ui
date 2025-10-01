"use client";
import { useEffect, useState } from "react";
import TrainingGuideForm from "@/components/admin/TrainingGuideForm";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";

export default function EditTrainingGuidePage({ params }: { params: { id: string } }) {
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const response = await processRequestAuth("get", API_ENDPOINTS.GET_TRAINING_GUIDE(parseInt(params.id)));
        if (response.status) {
          setGuide(response.data);
        } else {
          toast.error("Failed to load training guide");
        }
      } catch (error) {
        console.error("Error fetching training guide:", error);
        toast.error("Failed to load training guide");
      } finally {
        setLoading(false);
      }
    };

    fetchGuide();
  }, [params.id]);

  if (loading) {
    return (
      <div className="px-12 pb-20 flex flex-col gap-[30px] w-full">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-blue-500 border-blue-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-12 pb-20 flex flex-col gap-[30px] w-full">
      <TrainingGuideForm mode="edit" initialData={guide} />
    </div>
  );
} 