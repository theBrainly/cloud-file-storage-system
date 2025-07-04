"use client"
import { FileManager } from "@/components/file-manager"
import { AuthProvider, useAuth } from "@/components/auth-provider"
import { AuthWrapper } from "@/components/auth-wrapper"
import { Toaster } from "@/components/ui/toaster"

function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthWrapper />
  }

  return <FileManager />
}

export default function Page() {
  return (
    <AuthProvider>
      <HomePage />
      <Toaster />
    </AuthProvider>
  )
}
