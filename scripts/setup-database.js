const { MongoClient } = require("mongodb")
const bcrypt = require("bcryptjs")

async function setupDatabase() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017"
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db("cloudstore")

    // Create collections
    await db.createCollection("users")
    await db.createCollection("files")
    await db.createCollection("shareLinks")

    // Create indexes
    const usersCollection = db.collection("users")
    const filesCollection = db.collection("files")
    const shareLinksCollection = db.collection("shareLinks")

    // Users indexes
    await usersCollection.createIndex({ email: 1 }, { unique: true })
    await usersCollection.createIndex({ createdAt: 1 })
    await usersCollection.createIndex({ isActive: 1 })
    await usersCollection.createIndex({ lastLoginAt: 1 })

    // Files indexes
    await filesCollection.createIndex({ userId: 1 })
    await filesCollection.createIndex({ uploadedAt: -1 })
    await filesCollection.createIndex({ name: "text" })
    await filesCollection.createIndex({ type: 1 })
    await filesCollection.createIndex({ isShared: 1 })
    await filesCollection.createIndex({ s3Key: 1 }, { unique: true })
    await filesCollection.createIndex({ isDeleted: 1 })
    await filesCollection.createIndex({ virusScanStatus: 1 })

    // Share links indexes
    await shareLinksCollection.createIndex({ fileId: 1 })
    await shareLinksCollection.createIndex({ userId: 1 })
    await shareLinksCollection.createIndex({ expiresAt: 1 })
    await shareLinksCollection.createIndex({ createdAt: 1 })
    await shareLinksCollection.createIndex({ isActive: 1 })

    console.log("Database setup completed successfully")

    // Check if demo user already exists
    const existingUser = await usersCollection.findOne({ email: "demo@example.com" })

    if (!existingUser) {
      // Create a demo user
      const hashedPassword = await bcrypt.hash("password", 12)

      await usersCollection.insertOne({
        email: "demo@example.com",
        name: "Demo User",
        passwordHash: hashedPassword,
        storageUsed: 0,
        storageLimit: 5 * 1024 * 1024 * 1024, // 5GB
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        emailVerified: false,
      })

      console.log("Demo user created: demo@example.com / password")
    } else {
      console.log("Demo user already exists: demo@example.com / password")
    }

    console.log("\n🎉 Database setup completed successfully!")
    console.log("📧 Demo login: demo@example.com")
    console.log("🔑 Demo password: password")
    console.log("\n🚀 You can now start the application with: npm run dev")
  } catch (error) {
    console.error("Database setup error:", error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

setupDatabase()
