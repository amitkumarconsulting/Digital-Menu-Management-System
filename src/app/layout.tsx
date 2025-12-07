import "~/app/globals.css";
import { Providers } from "./providers";
import { Toaster } from "~/components/ui/toaster";

export const metadata = {
  title: "Digital Menu Management System",
  description: "Manage your restaurant menus digitally",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

