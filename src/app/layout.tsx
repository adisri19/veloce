import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    template: "%s · Veloce ATS",
    default: "Veloce ATS | Enterprise Applicant Tracking System",
  },
  description:
    "Category-defining, high-velocity applicant tracking system with ACID relational pipeline, deterministic AI match scoring, and SLA tracking.",
  openGraph: {
    title: "Veloce ATS | Enterprise Applicant Tracking System",
    description:
      "Enterprise ATS with ACID relational pipeline, deterministic AI match scoring, and SLA tracking.",
    type: "website",
    siteName: "Veloce ATS",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('veloce_theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'dark' || (!stored && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-canvas text-fg antialiased selection:bg-primary/20 selection:text-primary">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
