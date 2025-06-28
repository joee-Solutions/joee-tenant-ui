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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/assets/logo/logo.png" />
      </head>
      <body className=" font-poppins">
        <TenantStoreProvider>{children}</TenantStoreProvider>
      </body>
    </html>
  );
}
