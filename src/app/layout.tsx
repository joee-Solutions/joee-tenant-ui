import type { Metadata } from "next";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { TenantStoreProvider } from "@/contexts/AuthProvider";

export const metadata: Metadata = {
  title: "Joee Solutions",
  description: "Your health is our priority",
  icons: {
    icon: "/assets/logo/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className=" font-poppins">
        <TenantStoreProvider>{children}</TenantStoreProvider>
      </body>
    </html>
  );
}
