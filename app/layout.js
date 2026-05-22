import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://elitecrew.example.com"),
  title: {
    default: "EliteCrew — Expert Home Services at Your Doorstep",
    template: "%s | EliteCrew",
  },
  description: "Book verified AC technicians, electricians, and home appliance experts in minutes. Transparent pricing, no surprises.",
  keywords: ["home services", "AC repair", "electrician", "plumber", "cleaning", "home maintenance"],
  authors: [{ name: "EliteCrew" }],
  openGraph: {
    title: "EliteCrew — Expert Home Services",
    description: "Book verified AC technicians, electricians, and home appliance experts in minutes.",
    url: "https://elitecrew.example.com",
    siteName: "EliteCrew",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EliteCrew — Expert Home Services",
    description: "Book verified AC technicians, electricians, and home appliance experts in minutes.",
    images: ["/icon.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
