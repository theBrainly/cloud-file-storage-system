"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Download, Eye, Lock, Calendar, HardDrive, AlertTriangle, Cloud, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface SharedFile {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  thumbnailUrl?: string
  allowDownload: boolean
  allowPreview: boolean
  requiresPassword: boolean
  expiresAt?: string
  virusScanStatus: string
}

export default function SharedFilePage({ params }: { params: { shareId: string } }) {
  const [file, setFile] = useState<SharedFile | null>(null)
  const [password, setPassword] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const loadSharedFile = async () => {
      try {
        const response = await fetch(`/api/shared/${params.shareId}`)
        if (response.ok) {
          const data = await response.json()
          setFile(data.file)
          setAuthenticated(!data.file.requiresPassword)
        } else {
          setError("File not found or link has expired")
        }
      } catch (error) {
        setError("Failed to load shared file")
      } finally {
        setLoading(false)
      }
    }

    loadSharedFile()
  }, [params.shareId])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/shared/${params.shareId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        setAuthenticated(true)
        toast({
          title: "Access granted",
          description: "You can now view and download the file",
        })
      } else {
        toast({
          title: "Invalid password",
          description: "Please check your password and try again",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Authentication failed",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async () => {
    if (!file?.allowDownload) return

    try {
      const response = await fetch(`/api/shared/${params.shareId}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: file.requiresPassword ? password : undefined }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = file.name
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Download started",
          description: `Downloading ${file.name}`,
        })
      } else {
        throw new Error("Download failed")
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the file",
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const isExpired = file?.expiresAt && new Date(file.expiresAt) < new Date()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared file...</p>
        </div>
      </div>
    )
  }

  if (error || !file) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="p-4 bg-red-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">File Not Available</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to CloudStore
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="p-4 bg-orange-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Calendar className="h-10 w-10 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h2>
          <p className="text-gray-600 mb-6">This share link has expired and is no longer accessible.</p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to CloudStore
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md mx-auto p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">CloudStore</h1>
            </div>
          </div>

          <Card>
            <CardHeader className="text-center">
              <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle>Password Required</CardTitle>
              <p className="text-sm text-gray-600">This file is password protected</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Access File
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CloudStore</h1>
                <p className="text-xs text-gray-500">Shared File</p>
              </div>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to CloudStore
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-gray-900">{file.name}</CardTitle>
                  <p className="text-gray-600 mt-1">Shared on {new Date(file.uploadedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  {file.virusScanStatus === "clean" && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      ✓ Virus Free
                    </Badge>
                  )}
                  {file.expiresAt && (
                    <Badge variant="outline">Expires {new Date(file.expiresAt).toLocaleDateString()}</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Preview Area */}
                <div className="lg:col-span-2">
                  {file.allowPreview ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-8">
                      {file.type.startsWith("image/") && file.thumbnailUrl && (
                        <img
                          src={file.thumbnailUrl || "/placeholder.svg"}
                          alt={file.name}
                          className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                        />
                      )}
                      {!file.type.startsWith("image/") && (
                        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                          <div className="text-center">
                            <div className="text-4xl mb-4 p-4 bg-white rounded-full shadow-sm inline-block">
                              {file.name.split(".").pop()?.toUpperCase()}
                            </div>
                            <p className="text-gray-600">Preview not available for this file type</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center bg-gray-50">
                      <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Preview is disabled for this file</p>
                    </div>
                  )}
                </div>

                {/* File Info Sidebar */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-4 text-gray-900">File Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <HardDrive className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Size</p>
                          <p className="font-medium">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Type</p>
                          <p className="font-medium">{file.type}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-4 text-gray-900">Actions</h3>
                    <div className="space-y-3">
                      {file.allowDownload ? (
                        <Button onClick={handleDownload} className="w-full bg-blue-600 hover:bg-blue-700">
                          <Download className="h-4 w-4 mr-2" />
                          Download File
                        </Button>
                      ) : (
                        <Button disabled className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Download Disabled
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Security Notice</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>✓ File scanned for viruses</p>
                      <p>✓ Secure encrypted transfer</p>
                      <p>✓ Access logged for security</p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium mb-1">Powered by CloudStore</p>
                    <p>This file was shared securely using enterprise-grade cloud storage.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
