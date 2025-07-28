"use client";
import React, { useState } from "react";
import FormComposer from "@/components/shared/form/FormComposer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  FileText,
  FileImage,
  File,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import FieldBox from "../shared/form/FieldBox";
import FieldSelect from "../shared/form/FieldSelect";
import DocumentUploader from "../ui/DocumentUploader";
import { useRouter } from "next/navigation";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";

const TrainingGuideSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  guide_version: z.string().optional(),
  is_featured: z.boolean().default(false),
  metadata: z.object({
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    targetAudience: z.array(z.string()).optional(),
  }).optional(),
});

type TrainingGuideSchemaType = z.infer<typeof TrainingGuideSchema>;

const categories = [
  "General",
  "User Management", 
  "Patient Management",
  "Appointment Management",
  "Medical Records",
  "Department Management",
  "System Settings",
  "Security",
  "Reporting",
  "Other"
];

const targetAudiences = [
  "All Users",
  "Administrators",
  "Doctors",
  "Nurses",
  "Receptionists",
  "IT Staff",
  "New Users"
];

interface TrainingGuideFormProps {
  mode?: "create" | "edit";
  initialData?: any;
  onSuccess?: () => void;
}

export default function TrainingGuideForm({ 
  mode = "create", 
  initialData,
  onSuccess 
}: TrainingGuideFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const form = useForm<TrainingGuideSchemaType>({
    resolver: zodResolver(TrainingGuideSchema),
    mode: "onChange",
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      category: initialData?.category || "",
      guide_version: initialData?.guide_version || "",
      is_featured: initialData?.is_featured || false,
      metadata: {
        author: initialData?.metadata?.author || "",
        tags: initialData?.metadata?.tags || [],
        targetAudience: initialData?.metadata?.targetAudience || [],
      },
    },
  });

  const onSubmit = async (payload: TrainingGuideSchemaType) => {
    if (mode === "create" && !selectedFile) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      
      // Append form data
      Object.keys(payload).forEach((key) => {
        if (key === "metadata") {
          formData.append(key, JSON.stringify(payload[key]));
        } else {
          formData.append(key, String(payload[key]));
        }
      });

      // Append file if selected
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const endpoint = mode === "create" 
        ? API_ENDPOINTS.CREATE_TRAINING_GUIDE
        : API_ENDPOINTS.UPDATE_TRAINING_GUIDE(initialData.id);

      const method = mode === "create" ? "post" : "put";

      const response = await processRequestAuth(method, endpoint, formData);

      if (response.status) {
        toast.success(response.message || "Training guide saved successfully");
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard/training-guides");
        }
      } else {
        setError(response.message || "Failed to save training guide");
      }
    } catch (error: any) {
      console.error("Error saving training guide:", error);
      setError(error.message || "An error occurred while saving");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setError("");
  };

  return (
    <>
      <h2 className="font-bold text-base text-black mb-[30px]">
        {mode === "create" ? "Upload New Training Guide" : "Edit Training Guide"}
      </h2>
      <FormComposer form={form} onSubmit={onSubmit}>
        <div className="flex flex-col gap-[30px]">
          <DocumentUploader
            title="Training Guide File"
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            error={error}
            uploading={uploading}
          />
          
          <div className="grid grid-cols-2 gap-5 items-start justify-center">
            <FieldBox
              bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
              name="title"
              control={form.control}
              labelText="Title"
              type="text"
              placeholder="Enter training guide title"
            />
            <FieldSelect
              bgSelectClass="bg-[#D9EDFF] border-[#D9EDFF]"
              name="category"
              control={form.control}
              options={categories}
              labelText="Category"
              placeholder="Select category"
            />
          </div>

          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            type="text"
            name="guide_version"
            control={form.control}
            labelText="Version (Optional)"
            placeholder="e.g., 1.0, 2.1"
          />

          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            type="textarea"
            name="description"
            control={form.control}
            labelText="Description (Optional)"
            placeholder="Enter description of the training guide"
          />

          <div className="flex items-center gap-7">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  className="h-[60px] bg-[#003465] text-base font-medium text-white rounded w-full"
                  disabled={uploading}
                >
                  {uploading ? "Saving..." : mode === "create" ? "Upload Guide" : "Update Guide"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white flex flex-col items-center text-center">
                <AlertDialogHeader className="flex flex-col items-center">
                  <CheckCircle2 className="size-[100px] fill-[#3FA907] text-white" />
                  <AlertDialogTitle className="font-medium text-[#3FA907] text-4xl">
                    Success
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-normal text-base text-[#737373]">
                    Training guide has been {mode === "create" ? "uploaded" : "updated"} successfully
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction className="h-[60px] w-[291px] bg-[#3FA907] text-white font-medium text-base">
                    <button
                      onClick={() => router.push("/dashboard/training-guides")}
                    >
                      Continue
                    </button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </FormComposer>
    </>
  );
} 