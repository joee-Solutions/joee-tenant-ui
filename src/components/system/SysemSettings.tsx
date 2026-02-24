"use client";
import React from "react";
import FieldSelect from "@/components/shared/form/FieldSelect";
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
  Check,
  CheckCircle2,
  CircleArrowLeft,
  Edit,
  EditIcon,
  Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import FieldBox from "../shared/form/FieldBox";
import ProfileImageUploader from "../ui/ImageUploader";
import { useRouter } from "next/navigation";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";

const SystemSettingsSchema = z.object({
  name: z.string().min(1, "This field is required"),
  address: z.string().min(1, "This field is required"),
  email: z
    .string()
    .email("Invalid email address")
    .min(1, "This field is required"),

  phoneNumber: z.string().min(1, "This field is required"),
  company: z.string().min(1, "This field is required"),
  profileImage: z.string().optional(),
  title: z.string().min(1, "This field is required"),
});

type SystemSettingsSchemaType = z.infer<typeof SystemSettingsSchema>;

const orgStatus = ["Admin", "Super Admin", "User"];

export default function SystemSettings() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = React.useState(false);
  
  const form = useForm<SystemSettingsSchemaType>({
    resolver: zodResolver(SystemSettingsSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      title: "",
      email: "",
      phoneNumber: "",
      address: "",
      company: "",
    },
  });

  // Fetch system settings on component mount
  React.useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        setIsFetching(true);
        const response = await processRequestAuth("get", API_ENDPOINTS.GET_SYSTEM_SETTINGS);
        console.log(response, "response");
        if (response.success && response.data) {
          // Populate form with fetched data
          form.reset({
            name: response.data.name || "",
            title: response.data.title || "",
            email: response.data.email || "",
            phoneNumber: response.data.phoneNumber || "",
            address: response.data.address || "",
            company: response.data.company || "",
            profileImage: response.data.profileImage || response.data.logo || "",
          });
        } else {
          toast.error("Failed to load system settings");
        }
      } catch (error) {
        console.error("Error fetching system settings:", error);
        toast.error("Failed to load system settings");
      } finally {
        setIsFetching(false);
      }
    };

    fetchSystemSettings();
  }, [form]);

  const onSubmit = async (payload: SystemSettingsSchemaType) => {
    setIsLoading(true);
    try {
      // Check if profileImage is a base64 data URL (newly uploaded image)
      const isBase64Image = payload.profileImage && payload.profileImage.startsWith('data:image/');
      
      // If it's a base64 image, we might need to convert it or send as FormData
      // For now, send as-is (base64 string) - backend should handle it
      // If backend expects file upload, we'll need to convert base64 to File and use FormData
      
      console.log("Submitting system settings:", {
        ...payload,
        profileImage: payload.profileImage ? `${payload.profileImage.substring(0, 50)}...` : "empty",
        isBase64Image
      });
      
      const response = await processRequestAuth("put", API_ENDPOINTS.UPDATE_SYSTEM_SETTINGS, payload);
      
      if (response.status || response.success) {
        setShowSuccessDialog(true);
        toast.success("System settings updated successfully");
        
        // If update was successful and response includes updated data, refresh form
        if (response.data) {
          form.reset({
            ...payload,
            profileImage: response.data.profileImage || response.data.logo || payload.profileImage || "",
          });
        }
      } else {
        toast.error(response.message || "Failed to update system settings");
      }
    } catch (error) {
      console.error("Error updating system settings:", error);
      toast.error("Failed to update system settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    form.handleSubmit(onSubmit)();
  };
  
  const router = useRouter();
  
  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-[#003465] border-blue-200"></div>
      </div>
    );
  }
  
  return (
    <>
      <h2 className="font-bold text-base text-black mb-[30px]">
        System Settings
      </h2>
      <FormComposer form={form} onSubmit={onSubmit}>
        <div className="flex flex-col gap-[30px]">
          <ProfileImageUploader title="System Logo" name="profileImage"/>
          <div className="grid grid-cols-2 gap-5 items-start justify-center">
            <FieldBox
              bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
              name="name"
              control={form.control}
              labelText="System Name"
              type="text"
              placeholder="Enter System Name "
            />
            <FieldBox
              bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
              type="text"
              name="title"
              control={form.control}
              labelText="Title"
              placeholder="Enter Title"
            />
          </div>
          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            type="text"
            name="address"
            control={form.control}
            labelText="Address"
            placeholder="Enter Address"
          />
           <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            type="email"
            name="email"
            control={form.control}
            labelText="Email"
            placeholder="Enter Email Address"
          />

          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            type="text"
            name="phoneNumber"
            control={form.control}
            labelText="Phone number"
            placeholder="Enter Phone number"
          />

        
          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            name="company"
            control={form.control}
            labelText="Company Name"
            type="text"
            placeholder="Enter Company name"
          />

          <div className="flex items-center gap-7">
            <Button 
              onClick={handleEdit}
              disabled={isLoading}
              className="h-[60px] bg-[#003465] text-base font-medium text-white rounded w-full disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  Save Changes <EditIcon className="text-white size-4 ml-2" />
                </>
              )}
            </Button>

            <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
              <AlertDialogContent className="bg-white flex flex-col items-center text-center">
                <AlertDialogHeader className="flex flex-col items-center">
                  <CheckCircle2 className="size-[100px] fill-[#3FA907] text-white" />
                  <AlertDialogTitle className="font-medium text-[#3FA907] text-4xl">
                    Success
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-normal text-base text-[#737373]">
                    You have successfully saved changes
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction 
                    className="h-[60px] w-[291px] bg-[#3FA907] text-white font-medium text-base"
                    onClick={() => {
                      setShowSuccessDialog(false);
                      router.push("/dashboard/admin/list");
                    }}
                  >
                    Continue
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
