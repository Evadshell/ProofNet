import { MongoClient, ServerApiVersion } from "mongodb"

// Replace with your MongoDB connection string
const MONGODB_URI = "mongodb+srv://tejas23100:0ZcrerBY3odcIoUV@data.ajawo.mongodb.net/zenlarn?retryWrites=true&w=majority"

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable")
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10, // Maintain up to 10 socket connections
  connectTimeoutMS: 5000, // Give up initial connection after 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI, options)
    globalWithMongo._mongoClientPromise = client.connect().catch((err) => {
      console.error("Failed to connect to MongoDB", err)
      throw err
    })
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(MONGODB_URI, options)
  clientPromise = client.connect().catch((err) => {
    console.error("Failed to connect to MongoDB", err)
    throw err
  })
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise

