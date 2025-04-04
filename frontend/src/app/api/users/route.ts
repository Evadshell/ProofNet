/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Constants
const REQUIRED_VERIFICATIONS = 3 // Number of verifications needed to be fully verified

export async function POST(request: Request) {
  try {
    const userData = await request.json()

    // Validate required fields
    if (!userData.walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("verification-app")
    const collection = db.collection("users")

    // Check if user already exists
    const existingUser = await collection.findOne({
      walletAddress: userData.walletAddress,
    })

    if (existingUser) {
      // Update existing user
      const updateData: any = {
        updatedAt: new Date(),
      }

      // Only update fields that are provided and not undefined
      if (userData.sessionId !== undefined) updateData.sessionId = userData.sessionId
      if (userData.isVerified !== undefined) updateData.isVerified = userData.isVerified
      if (userData.tokens !== undefined) updateData.tokens = userData.tokens

      // Handle verifiedBy array properly
      if (userData.verifiedBy !== undefined) {
        // Ensure we're using the existing array if it exists, or create a new one
        const existingVerifiedBy = existingUser.verifiedBy || []

        // Merge existing and new verifiedBy arrays, removing duplicates
        const combinedVerifiedBy = [
          ...new Set([
            ...existingVerifiedBy,
            ...(Array.isArray(userData.verifiedBy) ? userData.verifiedBy : [userData.verifiedBy]),
          ]),
        ]
        updateData.verifiedBy = combinedVerifiedBy

        // Check if we need to update verification status based on verifiedBy count
        if (combinedVerifiedBy.length >= REQUIRED_VERIFICATIONS) {
          updateData.isVerified = true
          console.log(`User ${userData.walletAddress} is now verified with ${combinedVerifiedBy.length} verifications`)
        }
      }

      if (userData.verifiedUsers !== undefined) {
        // Handle verifiedUsers array properly
        const existingVerifiedUsers = existingUser.verifiedUsers || []
        const combinedVerifiedUsers = [
          ...new Set([
            ...existingVerifiedUsers,
            ...(Array.isArray(userData.verifiedUsers) ? userData.verifiedUsers : [userData.verifiedUsers]),
          ]),
        ]
        updateData.verifiedUsers = combinedVerifiedUsers
      }

      console.log(`Updating user ${userData.walletAddress} with data:`, updateData)

      const result = await collection.updateOne({ walletAddress: userData.walletAddress }, { $set: updateData })

      // Get the updated user to return the latest data
      const updatedUser = await collection.findOne({ walletAddress: userData.walletAddress })

      return NextResponse.json({
        success: true,
        message: "User updated successfully",
        userId: existingUser._id,
        updated: result.modifiedCount > 0,
        isVerified: updatedUser?.isVerified || existingUser.isVerified,
        verifiedBy: updatedUser?.verifiedBy || existingUser.verifiedBy || [],
        tokens: updatedUser?.tokens || existingUser.tokens || 0,
        sessionId: updatedUser?.sessionId || existingUser.sessionId || null,
      })
    } else {
      // Create new user with default values
      const newUser = {
        walletAddress: userData.walletAddress,
        sessionId: userData.sessionId || null,
        isVerified: userData.isVerified || false,
        tokens: userData.tokens || 0,
        verifiedBy: Array.isArray(userData.verifiedBy)
          ? userData.verifiedBy
          : userData.verifiedBy
            ? [userData.verifiedBy]
            : [],
        verifiedUsers: Array.isArray(userData.verifiedUsers)
          ? userData.verifiedUsers
          : userData.verifiedUsers
            ? [userData.verifiedUsers]
            : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Check if we need to update verification status based on verifiedBy count
      if (newUser.verifiedBy.length >= REQUIRED_VERIFICATIONS) {
        newUser.isVerified = true
      }

      console.log(`Creating new user with wallet address ${userData.walletAddress}`)

      const result = await collection.insertOne(newUser)

      return NextResponse.json({
        success: true,
        message: "User created successfully",
        userId: result.insertedId,
        user: newUser,
      })
    }
  } catch (error) {
    console.error("Error in users API:", error)
    return NextResponse.json({ error: "Failed to save user data", details: (error as Error).message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("walletAddress")
    const userId = searchParams.get("userId")
    const sessionId = searchParams.get("sessionId")

    const client = await clientPromise
    const db = client.db("verification-app")
    const collection = db.collection("users")

    if (walletAddress) {
      // Get specific user by wallet address
      const user = await collection.findOne({ walletAddress })
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }
      return NextResponse.json({ success: true, ...user })
    } else if (userId) {
      // Get specific user by ID
      try {
        const user = await collection.findOne({ _id: new ObjectId(userId) })
        if (!user) {
          return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
        }
        return NextResponse.json({ success: true, ...user })
      } catch (error) {
        console.log(error)
        return NextResponse.json({ success: false, error: "Invalid user ID format" }, { status: 400 })
      }
    } else if (sessionId) {
      // Get specific user by session ID
      const user = await collection.findOne({ sessionId })
      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }
      return NextResponse.json({ success: true, ...user })
    } else {
      // Get all users
      const users = await collection.find({}).toArray()
      return NextResponse.json({ success: true, users })
    }
  } catch (error) {
    console.error("Error in users API:", error)
    return NextResponse.json(
      { success: false, error: "Failed to retrieve user data", details: (error as Error).message },
      { status: 500 },
    )
  }
}

