import type { Metadata } from "next";
import "../globals.css";


export const metadata: Metadata = {
  title: "Microdata Store",
  description: "Belanja Elektronik dengan Mudah dan Cepat",
};

export default function RootLayout({children,}: Readonly<{children: React.ReactNode;}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
