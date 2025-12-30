import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./theme-provider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://rhen-fashion.vercel.app"), // Replace with your actual domain
  title: {
    default: "Rhen | Luxury Fashion & Style",
    template: "%s | Rhen",
  },
  description:
    "Discover unique pieces from our exclusive collection. Rhen brings you the future of fashion with hand-picked items you won't find anywhere else.",
  keywords: ["fashion", "luxury", "streetwear", "exclusive", "rhen store"],
  authors: [{ name: "Rhen Team" }],
  openGraph: {
    title: "Rhen | Luxury Fashion & Style",
    description: "Discover unique pieces from our exclusive collection.",
    siteName: "Rhen",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rhen | Luxury Fashion & Style",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}