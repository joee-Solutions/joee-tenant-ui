import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as zod from "zod";
import FormComposer from "../shared/form/FormComposer";
import FieldBox from "../shared/form/FieldBox";
import { Button } from "../ui/button";
import { PlusSquareIcon, EyeOffIcon, EyeClosedIcon } from "lucide-react";
import { processRequestAuth } from "@/framework/https";
import { API_ENDPOINTS } from "@/framework/api-endpoints";
import { toast } from "react-toastify";
import React from "react";
import { generateRandomPassword } from "@/lib/utils";

const changePasswordSchema = zod.object({
  oldPassword: zod.string().min(1, "This field is required"),
  newPassword: zod.string().min(1, "This field is required"),
  confirmPassword: zod.string().min(1, "This field is required"),
});

type ChangePasswordSchemaType = zod.infer<typeof changePasswordSchema>;
export default function ChnagePasswordComponent() {
  const [loading, setLoading] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const form = useForm<ChangePasswordSchemaType>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleGeneratePassword = () => {
    const randomPassword = generateRandomPassword();
    form.setValue("newPassword", randomPassword, { shouldValidate: true });
    form.setValue("confirmPassword", randomPassword, { shouldValidate: true });
    toast.info("Random password generated");
  };

  const onSubmit = async (payload: ChangePasswordSchemaType) => {
    if (payload.newPassword !== payload.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await processRequestAuth(
        "post",
        API_ENDPOINTS.CHANGE_PASSWORD,
        {
          oldPassword: payload.oldPassword,
          newPassword: payload.newPassword,
        }
      );
      if (res?.success) {
        toast.success(res.message || "Password changed successfully");
        form.reset();
      } else {
        toast.error(res?.message || "Failed to change password");
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err && err.response && typeof err.response === "object" && "data" in err.response) {
        // @ts-expect-error: dynamic error object from axios, may not be typed
        toast.error(err.response.data?.message || "Failed to change password");
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to change password");
      }
    } finally {
      setLoading(false);
    }
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
            name="oldPassword"
            control={form.control}
            labelText="Old Password"
            type="password"
            placeholder="Enter password here"
          />
          <div className="flex items-end gap-2">
            <div className="flex-1 relative overflow-hidden">
              <FieldBox
                bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                control={form.control}
                labelText="New password"
                placeholder="Enter Password here"
              />
              <button
                type="button"
                className="absolute right-3 inset-y-0 h-32 flex items-center text-gray-500"
                onClick={() => setShowNewPassword((v) => !v)}
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOffIcon size={18} /> : <EyeClosedIcon size={18} />}
              </button>
            </div>
            <Button type="button" variant="outline" onClick={handleGeneratePassword} className="h-[42px] whitespace-nowrap">
              Generate
            </Button>
          </div>
          <div className="relative ">
            <FieldBox
              bgInputClass="bg-[#D9EDFF] border-[#D9EDFF]"
              name="confirmPassword"
              control={form.control}
              labelText="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Enter Password here"
            />
            <button
              type="button"
              className="absolute right-3 inset-y-0 h-32 flex items-center text-gray-500"
              onClick={() => setShowConfirmPassword((v) => !v)}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOffIcon size={18} /> : <EyeClosedIcon size={18} />}
            </button>
          </div>

          <div className="flex items-center gap-7">
            <Button
              type="submit"
              className="h-[60px] bg-[#003465] text-base font-medium text-white rounded w-full"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save changes"} <PlusSquareIcon size={20} />
            </Button>
          </div>
        </div>
      </FormComposer>
    </>
  );
}
