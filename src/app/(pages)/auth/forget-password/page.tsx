"use client";
import { Button, Input, Tooltip } from "antd";
import { Eye, EyeSlash, InfoCircle } from "iconsax-react";
import Image from "next/image";
import React, { useState } from "react";

 export const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <>
      <div className="container grid place-items-center">
        <div className="form grid items-center justify-center space-y-4 bg-[#5882C17D] rounded-md border border-blue-500 text-white">
          <div className="orgDeatails flex flex-col items-center justify-center gap-4">
            <h2 className="login">Forget Password?</h2>
            <span className="">Enter your email for instructions</span>
          </div>
          <form
            action=""
            className="grid w-full max-w-[648px] text-white"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid gap-[6px] mb-7">
              <label htmlFor="login-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="login-email"
                size="large"
                placeholder="username@gmail.com"
                type="email"
                name="email"
                value={email}
                // onChange={}
                className="text-gray-700"
                suffix={
                  <Tooltip
                    className="text-center"
                    title="Enter your email address."
                  >
                    <InfoCircle size={16} className="text-gray-400" />
                  </Tooltip>
                }
              />
            </div>
            <Button
              type="primary"
              size="large"
              className="font-medium mb-3"
              htmlType="submit"
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
