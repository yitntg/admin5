import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { AuthProvider } from "@/components/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "电商管理系统",
  description: "现代化电商管理平台",
  icons: {
    icon: [
      {
        url: 'https://raw.githubusercontent.com/vercel/next.js/canary/examples/blog-starter/public/favicon/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex min-h-screen bg-gray-50">
            <Navigation />
            <main className="flex-1 ml-64 min-h-screen bg-gray-50 pb-10">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
} 