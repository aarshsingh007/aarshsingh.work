import type { Metadata, Viewport } from "next";
import { PRELOADER_STORAGE_KEY } from "@/components/preloader/Preloader";
import ToolTrail from "@/components/ToolTrail";
import { site } from "@/data/site";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.seo.title, template: site.seo.titleTemplate },
  description: site.seo.description,
  keywords: [...site.seo.keywords],
  authors: [{ name: site.name }],
  creator: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    title: site.seo.title,
    description: site.seo.description,
    locale: "en_IN",
  },
  twitter: {
    card: "summary",
    title: site.seo.title,
    description: site.seo.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  colorScheme: "light",
};

/*
 * Runs before first paint: if the intro was already seen this session,
 * hide the server-rendered overlay immediately so there is no flash.
 */
const sessionGate = `try{if(sessionStorage.getItem(${JSON.stringify(
  PRELOADER_STORAGE_KEY
)})==="1")document.documentElement.dataset.preloader="skip"}catch(e){}`;

/* Without JS: no preloader, and every entrance-animated element is visible. */
const noJsStyles = `[data-preloader-root]{display:none!important}[data-animate]{opacity:1!important;transform:none!important}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables} data-preloader="pending" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: sessionGate }} />
        <noscript>
          <style>{noJsStyles}</style>
        </noscript>
      </head>
      <body>
        {children}
        <ToolTrail />
      </body>
    </html>
  );
}
