"use client";
import { Button, Input, Tooltip } from "antd";
import { Eye, EyeSlash, InfoCircle } from "iconsax-react";
import Image from "next/image";
import React, { useState } from "react";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <React.Fragment>
      <div className="container grid place-items-center">
        <div className="form grid items-center justify-center space-y-4 bg-[#5882C17D] rounded-md border border-blue-500 text-white">
          <div className="orgDeatails flex flex-col items-center justify-center gap-4">
            <Image
              src="/assets/auth/reset-password.png"
              width={20}
              height={20}
              alt="logo"
              className="logo"
            />
            <h2 className="login">Enter New Password</h2>
            <span className="">Enter and confirm your new password</span>
          </div>
          <form
            action=""
            className="grid w-full max-w-[648px] text-white"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid gap-[6px] mb-3">
              <label htmlFor="new-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="new-password"
                value={password}
                type={showPassword ? "text" : "password"}
                name="password"
                size="large"
                placeholder="Enter New Password"
                className="text-gray-700"
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <Eye
                        size={16}
                        className="text-brand-500"
                        variant="Bold"
                      />
                    ) : (
                      <EyeSlash
                        size={16}
                        className="text-gray-400"
                        variant="Bold"
                      />
                    )}
                  </button>
                }
              />
            </div>
            <div className="grid gap-[6px] mb-3">
              <label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm Password
              </label>
              <Input
                id="confirm-password"
                value={password}
                type={showPassword ? "text" : "password"}
                name="password"
                size="large"
                placeholder="confirm Password"
                className="text-gray-700"
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <Eye
                        size={16}
                        className="text-brand-500"
                        variant="Bold"
                      />
                    ) : (
                      <EyeSlash
                        size={16}
                        className="text-gray-400"
                        variant="Bold"
                      />
                    )}
                  </button>
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
              Submit
            </Button>
          </form>
        </div>
      </div>
    </React.Fragment>
  );
};


export default ResetPassword;