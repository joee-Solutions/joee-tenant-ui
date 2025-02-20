"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeSlash, InfoCircle } from "iconsax-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

const TenantLoginPage = () => {
  const [state, setState] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState((prev) => ({ ...prev, [name]: value }));
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-24  items-center justify-center font-poppins place-items-center">
      <div className="content col-span-1 text-white hidden md:flex flex-col justify-center space-y-8">
        <h1 className="header font-bold text-4xl md:text-8xl">Welcome!</h1>
        <div className="line border-2 border-white w-40"></div>
        <div className="line border-3 border-white"></div>
        <span className="welcom md:w-3/4 text-lg leading-8">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui
          repudiandae, saepe reprehenderit voluptate at a ipsum atque quod
          debitis. Excepturi magnam officia soluta ex at. Iusto fugiat numquam
          error doloremque?
        </span>
      </div>
      <div className=" col-span-1 shadow-lg rounded-2xl  border border-blue-500 text-white w-full max-w-[350px] md:max-w-[550px] md:px-8 px-8 py-20">
        <div className="form flex flex-col px-12 md:px-20  items-center justify-center space-y-4  ">
          <div className="orgDeatails flex flex-col items-center justify-center gap-4">
            <Image
              alt="logo"
              src="/assets/auth/otp.png"
              width={80}
              height={60}
              className="logo"
            />
            <span className=" ">
              <span className="font-medium text-2xl md:text-3xl">LociCare</span>
              by Joee
            </span>
          </div>
          <form
            action=""
            className="grid w-full text-white"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="grid gap-[6px] mb-7">
              <label htmlFor="login-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="login-email"
                placeholder="username@gmail.com"
                type="email"
                name="email"
                value={state.email}
                onChange={handleChange}
                className="text-gray-700"
              />
            </div>
            <div className="grid gap-[6px] mb-3">
              <label htmlFor="login-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="login-password"
                value={state.password}
                type={showPassword ? "text" : "password"}
                name="password"
                onChange={handleChange}
                placeholder="Enter Password"
                className="text-gray-700"
              />
            </div>
            <div className="extra-details flex justify-between text-xs md:text-sm mb-7">
              <Link
                href={"/auth/forgot-password"}
                className="text-[#FAD900] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button
              className="font-medium mb-3 bg-[#003465]"
              //   onClick={}
            >
              Login
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TenantLoginPage;
