import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import React from "react";

export const metadata: Metadata = {
  title: "Tenant Login | Joee Solutions ",
  description: "Welcome to Joee Solutions",
};

function TenantLoginLayout ({children}: any){
    return(
        <React.Fragment>
        <NextTopLoader color="#000" showSpinner={false}/>
        {children}
        </React.Fragment>
    )
}

export default TenantLoginLayout;
