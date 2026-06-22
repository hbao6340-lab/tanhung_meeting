import { RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

const serverUrl = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

if (!serverUrl || !apiKey || !apiSecret) {
  throw new Error(
    `LIVEKIT_URL: ${!!serverUrl}, LIVEKIT_API_KEY: ${!!apiKey}, LIVEKIT_API_SECRET: ${!!apiSecret}`,
  );
}

const roomService = new RoomServiceClient(serverUrl, apiKey, apiSecret);

export async function POST(request: NextRequest) {
  try {
    const { roomName } = await request.json();
    if (!roomName) {
      return NextResponse.json({ error: 'Missing required field: roomName' }, { status: 400 });
    }
    await roomService.deleteRoom(roomName);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
