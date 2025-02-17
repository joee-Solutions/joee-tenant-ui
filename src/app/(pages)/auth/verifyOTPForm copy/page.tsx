import { Button } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react'
import OTPInput from 'react-otp-input';

const VerifyOTP = () => {

  const [OTP, setOTP] = useState("");

  return (
    <div className="grid items-center justify-center space-y-4 bg-[#5882C17D] rounded-md border border-blue-500 text-white">
      <div className="orgDeatails flex flex-col items-center justify-center gap-4">
        <Image
          src="/assets/auth/reset-password.png"
          width={20}
          height={20}
          alt="logo"
          className="logo"
        />
        <h2 className="login">Enter Verification Code</h2>
        <span className="">We've sent a code to your email</span>
      </div>
      <form
        action=""
        id="signup-otp-form"
        className="[--size:large] flex flex-col gap-7 mb-3"
        onSubmit={(e) => e.preventDefault()}
      >
        <OTPInput
          value={OTP}
          onChange={() => setOTP("")}
          numInputs={4}
          inputType="number"
          containerStyle={{ gap: ".5rem" }}
          inputStyle={{}}
          renderInput={(props) => <input {...props} id="otp-input" />}
        />
        <Button
          type="primary"
          block
          size="large"
          htmlType="submit"
          //   onClick={}
        >
          Verify
        </Button>
      </form>
      <div className="extra-details flex justify-center gap-2 text-xs md:text-sm mb-7">
        Didn't receive the email?
        <Link href={""} className="text-brand-400 hover:underline">
          Click to resend?
        </Link>
      </div>
    </div>
  );
}

export default VerifyOTP;

