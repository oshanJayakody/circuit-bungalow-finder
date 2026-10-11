import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Circuit Bungalow Finder",
  description: "Find government circuit bungalows across Sri Lanka.",
};

const themeScript = `(function(){try{var t=localStorage.getItem('cbf-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
