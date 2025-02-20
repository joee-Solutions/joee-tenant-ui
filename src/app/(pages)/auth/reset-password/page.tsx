"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeSlash, InfoCircle } from "iconsax-react";
import Image from "next/image";
import React, { useState } from "react";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <React.Fragment>
      <div className="font-poppins container grid place-items-center  bg-[#5882C17D] shadow-lg rounded-2xl border border-blue-500 text-white w-full max-w-[350px] md:max-w-[450px] md:px-8 px-8 py-20 ">
        <div className="form flex flex-col items-center justify-center space-y-12">
          <div className="orgDeatails flex flex-col items-center justify-center gap-4">
            <Image
              src="/assets/auth/reset-password.png"
              width={30}
              height={20}
              alt="logo"
              className="logo"
            />
            <h2 className="login font-bold text-2xl md:text-3xl">
              Enter New Password
            </h2>
            <span className="text-base">
              Enter and confirm your new password
            </span>
          </div>
          <form
            action=""
            className="w-full text-white flex flex-col space-y-6"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid gap-[6px]">
              <label htmlFor="new-password" className="text-sm ">
                Password
              </label>
              <Input
                id="new-password"
                value={password}
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter New Password"
                className="text-gray-700"
              />
            </div>
            <div className="grid gap-[6px]">
              <label htmlFor="confirm-password" className="text-sm ">
                Confirm Password
              </label>
              <Input
                id="confirm-password"
                value={password}
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Confirm Password"
                className="text-gray-400"
              />
            </div>
            <Button
              className="font-medium text-md mt-3 bg-[#003465]"

              //   onClick={}
            >
              Submit
            </Button>
          </form>
        </div>
      </div>
    </React.Fragment>
  );
};


export default ResetPassword;