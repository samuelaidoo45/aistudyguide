import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "TopicSimplify",
  description: "Reduce Your Study Time with TopicSimplify",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Define your Organization structured data for Google
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TopicSimplify",
    "url": "https://www.topicsimplify.com", // update with your actual domain
    "logo": "https://www.topicsimplify.com/images/logo.png" // update with your logo URL
  };

  return (
    <html lang="en">
      <meta name="google-adsense-account" content="ca-pub-3715172247216449"></meta>
      <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
     
        {children}
      </body>
    </html>
  );
}
