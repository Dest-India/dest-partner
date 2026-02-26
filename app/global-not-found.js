import Link from "next/link"
import "./globals.css"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist.',
}

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <div className="flex flex-col items-center justify-center gap-6 h-dvh px-4 py-12">
          <div className="space-y-3">
            <h1 className="text-8xl font-bold font-mono text-center animate-bounce">404</h1>
            <h2 className="text-center uppercase">Page Not Found</h2>
            <p className="text-muted-foreground">The page you are looking for does not exist.</p>
          </div>
          <Link href="/home">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </body>
    </html>
  )
}