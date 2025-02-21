"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const VerifyOTP = () => {
  const [OTP, setOTP] = useState("");

  return (
    <div className="font-poppins container grid place-items-center  bg-[#5882C17D] shadow-lg rounded-2xl border border-blue-500 text-white w-full max-w-[350px] md:max-w-[450px] md:px-8 px-8 py-20 ">
      <div className="form flex flex-col items-center justify-center space-y-8">
        <div className="orgDeatails text-center flex flex-col items-center justify-center gap-2">
          <Image
            src="/assets/auth/otp.png"
            width={80}
            height={60}
            alt="logo"
            className="logo mb-2"
          />
          <h2 className="login font-bold text-2xl md:text-xl">
            Enter Verification Code
          </h2>
          <span className="text-base">We've sent a code to your email</span>
        </div>

        <form
          action=""
          id="signup-otp-form"
          className="[--size:large] flex flex-col gap-7 mb-3"
          onSubmit={(e) => e.preventDefault()}
        >
          <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS_AND_CHARS}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <Button
            className="font-medium text-md my-3 bg-[#003465]"
            //   onClick={}
          >
            Verify
          </Button>
        </form>
      </div>

      <div className="extra-details flex justify-center gap-2 text-xs md:text-sm mb-7">
        Didn't receive the email?
        <Link href={""} className="text-brand-400 hover:underline">
          Click to resend?
        </Link>
      </div>
    </div>
  );
};

export default VerifyOTP;
