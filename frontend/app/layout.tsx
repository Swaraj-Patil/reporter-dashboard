import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Reporter Dashboard Web App",
  description: "A research-oriented prototype dashboard that demonstrates how reporters can receive timely feedback and visible evidence of impact on the issues they submit. This project is inspired by Designing Fictions for Collective Civic Reporting of Privacy Harms and is intended as a demo for research discussion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
