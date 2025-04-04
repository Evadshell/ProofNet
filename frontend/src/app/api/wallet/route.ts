  // app/api/wallet/route.ts

  import { NextRequest, NextResponse } from 'next/server';
  import clientPromise from '@/lib/mongodb';

  const COLLECTION_NAME = 'wallets';

  export async function POST(req: NextRequest) {
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection(COLLECTION_NAME);

      const { walletAddress, isVerified } = await req.json();

      if (!walletAddress || typeof isVerified !== 'boolean') {
        return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
      }

      await collection.updateOne(
        { walletAddress },
        { $set: { isVerified } },
        { upsert: true }
      );

      return NextResponse.json({ message: 'Wallet status updated' });
    } catch (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  export async function GET() {
    try {
      const client = await clientPromise;
      const db = client.db();
      const collection = db.collection(COLLECTION_NAME);

      const wallets = await collection.find({}).toArray();
      return NextResponse.json(wallets);
    } catch (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
