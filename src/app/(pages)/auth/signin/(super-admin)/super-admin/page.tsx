"use client"
import { Button, Input, Tooltip } from 'antd';
import { Eye, EyeSlash, InfoCircle } from 'iconsax-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react'

const SuperAdminLogin = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState<boolean>(false);


  return (
    <React.Fragment>
      <div className="container grid grid-cols-1 md:grid-cols-2">
        <div className="content flex flex-col gap-12 text-white">
          <h1 className="header font-bold text-4xl md:text-6xl">Welcome!</h1>
          <div className="line border-3 border-white"></div>
          <div className="welcom text-base">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Qui
            repudiandae, saepe reprehenderit voluptate at a ipsum atque quod
            debitis. Excepturi magnam officia soluta ex at. Iusto fugiat numquam
            error doloremque?
          </div>
        </div>
        <div className="form grid items-center justify-center space-y-4 bg-[#5882C17D] rounded-md border border-blue-500">
          <div className="orgDeatails flex flex-col items-center justify-center gap-4">
            <Image src="" alt="logo" width={20} height={20} className="logo" />
            <h3 className="">
              <strong>LociCare</strong>by Joee
            </h3>
          </div>
          <h2 className="login">Login</h2>
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
            <div className="grid gap-[6px] mb-3">
              <label htmlFor="login-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="login-password"
                value={password}
                type={showPassword ? "text" : "password"}
                name="password"
                size="large"
                placeholder="Enter Password"
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
            <div className="extra-details flex justify-between text-xs md:text-sm mb-7">
              <Link
                href={"/auth/forgot-password"}
                className="text-brand-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button
              type="primary"
              size="large"
              className="font-medium mb-3"
              htmlType="submit"
              //   onClick={}
            >
              Login
            </Button>
          </form>
        </div>
      </div>
    </React.Fragment>
  );
}

export default SuperAdminLogin;