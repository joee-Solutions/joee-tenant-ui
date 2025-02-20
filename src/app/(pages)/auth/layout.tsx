
import React from "react";

// didn't export this layout
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <main className="w-full relative min-h-[100vh] grid place-items-center p-5 md:p-8 [background:radial-gradient(#0085FF,#003465)]">
      <div className="auth-container w-full relative px-5 md:px-8 py-8 flex flex-col place-items-center">
        {children}
        <p className="footer fixed left-40 text-gray-400 bottom-40">
          Copywright © 2025 JOEE Solutions. All Rights Reserved
        </p>
      </div>
    </main>
  );
}