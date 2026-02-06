import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Alloy (All in one)",
  description: "Alloy (All in one) — merchant POV billing MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const chargebeeSite = process.env.NEXT_PUBLIC_CHARGEBEE_JS_SITE ?? "hp-demo-test";
  return (
    <html lang="en">
      <body className="text-[17px] md:text-[18px]">
        <Script
          id="chargebee-js"
          src="https://js.chargebee.com/v2/chargebee.js"
          strategy="afterInteractive"
          data-cb-site={chargebeeSite}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

