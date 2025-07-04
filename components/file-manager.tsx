"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { FileUpload } from "@/components/file-upload"
import { FilePreview } from "@/components/file-preview"
import { ShareDialog } from "@/components/share-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Cloud,
  Search,
  Upload,
  Download,
  Share2,
  Trash2,
  Eye,
  File,
  ImageIcon,
  Video,
  Music,
  FileText,
  LogOut,
  Grid,
  List,
  User,
  Settings,
} from "lucide-react"

interface FileItem {
  id: string
  name: string
  size: number
  type: string
  uploadedAt: string
  thumbnailUrl?: string
  downloadUrl: string
  isShared: boolean
  virusScanStatus?: string
}

interface UserStats {
  storage: {
    used: number
    limit: number
    percentage: number
  }
  files: {
    total: number
    byType: Record<string, number>
  }
  sharing: {
    totalShares: number
    activeShares: number
  }
}

export function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [shareFile, setShareFile] = useState<FileItem | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showUpload, setShowUpload] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user, logout, refreshUser } = useAuth()
  const { toast } = useToast()
  const hasInitialized = useRef(false)

  // Load initial data once on mount
  useEffect(() => {
    if (hasInitialized.current) return // Prevent multiple initialization
    
    const loadInitialData = async () => {
      try {
        setLoading(true)
        hasInitialized.current = true

        // Load files and stats in parallel
        const [filesResponse, statsResponse] = await Promise.all([fetch("/api/files"), fetch("/api/files/stats")])

        if (filesResponse.ok) {
          const filesData = await filesResponse.json()
          setFiles(
            filesData.files.map((file: any) => ({
              id: file.id,
              name: file.name,
              size: file.size,
              type: file.type,
              uploadedAt: file.uploadedAt,
              downloadUrl: `/api/files/${file.id}/download`,
              thumbnailUrl: file.thumbnailUrl,
              isShared: file.isShared,
              virusScanStatus: file.virusScanStatus,
            })),
          )
        }

        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }

        // User data is already loaded by AuthProvider, no need to refresh here
      } catch (error) {
        console.error("Failed to load data:", error)
        toast({
          title: "Error loading data",
          description: "Please try refreshing the page",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, []) // Empty dependency array - only run once on mount

  // Separate function for reloading data when needed
  const reloadData = useCallback(async () => {
    try {
      // Load files and stats in parallel
      const [filesResponse, statsResponse] = await Promise.all([fetch("/api/files"), fetch("/api/files/stats")])

      if (filesResponse.ok) {
        const filesData = await filesResponse.json()
        setFiles(
          filesData.files.map((file: any) => ({
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: file.uploadedAt,
            downloadUrl: `/api/files/${file.id}/download`,
            thumbnailUrl: file.thumbnailUrl,
            isShared: file.isShared,
            virusScanStatus: file.virusScanStatus,
          })),
        )
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Don't call refreshUser here to avoid infinite loop
      // The user data will be refreshed when needed
    } catch (error) {
      console.error("Failed to reload data:", error)
    }
  }, []) // Empty dependency array

  const filteredFiles = files.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-5 w-5" />
    if (type.startsWith("video/")) return <Video className="h-5 w-5" />
    if (type.startsWith("audio/")) return <Music className="h-5 w-5" />
    if (type.includes("pdf") || type.includes("document")) return <FileText className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  const handleFileUpload = async (newFiles: FileItem[], uploadResult?: any) => {
    setFiles((prev) => [...newFiles, ...prev])
    setShowUpload(false)

    // Reload files and stats data after upload
    await reloadData()
    
    // Refresh user data separately to update storage info
    await refreshUser()

    // Show appropriate toast message
    if (uploadResult?.blockedCount > 0) {
      toast({
        title: "Upload completed with warnings",
        description: `${newFiles.length} file(s) uploaded successfully. ${uploadResult.blockedCount} file(s) were blocked due to security concerns.`,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Files uploaded successfully",
        description: `${newFiles.length} file(s) uploaded to your storage`,
      })
    }
  }

  const handleDownload = async (file: FileItem) => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`)
      if (response.ok) {
        const data = await response.json()

        // Create a temporary link to trigger download
        const link = document.createElement("a")
        link.href = data.downloadUrl
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

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
        description: "Could not download the file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId))

        // Reload files and stats data after deletion
        await reloadData()
        
        // Refresh user data separately to update storage info
        await refreshUser()

        toast({
          title: "File deleted",
          description: "File has been removed from your storage",
        })
      } else {
        throw new Error("Delete failed")
      }
    } catch (error) {
      console.error("Delete failed:", error)
      toast({
        title: "Delete failed",
        description: "Could not delete the file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleShare = (file: FileItem) => {
    setShareFile(file)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CloudStore</h1>
                <p className="text-xs text-gray-500">Secure File Storage</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
              <User className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700 font-medium">{user?.name}</span>
            </div>
            <Button variant="outline" size="sm" className="hidden sm:flex bg-transparent">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user?.name?.split(" ")[0]}!</h2>
          <p className="text-gray-600">Manage your files securely in the cloud</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search your files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
              <Grid className="h-4 w-4" />
              <span className="hidden sm:ml-2 sm:inline">Grid</span>
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
              <span className="hidden sm:ml-2 sm:inline">List</span>
            </Button>
            <Button onClick={() => setShowUpload(true)} className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Files</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.files.total || files.length}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <File className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">Storage Used</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {user ? formatFileSize(user.storageUsed) : "0 Bytes"}
                  </p>
                  {user && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{formatFileSize(user.storageUsed)}</span>
                        <span>{formatFileSize(user.storageLimit)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((user.storageUsed / user.storageLimit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-2 bg-green-100 rounded-lg ml-4">
                  <Cloud className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Shared Files</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.sharing.activeShares || files.filter((f) => f.isShared).length}
                  </p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Share2 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Space</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {user ? formatFileSize(user.storageLimit - user.storageUsed) : "5 GB"}
                  </p>
                  {user && (
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(((user.storageLimit - user.storageUsed) / user.storageLimit) * 100)}% remaining
                    </p>
                  )}
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <div className="h-6 w-6 rounded-full bg-orange-600 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {user ? Math.round((user.storageUsed / user.storageLimit) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Files Section */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <Card key={file.id} className="hover:shadow-lg transition-all duration-200 group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex gap-1">
                      {file.isShared && (
                        <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                          Shared
                        </Badge>
                      )}
                      {file.virusScanStatus === "clean" && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                          Safe
                        </Badge>
                      )}
                      {file.virusScanStatus === "pending" && (
                        <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-200">
                          Scanning
                        </Badge>
                      )}
                    </div>
                  </div>
                  {file.thumbnailUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden">
                      <img
                        src={file.thumbnailUrl || "/placeholder.svg"}
                        alt={file.name}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}
                  <h3 className="font-medium text-sm mb-1 truncate" title={file.name}>
                    {file.name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setSelectedFile(file)} className="flex-1">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDownload(file)} className="flex-1">
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleShare(file)} className="flex-1">
                      <Share2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(file.id)}
                      className="flex-1 hover:bg-red-50 hover:border-red-200"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="p-2 bg-gray-100 rounded-lg">{getFileIcon(file.type)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{file.name}</h3>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {file.isShared && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                            Shared
                          </Badge>
                        )}
                        {file.virusScanStatus === "clean" && (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                            Safe
                          </Badge>
                        )}
                        {file.virusScanStatus === "pending" && (
                          <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-200">
                            Scanning
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button size="sm" variant="outline" onClick={() => setSelectedFile(file)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownload(file)}>
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleShare(file)}>
                        <Share2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(file.id)}
                        className="hover:bg-red-50 hover:border-red-200"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {filteredFiles.length === 0 && (
          <div className="text-center py-16">
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Cloud className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? "No files found" : "No files yet"}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {searchQuery
                ? "Try adjusting your search terms or browse all files"
                : "Upload your first file to get started with CloudStore"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowUpload(true)} size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Upload className="h-5 w-5 mr-2" />
                Upload Your First File
              </Button>
            )}
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {showUpload && <FileUpload onClose={() => setShowUpload(false)} onUpload={handleFileUpload} />}

      {selectedFile && <FilePreview file={selectedFile} onClose={() => setSelectedFile(null)} />}

      {shareFile && (
        <ShareDialog
          file={shareFile}
          onClose={() => setShareFile(null)}
          onShare={(file, settings) => {
            setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, isShared: true } : f)))
            setShareFile(null)
            toast({
              title: "File shared successfully",
              description: "Share link has been generated",
            })
          }}
        />
      )}
    </div>
  )
}
