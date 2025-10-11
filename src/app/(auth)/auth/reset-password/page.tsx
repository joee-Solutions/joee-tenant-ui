import React, { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

const ResetPassword = () => {

  return (
    <Suspense>
      <ResetPasswordClient />;
    </Suspense>
  )

};

export default ResetPassword;
