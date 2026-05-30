import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "react-hot-toast"

export const metadata: Metadata = {
  title: "Club Football — Gestion",
  description: "Application de gestion de club de football",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Toaster position="top-right" toastOptions={{
          style: { borderRadius: "12px", background: "#212529", color: "#fff", fontSize: "14px" },
          success: { iconTheme: { primary: "#2e8b57", secondary: "#fff" } },
        }} />
      </body>
    </html>
  )
}
