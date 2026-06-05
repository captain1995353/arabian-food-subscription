import type { Metadata } from "next";
import { Playfair_Display, Inter, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-playfair",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
const naskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  variable: "--font-naskh",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arabian Food Subscription | Weekly Halal Deshi Meals in South Korea",
  description:
    "Weekly and monthly halal food subscriptions for foreigners living in South Korea. Fresh home-style Deshi (Bangladeshi) meals delivered to your door every week.",
  keywords: [
    "halal food subscription Korea",
    "deshi food delivery Korea",
    "bangladeshi food Korea",
    "weekly meal subscription",
    "foreigners Korea food",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${naskh.variable}`}>
      <body>{children}</body>
    </html>
  );
}
