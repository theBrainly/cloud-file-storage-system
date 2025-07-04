import { MongoClient, type Db, type Collection } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {}

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export async function getDatabase(): Promise<Db> {
  const client = await clientPromise
  return client.db("cloudstore")
}

export async function getUsersCollection(): Promise<Collection> {
  const db = await getDatabase()
  return db.collection("users")
}

export async function getFilesCollection(): Promise<Collection> {
  const db = await getDatabase()
  return db.collection("files")
}

export async function getShareLinksCollection(): Promise<Collection> {
  const db = await getDatabase()
  return db.collection("shareLinks")
}

// Initialize indexes
export async function initializeIndexes() {
  try {
    const usersCollection = await getUsersCollection()
    const filesCollection = await getFilesCollection()
    const shareLinksCollection = await getShareLinksCollection()

    // Users indexes
    await usersCollection.createIndex({ email: 1 }, { unique: true })
    await usersCollection.createIndex({ createdAt: 1 })

    // Files indexes
    await filesCollection.createIndex({ userId: 1 })
    await filesCollection.createIndex({ uploadedAt: -1 })
    await filesCollection.createIndex({ name: "text" })
    await filesCollection.createIndex({ type: 1 })
    await filesCollection.createIndex({ isShared: 1 })

    // Share links indexes
    await shareLinksCollection.createIndex({ fileId: 1 })
    await shareLinksCollection.createIndex({ userId: 1 })
    await shareLinksCollection.createIndex({ expiresAt: 1 })
    await shareLinksCollection.createIndex({ createdAt: 1 })

    console.log("Database indexes initialized successfully")
  } catch (error) {
    console.error("Error initializing database indexes:", error)
  }
}
