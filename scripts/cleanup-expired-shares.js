const { MongoClient } = require("mongodb")

async function cleanupExpiredShares() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017"
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db("cloudstore")
    const shareLinksCollection = db.collection("shareLinks")

    const result = await shareLinksCollection.deleteMany({
      expiresAt: { $lt: new Date() },
    })

    console.log(`Cleaned up ${result.deletedCount} expired share links`)
  } catch (error) {
    console.error("Cleanup error:", error)
  } finally {
    await client.close()
  }
}

// Run cleanup
cleanupExpiredShares()
