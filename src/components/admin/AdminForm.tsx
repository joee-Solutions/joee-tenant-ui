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
  Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import FieldBox from "../shared/form/FieldBox";
import ProfileImageUploader from "../ui/ImageUploader";
import { useRouter } from "next/navigation";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { tr } from "date-fns/locale";
import { Input } from "../ui/input";

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
  profileImage: z.string().optional(),
  password: z.string().min(1, "This field is required"),
  address: z.string().optional(),
});

type AdminFormSchemaType = z.infer<typeof AdminFormSchema>;

const orgStatus = ["Admin", "Super_Admin", "User"];

export default function AdminForm() {
  const form = useForm<AdminFormSchemaType>({
    resolver: zodResolver(AdminFormSchema),
    mode: "onChange",
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "0818888888",
      role: "",
      company: "Joee Solution",
      password: "",
      address: "",
    },
  });
  const [isOpen, setIsOpen] = React.useState(false);

  const onSubmit = async (payload: AdminFormSchemaType) => {
    console.log('Submitting payload:', payload);
    try {
      await processRequestAuth('post', API_ENDPOINTS.ADD_SUPER_ADMIN, payload);
      form.reset();
      console.log("Admin created successfully");

    } catch (error) {
      console.error("Error creating admin:", error);
    }
  };
  const [showPassword, setShowPassword] = React.useState(false);
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
          <ProfileImageUploader />
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
            <label htmlFor="login-password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="login-password"
                type={showPassword ? "text" : "password"}
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
            Submit
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
                    You have successfully saved changes
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction className="h-[60px] w-[291px] bg-[#3FA907] text-white font-medium text-base">
                    <button
                      onClick={() => router.push("/dashboard/admin/list")}
                    >
                      Continue
                    </button>
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
