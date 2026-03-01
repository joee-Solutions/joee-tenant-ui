import type { Metadata } from "next";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="apple-touch-icon" href="/assets/logo/logo.png" />
      </head>
      <body className="font-poppins" suppressHydrationWarning>
        <TenantStoreProvider>
          {children}
          <ToastContainer position="top-right" autoClose={4000} />
        </TenantStoreProvider>
      </body>
    </html>
  );
}
