import React from "react";
import FieldSelect from "@/components/shared/form/FieldSelect";
import FormComposer from "@/components/shared/form/FormComposer";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import FieldBox from "../shared/form/FieldBox";
import { AdminUser } from "@/lib/types";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";
import { mutate } from "swr";
import { Spinner } from "../icons/Spinner";

const EditOrganizationSchema = z.object({
  firstName: z.string().min(1, "This field is required"),
  address: z.string().min(1, "This field is required"),
  lastName: z.string().min(1, "This field is required"),
  email: z
    .string()
    .email("Invalid email address")
    .min(1, "This field is required"),

  role: z.string().min(1, "This field is required"),
  phoneNumber: z.string().min(1, "This field is required"),
  company: z.string().min(1, "This field is required"),
});

type EditOrganizationSchemaType = z.infer<typeof EditOrganizationSchema>;

const orgStatus = ["Admin", "Super Admin", "User"];

export default function ProfileForm({ admin }: { admin?: AdminUser }) {
  const [isLoading, setIsLoading] = React.useState(false);
  
  const form = useForm<EditOrganizationSchemaType>({
    resolver: zodResolver(EditOrganizationSchema),
    mode: "onChange",
    defaultValues: {
      firstName: admin?.first_name || "",
      lastName: admin?.last_name || "",
      address: admin?.address || "",
      email: admin?.email || "",
      phoneNumber: admin?.phone_number || "",
      role: admin?.roles?.[0] || "",
      company: "Joee Solution",
    },
  });
  const [isEdit, setIsEdit] = React.useState(true);
  const [isDisabled, setIsDisabled] = React.useState(true);

  // Update form values when admin data changes
  React.useEffect(() => {
    if (admin) {
      form.reset({
        firstName: admin.first_name || "",
        lastName: admin.last_name || "",
        address: admin.address || "",
        email: admin.email || "",
        phoneNumber: admin.phone_number || "",
        role: admin.roles?.[0] || "",
        company: "Joee Solution",
      });
    }
  }, [admin, form]);

  const onSubmit = async (payload: EditOrganizationSchemaType) => {
    setIsLoading(true);
    try {
      // Transform camelCase to snake_case for backend
      const updatePayload = {
        first_name: payload.firstName,
        last_name: payload.lastName,
        address: payload.address,
        email: payload.email,
        phone_number: payload.phoneNumber,
        role: payload.role,
        company: payload.company,
      };

      const response = await processRequestAuth("put", API_ENDPOINTS.UPDATE_ADMIN_PROFILE, updatePayload);
      
      // Check if update was successful
      const hasError = response?.error || response?.validationErrors || (response?.statusCode && response.statusCode >= 400);
      const isSuccess = (response?.success || response?.status) && !hasError;
      
      if (!isSuccess || hasError) {
        const errorMessage = response?.error || 
                            response?.validationErrors || 
                            response?.message || 
                            "Failed to update admin profile";
        toast.error(errorMessage);
        return;
      }

      // Success - show notification and re-enable disabled state
      toast.success("Admin profile updated successfully!");
      setIsDisabled(true);
      
      // Refresh the profile data
      mutate(API_ENDPOINTS.GET_ADMIN_PROFILE);
    } catch (error: any) {
      console.error("Error updating admin profile:", error);
      let errorMessage = "Failed to update admin profile";
      
      if (error?.response?.data) {
        errorMessage = error.response.data.error || 
                      error.response.data.validationErrors || 
                      error.response.data.message || 
                      errorMessage;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsDisabled((prev) => !prev);
  };

  return (
    <>
      <h2 className="font-bold text-base text-black mb-[30px]">
        Admin Profile
      </h2>
      <FormComposer form={form} onSubmit={onSubmit}>
        <div className="flex flex-col gap-[30px]">
          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            name="firstName"
            control={form.control}
            labelText="First Name"
            type="text"
            placeholder="Enter here"
            disabled={isDisabled}
          />
          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            type="text"
            name="lastName"
            control={form.control}
            labelText="Last Name"
            placeholder="Enter here"
            disabled={isDisabled}
          />
          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            name="address"
            control={form.control}
            labelText="Address"
            type="text"
            placeholder="Enter here"
            disabled={isDisabled}
          />

          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            type="text"
            name="email"
            control={form.control}
            labelText="Email"
            placeholder="Enter here"
            disabled={isDisabled}
          />

          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            type="text"
            name="phoneNumber"
            control={form.control}
            labelText="Phone number"
            placeholder="Enter here"
            disabled={isDisabled}
          />

          <FieldSelect
            bgSelectClass="bg-[#D9EDFF] border-[#D9EDFF]"
            name="role"
            control={form.control}
            options={orgStatus}
            labelText="Role"
            placeholder="Select"
            disabled={isDisabled}
          />
          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            name="company"
            control={form.control}
            labelText="Company"
            type="text"
            placeholder="Enter here"
            disabled={isDisabled}
          />

          <div className="flex items-center gap-7">
            {/* <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="h-[60px] bg-[#003465] text-base font-medium text-white rounded w-full">
                  Edit <Edit size={20} />
                </Button>
              </AlertDialogTrigger>
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
                  <AlertDialogAction className="h-[60px] w-[291px] bg-[#3FA907] text-white font-medium text-base">
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog> */}

            {isDisabled ? (
              <Button
                onClick={handleEdit}
                type="button"
                className="h-[60px] bg-[#003465] text-base font-medium text-white rounded w-full"
              >
                Edit <Edit size={20} />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isLoading}
                className="h-[60px] bg-[#003465] text-base font-medium text-white rounded w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <Spinner className="w-5 h-5" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save
                      <Check size={20} />
                    </>
                  )}
                </span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              className="h-[60px] border border-[#EC0909] text-base font-normal text-[#D40808] rounded w-full"
            >
              Delete <Trash2 size={24} />
            </Button>
          </div>
        </div>
      </FormComposer>
    </>
  );
}
