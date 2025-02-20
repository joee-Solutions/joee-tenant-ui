"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeSlash, InfoCircle } from "iconsax-react";
import Image from "next/image";
import React, { useState } from "react";

 const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <>
      <div className="font-poppins container grid place-items-center  bg-[#5882C17D] shadow-lg rounded-2xl border border-blue-500 text-white w-full max-w-[350px] md:max-w-[450px] md:px-8 px-8 py-20 ">
        <div className="form flex flex-col items-center justify-center space-y-12 ">
          <div className="orgDeatails text-center flex flex-col items-center justify-center gap-4">
            <h2 className="login font-bold text-2xl md:text-3xl">
              Forget Password?
            </h2>
            <span className="text-base">Enter your email for instructions</span>
          </div>
          <form
            action=""
            className="grid w-full max-w-[648px] text-white"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid gap-[6px] mb-7">
              <label htmlFor="login-email" className="text-sm ">
                Email
              </label>
              <Input
                id="login-email"
                placeholder="Enter your email here"
                type="email"
                name="email"
                value={email}
                // onChange={}
                className="text-gray-400"
              />
            </div>
            <Button
              className="font-medium mt-3 bg-[#003465]"
              //   onClick={}
            >
              Reset Password
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ForgetPassword;