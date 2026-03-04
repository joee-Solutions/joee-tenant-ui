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
  EyeClosedIcon,
  EyeOffIcon,
  KeyRound,
  Save,
  Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import FieldBox from "../shared/form/FieldBox";
import { useRouter } from "next/navigation";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { Input } from "../ui/input";
import { Spinner } from "../icons/Spinner";
import { toast } from "react-toastify";
import { useAdminProfile } from "@/hooks/swr";

const AdminFormSchema = z.object({
  first_name: z.string().min(1, "This field is required"),
  last_name: z.string().min(1, "This field is required"),
  email: z
    .string()
    .email("Invalid email address")
    .min(1, "This field is required"),

  role: z.string().min(1, "This field is required"),
  phone_number: z.string().min(1, "This field is required"),
  company: z.string().min(1, "This field is required"),
  password: z.string().min(1, "This field is required"),
  address: z.string().optional(),
});

type AdminFormSchemaType = z.infer<typeof AdminFormSchema>;

const orgStatus = ["Admin", "Super_Admin", "User"];

function generatePassword(length = 12): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const numbers = "23456789";
  const special = "!@#$%&*";
  const all = upper + lower + numbers + special;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  let pwd = pick(upper) + pick(lower) + pick(numbers) + pick(special);
  for (let i = pwd.length; i < length; i++) pwd += pick(all);
  return pwd
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export default function AdminForm() {
  const { data: adminData, isLoading: isAdminLoading } = useAdminProfile();
  const form = useForm<AdminFormSchemaType>({
    resolver: zodResolver(AdminFormSchema),
    mode: "onChange",
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      role: "",
      company: "",
      password: "",
      address: "",
    },
  });
  const [isOpen, setIsOpen] = React.useState(false);

  const onSubmit = async (payload: AdminFormSchemaType) => {
    try {
      // Match API contract exactly: first_name, last_name, email, password, phone_number, address, role
      const body: Record<string, string> = {
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        password: payload.password,
        phone_number: payload.phone_number,
        address: payload.address ?? "",
        role: payload.role,
      };
      const response = await processRequestAuth('post', API_ENDPOINTS.ADD_SUPER_ADMIN, body);
      
      // Check if admin creation was successful
      // Handle both success response format and error response format
      const hasError = response?.error || response?.validationErrors || (response?.statusCode && response.statusCode >= 400);
      const isSuccess = (response?.success || response?.status) && !hasError;
      
      if (!isSuccess || hasError) {
        // Extract error message from various possible locations
        const errorMessage = response?.error || 
                            response?.validationErrors || 
                            response?.message || 
                            "Failed to create admin";

                            
        // Check if it's a duplicate user error
        const isDuplicateError = errorMessage.toLowerCase().includes("user already exists") || 
                                 errorMessage.toLowerCase().includes("already exists") ||
                                 errorMessage.toLowerCase().includes("duplicate");
        
        if (isDuplicateError) {
          // Clear any previous errors first
          form.clearErrors();
          // Set error on email field (will display in red text under the field)
          form.setError("email", {
            type: "manual",
            message: errorMessage,
          });
        } else {
          // For other errors, show toast
          toast.error(errorMessage, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        }
        return;
      }

      // Send notification after successful admin creation
      try {
        const adminFullName = `${payload.first_name} ${payload.last_name}`;
        // Extract admin ID from the data (handle both single object and array)
        const currentAdminId = Array.isArray(adminData) 
          ? (adminData[0]?.id || 1)
          : (adminData?.id || 1);
        
        const notificationData = {
          title: "New Admin Created",
          message: `A new admin account has been created for ${adminFullName} (${payload.email}) with role: ${payload.role}`,
          type: "system",
          priority: "medium",
          userId: currentAdminId,
          metadata: {},
        };

        await processRequestAuth("post", API_ENDPOINTS.CREATE_NOTIFICATION, notificationData);
        console.log("Notification sent successfully for new admin creation");
      } catch (notificationError) {
        // Log notification error but don't fail the admin creation
        console.error("Error sending notification:", notificationError);
        // Optionally show a warning toast
        toast.warning("Admin created successfully, but notification could not be sent");
      }

      form.reset();
      toast.success("Admin created successfully.", {
        position: "top-right",
        autoClose: 4000,
      });
      setIsOpen(true);
    } catch (error: any) {
      console.error("Error creating admin:", error);
      
      // Extract error message from various possible locations in the error response
      let errorMessage = "Failed to create admin";
      
      if (error?.response?.data) {
        // Check for error in response.data
        errorMessage = error.response.data.error || 
                     error.response.data.validationErrors || 
                     error.response.data.message || 
                     errorMessage;
      } else if (error?.error) {
        // Direct error property
        errorMessage = error.error;
      } else if (error?.message) {
        // Error message property
        errorMessage = error.message;
      }
      
      // Check if it's a duplicate user error
      const isDuplicateError = errorMessage.toLowerCase().includes("user already exists") || 
                               errorMessage.toLowerCase().includes("already exists") ||
                               errorMessage.toLowerCase().includes("duplicate");
      
      if (isDuplicateError) {
        // Clear any previous errors first
        form.clearErrors();
        // Set error on email field (will display in red text under the field)
        form.setError("email", {
          type: "manual",
          message: errorMessage,
        });
      } else {
        // For other errors, show toast
        toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      }
    }
  };
  const [showPassword, setShowPassword] = React.useState(false);
  const handleGeneratePassword = () => {
    const pwd = generatePassword(12);
    form.setValue("password", pwd, { shouldValidate: true });
    toast.info("Password generated");
  };
  const handleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleEdit = () => { };
  const router = useRouter();
  return (
    <>
      <h2 className="font-bold text-base text-black mb-[30px]">
        Create New Admin
      </h2>
      <FormComposer form={form} onSubmit={onSubmit}>
        <div className="flex flex-col gap-[30px]">
          <div className="grid grid-cols-2 gap-5 items-start justify-center">
            <FieldBox
              bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
              name="first_name"
              control={form.control}
              labelText="First Name"
              type="text"
              placeholder="Enter First name "
            />
            <FieldBox
              bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
              type="text"
              name="last_name"
              control={form.control}
              labelText="Last Name"
              placeholder="Enter Last name"
            />
          </div>
          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            type="text"
            name="email"
            control={form.control}
            labelText="Email"
            placeholder="Enter email"
            autoComplete="off"
          />
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
            type="text"
            name="phone_number"
            control={form.control}
            labelText="Phone number"
            placeholder="Enter Phone number"
          />

          <FieldSelect
            bgSelectClass="bg-[#D9EDFF] border-[#D9EDFF]"
            name="role"
            control={form.control}
            options={orgStatus}
            labelText="Role"
            placeholder="Select"
          />
          <FieldBox
            bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
            name="company"
            control={form.control}
            labelText="Company"
            type="text"
            placeholder="Enter here"
          />
          <div className="grid gap-[6px]">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="create-admin-password" className="text-sm font-medium">
                Password
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGeneratePassword}
                className="h-9 shrink-0 gap-1.5 text-xs font-medium"
              >
                <KeyRound className="size-3.5" />
                Generate password
              </Button>
            </div>
            <Input
              id="create-admin-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...form.register("password")}
              icon={
                  showPassword ? (
                    <EyeOffIcon
                      className="size-5"
                      onClick={handleShowPassword}
                    />
                  ) : (
                    <EyeClosedIcon
                      className="size-5"
                      onClick={handleShowPassword}
                    />
                  )
                }
              placeholder="Enter Password"
              className="text-gray-700"
              error={form.formState.errors.password?.message}
            />
          </div>
            {/* <FieldBox
              bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
              name="password"
              control={form.control}
              labelText="Password"
              type="password"
              placeholder="Enter here"
            /> */}
          <Button className="h-[60px] bg-[#003465] text-base font-medium text-white rounded w-full" type="submit">
            {
              form.formState.isSubmitting ? <Spinner /> : <Save className="w-4 h-4" /> 
            }
          </Button>
          <div className="flex items-center gap-7">
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
              <AlertDialogTrigger asChild>

              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white flex flex-col items-center text-center">
                <AlertDialogHeader className="flex flex-col items-center">
                  <CheckCircle2 className="size-[100px] fill-[#3FA907] text-white" />
                  <AlertDialogTitle className="font-medium text-[#3FA907] text-4xl">
                    Success
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-normal text-base text-[#737373]">
                    Admin has been created successfully.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction
                    className="h-[60px] w-[291px] bg-[#3FA907] text-white font-medium text-base"
                    onClick={() => router.push("/dashboard/admin/list")}
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* <Button
              onClick={handleEdit}
              type="button"
              className="h-[60px] bg-[#003465] text-base font-medium text-white rounded w-full"
            >
              Submit
            </Button> */}
          </div>
        </div>
      </FormComposer>
    </>
  );
}
