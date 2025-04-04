import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const verificationData = await request.json()

    // Validate required fields
    if (!verificationData.verificationId) {
      return NextResponse.json({ error: "Verification ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("verification-app")
    const collection = db.collection("verifications")

    // Check if verification already exists
    const existingVerification = await collection.findOne({
      verificationId: verificationData.verificationId,
    })

    if (existingVerification) {
      // Update existing verification
      const updateData = {
        ...verificationData,
        updatedAt: new Date(),
      }

      console.log(
        `Updating verification ${verificationData.verificationId} with status: ${verificationData.status || verificationData.result || "unknown"}`,
      )

      const result = await collection.updateOne(
        { verificationId: verificationData.verificationId },
        { $set: updateData },
      )

      return NextResponse.json({
        success: true,
        message: "Verification updated successfully",
        updated: result.modifiedCount > 0,
        verificationId: verificationData.verificationId,
      })
    } else {
      // Create new verification
      const newVerification = {
        ...verificationData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      console.log(`Creating new verification with ID ${verificationData.verificationId}`)

      const result = await collection.insertOne(newVerification)

      return NextResponse.json({
        success: true,
        message: "Verification created successfully",
        verificationId: result.insertedId,
      })
    }
  } catch (error) {
    console.error("Error in verifications API:", error)
    return NextResponse.json(
      { error: "Failed to save verification data", details: (error as Error).message },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const verificationId = searchParams.get("verificationId")
    const sessionId = searchParams.get("sessionId")

    const client = await clientPromise
    const db = client.db("verification-app")
    const collection = db.collection("verifications")

    if (verificationId) {
      // Get specific verification by ID
      const verification = await collection.findOne({ verificationId })
      if (!verification) {
        return NextResponse.json({ success: false, error: "Verification not found" }, { status: 404 })
      }
      return NextResponse.json({ success: true, verification })
    } else if (sessionId) {
      // Get verifications by session ID (either as target or verifier)
      console.log(`Fetching verifications for session ID: ${sessionId}`)

      const verifications = await collection
        .find({
          $or: [{ targetSessionId: sessionId }, { verifierSessionId: sessionId }],
        })
        .sort({ updatedAt: -1 }) // Sort by most recent first
        .toArray()

      console.log(`Found ${verifications.length} verifications for session ID: ${sessionId}`)

      return NextResponse.json({ success: true, verifications })
    } else {
      // Get all verifications
      const verifications = await collection.find({}).sort({ updatedAt: -1 }).toArray()
      return NextResponse.json({ success: true, verifications })
    }
  } catch (error) {
    console.error("Error in verifications API:", error)
    return NextResponse.json(
      { success: false, error: "Failed to retrieve verification data", details: (error as Error).message },
      { status: 500 },
    )
  }
}

