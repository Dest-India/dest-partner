import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata = {
  title: "Dest Partner",
  description:
    "Join Dest and connect with thousands of sports enthusiasts looking for Academies, GYMs, and Turfs like yours.",
  keywords: [
  "Dest",
  "Dest.co.in",
  "sports booking",
  "sports platform India",
  "sports facility booking",
  "sports academy booking",
  "gym membership booking",
  "turf booking",
  "sports courts booking",
  "book sports near me",
  "sports courses booking",
  "sports membership platform",
  "fitness center reservations",
  "athlete training booking",
  "sports facility management",
  "sports partners platform",
  "sports booking app",
  "sports network India",
  "play sports near me",
  "sports academies",
  "top academies booking",
  "book football turf",
  "book basketball court",
  "book tennis court",
  "book gym membership",
  "gym and fitness booking",
  "sports training programs",
  "sports classes India",
  "sports coaching platform",
  "reserve sports venues",
  "sports scheduler",
  "sports community platform",
  "sports events booking",
  "sports facility directory",
  "sports partner signup",
  "sports enthusiast platform",
  "for sports enthusiasts",
  "find gyms and courts",
  "fitness seekers",
  "team sports booking",
  "individual sports booking",
  "sports lovers platform",
  "join sports community",
  "sports partner registration",
  "book fitness classes",
  "health & fitness booking",
  "sport booking services",
  "sports booking India",
  "sports app India",
  "sports services India",
  "sports marketplace India",
  "book sports facilities India",
  "Indian sports booking site",
  "Dest sports platform",
  "Dest sports booking platform",
  "Dest partners",
  "Dest community",
  "Dest sports services",
  "how to book sports facilities online",
  "best site to book gyms and turfs",
  "sports training booking online India",
  "reserve gym membership instantly",
  "connect with sports academies",
  "manage sports bookings online",
  "affiliate sports partners",
  "sports business growth platform",
  "sports booking software",
  "sports reservation system",
  "sports management platform",
  "online booking platform",
  "digital sports marketplace",
  "mobile friendly sports site",
  "user account sports booking",
  "secure online reservation sports"
],
  openGraph: {
    title: "Dest Partner",
    description:
      "Join Dest and connect with thousands of sports enthusiasts looking for Academies, GYMs, and Turfs like yours.",
    type: "website",
    url: "https://dest.co.in",
    siteName: "Dest Partner",
    images: [
      {
        url: "https://dest.co.in/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dest Website",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dest Partner",
    description:
      "Join Dest and connect with thousands of sports enthusiasts looking for Academies, GYMs, and Turfs like yours.",
    images: ["https://dest.co.in/og-image.png"],
    creator: "@01_kartic",
  },
};

export default function RootLayout({ children }) {
  return (
      <html lang="en" suppressHydrationWarning>
        <head />
        <body>
          <ThemeProvider attribute="class" defaultTheme="light">
            {children}
            <Toaster />
          </ThemeProvider>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
  );
}
