import { ObjectId } from "mongodb"
import { getUsersCollection, getFilesCollection, getShareLinksCollection } from "./mongodb"

// Types
export interface User {
  _id?: ObjectId
  id?: string
  email: string
  name: string
  passwordHash: string
  storageUsed: number
  storageLimit: number
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  lastLoginAt?: Date
  emailVerified: boolean
  profilePicture?: string
}

export interface FileRecord {
  _id?: ObjectId
  id?: string
  userId: string
  name: string
  originalName: string
  size: number
  type: string
  s3Key: string
  s3Location: string
  uploadedAt: Date
  lastModified: Date
  lastAccessedAt?: Date
  isShared: boolean
  shareSettings?: {
    shareId: string
    password?: string
    expiresAt?: Date
    allowDownload: boolean
    allowPreview: boolean
  }
  metadata: {
    width?: number
    height?: number
    duration?: number
    thumbnailS3Key?: string
    thumbnailUrl?: string
    checksum?: string
  }
  virusScanStatus: "pending" | "clean" | "infected" | "error"
  tags: string[]
  isDeleted: boolean
  deletedAt?: Date
}

export interface ShareLink {
  _id?: ObjectId
  id?: string
  fileId: string
  userId: string
  password?: string
  expiresAt?: Date
  allowDownload: boolean
  allowPreview: boolean
  accessCount: number
  lastAccessedAt?: Date
  createdAt: Date
  updatedAt: Date
  isActive: boolean
  accessLog: Array<{
    timestamp: Date
    ipAddress?: string
    userAgent?: string
  }>
}

// Helper function to convert MongoDB document to plain object
function convertDocument<T>(doc: any): T {
  if (!doc) return doc

  const converted = { ...doc }
  if (converted._id) {
    converted.id = converted._id.toString()
    delete converted._id
  }
  return converted
}

export const db = {
  users: {
    findByEmail: async (email: string): Promise<User | null> => {
      const collection = await getUsersCollection()
      const user = await collection.findOne({ email: email.toLowerCase(), isActive: true })
      return convertDocument<User>(user)
    },

    findById: async (id: string): Promise<User | null> => {
      const collection = await getUsersCollection()
      const user = await collection.findOne({ _id: new ObjectId(id), isActive: true })
      return convertDocument<User>(user)
    },

    create: async (
      userData: Omit<User, "_id" | "id" | "createdAt" | "updatedAt" | "isActive" | "emailVerified">,
    ): Promise<User> => {
      const collection = await getUsersCollection()
      const now = new Date()

      const user = {
        ...userData,
        email: userData.email.toLowerCase(),
        createdAt: now,
        updatedAt: now,
        isActive: true,
        emailVerified: false,
      }

      const result = await collection.insertOne(user)
      return convertDocument<User>({ ...user, _id: result.insertedId })
    },

    updateStorageUsed: async (userId: string, storageUsed: number): Promise<void> => {
      const collection = await getUsersCollection()
      await collection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: { storageUsed, updatedAt: new Date() },
        },
      )
    },

    updateLastLogin: async (userId: string): Promise<void> => {
      const collection = await getUsersCollection()
      await collection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: { lastLoginAt: new Date(), updatedAt: new Date() },
        },
      )
    },

    update: async (userId: string, updates: Partial<User>): Promise<User | null> => {
      const collection = await getUsersCollection()
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(userId) },
        {
          $set: { ...updates, updatedAt: new Date() },
        },
        { returnDocument: "after" },
      )
      return convertDocument<User>(result.value)
    },

    deactivate: async (userId: string): Promise<boolean> => {
      const collection = await getUsersCollection()
      const result = await collection.updateOne(
        { _id: new ObjectId(userId) },
        {
          $set: { isActive: false, updatedAt: new Date() },
        },
      )
      return result.modifiedCount > 0
    },

    getStats: async (): Promise<{ totalUsers: number; activeUsers: number; newUsersToday: number }> => {
      const collection = await getUsersCollection()
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [totalUsers, activeUsers, newUsersToday] = await Promise.all([
        collection.countDocuments({}),
        collection.countDocuments({ isActive: true }),
        collection.countDocuments({ createdAt: { $gte: today } }),
      ])

      return { totalUsers, activeUsers, newUsersToday }
    },
  },

  files: {
    findByUserId: async (userId: string, limit?: number, skip?: number): Promise<FileRecord[]> => {
      const collection = await getFilesCollection()
      let query = collection.find({ userId, isDeleted: false }).sort({ uploadedAt: -1 })

      if (skip) query = query.skip(skip)
      if (limit) query = query.limit(limit)

      const files = await query.toArray()
      return files.map(convertDocument<FileRecord>)
    },

    findById: async (id: string): Promise<FileRecord | null> => {
      const collection = await getFilesCollection()
      const file = await collection.findOne({ _id: new ObjectId(id), isDeleted: false })
      return convertDocument<FileRecord>(file)
    },

    findByS3Key: async (s3Key: string): Promise<FileRecord | null> => {
      const collection = await getFilesCollection()
      const file = await collection.findOne({ s3Key, isDeleted: false })
      return convertDocument<FileRecord>(file)
    },

    create: async (
      fileData: Omit<FileRecord, "_id" | "id" | "uploadedAt" | "lastModified" | "isDeleted">,
    ): Promise<FileRecord> => {
      const collection = await getFilesCollection()
      const now = new Date()

      const file = {
        ...fileData,
        uploadedAt: now,
        lastModified: now,
        isDeleted: false,
      }

      const result = await collection.insertOne(file)
      return convertDocument<FileRecord>({ ...file, _id: result.insertedId })
    },

    update: async (id: string, updates: Partial<FileRecord>): Promise<FileRecord | null> => {
      const collection = await getFilesCollection()
      const result = await collection.findOneAndUpdate(
        { _id: new ObjectId(id), isDeleted: false },
        {
          $set: { ...updates, lastModified: new Date() },
        },
        { returnDocument: "after" },
      )
      return convertDocument<FileRecord>(result.value)
    },

    delete: async (id: string): Promise<boolean> => {
      const collection = await getFilesCollection()
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: { isDeleted: true, deletedAt: new Date() },
        },
      )
      return result.modifiedCount > 0
    },

    permanentDelete: async (id: string): Promise<boolean> => {
      const collection = await getFilesCollection()
      const result = await collection.deleteOne({ _id: new ObjectId(id) })
      return result.deletedCount > 0
    },

    search: async (userId: string, query: string, limit = 20): Promise<FileRecord[]> => {
      const collection = await getFilesCollection()
      const files = await collection
        .find({
          userId,
          isDeleted: false,
          $or: [{ name: { $regex: query, $options: "i" } }, { tags: { $in: [new RegExp(query, "i")] } }],
        })
        .limit(limit)
        .sort({ uploadedAt: -1 })
        .toArray()

      return files.map(convertDocument<FileRecord>)
    },

    updateAccessTime: async (id: string): Promise<void> => {
      const collection = await getFilesCollection()
      await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: { lastAccessedAt: new Date() },
        },
      )
    },

    getStorageStats: async (
      userId: string,
    ): Promise<{ totalFiles: number; totalSize: number; filesByType: Record<string, number> }> => {
      const collection = await getFilesCollection()

      const [totalStats, typeStats] = await Promise.all([
        collection
          .aggregate([
            { $match: { userId, isDeleted: false } },
            { $group: { _id: null, totalFiles: { $sum: 1 }, totalSize: { $sum: "$size" } } },
          ])
          .toArray(),

        collection
          .aggregate([{ $match: { userId, isDeleted: false } }, { $group: { _id: "$type", count: { $sum: 1 } } }])
          .toArray(),
      ])

      const filesByType: Record<string, number> = {}
      typeStats.forEach((stat) => {
        filesByType[stat._id] = stat.count
      })

      return {
        totalFiles: totalStats[0]?.totalFiles || 0,
        totalSize: totalStats[0]?.totalSize || 0,
        filesByType,
      }
    },

    getRecentFiles: async (userId: string, limit = 10): Promise<FileRecord[]> => {
      const collection = await getFilesCollection()
      const files = await collection.find({ userId, isDeleted: false }).sort({ uploadedAt: -1 }).limit(limit).toArray()

      return files.map(convertDocument<FileRecord>)
    },

    getPopularFiles: async (userId: string, limit = 10): Promise<FileRecord[]> => {
      const collection = await getFilesCollection()
      const files = await collection
        .find({ userId, isDeleted: false, lastAccessedAt: { $exists: true } })
        .sort({ lastAccessedAt: -1 })
        .limit(limit)
        .toArray()

      return files.map(convertDocument<FileRecord>)
    },
  },

  shareLinks: {
    create: async (
      shareData: Omit<ShareLink, "_id" | "id" | "createdAt" | "updatedAt" | "accessCount" | "isActive" | "accessLog">,
    ): Promise<ShareLink> => {
      const collection = await getShareLinksCollection()
      const now = new Date()

      const shareLink = {
        ...shareData,
        accessCount: 0,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        accessLog: [],
      }

      const result = await collection.insertOne(shareLink)
      return convertDocument<ShareLink>({ ...shareLink, _id: result.insertedId })
    },

    findById: async (id: string): Promise<ShareLink | null> => {
      const collection = await getShareLinksCollection()
      const shareLink = await collection.findOne({ _id: new ObjectId(id), isActive: true })
      return convertDocument<ShareLink>(shareLink)
    },

    findByFileId: async (fileId: string): Promise<ShareLink[]> => {
      const collection = await getShareLinksCollection()
      const shareLinks = await collection.find({ fileId, isActive: true }).toArray()
      return shareLinks.map(convertDocument<ShareLink>)
    },

    incrementAccess: async (id: string, ipAddress?: string, userAgent?: string): Promise<void> => {
      const collection = await getShareLinksCollection()
      await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $inc: { accessCount: 1 },
          $set: { lastAccessedAt: new Date(), updatedAt: new Date() },
          $push: {
            accessLog: {
              timestamp: new Date(),
              ipAddress,
              userAgent,
            },
          },
        },
      )
    },

    delete: async (id: string): Promise<boolean> => {
      const collection = await getShareLinksCollection()
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: { isActive: false, updatedAt: new Date() },
        },
      )
      return result.modifiedCount > 0
    },

    deleteExpired: async (): Promise<number> => {
      const collection = await getShareLinksCollection()
      const result = await collection.updateMany(
        {
          expiresAt: { $lt: new Date() },
          isActive: true,
        },
        {
          $set: { isActive: false, updatedAt: new Date() },
        },
      )
      return result.modifiedCount
    },

    findByUserId: async (userId: string): Promise<ShareLink[]> => {
      const collection = await getShareLinksCollection()
      const shareLinks = await collection.find({ userId, isActive: true }).sort({ createdAt: -1 }).toArray()
      return shareLinks.map(convertDocument<ShareLink>)
    },

    getStats: async (userId: string): Promise<{ totalShares: number; totalAccess: number; activeShares: number }> => {
      const collection = await getShareLinksCollection()

      const stats = await collection
        .aggregate([
          { $match: { userId } },
          {
            $group: {
              _id: null,
              totalShares: { $sum: 1 },
              totalAccess: { $sum: "$accessCount" },
              activeShares: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$isActive", true] },
                        {
                          $or: [{ $eq: ["$expiresAt", null] }, { $gt: ["$expiresAt", new Date()] }],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ])
        .toArray()

      const result = stats[0] || { totalShares: 0, totalAccess: 0, activeShares: 0 }
      return result
    },
  },
}

// Initialize database connection and indexes
export async function initializeDatabase() {
  try {
    const { initializeIndexes } = await import("./mongodb")
    await initializeIndexes()
    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Database initialization error:", error)
    throw error
  }
}
